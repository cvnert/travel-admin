# Admin Deployment

The admin frontend is deployed by GitHub Actions on pushes to `main`.

## Required GitHub Secrets

Set these in GitHub repository settings: `Settings` -> `Secrets and variables` -> `Actions`.

| Secret | Value |
| --- | --- |
| `SERVER_HOST` | `101.35.131.94` |
| `SERVER_USER` | `ubuntu` |
| `SERVER_PASSWORD` | server SSH password |
| `DEPLOY_PATH` | `/var/www/travel-admin` |
| `VITE_API_BASE_URL` | leave empty when Nginx proxies `/api` and `/uploads` |

## What the workflow does

1. Installs dependencies with `npm ci`.
2. Builds the Vite app with `npm run build`.
3. Uploads `dist` to the server.
4. Publishes static files to `/var/www/travel-admin`.
5. Configures Nginx for SPA routing and proxies `/api` and `/uploads` to `http://127.0.0.1:8080`.

After deployment, open `http://101.35.131.94`.
