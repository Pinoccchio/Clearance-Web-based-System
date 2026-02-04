"use client";

import { useState } from "react";
import {
  Upload,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  Download,
  Trash2,
  Eye,
  File,
  Image,
  FileSpreadsheet,
} from "lucide-react";

export default function StudentDocumentsPage() {
  const [documents] = useState([
    { id: "1", name: "Library Clearance Form.pdf", type: "pdf", size: "245 KB", department: "Library", status: "approved", uploadedAt: "2025-01-15" },
    { id: "2", name: "Receipt_Payment_2025.jpg", type: "image", size: "1.2 MB", department: "Finance Office", status: "pending", uploadedAt: "2025-01-18" },
    { id: "3", name: "ID_Photo.png", type: "image", size: "856 KB", department: "Registrar", status: "approved", uploadedAt: "2025-01-10" },
    { id: "4", name: "Enrollment_Form.pdf", type: "pdf", size: "128 KB", department: "Registrar", status: "rejected", remarks: "Document is blurry, please reupload", uploadedAt: "2025-01-12" },
  ]);

  const getFileIcon = (type: string) => {
    switch (type) {
      case "pdf": return <FileText className="w-5 h-5 text-danger" />;
      case "image": return <Image className="w-5 h-5 text-cjc-blue" />;
      case "spreadsheet": return <FileSpreadsheet className="w-5 h-5 text-success" />;
      default: return <File className="w-5 h-5 text-warm-muted" />;
    }
  };

  return (
    <div className="min-h-screen bg-surface-warm">
      {/* Header */}
      <header className="bg-white border-b border-border-warm">
        <div className="px-6 py-5">
          <p className="text-sm text-warm-muted">Manage your uploaded documents</p>
          <h1 className="text-2xl font-display font-bold text-cjc-navy">My Documents</h1>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Upload Section */}
        <div className="card p-6">
          <h3 className="font-display font-bold text-cjc-navy mb-4">Upload Document</h3>
          <div className="border-2 border-dashed border-border-warm rounded-lg p-8 text-center hover:border-cjc-blue/50 transition-colors cursor-pointer">
            <Upload className="w-10 h-10 text-warm-muted mx-auto mb-4" />
            <p className="font-medium text-cjc-navy mb-1">Drop your files here or click to browse</p>
            <p className="text-sm text-warm-muted">Supported formats: PDF, JPG, PNG (max 5MB)</p>
            <button className="btn btn-primary mt-4">
              <Upload className="w-4 h-4" />
              Choose File
            </button>
          </div>
        </div>

        {/* Documents List */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-cjc-navy">Uploaded Documents</h3>
            <span className="text-xs px-2.5 py-1 rounded-full bg-cjc-blue/10 text-cjc-blue font-medium">
              {documents.length} files
            </span>
          </div>

          {documents.length > 0 ? (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-surface-warm hover:bg-surface-cream transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center border border-border-warm">
                      {getFileIcon(doc.type)}
                    </div>
                    <div>
                      <p className="font-medium text-cjc-navy">{doc.name}</p>
                      <div className="flex items-center gap-2 text-xs text-warm-muted">
                        <span>{doc.size}</span>
                        <span>·</span>
                        <span>{doc.department}</span>
                        <span>·</span>
                        <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                      </div>
                      {doc.status === "rejected" && doc.remarks && (
                        <p className="text-xs text-danger mt-1">{doc.remarks}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1 ${
                      doc.status === "approved" ? "bg-success/10 text-success" :
                      doc.status === "pending" ? "bg-pending/10 text-pending" :
                      "bg-danger/10 text-danger"
                    }`}>
                      {doc.status === "approved" && <CheckCircle2 className="w-3 h-3" />}
                      {doc.status === "pending" && <Clock className="w-3 h-3" />}
                      {doc.status === "rejected" && <XCircle className="w-3 h-3" />}
                      <span className="capitalize">{doc.status}</span>
                    </span>
                    <div className="flex items-center">
                      <button className="p-2 hover:bg-white rounded-lg transition-colors">
                        <Eye className="w-4 h-4 text-warm-muted" />
                      </button>
                      <button className="p-2 hover:bg-white rounded-lg transition-colors">
                        <Download className="w-4 h-4 text-warm-muted" />
                      </button>
                      <button className="p-2 hover:bg-danger/10 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4 text-danger" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-warm-muted mx-auto mb-3" />
              <p className="font-medium text-cjc-navy">No documents uploaded</p>
              <p className="text-sm text-warm-muted">Upload your clearance documents to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
