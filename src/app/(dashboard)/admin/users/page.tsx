"use client";

import { useState } from "react";
import Header from "@/components/layout/header";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import {
  Users,
  Search,
  Plus,
  Filter,
  MoreVertical,
  Edit2,
  Trash2,
  Shield,
  UserCheck,
  UserX,
} from "lucide-react";

export default function AdminUsersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const users = [
    { id: "1", name: "Juan Dela Cruz", email: "juan@cjc.edu.ph", role: "student", status: "active", department: "CCIS", lastActive: "2025-01-20" },
    { id: "2", name: "Maria Santos", email: "maria.santos@cjc.edu.ph", role: "office", status: "active", department: "Library", lastActive: "2025-01-20" },
    { id: "3", name: "Pedro Reyes", email: "pedro.reyes@cjc.edu.ph", role: "office", status: "active", department: "Finance Office", lastActive: "2025-01-19" },
    { id: "4", name: "Ana Garcia", email: "ana.garcia@cjc.edu.ph", role: "non-academic-club", status: "active", department: "SSC", lastActive: "2025-01-20" },
    { id: "5", name: "Jose Reyes", email: "jose.reyes@cjc.edu.ph", role: "academic-club", status: "active", department: "IT Society", lastActive: "2025-01-18" },
    { id: "6", name: "Admin User", email: "admin@cjc.edu.ph", role: "admin", status: "active", department: "IT Office", lastActive: "2025-01-20" },
    { id: "7", name: "Mark Tan", email: "mark.tan@cjc.edu.ph", role: "student", status: "inactive", department: "CCIS", lastActive: "2024-12-15" },
    { id: "8", name: "Anna Cruz", email: "anna.cruz@cjc.edu.ph", role: "non-academic-club", status: "active", department: "Red Cross Youth", lastActive: "2025-01-19" },
  ];

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin": return "danger";
      case "office": return "success";
      case "academic-club": return "info";
      case "non-academic-club": return "gold";
      default: return "pending";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "office": return "Office";
      case "academic-club": return "Academic Club";
      case "non-academic-club": return "Non-Academic Club";
      default: return role.charAt(0).toUpperCase() + role.slice(1);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = !roleFilter || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const roleOptions = [
    { value: "", label: "All Roles" },
    { value: "student", label: "Student" },
    { value: "office", label: "Office" },
    { value: "academic-club", label: "Academic Club" },
    { value: "non-academic-club", label: "Non-Academic Club" },
    { value: "admin", label: "Admin" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="User Management"
        subtitle="Manage system users and permissions"
      />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <Card padding="sm" className="text-center">
            <p className="text-2xl font-bold text-cjc-navy">{users.length}</p>
            <p className="text-sm text-gray-500">Total Users</p>
          </Card>
          <Card padding="sm" className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {users.filter(u => u.role === "student").length}
            </p>
            <p className="text-sm text-gray-500">Students</p>
          </Card>
          <Card padding="sm" className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {users.filter(u => u.role === "office").length}
            </p>
            <p className="text-sm text-gray-500">Offices</p>
          </Card>
          <Card padding="sm" className="text-center">
            <p className="text-2xl font-bold text-amber-600">
              {users.filter(u => u.role === "academic-club" || u.role === "non-academic-club").length}
            </p>
            <p className="text-sm text-gray-500">Clubs</p>
          </Card>
          <Card padding="sm" className="text-center">
            <p className="text-2xl font-bold text-red-600">
              {users.filter(u => u.role === "admin").length}
            </p>
            <p className="text-sm text-gray-500">Admins</p>
          </Card>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
          <div className="w-48">
            <Select
              options={roleOptions}
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            />
          </div>
          <Button variant="gold">
            <Plus className="w-4 h-4" />
            Add User
          </Button>
        </div>

        {/* Users Table */}
        <Card padding="none">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar name={user.name} size="sm" variant="primary" />
                      <div>
                        <p className="font-medium text-cjc-navy">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(user.role)} size="sm">
                      {getRoleLabel(user.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{user.department}</span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={user.status === "active" ? "success" : "neutral"}
                      size="sm"
                    >
                      {user.status === "active" ? (
                        <UserCheck className="w-3 h-3" />
                      ) : (
                        <UserX className="w-3 h-3" />
                      )}
                      <span className="capitalize">{user.status}</span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-500">
                      {new Date(user.lastActive).toLocaleDateString()}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4 text-gray-500" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <Shield className="w-4 h-4 text-gray-500" />
                      </button>
                      <button className="p-2 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {filteredUsers.length} of {users.length} users
          </p>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" disabled>Previous</Button>
            <Button variant="secondary" size="sm">Next</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
