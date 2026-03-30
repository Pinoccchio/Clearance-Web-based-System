"use client";

import Image from "next/image";
import { Facebook, Globe, Smartphone, Phone, Mail, MapPin } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="bg-cjc-red-dark text-white/70">
      <div className="max-w-6xl mx-auto px-6 py-14">
        <div className="grid md:grid-cols-5 gap-10 text-center md:text-left">
          {/* Logos + Info */}
          <div className="md:col-span-2">
            <div className="flex items-center justify-center md:justify-start gap-4 mb-5">
              <div className="w-14 h-14 rounded-full overflow-hidden bg-white flex-shrink-0">
                <Image
                  src="/images/logos/cjc-logo.jpeg"
                  alt="CJC Logo"
                  width={56}
                  height={56}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="w-14 h-14 rounded-full overflow-hidden bg-white flex-shrink-0">
                <Image
                  src="/images/logos/ccis-logo.jpg"
                  alt="CCIS Logo"
                  width={56}
                  height={56}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <p className="text-white font-bold text-lg mb-1">Cor Jesu College</p>
            <p className="text-sm mb-4">Sacred Heart Avenue, Digos City</p>
            <p className="text-sm leading-relaxed max-w-md mx-auto md:mx-0">
              A digital clearance tracking system for students, departments, offices, organizations, and student governments of Cor Jesu College.
            </p>
          </div>

          {/* Colleges */}
          <div>
            <h4 className="text-white font-bold mb-4">Colleges</h4>
            <ul className="space-y-2.5 text-sm">
              <li>College of Accountancy &amp; Business Education</li>
              <li>College of Education, Arts &amp; Sciences</li>
              <li>College of Computing &amp; Information Sciences</li>
              <li>College of Health Sciences</li>
              <li>College of Engineering</li>
              <li>College of Special Programs</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-bold mb-4">Contact Us</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2.5 md:justify-start justify-center">
                <Smartphone className="w-4 h-4 flex-shrink-0" />
                +63 985 062 0281
              </li>
              <li className="flex items-center gap-2.5 md:justify-start justify-center">
                <Phone className="w-4 h-4 flex-shrink-0" />
                (082) 553-2433
              </li>
              <li className="flex items-center gap-2.5 md:justify-start justify-center">
                <Mail className="w-4 h-4 flex-shrink-0" />
                customerservice@cjc.edu.ph
              </li>
              <li className="flex items-start gap-2.5 md:justify-start justify-center">
                <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>Sacred Heart Avenue,<br />Digos City, Davao del Sur</span>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="text-white font-bold mb-4">Follow CJC</h4>
            <div className="flex gap-3 justify-center md:justify-start">
              <a
                href="https://www.facebook.com/corjesucollege"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors"
                aria-label="Facebook"
                title="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="https://www.cjc.edu.ph"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors"
                aria-label="Official Website"
                title="Official Website"
              >
                <Globe className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center gap-3 text-sm">
          <p>
            &copy; {new Date().getFullYear()} Cor Jesu College. All rights reserved.
          </p>
          <p className="text-white/50">
            Developed by College of Computing &amp; Information Sciences (CCIS)
          </p>
        </div>
      </div>
    </footer>
  );
}
