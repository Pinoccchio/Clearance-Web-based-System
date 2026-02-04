"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Modal } from "@/components/ui/modal";
import {
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  GraduationCap,
  Building2,
  Shield,
  Crown,
  ChevronDown,
  BookOpen,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

type UserRole = "student" | "office" | "academic-club" | "non-academic-club" | "admin";
type AuthMode = "login" | "register";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: AuthMode;
}

interface RoleOption {
  id: UserRole;
  label: string;
  icon: React.ReactNode;
}

const roleOptions: RoleOption[] = [
  { id: "student", label: "Student", icon: <GraduationCap className="w-4 h-4" /> },
  { id: "office", label: "Office", icon: <Building2 className="w-4 h-4" /> },
  { id: "academic-club", label: "Academic Club", icon: <BookOpen className="w-4 h-4" /> },
  { id: "non-academic-club", label: "Non-Academic Club", icon: <Users className="w-4 h-4" /> },
  { id: "admin", label: "Admin", icon: <Shield className="w-4 h-4" /> },
];

const departments = [
  { value: "ccis", label: "College of Computing and Information Sciences (CCIS)" },
];

const courses = [
  "Bachelor of Science in Information Technology",
  "Bachelor of Science in Computer Science",
  "Bachelor of Science in Information Systems",
];

const yearLevels = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

export function AuthModal({ isOpen, onClose, initialMode = "login" }: AuthModalProps) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>(initialMode);

  // Sync mode with initialMode when modal opens or initialMode changes
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
    }
  }, [isOpen, initialMode]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
      <div className="p-6">
        {/* Tabs */}
        <div className="tab-list mb-6">
          <button
            className={cn("tab-trigger", mode === "login" && "active")}
            onClick={() => setMode("login")}
          >
            Sign In
          </button>
          <button
            className={cn("tab-trigger", mode === "register" && "active")}
            onClick={() => setMode("register")}
          >
            Register
          </button>
        </div>

        {/* Content */}
        {mode === "login" ? (
          <LoginForm onClose={onClose} />
        ) : (
          <RegisterForm onClose={onClose} onSwitchToLogin={() => setMode("login")} />
        )}
      </div>
    </Modal>
  );
}

// ============================================
// LOGIN FORM
// ============================================

