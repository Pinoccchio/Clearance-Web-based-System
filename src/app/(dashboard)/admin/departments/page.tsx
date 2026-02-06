"use client";

import { useState, useEffect, useCallback } from "react";
import {
  GraduationCap,
  Search,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  UserCheck,
  UserX,
  RefreshCw,
} from "lucide-react";
import {
  DepartmentWithHead,
  getAllDepartments,
  deleteDepartment,
} from "@/lib/supabase";
import { DepartmentFormModal } from "@/components/features/DepartmentFormModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { Avatar } from "@/components/ui/Avatar";

export default function AdminDepartmentsPage() {
  const { showToast } = useToast();
  const [departments, setDepartments] = useState<DepartmentWithHead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [selectedDepartment, setSelectedDepartment] = useState<
    DepartmentWithHead | undefined
  >(undefined);

  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState<
    DepartmentWithHead | null
  >(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch departments
  const fetchDepartments = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getAllDepartments();
      setDepartments(data);
    } catch (error) {
      console.error("Error fetching departments:", error);
      showToast("error", "Error", "Failed to load departments");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  // Filter departments by search query
  const filteredDepartments = departments.filter(
    (dept) =>
      dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dept.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dept.head?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dept.head?.last_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Statistics
  const stats = {
    total: departments.length,
    active: departments.filter((d) => d.status === "active").length,
    inactive: departments.filter((d) => d.status === "inactive").length,
    linked: departments.filter((d) => d.head_id).length,
  };

  // Handle add department
  const handleAddDepartment = () => {
    setFormMode("add");
    setSelectedDepartment(undefined);
    setIsFormModalOpen(true);
  };

  // Handle edit department
  const handleEditDepartment = (department: DepartmentWithHead) => {
    setFormMode("edit");
    setSelectedDepartment(department);
    setIsFormModalOpen(true);
  };

  // Handle delete click
  const handleDeleteClick = (department: DepartmentWithHead) => {
    setDepartmentToDelete(department);
    setIsDeleteDialogOpen(true);
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!departmentToDelete) return;

    setIsDeleting(true);
    try {
      await deleteDepartment(departmentToDelete.id);
      showToast(
        "success",
        "Department Deleted",
        `${departmentToDelete.name} has been deleted.`
      );
      fetchDepartments();
    } catch (error) {
      console.error("Error deleting department:", error);
      showToast("error", "Error", "Failed to delete department");
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setDepartmentToDelete(null);
    }
  };

  // Format head name
  const getHeadDisplayName = (department: DepartmentWithHead) => {
    if (!department.head) return null;
    const { first_name, last_name } = department.head;
    return `${first_name} ${last_name}`;
  };

  return (
    <div className="min-h-screen bg-surface-warm">
      {/* Header */}
      <header className="bg-white border-b border-border-warm">
        <div className="px-6 py-5">
          <p className="text-sm text-warm-muted">Manage college departments</p>
          <h1 className="text-2xl font-display font-bold text-cjc-navy">
            Department Management
          </h1>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-cjc-navy">{stats.total}</p>
            <p className="text-sm text-warm-muted">Total Departments</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-success">{stats.active}</p>
            <p className="text-sm text-warm-muted">Active</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-warm-muted">
              {stats.inactive}
            </p>
            <p className="text-sm text-warm-muted">Inactive</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-cjc-blue">{stats.linked}</p>
            <p className="text-sm text-warm-muted">Linked Accounts</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-warm-muted" />
            <input
              placeholder="Search departments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-3 border border-border-warm rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-cjc-blue/20 focus:border-cjc-blue"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchDepartments}
              disabled={isLoading}
              className="btn btn-secondary"
              title="Refresh"
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
              />
            </button>
            <button onClick={handleAddDepartment} className="btn btn-ccis-blue">
              <Plus className="w-4 h-4" />
              Add Department
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && departments.length === 0 && (
          <div className="card p-12 text-center">
            <Loader2 className="w-8 h-8 text-cjc-blue animate-spin mx-auto mb-3" />
            <p className="text-warm-muted">Loading departments...</p>
          </div>
        )}

        {/* Departments Table */}
        {!isLoading && filteredDepartments.length > 0 && (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead className="bg-surface-warm border-b border-border-warm">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-cjc-navy">
                    Department
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-cjc-navy">
                    Code
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-cjc-navy">
                    Linked Account
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-cjc-navy">
                    Status
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-cjc-navy">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-warm">
                {filteredDepartments.map((dept) => (
                  <tr
                    key={dept.id}
                    className="hover:bg-surface-warm transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {dept.logo_url ? (
                          <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={dept.logo_url}
                              alt={`${dept.name} logo`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-ccis-blue-primary/10 flex items-center justify-center flex-shrink-0">
                            <GraduationCap className="w-5 h-5 text-ccis-blue-primary" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-cjc-navy">
                            {dept.name}
                          </p>
                          {dept.description && (
                            <p className="text-xs text-warm-muted line-clamp-1">
                              {dept.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs px-2 py-1 rounded bg-cjc-navy text-white font-mono">
                        {dept.code}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {dept.head ? (
                        <div className="flex items-center gap-2">
                          <Avatar
                            src={dept.head.avatar_url || undefined}
                            name={getHeadDisplayName(dept) || ""}
                            size="sm"
                          />
                          <div>
                            <p className="text-sm text-cjc-navy font-medium">
                              {getHeadDisplayName(dept)}
                            </p>
                            <p className="text-xs text-warm-muted">
                              {dept.head.email}
                            </p>
                          </div>
                          <UserCheck className="w-4 h-4 text-success ml-1" />
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-warm-muted">
                          <UserX className="w-4 h-4" />
                          <span className="text-sm">Not assigned</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {dept.status === "active" ? (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-success/10 text-success font-medium">
                          Active
                        </span>
                      ) : (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 font-medium">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEditDepartment(dept)}
                          className="p-2 hover:bg-surface-warm rounded-lg transition-colors"
                          title="Edit department"
                        >
                          <Edit2 className="w-4 h-4 text-warm-muted" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(dept)}
                          className="p-2 hover:bg-danger/10 rounded-lg transition-colors"
                          title="Delete department"
                        >
                          <Trash2 className="w-4 h-4 text-danger" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredDepartments.length === 0 && (
          <div className="card p-12 text-center">
            <GraduationCap className="w-12 h-12 text-warm-muted mx-auto mb-3" />
            <p className="text-warm-muted">
              {searchQuery
                ? "No departments found matching your search"
                : "No departments yet. Add your first department to get started."}
            </p>
            {!searchQuery && (
              <button
                onClick={handleAddDepartment}
                className="btn btn-ccis-blue mt-4"
              >
                <Plus className="w-4 h-4" />
                Add Department
              </button>
            )}
          </div>
        )}
      </div>

      {/* Department Form Modal */}
      <DepartmentFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={fetchDepartments}
        mode={formMode}
        department={selectedDepartment}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setDepartmentToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Department"
        message={`Are you sure you want to delete "${departmentToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
