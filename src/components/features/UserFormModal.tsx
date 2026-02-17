"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Eye, EyeOff, UserPlus, UserCog } from "lucide-react";
import {
  Profile,
  UserRole,
  createUser,
  updateProfile,
  CreateUserData,
  getAllDepartments,
  getAllClubs,
  getCoursesByDepartmentId,
  Course,
} from "@/lib/supabase";
import { useToast } from "@/components/ui/Toast";

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode: "add" | "edit";
  user?: Profile;
}

interface FormData {
  firstName: string;
  lastName: string;
  middleName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
  department: string;
  studentId: string;
  course: string;
  yearLevel: string;
  dateOfBirth: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  role?: string;
  studentId?: string;
  course?: string;
  yearLevel?: string;
  general?: string;
}

const initialFormData: FormData = {
  firstName: "",
  lastName: "",
  middleName: "",
  email: "",
  password: "",
  confirmPassword: "",
  role: "student",
  department: "",
  studentId: "",
  course: "",
  yearLevel: "",
  dateOfBirth: "",
};

const roleOptions = [
  { value: "student", label: "Student" },
  { value: "office", label: "Office" },
  { value: "department", label: "Department" },
  { value: "club", label: "Club" },
  { value: "admin", label: "Admin" },
];

const yearLevelOptions = [
  { value: "", label: "Select Year Level" },
  { value: "1", label: "1st Year" },
  { value: "2", label: "2nd Year" },
  { value: "3", label: "3rd Year" },
  { value: "4", label: "4th Year" },
];

const STUDENT_ID_REGEX = /^\d{4}-\d{4}-\d+$/;

