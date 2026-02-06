"use client";

import { useState, useEffect, useRef, RefObject } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  CheckCircle2,
  ArrowRight,
  Facebook,
  Music2,
} from "lucide-react";
import { AuthModal } from "@/components/features/auth-modal";
import { useAuth } from "@/contexts/auth-context";

// Hook to detect when element enters viewport
function useInView(ref: RefObject<HTMLElement | null>, threshold = 0.1) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref, threshold]);
  return inView;
}

// Animated counter component
function AnimatedCounter({ value, inView }: { value: number; inView: boolean }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let startTime: number | null = null;
    const duration = 1000;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * value));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [inView, value]);
  return <span>{count}</span>;
}

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, profile, isLoading } = useAuth();
  const [authModal, setAuthModal] = useState<"login" | "register" | "register-admin" | null>(null);

  // Auto-redirect authenticated users to their dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated && profile) {
      router.push(`/${profile.role}`);
    }
  }, [isLoading, isAuthenticated, profile, router]);

  // Refs for scroll animations
  const heroRef = useRef<HTMLElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLElement>(null);
  const navyBlockRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLElement>(null);
  const ctaRef = useRef<HTMLElement>(null);

  // In-view states
  const heroInView = useInView(heroRef, 0.1);
  const statsInView = useInView(statsRef, 0.3);
  const featuresInView = useInView(featuresRef, 0.1);
  const navyBlockInView = useInView(navyBlockRef, 0.2);
  const cardsInView = useInView(cardsRef, 0.2);
  const timelineInView = useInView(timelineRef, 0.1);
  const ctaInView = useInView(ctaRef, 0.2);

  return (
    <>
      <div className="min-h-screen bg-surface-warm">
        {/* Navigation */}
        <header className="bg-white border-b border-border-warm">
          <nav className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-border-warm">
                    <Image
                      src="/images/logos/cjc-logo.jpg"
                      alt="CJC Logo"
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-border-warm">
                    <Image
                      src="/images/logos/ccis-logo.jpeg"
                      alt="CCIS Logo"
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div className="hidden sm:block">
                  <p className="font-semibold text-cjc-navy text-sm tracking-wide uppercase">
                    Cor Jesu College
                  </p>
                  <p className="text-xs text-warm-muted">
                    <span className="ccis-braces">{"{"}</span> College of Computing and Information Sciences <span className="ccis-braces">{"}"}</span>
                  </p>
                </div>
              </div>

              {/* Nav Actions */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setAuthModal("login")}
                  className="text-sm font-medium text-cjc-navy/70 hover:text-cjc-navy transition-colors px-3 py-2"
                >
                  Sign In
                </button>
                <button
                  onClick={() => setAuthModal("register")}
                  className="btn btn-crimson text-sm"
                >
                  Get Started
                </button>
              </div>
            </div>
          </nav>
          {/* Crimson Accent Bar - The visual signature */}
          <div className="accent-bar-crimson" />
        </header>

        {/* Hero Section - Editorial Typography */}
        <section ref={heroRef} className="bg-white hero-pattern">
          <div className="max-w-6xl mx-auto px-6 py-20 lg:py-28">
            <div className="grid lg:grid-cols-5 gap-12 items-center">
              {/* Text Content - 60% */}
              <div className={`lg:col-span-3 animate-fade-up ${heroInView ? 'in-view' : ''}`}>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-surface-cream border border-border-warm text-sm text-warm-muted mb-8">
                  <span className="w-2 h-2 rounded-full bg-cjc-crimson"></span>
                  Academic Year 2025-2026
                </div>

                {/* Stacked Editorial Headline */}
                <div className="mb-8">
                  <h1 className="headline-editorial text-cjc-navy">
                    <span className="block text-5xl sm:text-6xl lg:text-7xl">YOUR</span>
                    <span className="block text-5xl sm:text-6xl lg:text-7xl">
                      <span className="headline-underline">CLEARANCE.</span>
                    </span>
                    <span className="block text-5xl sm:text-6xl lg:text-7xl mt-2">SIMPLIFIED.</span>
                  </h1>
                </div>

                <p className="text-lg text-warm-muted mb-10 max-w-lg font-body leading-relaxed">
                  Check your clearance status from anywhere. See which departments have approved you and what requirements you still need to settle at each office.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 mb-12">
                  <button
                    onClick={() => setAuthModal("login")}
                    className="btn btn-crimson text-base px-8 py-3.5"
                  >
                    Access Portal
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setAuthModal("register")}
                    className="btn btn-secondary text-base px-8 py-3.5"
                  >
                    Create Account
                  </button>
                </div>

                {/* Stats Bar with Gold Accent */}
                <div ref={statsRef} className={`flex flex-wrap gap-10 pt-8 border-t border-border-warm animate-stagger ${statsInView ? 'in-view' : ''}`}>
                  <div>
                    <p className="text-4xl font-bold text-cjc-gold font-display">
                      <AnimatedCounter value={6} inView={statsInView} />
                    </p>
                    <p className="text-sm text-warm-muted mt-1">Departments</p>
                  </div>
                  <div>
                    <p className="text-4xl font-bold text-cjc-gold font-display">
                      <AnimatedCounter value={1} inView={statsInView} />
                    </p>
                    <p className="text-sm text-warm-muted mt-1">Portal</p>
                  </div>
                  <div>
                    <p className="text-4xl font-bold text-cjc-gold font-display">
                      <AnimatedCounter value={0} inView={statsInView} />
                    </p>
                    <p className="text-sm text-warm-muted mt-1">Paper Forms</p>
                  </div>
                </div>
              </div>

              {/* Visual Mockup - 40% */}
              <div className="lg:col-span-2 hidden lg:block">
                <div className="relative">
                  {/* Decorative offset shadow */}
                  <div className="absolute inset-0 bg-cjc-navy/5 rounded-lg transform translate-x-4 translate-y-4"></div>
                  {/* Dashboard Preview Card */}
                  <div className="relative bg-white rounded-lg shadow-lg border border-border-warm p-6 transform -rotate-2 hover:rotate-0 transition-transform duration-300">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-full bg-cjc-navy flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">JD</span>
                      </div>
                      <div>
                        <p className="font-semibold text-cjc-navy text-sm">Juan Dela Cruz</p>
                        <p className="text-xs text-warm-muted">BSCS - 4th Year</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {[
                        { dept: "Library", status: "cleared" },
                        { dept: "Registrar", status: "cleared" },
                        { dept: "Finance Office", status: "cleared" },
                        { dept: "Student Affairs", status: "pending" },
                        { dept: "Dean's Office", status: "pending" },
                      ].map((item) => (
                        <div
                          key={item.dept}
                          className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-surface-warm"
                        >
                          <span className="text-sm text-cjc-navy">{item.dept}</span>
                          <span
                            className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                              item.status === "cleared"
                                ? "bg-cjc-gold/20 text-cjc-gold"
                                : "bg-cjc-crimson/10 text-cjc-crimson"
                            }`}
                          >
                            {item.status === "cleared" ? "Cleared" : "Pending"}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 pt-4 border-t border-border-warm">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-warm-muted">Overall Progress</span>
                        <span className="text-sm font-semibold text-cjc-navy">60%</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-bar-fill" style={{ width: "60%" }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section - Editorial Blocks */}
        <section ref={featuresRef} className="py-20 lg:py-28">
          <div className="max-w-6xl mx-auto px-6">
            <div className={`mb-16 animate-fade-up ${featuresInView ? 'in-view' : ''}`}>
              <p className="text-sm font-semibold text-cjc-crimson uppercase tracking-wider mb-3">
                Why Use This?
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-cjc-navy">
                Make Clearance Easier
              </h2>
            </div>

            {/* Block A - Full Width Navy (CCIS Blue) */}
            <div ref={navyBlockRef} className={`bg-cjc-navy text-white rounded-none sm:rounded p-8 lg:p-12 mb-6 animate-fade-up ${navyBlockInView ? 'in-view' : ''}`}>
              <div className="grid lg:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-2xl lg:text-3xl font-display font-bold mb-4">
                    One portal. Every department.
                  </h3>
                  <p className="text-white/70 text-lg leading-relaxed">
                    Check your status across Library, Registrar, Finance, and other departments in one place. Know exactly what you need to settle before visiting each office.
                  </p>
                </div>
                <div className={`grid grid-cols-2 gap-3 animate-stagger ${navyBlockInView ? 'in-view' : ''}`}>
                  {["Library", "Registrar", "Finance", "Dean's Office", "Student Affairs", "Guidance"].map(
                    (dept, i) => (
                      <div
                        key={dept}
                        className="flex items-center gap-2 py-3 px-4 rounded-lg bg-white/10 card-hover-lift"
                      >
                        <CheckCircle2 className={`w-4 h-4 ${i < 3 ? "text-cjc-gold" : "text-cjc-crimson-light"}`} />
                        <span className="text-sm text-white/90">{dept}</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Block B - Two Columns */}
            <div ref={cardsRef} className={`grid md:grid-cols-2 gap-6 animate-stagger ${cardsInView ? 'in-view' : ''}`}>
              {/* Role-Based Access */}
              <div className="bg-white rounded-lg p-6 shadow-sm card-hover-lift">
                <h3 className="text-lg font-display font-bold text-cjc-navy mb-2">
                  Role-Based Access
                </h3>
                <p className="text-warm-muted text-sm leading-relaxed mb-4">
                  Students, department staff, organization officers, deans, and admins each get their own dashboard designed for their needs.
                </p>
                <div className="flex flex-wrap gap-3 text-sm text-cjc-navy">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-cjc-crimson" />
                    5 user roles
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-cjc-crimson" />
                    Custom views
                  </span>
                </div>
              </div>

              {/* Digital Documents */}
              <div className="bg-white rounded-lg p-6 shadow-sm card-hover-lift">
                <h3 className="text-lg font-display font-bold text-cjc-navy mb-2">
                  Digital Documents
                </h3>
                <p className="text-warm-muted text-sm leading-relaxed mb-4">
                  Upload required documents online. Your files are saved securely so you won't lose them.
                </p>
                <div className="flex flex-wrap gap-3 text-sm text-cjc-navy">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-cjc-crimson" />
                    Secure uploads
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-cjc-crimson" />
                    Easy tracking
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works - Vertical Timeline */}
        <section ref={timelineRef} className="bg-surface-warm py-20 lg:py-28">
          <div className="max-w-4xl mx-auto px-6">
            <div className={`text-center mb-16 animate-fade-up ${timelineInView ? 'in-view' : ''}`}>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-cjc-navy">
                How It Works
              </h2>
            </div>

            <div className="timeline-vertical">
              {[
                {
                  step: "01",
                  title: "Create Your Account",
                  desc: "Register using your student ID and school email. Set up your profile and select the organizations you belong to.",
                },
                {
                  step: "02",
                  title: "Submit Clearance Request",
                  desc: "Start a clearance request for graduation, semester end, or transfer. The system will show all departments and organizations you need to clear.",
                },
                {
                  step: "03",
                  title: "Check Status and Settle Requirements",
                  desc: "See which departments have approved you and which ones need action. Visit offices to settle any pending requirements like unpaid fees or unreturned books.",
                },
                {
                  step: "04",
                  title: "Get Your Clearance",
                  desc: "Once all departments and organizations have approved you, download or print your official clearance certificate.",
                },
              ].map((item, index) => (
                <div
                  key={item.step}
                  className={`timeline-step timeline-step-animate ${timelineInView ? 'in-view' : ''}`}
                  style={{ transitionDelay: `${index * 150}ms` }}
                >
                  <div className="timeline-number">{item.step}</div>
                  <div className="bg-white rounded p-6 shadow-sm border border-border-warm card-hover-lift">
                    <h3 className="font-display font-bold text-cjc-navy text-lg mb-2">
                      {item.title}
                    </h3>
                    <p className="text-warm-muted leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section - BOLD Crimson Background */}
        <section ref={ctaRef} className="bg-cjc-crimson py-20 lg:py-28 texture-grain">
          <div className={`max-w-4xl mx-auto px-6 text-center animate-fade-up ${ctaInView ? 'in-view' : ''}`}>
            <h2 className="headline-editorial text-white mb-4">
              <span className="block text-4xl sm:text-5xl lg:text-6xl">START YOUR</span>
              <span className="block text-4xl sm:text-5xl lg:text-6xl">CLEARANCE</span>
              <span className="block text-4xl sm:text-5xl lg:text-6xl mt-2">
                <span className="relative inline-block">
                  TODAY
                  <span className="absolute -bottom-2 left-0 w-full h-1 bg-white/40"></span>
                </span>
              </span>
            </h2>
            <p className="text-white/80 text-lg mb-10 max-w-xl mx-auto mt-8">
              No more guessing which offices you still need to visit. Track your clearance progress and know exactly what to settle.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setAuthModal("register")}
                className="btn btn-gold text-base px-10 py-4 font-semibold"
              >
                Create Your Account
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setAuthModal("login")}
                className="btn btn-outline-white text-base px-10 py-4"
              >
                Sign In
              </button>
            </div>
          </div>
        </section>

        {/* Footer - Navy with Gold CCIS Accent */}
        <footer className="bg-cjc-navy text-white/70">
          <div className="h-1 bg-cjc-crimson"></div>
          <div className="max-w-6xl mx-auto px-6 py-16">
            <div className="grid md:grid-cols-5 gap-10">
              <div className="md:col-span-2">
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/20">
                      <Image
                        src="/images/logos/cjc-logo.jpg"
                        alt="CJC Logo"
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/20">
                      <Image
                        src="/images/logos/ccis-logo.jpeg"
                        alt="CCIS Logo"
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-white font-semibold text-lg">Cor Jesu College</p>
                    <p className="text-sm text-white/50">
                      Sacred Heart Avenue, Digos City, Davao del Sur
                    </p>
                  </div>
                </div>
                <p className="text-sm leading-relaxed max-w-md">
                  A software engineering project developed by Jan Miko A. Guevarra
                  and Jan Carlo Surig, students of the College of Special Programs (CSP)
                  and College of Computing and Information Sciences (CCIS).
                </p>
              </div>

              <div>
                <h4 className="text-white font-semibold mb-5">Programs</h4>
                <ul className="space-y-3 text-sm">
                  <li>BS Computer Science</li>
                  <li>BS Information Technology</li>
                  <li>BS Library & Information Science</li>
                </ul>
              </div>

              <div>
                <h4 className="text-white font-semibold mb-5">Contact CCIS</h4>
                <ul className="space-y-3 text-sm">
                  <li>computerstudies@g.cjc.edu.ph</li>
                  <li>09082191651</li>
                  <li>Mon - Fri: 8:00 AM - 5:00 PM</li>
                </ul>
              </div>

              <div>
                <h4 className="text-white font-semibold mb-5">Follow CCIS</h4>
                <ul className="space-y-3 text-sm">
                  <li>
                    <a
                      href="https://facebook.com/cjccomputerstudies"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 hover:text-white transition-colors"
                    >
                      <Facebook className="w-4 h-4" />
                      @cjccomputerstudies
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://tiktok.com/@cjc.ccis"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 hover:text-white transition-colors"
                    >
                      <Music2 className="w-4 h-4" />
                      @cjc.ccis
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm">
                &copy; {new Date().getFullYear()} Cor Jesu College. All rights
                reserved.
              </p>
              <p className="text-sm">
                <span className="text-cjc-gold font-semibold border-b-2 border-cjc-gold pb-1">
                  College of Computing and Information Sciences
                </span>
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
