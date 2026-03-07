"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff, Lock, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import { updateUserPassword, supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);

  // Check if user has a valid recovery session
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      // User should have a session from the recovery link
      setIsValidSession(!!session);
    };
    checkSession();

    // Listen for auth state changes (recovery link will trigger this)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsValidSession(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Validate passwords
    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      await updateUserPassword(password);
      setSuccess(true);
      // Redirect to home after 3 seconds
      setTimeout(() => {
        router.push("/");
      }, 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to reset password. Please try again.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while checking session
  if (isValidSession === null) {
    return (
      <div className="min-h-screen bg-[#fefcf8] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-cjc-red/30 border-t-cjc-red rounded-full animate-spin" />
      </div>
    );
  }

  // Show error if no valid session
  if (!isValidSession) {
    return (
      <div className="min-h-screen bg-[#fefcf8] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-border-warm p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-cjc-navy mb-3">Invalid or Expired Link</h1>
          <p className="text-warm-muted mb-6">
            This password reset link is invalid or has expired. Please request a new password reset link.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-cjc-red hover:underline font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  // Show success message
  if (success) {
    return (
      <div className="min-h-screen bg-[#fefcf8] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-border-warm p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-cjc-navy mb-3">Password Reset Successful</h1>
          <p className="text-warm-muted mb-6">
            Your password has been successfully updated. You can now sign in with your new password.
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Redirecting to home page...
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-cjc-red hover:underline font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Home Now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fefcf8] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo Header */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-full overflow-hidden border border-border-warm shadow-sm">
            <Image
              src="/images/logos/cjc-logo.jpeg"
              alt="CJC Logo"
              width={48}
              height={48}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Reset Password Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-border-warm p-8">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-full bg-cjc-red/10 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-7 h-7 text-cjc-red" />
            </div>
            <h1 className="text-2xl font-bold text-cjc-navy mb-2">Set Your Password</h1>
            <p className="text-warm-muted text-sm">
              Create a strong password for your account
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* New Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-cjc-navy mb-1.5">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-cjc-red focus:ring-2 focus:ring-cjc-red/20 outline-none transition-all pr-12"
                  placeholder="Min. 8 characters"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
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
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-cjc-red focus:ring-2 focus:ring-cjc-red/20 outline-none transition-all pr-12"
                  placeholder="Confirm your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            <div className="text-xs text-warm-muted space-y-1">
              <p className="font-medium text-cjc-navy">Password requirements:</p>
              <ul className="space-y-0.5 pl-4">
                <li className={password.length >= 8 ? "text-green-600" : ""}>
                  {password.length >= 8 ? "✓" : "•"} At least 8 characters
                </li>
                <li className={password && password === confirmPassword ? "text-green-600" : ""}>
                  {password && password === confirmPassword ? "✓" : "•"} Passwords match
                </li>
              </ul>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-cjc-red text-white rounded-lg font-medium hover:bg-cjc-red-light transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Setting Password...</span>
                </>
              ) : (
                <span>Set New Password</span>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-sm text-warm-muted hover:text-cjc-red transition-colors"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
