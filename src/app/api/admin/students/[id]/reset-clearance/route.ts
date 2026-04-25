import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

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

function extractSubmissionPath(fileUrl: string): string | null {
  try {
    const trimmed = fileUrl.trim();
    if (!trimmed) return null;

    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      return trimmed;
    }

    const url = new URL(trimmed);
    const signMarker = "/storage/v1/object/sign/submissions/";
    const publicMarker = "/storage/v1/object/public/submissions/";

    let storagePath: string | null = null;

    if (url.pathname.includes(signMarker)) {
      storagePath = url.pathname.split(signMarker)[1] ?? null;
    } else if (url.pathname.includes(publicMarker)) {
      storagePath = url.pathname.split(publicMarker)[1] ?? null;
    }

    return storagePath ? decodeURIComponent(storagePath) : null;
  } catch {
    return null;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: studentId } = await params;

    if (!studentId) {
      return NextResponse.json({ error: "Student ID is required" }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized: No valid session" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const {
      data: { user: requestingUser },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !requestingUser) {
      return NextResponse.json({ error: "Unauthorized: Invalid session" }, { status: 401 });
    }

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

    const { data: targetProfile, error: targetProfileError } = await supabaseAdmin
      .from("profiles")
      .select("id, role, first_name, last_name")
      .eq("id", studentId)
      .single();

    if (targetProfileError || !targetProfile) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    if (targetProfile.role !== "student") {
      return NextResponse.json(
        { error: "Only student accounts can be reset with this action" },
        { status: 400 }
      );
    }

    const { data: studentRequests, error: requestsError } = await supabaseAdmin
      .from("clearance_requests")
      .select("id")
      .eq("student_id", studentId);

    if (requestsError) {
      throw requestsError;
    }

    const requestIds = (studentRequests ?? []).map((request) => request.id);
    let clearanceItems: { id: string }[] = [];

    if (requestIds.length > 0) {
      const { data: items, error: itemsError } = await supabaseAdmin
        .from("clearance_items")
        .select("id")
        .in("request_id", requestIds);

      if (itemsError) {
        throw itemsError;
      }

      clearanceItems = items ?? [];
    }

    const { data: requirementSubmissions, error: submissionsError } = await supabaseAdmin
      .from("requirement_submissions")
      .select("id, file_urls")
      .eq("student_id", studentId);

    if (submissionsError) {
      throw submissionsError;
    }

    const submissionPaths = Array.from(
      new Set(
        (requirementSubmissions ?? [])
          .flatMap((submission) => submission.file_urls ?? [])
          .map(extractSubmissionPath)
          .filter((path): path is string => Boolean(path))
      )
    );

    let deletedSubmissionFiles = 0;
    if (submissionPaths.length > 0) {
      const { error: storageError } = await supabaseAdmin.storage
        .from("submissions")
        .remove(submissionPaths);

      if (storageError) {
        throw new Error(`Failed to delete submission files: ${storageError.message}`);
      }

      deletedSubmissionFiles = submissionPaths.length;
    }

    const { error: attendanceError } = await supabaseAdmin
      .from("attendance_records")
      .delete()
      .eq("student_id", studentId);

    if (attendanceError) {
      throw attendanceError;
    }

    const itemIds = clearanceItems.map((item) => item.id);
    const submissionIds = (requirementSubmissions ?? []).map((submission) => submission.id);

    if (itemIds.length > 0) {
      const { error: historyError } = await supabaseAdmin
        .from("clearance_item_history")
        .delete()
        .in("clearance_item_id", itemIds);

      if (historyError) {
        throw historyError;
      }
    }

    if (submissionIds.length > 0) {
      const { error: submissionsDeleteError } = await supabaseAdmin
        .from("requirement_submissions")
        .delete()
        .in("id", submissionIds);

      if (submissionsDeleteError) {
        throw submissionsDeleteError;
      }
    }

    if (itemIds.length > 0) {
      const { error: itemsDeleteError } = await supabaseAdmin
        .from("clearance_items")
        .delete()
        .in("id", itemIds);

      if (itemsDeleteError) {
        throw itemsDeleteError;
      }
    }

    if (requestIds.length > 0) {
      const { error: requestsDeleteError } = await supabaseAdmin
        .from("clearance_requests")
        .delete()
        .in("id", requestIds);

      if (requestsDeleteError) {
        throw requestsDeleteError;
      }
    }

    return NextResponse.json({
      success: true,
      student: {
        id: targetProfile.id,
        name: `${targetProfile.first_name} ${targetProfile.last_name}`,
      },
      counts: {
        clearanceRequests: requestIds.length,
        clearanceItems: itemIds.length,
        requirementSubmissions: submissionIds.length,
        submissionFiles: deletedSubmissionFiles,
      },
    });
  } catch (error) {
    console.error("Error resetting student clearance:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
