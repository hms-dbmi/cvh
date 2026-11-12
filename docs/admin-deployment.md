# Admin Service Deployment

The Django admin runs as a separate ECS service from the public API, sharing the same code/image but exposing only `/admin/` and the OIDC auth flow. Access is layered: ALB security group restricts traffic by IP, and a custom OIDC backend gates Django login on an `cvh_admin` Auth0 role.

The same image runs in two services, switched via the `SERVICE_VARIANT` env var (`api` or `admin`).

## Auth0 Setup

You need a separate Auth0 application for the admin service (the existing SPA app is for the frontend). Total time ~10 minutes.

### 1. Create a Regular Web Application

Auth0 dashboard → Applications → Applications → **Create Application**

- **Name**: `CVH Admin` (or similar)
- **Type**: **Regular Web Application** — *not* Single Page. The admin uses server-side code-for-token exchange.

Skip the "Quick Start" prompts.

### 2. Configure URLs

On the new app's **Settings** tab:

- **Allowed Callback URLs**:
  ```
  http://localhost:8000/oidc/callback/, https://admin.dev.visualizationhub.org/oidc/callback/, https://admin.visualizationhub.org/oidc/callback/
  ```
- **Allowed Logout URLs**:
  ```
  http://localhost:8000/admin/, https://admin.dev.visualizationhub.org/admin/, https://admin.visualizationhub.org/admin/
  ```
- Leave **Allowed Web Origins** blank.

Save. Copy these values out of the page for the Django config:

- **Domain** (e.g. `<your-tenant>.us.auth0.com`) → reuse the existing `AUTH0_DOMAIN`.
- **Client ID** → `AUTH0_ADMIN_CLIENT_ID`.
- **Client Secret** → `AUTH0_ADMIN_CLIENT_SECRET` (`.env` locally; Secrets Manager in prod).

### 3. Create a Post-Login Action

Actions → Library → **Create Action** → "Build from scratch"

- **Name**: `Add cvh roles claim`
- **Trigger**: **Login / Post Login**
- **Code**:

  ```javascript
  exports.onExecutePostLogin = async (event, api) => {
    const namespace = "https://cvh/";
    const roles =
      (event.user.app_metadata && event.user.app_metadata.roles) || [];
    api.idToken.setCustomClaim(`${namespace}roles`, roles);
  };
  ```

Click **Deploy**, then go to Actions → **Triggers** → `post-login`, drag the new action into the flow, click **Apply**.

### 4. Grant a User the Admin Role

User Management → Users → pick the user → **Details** tab → scroll to **app_metadata** → set:

```json
{
  "roles": ["cvh_admin"]
}
```

Save. Repeat for any other admins. To revoke, remove `cvh_admin` from the array — the next login will fail with 401, and re-login refreshes Django's `is_staff` / `is_superuser` flags too.

## Django Configuration

### Local development

Add to `backend/core/.env`:

```
AUTH0_ADMIN_CLIENT_ID=<from Auth0 step 2>
AUTH0_ADMIN_CLIENT_SECRET=<from Auth0 step 2>
SERVICE_VARIANT=admin
```

Then:

```bash
cd backend/core
python manage.py runserver
```

Hit `http://localhost:8000/admin/` → bounced to Auth0 → back as a Django superuser.

### Production (ECS)

The admin runs as its own ECS service with an IP-restricted load balancer, sharing the API's database and image. The client ID and secret come from Secrets Manager, and the admin gets its own Django `SECRET_KEY`, separate from the API's. AWS setup, including the IP allowlist, is maintained separately.

## Customizing the Role / Claim

Defaults match the Auth0 setup above:

- Claim: `https://cvh/roles`
- Role name: `cvh_admin`

Override either via env vars (`OIDC_ADMIN_ROLE_CLAIM`, `OIDC_ADMIN_ROLE_NAME`) if you migrate to Auth0's first-class RBAC roles or a different namespace later.

## How Login Fails Closed

- `core/oidc_backend.py:Auth0AdminOIDCBackend.verify_claims` rejects any user whose ID token doesn't contain `cvh_admin` in the roles claim. No Django user is created.
- `core/urls_admin.py` intercepts `admin/login/` and redirects to `/oidc/authenticate/`, so the username/password form is never reachable.
- Existing Django users created via Auth0 have their `is_staff` / `is_superuser` flags re-synced on every login (`update_user`), so revoking the Auth0 role takes effect on the next sign-in.

For break-glass when Auth0 is unreachable, use ECS Exec to drop into the running container and run `python manage.py shell` directly — there is intentionally no local password fallback.
