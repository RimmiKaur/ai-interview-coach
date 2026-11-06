# AI Interview Coach frontend

This Next.js app reads the backend base URL from `NEXT_PUBLIC_API_BASE_URL`.

For local development in PowerShell:

```powershell
if (!(Test-Path .env.local)) { Copy-Item .env.local.example .env.local }
npm.cmd install
npm.cmd run dev
```

For Vercel, set `NEXT_PUBLIC_API_BASE_URL` to the deployed Render service URL. See the repository's `DEPLOYMENT.md` for hosting settings.
