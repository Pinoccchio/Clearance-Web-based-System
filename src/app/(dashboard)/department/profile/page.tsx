"use client";

import { useState, useEffect, useCallback } from "react";
import { useRealtimeRefresh } from "@/lib/useRealtimeRefresh";
import Header from "@/components/layout/header";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";
import {
  User,
  GraduationCap,
  Edit2,
  Save,
  Camera,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { uploadAvatar, deleteAvatar, uploadLogo, deleteLogo } from "@/lib/storage";
import {
  updateProfile,
  updateDepartment,
  getDepartmentByHeadId,
  type Department,
} from "@/lib/supabase";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

export default function DepartmentProfilePage() {
  const { profile, user, refreshProfile } = useAuth();
  const { showToast } = useToast();

  const [department, setDepartment] = useState<Department | null>(null);
  const [isLoadingOrg, setIsLoadingOrg] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [isEditingOrg, setIsEditingOrg] = useState(false);
  const [isSavingPersonal, setIsSavingPersonal] = useState(false);
  const [isSavingOrg, setIsSavingOrg] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const [personalForm, setPersonalForm] = useState({
    first_name: profile?.first_name ?? "",
    middle_name: profile?.middle_name ?? "",
    last_name: profile?.last_name ?? "",
    date_of_birth: profile?.date_of_birth ?? "",
  });

  const [orgForm, setOrgForm] = useState({
    description: department?.description ?? "",
  });

  const loadDepartment = useCallback(async () => {
    if (!profile?.id) return;
    setIsLoadingOrg(true);
    const dept = await getDepartmentByHeadId(profile.id);
    setDepartment(dept);
    setOrgForm({ description: dept?.description ?? "" });
    setIsLoadingOrg(false);
  }, [profile?.id]);

  // Fetch department on mount
  useEffect(() => {
    loadDepartment();
  }, [loadDepartment]);

  useRealtimeRefresh('departments', loadDepartment);
  useRealtimeRefresh('profiles', loadDepartment);

  // Sync personal form when profile changes
  useEffect(() => {
    setPersonalForm({
      first_name: profile?.first_name ?? "",
      middle_name: profile?.middle_name ?? "",
      last_name: profile?.last_name ?? "",
      date_of_birth: profile?.date_of_birth ?? "",
    });
  }, [profile]);

  const handleAvatarUpload = async (file: File) => {
    if (!user) return;
    setIsUploadingAvatar(true);
    try {
      if (profile?.avatar_url) await deleteAvatar(profile.avatar_url);
      const url = await uploadAvatar(file, user.id);
      await updateProfile(user.id, { avatar_url: url });
      await refreshProfile();
      showToast("success", "Avatar Updated", "Your profile photo has been changed.");
    } catch {
      showToast("error", "Upload Failed", "Could not update your avatar. Please try again.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSavePersonal = async () => {
    if (!user) return;
    setIsSavingPersonal(true);
    try {
      await updateProfile(user.id, {
        first_name: personalForm.first_name,
        middle_name: personalForm.middle_name || null,
        last_name: personalForm.last_name,
        date_of_birth: personalForm.date_of_birth || null,
      });
      await refreshProfile();
      setIsEditingPersonal(false);
      showToast("success", "Profile Updated", "Your personal information has been saved.");
    } catch {
      showToast("error", "Update Failed", "Could not save your profile. Please try again.");
    } finally {
      setIsSavingPersonal(false);
    }
  };

  const handleCancelPersonal = () => {
    setPersonalForm({
      first_name: profile?.first_name ?? "",
      middle_name: profile?.middle_name ?? "",
      last_name: profile?.last_name ?? "",
      date_of_birth: profile?.date_of_birth ?? "",
    });
    setIsEditingPersonal(false);
  };

  const handleSaveOrg = async () => {
    if (!department) return;
    setIsSavingOrg(true);
    try {
      const updated = await updateDepartment(department.id, {
        description: orgForm.description || null,
      });
      setDepartment(updated);
      setIsEditingOrg(false);
      showToast("success", "Department Updated", "Department information has been saved.");
    } catch {
      showToast("error", "Update Failed", "Could not save department info. Please try again.");
    } finally {
      setIsSavingOrg(false);
    }
  };

  const handleCancelOrg = () => {
    setOrgForm({ description: department?.description ?? "" });
    setIsEditingOrg(false);
  };

  const handleLogoUpload = async (file: File) => {
    if (!department) return;
    setIsUploadingLogo(true);
    try {
      if (department.logo_url) await deleteLogo(department.logo_url);
      const url = await uploadLogo(file, "departments", department.id);
      const updated = await updateDepartment(department.id, { logo_url: url });
      setDepartment(updated);
      showToast("success", "Logo Updated", "Department logo has been changed.");
    } catch {
      showToast("error", "Upload Failed", "Could not update the logo. Please try again.");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="My Profile" subtitle="Manage your account settings" />

      <div className="p-6 space-y-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Organisation Card */}
          <div className="lg:col-span-1">
            <Card padding="lg" className="text-center">
              {/* Department Logo */}
              <div className="relative inline-block mb-4">
                {department?.logo_url ? (
                  <img
                    src={department.logo_url}
                    alt={department.name}
                    className="w-24 h-24 rounded-xl object-cover mx-auto cursor-pointer shadow"
                    onClick={() => department.logo_url && setPreviewUrl(department.logo_url)}
                  />
                ) : (
                  <div className="w-24 h-24 rounded-xl bg-cjc-navy/10 flex items-center justify-center mx-auto">
                    <GraduationCap className="w-12 h-12 text-cjc-navy/40" />
                  </div>
                )}
                <label
                  htmlFor="logo-upload"
                  className={cn(
                    "absolute bottom-0 right-0 w-8 h-8 rounded-full bg-cjc-gold flex items-center justify-center text-white shadow-lg cursor-pointer hover:bg-cjc-gold/80 transition-colors",
                    isUploadingLogo && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {isUploadingLogo
                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <Camera className="w-4 h-4" />
                  }
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    className="hidden"
                    disabled={isUploadingLogo || isLoadingOrg}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleLogoUpload(file);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>

              {isLoadingOrg ? (
                <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mx-auto mb-2" />
              ) : (
                <h2 className="text-xl font-semibold text-cjc-navy">
                  {department?.name ?? "No Department Linked"}
                </h2>
              )}
              {department?.code && (
                <p className="text-gray-500 font-mono text-sm mt-1">{department.code}</p>
              )}
              <Badge
                variant={department?.status === "active" ? "success" : "neutral"}
                className="mt-3"
              >
                {department?.status === "active" ? "Active" : "Inactive"}
              </Badge>

              <div className="mt-6 pt-6 border-t border-gray-100 text-left">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Role</p>
                <Badge variant="info">Department Head</Badge>
              </div>
            </Card>
          </div>

          {/* Right panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card padding="lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-cjc-gold" />
                  Personal Information
                </CardTitle>
                {isEditingPersonal ? (
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={handleCancelPersonal}>
                      <X className="w-4 h-4" /> Cancel
                    </Button>
                    <Button variant="primary" size="sm" onClick={handleSavePersonal} isLoading={isSavingPersonal}>
                      <Save className="w-4 h-4" /> Save Changes
                    </Button>
                  </div>
                ) : (
                  <Button variant="secondary" size="sm" onClick={() => setIsEditingPersonal(true)}>
                    <Edit2 className="w-4 h-4" /> Edit
                  </Button>
                )}
              </CardHeader>

              <div className="flex items-center gap-4 mb-6">
                <div className="relative inline-block">
                  <Avatar
                    src={profile?.avatar_url ?? undefined}
                    name={`${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`}
                    size="xl"
                    variant="primary"
                    className={cn("w-16 h-16 text-xl", profile?.avatar_url && "cursor-pointer")}
                    onClick={() => profile?.avatar_url && setPreviewUrl(profile.avatar_url)}
                  />
                  <label
                    htmlFor="avatar-upload"
                    className={cn(
                      "absolute bottom-0 right-0 w-6 h-6 rounded-full bg-cjc-gold flex items-center justify-center text-white shadow cursor-pointer hover:bg-cjc-gold/80 transition-colors",
                      isUploadingAvatar && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {isUploadingAvatar
                      ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : <Camera className="w-3 h-3" />
                    }
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      className="hidden"
                      disabled={isUploadingAvatar}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleAvatarUpload(file);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
                <div>
                  <p className="font-semibold text-cjc-navy">
                    {profile?.first_name}
                    {profile?.middle_name ? ` ${profile.middle_name[0]}.` : ""}{" "}
                    {profile?.last_name}
                  </p>
                  <p className="text-sm text-gray-500">{profile?.email}</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  value={personalForm.first_name}
                  onChange={(e) => setPersonalForm(prev => ({ ...prev, first_name: e.target.value }))}
                  disabled={!isEditingPersonal}
                />
                <Input
                  label="Middle Name"
                  value={personalForm.middle_name}
                  onChange={(e) => setPersonalForm(prev => ({ ...prev, middle_name: e.target.value }))}
                  disabled={!isEditingPersonal}
                />
                <Input
                  label="Last Name"
                  value={personalForm.last_name}
                  onChange={(e) => setPersonalForm(prev => ({ ...prev, last_name: e.target.value }))}
                  disabled={!isEditingPersonal}
                />
                <Input
                  label="Email Address"
                  type="email"
                  value={profile?.email ?? ""}
                  disabled={true}
                  helperText="Contact admin to change your email address."
                />
                <Input
                  label="Date of Birth"
                  type="date"
                  value={personalForm.date_of_birth}
                  onChange={(e) => setPersonalForm(prev => ({ ...prev, date_of_birth: e.target.value }))}
                  disabled={!isEditingPersonal}
                />
              </div>
            </Card>

            {/* Department Information */}
            <Card padding="lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-cjc-gold" />
                  Department Information
                </CardTitle>
                {isEditingOrg ? (
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={handleCancelOrg}>
                      <X className="w-4 h-4" /> Cancel
                    </Button>
                    <Button variant="primary" size="sm" onClick={handleSaveOrg} isLoading={isSavingOrg}>
                      <Save className="w-4 h-4" /> Save Changes
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsEditingOrg(true)}
                    disabled={!department}
                  >
                    <Edit2 className="w-4 h-4" /> Edit
                  </Button>
                )}
              </CardHeader>

              {isLoadingOrg ? (
                <div className="space-y-3">
                  <div className="h-10 bg-gray-100 rounded animate-pulse" />
                  <div className="h-10 bg-gray-100 rounded animate-pulse" />
                  <div className="h-20 bg-gray-100 rounded animate-pulse" />
                </div>
              ) : department ? (
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input
                    label="Department Name"
                    value={department.name}
                    disabled={true}
                    helperText="Contact admin to change the name."
                  />
                  <Input
                    label="Department Code"
                    value={department.code}
                    disabled={true}
                    helperText="Contact admin to change the code."
                  />
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      className={cn(
                        "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-cjc-gold/50 focus:border-cjc-gold transition-colors",
                        !isEditingOrg && "bg-gray-50 text-gray-500 cursor-not-allowed"
                      )}
                      rows={3}
                      value={orgForm.description}
                      onChange={(e) => setOrgForm({ description: e.target.value })}
                      disabled={!isEditingOrg}
                      placeholder="Enter department description..."
                    />
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No department linked to your account.</p>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setPreviewUrl(null)}
        >
          <div className="relative max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <img
              src={previewUrl}
              alt="Preview"
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
    </div>
  );
}
