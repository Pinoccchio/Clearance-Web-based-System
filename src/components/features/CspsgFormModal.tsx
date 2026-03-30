"use client";

import { useState, useEffect, useCallback } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { GraduationCap } from "lucide-react";
import {
  Profile,
  Cspsg,
  CspsgWithHead,
  CreateCspData,
  createCspsg,
  updateCspsg,
  getUnlinkedCspsgUsers,
  getCspsgRoleUsers,
} from "@/lib/supabase";
import { uploadLogo, deleteLogo } from "@/lib/storage";
import { useToast } from "@/components/ui/Toast";

interface CspsgFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode: "add" | "edit";
  cspsg?: CspsgWithHead;
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

export function CspsgFormModal({ isOpen, onClose, onSuccess, mode, cspsg }: CspsgFormModalProps) {
  const { showToast } = useToast();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [availableHeads, setAvailableHeads] = useState<Profile[]>([]);
  const [loadingHeads, setLoadingHeads] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoadingHeads(true);
      const fetchData = async () => {
        try {
          const users = await (mode === "edit" && cspsg?.head_id
            ? getCspsgRoleUsers()
            : getUnlinkedCspsgUsers());
          setAvailableHeads(users);
        } catch (error) {
          console.error("Error fetching CSPSG users:", error);
          showToast("error", "Error", "Failed to load form data");
        } finally {
          setLoadingHeads(false);
        }
      };
      fetchData();
    }
  }, [isOpen, mode, cspsg?.head_id, showToast]);

  useEffect(() => {
    if (mode === "edit" && cspsg) {
      setFormData({
        name: cspsg.name || "",
        code: cspsg.code || "",
        description: cspsg.description || "",
        head_id: cspsg.head_id || "",
        logo_url: cspsg.logo_url || "",
        status: cspsg.status || "active",
      });
    } else {
      setFormData(initialFormData);
    }
    setErrors({});
  }, [mode, cspsg, isOpen]);

  const handleLogoUpload = useCallback(
    async (file: File): Promise<string> => {
      const entityId = cspsg?.id || `temp_${Date.now()}`;
      return await uploadLogo(file, "cspsg", entityId);
    },
    [cspsg?.id]
  );

  const handleLogoDelete = useCallback(async (url: string): Promise<void> => {
    await deleteLogo(url);
  }, []);

  const handleLogoChange = (url: string | null) => {
    setFormData((prev) => ({ ...prev, logo_url: url || "" }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: name === "code" ? value.toUpperCase() : value }));
    if (errors[name as keyof FormErrors]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.name.trim()) newErrors.name = "CSPSG name is required";
    if (!formData.code.trim()) newErrors.code = "CSPSG code is required";
    else if (formData.code.length > 10) newErrors.code = "Code must be 10 characters or less";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    setErrors({});
    try {
      if (mode === "add") {
        const data: CreateCspData = {
          name: formData.name.trim(),
          code: formData.code.trim().toUpperCase(),
          description: formData.description.trim() || undefined,
          head_id: formData.head_id || null,
          logo_url: formData.logo_url || null,
          status: formData.status,
        };
        await createCspsg(data);
        showToast("success", "CSPSG Created", `${formData.name} has been added successfully.`);
      } else if (mode === "edit" && cspsg) {
        if (cspsg.logo_url && cspsg.logo_url !== formData.logo_url) await deleteLogo(cspsg.logo_url);
        const data = {
          name: formData.name.trim(),
          code: formData.code.trim().toUpperCase(),
          description: formData.description.trim() || null,
          head_id: formData.head_id || null,
          logo_url: formData.logo_url || null,
          status: formData.status,
        };
        await updateCspsg(cspsg.id, data);
        showToast("success", "CSPSG Updated", `${formData.name} has been updated successfully.`);
      }
      onSuccess();
      onClose();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred";
      if (errorMessage.includes("duplicate key") || errorMessage.includes("unique")) {
        setErrors({ code: "This CSPSG code is already in use" });
      } else {
        setErrors({ general: errorMessage });
      }
      showToast("error", "Operation Failed", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const headOptions = [
    { value: "", label: "No linked account" },
    ...availableHeads.map((user) => ({
      value: user.id,
      label: `${user.first_name} ${user.last_name} (${user.email})`,
    })),
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl">
      <div className="p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-cjc-red/10 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-cjc-red" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-cjc-navy">
              {mode === "add" ? "Add CSPSG" : "Edit CSPSG"}
            </h2>
            <p className="text-sm text-gray-500">
              {mode === "add"
                ? "Create a new CSP Student Government entry"
                : "Update CSPSG information"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.general && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {errors.general}
            </div>
          )}

          <Input
            label="Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            placeholder="e.g., CSP Student Government"
            required
          />

          <Input
            label="Code"
            name="code"
            value={formData.code}
            onChange={handleChange}
            error={errors.code}
            placeholder="e.g., CSPSG"
            required
            helperText="Short code used for identification (auto-uppercase)"
          />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-cjc-navy">Description (optional)</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Brief description of the CSPSG"
              rows={3}
              className="w-full px-3 py-2 border border-border-warm rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-cjc-blue/20 focus:border-cjc-blue resize-none"
            />
          </div>

          <ImageUpload
            label="Logo (optional)"
            value={formData.logo_url || null}
            onChange={handleLogoChange}
            onUpload={handleLogoUpload}
            onDelete={handleLogoDelete}
            disabled={isLoading}
          />

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
                : "Select a user with 'CSPSG' role to manage this organization"
            }
          />

          <Select
            label="Status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            options={statusOptions}
          />

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
            <Button type="submit" variant="gold" className="flex-1" isLoading={isLoading}>
              {mode === "add" ? "Create CSPSG" : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
