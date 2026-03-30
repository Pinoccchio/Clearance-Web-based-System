"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  GraduationCap,
  Building2,
  UsersRound,
  Loader2,
  RefreshCw,
  AlertCircle,
  ArrowRight,
  Settings,
  Megaphone,
  Shield,
  UserCog,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useRealtimeRefresh } from "@/lib/useRealtimeRefresh";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import {
  getAllProfiles,
  getAllDepartments,
  getAllOffices,
  getAllClubs,
  getAllCsgDepartmentLgus,
  getAllCspsgDivisions,
  getSystemSettings,
  getAllAnnouncements,
  SystemSettings,
  Profile,
  DepartmentWithHead,
  OfficeWithHead,
  ClubWithAdviser,
  CsgDepartmentLguWithHead,
  CspsgDivisionWithHead,
} from "@/lib/supabase";

interface AdminStats {
  totalUsers: number;
  students: number;
  departments: number;
  departmentHeads: number;
  offices: number;
  officeHeads: number;
  clubs: number;
  clubAdvisers: number;
  csgLguHeads: number;
  cspsgDivisionHeads: number;
  csgDepartmentLgus: number;
  cspsgDivisions: number;
  admins: number;
  activeAnnouncements: number;
}

function getRoleBadge(role: string) {
  switch (role) {
    case "admin":
      return <Badge variant="danger" size="sm"><Shield className="w-3 h-3" /> Admin</Badge>;
    case "student":
      return <Badge variant="success" size="sm"><GraduationCap className="w-3 h-3" /> Student</Badge>;
    case "department":
      return <Badge variant="pending" size="sm"><Building2 className="w-3 h-3" /> Dept Head</Badge>;
    case "office":
      return <Badge variant="warning" size="sm"><Building2 className="w-3 h-3" /> Office Head</Badge>;
    case "club":
      return <Badge variant="neutral" size="sm"><UsersRound className="w-3 h-3" /> Club Adviser</Badge>;
    case "csg":
      return <Badge variant="warning" size="sm"><Shield className="w-3 h-3" /> CSG</Badge>;
    case "csg_department_lgu":
      return <Badge variant="info" size="sm"><Shield className="w-3 h-3" /> LGU</Badge>;
    case "cspsg":
      return <Badge variant="pending" size="sm"><GraduationCap className="w-3 h-3" /> CSPSG</Badge>;
    case "cspsg_division":
      return <Badge variant="neutral" size="sm"><GraduationCap className="w-3 h-3" /> CSPSG Div</Badge>;
    default:
      return <Badge variant="neutral" size="sm">{role}</Badge>;
  }
}

