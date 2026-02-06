"use client";

import { useState, useEffect } from "react";
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
  Loader2,
} from "lucide-react";
import { supabase, Profile } from "@/lib/supabase";

interface UserWithStatus extends Profile {
  status: "active" | "inactive";
}

export default function AdminUsersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [users, setUsers] = useState<UserWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch users from Supabase
  useEffect(() => {
    async function fetchUsers() {
      try {
        setIsLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false });

        if (fetchError) {
          throw fetchError;
        }

        // Add status field (all users are active for now)
        const usersWithStatus = (data || []).map((user) => ({
          ...user,
          status: "active" as const,
        }));

        setUsers(usersWithStatus);
      } catch (err) {
        console.error("Error fetching users:", err);
        setError("Failed to load users. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchUsers();
  }, []);

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin": return "danger";
      case "office": return "success";
      case "department": return "info";
      case "club": return "gold";
      default: return "pending";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "office": return "Office";
      case "department": return "Department";
      case "club": return "Club";
      default: return role.charAt(0).toUpperCase() + role.slice(1);
    }
  };

  const filteredUsers = users.filter((user) => {
    const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = !roleFilter || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const roleOptions = [
    { value: "", label: "All Roles" },
    { value: "student", label: "Student" },
    { value: "office", label: "Office" },
    { value: "department", label: "Department" },
    { value: "club", label: "Club" },
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
            <p className="text-2xl font-bold text-cjc-navy">
              {isLoading ? "..." : users.length}
            </p>
            <p className="text-sm text-gray-500">Total Users</p>
          </Card>
          <Card padding="sm" className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {isLoading ? "..." : users.filter(u => u.role === "student").length}
            </p>
            <p className="text-sm text-gray-500">Students</p>
          </Card>
          <Card padding="sm" className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {isLoading ? "..." : users.filter(u => u.role === "office").length}
            </p>
            <p className="text-sm text-gray-500">Offices</p>
          </Card>
          <Card padding="sm" className="text-center">
            <p className="text-2xl font-bold text-amber-600">
              {isLoading ? "..." : users.filter(u => u.role === "department" || u.role === "club").length}
            </p>
            <p className="text-sm text-gray-500">Dept/Clubs</p>
          </Card>
          <Card padding="sm" className="text-center">
            <p className="text-2xl font-bold text-red-600">
              {isLoading ? "..." : users.filter(u => u.role === "admin").length}
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
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-cjc-navy animate-spin" />
              <span className="ml-3 text-gray-600">Loading users...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12 text-red-500">
              {error}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => {
                    const fullName = `${user.first_name} ${user.last_name}`;
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar name={fullName} size="sm" variant="primary" />
                            <div>
                              <p className="font-medium text-cjc-navy">{fullName}</p>
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
                          <span className="text-sm">{user.department || "-"}</span>
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
                            {new Date(user.created_at).toLocaleDateString()}
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
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
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
