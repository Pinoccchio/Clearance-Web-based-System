import { supabase } from "./supabase";

// Storage bucket name
const LOGOS_BUCKET = "logos";

// Supported image formats
const SUPPORTED_FORMATS = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"];

// Max file size (2MB)
const MAX_FILE_SIZE = 2 * 1024 * 1024;

/**
 * Validate image file before upload
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!SUPPORTED_FORMATS.includes(file.type)) {
    return {
      valid: false,
      error: "Invalid file format. Supported formats: PNG, JPG, WEBP, SVG",
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: "File size exceeds 2MB limit",
    };
  }

  return { valid: true };
}

/**
 * Generate a unique file path for logo upload
 */
function generateLogoPath(folder: string, entityId: string, fileName: string): string {
  const timestamp = Date.now();
  const extension = fileName.split(".").pop() || "png";
  return `${folder}/${entityId}_${timestamp}.${extension}`;
}

/**
 * Upload a logo image to Supabase Storage
 * @param file - The image file to upload
 * @param folder - The folder within the logos bucket (e.g., "departments", "offices", "clubs")
 * @param entityId - The ID of the entity (department/office/club) for naming
 * @returns The public URL of the uploaded image
 */
export async function uploadLogo(
  file: File,
  folder: string,
  entityId: string
): Promise<string> {
  // Validate file
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Generate unique file path
  const filePath = generateLogoPath(folder, entityId, file.name);

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from(LOGOS_BUCKET)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Failed to upload logo: ${uploadError.message}`);
  }

  // Get public URL
  const { data } = supabase.storage
    .from(LOGOS_BUCKET)
    .getPublicUrl(filePath);

  return data.publicUrl;
}

/**
 * Delete a logo from Supabase Storage
 * @param url - The full public URL of the logo to delete
 */
export async function deleteLogo(url: string): Promise<void> {
  // Extract path from URL
  const path = extractPathFromUrl(url);
  if (!path) {
    console.warn("Could not extract path from logo URL:", url);
    return;
  }

  const { error } = await supabase.storage
    .from(LOGOS_BUCKET)
    .remove([path]);

  if (error) {
    console.error("Failed to delete logo:", error.message);
    // Don't throw - deletion failure shouldn't block other operations
  }
}

/**
 * Extract the storage path from a Supabase Storage public URL
 */
function extractPathFromUrl(url: string): string | null {
  try {
    // URL format: https://{project}.supabase.co/storage/v1/object/public/logos/{path}
    const match = url.match(/\/storage\/v1\/object\/public\/logos\/(.+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Get the public URL for a logo path
 * @param path - The storage path of the logo
 * @returns The public URL
 */
export function getLogoUrl(path: string): string {
  const { data } = supabase.storage
    .from(LOGOS_BUCKET)
    .getPublicUrl(path);

  return data.publicUrl;
}

// Storage bucket name for user avatars
const AVATARS_BUCKET = "avatars";

/**
 * Upload a user avatar image to Supabase Storage
 * @param file - The image file to upload
 * @param userId - The authenticated user's ID
 * @returns The public URL of the uploaded avatar
 */
export async function uploadAvatar(file: File, userId: string): Promise<string> {
  const validation = validateImageFile(file);
  if (!validation.valid) throw new Error(validation.error);

  const timestamp = Date.now();
  const ext = file.name.split(".").pop() || "jpg";
  const filePath = `${userId}/${userId}_${timestamp}.${ext}`;

  const { error } = await supabase.storage
    .from(AVATARS_BUCKET)
    .upload(filePath, file, { cacheControl: "3600", upsert: true });

  if (error) throw new Error(`Failed to upload avatar: ${error.message}`);

  const { data } = supabase.storage.from(AVATARS_BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}

/**
 * Delete a user avatar from Supabase Storage
 * @param url - The full public URL of the avatar to delete
 */
export async function deleteAvatar(url: string): Promise<void> {
  const match = url.match(/\/storage\/v1\/object\/public\/avatars\/(.+)/);
  if (!match) return;
  await supabase.storage.from(AVATARS_BUCKET).remove([match[1]]);
}
