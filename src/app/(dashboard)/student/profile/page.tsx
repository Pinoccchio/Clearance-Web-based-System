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
  Mail,
  GraduationCap,
  Building2,
  Edit2,
  Save,
  Camera,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { uploadAvatar, deleteAvatar } from "@/lib/storage";
import { updateProfile } from "@/lib/supabase";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

export default function StudentProfilePage() {
  const { profile, user, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    first_name: profile?.first_name ?? "",
    middle_name: profile?.middle_name ?? "",
    last_name: profile?.last_name ?? "",
    email: profile?.email ?? "",
    date_of_birth: profile?.date_of_birth ?? "",
  });

  useEffect(() => {
    setFormData({
      first_name: profile?.first_name ?? "",
      middle_name: profile?.middle_name ?? "",
      last_name: profile?.last_name ?? "",
      email: profile?.email ?? "",
      date_of_birth: profile?.date_of_birth ?? "",
    });
  }, [profile]);

  const refresh = useCallback(() => { refreshProfile(); }, [refreshProfile]);
  useRealtimeRefresh('profiles', refresh);

  const handleAvatarUpload = async (file: File) => {
    if (!user) return;
    setIsUploadingAvatar(true);
    try {
      if (profile?.avatar_url) {
        await deleteAvatar(profile.avatar_url);
      }
      const url = await uploadAvatar(file, user.id);
      await updateProfile(user.id, { avatar_url: url });
      await refreshProfile();
      showToast("success", "Avatar Updated", "Your profile photo has been changed.");
    } catch (err) {
      showToast("error", "Upload Failed", "Could not update your avatar. Please try again.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await updateProfile(user.id, {
        first_name: formData.first_name,
        middle_name: formData.middle_name || null,
        last_name: formData.last_name,
        date_of_birth: formData.date_of_birth || null,
      });
      await refreshProfile();
      setIsEditing(false);
      showToast("success", "Profile Updated", "Your personal information has been saved.");
    } catch (err) {
      showToast("error", "Update Failed", "Could not save your profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      first_name: profile?.first_name ?? "",
      middle_name: profile?.middle_name ?? "",
      last_name: profile?.last_name ?? "",
      email: profile?.email ?? "",
      date_of_birth: profile?.date_of_birth ?? "",
    });
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="My Profile"
        subtitle="Manage your account settings"
      />

      <div className="p-6 space-y-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card padding="lg" className="text-center">
              <div className="relative inline-block mb-4">
                <Avatar
                  src={profile?.avatar_url ?? undefined}
                  name={`${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`}
                  size="xl"
                  variant="primary"
                  className={cn("w-24 h-24 text-2xl", profile?.avatar_url && "cursor-pointer")}
                  onClick={() => profile?.avatar_url && setPreviewUrl(profile.avatar_url)}
                />
                <label
                  htmlFor="avatar-upload"
                  className={cn(
                    "absolute bottom-0 right-0 w-8 h-8 rounded-full bg-cjc-gold flex items-center justify-center text-white shadow-lg cursor-pointer hover:bg-cjc-gold/80 transition-colors",
                    isUploadingAvatar && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {isUploadingAvatar
                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <Camera className="w-4 h-4" />
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
              <h2 className="text-xl font-semibold text-cjc-navy">
                {profile?.first_name}
                {profile?.middle_name ? ` ${profile.middle_name[0]}.` : ""}{" "}
                {profile?.last_name}
              </h2>
              <p className="text-gray-500 font-mono text-sm mt-1">{profile?.student_id}</p>
              <Badge variant="info" className="mt-3">Student</Badge>

              <div className="mt-6 pt-6 border-t border-gray-100 space-y-3 text-left">
                <div className="flex items-center gap-3">
                  <GraduationCap className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-600">{profile?.course ?? "—"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {profile?.year_level ? `Year ${profile.year_level}` : "—"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-600">{profile?.email ?? "—"}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card padding="lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-cjc-gold" />
                  Personal Information
                </CardTitle>
                {isEditing ? (
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={handleCancel}>
                      <X className="w-4 h-4" /> Cancel
                    </Button>
                    <Button variant="primary" size="sm" onClick={handleSaveProfile} isLoading={isSaving}>
                      <Save className="w-4 h-4" /> Save Changes
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </Button>
                )}
              </CardHeader>

              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  value={formData.first_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                  disabled={!isEditing}
                />
                <Input
                  label="Middle Name"
                  value={formData.middle_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, middle_name: e.target.value }))}
                  disabled={!isEditing}
                />
                <Input
                  label="Last Name"
                  value={formData.last_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                  disabled={!isEditing}
                />
                <Input
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  disabled={true}
                  helper="Contact admin to change your email address."
                />
                <Input
                  label="Date of Birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                  disabled={!isEditing}
                />
              </div>
            </Card>

            {/* Academic Information */}
            <Card padding="lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-cjc-gold" />
                  Academic Information
                </CardTitle>
              </CardHeader>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-gray-50">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Student ID</p>
                  <p className="font-medium text-cjc-navy font-mono">{profile?.student_id ?? "—"}</p>
                </div>
                <div className="p-4 rounded-lg bg-gray-50">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Course</p>
                  <p className="font-medium text-cjc-navy">{profile?.course ?? "—"}</p>
                </div>
                <div className="p-4 rounded-lg bg-gray-50">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Year Level</p>
                  <p className="font-medium text-cjc-navy">
                    {profile?.year_level ? `Year ${profile.year_level}` : "—"}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-gray-50">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Department</p>
                  <p className="font-medium text-cjc-navy">{profile?.department ?? "—"}</p>
                </div>
              </div>
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
