export type UserRole = "student" | "office" | "department" | "club" | "admin";

export type ClearanceStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "on_hold"
  | "in_progress"
  | "completed";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  role: UserRole;
  avatar?: string;
  studentId?: string;
  course?: string;
  yearLevel?: string;
  department?: string;
  position?: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description: string;
  head?: string;
  icon?: string;
}

export interface Office {
  id: string;
  name: string;
  code: string;
  description: string;
  head?: string;
  icon?: string;
}

export interface AcademicOrganization {
  id: string;
  name: string;
  code: string;
  description: string;
  adviser?: string;
  department?: string; // Which department it belongs to (e.g., CCIS)
}

export interface NonAcademicOrganization {
  id: string;
  name: string;
  code: string;
  description: string;
  adviser?: string;
}

export interface ClearanceItem {
  id: string;
  departmentId: string;
  departmentName: string;
  status: ClearanceStatus;
  approvedBy?: string;
  approvedAt?: string;
  remarks?: string;
  requirements?: string[];
}

export interface ClearanceRequest {
  id: string;
  studentId: string;
  studentName: string;
  studentCourse: string;
  studentYear: string;
  academicYear: string;
  semester: string;
  type: "semester" | "graduation" | "transfer";
  status: ClearanceStatus;
  progress: number;
  items: ClearanceItem[];
  createdAt: string;
  updatedAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  author: string;
  priority: "low" | "normal" | "high" | "urgent";
  createdAt: string;
  expiresAt?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  isRead: boolean;
  createdAt: string;
  link?: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  details: string;
  targetType?: string;
  targetId?: string;
  createdAt: string;
}

export interface DashboardStats {
  totalStudents: number;
  pendingRequests: number;
  approvedToday: number;
  completionRate: number;
}

export type ClearanceSourceType = "department" | "office" | "club";

export type RequirementSubmissionStatus = "pending" | "submitted" | "verified" | "rejected";

export interface Requirement {
  id: string;
  sourceType: ClearanceSourceType;
  sourceId: string;
  name: string;
  description?: string;
  isRequired: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface RequirementSubmission {
  id: string;
  clearanceItemId: string;
  requirementId: string;
  studentId: string;
  fileUrl?: string;
  status: RequirementSubmissionStatus;
  remarks?: string;
  submittedAt?: string;
  reviewedAt?: string;
}
