"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRealtimeRefresh } from "@/lib/useRealtimeRefresh";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";
import { useToast } from "@/components/ui/Toast";
import {
  Search,
  RefreshCw,
  Users,
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
  MinusCircle,
  Eye,
  X,
} from "lucide-react";
import { StudentClearanceProgressModal } from "@/components/features/StudentClearanceProgressModal";
import {
  Club,
  Profile,
  ClearanceRequest,
  ClearanceItem,
  getClubByAdviserId,
  getMembersByClub,
  getClearanceRequestsByStudentIds,
  getClearanceItemsBySourceAndRequests,
} from "@/lib/supabase";
import { formatDate } from "@/lib/utils";

type ClearanceStatus = "completed" | "in_progress" | "pending" | "none";
type ItemStatus = "pending" | "submitted" | "approved" | "rejected" | "on_hold" | null;

interface MemberWithClearance extends Profile {
  latestRequest: ClearanceRequest | null;
  clubItem: ClearanceItem | null;
  clearanceStatus: ClearanceStatus;
  clubStatus: ItemStatus;
}

/**
 * Derive overall clearance status from the request (not the club item).
 */
function deriveOverallStatus(request: ClearanceRequest | null): ClearanceStatus {
  if (!request) return "none";
  return request.status as ClearanceStatus;
}

/**
 * Derive club-specific item status.
 */
function deriveClubStatus(item: ClearanceItem | null): ItemStatus {
  if (!item) return null;
  return item.status as ItemStatus;
}

function ClearanceBadge({ status }: { status: ClearanceStatus }) {
  switch (status) {
    case "completed":
      return (
        <Badge variant="approved" size="sm">
          <CheckCircle className="w-3 h-3" />
          Completed
        </Badge>
      );
    case "in_progress":
      return (
        <Badge variant="pending" size="sm">
          <Clock className="w-3 h-3" />
          In Progress
        </Badge>
      );
    case "pending":
      return (
        <Badge variant="neutral" size="sm">
          <Clock className="w-3 h-3" />
          Pending
        </Badge>
      );
    default:
      return (
        <Badge variant="neutral" size="sm">
          <MinusCircle className="w-3 h-3" />
          No Request
        </Badge>
      );
  }
}

function ClubStatusBadge({ status }: { status: ItemStatus }) {
  switch (status) {
    case "approved":
      return (
        <Badge variant="approved" size="sm">
          <CheckCircle className="w-3 h-3" />
          Approved
        </Badge>
      );
    case "submitted":
      return (
        <Badge variant="pending" size="sm">
          <Clock className="w-3 h-3" />
          Submitted
        </Badge>
      );
    case "pending":
      return (
        <Badge variant="neutral" size="sm">
          <Clock className="w-3 h-3" />
          Not Started
        </Badge>
      );
    case "rejected":
      return (
        <Badge variant="rejected" size="sm">
          <XCircle className="w-3 h-3" />
          Rejected
        </Badge>
      );
    case "on_hold":
      return (
        <Badge variant="warning" size="sm">
          <Clock className="w-3 h-3" />
          On Hold
        </Badge>
      );
    default:
      return <span className="text-sm text-gray-400">—</span>;
  }
}

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "completed", label: "Completed" },
  { value: "in_progress", label: "In Progress" },
  { value: "pending", label: "Pending" },
  { value: "none", label: "No Request" },
];

