"use client";

import { useState } from "react";
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
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

export default function StudentProfilePage() {
  const { profile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

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
                  name={`${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`}
                  size="xl"
                  variant="primary"
                  className="w-24 h-24 text-2xl"
                />
                <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-cjc-gold flex items-center justify-center text-white shadow-lg">
                  <Camera className="w-4 h-4" />
                </button>
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
                <Button
                  variant={isEditing ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  ) : (
                    <>
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </>
                  )}
                </Button>
              </CardHeader>

              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  defaultValue={profile?.first_name ?? ""}
                  disabled={!isEditing}
                />
                <Input
                  label="Middle Name"
                  defaultValue={profile?.middle_name ?? ""}
                  disabled={!isEditing}
                />
                <Input
                  label="Last Name"
                  defaultValue={profile?.last_name ?? ""}
                  disabled={!isEditing}
                />
                <Input
                  label="Email Address"
                  type="email"
                  defaultValue={profile?.email ?? ""}
                  disabled={!isEditing}
                />
                <Input
                  label="Date of Birth"
                  type="date"
                  defaultValue={profile?.date_of_birth ?? ""}
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
    </div>
  );
}
