"use client";

import { GraduationCap, Code2, Monitor, Award, Facebook, Globe, Linkedin } from "lucide-react";

interface SocialLink {
  type: "facebook" | "portfolio" | "linkedin";
  url: string;
}

const developers = [
  {
    name: "Jan Miko A. Guevarra",
    role: "Lead Developer",
    program: "BS Computer Science",
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
    colleges: ["College of Computing & Information Sciences (CCIS)", "College of Special Programs (CSP)"],
    image: "/images/devs_pics/surig/surig_profile-dev.jpg",
    socials: [] as SocialLink[],
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
    <section className="py-24 lg:py-32 bg-background">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <div className="mb-14 text-center fade-in-up">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
            Developed By
          </h2>
        </div>

        {/* Developer Cards */}
        <div className="grid sm:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {developers.map((dev, i) => (
            <div
              key={dev.name}
              className={`group relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 fade-in-up fade-in-up-delay-${i + 1}`}
            >
              {/* Profile Picture — top half */}
              <div className="relative w-full aspect-[4/3] bg-gradient-to-br from-cjc-red via-cjc-red-dark to-cjc-red overflow-hidden">
                <img
                  src={dev.image}
                  alt={dev.name}
                  className="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/30 to-transparent" />
              </div>

              {/* Info — bottom half */}
              <div className="px-6 py-6 text-center">
                <h3 className="font-display font-bold text-xl text-foreground group-hover:text-cjc-red transition-colors duration-200">
                  {dev.name}
                </h3>

                <p className="text-sm font-semibold text-cjc-red mt-1.5 flex items-center justify-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5" />
                  {dev.role}
                </p>

                <div className="mt-5 pt-5 border-t border-border space-y-2.5">
                  <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                    <GraduationCap className="w-4 h-4 text-cjc-gold flex-shrink-0" />
                    {dev.program}
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                    <Monitor className="w-4 h-4 text-cjc-gold flex-shrink-0" />
                    {dev.colleges[0]}
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                    <Award className="w-4 h-4 text-cjc-gold flex-shrink-0" />
                    {dev.colleges[1]}
                  </p>
                </div>

                {/* Social Links */}
                {dev.socials.length > 0 && (
                  <div className="mt-5 pt-5 border-t border-border flex items-center justify-center gap-3">
                    {dev.socials.map((social) => {
                      const Icon = socialIcons[social.type];
                      return (
                        <a
                          key={social.type}
                          href={social.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-cjc-red hover:text-white transition-all duration-200"
                          aria-label={socialLabels[social.type]}
                          title={socialLabels[social.type]}
                        >
                          <Icon className="w-4 h-4" />
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
