"use client";

import Image from "next/image";
import { Code2, Facebook, Globe, Linkedin } from "lucide-react";

interface SocialLink {
  type: "facebook" | "portfolio" | "linkedin";
  url: string;
}

const developers = [
  {
    name: "Jan Miko A. Guevarra",
    role: "Lead Full-Stack Developer",
    program: "BS Computer Science",
    year: "3rd Year",
    colleges: ["College of Computing & Information Sciences (CCIS)", "College of Special Programs (CSP)"],
    image: "/images/devs_pics/guevarra/guevarra_profile-dev.jpg",
    socials: [
      { type: "facebook", url: "https://www.facebook.com/Renbards619" },
      { type: "portfolio", url: "https://pinoccchiooo-dev.vercel.app/" },
      { type: "linkedin", url: "https://linkedin.com/in/jan-miko-guevarra-894088294" },
    ] as SocialLink[],
  },
  {
    name: "Jan Carlo Surig",
    role: "Requirements Analyst & Developer",
    program: "BS Computer Science",
    year: "3rd Year",
    colleges: ["College of Computing & Information Sciences (CCIS)", "College of Special Programs (CSP)"],
    image: "/images/devs_pics/surig/surig_profile-dev.jpg",
    socials: [
      { type: "facebook", url: "https://www.facebook.com/jancarlo.surig.7" },
    ] as SocialLink[],
  },
];

const socialIcons = {
  facebook: Facebook,
  portfolio: Globe,
  linkedin: Linkedin,
};

const socialLabels = {
  facebook: "Facebook",
  portfolio: "Portfolio",
  linkedin: "LinkedIn",
};

export function DeveloperStickers() {
  return (
    <section className="py-24 lg:py-32 bg-surface-warm">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <div className="mb-14 text-center fade-in-up">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2 font-medium">
            Software Engineering · Student Project
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
            Developed By
          </h2>
          <p className="text-muted-foreground text-sm mt-3">
            Cor Jesu College · College of Computing &amp; Information Sciences
          </p>
        </div>

        {/* Developer Cards */}
        <div className="grid sm:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {developers.map((dev, i) => (
            <div
              key={dev.name}
              className={`group relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 fade-in-up fade-in-up-delay-${i + 1}`}
            >
              {/* Red ID-card header band */}
              <div className="bg-cjc-red-dark px-5 pt-5 pb-16 relative">
                {/* CJC logo watermark top-right */}
                <div className="absolute top-3 right-4 opacity-20">
                  <Image
                    src="/images/logos/cjc-logo.jpeg"
                    alt="CJC"
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                </div>
                <p className="text-white/60 text-xs uppercase tracking-widest font-medium">
                  Cor Jesu College
                </p>
                <p className="text-white/80 text-xs mt-0.5">
                  Student Clearance System
                </p>
              </div>

              {/* Profile photo — overlaps the red band */}
              <div className="relative -mt-12 flex justify-center">
                <div className="w-24 h-24 rounded-full border-4 border-card overflow-hidden shadow-md bg-cjc-red">
                  <img
                    src={dev.image}
                    alt={dev.name}
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              </div>

              {/* Info */}
              <div className="px-6 pb-6 pt-4 text-center">
                <h3 className="font-display font-bold text-lg text-foreground group-hover:text-cjc-red transition-colors duration-200">
                  {dev.name}
                </h3>

                <p className="text-xs font-semibold text-cjc-red mt-1 flex items-center justify-center gap-1.5">
                  <Code2 className="w-3 h-3" />
                  {dev.role}
                </p>

                {/* Academic details */}
                <div className="mt-4 pt-4 border-t border-border space-y-1.5 text-xs text-muted-foreground">
                  <p>
                    <span className="text-cjc-gold font-semibold">Program:</span>{" "}
                    {dev.program} · {dev.year}
                  </p>
                  {dev.colleges.map((college) => (
                    <p key={college}>{college}</p>
                  ))}
                </div>

                {/* Year badge */}
                <div className="mt-3 flex justify-center">
                  <span className="inline-block px-3 py-0.5 rounded-full bg-cjc-red/10 text-cjc-red text-xs font-medium border border-cjc-red/20">
                    A.Y. 2025–2026
                  </span>
                </div>

                {/* Social Links */}
                {dev.socials.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border flex items-center justify-center gap-3">
                    {dev.socials.map((social) => {
                      const Icon = socialIcons[social.type];
                      return (
                        <a
                          key={social.type}
                          href={social.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-cjc-red hover:text-white transition-all duration-200"
                          aria-label={socialLabels[social.type]}
                          title={socialLabels[social.type]}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
