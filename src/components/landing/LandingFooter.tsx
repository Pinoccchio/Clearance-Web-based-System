"use client";

import Image from "next/image";
import { Facebook, Smartphone, Phone, Mail, MapPin } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="bg-cjc-red-dark text-white/80">
      <div className="h-1 bg-cjc-gold"></div>
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-5 gap-10 text-center md:text-left">
          <div className="md:col-span-2">
            <div className="flex flex-col items-center md:items-start gap-3 mb-6">
              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/20 shadow-lg bg-white">
                <Image
                  src="/images/logos/cjc-logo.jpeg"
                  alt="CJC Logo"
                  width={56}
                  height={56}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <p className="text-white font-bold text-xl">Cor Jesu College</p>
                <p className="text-sm text-white/60">
                  Sacred Heart Avenue, Digos City
                </p>
              </div>
            </div>
            <p className="text-sm leading-relaxed max-w-md mx-auto md:mx-0 mb-6">
              A software engineering project developed by Jan Miko A. Guevarra
              and Jan Carlo Surig, students of Cor Jesu College.
            </p>
          </div>

          <div>
            <h4 className="text-white font-bold mb-5 text-lg">Colleges</h4>
            <ul className="space-y-3 text-sm">
              <li><span className="link-slide-underline hover:text-white transition-colors duration-200 cursor-default">CABE</span></li>
              <li><span className="link-slide-underline hover:text-white transition-colors duration-200 cursor-default">CEDAS</span></li>
              <li><span className="link-slide-underline hover:text-white transition-colors duration-200 cursor-default">CCIS</span></li>
              <li><span className="link-slide-underline hover:text-white transition-colors duration-200 cursor-default">CHS</span></li>
              <li><span className="link-slide-underline hover:text-white transition-colors duration-200 cursor-default">COE</span></li>
              <li><span className="link-slide-underline hover:text-white transition-colors duration-200 cursor-default">CSP</span></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-5 text-lg">Contact Us</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex items-center gap-3 md:justify-start justify-center hover:text-white transition-colors duration-200">
                <Smartphone className="w-4 h-4 text-cjc-gold flex-shrink-0" />
                +63 985 062 0281
              </li>
              <li className="flex items-center gap-3 md:justify-start justify-center hover:text-white transition-colors duration-200">
                <Phone className="w-4 h-4 text-cjc-gold flex-shrink-0" />
                (082) 553-2433
              </li>
              <li className="flex items-center gap-3 md:justify-start justify-center hover:text-white transition-colors duration-200">
                <Mail className="w-4 h-4 text-cjc-gold flex-shrink-0" />
                customerservice@cjc.edu.ph
              </li>
              <li className="flex items-start gap-3 md:justify-start justify-center hover:text-white transition-colors duration-200">
                <MapPin className="w-4 h-4 text-cjc-gold flex-shrink-0 mt-0.5" />
                <span>Sacred Heart Avenue, Digos City, Province of Davao del Sur</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-5 text-lg">Follow CJC</h4>
            <div className="flex gap-3 justify-center md:justify-start">
              <a
                href="https://facebook.com/CorJesuCollegeDigos"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon-hover"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm">
            &copy; {new Date().getFullYear()} Cor Jesu College. All rights reserved.
          </p>
          <p className="text-sm text-white font-semibold">
            Student Clearance System
          </p>
        </div>
      </div>
    </footer>
  );
}