export function UserFormModal({
  isOpen,
  onClose,
  onSuccess,
  mode,
  user,
}: UserFormModalProps) {
  const { showToast } = useToast();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [departments, setDepartments] = useState<{ id: string; name: string; code: string }[]>([]);
  const [clubs, setClubs] = useState<{ id: string; name: string; code: string; type: string }[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedClubs, setSelectedClubs] = useState<string[]>([]);

  // Fetch departments and clubs when modal opens for student role
  useEffect(() => {
    if (isOpen && formData.role === "student") {
      getAllDepartments().then(data => setDepartments(data.filter(d => d.status === "active")));
      getAllClubs().then(data => setClubs(data.filter(c => c.status === "active")));
    }
  }, [isOpen, formData.role]);

  // Populate form when editing
  useEffect(() => {
    if (mode === "edit" && user) {
      setFormData({
        firstName: user.first_name || "",
        lastName: user.last_name || "",
        middleName: user.middle_name || "",
        email: user.email || "",
        password: "",
        confirmPassword: "",
        role: user.role || "student",
        department: user.department || "",
        studentId: user.student_id || "",
        course: user.course || "",
        yearLevel: user.year_level || "",
        dateOfBirth: user.date_of_birth || "",
      });
      setSelectedClubs(user.enrolled_clubs ? user.enrolled_clubs.split(",") : []);
      // Load courses for the student's department
      if (user.role === "student" && user.department) {
        getAllDepartments().then(depts => {
          const dept = depts.find(d => d.code === user.department);
          if (dept) getCoursesByDepartmentId(dept.id).then(setCourses);
        });
      }
    } else {
      setFormData(initialFormData);
      setSelectedClubs([]);
      setCourses([]);
    }
    setErrors({});
  }, [mode, user, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleDepartmentChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const deptCode = e.target.value;
    setFormData(prev => ({ ...prev, department: deptCode, course: "" }));
    if (errors.course) setErrors(prev => ({ ...prev, course: undefined }));
    if (deptCode) {
      const dept = departments.find(d => d.code === deptCode);
      if (dept) {
        const deptCourses = await getCoursesByDepartmentId(dept.id);
        setCourses(deptCourses);
      }
    } else {
      setCourses([]);
    }
  };

  const toggleClub = (clubId: string) => {
    setSelectedClubs(prev =>
      prev.includes(clubId) ? prev.filter(id => id !== clubId) : [...prev, clubId]
    );
  };

  const validateEmail = (email: string): boolean => {
    return email.endsWith("@g.cjc.edu.ph");
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (mode === "add") {
      if (!formData.email.trim()) {
        newErrors.email = "Email is required";
      } else if (!validateEmail(formData.email)) {
        newErrors.email = "Email must be a @g.cjc.edu.ph address";
      }

      if (!formData.password) {
        newErrors.password = "Password is required";
      } else if (formData.password.length < 8) {
        newErrors.password = "Password must be at least 8 characters";
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    if (!formData.role) {
      newErrors.role = "Role is required";
    }

    // Student-specific validation
    if (formData.role === "student") {
      if (!formData.studentId.trim()) {
        newErrors.studentId = "Student ID is required";
      } else if (!STUDENT_ID_REGEX.test(formData.studentId.trim())) {
        newErrors.studentId = "Format must be YYYY-NNNN-N (e.g. 2021-0001-5)";
      }
      if (!formData.course) {
        newErrors.course = "Course is required";
      }
      if (!formData.yearLevel) {
        newErrors.yearLevel = "Year level is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      if (mode === "add") {
        const userData: CreateUserData = {
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          middleName: formData.middleName || undefined,
          role: formData.role,
          department: formData.role !== "admin" ? formData.department || undefined : undefined,
          studentId:
            formData.role === "student" ? formData.studentId : undefined,
          course: formData.role === "student" ? formData.course : undefined,
          yearLevel:
            formData.role === "student" ? formData.yearLevel : undefined,
          enrolledClubs: formData.role === "student" && selectedClubs.length > 0
            ? selectedClubs.join(",")
            : undefined,
          dateOfBirth: formData.role === "student" && formData.dateOfBirth
            ? formData.dateOfBirth
            : undefined,
        };

        await createUser(userData);
        showToast("success", "User Created", `${formData.firstName} ${formData.lastName} has been added successfully.`);
      } else if (mode === "edit" && user) {
        const updates: Partial<Profile> = {
          first_name: formData.firstName,
          last_name: formData.lastName,
          middle_name: formData.middleName || null,
          role: formData.role,
          department: formData.role !== "admin" ? formData.department || null : null,
          student_id:
            formData.role === "student" ? formData.studentId : null,
          course: formData.role === "student" ? formData.course : null,
          year_level:
            formData.role === "student" ? formData.yearLevel : null,
          enrolled_clubs: formData.role === "student" && selectedClubs.length > 0
            ? selectedClubs.join(",")
            : null,
          date_of_birth: formData.role === "student" && formData.dateOfBirth
            ? formData.dateOfBirth
            : null,
        };

        await updateProfile(user.id, updates);
        showToast("success", "User Updated", `${formData.firstName} ${formData.lastName} has been updated successfully.`);
      }

      onSuccess();
      onClose();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "An error occurred";
      setErrors({ general: errorMessage });
      showToast("error", "Operation Failed", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const isStudent = formData.role === "student";

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-cjc-blue/10 flex items-center justify-center">
            {mode === "add" ? (
              <UserPlus className="w-5 h-5 text-cjc-blue" />
            ) : (
              <UserCog className="w-5 h-5 text-cjc-blue" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-cjc-navy">
              {mode === "add" ? "Add New User" : "Edit User"}
            </h2>
            <p className="text-sm text-gray-500">
              {mode === "add"
                ? "Create a new user account"
                : "Update user information"}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* General Error */}
          {errors.general && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {errors.general}
            </div>
          )}

          {/* Name Fields */}
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="First Name"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              error={errors.firstName}
              placeholder="Juan"
              required
            />
            <Input
              label="Middle Name"
              name="middleName"
              value={formData.middleName}
              onChange={handleChange}
              placeholder="(optional)"
            />
            <Input
              label="Last Name"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              error={errors.lastName}
              placeholder="Dela Cruz"
              required
            />
          </div>

          {/* Email - disabled in edit mode */}
          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            placeholder="username@g.cjc.edu.ph"
            disabled={mode === "edit"}
            required={mode === "add"}
            helperText={
              mode === "edit"
                ? "Email cannot be changed"
                : "Must be a @g.cjc.edu.ph email address"
            }
          />

          {/* Password Fields - only in add mode */}
          {mode === "add" && (
            <>
              <Input
                label="Password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                placeholder="Enter password"
                required
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                }
              />
              <Input
                label="Confirm Password"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
                placeholder="Confirm password"
                required
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                }
              />
            </>
          )}

          {/* Role Selection */}
          <Select
            label="Role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            options={roleOptions}
            error={errors.role}
            required
          />

          {/* Student-specific fields */}
          {isStudent && (
            <>
              <Input
                label="Student ID"
                name="studentId"
                value={formData.studentId}
                onChange={handleChange}
                error={errors.studentId}
                placeholder="e.g., 2021-0001-5"
                required
              />
              <Input
                label="Date of Birth"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleChange}
                helperText="Optional"
              />
              <Select
                label="Department"
                name="department"
                value={formData.department}
                onChange={handleDepartmentChange}
                options={[
                  { value: "", label: "Select Department" },
                  ...departments.map(d => ({ value: d.code, label: d.name })),
                ]}
              />
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Course"
                  name="course"
                  value={formData.course}
                  onChange={handleChange}
                  options={[
                    { value: "", label: !formData.department ? "Select Department First" : "Select Course" },
                    ...courses.map(c => ({ value: c.code, label: c.name })),
                  ]}
                  error={errors.course}
                  required
                  disabled={!formData.department || courses.length === 0}
                />
                <Select
                  label="Year Level"
                  name="yearLevel"
                  value={formData.yearLevel}
                  onChange={handleChange}
                  options={yearLevelOptions}
                  error={errors.yearLevel}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-cjc-navy mb-1.5">
                  Enrolled Clubs <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <div className="space-y-1.5 max-h-36 overflow-y-auto border border-gray-200 rounded-lg p-2">
                  {clubs.map(club => (
                    <label key={club.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={selectedClubs.includes(club.id)}
                        onChange={() => toggleClub(club.id)}
                        className="w-4 h-4 rounded border-gray-300 text-cjc-blue"
                      />
                      <span className="text-sm text-gray-700">{club.name}</span>
                      <span className="text-xs text-gray-400 ml-auto">{club.type}</span>
                    </label>
                  ))}
                  {clubs.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-2">No clubs available</p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Actions */}
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
            <Button
              type="submit"
              variant="gold"
              className="flex-1"
              isLoading={isLoading}
            >
              {mode === "add" ? "Create User" : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
