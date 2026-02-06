"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Megaphone } from "lucide-react";
import {
  Profile,
  AnnouncementWithRelations,
  AnnouncementPriority,
  CreateAnnouncementData,
  UpdateAnnouncementData,
  createAnnouncement,
  updateAnnouncement,
  getAllDepartments,
  getAllOffices,
  getAllClubs,
  DepartmentWithHead,
  OfficeWithHead,
  ClubWithAdviser,
} from "@/lib/supabase";
import { useToast } from "@/components/ui/Toast";

interface AnnouncementFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode: "add" | "edit";
  announcement?: AnnouncementWithRelations;
  currentUser: Profile;
}

interface FormData {
  title: string;
  content: string;
  priority: AnnouncementPriority;
  scope: "system" | "department" | "office" | "club";
  department_id: string;
  office_id: string;
  club_id: string;
  event_date: string;
  event_location: string;
  expires_at: string;
  is_active: boolean;
}

interface FormErrors {
  title?: string;
  content?: string;
  scope?: string;
  general?: string;
}

const initialFormData: FormData = {
  title: "",
  content: "",
  priority: "normal",
  scope: "system",
  department_id: "",
  office_id: "",
  club_id: "",
  event_date: "",
  event_location: "",
  expires_at: "",
  is_active: true,
};

const priorityOptions = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const statusOptions = [
  { value: "true", label: "Active" },
  { value: "false", label: "Inactive" },
];

