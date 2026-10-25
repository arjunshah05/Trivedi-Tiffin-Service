# Render and Vercel deployment

## Vercel frontend

Set the Vercel project root directory to `frontend`, with `npm run build` as the build command and `dist` as the output directory. The `frontend/vercel.json` rewrite serves the React app for client-side routes such as `/dashboard` and `/admin`, so refreshing or opening those URLs directly does not return a hosting-platform 404.

Configure `VITE_API_BASE_URL` to the deployed backend API URL in the Vercel project environment variables, then redeploy after changing it.