export default function AdminDashboard() {
  const { profile: authProfile, isLoading: authLoading } = useAuth();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    students: 0,
    departments: 0,
    departmentHeads: 0,
    offices: 0,
    officeHeads: 0,
    clubs: 0,
    clubAdvisers: 0,
    csgLguHeads: 0,
    cspsgDivisionHeads: 0,
    csgDepartmentLgus: 0,
    cspsgDivisions: 0,
    admins: 0,
    activeAnnouncements: 0,
  });
  const [recentUsers, setRecentUsers] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try {
      setError(null);

      // Parallel fetch all data
      const [profiles, departments, offices, clubs, csgDepartmentLgusData, cspsgDivisionsData, announcements, settingsData] = await Promise.all([
        getAllProfiles(),
        getAllDepartments(),
        getAllOffices(),
        getAllClubs(),
        getAllCsgDepartmentLgus(),
        getAllCspsgDivisions(),
        getAllAnnouncements(),
        getSystemSettings(),
      ]);

      setSettings(settingsData);

      // Count users by role
      let students = 0;
      let departmentHeads = 0;
      let officeHeads = 0;
      let clubAdvisers = 0;
      let csgLguHeads = 0;
      let cspsgDivisionHeads = 0;
      let admins = 0;

      for (const user of profiles) {
        switch (user.role) {
          case "student":
            students++;
            break;
          case "department":
            departmentHeads++;
            break;
          case "office":
            officeHeads++;
            break;
          case "club":
            clubAdvisers++;
            break;
          case "csg_department_lgu":
            csgLguHeads++;
            break;
          case "cspsg_division":
            cspsgDivisionHeads++;
            break;
          case "admin":
            admins++;
            break;
        }
      }

      // Count active entities (status === "active")
      const activeDepartments = departments.filter((d) => d.status === "active").length;
      const activeOffices = offices.filter((o) => o.status === "active").length;
      const activeClubs = clubs.filter((c) => c.status === "active").length;
      const activeCsgDepartmentLgus = csgDepartmentLgusData.filter((l) => l.status === "active").length;
      const activeCspsgDivisions = cspsgDivisionsData.filter((d) => d.status === "active").length;

      // Count active announcements (not expired)
      const now = new Date();
      const activeAnnouncements = announcements.filter((a) => {
        if (!a.expires_at) return true;
        return new Date(a.expires_at) > now;
      }).length;

      setStats({
        totalUsers: profiles.length,
        students,
        departments: activeDepartments,
        departmentHeads,
        offices: activeOffices,
        officeHeads,
        clubs: activeClubs,
        clubAdvisers,
        csgLguHeads,
        cspsgDivisionHeads,
        csgDepartmentLgus: activeCsgDepartmentLgus,
        cspsgDivisions: activeCspsgDivisions,
        admins,
        activeAnnouncements,
      });

      // Get 5 most recently created users
      const sortedUsers = [...profiles]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

      setRecentUsers(sortedUsers);
    } catch (err) {
      console.error("Error loading admin stats:", err);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    loadStats();
  }, [authLoading, loadStats]);

  // Real-time updates
  useRealtimeRefresh("profiles", loadStats);
  useRealtimeRefresh("departments", loadStats);
  useRealtimeRefresh("offices", loadStats);
  useRealtimeRefresh("clubs", loadStats);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadStats();
  };

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-surface-warm">
        <header className="bg-white border-b border-border-warm">
          <div className="px-6 py-5">
            <p className="text-sm text-warm-muted">System Administration</p>
            <h1 className="text-2xl font-display font-bold text-cjc-navy">
              Admin Dashboard
            </h1>
          </div>
        </header>
        <div className="flex items-center justify-center p-16">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-surface-warm">
        <header className="bg-white border-b border-border-warm">
          <div className="px-6 py-5">
            <p className="text-sm text-warm-muted">System Administration</p>
            <h1 className="text-2xl font-display font-bold text-cjc-navy">
              Admin Dashboard
            </h1>
          </div>
        </header>
        <div className="flex items-center justify-center p-12">
          <Card padding="lg" className="text-center max-w-sm w-full">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-cjc-navy mb-1">Error Loading Dashboard</h3>
            <p className="text-sm text-gray-500 mb-4">{error}</p>
            <Button variant="secondary" onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-warm">
      <header className="bg-white border-b border-border-warm">
        <div className="px-6 py-5 flex items-start justify-between">
          <div>
            <p className="text-sm text-warm-muted">System Administration</p>
            <h1 className="text-2xl font-display font-bold text-cjc-navy">
              Admin Dashboard
            </h1>
            {settings && (
              <p className="text-xs text-gray-400 mt-1">
                {settings.current_semester} Semester, A.Y. {settings.academic_year}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="mt-1"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="card p-4 text-center">
            <Users className="w-8 h-8 text-cjc-blue mx-auto mb-2" />
            <p className="text-2xl font-bold text-cjc-navy">{stats.totalUsers}</p>
            <p className="text-sm text-warm-muted">Total Users</p>
          </div>
          <div className="card p-4 text-center">
            <GraduationCap className="w-8 h-8 text-cjc-red mx-auto mb-2" />
            <p className="text-2xl font-bold text-cjc-navy">{stats.departments}</p>
            <p className="text-sm text-warm-muted">Departments</p>
          </div>
          <div className="card p-4 text-center">
            <Building2 className="w-8 h-8 text-success mx-auto mb-2" />
            <p className="text-2xl font-bold text-cjc-navy">{stats.offices}</p>
            <p className="text-sm text-warm-muted">Offices</p>
          </div>
          <div className="card p-4 text-center">
            <UsersRound className="w-8 h-8 text-pending mx-auto mb-2" />
            <p className="text-2xl font-bold text-cjc-navy">{stats.clubs}</p>
            <p className="text-sm text-warm-muted">Clubs</p>
          </div>
        </div>

        {/* System Overview */}
        <Card padding="md">
          <CardHeader>
            <CardTitle>System Overview</CardTitle>
          </CardHeader>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
            <div className="flex items-center gap-3 p-2 sm:p-3 bg-green-50 rounded-lg">
              <GraduationCap className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-lg font-bold text-green-700">{stats.students}</p>
                <p className="text-xs text-green-600">Students</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-2 sm:p-3 bg-cjc-blue/5 rounded-lg">
              <Building2 className="w-5 h-5 text-cjc-blue" />
              <div>
                <p className="text-lg font-bold text-cjc-navy">{stats.departmentHeads}</p>
                <p className="text-xs text-cjc-blue">Dept Heads</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-2 sm:p-3 bg-amber-50 rounded-lg">
              <Building2 className="w-5 h-5 text-amber-600" />
              <div>
                <p className="text-lg font-bold text-amber-700">{stats.officeHeads}</p>
                <p className="text-xs text-amber-600">Office Heads</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-2 sm:p-3 bg-purple-50 rounded-lg">
              <UsersRound className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-lg font-bold text-purple-700">{stats.clubAdvisers}</p>
                <p className="text-xs text-purple-600">Club Advisers</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-2 sm:p-3 bg-indigo-50 rounded-lg">
              <Shield className="w-5 h-5 text-indigo-600" />
              <div>
                <p className="text-lg font-bold text-indigo-700">{stats.csgLguHeads}</p>
                <p className="text-xs text-indigo-600">LGU Heads</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-2 sm:p-3 bg-teal-50 rounded-lg">
              <GraduationCap className="w-5 h-5 text-teal-600" />
              <div>
                <p className="text-lg font-bold text-teal-700">{stats.cspsgDivisionHeads}</p>
                <p className="text-xs text-teal-600">CSPSG Div Heads</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-2 sm:p-3 bg-red-50 rounded-lg">
              <Shield className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-lg font-bold text-red-700">{stats.admins}</p>
                <p className="text-xs text-red-600">Admins</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-2 sm:p-3 bg-cyan-50 rounded-lg">
              <Megaphone className="w-5 h-5 text-cyan-600" />
              <div>
                <p className="text-lg font-bold text-cyan-700">{stats.activeAnnouncements}</p>
                <p className="text-xs text-cyan-600">Announcements</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Recent Users */}
        <Card padding="md">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Recently Added Users</CardTitle>
            <Link href="/admin/users">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          {recentUsers.length > 0 ? (
            <div className="space-y-3">
              {recentUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between gap-2 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar
                      src={user.avatar_url ?? undefined}
                      name={`${user.first_name} ${user.last_name}`}
                      size="sm"
                      variant="primary"
                    />
                    <div className="min-w-0">
                      <p className="font-medium text-cjc-navy text-sm truncate">
                        {user.first_name} {user.last_name}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {user.email} • {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0">{getRoleBadge(user.role)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No users found</p>
            </div>
          )}
        </Card>

        {/* Footer */}
        <div className="flex flex-wrap gap-2 justify-center text-sm text-warm-muted">
          <span className="px-3 py-1 bg-white border border-gray-200 rounded-full">
            System Admin
          </span>
          <span className="px-3 py-1 bg-white border border-gray-200 rounded-full">
            {stats.totalUsers} Users
          </span>
          <span className="px-3 py-1 bg-white border border-gray-200 rounded-full">
            {stats.departments + stats.offices + stats.clubs + stats.csgDepartmentLgus + stats.cspsgDivisions} Entities
          </span>
        </div>
      </div>
    </div>
  );
}