function LoginForm({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>("student");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    onClose();
    router.push(`/${selectedRole}`);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  return (
    <div>
      {/* Role Selector */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-cjc-navy mb-2">
          Select Role <span className="text-gray-400 font-normal">(Demo)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {roleOptions.map((role) => (
            <button
              key={role.id}
              type="button"
              onClick={() => setSelectedRole(role.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                selectedRole === role.id
                  ? "bg-cjc-navy text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {role.icon}
              {role.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-cjc-navy mb-1.5">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="input-base"
            placeholder="your.email@cjc.edu.ph"
          />
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-cjc-navy mb-1.5">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="input-base pr-10"
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Remember & Forgot */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleInputChange}
              className="w-4 h-4 rounded border-gray-300 text-cjc-blue focus:ring-cjc-blue"
            />
            <span className="text-sm text-gray-600">Remember me</span>
          </label>
          <Link href="#" className="text-sm text-cjc-crimson hover:underline">
            Forgot password?
          </Link>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 bg-cjc-crimson text-white rounded-lg font-medium hover:bg-cjc-crimson-light transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </>
          )}
        </button>
      </form>

      {/* Demo notice */}
      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-xs text-amber-800 text-center">
          <strong>Demo Mode:</strong> Select any role and click Sign In to explore.
        </p>
      </div>
    </div>
  );
}

// ============================================
// REGISTER FORM
// ============================================

function RegisterForm({
  onClose,
  onSwitchToLogin,
}: {
  onClose: () => void;
  onSwitchToLogin: () => void;
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    studentId: "",
    firstName: "",
    lastName: "",
    middleName: "",
    email: "",
    department: "",
    course: "",
    yearLevel: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
    onSwitchToLogin();
  };

  const isStep1Valid =
    formData.studentId && formData.firstName && formData.lastName && formData.email;

  const isStep2Valid =
    formData.department &&
    formData.course &&
    formData.yearLevel &&
    formData.password &&
    formData.confirmPassword &&
    formData.password === formData.confirmPassword &&
    formData.agreeToTerms;

  return (
    <div>
      {/* Progress indicator */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold",
              step >= 1 ? "bg-cjc-navy text-white" : "bg-gray-200 text-gray-500"
            )}
          >
            {step > 1 ? "✓" : "1"}
          </div>
          <span className={cn("text-sm", step >= 1 ? "text-cjc-navy" : "text-gray-400")}>
            Personal
          </span>
        </div>
        <div className="flex-1 h-px bg-gray-200">
          <div className={cn("h-full bg-cjc-navy transition-all", step > 1 ? "w-full" : "w-0")} />
        </div>
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold",
              step >= 2 ? "bg-cjc-navy text-white" : "bg-gray-200 text-gray-500"
            )}
          >
            2
          </div>
          <span className={cn("text-sm", step >= 2 ? "text-cjc-navy" : "text-gray-400")}>
            Academic
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {step === 1 && (
          <>
            {/* Student ID */}
            <div>
              <label htmlFor="studentId" className="block text-sm font-medium text-cjc-navy mb-1.5">
                Student ID
              </label>
              <input
                type="text"
                id="studentId"
                name="studentId"
                value={formData.studentId}
                onChange={handleInputChange}
                className="input-base font-mono"
                placeholder="e.g., 2021-00001"
              />
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-cjc-navy mb-1.5">
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="input-base"
                  placeholder="Juan"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-cjc-navy mb-1.5">
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="input-base"
                  placeholder="Dela Cruz"
                />
              </div>
            </div>

            {/* Middle Name */}
            <div>
              <label htmlFor="middleName" className="block text-sm font-medium text-cjc-navy mb-1.5">
                Middle Name <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                id="middleName"
                name="middleName"
                value={formData.middleName}
                onChange={handleInputChange}
                className="input-base"
                placeholder="Santos"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="regEmail" className="block text-sm font-medium text-cjc-navy mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                id="regEmail"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="input-base"
                placeholder="your.email@cjc.edu.ph"
              />
            </div>

            {/* Continue Button */}
            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full py-3 bg-cjc-crimson text-white rounded-lg font-medium hover:bg-cjc-crimson-light transition-colors"
            >
              Continue
            </button>
          </>
        )}

        {step === 2 && (
          <>
            {/* Department */}
            <div>
              <label htmlFor="department" className="block text-sm font-medium text-cjc-navy mb-1.5">
                Department
              </label>
              <div className="relative">
                <select
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className="input-base appearance-none pr-10"
                >
                  <option value="">Select your department</option>
                  {departments.map((dept) => (
                    <option key={dept.value} value={dept.value}>
                      {dept.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Course */}
            <div>
              <label htmlFor="course" className="block text-sm font-medium text-cjc-navy mb-1.5">
                Course / Program
              </label>
              <div className="relative">
                <select
                  id="course"
                  name="course"
                  value={formData.course}
                  onChange={handleInputChange}
                  className="input-base appearance-none pr-10"
                >
                  <option value="">Select your course</option>
                  {courses.map((course) => (
                    <option key={course} value={course}>
                      {course}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Year Level */}
            <div>
              <label className="block text-sm font-medium text-cjc-navy mb-1.5">
                Year Level
              </label>
              <div className="grid grid-cols-4 gap-2">
                {yearLevels.map((year) => (
                  <button
                    key={year}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, yearLevel: year }))}
                    className={cn(
                      "py-2 px-3 rounded-md text-sm font-medium transition-colors",
                      formData.yearLevel === year
                        ? "bg-cjc-navy text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="regPassword" className="block text-sm font-medium text-cjc-navy mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="regPassword"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="input-base pr-10"
                  placeholder="Create a strong password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-cjc-navy mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="input-base pr-10"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Terms */}
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleInputChange}
                className="w-4 h-4 mt-0.5 rounded border-gray-300 text-cjc-blue focus:ring-cjc-blue"
              />
              <span className="text-sm text-gray-600">
                I agree to the{" "}
                <Link href="#" className="text-cjc-crimson hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="#" className="text-cjc-crimson hover:underline">
                  Privacy Policy
                </Link>
              </span>
            </label>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 py-3 bg-white text-cjc-navy border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-3 bg-cjc-crimson text-white rounded-lg font-medium hover:bg-cjc-crimson-light transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Create Account</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
