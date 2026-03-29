"use client";

import { Download, X, Share, PlusSquare } from "lucide-react";
import { usePwaInstall } from "@/hooks/usePwaInstall";

interface InstallPwaButtonProps {
  variant?: "hero" | "header";
}

export function InstallPwaButton({ variant = "hero" }: InstallPwaButtonProps) {
  const { canInstall, isIOS, showIOSGuide, setShowIOSGuide, install } =
    usePwaInstall();

  if (!canInstall) return null;

  return (
    <>
      {variant === "hero" ? (
        <button
          onClick={install}
          className="btn bg-white/10 backdrop-blur-sm text-white border border-white/20 hover:bg-white/20 text-base px-8 py-3.5"
        >
          <Download className="w-4 h-4" />
          Install App
        </button>
      ) : (
        <button
          onClick={install}
          className="btn bg-white/90 text-cjc-red hover:bg-white text-sm border border-cjc-red/20"
        >
          <Download className="w-3.5 h-3.5" />
          Install
        </button>
      )}

      {/* iOS Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-sm mx-4 mb-0 sm:mb-0 shadow-2xl animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 text-lg">
                Install CJC Clearance
              </h3>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <p className="text-sm text-gray-600">
                To install this app on your iPhone or iPad:
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-sm font-bold text-blue-600">1</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Open in Safari
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      This only works in Safari, not Chrome or other browsers
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-sm font-bold text-blue-600">2</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                      Tap the Share button
                      <Share className="w-4 h-4 text-blue-600" />
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      The square icon with an arrow at the bottom of Safari
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-sm font-bold text-blue-600">3</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                      Tap &quot;Add to Home Screen&quot;
                      <PlusSquare className="w-4 h-4 text-blue-600" />
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Scroll down in the share menu to find it
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100">
              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full btn btn-cjc-red py-3 text-sm"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
