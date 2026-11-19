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

## YAC Access Requests

People ask for AI access (YAC) from their profile page (`POST /api/yac/access`), and an admin decides in **Django admin → YAC access requests**:

- **Approve** adds the `yac_user` role to the person in Auth0, through the Management API, then records the decision. If Auth0 refuses or can't be reached, the request stays pending and the admin sees why.
- **Decline** records the decision with no Auth0 call.
- **Revoke** removes the role in Auth0, then marks the request revoked. A YAC token they already hold keeps working until it expires, within an hour (the YAC API's token lifetime); their monthly budget still applies meanwhile.

Each person can ask once. Declined and revoked people see "Contact Us" (hidive@hms.harvard.edu); to let them back in, **Approve** their existing request. Access lasts until it's revoked; there's no expiry. Any Django admin (`cvh_admin` role) can run these actions: John approves, with one or two other admins as backups.

**Status** can only change through these actions, so Django never shows someone as approved without the role. Auth0 is what enforces access: YAC refuses tokens to anyone without the role.

### One-time setup per environment

1. **Machine-to-machine app:** in the environment's Auth0 tenant, Applications → Create Application → Machine to Machine, for example "CVH admin (Management API)". Authorize it for the **Auth0 Management API** with only the scopes for assigning and removing a user's roles (`create:role_members` and `delete:role_members`; check them against Auth0's docs for `POST` and `DELETE /api/v2/users/{id}/roles`).
2. **Settings:** give the admin service `AUTH0_MGMT_CLIENT_ID` and `AUTH0_MGMT_CLIENT_SECRET` (from step 1) and `YAC_AUTH0_ROLE_ID` (the `yac_user` role's ID, `rol_…`, on its page under User Management → Roles). Locally, put them in `backend/core/.env`. Until they're set, Approve and Revoke show which one is missing and leave the request unchanged.
3. **Custom domain:** if `AUTH0_DOMAIN` is a custom sign-in domain, also set `AUTH0_MGMT_DOMAIN` to the tenant's own domain, `https://<tenant>.us.auth0.com/` (Settings → General → Domain). The Management API doesn't answer on custom domains; without it, Approve fails with "Service not enabled within domain".
