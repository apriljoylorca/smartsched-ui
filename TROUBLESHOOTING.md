# Troubleshooting Guide - UI to API Connection

## Quick Diagnosis

1. **Open the Connection Test Page**: Navigate to `/test-connection` in your app
2. **Check Browser Console**: Open Developer Tools (F12) and look for:
   - `=== API CONFIGURATION ===` - Shows the API URL being used
   - `=== API ERROR ===` - Shows detailed error information

## Common Issues

### Issue 1: API URL Not Set Correctly

**Symptoms:**
- Console shows `API_BASE_URL: http://localhost:8080/api` when deployed
- Network errors in browser console

**Solution:**
- For **Vercel**: Set environment variable `REACT_APP_API_BASE_URL` to `https://smartsched-backend.onrender.com/api`
- Make sure there's NO trailing slash
- After setting, redeploy the application

### Issue 2: CORS Errors

**Symptoms:**
- Browser console shows: `Access to XMLHttpRequest has been blocked by CORS policy`
- Network tab shows OPTIONS request failing

**Solution:**
- Verify backend CORS configuration includes your Vercel domain
- Check that `CORS_ALLOWED_ORIGINS` in backend includes: `https://smartsched-client.vercel.app`
- Make sure there's NO trailing slash in the CORS origin

### Issue 3: Network Error (ERR_NETWORK)

**Symptoms:**
- Console shows: `Network Error - Could not reach API`
- All API requests fail

**Solution:**
- Verify API is running: Check `https://smartsched-backend.onrender.com/api/health`
- Check if API URL is correct in environment variables
- Verify API is not down (check Render dashboard)

### Issue 4: 404 Not Found

**Symptoms:**
- API requests return 404
- Console shows wrong URL

**Solution:**
- Check API_BASE_URL construction - should end with `/api`
- Verify endpoint paths are correct (e.g., `/api/auth/login`)
- Check backend routes match frontend expectations

## Testing Steps

1. **Test Health Endpoint**:
   ```
   https://smartsched-backend.onrender.com/api/health
   ```
   Should return JSON with status and MongoDB connection info

2. **Test from Browser Console**:
   ```javascript
   fetch('https://smartsched-backend.onrender.com/api/health')
     .then(r => r.json())
     .then(console.log)
     .catch(console.error)
   ```

3. **Check Environment Variables**:
   - In Vercel: Settings → Environment Variables
   - Should have: `REACT_APP_API_BASE_URL` = `https://smartsched-backend.onrender.com/api`

## Debugging Checklist

- [ ] API is running (check Render dashboard)
- [ ] Health endpoint is accessible
- [ ] Environment variable is set in Vercel
- [ ] No trailing slashes in URLs
- [ ] CORS is configured correctly
- [ ] Browser console shows correct API_BASE_URL
- [ ] Network tab shows actual request URLs

## Connection Test Component

The `/test-connection` route provides automated testing of:
- API URL configuration
- Health endpoint connectivity
- CORS configuration
- Auth endpoint accessibility

Use this to quickly diagnose connection issues.

