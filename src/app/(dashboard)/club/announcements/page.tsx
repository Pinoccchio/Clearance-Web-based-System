import { Megaphone } from "lucide-react";

export default function ClubAnnouncementsPage() {
  return (
    <div className="min-h-screen bg-surface-warm">
      <header className="bg-white border-b border-border-warm">
        <div className="px-6 py-5">
          <p className="text-sm text-warm-muted">Club</p>
          <h1 className="text-2xl font-display font-bold text-cjc-navy">Announcements</h1>
        </div>
      </header>

      <div className="p-6">
        <div className="card p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-cjc-blue/10 flex items-center justify-center mx-auto mb-4">
            <Megaphone className="w-8 h-8 text-cjc-blue" />
          </div>
          <h2 className="text-xl font-display font-bold text-cjc-navy mb-2">Announcements</h2>
          <p className="text-warm-muted max-w-md mx-auto">
            Post and manage announcements scoped to this club&apos;s members.
          </p>
        </div>
      </div>
    </div>
  );
}
