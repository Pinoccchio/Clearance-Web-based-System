"use client";

import { useState, useEffect, useCallback } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { Users } from "lucide-react";
import {
  Profile,
  ClubWithAdviser,
  ClubType,
  Department,
  createClub,
  updateClub,
  CreateClubData,
  UpdateClubData,
  getUnlinkedClubUsers,
  getClubRoleUsers,
  getAllDepartments,
} from "@/lib/supabase";
import { uploadLogo, deleteLogo } from "@/lib/storage";
import { useToast } from "@/components/ui/Toast";

interface ClubFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode: "add" | "edit";
  club?: ClubWithAdviser;
}

interface FormData {
  name: string;
  code: string;
  description: string;
  type: ClubType;
  department: string;
  adviser_id: string;
  logo_url: string;
  status: "active" | "inactive";
}

interface FormErrors {
  name?: string;
  code?: string;
  type?: string;
  general?: string;
}

const initialFormData: FormData = {
  name: "",
  code: "",
  description: "",
  type: "academic",
  department: "",
  adviser_id: "",
  logo_url: "",
  status: "active",
};

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const typeOptions = [
  { value: "academic", label: "Academic" },
  { value: "non-academic", label: "Non-Academic" },
];

export function ClubFormModal({
  isOpen,
  onClose,
  onSuccess,
  mode,
  club,
}: ClubFormModalProps) {
  const { showToast } = useToast();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [availableAdvisers, setAvailableAdvisers] = useState<Profile[]>([]);
  const [loadingAdvisers, setLoadingAdvisers] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);

  // Fetch available club users for adviser selection and departments
  useEffect(() => {
    if (isOpen) {
      setLoadingAdvisers(true);
      setLoadingDepartments(true);

      const fetchAdvisers = async () => {
        try {
          if (mode === "edit" && club?.adviser_id) {
            // In edit mode, get all club users (including current adviser)
            const users = await getClubRoleUsers();
            setAvailableAdvisers(users);
          } else {
            // In add mode, only get unlinked users
            const users = await getUnlinkedClubUsers();
            setAvailableAdvisers(users);
          }
        } catch (error) {
          console.error("Error fetching club users:", error);
          showToast("error", "Error", "Failed to load available accounts");
        } finally {
          setLoadingAdvisers(false);
        }
      };

      const fetchDepartments = async () => {
        try {
          const depts = await getAllDepartments();
          setDepartments(depts);
        } catch (error) {
          console.error("Error fetching departments:", error);
          showToast("error", "Error", "Failed to load departments");
        } finally {
          setLoadingDepartments(false);
        }
      };

      fetchAdvisers();
      fetchDepartments();
    }
  }, [isOpen, mode, club?.adviser_id, showToast]);

  // Populate form when editing
  useEffect(() => {
    if (mode === "edit" && club) {
      setFormData({
        name: club.name || "",
        code: club.code || "",
        description: club.description || "",
        type: club.type || "academic",
        department: club.department || "",
        adviser_id: club.adviser_id || "",
        logo_url: club.logo_url || "",
        status: club.status || "active",
      });
    } else {
      setFormData(initialFormData);
    }
    setErrors({});
  }, [mode, club, isOpen]);

  // Handle logo upload
  const handleLogoUpload = useCallback(
    async (file: File): Promise<string> => {
      // Use a temporary ID for new clubs, or the actual ID for existing
      const entityId = club?.id || `temp_${Date.now()}`;
      const url = await uploadLogo(file, "clubs", entityId);
      return url;
    },
    [club?.id]
  );

  // Handle logo delete
  const handleLogoDelete = useCallback(async (url: string): Promise<void> => {
    await deleteLogo(url);
  }, []);

  // Handle logo change
  const handleLogoChange = (url: string | null) => {
    setFormData((prev) => ({ ...prev, logo_url: url || "" }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "code" ? value.toUpperCase() : value,
    }));
    // Clear error when field is modified
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    // Clear department when switching to non-academic
    if (name === "type" && value === "non-academic") {
      setFormData((prev) => ({ ...prev, department: "" }));
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Club name is required";
    }

    if (!formData.code.trim()) {
      newErrors.code = "Club code is required";
    } else if (formData.code.length > 10) {
      newErrors.code = "Code must be 10 characters or less";
    }

    if (!formData.type) {
      newErrors.type = "Club type is required";
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
      if (mode === "add") {
        const data: CreateClubData = {
          name: formData.name.trim(),
          code: formData.code.trim().toUpperCase(),
          description: formData.description.trim() || undefined,
          type: formData.type,
          adviser_id: formData.adviser_id || null,
          department: formData.type === "academic" ? (formData.department.trim() || null) : null,
          logo_url: formData.logo_url || null,
          status: formData.status,
        };

        await createClub(data);
        showToast(
          "success",
          "Club Created",
          `${formData.name} has been added successfully.`
        );
      } else if (mode === "edit" && club) {
        // If logo changed, delete old logo
        if (club.logo_url && club.logo_url !== formData.logo_url) {
          await deleteLogo(club.logo_url);
        }

        const data: UpdateClubData = {
          name: formData.name.trim(),
          code: formData.code.trim().toUpperCase(),
          description: formData.description.trim() || null,
          type: formData.type,
          adviser_id: formData.adviser_id || null,
          department: formData.type === "academic" ? (formData.department.trim() || null) : null,
          logo_url: formData.logo_url || null,
          status: formData.status,
        };

        await updateClub(club.id, data);
        showToast(
          "success",
          "Club Updated",
          `${formData.name} has been updated successfully.`
        );
      }

      onSuccess();
      onClose();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "An error occurred";

      // Handle unique constraint violation for code
      if (errorMessage.includes("duplicate key") || errorMessage.includes("unique")) {
        setErrors({ code: "This club code is already in use" });
      } else {
        setErrors({ general: errorMessage });
      }
      showToast("error", "Operation Failed", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Build adviser options for dropdown
  const adviserOptions = [
    { value: "", label: "No linked account" },
    ...availableAdvisers.map((user) => ({
      value: user.id,
      label: `${user.first_name} ${user.last_name} (${user.email})`,
    })),
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-cjc-gold/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-cjc-gold" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-cjc-navy">
              {mode === "add" ? "Add New Club" : "Edit Club"}
            </h2>
            <p className="text-sm text-gray-500">
              {mode === "add"
                ? "Create a new student organization"
                : "Update club information"}
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

          {/* Name Field */}
          <Input
            label="Club Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            placeholder="e.g., IT Society, Red Cross Youth"
            required
          />

          {/* Code Field */}
          <Input
            label="Club Code"
            name="code"
            value={formData.code}
            onChange={handleChange}
            error={errors.code}
            placeholder="e.g., ITS, RCY"
            required
            helperText="Short code used for identification (auto-uppercase)"
          />

          {/* Description Field */}
          <Input
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Brief description of the club"
          />

          {/* Type Selection */}
          <Select
            label="Club Type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            options={typeOptions}
            required
          />

          {/* Department Field (only for academic clubs) */}
          {formData.type === "academic" && (
            <Select
              label="Parent Department"
              name="department"
              value={formData.department}
              onChange={handleChange}
              options={[
                { value: "", label: "Select a department" },
                ...departments.map((dept) => ({
                  value: dept.code,
                  label: `${dept.code} - ${dept.name}`,
                })),
              ]}
              disabled={loadingDepartments}
              helperText={
                loadingDepartments
                  ? "Loading departments..."
                  : "The college/department this academic club belongs to"
              }
            />
          )}

          {/* Logo Upload */}
          <ImageUpload
            label="Club Logo (optional)"
            value={formData.logo_url || null}
            onChange={handleLogoChange}
            onUpload={handleLogoUpload}
            onDelete={handleLogoDelete}
            disabled={isLoading}
          />

          {/* Adviser Account Selection */}
          <Select
            label="Linked Account (Adviser)"
            name="adviser_id"
            value={formData.adviser_id}
            onChange={handleChange}
            options={adviserOptions}
            disabled={loadingAdvisers}
            helperText={
              loadingAdvisers
                ? "Loading available accounts..."
                : "Select a user with 'club' role to manage this club"
            }
          />

          {/* Status Selection */}
          <Select
            label="Status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            options={statusOptions}
          />

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
              {mode === "add" ? "Create Club" : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
