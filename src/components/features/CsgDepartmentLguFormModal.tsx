"use client";

import { useState, useEffect, useCallback } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { Shield, Building2 } from "lucide-react";
import {
  Profile,
  CsgDepartmentLguWithHead,
  createCsgDepartmentLgu,
  updateCsgDepartmentLgu,
  CreateCsgDepartmentLguData,
  UpdateCsgDepartmentLguData,
  getUnlinkedCsgDepartmentLguUsers,
  getCsgDepartmentLguRoleUsers,
  getAllDepartments,
  Department,
} from "@/lib/supabase";
import { uploadLogo, deleteLogo } from "@/lib/storage";
import { useToast } from "@/components/ui/Toast";

interface CsgDepartmentLguFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode: "add" | "edit";
  lgu?: CsgDepartmentLguWithHead;
}

interface FormData {
  name: string;
  code: string;
  department_code: string;
  description: string;
  head_id: string;
  logo_url: string;
  status: "active" | "inactive";
}

interface FormErrors {
  name?: string;
  code?: string;
  department_code?: string;
  general?: string;
}

const initialFormData: FormData = {
  name: "",
  code: "",
  department_code: "",
  description: "",
  head_id: "",
  logo_url: "",
  status: "active",
};

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export function CsgDepartmentLguFormModal({ isOpen, onClose, onSuccess, mode, lgu }: CsgDepartmentLguFormModalProps) {
  const { showToast } = useToast();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [availableHeads, setAvailableHeads] = useState<Profile[]>([]);
  const [loadingHeads, setLoadingHeads] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    if (isOpen) {
      setLoadingHeads(true);
      const fetchData = async () => {
        try {
          const [depts, users] = await Promise.all([
            getAllDepartments(),
            mode === "edit" && lgu?.head_id ? getCsgDepartmentLguRoleUsers() : getUnlinkedCsgDepartmentLguUsers(),
          ]);
          setDepartments(depts);
          setAvailableHeads(users);
        } catch (error) {
          console.error("Error fetching data:", error);
          showToast("error", "Error", "Failed to load form data");
        } finally {
          setLoadingHeads(false);
        }
      };
      fetchData();
    }
  }, [isOpen, mode, lgu?.head_id, showToast]);

  useEffect(() => {
    if (mode === "edit" && lgu) {
      setFormData({
        name: lgu.name || "",
        code: lgu.code || "",
        department_code: lgu.department_code || "",
        description: lgu.description || "",
        head_id: lgu.head_id || "",
        logo_url: lgu.logo_url || "",
        status: lgu.status || "active",
      });
    } else {
      setFormData(initialFormData);
    }
    setErrors({});
  }, [mode, lgu, isOpen]);

  const handleLogoUpload = useCallback(
    async (file: File): Promise<string> => {
      const entityId = lgu?.id || `temp_${Date.now()}`;
      const url = await uploadLogo(file, "csg_department_lgus", entityId);
      return url;
    },
    [lgu?.id]
  );

  const handleLogoDelete = useCallback(async (url: string): Promise<void> => {
    await deleteLogo(url);
  }, []);

  const handleLogoChange = (url: string | null) => {
    setFormData((prev) => ({ ...prev, logo_url: url || "" }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "code" ? value.toUpperCase() : value,
    }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.name.trim()) newErrors.name = "LGU name is required";
    if (!formData.code.trim()) newErrors.code = "LGU code is required";
    else if (formData.code.length > 10) newErrors.code = "Code must be 10 characters or less";
    if (!formData.department_code) newErrors.department_code = "Department is required";
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
        const data: CreateCsgDepartmentLguData = {
          name: formData.name.trim(),
          code: formData.code.trim().toUpperCase(),
          department_code: formData.department_code,
          description: formData.description.trim() || undefined,
          head_id: formData.head_id || null,
          logo_url: formData.logo_url || null,
          status: formData.status,
        };
        await createCsgDepartmentLgu(data);
        showToast("success", "LGU Created", `${formData.name} has been added successfully.`);
      } else if (mode === "edit" && lgu) {
        if (lgu.logo_url && lgu.logo_url !== formData.logo_url) {
          await deleteLogo(lgu.logo_url);
        }
        const data: UpdateCsgDepartmentLguData = {
          name: formData.name.trim(),
          code: formData.code.trim().toUpperCase(),
          department_code: formData.department_code,
          description: formData.description.trim() || null,
          head_id: formData.head_id || null,
          logo_url: formData.logo_url || null,
          status: formData.status,
        };
        await updateCsgDepartmentLgu(lgu.id, data);
        showToast("success", "LGU Updated", `${formData.name} has been updated successfully.`);
      }
      onSuccess();
      onClose();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred";
      if (errorMessage.includes("duplicate key") || errorMessage.includes("unique")) {
        setErrors({ code: "This LGU code is already in use" });
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
            {mode === "add" ? <Building2 className="w-5 h-5 text-cjc-red" /> : <Shield className="w-5 h-5 text-cjc-red" />}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-cjc-navy">
              {mode === "add" ? "Add New LGU" : "Edit LGU"}
            </h2>
            <p className="text-sm text-gray-500">
              {mode === "add" ? "Create a new CSG Local Government Unit" : "Update LGU information"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.general && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{errors.general}</div>
          )}

          <Input label="LGU Name" name="name" value={formData.name} onChange={handleChange} error={errors.name} placeholder="e.g., CCIS LGU" required />
          <Input label="LGU Code" name="code" value={formData.code} onChange={handleChange} error={errors.code} placeholder="e.g., CCIS-LGU" required helperText="Short code used for identification (auto-uppercase)" />

          <Select label="Department" name="department_code" value={formData.department_code} onChange={handleChange} options={[{ value: "", label: "Select Department" }, ...departments.map(d => ({ value: d.code, label: `${d.code} — ${d.name}` }))]} error={errors.department_code} required />

          <Input label="Description" name="description" value={formData.description} onChange={handleChange} placeholder="Brief description of the LGU" />

          <ImageUpload label="LGU Logo (optional)" value={formData.logo_url || null} onChange={handleLogoChange} onUpload={handleLogoUpload} onDelete={handleLogoDelete} disabled={isLoading} />

          <Select label="Linked Account (Head)" name="head_id" value={formData.head_id} onChange={handleChange} options={headOptions} disabled={loadingHeads} helperText={loadingHeads ? "Loading available accounts..." : "Select a user with 'LGU' role to manage this LGU"} />

          <Select label="Status" name="status" value={formData.status} onChange={handleChange} options={statusOptions} />

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose} disabled={isLoading}>Cancel</Button>
            <Button type="submit" variant="gold" className="flex-1" isLoading={isLoading}>
              {mode === "add" ? "Create LGU" : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
