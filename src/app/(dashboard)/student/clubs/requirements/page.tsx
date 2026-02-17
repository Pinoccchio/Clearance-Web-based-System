import Header from "@/components/layout/header";
import { CheckSquare } from "lucide-react";

export default function StudentClubsRequirementsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Clubs Requirements" subtitle="Clubs Requirements" />

      <div className="p-6">
        <div className="card p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-cjc-blue/10 flex items-center justify-center mx-auto mb-4">
            <CheckSquare className="w-8 h-8 text-cjc-blue" />
          </div>
          <h2 className="text-xl font-display font-bold text-cjc-navy mb-2">Clubs Requirements</h2>
          <p className="text-warm-muted max-w-md mx-auto">
            View requirements for your enrolled clubs. This feature is being implemented by another team member — coming soon.
          </p>
        </div>
      </div>
    </div>
  );
}
