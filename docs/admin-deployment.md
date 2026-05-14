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
  http://localhost:8000/oidc/callback/, https://admin.designer.gosling-lang.org/oidc/callback/
  ```
- **Allowed Logout URLs**:
  ```
  http://localhost:8000/admin/, https://admin.designer.gosling-lang.org/admin/
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

Deployment lives in `cloudformation/admin-back-end.yml`, wired into the parent template as the `AdminBackEnd` nested stack. The admin service shares the VPC, RDS, KMS key, and `AppSecretsArn` with the API; it gets its own ALB (IP-restricted), Route53 record, ECS cluster, and task definition (`SERVICE_VARIANT=admin`).

#### One-time bootstrap per environment

1. **Extend `AppSecretsArn` JSON** to include the admin Django secret + the OIDC credentials. The admin uses a *separate* `admin_secret_key` (distinct from the API's `secret_key`) so a leak of one doesn't compromise admin session cookies / CSRF tokens of the other.

   ```json
   {
     "secret_key": "<api django secret>",
     "admin_secret_key": "<admin django secret>",
     "auth0_admin_client_id": "<from Auth0 step 2>",
     "auth0_admin_client_secret": "<from Auth0 step 2>"
   }
   ```

   Generate the new `admin_secret_key` with:
   ```bash
   python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
   ```

   The admin task definition's `Secrets:` block injects each as an env var (`SECRET_KEY` from `admin_secret_key`, `AUTH0_ADMIN_CLIENT_ID`, `AUTH0_ADMIN_CLIENT_SECRET`).

2. **Create the EC2 managed prefix list** holding the allowed admin source CIDRs. The CIDRs live here (not in CFN, not in SSM) so updates don't require a redeploy:

   ```bash
   aws ec2 create-managed-prefix-list \
     --prefix-list-name cvh-admin-allowed-dev \
     --address-family IPv4 \
     --max-entries 25 \
     --entries Cidr=203.0.113.10/32,Description="Office VPN"
   ```

   The command returns a `PrefixListId` (e.g. `pl-0abc123def456`). Save it to SSM so the CFN template can reference it:

   ```bash
   aws ssm put-parameter \
     --name /cvh/admin/dev/allowed-prefix-list-id \
     --type String \
     --value pl-0abc123def456
   ```

   The parent stack derives this SSM path from the `Environment` parameter: `/cvh/admin/${Environment}/allowed-prefix-list-id`.

3. **Create the admin task's S3 environment file** at `arn:aws:s3:::cvh-env-dev/cvh-env-dev-admin.env` (the default `TaskEnvFile` parameter on the admin stack). At minimum it needs to set `ALLOWED_HOSTS`, `ALLOWED_ORIGINS`, `AUTH0_DOMAIN`, `DB_ENGINE`, `DEBUG` — same shape as the API's env file but with the admin domain in `ALLOWED_HOSTS`/`ALLOWED_ORIGINS`. **Do not** include `SECRET_KEY`, `DB_USER`, `DB_PASSWORD`, `AUTH0_ADMIN_CLIENT_*` (Secrets Manager) or `DB_HOST`, `DB_PORT`, `DB_NAME` (injected by CFN from the database stack outputs).

4. **Update the Auth0 application's Allowed Callback URLs** to include the admin domain:

   ```
   http://localhost:8000/oidc/callback/, https://admin.dev.vis-api.link/oidc/callback/, https://admin.vis-api.link/oidc/callback/
   ```

#### Updating the IP allowlist (no redeploy)

Add an IP:

```bash
aws ec2 modify-managed-prefix-list \
  --prefix-list-id pl-0abc123def456 \
  --current-version <current-version> \
  --add-entries Cidr=198.51.100.7/32,Description="Bob remote"
```

(Get the current version with `aws ec2 describe-managed-prefix-lists --prefix-list-ids pl-0abc123def456 --query 'PrefixLists[0].Version'`.)

Remove an IP:

```bash
aws ec2 modify-managed-prefix-list \
  --prefix-list-id pl-0abc123def456 \
  --current-version <current-version> \
  --remove-entries Cidr=198.51.100.7/32
```

Both take effect on the admin ALB security group within seconds. No CloudFormation update is needed because the SG references the prefix list ID, not its contents.

#### Deploying the stack

After the bootstrap steps above, deploy the parent stack normally — `AdminBackEnd` will create the ECS service, ALB, cert, and Route53 record alongside the existing `BackEnd`. Hitting `https://admin.<your-domain>/admin/` from an allowlisted IP triggers the Auth0 flow.

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
