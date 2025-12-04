# Supabase Setup Guide

This guide will help you set up Supabase for cross-device authentication in your Maish Sale Sync app.

## Architecture Note

**No separate backend server needed!** This app uses Supabase as a backend-as-a-service, so you only need to deploy the frontend to Netlify. Supabase handles all server-side functionality (database, authentication, file storage).

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up for an account
2. Click "New Project"
3. Fill in your project details:
   - Name: `maish-sale-sync`
   - Database Password: Choose a strong password
   - Region: Select the closest region to your users
4. Click "Create new project"

## Step 2: Get Your Project Credentials

1. In your Supabase dashboard, go to Settings → API
2. Copy the following values:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **anon/public key**: The `anon public` key

## Step 3: Configure Environment Variables

1. Open the `.env` file in your project root
2. Replace the placeholder values:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Step 4: Run Database Migrations

**Option A: Via Supabase Dashboard (Recommended)**
1. In your Supabase dashboard, go to the SQL Editor
2. Copy and paste the contents of `supabase/migrations/20250103000000_initial_schema.sql`
3. Click "Run" to create the database tables

**Option B: Via Supabase CLI (Advanced)**
```bash
npx supabase link --project-ref xezwwqisgcccxrvzmzqq
npx supabase db push
```

## Step 5: Set Up Storage Buckets

1. In your Supabase dashboard, go to Storage
2. Create two buckets:
   - **avatars** (for user profile pictures)
   - **receipts** (for sale receipt images)

3. For each bucket:
   - Go to bucket settings
   - Under "Policies", add a policy to allow authenticated users to upload:
     ```sql
     -- Allow authenticated users to upload files
     CREATE POLICY "Users can upload their own files" ON storage.objects
     FOR INSERT WITH CHECK (auth.uid()::text = (storage.foldername(name))[1]);
     ```

     ```sql
     -- Allow users to view their own files
     CREATE POLICY "Users can view their own files" ON storage.objects
     FOR SELECT USING (auth.uid()::text = (storage.foldername(name))[1]);
     ```

## Step 6: Test the Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Try creating a new account and logging in
3. Verify that data persists across browser sessions
4. Test logging in from a different device/browser (incognito mode works for testing)

## Step 7: Migrate Existing Data (Optional)

If you have existing users with local data:

1. After logging in with Supabase, the app will detect local data
2. You'll be prompted to migrate existing sales and avatar data
3. Click "Migrate Data" to transfer your local data to Supabase

## Troubleshooting

### Authentication Issues
- Verify your `.env` variables are correct
- Check the browser console for error messages
- Ensure the database tables were created successfully

### Storage Issues
- Check that storage buckets exist and have correct policies
- Verify bucket names match the code (`avatars`, `receipts`)

### Migration Issues
- Local data migration only works once per user
- If migration fails, check browser console for errors

## Security Notes

- Never commit your `.env` file to version control
- The `anon` key is safe to use in client-side code
- Row Level Security (RLS) is enabled to ensure users can only access their own data

## Step 8: Deploy to Netlify

Since this is a **frontend-only app** with Supabase backend:

1. **Build the app**:
   ```bash
   npm run build
   ```

2. **Deploy to Netlify**:
   - Connect your GitHub repository to Netlify
   - Set build command: `npm run build`
   - Publish directory: `dist`
   - Add environment variables in Netlify dashboard:
     - `VITE_SUPABASE_URL=https://xezwwqisgcccxrvzmzqq.supabase.co`
     - `VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

3. **Your app will be live!** 🎉

## Next Steps

Once setup is complete:
- ✅ Users can sign up and log in from any device
- ✅ Sales data syncs across all devices
- ✅ Profile pictures and receipt images are stored securely
- ✅ Data persists even if the user clears their browser data

## Testing Cross-Device Authentication

1. **Device A**: Sign up with username/password
2. **Device B**: Log in with same credentials
3. **Verify**: Sales data appears on both devices instantly

The original issue is now **completely solved**! 🚀