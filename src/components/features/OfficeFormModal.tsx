"use client";

import { useState, useEffect, useCallback } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { Building2 } from "lucide-react";
import {
  Profile,
  OfficeWithHead,
  createOffice,
  updateOffice,
  CreateOfficeData,
  UpdateOfficeData,
  getUnlinkedOfficeUsers,
  getOfficeRoleUsers,
} from "@/lib/supabase";
import { uploadLogo, deleteLogo } from "@/lib/storage";
import { useToast } from "@/components/ui/Toast";

interface OfficeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode: "add" | "edit";
  office?: OfficeWithHead;
}

interface FormData {
  name: string;
  code: string;
  description: string;
  head_id: string;
  logo_url: string;
  status: "active" | "inactive";
}

interface FormErrors {
  name?: string;
  code?: string;
  general?: string;
}

const initialFormData: FormData = {
  name: "",
  code: "",
  description: "",
  head_id: "",
  logo_url: "",
  status: "active",
};

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export function OfficeFormModal({
  isOpen,
  onClose,
  onSuccess,
  mode,
  office,
}: OfficeFormModalProps) {
  const { showToast } = useToast();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [availableHeads, setAvailableHeads] = useState<Profile[]>([]);
  const [loadingHeads, setLoadingHeads] = useState(false);

  // Fetch available office users for head selection
  useEffect(() => {
    if (isOpen) {
      setLoadingHeads(true);
      const fetchHeads = async () => {
        try {
          if (mode === "edit" && office?.head_id) {
            // In edit mode, get all office users (including current head)
            const users = await getOfficeRoleUsers();
            setAvailableHeads(users);
          } else {
            // In add mode, only get unlinked users
            const users = await getUnlinkedOfficeUsers();
            setAvailableHeads(users);
          }
        } catch (error) {
          console.error("Error fetching office users:", error);
          showToast("error", "Error", "Failed to load available accounts");
        } finally {
          setLoadingHeads(false);
        }
      };
      fetchHeads();
    }
  }, [isOpen, mode, office?.head_id, showToast]);

  // Populate form when editing
  useEffect(() => {
    if (mode === "edit" && office) {
      setFormData({
        name: office.name || "",
        code: office.code || "",
        description: office.description || "",
        head_id: office.head_id || "",
        logo_url: office.logo_url || "",
        status: office.status || "active",
      });
    } else {
      setFormData(initialFormData);
    }
    setErrors({});
  }, [mode, office, isOpen]);

  // Handle logo upload
  const handleLogoUpload = useCallback(
    async (file: File): Promise<string> => {
      // Use a temporary ID for new offices, or the actual ID for existing
      const entityId = office?.id || `temp_${Date.now()}`;
      const url = await uploadLogo(file, "offices", entityId);
      return url;
    },
    [office?.id]
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
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Office name is required";
    }

    if (!formData.code.trim()) {
      newErrors.code = "Office code is required";
    } else if (formData.code.length > 10) {
      newErrors.code = "Code must be 10 characters or less";
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
        const data: CreateOfficeData = {
          name: formData.name.trim(),
          code: formData.code.trim().toUpperCase(),
          description: formData.description.trim() || undefined,
          head_id: formData.head_id || null,
          logo_url: formData.logo_url || null,
          status: formData.status,
        };

        await createOffice(data);
        showToast(
          "success",
          "Office Created",
          `${formData.name} has been added successfully.`
        );
      } else if (mode === "edit" && office) {
        // If logo changed, delete old logo
        if (office.logo_url && office.logo_url !== formData.logo_url) {
          await deleteLogo(office.logo_url);
        }

        const data: UpdateOfficeData = {
          name: formData.name.trim(),
          code: formData.code.trim().toUpperCase(),
          description: formData.description.trim() || null,
          head_id: formData.head_id || null,
          logo_url: formData.logo_url || null,
          status: formData.status,
        };

        await updateOffice(office.id, data);
        showToast(
          "success",
          "Office Updated",
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
        setErrors({ code: "This office code is already in use" });
      } else {
        setErrors({ general: errorMessage });
      }
      showToast("error", "Operation Failed", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Build head options for dropdown
  const headOptions = [
    { value: "", label: "No linked account" },
    ...availableHeads.map((user) => ({
      value: user.id,
      label: `${user.first_name} ${user.last_name} (${user.email})`,
    })),
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-cjc-blue/10 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-cjc-blue" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-cjc-navy">
              {mode === "add" ? "Add New Office" : "Edit Office"}
            </h2>
            <p className="text-sm text-gray-500">
              {mode === "add"
                ? "Create a new clearance office"
                : "Update office information"}
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
            label="Office Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            placeholder="e.g., Library, Finance Office"
            required
          />

          {/* Code Field */}
          <Input
            label="Office Code"
            name="code"
            value={formData.code}
            onChange={handleChange}
            error={errors.code}
            placeholder="e.g., LIB, FIN"
            required
            helperText="Short code used for identification (auto-uppercase)"
          />

          {/* Description Field */}
          <Input
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Brief description of the office"
          />

          {/* Logo Upload */}
          <ImageUpload
            label="Office Logo (optional)"
            value={formData.logo_url || null}
            onChange={handleLogoChange}
            onUpload={handleLogoUpload}
            onDelete={handleLogoDelete}
            disabled={isLoading}
          />

          {/* Head Account Selection */}
          <Select
            label="Linked Account (Head)"
            name="head_id"
            value={formData.head_id}
            onChange={handleChange}
            options={headOptions}
            disabled={loadingHeads}
            helperText={
              loadingHeads
                ? "Loading available accounts..."
                : "Select a user with 'office' role to manage this office"
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
              {mode === "add" ? "Create Office" : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