export function AnnouncementFormModal({
  isOpen,
  onClose,
  onSuccess,
  mode,
  announcement,
  currentUser,
}: AnnouncementFormModalProps) {
  const { showToast } = useToast();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  // Options for scope selection (admin only)
  const [departments, setDepartments] = useState<DepartmentWithHead[]>([]);
  const [offices, setOffices] = useState<OfficeWithHead[]>([]);
  const [clubs, setClubs] = useState<ClubWithAdviser[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const isAdmin = currentUser.role === "admin";

  // Fetch scope options for admin
  useEffect(() => {
    if (isOpen && isAdmin) {
      setLoadingOptions(true);
      Promise.all([getAllDepartments(), getAllOffices(), getAllClubs()])
        .then(([depts, offs, clbs]) => {
          setDepartments(depts.filter((d) => d.status === "active"));
          setOffices(offs.filter((o) => o.status === "active"));
          setClubs(clbs.filter((c) => c.status === "active"));
        })
        .catch((error) => {
          console.error("Error fetching scope options:", error);
          showToast("error", "Error", "Failed to load options");
        })
        .finally(() => {
          setLoadingOptions(false);
        });
    }
  }, [isOpen, isAdmin, showToast]);

  // Determine scope from announcement
  const getScopeFromAnnouncement = (ann: AnnouncementWithRelations): FormData["scope"] => {
    if (ann.is_system_wide) return "system";
    if (ann.department_id) return "department";
    if (ann.office_id) return "office";
    if (ann.club_id) return "club";
    return "system";
  };

  // Populate form when editing or reset when adding
  useEffect(() => {
    if (mode === "edit" && announcement) {
      const scope = getScopeFromAnnouncement(announcement);
      setFormData({
        title: announcement.title || "",
        content: announcement.content || "",
        priority: announcement.priority || "normal",
        scope,
        department_id: announcement.department_id || "",
        office_id: announcement.office_id || "",
        club_id: announcement.club_id || "",
        event_date: announcement.event_date
          ? new Date(announcement.event_date).toISOString().slice(0, 16)
          : "",
        event_location: announcement.event_location || "",
        expires_at: announcement.expires_at
          ? new Date(announcement.expires_at).toISOString().slice(0, 16)
          : "",
        is_active: announcement.is_active,
      });
    } else {
      // Reset form for new announcement
      const defaultScope = isAdmin ? "system" : currentUser.role === "department" ? "department" : currentUser.role === "office" ? "office" : "club";
      setFormData({
        ...initialFormData,
        scope: defaultScope as FormData["scope"],
      });
    }
    setErrors({});
  }, [mode, announcement, isOpen, isAdmin, currentUser.role]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when field is modified
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleScopeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const scope = e.target.value as FormData["scope"];
    setFormData((prev) => ({
      ...prev,
      scope,
      // Reset scope-specific IDs when scope changes
      department_id: "",
      office_id: "",
      club_id: "",
    }));
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!formData.content.trim()) {
      newErrors.content = "Content is required";
    }

    // Validate scope selection for admin
    if (isAdmin) {
      if (formData.scope === "department" && !formData.department_id) {
        newErrors.scope = "Please select a department";
      } else if (formData.scope === "office" && !formData.office_id) {
        newErrors.scope = "Please select an office";
      } else if (formData.scope === "club" && !formData.club_id) {
        newErrors.scope = "Please select a club";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // Determine scope values
      let department_id: string | null = null;
      let office_id: string | null = null;
      let club_id: string | null = null;
      let is_system_wide = false;

      if (isAdmin) {
        switch (formData.scope) {
          case "system":
            is_system_wide = true;
            break;
          case "department":
            department_id = formData.department_id;
            break;
          case "office":
            office_id = formData.office_id;
            break;
          case "club":
            club_id = formData.club_id;
            break;
        }
      } else {
        // Non-admin users post to their linked entity
        // This would need to be set based on their actual linked entity
        // For now, we'll rely on the backend to enforce this
        switch (currentUser.role) {
          case "department":
            department_id = formData.department_id || null;
            break;
          case "office":
            office_id = formData.office_id || null;
            break;
          case "club":
            club_id = formData.club_id || null;
            break;
        }
      }

      if (mode === "add") {
        const data: CreateAnnouncementData = {
          title: formData.title.trim(),
          content: formData.content.trim(),
          posted_by_id: currentUser.id,
          department_id,
          office_id,
          club_id,
          is_system_wide,
          priority: formData.priority,
          event_date: formData.event_date ? new Date(formData.event_date).toISOString() : null,
          event_location: formData.event_location.trim() || null,
          expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null,
          is_active: formData.is_active,
        };

        await createAnnouncement(data);
        showToast(
          "success",
          "Announcement Created",
          "Your announcement has been posted successfully."
        );
      } else if (mode === "edit" && announcement) {
        const data: UpdateAnnouncementData = {
          title: formData.title.trim(),
          content: formData.content.trim(),
          department_id,
          office_id,
          club_id,
          is_system_wide,
          priority: formData.priority,
          event_date: formData.event_date ? new Date(formData.event_date).toISOString() : null,
          event_location: formData.event_location.trim() || null,
          expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null,
          is_active: formData.is_active,
        };

        await updateAnnouncement(announcement.id, data);
        showToast(
          "success",
          "Announcement Updated",
          "The announcement has been updated successfully."
        );
      }

      onSuccess();
      onClose();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "An error occurred";
      setErrors({ general: errorMessage });
      showToast("error", "Operation Failed", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Build scope options for admin dropdown
  const scopeOptions = [
    { value: "system", label: "System-wide (All users)" },
    { value: "department", label: "Department" },
    { value: "office", label: "Office" },
    { value: "club", label: "Club" },
  ];

  const departmentOptions = [
    { value: "", label: "Select a department" },
    ...departments.map((d) => ({ value: d.id, label: d.name })),
  ];

  const officeOptions = [
    { value: "", label: "Select an office" },
    ...offices.map((o) => ({ value: o.id, label: o.name })),
  ];

  const clubOptions = [
    { value: "", label: "Select a club" },
    ...clubs.map((c) => ({ value: c.id, label: c.name })),
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-cjc-gold/10 flex items-center justify-center">
            <Megaphone className="w-5 h-5 text-cjc-gold" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-cjc-navy">
              {mode === "add" ? "Create Announcement" : "Edit Announcement"}
            </h2>
            <p className="text-sm text-gray-500">
              {mode === "add"
                ? "Post a new announcement"
                : "Update announcement details"}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* General Error */}
          {errors.general && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {errors.general}
            </div>
          )}

          {/* Title Field */}
          <Input
            label="Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            error={errors.title}
            placeholder="Announcement title"
            required
          />

          {/* Content Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content <span className="text-red-500">*</span>
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="Announcement content..."
              rows={4}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cjc-blue/20 focus:border-cjc-blue ${
                errors.content ? "border-red-300" : "border-gray-300"
              }`}
              required
            />
            {errors.content && (
              <p className="mt-1 text-sm text-red-500">{errors.content}</p>
            )}
          </div>

          {/* Priority Field */}
          <Select
            label="Priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            options={priorityOptions}
          />

          {/* Target Audience (Admin only) */}
          {isAdmin && (
            <>
              <Select
                label="Target Audience"
                name="scope"
                value={formData.scope}
                onChange={handleScopeChange}
                options={scopeOptions}
                disabled={loadingOptions}
              />

              {/* Conditional scope selection */}
              {formData.scope === "department" && (
                <Select
                  label="Select Department"
                  name="department_id"
                  value={formData.department_id}
                  onChange={handleChange}
                  options={departmentOptions}
                  error={errors.scope}
                  disabled={loadingOptions}
                />
              )}

              {formData.scope === "office" && (
                <Select
                  label="Select Office"
                  name="office_id"
                  value={formData.office_id}
                  onChange={handleChange}
                  options={officeOptions}
                  error={errors.scope}
                  disabled={loadingOptions}
                />
              )}

              {formData.scope === "club" && (
                <Select
                  label="Select Club"
                  name="club_id"
                  value={formData.club_id}
                  onChange={handleChange}
                  options={clubOptions}
                  error={errors.scope}
                  disabled={loadingOptions}
                />
              )}
            </>
          )}

          {/* Event Date (optional) */}
          <Input
            label="Event Date (optional)"
            name="event_date"
            type="datetime-local"
            value={formData.event_date}
            onChange={handleChange}
            helperText="If this announcement is for an event"
          />

          {/* Event Location (optional) */}
          <Input
            label="Event Location (optional)"
            name="event_location"
            value={formData.event_location}
            onChange={handleChange}
            placeholder="e.g., Main Auditorium"
          />

          {/* Expires At (optional) */}
          <Input
            label="Expires At (optional)"
            name="expires_at"
            type="datetime-local"
            value={formData.expires_at}
            onChange={handleChange}
            helperText="Leave empty for no expiration"
          />

          {/* Status (edit mode only) */}
          {mode === "edit" && (
            <Select
              label="Status"
              name="is_active"
              value={formData.is_active.toString()}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  is_active: e.target.value === "true",
                }))
              }
              options={statusOptions}
            />
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="gold"
              className="flex-1"
              isLoading={isLoading}
            >
              {mode === "add" ? "Post Announcement" : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