export default function ClubMembersPage() {
  const { profile } = useAuth();
  const { showToast } = useToast();

  const [club, setClub] = useState<Club | null>(null);
  const [members, setMembers] = useState<MemberWithClearance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<MemberWithClearance | null>(null);

  const loadData = useCallback(async () => {
    if (!profile?.id) return;

    setIsLoading(true);
    try {
      // 1. Find this user's club
      const clubData = await getClubByAdviserId(profile.id);
      if (!clubData) {
        setClub(null);
        setMembers([]);
        return;
      }
      setClub(clubData);

      // 2. Fetch members enrolled in this club (enrolled_clubs stores club IDs)
      const memberProfiles = await getMembersByClub(clubData.id);

      if (memberProfiles.length === 0) {
        setMembers([]);
        return;
      }

      // 3. Fetch their clearance requests
      const memberIds = memberProfiles.map((m) => m.id);
      const requests = await getClearanceRequestsByStudentIds(memberIds);

      // 4. Map: pick latest request per member (requests already ordered DESC)
      const latestByMember = new Map<string, ClearanceRequest>();
      for (const req of requests) {
        if (!latestByMember.has(req.student_id)) {
          latestByMember.set(req.student_id, req);
        }
      }

      // 5. Fetch club-specific clearance items for these requests
      const requestIds = requests.map((r) => r.id);
      const clubItems = await getClearanceItemsBySourceAndRequests('club', clubData.id, requestIds);

      // Map items by request_id for quick lookup
      const itemByRequest = new Map<string, ClearanceItem>();
      for (const item of clubItems) {
        itemByRequest.set(item.request_id, item);
      }

      // 6. Build MemberWithClearance[] using overall request status + club item status
      const enriched: MemberWithClearance[] = memberProfiles.map((m) => {
        const latestRequest = latestByMember.get(m.id) ?? null;
        const clubItem = latestRequest ? itemByRequest.get(latestRequest.id) ?? null : null;
        return {
          ...m,
          latestRequest,
          clubItem,
          clearanceStatus: deriveOverallStatus(latestRequest),
          clubStatus: deriveClubStatus(clubItem),
        };
      });

      setMembers(enriched);
    } catch (err) {
      console.error("Error loading club members:", err);
      showToast("error", "Load Failed", "Could not load members. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [profile?.id, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useRealtimeRefresh('clearance_requests', loadData);

  // --- Computed stats ---
  const totalCount = members.length;
  const completedCount = members.filter((m) => m.clearanceStatus === "completed").length;
  const inProgressCount = members.filter((m) => m.clearanceStatus === "in_progress").length;
  const pendingCount = members.filter((m) => m.clearanceStatus === "pending").length;
  const noRequestCount = members.filter((m) => m.clearanceStatus === "none").length;

  // --- Filtered list ---
  const filtered = members.filter((m) => {
    const fullName = `${m.first_name} ${m.last_name}`.toLowerCase();
    const studentId = (m.student_id ?? "").toLowerCase();
    const matchesSearch =
      fullName.includes(searchQuery.toLowerCase()) ||
      studentId.includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || m.clearanceStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const typeLabel = (type: string | undefined) => {
    if (!type) return "—";
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <div className="min-h-screen bg-surface-warm">
      <header className="bg-white border-b border-border-warm">
        <div className="px-6 py-5">
          <div className="flex items-center gap-2 text-sm text-warm-muted mb-1">
            <span>Club{club ? `: ${club.name}` : ""}</span>
            {club?.type && (
              <Badge variant={club.type === "academic" ? "info" : "warning"} size="sm">
                {club.type === "academic" ? "Academic" : "Non-Academic"}
              </Badge>
            )}
          </div>
          <h1 className="text-2xl font-display font-bold text-cjc-navy">Members</h1>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <Card padding="sm" className="text-center">
            <p className="text-2xl font-bold text-cjc-navy">
              {isLoading ? "..." : totalCount}
            </p>
            <p className="text-sm text-gray-500">Total Members</p>
          </Card>
          <Card padding="sm" className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {isLoading ? "..." : completedCount}
            </p>
            <p className="text-sm text-gray-500">Completed</p>
          </Card>
          <Card padding="sm" className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {isLoading ? "..." : inProgressCount}
            </p>
            <p className="text-sm text-gray-500">In Progress</p>
          </Card>
          <Card padding="sm" className="text-center">
            <p className="text-2xl font-bold text-gray-600">
              {isLoading ? "..." : pendingCount}
            </p>
            <p className="text-sm text-gray-500">Pending</p>
          </Card>
          <Card padding="sm" className="text-center">
            <p className="text-2xl font-bold text-gray-500">
              {isLoading ? "..." : noRequestCount}
            </p>
            <p className="text-sm text-gray-500">No Request</p>
          </Card>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by name or student ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
          <div className="w-48">
            <Select
              options={STATUS_OPTIONS}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
          </div>
          <Button variant="secondary" onClick={loadData} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Table */}
        <Card padding="none">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-cjc-navy animate-spin" />
              <span className="ml-3 text-gray-600">Loading members...</span>
            </div>
          ) : members.length === 0 ? (
            <EmptyState
              icon={<Users className="w-8 h-8 text-gray-400" />}
              title="No Members Found"
              description={
                club
                  ? `No students are enrolled in ${club.name}.`
                  : "Your club could not be found."
              }
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<Search className="w-8 h-8 text-gray-400" />}
              title="No Results"
              description="No members match your search or filter criteria."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Year Level</TableHead>
                  <TableHead>Clearance Status</TableHead>
                  <TableHead>Club Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Since</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((member) => {
                  const fullName = `${member.first_name} ${member.last_name}`;
                  return (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={member.avatar_url ?? undefined}
                            name={fullName}
                            size="sm"
                            variant="primary"
                            className={member.avatar_url ? "cursor-pointer" : ""}
                            onClick={() => member.avatar_url && setPreviewUrl(member.avatar_url)}
                          />
                          <div>
                            <p className="font-medium text-cjc-navy">{fullName}</p>
                            <p className="text-xs text-gray-500">
                              {member.student_id ?? "No ID"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-700">
                          {member.department ?? "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-700">
                          {member.course ?? "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-700">
                          {member.year_level ?? "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <ClearanceBadge status={member.clearanceStatus} />
                      </TableCell>
                      <TableCell>
                        <ClubStatusBadge status={member.clubStatus} />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedMember(member)}
                          className="text-xs gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </Button>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {typeLabel(member.latestRequest?.type)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {member.latestRequest
                            ? `${member.latestRequest.academic_year} — ${member.latestRequest.semester}`
                            : "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-500">
                          {member.latestRequest
                            ? formatDate(member.latestRequest.created_at)
                            : "—"}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Card>

        {/* Footer count */}
        {!isLoading && members.length > 0 && (
          <p className="text-sm text-gray-500">
            Showing {filtered.length} of {totalCount} members
          </p>
        )}
      </div>

      {/* Image preview modal */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setPreviewUrl(null)}
        >
          <div className="relative max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <img
              src={previewUrl}
              alt="Profile preview"
              className="w-full rounded-xl object-cover shadow-2xl"
            />
            <button
              className="absolute top-2 right-2 bg-white/80 rounded-full p-1 text-gray-700 hover:bg-white"
              onClick={() => setPreviewUrl(null)}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Overall clearance progress modal */}
      <StudentClearanceProgressModal
        isOpen={!!selectedMember}
        onClose={() => setSelectedMember(null)}
        student={selectedMember}
        latestRequest={selectedMember?.latestRequest ?? null}
      />
    </div>
  );
}
