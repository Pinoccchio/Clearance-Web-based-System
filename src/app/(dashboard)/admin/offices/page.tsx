"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Building2,
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
  OfficeWithHead,
  getAllOffices,
  deleteOffice,
} from "@/lib/supabase";
import { OfficeFormModal } from "@/components/features/OfficeFormModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { Avatar } from "@/components/ui/Avatar";

export default function AdminOfficesPage() {
  const { showToast } = useToast();
  const [offices, setOffices] = useState<OfficeWithHead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [selectedOffice, setSelectedOffice] = useState<
    OfficeWithHead | undefined
  >(undefined);

  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [officeToDelete, setOfficeToDelete] = useState<
    OfficeWithHead | null
  >(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch offices
  const fetchOffices = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getAllOffices();
      setOffices(data);
    } catch (error) {
      console.error("Error fetching offices:", error);
      showToast("error", "Error", "Failed to load offices");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchOffices();
  }, [fetchOffices]);

  // Filter offices by search query
  const filteredOffices = offices.filter(
    (office) =>
      office.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      office.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      office.head?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      office.head?.last_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Statistics
  const stats = {
    total: offices.length,
    active: offices.filter((o) => o.status === "active").length,
    inactive: offices.filter((o) => o.status === "inactive").length,
    linked: offices.filter((o) => o.head_id).length,
  };

  // Handle add office
  const handleAddOffice = () => {
    setFormMode("add");
    setSelectedOffice(undefined);
    setIsFormModalOpen(true);
  };

  // Handle edit office
  const handleEditOffice = (office: OfficeWithHead) => {
    setFormMode("edit");
    setSelectedOffice(office);
    setIsFormModalOpen(true);
  };

  // Handle delete click
  const handleDeleteClick = (office: OfficeWithHead) => {
    setOfficeToDelete(office);
    setIsDeleteDialogOpen(true);
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!officeToDelete) return;

    setIsDeleting(true);
    try {
      await deleteOffice(officeToDelete.id);
      showToast(
        "success",
        "Office Deleted",
        `${officeToDelete.name} has been deleted.`
      );
      fetchOffices();
    } catch (error) {
      console.error("Error deleting office:", error);
      showToast("error", "Error", "Failed to delete office");
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setOfficeToDelete(null);
    }
  };

  // Format head name
  const getHeadDisplayName = (office: OfficeWithHead) => {
    if (!office.head) return null;
    const { first_name, last_name } = office.head;
    return `${first_name} ${last_name}`;
  };

  return (
    <div className="min-h-screen bg-surface-warm">
      {/* Header */}
      <header className="bg-white border-b border-border-warm">
        <div className="px-6 py-5">
          <p className="text-sm text-warm-muted">Manage clearance offices</p>
          <h1 className="text-2xl font-display font-bold text-cjc-navy">
            Office Management
          </h1>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-cjc-navy">{stats.total}</p>
            <p className="text-sm text-warm-muted">Total Offices</p>
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
              placeholder="Search offices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-3 border border-border-warm rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-cjc-blue/20 focus:border-cjc-blue"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchOffices}
              disabled={isLoading}
              className="btn btn-secondary"
              title="Refresh"
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
              />
            </button>
            <button onClick={handleAddOffice} className="btn btn-gold">
              <Plus className="w-4 h-4" />
              Add Office
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && offices.length === 0 && (
          <div className="card p-12 text-center">
            <Loader2 className="w-8 h-8 text-cjc-blue animate-spin mx-auto mb-3" />
            <p className="text-warm-muted">Loading offices...</p>
          </div>
        )}

        {/* Offices Table */}
        {!isLoading && filteredOffices.length > 0 && (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead className="bg-surface-warm border-b border-border-warm">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-cjc-navy">
                    Office
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
                {filteredOffices.map((office) => (
                  <tr
                    key={office.id}
                    className="hover:bg-surface-warm transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {office.logo_url ? (
                          <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={office.logo_url}
                              alt={`${office.name} logo`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-cjc-blue/10 flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-5 h-5 text-cjc-blue" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-cjc-navy">
                            {office.name}
                          </p>
                          {office.description && (
                            <p className="text-xs text-warm-muted line-clamp-1">
                              {office.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs px-2 py-1 rounded bg-cjc-blue text-white font-mono">
                        {office.code}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {office.head ? (
                        <div className="flex items-center gap-2">
                          <Avatar
                            src={office.head.avatar_url || undefined}
                            name={getHeadDisplayName(office) || ""}
                            size="sm"
                          />
                          <div>
                            <p className="text-sm text-cjc-navy font-medium">
                              {getHeadDisplayName(office)}
                            </p>
                            <p className="text-xs text-warm-muted">
                              {office.head.email}
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
                      {office.status === "active" ? (
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
                          onClick={() => handleEditOffice(office)}
                          className="p-2 hover:bg-surface-warm rounded-lg transition-colors"
                          title="Edit office"
                        >
                          <Edit2 className="w-4 h-4 text-warm-muted" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(office)}
                          className="p-2 hover:bg-danger/10 rounded-lg transition-colors"
                          title="Delete office"
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
        {!isLoading && filteredOffices.length === 0 && (
          <div className="card p-12 text-center">
            <Building2 className="w-12 h-12 text-warm-muted mx-auto mb-3" />
            <p className="text-warm-muted">
              {searchQuery
                ? "No offices found matching your search"
                : "No offices yet. Add your first office to get started."}
            </p>
            {!searchQuery && (
              <button
                onClick={handleAddOffice}
                className="btn btn-gold mt-4"
              >
                <Plus className="w-4 h-4" />
                Add Office
              </button>
            )}
          </div>
        )}
      </div>

      {/* Office Form Modal */}
      <OfficeFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={fetchOffices}
        mode={formMode}
        office={selectedOffice}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setOfficeToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Office"
        message={`Are you sure you want to delete "${officeToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
