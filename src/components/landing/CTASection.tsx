"use client";

import { ArrowRight } from "lucide-react";

interface CTASectionProps {
  onSignIn: () => void;
}

export function CTASection({ onSignIn }: CTASectionProps) {
  return (
    <section className="bg-cjc-cta py-20 lg:py-28">
      <div className="max-w-4xl mx-auto px-6 text-center fade-in-up">
        <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
          Ready to check your clearance?
        </h2>

        <p className="text-white/80 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
          Sign in to see which departments and offices have cleared you, and what requirements you still need to complete.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={onSignIn}
            className="btn bg-white text-cjc-red hover:bg-gray-100 text-base px-10 py-4 font-semibold"
          >
            Sign In to Get Started
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
