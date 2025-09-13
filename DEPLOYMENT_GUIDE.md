# Supabase Edge Function Deployment Guide

## Method 1: Using Supabase Dashboard (Recommended)

### Step 1: Access Supabase Dashboard
1. Go to: https://supabase.com/dashboard/project/pbndydilyqxqmcxwadvy/functions
2. Log in with your Supabase credentials

### Step 2: Create/Update Function
1. Click "Create Function" or find existing "generate-image" function
2. Set function name: `generate-image`
3. Copy the entire contents from: `supabase/functions/generate-image/index.ts`
4. Paste into the function editor
5. Click "Deploy Function"

### Step 3: Verify Deployment
1. Check the function appears in the functions list
2. Test the function using the test tab in dashboard
3. Monitor logs for any deployment issues

## Method 2: Install Supabase CLI

### Windows Installation:
```powershell
# Option 1: Using Scoop (if available)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Option 2: Direct download
# Download from: https://github.com/supabase/cli/releases
# Extract and add to PATH

# Option 3: Using NPX (local installation)
npx supabase@latest login
npx supabase@latest link --project-ref pbndydilyqxqmcxwadvy
npx supabase@latest functions deploy generate-image
```

## Method 3: Verify Function Status

### Test Function Locally:
```bash
cd "d:\Obrix Labs\ninodemo"
node test-function.js
```

### Expected Results:
- ✅ 200 Success: Function is working
- ❌ 401 Unauthorized: User not logged in (login required)
- ❌ 503 Service Unavailable: Function not deployed
- ❌ 404 Not Found: Function doesn't exist

## Current Status
- ✅ Function code is syntactically valid
- ✅ CORS headers configured
- ✅ Authentication implemented
- ✅ Error handling in place
- ✅ Frontend hook updated
- 🔄 Function deployment needed

## Next Steps
1. Deploy the function using Method 1 (Dashboard) or Method 2 (CLI)
2. Test authentication flow in the app
3. Test image generation in Enhance section
4. Monitor function logs for any issues

## Troubleshooting

### If you get 401 Unauthorized:
- Ensure user is logged in to the app
- Check that JWT token is being passed correctly
- Verify in Network tab of browser dev tools

### If you get 503 Service Unavailable:
- Function is not deployed
- Use Dashboard method to deploy
- Check function logs in Supabase dashboard

### If function works but images don't load:
- Check CORS configuration
- Verify image URLs are valid
- Check browser console for errors
