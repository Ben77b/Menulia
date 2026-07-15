# Supabase Storage Setup for Menu Images

This document provides instructions for setting up the Supabase Storage bucket required for menu item image uploads.

## Prerequisites

- A Supabase project with the database schema already applied
- Access to the Supabase dashboard

## Steps to Create the Storage Bucket

1. **Navigate to Storage in Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Click on "Storage" in the left sidebar

2. **Create a New Bucket**
   - Click "New bucket"
   - Name the bucket: `menu-images`
   - Make it a **Public bucket** (this is important for customers to view images on the public menu)
   - Click "Create bucket"

3. **Configure Bucket Policies**
   - After creating the bucket, click on the bucket name
   - Go to "Policies" tab
   - Apply the policies from migration `supabase/migrations/20250716000000_rls_security_refinement.sql`, or run:

   ```sql
   -- Owners upload/update/delete only under {restaurant_id}/ paths they own
   CREATE POLICY "Owners upload menu-images"
   ON storage.objects FOR INSERT TO authenticated
   WITH CHECK (
     bucket_id = 'menu-images'
     AND EXISTS (
       SELECT 1 FROM public.restaurants r
       WHERE r.user_id = auth.uid() AND name LIKE r.id::text || '/%'
     )
   );

   -- Public read by direct object path (bucket listing via API is not granted)
   CREATE POLICY "Public read menu-images by object path"
   ON storage.objects FOR SELECT TO public
   USING (
     bucket_id = 'menu-images'
     AND position('/' in name) > 0
     AND coalesce(storage.extension(name), '') <> ''
   );
   ```

   - Do **not** add a broad `SELECT` policy that allows anonymous bucket listing.
   - Direct public URLs still work because the bucket is public.

4. **Verify Setup**
   - The bucket should now be ready for image uploads
   - Images uploaded to this bucket will be publicly accessible via their public URL

## How It Works

- When a restaurant admin uploads a dish image in the Admin Dashboard:
  1. The image is validated (PNG, JPEG, or WebP, max 5MB)
  2. It's uploaded to the `menu-images` bucket with a unique filename
  3. The public URL is saved to the `image_url` column in the `dishes` table
  4. Customers can view the image on the public menu page

## File Naming Convention

Images are stored with the following naming pattern:
```
{restaurant_id}/{timestamp}-{random}.{extension}
```

This ensures:
- Images are organized by restaurant
- Filenames are unique
- No conflicts between restaurants

## Troubleshooting

**Images not displaying on public menu:**
- Verify the bucket is set to public
- Check that the public read policy is correctly configured
- Ensure the `image_url` column in the database contains the correct public URL

**Upload failing:**
- Check that the authenticated upload policy is configured
- Verify the user is logged in
- Check browser console for specific error messages
