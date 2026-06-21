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
   - Add the following policy to allow public read access:

   ```sql
   -- Allow public read access to menu-images bucket
   CREATE POLICY "Public read access for menu-images"
   ON storage.objects FOR SELECT
   TO anon
   USING (bucket_id = 'menu-images');
   ```

   - Add the following policy to allow authenticated users to upload:

   ```sql
   -- Allow authenticated users to upload to menu-images bucket
   CREATE POLICY "Authenticated users can upload to menu-images"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (bucket_id = 'menu-images');
   ```

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
