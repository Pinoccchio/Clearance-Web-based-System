import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Create admin client with service role key for privileged operations
function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Create admin client with service role key
    const supabaseAdmin = createAdminClient();

    // Verify the requester is an admin by checking their session
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized: No valid session" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify the token and get the user
    const {
      data: { user: requestingUser },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !requestingUser) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid session" },
        { status: 401 }
      );
    }

    // Check if the requesting user is an admin
    const { data: requestingProfile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", requestingUser.id)
      .single();

    if (profileError || !requestingProfile) {
      return NextResponse.json(
        { error: "Unauthorized: Could not verify user role" },
        { status: 401 }
      );
    }

    if (requestingProfile.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    // Prevent admin from deleting themselves
    if (requestingUser.id === userId) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    // Delete the auth user (this will cascade delete the profile due to FK constraint)
    const { error: deleteError } =
      await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error("Error deleting user:", deleteError);
      return NextResponse.json(
        { error: deleteError.message || "Failed to delete user" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in delete user API:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
