import { Users } from "lucide-react";

export default function DepartmentStudentsPage() {
  return (
    <div className="min-h-screen bg-surface-warm">
      <header className="bg-white border-b border-border-warm">
        <div className="px-6 py-5">
          <p className="text-sm text-warm-muted">Department</p>
          <h1 className="text-2xl font-display font-bold text-cjc-navy">Students</h1>
        </div>
      </header>

      <div className="p-6">
        <div className="card p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-ccis-blue-primary/10 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-ccis-blue-primary" />
          </div>
          <h2 className="text-xl font-display font-bold text-cjc-navy mb-2">Students</h2>
          <p className="text-warm-muted max-w-md mx-auto">
            View students enrolled under this department and their current clearance status.
          </p>
        </div>
      </div>
    </div>
  );
}
