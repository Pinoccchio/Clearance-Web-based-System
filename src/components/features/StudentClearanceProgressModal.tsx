"use client";

import { useState, useEffect } from "react";
import { GraduationCap, Building2, Users, Loader2, Landmark, Flag } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Avatar } from "@/components/ui/Avatar";
import {
  Profile,
  ClearanceRequest,
  ClearanceItem,
  OfficeWithHead,
  ClubWithAdviser,
  Department,
  CsgLgu,
  CspspDivision,
  getClearanceItemsForStudent,
  getAllOffices,
  getAllClubs,
  getDepartmentByCode,
  getCsgLguByDepartmentCode,
  getCspspDivisionByCode,
} from "@/lib/supabase";

type ItemStatus = ClearanceItem["status"];

interface ClearanceItemWithRequest extends ClearanceItem {
  request: ClearanceRequest;
}

interface StudentClearanceProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Profile | null;
  latestRequest: ClearanceRequest | null;
}

function getStatusBadge(status: ItemStatus | undefined) {
  if (!status || status === "pending") {
    return <Badge variant="neutral" size="sm">Not Started</Badge>;
  }
  switch (status) {
    case "submitted":
      return <Badge variant="warning" size="sm">Submitted</Badge>;
    case "approved":
      return <Badge variant="success" size="sm">Approved</Badge>;
    case "rejected":
      return <Badge variant="danger" size="sm">Rejected</Badge>;
    case "on_hold":
      return <Badge variant="onHold" size="sm">On Hold</Badge>;
    default:
      return <Badge variant="neutral" size="sm">Unknown</Badge>;
  }
}

