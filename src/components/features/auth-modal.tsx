"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Modal } from "@/components/ui/modal";
import {
  Eye,
  EyeOff,
  LogIn,
  ArrowLeft,
  Mail,
  CheckCircle2,
} from "lucide-react";
import { sendPasswordResetEmail } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/components/ui/Toast";

type AuthMode = "login" | "forgot-password";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "login" | "register";
}

export function AuthModal({ isOpen, onClose, initialMode = "login" }: AuthModalProps) {
  // Always start with login mode (register is no longer supported from landing page)
  const [mode, setMode] = useState<AuthMode>("login");

  // Reset to login when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode("login");
    }
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
      <div className="p-4 sm:p-6">
        {/* Content - No tabs, just login or forgot password */}
        {mode === "login" ? (
          <LoginForm onClose={onClose} onForgotPassword={() => setMode("forgot-password")} />
        ) : (
          <ForgotPasswordForm onBack={() => setMode("login")} />
        )}
      </div>
    </Modal>
  );
}

// ============================================
// LOGIN FORM
// ============================================

function LoginForm({ onClose, onForgotPassword }: { onClose: () => void; onForgotPassword: () => void }) {
  const router = useRouter();
  const { login } = useAuth();
  const { showToast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validate required fields
    if (!formData.email.trim() || !formData.password.trim()) {
      setError("Please enter both email and password");
      setIsLoading(false);
      return;
    }

    console.log("[LoginForm] Submitting login...");
    const result = await login(formData.email, formData.password);
    console.log("[LoginForm] Login result:", result);

    if (result.success && result.role) {
      const rolePathMap: Record<string, string> = { csg_department_lgu: 'csg-department-lgu', cspsg_division: 'cspsg-division' };
      const path = rolePathMap[result.role] ?? result.role;
      console.log("[LoginForm] Login successful, redirecting to:", `/${path}`);
      onClose();
      router.push(`/${path}`);
    } else {
      console.log("[LoginForm] Login failed:", result.error);
      setError(result.error || "Invalid credentials. Please try again.");
      showToast("error", "Sign In Failed", result.error || "Invalid credentials");
      setIsLoading(false);
    }
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
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-cjc-navy">Welcome Back</h2>
        <p className="text-sm text-gray-500 mt-1">Sign in to your clearance portal</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

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
            placeholder="your.email@g.cjc.edu.ph"
            required
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
              required
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
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-sm text-cjc-red hover:underline"
          >
            Forgot password?
          </button>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 bg-cjc-red text-white rounded-lg font-medium hover:bg-cjc-red-light transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
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

      {/* Info notice */}
      <div className="mt-6 p-3 bg-cjc-blue/5 border border-cjc-blue/20 rounded-lg">
        <p className="text-xs text-cjc-navy text-center">
          New student? Contact your administrator to get your account set up, then use &quot;Forgot Password&quot; to set your password.
        </p>
      </div>
    </div>
  );
}

// ============================================
// FORGOT PASSWORD FORM
// ============================================

function ForgotPasswordForm({ onBack }: { onBack: () => void }) {
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Validate email
    if (!email.trim()) {
      setError("Please enter your email address");
      setIsLoading(false);
      return;
    }

    if (!email.endsWith("@g.cjc.edu.ph")) {
      setError("Please use your @g.cjc.edu.ph email address");
      setIsLoading(false);
      return;
    }

    try {
      await sendPasswordResetEmail(email);
      setSuccess(true);
      showToast("success", "Email Sent", "Check your inbox for the password reset link");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to send reset email. Please try again.";
      setError(errorMessage);
      showToast("error", "Request Failed", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-4">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-cjc-navy mb-3">Check Your Email</h2>
        <p className="text-gray-600 mb-6">
          We&apos;ve sent a password reset link to <span className="font-medium text-cjc-navy">{email}</span>
        </p>
        <p className="text-sm text-gray-500 mb-6">
          Click the link in the email to set your password. The link will expire in 24 hours.
        </p>
        <button
          onClick={onBack}
          className="text-cjc-red hover:underline font-medium flex items-center gap-2 mx-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sign In
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-cjc-navy transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Sign In
      </button>

      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-full bg-cjc-red/10 flex items-center justify-center mx-auto mb-4">
          <Mail className="w-7 h-7 text-cjc-red" />
        </div>
        <h2 className="text-2xl font-bold text-cjc-navy">Forgot Password?</h2>
        <p className="text-sm text-gray-500 mt-1">
          Enter your email and we&apos;ll send you a link to set your password
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div>
          <label htmlFor="resetEmail" className="block text-sm font-medium text-cjc-navy mb-1.5">
            Email Address
          </label>
          <input
            type="email"
            id="resetEmail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-base"
            placeholder="your.email@g.cjc.edu.ph"
            required
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 bg-cjc-red text-white rounded-lg font-medium hover:bg-cjc-red-light transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Sending...</span>
            </>
          ) : (
            <span>Send Reset Link</span>
          )}
        </button>
      </form>

      {/* Info notice */}
      <div className="mt-6 p-3 bg-cjc-blue/5 border border-cjc-blue/20 rounded-lg">
        <p className="text-xs text-cjc-navy text-center">
          If you don&apos;t have an account yet, please contact your administrator to have your account created first.
        </p>
      </div>
    </div>
  );
}
