"use client";

import Image from "next/image";

interface LandingHeaderProps {
  onSignIn: () => void;
}

export function LandingHeader({ onSignIn }: LandingHeaderProps) {
  return (
    <header className="nav-sticky border-b border-border-warm/50">
      <nav className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-border-warm shadow-sm bg-white">
              <Image
                src="/images/logos/cjc-logo.jpeg"
                alt="CJC Logo"
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="hidden sm:block">
              <p className="font-semibold text-foreground text-sm tracking-wide uppercase">
                Cor Jesu College
              </p>
              <p className="text-xs text-muted-foreground">
                Student Clearance System
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={onSignIn}
              className="btn btn-cjc-red text-sm"
            >
              Sign In
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
}
