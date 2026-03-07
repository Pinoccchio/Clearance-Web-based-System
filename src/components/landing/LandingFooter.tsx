"use client";

import Image from "next/image";
import { Facebook, Music2 } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="bg-[#0a1f36] text-white/70">
      <div className="h-1 bg-ccis-blue-primary"></div>
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-5 gap-10 text-center md:text-left">
          <div className="md:col-span-2">
            <div className="flex flex-col items-center md:items-start gap-3 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/20 shadow-lg bg-white">
                  <Image
                    src="/images/logos/cjc-logo.jpeg"
                    alt="CJC Logo"
                    width={56}
                    height={56}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/20 shadow-lg bg-white">
                  <Image
                    src="/images/logos/ccis-logo.jpg"
                    alt="CCIS Logo"
                    width={56}
                    height={56}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div>
                <p className="text-white font-bold text-xl">Cor Jesu College</p>
                <p className="text-sm text-white/50">
                  Sacred Heart Avenue, Digos City
                </p>
              </div>
            </div>
            <p className="text-sm leading-relaxed max-w-md mx-auto md:mx-0 mb-6">
              A software engineering project developed by Jan Miko A. Guevarra
              and Jan Carlo Surig, students of the College of Special Programs (CSP)
              and College of Computing and Information Sciences (CCIS).
            </p>
          </div>

          <div>
            <h4 className="text-white font-bold mb-5 text-lg">Programs</h4>
            <ul className="space-y-3 text-sm">
              <li className="link-slide-underline hover:text-white transition-colors duration-200 cursor-default">BS Computer Science</li>
              <li className="link-slide-underline hover:text-white transition-colors duration-200 cursor-default">BS Information Technology</li>
              <li className="link-slide-underline hover:text-white transition-colors duration-200 cursor-default">BS Library & Info Science</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-5 text-lg">Contact CCIS</h4>
            <ul className="space-y-3 text-sm">
              <li className="hover:text-white transition-colors duration-200">computerstudies@g.cjc.edu.ph</li>
              <li className="hover:text-white transition-colors duration-200">09082191651</li>
              <li className="hover:text-white transition-colors duration-200">Mon - Fri: 8:00 AM - 5:00 PM</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-5 text-lg">Follow CCIS</h4>
            <div className="flex gap-3 justify-center md:justify-start">
              <a
                href="https://facebook.com/cjccomputerstudies"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon-hover"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://tiktok.com/@cjc.ccis"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon-hover"
                aria-label="TikTok"
              >
                <Music2 className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm">
            &copy; {new Date().getFullYear()} Cor Jesu College. All rights reserved.
          </p>
          <p className="text-sm text-white font-semibold">
            College of Computing and Information Sciences
          </p>
        </div>
      </div>
    </footer>
  );
}
