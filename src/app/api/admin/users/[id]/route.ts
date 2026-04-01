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

    // ========================================
    // Clean up all related data before deleting user
    // Order matters due to FK constraints!
    // ========================================

    // 1. Delete clearance_item_history entries where actor_id = userId
    const { error: historyError } = await supabaseAdmin
      .from("clearance_item_history")
      .delete()
      .eq("actor_id", userId);
    if (historyError) {
      console.error("Error deleting clearance_item_history:", historyError);
    }

    // 2. Get all clearance requests for this student
    const { data: studentRequests } = await supabaseAdmin
      .from("clearance_requests")
      .select("id")
      .eq("student_id", userId);

    if (studentRequests && studentRequests.length > 0) {
      const requestIds = studentRequests.map(r => r.id);

      // 2a. Get all clearance items for these requests
      const { data: clearanceItems } = await supabaseAdmin
        .from("clearance_items")
        .select("id")
        .in("request_id", requestIds);

      if (clearanceItems && clearanceItems.length > 0) {
        const itemIds = clearanceItems.map(i => i.id);

        // 2b. Delete clearance_item_history for these items
        const { error: itemHistoryError } = await supabaseAdmin
          .from("clearance_item_history")
          .delete()
          .in("clearance_item_id", itemIds);
        if (itemHistoryError) {
          console.error("Error deleting item history:", itemHistoryError);
        }

        // 2c. Delete requirement_submissions for these items
        const { error: submissionsError } = await supabaseAdmin
          .from("requirement_submissions")
          .delete()
          .in("clearance_item_id", itemIds);
        if (submissionsError) {
          console.error("Error deleting requirement_submissions:", submissionsError);
        }

        // 2d. Delete clearance_items
        const { error: itemsError } = await supabaseAdmin
          .from("clearance_items")
          .delete()
          .in("request_id", requestIds);
        if (itemsError) {
          console.error("Error deleting clearance_items:", itemsError);
        }
      }

      // 2e. Delete clearance_requests
      const { error: requestsError } = await supabaseAdmin
        .from("clearance_requests")
        .delete()
        .eq("student_id", userId);
      if (requestsError) {
        console.error("Error deleting clearance_requests:", requestsError);
      }
    }

    // 3. Delete requirement_submissions where student_id = userId (orphaned ones)
    const { error: orphanedSubmissionsError } = await supabaseAdmin
      .from("requirement_submissions")
      .delete()
      .eq("student_id", userId);
    if (orphanedSubmissionsError) {
      console.error("Error deleting orphaned submissions:", orphanedSubmissionsError);
    }

    // 4. Delete announcements posted by this user
    const { error: announcementsError } = await supabaseAdmin
      .from("announcements")
      .delete()
      .eq("posted_by_id", userId);
    if (announcementsError) {
      console.error("Error deleting announcements:", announcementsError);
    }

    // 5. Set reviewed_by to NULL for clearance_items reviewed by this user
    const { error: reviewedByError } = await supabaseAdmin
      .from("clearance_items")
      .update({ reviewed_by: null })
      .eq("reviewed_by", userId);
    if (reviewedByError) {
      console.error("Error nulling reviewed_by:", reviewedByError);
    }

    // 6. Remove user from department head positions
    const { error: deptHeadError } = await supabaseAdmin
      .from("departments")
      .update({ head_id: null })
      .eq("head_id", userId);
    if (deptHeadError) {
      console.error("Error removing department head:", deptHeadError);
    }

    // 7. Remove user from office head positions
    const { error: officeHeadError } = await supabaseAdmin
      .from("offices")
      .update({ head_id: null })
      .eq("head_id", userId);
    if (officeHeadError) {
      console.error("Error removing office head:", officeHeadError);
    }

    // 8. Remove user from club adviser positions
    const { error: clubAdviserError } = await supabaseAdmin
      .from("clubs")
      .update({ adviser_id: null })
      .eq("adviser_id", userId);
    if (clubAdviserError) {
      console.error("Error removing club adviser:", clubAdviserError);
    }

    // 9. Remove user from CSG head positions
    const { error: csgHeadError } = await supabaseAdmin
      .from("csg")
      .update({ head_id: null })
      .eq("head_id", userId);
    if (csgHeadError) {
      console.error("Error removing CSG head:", csgHeadError);
    }

    // 10. Remove user from CSPSG head positions
    const { error: cspsgHeadError } = await supabaseAdmin
      .from("cspsg")
      .update({ head_id: null })
      .eq("head_id", userId);
    if (cspsgHeadError) {
      console.error("Error removing CSPSG head:", cspsgHeadError);
    }

    // 11. Remove user from LGU head positions
    const { error: lguHeadError } = await supabaseAdmin
      .from("csg_department_lgus")
      .update({ head_id: null })
      .eq("head_id", userId);
    if (lguHeadError) {
      console.error("Error removing LGU head:", lguHeadError);
    }

    // 12. Remove user from CSPSG Division head positions
    const { error: divisionHeadError } = await supabaseAdmin
      .from("cspsg_divisions")
      .update({ head_id: null })
      .eq("head_id", userId);
    if (divisionHeadError) {
      console.error("Error removing CSPSG Division head:", divisionHeadError);
    }

    // 13. Set updated_by to NULL in system_settings
    const { error: settingsError } = await supabaseAdmin
      .from("system_settings")
      .update({ updated_by: null })
      .eq("updated_by", userId);
    if (settingsError) {
      console.error("Error nulling system_settings updated_by:", settingsError);
    }

    // ========================================
    // Now delete the auth user
    // (this will cascade delete the profile due to FK constraint)
    // ========================================
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
