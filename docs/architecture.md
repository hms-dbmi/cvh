# Architecture

High-level view of CVH's runtime topology.

```mermaid
flowchart LR
    User[Users]
    Admin[Admins<br/>restricted CIDR]
    PyDev[Python-client<br/>developers]
    Auth0[(Auth0)]
    CFDB[(cfdb<br/>data + index<br/>artifact service)]

    subgraph AWS
        subgraph Frontend
            CFSite[CloudFront]
            S3Site[S3 · SPA]
            CFAssets[CloudFront]
            S3Assets[S3 · landing images]
        end

        subgraph Backend
            ALB[Public ALB]
            API_ECS[ECS Fargate<br/>Django Ninja API]
            AdminALB[Admin ALB]
            Admin_ECS[ECS Fargate<br/>Django admin<br/>SERVICE_VARIANT=admin]
        end

        RDS[(RDS · Postgres 17)]
        Secrets[Secrets Manager]
    end

    User -->|HTML/JS/CSS| CFSite --> S3Site
    User -->|landing images| CFAssets --> S3Assets
    User -->|"/api/*  (JWT)"| ALB --> API_ECS
    User -->|dataset artifacts| CFDB
    PyDev -->|cvh-client library| ALB
    Admin --> AdminALB --> Admin_ECS

    API_ECS --> RDS
    Admin_ECS --> RDS
    API_ECS -.creds.-> Secrets
    Admin_ECS -.creds.-> Secrets
    API_ECS -->|dispatch + readiness| CFDB

    User -.SPA login.-> Auth0
    Admin -.SPA login.-> Auth0
    PyDev -.device flow.-> Auth0
    API_ECS -.JWKS verify.-> Auth0
```

## Notes

- The frontend bundles `gosling-designer-vec` and `vitessce` at build time — they are npm dependencies, not runtime services.
- Both ECS services run the *same* Docker image; only the `SERVICE_VARIANT` env var differs. See [`admin-deployment.md`](./admin-deployment.md) for the admin variant setup.
- The `cvh-client` Python package (published to PyPI) hits the same `/api/*` endpoints as the browser SPA.
- **cfdb** is an external artifact service run by the CFDE program. The backend dispatches processing jobs and probes readiness (`GET /{data,index}/{dcc}/{id}[/status]`); the browser fetches processed dataset artifacts directly. See `backend/core/api/cfdb.py` and `backend/core/api/dccs.py` for the supported DCC list. Dataset URLs may also point to S3 or arbitrary HTTP hosts — cfdb is one of several sources.
- The AWS infrastructure is maintained separately.

