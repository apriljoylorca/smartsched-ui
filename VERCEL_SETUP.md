# Vercel Environment Variable Setup

## Problem
If you see `API_BASE_URL: http://localhost:8080/api` in the console, it means the environment variable is not set in Vercel.

## Solution: Set Environment Variable in Vercel

### Step-by-Step Instructions:

1. **Go to Vercel Dashboard**
   - Navigate to https://vercel.com/dashboard
   - Select your `smartsched-ui` project

2. **Open Settings**
   - Click on your project
   - Go to **Settings** tab
   - Click on **Environment Variables** in the left sidebar

3. **Add New Variable**
   - Click **Add New** button
   - **Name**: `REACT_APP_API_BASE_URL`
   - **Value**: `https://smartsched-backend.onrender.com/api`
   - **Environment**: 
     - ✅ Production
     - ✅ Preview (optional, for preview deployments)
     - ✅ Development (optional, for local development)

4. **Save**
   - Click **Save** button

5. **Redeploy**
   - Go to **Deployments** tab
   - Click the **⋯** (three dots) on the latest deployment
   - Select **Redeploy**
   - Or push a new commit to trigger a new deployment

## Verification

After redeploying, check:
1. Open your deployed app
2. Open browser console (F12)
3. Look for: `API_BASE_URL: https://smartsched-backend.onrender.com/api`
4. Navigate to `/test-connection` to verify connectivity

## Important Notes

- ⚠️ **No trailing slash**: The value should be `https://smartsched-backend.onrender.com/api` (NOT `https://smartsched-backend.onrender.com/api/`)
- ⚠️ **Case sensitive**: The variable name must be exactly `REACT_APP_API_BASE_URL`
- ⚠️ **Redeploy required**: Changes to environment variables require a redeploy to take effect

## Alternative: Using Vercel CLI

If you prefer using the command line:

```bash
vercel env add REACT_APP_API_BASE_URL
# When prompted, enter: https://smartsched-backend.onrender.com/api
# Select environments: production, preview
```

Then redeploy:
```bash
vercel --prod
```

