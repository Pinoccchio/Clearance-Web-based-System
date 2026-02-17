import Header from "@/components/layout/header";
import { Upload } from "lucide-react";

export default function StudentClubsSubmitPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Submit Club Clearance" subtitle="Submit Club Clearance" />

      <div className="p-6">
        <div className="card p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-cjc-blue/10 flex items-center justify-center mx-auto mb-4">
            <Upload className="w-8 h-8 text-cjc-blue" />
          </div>
          <h2 className="text-xl font-display font-bold text-cjc-navy mb-2">Submit Club Clearance</h2>
          <p className="text-warm-muted max-w-md mx-auto">
            Submit clearance documents to your enrolled clubs. This feature is being implemented by another team member — coming soon.
          </p>
        </div>
      </div>
    </div>
  );
}
