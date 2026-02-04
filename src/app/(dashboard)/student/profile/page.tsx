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
  Phone,
  MapPin,
  Calendar,
  GraduationCap,
  Building2,
  Edit2,
  Save,
  Bell,
  Shield,
  Camera,
} from "lucide-react";
import { mockUsers } from "@/lib/mock-data";

export default function StudentProfilePage() {
  const user = mockUsers.student;
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
                  name={`${user.firstName} ${user.lastName}`}
                  size="xl"
                  variant="primary"
                  className="w-24 h-24 text-2xl"
                />
                <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-cjc-gold flex items-center justify-center text-white shadow-lg">
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <h2 className="text-xl font-semibold text-cjc-navy">
                {user.firstName} {user.middleName?.[0]}. {user.lastName}
              </h2>
              <p className="text-gray-500 font-mono text-sm mt-1">{user.studentId}</p>
              <Badge variant="info" className="mt-3">Student</Badge>

              <div className="mt-6 pt-6 border-t border-gray-100 space-y-3 text-left">
                <div className="flex items-center gap-3">
                  <GraduationCap className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-600">{user.course}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-600">{user.yearLevel}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-600">{user.email}</span>
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
                  defaultValue={user.firstName}
                  disabled={!isEditing}
                />
                <Input
                  label="Middle Name"
                  defaultValue={user.middleName || ""}
                  disabled={!isEditing}
                />
                <Input
                  label="Last Name"
                  defaultValue={user.lastName}
                  disabled={!isEditing}
                />
                <Input
                  label="Email Address"
                  type="email"
                  defaultValue={user.email}
                  disabled={!isEditing}
                />
                <Input
                  label="Phone Number"
                  type="tel"
                  defaultValue="09123456789"
                  disabled={!isEditing}
                />
                <Input
                  label="Date of Birth"
                  type="date"
                  defaultValue="2002-05-15"
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
                  <p className="font-medium text-cjc-navy font-mono">{user.studentId}</p>
                </div>
                <div className="p-4 rounded-lg bg-gray-50">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Course</p>
                  <p className="font-medium text-cjc-navy">{user.course}</p>
                </div>
                <div className="p-4 rounded-lg bg-gray-50">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Year Level</p>
                  <p className="font-medium text-cjc-navy">{user.yearLevel}</p>
                </div>
                <div className="p-4 rounded-lg bg-gray-50">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Section</p>
                  <p className="font-medium text-cjc-navy">A</p>
                </div>
              </div>
            </Card>

            {/* Security */}
            <Card padding="lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-cjc-gold" />
                  Security
                </CardTitle>
              </CardHeader>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border border-gray-100">
                  <div>
                    <p className="font-medium text-cjc-navy">Password</p>
                    <p className="text-sm text-gray-500">Last changed 30 days ago</p>
                  </div>
                  <Button variant="secondary" size="sm">Change Password</Button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-gray-100">
                  <div>
                    <p className="font-medium text-cjc-navy">Two-Factor Authentication</p>
                    <p className="text-sm text-gray-500">Add an extra layer of security</p>
                  </div>
                  <Badge variant="neutral">Not Enabled</Badge>
                </div>
              </div>
            </Card>

            {/* Notifications */}
            <Card padding="lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-cjc-gold" />
                  Notification Preferences
                </CardTitle>
              </CardHeader>

              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 rounded-lg border border-gray-100 cursor-pointer">
                  <div>
                    <p className="font-medium text-cjc-navy">Email Notifications</p>
                    <p className="text-sm text-gray-500">Receive updates via email</p>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-5 h-5 rounded border-gray-300 text-cjc-blue focus:ring-cjc-blue"
                  />
                </label>

                <label className="flex items-center justify-between p-4 rounded-lg border border-gray-100 cursor-pointer">
                  <div>
                    <p className="font-medium text-cjc-navy">Clearance Updates</p>
                    <p className="text-sm text-gray-500">Get notified when clearance status changes</p>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-5 h-5 rounded border-gray-300 text-cjc-blue focus:ring-cjc-blue"
                  />
                </label>

                <label className="flex items-center justify-between p-4 rounded-lg border border-gray-100 cursor-pointer">
                  <div>
                    <p className="font-medium text-cjc-navy">Announcement Alerts</p>
                    <p className="text-sm text-gray-500">Receive important announcements</p>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-5 h-5 rounded border-gray-300 text-cjc-blue focus:ring-cjc-blue"
                  />
                </label>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