export function StudentClearanceProgressModal({
  isOpen,
  onClose,
  student,
  latestRequest,
}: StudentClearanceProgressModalProps) {
  const [items, setItems] = useState<ClearanceItemWithRequest[]>([]);
  const [offices, setOffices] = useState<OfficeWithHead[]>([]);
  const [clubs, setClubs] = useState<ClubWithAdviser[]>([]);
  const [studentDept, setStudentDept] = useState<Department | null>(null);
  const [studentCsgLgu, setStudentCsgLgu] = useState<CsgLgu | null>(null);
  const [studentCspspDiv, setStudentCspspDiv] = useState<CspspDivision | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !student) return;

    let cancelled = false;
    setIsLoading(true);

    (async () => {
      try {
        const [itemsData, officesData, clubsData, deptData, csgLguData, cspspDivData] = await Promise.all([
          getClearanceItemsForStudent(student.id),
          getAllOffices(),
          getAllClubs(),
          student.department ? getDepartmentByCode(student.department) : Promise.resolve(null),
          student.department && student.department !== "CSP" ? getCsgLguByDepartmentCode(student.department) : Promise.resolve(null),
          student.cspsp_division ? getCspspDivisionByCode(student.cspsp_division) : Promise.resolve(null),
        ]);

        if (cancelled) return;

        setItems(itemsData as ClearanceItemWithRequest[]);
        setOffices(officesData.filter((o) => o.status === "active"));
        setClubs(clubsData.filter((c) => c.status === "active"));
        setStudentDept(deptData);
        setStudentCsgLgu(csgLguData);
        setStudentCspspDiv(cspspDivData);
      } catch (err) {
        console.error("Failed to load clearance progress:", err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [isOpen, student]);

  // Filter items to latest request only
  const requestItems = latestRequest
    ? items.filter((i) => i.request_id === latestRequest.id)
    : [];

  // Parse enrolled clubs
  const enrolledClubIds = student?.enrolled_clubs
    ? student.enrolled_clubs.split(",").map((c) => c.trim()).filter(Boolean)
    : [];
  const enrolledClubs = clubs.filter((c) => enrolledClubIds.includes(c.id));

  // Total sources
  const totalSources = (studentDept ? 1 : 0) + offices.length + enrolledClubs.length
    + (studentCsgLgu ? 1 : 0) + (studentCspspDiv ? 1 : 0);

  // Find item for a specific source
  const getItemForSource = (sourceType: string, sourceId: string) => {
    return requestItems.find(
      (i) => i.source_type === sourceType && i.source_id === sourceId
    );
  };

  const approvedCount = requestItems.filter((i) => i.status === "approved").length;
  const progressPercent = totalSources > 0 ? Math.round((approvedCount / totalSources) * 100) : 0;

  const fullName = student ? `${student.first_name} ${student.last_name}` : "";

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl">
      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : student ? (
          <div className="space-y-5">
            {/* Student Header */}
            <div className="flex items-center gap-3">
              <Avatar
                src={student.avatar_url ?? undefined}
                name={fullName}
                size="lg"
                variant="primary"
              />
              <div>
                <h3 className="text-lg font-semibold text-cjc-navy">{fullName}</h3>
                <p className="text-sm text-gray-500">
                  {student.student_id ?? "No ID"} · {student.course ?? "N/A"} · Year {student.year_level ?? "—"}
                </p>
                {latestRequest && (
                  <p className="text-xs text-gray-400">
                    {latestRequest.semester} Semester, A.Y. {latestRequest.academic_year}
                  </p>
                )}
              </div>
            </div>

            {/* Overall Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-cjc-navy">
                  Overall: {approvedCount}/{totalSources} Approved
                </span>
                <span className="text-xs text-gray-400">{progressPercent}%</span>
              </div>
              <ProgressBar value={progressPercent} variant="success" size="md" />
            </div>

            {/* Department */}
            {studentDept && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  <GraduationCap className="w-4 h-4" />
                  Department (1)
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-cjc-navy text-sm">{studentDept.name}</p>
                    <p className="text-xs text-gray-400">{studentDept.code}</p>
                  </div>
                  {getStatusBadge(getItemForSource("department", studentDept.id)?.status)}
                </div>
              </div>
            )}

            {/* Offices */}
            {offices.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  <Building2 className="w-4 h-4" />
                  Offices ({offices.length})
                </div>
                <div className="space-y-2">
                  {offices.map((office) => (
                    <div key={office.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-cjc-navy text-sm">{office.name}</p>
                        <p className="text-xs text-gray-400">{office.code}</p>
                      </div>
                      {getStatusBadge(getItemForSource("office", office.id)?.status)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Clubs */}
            {enrolledClubs.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  <Users className="w-4 h-4" />
                  Clubs ({enrolledClubs.length})
                </div>
                <div className="space-y-2">
                  {enrolledClubs.map((club) => (
                    <div key={club.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-cjc-navy text-sm">{club.name}</p>
                        <p className="text-xs text-gray-400">{club.code}</p>
                      </div>
                      {getStatusBadge(getItemForSource("club", club.id)?.status)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CSG LGU */}
            {studentCsgLgu && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  <Landmark className="w-4 h-4" />
                  CSG LGU (1)
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-cjc-navy text-sm">{studentCsgLgu.name}</p>
                    <p className="text-xs text-gray-400">{studentCsgLgu.code}</p>
                  </div>
                  {getStatusBadge(getItemForSource("csg_lgu", studentCsgLgu.id)?.status)}
                </div>
              </div>
            )}

            {/* CSPSP Division */}
            {studentCspspDiv && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  <Flag className="w-4 h-4" />
                  CSPSP Division (1)
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-cjc-navy text-sm">{studentCspspDiv.name}</p>
                    <p className="text-xs text-gray-400">{studentCspspDiv.code}</p>
                  </div>
                  {getStatusBadge(getItemForSource("cspsp_division", studentCspspDiv.id)?.status)}
                </div>
              </div>
            )}

            {/* No sources */}
            {totalSources === 0 && !isLoading && (
              <div className="text-center py-6 text-gray-500">
                <p className="text-sm">No clearance sources found for this student.</p>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
