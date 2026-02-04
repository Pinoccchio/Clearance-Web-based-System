"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Clock,
  Shield,
  Users,
  FileCheck,
  ChevronRight,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { AuthModal } from "@/components/features/auth-modal";

export default function LandingPage() {
  const [authModal, setAuthModal] = useState<"login" | "register" | null>(null);

  return (
    <>
      <div className="min-h-screen bg-white">
        {/* Navigation */}
        <header className="border-b border-gray-100">
          <nav className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200">
                    <Image
                      src="/cjc-logo.jpg"
                      alt="CJC Logo"
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200">
                    <Image
                      src="/ccis-logo.jpeg"
                      alt="CCIS Logo"
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div className="hidden sm:block">
                  <p className="font-semibold text-cjc-navy">Cor Jesu College</p>
                  <p className="text-xs text-gray-500">CCIS Clearance System</p>
                </div>
              </div>

              {/* Nav Actions */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setAuthModal("login")}
                  className="text-sm font-medium text-gray-600 hover:text-cjc-navy transition-colors px-3 py-2"
                >
                  Sign In
                </button>
                <button
                  onClick={() => setAuthModal("register")}
                  className="btn btn-gold text-sm"
                >
                  Get Started
                </button>
              </div>
            </div>
          </nav>
        </header>

        {/* Hero Section */}
        <section className="max-w-6xl mx-auto px-6 py-16 lg:py-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 text-sm text-gray-600 mb-6">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              Academic Year 2024-2025
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-cjc-navy leading-tight mb-6">
              Student Clearance,{" "}
              <span className="text-cjc-gold">Simplified</span>
            </h1>

            <p className="text-lg text-gray-600 mb-8 max-w-2xl">
              Track your clearance status across all departments in real-time.
              Submit requirements, monitor approvals, and complete your
              clearance process efficiently.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-12">
              <button
                onClick={() => setAuthModal("login")}
                className="btn btn-primary text-base px-6 py-3"
              >
                Access Portal
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setAuthModal("register")}
                className="btn btn-secondary text-base px-6 py-3"
              >
                Create Account
              </button>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-8 pt-8 border-t border-gray-200">
              <div>
                <p className="text-3xl font-bold text-cjc-navy">5,000+</p>
                <p className="text-sm text-gray-500">Active Students</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-cjc-gold">98%</p>
                <p className="text-sm text-gray-500">Success Rate</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-cjc-blue">24/7</p>
                <p className="text-sm text-gray-500">System Access</p>
              </div>
            </div>
          </div>
        </section>

        {/* Bento Features Section */}
        <section className="bg-gray-50 py-16 lg:py-24">
          <div className="max-w-6xl mx-auto px-6">
            <div className="mb-12">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-cjc-navy mb-3">
                Why Use Our System?
              </h2>
              <p className="text-gray-600 max-w-xl">
                A modern approach to academic clearance with features designed
                for efficiency and transparency.
              </p>
            </div>

            {/* Bento Grid */}
            <div className="grid md:grid-cols-4 gap-4">
              {/* Featured Card - Spans 2 cols and 2 rows */}
              <div className="md:col-span-2 md:row-span-2 bg-cjc-navy text-white rounded-2xl p-8 flex flex-col justify-between min-h-[320px]">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-6">
                    <Clock className="w-6 h-6 text-cjc-gold" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">
                    Track Every Department
                  </h3>
                  <p className="text-white/70">
                    Monitor your clearance status in real-time across Library,
                    Registrar, Finance, and all other departments from a single
                    dashboard.
                  </p>
                </div>
                <div className="mt-6 space-y-2">
                  {["Library", "Registrar", "Finance Office", "Student Affairs"].map(
                    (dept, i) => (
                      <div
                        key={dept}
                        className="flex items-center justify-between py-2 border-b border-white/10 last:border-0"
                      >
                        <span className="text-sm text-white/80">{dept}</span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            i < 2
                              ? "bg-green-500/20 text-green-300"
                              : "bg-yellow-500/20 text-yellow-300"
                          }`}
                        >
                          {i < 2 ? "Cleared" : "Pending"}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Stat Cards */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col justify-center">
                <p className="text-4xl font-bold text-cjc-navy mb-1">98%</p>
                <p className="text-sm text-gray-500">Completion Rate</p>
                <p className="text-xs text-gray-400 mt-2">
                  Students who complete clearance on time
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col justify-center">
                <p className="text-4xl font-bold text-cjc-gold mb-1">24/7</p>
                <p className="text-sm text-gray-500">System Access</p>
                <p className="text-xs text-gray-400 mt-2">
                  Available anytime, anywhere
                </p>
              </div>

              {/* Feature Cards */}
              <div className="md:col-span-2 bg-white border border-gray-200 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-cjc-blue" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-cjc-navy mb-1">
                      Secure & Reliable
                    </h3>
                    <p className="text-sm text-gray-600">
                      Enterprise-grade security ensures your data is protected.
                      Role-based access control for students, staff, and
                      administrators.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Features Row */}
            <div className="grid md:grid-cols-3 gap-4 mt-4">
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center mb-4">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="font-semibold text-cjc-navy mb-2">
                  Multi-Role Access
                </h3>
                <p className="text-sm text-gray-600">
                  Tailored experiences for students, approvers, officers, deans,
                  and administrators.
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center mb-4">
                  <FileCheck className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="font-semibold text-cjc-navy mb-2">
                  Digital Documents
                </h3>
                <p className="text-sm text-gray-600">
                  Upload and manage all required documents in one centralized
                  location.
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-5 h-5 text-amber-600" />
                </div>
                <h3 className="font-semibold text-cjc-navy mb-2">
                  Instant Notifications
                </h3>
                <p className="text-sm text-gray-600">
                  Get notified immediately when your clearance status changes or
                  action is required.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 lg:py-24">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-cjc-navy mb-3">
                How It Works
              </h2>
              <p className="text-gray-600">
                Complete your clearance in four simple steps
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-6">
              {[
                {
                  step: "01",
                  title: "Create Account",
                  desc: "Register with your student credentials to get started",
                },
                {
                  step: "02",
                  title: "Submit Request",
                  desc: "Initiate your clearance application for the semester",
                },
                {
                  step: "03",
                  title: "Track Progress",
                  desc: "Monitor approvals from each department in real-time",
                },
                {
                  step: "04",
                  title: "Get Cleared",
                  desc: "Receive your official clearance once all departments approve",
                },
              ].map((item, index) => (
                <div key={item.step} className="relative">
                  <div className="text-center">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-cjc-navy flex items-center justify-center">
                      <span className="text-lg font-bold text-white">
                        {item.step}
                      </span>
                    </div>
                    <h3 className="font-semibold text-cjc-navy mb-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-600">{item.desc}</p>
                  </div>
                  {index < 3 && (
                    <div className="hidden md:block absolute top-7 left-[60%] w-[80%]">
                      <ChevronRight className="w-5 h-5 text-gray-300" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-cjc-navy py-16">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-white/70 mb-8 max-w-xl mx-auto">
              Join thousands of students who have streamlined their clearance
              process. Create your account today.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => setAuthModal("register")}
                className="btn btn-gold text-base px-8 py-3"
              >
                Create Your Account
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setAuthModal("login")}
                className="btn text-base px-8 py-3 bg-transparent text-white border border-white/30 hover:bg-white/10"
              >
                Sign In
              </button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-gray-400 py-12">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid md:grid-cols-4 gap-8">
              <div className="md:col-span-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10">
                    <Image
                      src="/cjc-logo.jpg"
                      alt="CJC Logo"
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-white font-semibold">Cor Jesu College</p>
                    <p className="text-xs text-gray-500">
                      Sacred Heart Avenue, Digos City
                    </p>
                  </div>
                </div>
                <p className="text-sm max-w-md">
                  The CJC Clearance System is the official student clearance
                  management platform for Cor Jesu College.
                </p>
              </div>

              <div>
                <h4 className="text-white font-medium mb-4">Quick Links</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <button
                      onClick={() => setAuthModal("login")}
                      className="hover:text-white transition-colors"
                    >
                      Student Portal
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setAuthModal("login")}
                      className="hover:text-white transition-colors"
                    >
                      Staff Login
                    </button>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Help Center
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-white font-medium mb-4">Contact</h4>
                <ul className="space-y-2 text-sm">
                  <li>registrar@cjc.edu.ph</li>
                  <li>(082) 553-2433</li>
                  <li>Mon - Fri: 8:00 AM - 5:00 PM</li>
                </ul>
              </div>
            </div>

            <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm">
                &copy; {new Date().getFullYear()} Cor Jesu College. All rights
                reserved.
              </p>
              <p className="text-sm text-cjc-gold">
                College of Computing and Information Sciences
              </p>
            </div>
          </div>
        </footer>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModal !== null}
        onClose={() => setAuthModal(null)}
        initialMode={authModal || "login"}
      />
    </>
  );
}
