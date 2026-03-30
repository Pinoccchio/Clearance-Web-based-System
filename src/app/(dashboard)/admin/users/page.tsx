"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/layout/header";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  UserCheck,
  UserX,
  Loader2,
  X,
  FileSpreadsheet,
} from "lucide-react";
import {
  supabase,
  Profile,
  deleteUser,
  Department,
  Office,
  Club,
  CsgLgu,
  CspspDivision,
} from "@/lib/supabase";
import { UserFormModal } from "@/components/features/UserFormModal";
import { BatchImportModal } from "@/components/features/BatchImportModal";
import { useToast } from "@/components/ui/Toast";

interface UserWithStatus extends Profile {
  status: "active" | "inactive";
  linkedDepartment?: Department | null;
  linkedOffice?: Office | null;
  linkedClub?: Club | null;
  linkedCsgLgu?: CsgLgu | null;
  linkedCspspDivision?: CspspDivision | null;
}

export default function AdminUsersPage() {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [users, setUsers] = useState<UserWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Modal states
  const [selectedUser, setSelectedUser] = useState<UserWithStatus | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBatchImportModalOpen, setIsBatchImportModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch users from Supabase
  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch users, departments, offices, and clubs in parallel
      const [usersResponse, departmentsResponse, officesResponse, clubsResponse, csgLgusResponse, cspspDivisionsResponse] = await Promise.all([
        supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("departments")
          .select("*"),
        supabase
          .from("offices")
          .select("*"),
        supabase
          .from("clubs")
          .select("*"),
        supabase
          .from("csg_lgus")
          .select("*"),
        supabase
          .from("cspsp_divisions")
          .select("*"),
      ]);

      if (usersResponse.error) {
        throw usersResponse.error;
      }

      const departments = departmentsResponse.data || [];
      const offices = officesResponse.data || [];
      const clubs = clubsResponse.data || [];
      const csgLgus = csgLgusResponse.data || [];
      const cspspDivisions = cspspDivisionsResponse.data || [];

      // Create maps of head_id to department/office for quick lookup
      const headToDepartmentMap = new Map<string, Department>();
      departments.forEach((dept) => {
        if (dept.head_id) {
          headToDepartmentMap.set(dept.head_id, dept);
        }
      });

      const headToOfficeMap = new Map<string, Office>();
      offices.forEach((office) => {
        if (office.head_id) {
          headToOfficeMap.set(office.head_id, office);
        }
      });

      const adviserToClubMap = new Map<string, Club>();
      clubs.forEach((club) => {
        if (club.adviser_id) {
          adviserToClubMap.set(club.adviser_id, club);
        }
      });

      const headToCsgLguMap = new Map<string, CsgLgu>();
      csgLgus.forEach((lgu: CsgLgu) => {
        if (lgu.head_id) {
          headToCsgLguMap.set(lgu.head_id, lgu);
        }
      });

      const headToCspspDivisionMap = new Map<string, CspspDivision>();
      cspspDivisions.forEach((div: CspspDivision) => {
        if (div.head_id) {
          headToCspspDivisionMap.set(div.head_id, div);
        }
      });

      // Add status field and linked department/office/club
      const usersWithStatus = (usersResponse.data || []).map((user) => ({
        ...user,
        status: "active" as const,
        linkedDepartment: headToDepartmentMap.get(user.id) || null,
        linkedOffice: headToOfficeMap.get(user.id) || null,
        linkedClub: adviserToClubMap.get(user.id) || null,
        linkedCsgLgu: headToCsgLguMap.get(user.id) || null,
        linkedCspspDivision: headToCspspDivisionMap.get(user.id) || null,
      }));

      setUsers(usersWithStatus);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to load users. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "danger";
      case "office":
        return "success";
      case "department":
        return "info";
      case "club":
        return "gold";
      case "csg_lgu":
        return "info";
      case "cspsp_division":
        return "neutral";
      default:
        return "pending";
    }
  };

  const getRoleLabel = (role: string, short = false) => {
    switch (role) {
      case "office":
        return short ? "Office" : "Office";
      case "department":
        return short ? "Dept" : "Department";
      case "club":
        return short ? "Club" : "Club";
      case "csg_lgu":
        return short ? "CSG" : "CSG LGU";
      case "cspsp_division":
        return short ? "CSPSP" : "CSPSP Division";
      default:
        return role.charAt(0).toUpperCase() + role.slice(1);
    }
  };

  const filteredUsers = users.filter((user) => {
    const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = !roleFilter || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const roleOptions = [
    { value: "", label: "All Roles" },
    { value: "student", label: "Student" },
    { value: "office", label: "Office" },
    { value: "department", label: "Department" },
    { value: "club", label: "Club" },
    { value: "csg_lgu", label: "CSG LGU" },
    { value: "cspsp_division", label: "CSPSP Division" },
    { value: "admin", label: "Admin" },
  ];

  // Action handlers
  const handleAddUser = () => {
    setIsAddModalOpen(true);
  };

  const handleEdit = (user: UserWithStatus) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (user: UserWithStatus) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;

    setActionLoading(true);
    try {
      const userName = `${selectedUser.first_name} ${selectedUser.last_name}`;
      await deleteUser(selectedUser.id);
      await fetchUsers();
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
      showToast("success", "User Deleted", `${userName} has been deleted successfully.`);
    } catch (err) {
      console.error("Error deleting user:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to delete user. Please try again.";
      showToast("error", "Delete Failed", errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const handleModalSuccess = () => {
    fetchUsers();
  };

  const handleCloseModals = () => {
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setIsDeleteDialogOpen(false);
    setSelectedUser(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="User Management"
        subtitle="Manage system users and permissions"
      />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <Card padding="sm" className="text-center">
            <p className="text-2xl font-bold text-cjc-navy">
              {isLoading ? "..." : users.length}
            </p>
            <p className="text-sm text-gray-500">Total Users</p>
          </Card>
          <Card padding="sm" className="text-center">
            <p className="text-2xl font-bold text-cjc-blue">
              {isLoading
                ? "..."
                : users.filter((u) => u.role === "student").length}
            </p>
            <p className="text-sm text-gray-500">Students</p>
          </Card>
          <Card padding="sm" className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {isLoading
                ? "..."
                : users.filter((u) => u.role === "office").length}
            </p>
            <p className="text-sm text-gray-500">Offices</p>
          </Card>
          <Card padding="sm" className="text-center">
            <p className="text-2xl font-bold text-amber-600">
              {isLoading
                ? "..."
                : users.filter(
                    (u) => u.role === "department" || u.role === "club" || u.role === "csg_lgu" || u.role === "cspsp_division"
                  ).length}
            </p>
            <p className="text-sm text-gray-500">Dept/Clubs/Orgs</p>
          </Card>
          <Card padding="sm" className="text-center">
            <p className="text-2xl font-bold text-red-600">
              {isLoading
                ? "..."
                : users.filter((u) => u.role === "admin").length}
            </p>
            <p className="text-sm text-gray-500">Admins</p>
          </Card>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-2 underline hover:no-underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Filters and Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              options={roleOptions}
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            />
          </div>
          <Button variant="secondary" onClick={() => setIsBatchImportModalOpen(true)}>
            <FileSpreadsheet className="w-4 h-4" />
            Import Excel
          </Button>
          <Button variant="primary" onClick={handleAddUser}>
            <Plus className="w-4 h-4" />
            Add User
          </Button>
        </div>

        {/* Users Table */}
        <Card padding="none" className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-cjc-navy animate-spin" />
              <span className="ml-3 text-gray-600">Loading users...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-auto">User</TableHead>
                  <TableHead className="w-20 sm:w-auto">Role</TableHead>
                  <TableHead className="hidden md:table-cell">Linked To</TableHead>
                  <TableHead className="hidden lg:table-cell">Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Joined</TableHead>
                  <TableHead className="w-20 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-gray-500 [&]:table-cell"
                    >
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => {
                    const fullName = `${user.first_name} ${user.last_name}`;
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar
                              src={user.avatar_url ?? undefined}
                              name={fullName}
                              size="sm"
                              variant="primary"
                              className={user.avatar_url ? "cursor-pointer" : ""}
                              onClick={() => user.avatar_url && setPreviewUrl(user.avatar_url)}
                            />
                            <div className="min-w-0">
                              <p className="font-medium text-cjc-navy truncate">
                                {fullName}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={getRoleBadgeVariant(user.role)}
                            size="sm"
                          >
                            <span className="sm:hidden">{getRoleLabel(user.role, true)}</span>
                            <span className="hidden sm:inline">{getRoleLabel(user.role)}</span>
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {user.role === "department" ? (
                            user.linkedDepartment ? (
                              <div className="flex items-center gap-2">
                                <UserCheck className="w-4 h-4 text-green-500" />
                                <Badge variant="info" size="sm">
                                  {user.linkedDepartment.code}
                                </Badge>
                                <span className="text-sm text-gray-600">
                                  {user.linkedDepartment.name}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <UserX className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-400 italic">
                                  Not linked
                                </span>
                              </div>
                            )
                          ) : user.role === "club" ? (
                            user.linkedClub ? (
                              <div className="flex items-center gap-2">
                                <UserCheck className="w-4 h-4 text-green-500" />
                                <Badge variant="gold" size="sm">
                                  {user.linkedClub.code}
                                </Badge>
                                <span className="text-sm text-gray-600">
                                  {user.linkedClub.name}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <UserX className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-400 italic">
                                  Not linked
                                </span>
                              </div>
                            )
                          ) : user.role === "office" ? (
                            user.linkedOffice ? (
                              <div className="flex items-center gap-2">
                                <UserCheck className="w-4 h-4 text-green-500" />
                                <Badge variant="success" size="sm">
                                  {user.linkedOffice.code}
                                </Badge>
                                <span className="text-sm text-gray-600">
                                  {user.linkedOffice.name}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <UserX className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-400 italic">
                                  Not linked
                                </span>
                              </div>
                            )
                          ) : user.role === "csg_lgu" ? (
                            user.linkedCsgLgu ? (
                              <div className="flex items-center gap-2">
                                <UserCheck className="w-4 h-4 text-green-500" />
                                <Badge variant="info" size="sm">
                                  {user.linkedCsgLgu.code}
                                </Badge>
                                <span className="text-sm text-gray-600">
                                  {user.linkedCsgLgu.name}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <UserX className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-400 italic">
                                  Not linked
                                </span>
                              </div>
                            )
                          ) : user.role === "cspsp_division" ? (
                            user.linkedCspspDivision ? (
                              <div className="flex items-center gap-2">
                                <UserCheck className="w-4 h-4 text-green-500" />
                                <Badge variant="gold" size="sm">
                                  {user.linkedCspspDivision.code}
                                </Badge>
                                <span className="text-sm text-gray-600">
                                  {user.linkedCspspDivision.name}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <UserX className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-400 italic">
                                  Not linked
                                </span>
                              </div>
                            )
                          ) : user.role === "student" ? (
                            <span className="text-sm text-gray-500">
                              {user.department || "-"}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <Badge
                            variant={
                              user.status === "active" ? "success" : "neutral"
                            }
                            size="sm"
                          >
                            {user.status === "active" ? (
                              <UserCheck className="w-3 h-3" />
                            ) : (
                              <UserX className="w-3 h-3" />
                            )}
                            <span className="capitalize">{user.status}</span>
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <span className="text-sm text-gray-500">
                            {new Date(user.created_at).toLocaleDateString()}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleEdit(user)}
                              className="p-2 hover:bg-surface-warm rounded-lg transition-colors"
                              title="Edit user"
                            >
                              <Edit2 className="w-4 h-4 text-warm-muted" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(user)}
                              className="p-2 hover:bg-danger/10 rounded-lg transition-colors"
                              title="Delete user"
                            >
                              <Trash2 className="w-4 h-4 text-danger" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </Card>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {filteredUsers.length} of {users.length} users
          </p>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" disabled>
              Previous
            </Button>
            <Button variant="secondary" size="sm">
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      <UserFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleModalSuccess}
        mode="add"
      />

      {/* Edit User Modal */}
      <UserFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={handleModalSuccess}
        mode="edit"
        user={selectedUser || undefined}
      />

      {/* Batch Import Modal */}
      <BatchImportModal
        isOpen={isBatchImportModalOpen}
        onClose={() => setIsBatchImportModalOpen(false)}
        onSuccess={handleModalSuccess}
      />

      {/* Image Preview Modal */}
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

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSelectedUser(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete User"
        message={`Are you sure you want to delete ${selectedUser?.first_name} ${selectedUser?.last_name}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={actionLoading}
      />

    </div>
  );
}
