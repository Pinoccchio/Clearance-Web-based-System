"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/layout/header";
import { useAuth } from "@/contexts/auth-context";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  FolderOpen,
  FileText,
  Download,
  RefreshCw,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Upload,
  ExternalLink,
  X,
} from "lucide-react";
import {
  getStudentDocuments,
  getAllDepartments,
  getAllOffices,
  getAllClubs,
  StudentDocument,
} from "@/lib/supabase";

function statusBadge(status: StudentDocument["status"]) {
  switch (status) {
    case "verified":
      return (
        <Badge variant="approved" size="sm">
          <CheckCircle className="w-3 h-3" />
          Verified
        </Badge>
      );
    case "rejected":
      return (
        <Badge variant="rejected" size="sm">
          <XCircle className="w-3 h-3" />
          Rejected
        </Badge>
      );
    case "submitted":
      return (
        <Badge variant="pending" size="sm">
          <Upload className="w-3 h-3" />
          Submitted
        </Badge>
      );
    default:
      return (
        <Badge variant="neutral" size="sm">
          <Clock className="w-3 h-3" />
          Pending
        </Badge>
      );
  }
}

function fileName(url: string): string {
  try {
    const parts = decodeURIComponent(new URL(url).pathname).split("/");
    return parts[parts.length - 1];
  } catch {
    return url.split("/").pop() ?? url;
  }
}

async function downloadFile(url: string, name: string) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = name;
    a.click();
    URL.revokeObjectURL(objectUrl);
  } catch {
    window.open(url, "_blank");
  }
}

export default function StudentDocumentsPage() {
  const { profile } = useAuth();
  const [docs, setDocs] = useState<StudentDocument[]>([]);
  const [sourceNames, setSourceNames] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!profile?.id) return;
    setIsLoading(true);
    setError(null);
    try {
      const [documents, depts, offices, clubs] = await Promise.all([
        getStudentDocuments(profile.id),
        getAllDepartments(),
        getAllOffices(),
        getAllClubs(),
      ]);

      const names: Record<string, string> = {};
      for (const d of depts) names[d.id] = `${d.code} — ${d.name}`;
      for (const o of offices) names[o.id] = `${o.code} — ${o.name}`;
      for (const c of clubs) names[c.id] = `${c.code} — ${c.name}`;
      setSourceNames(names);
      setDocs(documents);
    } catch (err) {
      console.error("Error loading documents:", err);
      setError("Failed to load documents. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Group docs by semester
  const grouped = docs.reduce<Record<string, StudentDocument[]>>((acc, doc) => {
    const key = `${doc.academic_year} — ${doc.semester}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(doc);
    return acc;
  }, {});

  const totalFiles = docs.reduce((sum, d) => sum + d.file_urls.length, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <a
            href={lightboxUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open original
          </a>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxUrl}
            alt="Document preview"
            className="max-w-full max-h-full rounded-lg shadow-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <Header
        title="Documents"
        subtitle="All files you have uploaded for your clearance requirements"
        actions={
          <Button variant="secondary" onClick={loadData} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Summary */}
        {!isLoading && !error && (
          <div className="grid grid-cols-3 gap-4">
            <Card padding="md" className="text-center">
              <p className="text-2xl font-bold text-cjc-navy">{totalFiles}</p>
              <p className="text-sm text-gray-500">Total Files</p>
            </Card>
            <Card padding="md" className="text-center">
              <p className="text-2xl font-bold text-success">
                {docs.filter((d) => d.status === "verified").length}
              </p>
              <p className="text-sm text-gray-500">Verified</p>
            </Card>
            <Card padding="md" className="text-center">
              <p className="text-2xl font-bold text-cjc-blue">
                {docs.filter((d) => d.status === "submitted").length}
              </p>
              <p className="text-sm text-gray-500">Under Review</p>
            </Card>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-cjc-navy animate-spin" />
            <span className="ml-3 text-gray-600">Loading documents...</span>
          </div>
        ) : error ? (
          <Card padding="lg" className="text-center">
            <p className="text-red-600">{error}</p>
          </Card>
        ) : docs.length === 0 ? (
          <EmptyState
            icon={<FolderOpen className="w-8 h-8 text-gray-400" />}
            title="No Documents Yet"
            description="Files you upload when submitting clearance requirements will appear here."
          />
        ) : (
          Object.entries(grouped).map(([semesterKey, items]) => (
            <div key={semesterKey} className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                {semesterKey}
              </h2>
              {items.map((doc) => (
                <Card key={doc.submission_id} padding="md">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <p className="font-semibold text-cjc-navy text-sm">
                        {doc.requirement_name}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {sourceNames[doc.source_id] ?? doc.source_id} ·{" "}
                        <span className="capitalize">{doc.source_type}</span>
                      </p>
                    </div>
                    {statusBadge(doc.status)}
                  </div>

                  {doc.remarks && (
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2 mb-3">
                      {doc.remarks}
                    </p>
                  )}

                  <div className="space-y-2">
                    {doc.file_urls.map((url, idx) => {
                      const isPdf = url.toLowerCase().includes(".pdf");
                      return (
                        <div
                          key={idx}
                          className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-colors"
                        >
                          {/* Thumbnail or PDF icon */}
                          {isPdf ? (
                            <button
                              type="button"
                              onClick={() => downloadFile(url, fileName(url))}
                              className="w-10 h-10 rounded-md bg-red-50 border border-red-100 flex items-center justify-center flex-shrink-0 hover:bg-red-100 transition-colors"
                              title="Download PDF"
                            >
                              <FileText className="w-5 h-5 text-red-400" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setLightboxUrl(url)}
                              className="relative w-10 h-10 rounded-md overflow-hidden border border-gray-200 hover:border-cjc-blue/50 flex-shrink-0 group transition-colors"
                              title="Click to preview"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={url}
                                alt={`File ${idx + 1}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).style.display = "none";
                                  (e.currentTarget.nextElementSibling as HTMLElement | null)?.style.setProperty("display", "flex");
                                }}
                              />
                              <div className="hidden w-full h-full items-center justify-center bg-gray-100">
                                <FileText className="w-4 h-4 text-gray-400" />
                              </div>
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                <ExternalLink className="w-3 h-3 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                              </div>
                            </button>
                          )}

                          {/* Filename */}
                          <span className="text-xs text-gray-700 truncate flex-1 min-w-0">
                            {fileName(url)}
                          </span>

                          {/* Download */}
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); downloadFile(url, fileName(url)); }}
                            className="flex-shrink-0 text-gray-400 hover:text-cjc-blue transition-colors"
                            title="Download file"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {doc.submitted_at && (
                    <p className="text-xs text-gray-400 mt-2">
                      Uploaded{" "}
                      {new Date(doc.submitted_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  )}
                </Card>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
