"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/Button";
import {
  Upload,
  Download,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  FileWarning,
} from "lucide-react";
import {
  parseExcelFile,
  validateRows,
  downloadExcelTemplate,
  StudentRow,
  ValidationError,
} from "@/lib/batch-import";
import {
  supabase,
  getAllDepartments,
  getAllClubs,
  getAllCspsgDivisions,
  Department,
  Club,
  Course,
  CspsgDivision,
} from "@/lib/supabase";
import { useToast } from "@/components/ui/Toast";

interface BatchImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = "upload" | "preview" | "importing" | "results";

interface ImportResult {
  email: string;
  studentId: string;
  success: boolean;
  error?: string;
}

export function BatchImportModal({
  isOpen,
  onClose,
  onSuccess,
}: BatchImportModalProps) {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [validRows, setValidRows] = useState<StudentRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [importResults, setImportResults] = useState<ImportResult[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Reference data for validation and template generation
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [cspsgDivisions, setCspsgDivisions] = useState<CspsgDivision[]>([]);
  const [loadingRef, setLoadingRef] = useState(true);

  // Fetch reference data when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchReferenceData();
    }
  }, [isOpen]);

  const fetchReferenceData = async () => {
    setLoadingRef(true);
    try {
      const [deptsData, clubsData, divsData] = await Promise.all([
        getAllDepartments(),
        getAllClubs(),
        getAllCspsgDivisions(),
      ]);

      setDepartments(deptsData.filter(d => d.status === "active"));
      setClubs(clubsData.filter(c => c.status === "active"));
      setCspsgDivisions(divsData.filter(d => d.status === "active"));

      // Fetch all courses for all active departments
      const allCourses: Course[] = [];
      for (const dept of deptsData.filter(d => d.status === "active")) {
        const { data: deptCourses } = await supabase
          .from("courses")
          .select("*")
          .eq("department_id", dept.id)
          .eq("status", "active");
        if (deptCourses) {
          allCourses.push(...deptCourses);
        }
      }
      setCourses(allCourses);
    } catch (error) {
      console.error("Error fetching reference data:", error);
      showToast("error", "Error", "Failed to load reference data");
    } finally {
      setLoadingRef(false);
    }
  };

  // Reset state when modal closes
  const handleClose = () => {
    setStep("upload");
    setFile(null);
    setValidRows([]);
    setValidationErrors([]);
    setImportResults([]);
    setImportProgress(0);
    setIsLoading(false);
    onClose();
  };

  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith(".xlsx")) {
      showToast("error", "Invalid File", "Please select an Excel file (.xlsx)");
      return;
    }

    setFile(selectedFile);
    setIsLoading(true);

    try {
      // Read and parse file
      const buffer = await selectedFile.arrayBuffer();
      const { data } = parseExcelFile(buffer);

      // Validate rows
      const result = validateRows(data, departments, courses, clubs, cspsgDivisions);
      setValidRows(result.rows);
      setValidationErrors(result.errors);

      // Move to preview step
      setStep("preview");
    } catch (error) {
      console.error("Error parsing file:", error);
      showToast("error", "Parse Error", "Failed to parse Excel file");
    } finally {
      setIsLoading(false);
    }
  };

  // Download template
  const handleDownloadTemplate = () => {
    downloadExcelTemplate(departments, courses, clubs, cspsgDivisions);
    showToast("success", "Template Downloaded", "Check your downloads folder");
  };

  // Start import
  const handleImport = async () => {
    if (validRows.length === 0) return;

    setStep("importing");
    setImportProgress(0);

    try {
      // Get current session for auth
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Not authenticated");
      }

      // Send batch request
      const response = await fetch("/api/admin/users/batch", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ users: validRows }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Import failed");
      }

      setImportResults(data.results);
      setImportProgress(100);
      setStep("results");

      // Notify success
      const successCount = data.summary.successful;
      const failedCount = data.summary.failed;
      if (failedCount === 0) {
        showToast("success", "Import Complete", `Successfully imported ${successCount} users`);
      } else {
        showToast("warning", "Import Complete", `${successCount} succeeded, ${failedCount} failed`);
      }

      // Refresh user list
      onSuccess();
    } catch (error) {
      console.error("Import error:", error);
      showToast("error", "Import Failed", error instanceof Error ? error.message : "Unknown error");
      setStep("preview");
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (step) {
      case "upload":
        return renderUploadStep();
      case "preview":
        return renderPreviewStep();
      case "importing":
        return renderImportingStep();
      case "results":
        return renderResultsStep();
    }
  };

  // Upload step
  const renderUploadStep = () => (
    <div className="space-y-6">
      {/* Download Template */}
      <div className="p-4 bg-cjc-blue/5 border border-cjc-blue/20 rounded-lg">
        <div className="flex items-start gap-3">
          <FileSpreadsheet className="w-5 h-5 text-cjc-blue mt-0.5" />
          <div className="flex-1">
            <h3 className="font-medium text-cjc-navy">Download Template First</h3>
            <p className="text-sm text-cjc-navy mt-1">
              Download our Excel template with the correct format and sample data.
              The template includes a reference sheet with all valid values.
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-3"
              onClick={handleDownloadTemplate}
              disabled={loadingRef}
            >
              <Download className="w-4 h-4" />
              {loadingRef ? "Loading..." : "Download Template"}
            </Button>
          </div>
        </div>
      </div>

      {/* Upload Area */}
      <div
        className="relative border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-cjc-red transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          className="hidden"
        />
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-lg font-medium text-cjc-navy">
          Click to upload or drag and drop
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Excel files only (.xlsx)
        </p>
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-xl">
            <Loader2 className="w-8 h-8 text-cjc-red animate-spin" />
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="text-sm text-gray-500 space-y-2">
        <p className="font-medium text-cjc-navy">Important Notes:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Students will be created <strong>without passwords</strong></li>
          <li>Students must use &quot;Forgot Password&quot; on the login page to set their password</li>
          <li>Maximum 100 students per import</li>
          <li>Duplicate emails or student IDs will be skipped</li>
        </ul>
      </div>
    </div>
  );

  // Preview step
  const renderPreviewStep = () => (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-gray-50 rounded-lg text-center">
          <p className="text-2xl font-bold text-cjc-navy">{validRows.length + validationErrors.length}</p>
          <p className="text-sm text-gray-500">Total Rows</p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg text-center">
          <p className="text-2xl font-bold text-green-600">{validRows.length}</p>
          <p className="text-sm text-gray-500">Valid</p>
        </div>
        <div className="p-4 bg-red-50 rounded-lg text-center">
          <p className="text-2xl font-bold text-red-600">{validationErrors.length}</p>
          <p className="text-sm text-gray-500">Errors</p>
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="border border-red-200 rounded-lg overflow-hidden">
          <div className="bg-red-50 px-4 py-2 border-b border-red-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="font-medium text-red-900">Validation Errors</span>
            </div>
          </div>
          <div className="max-h-40 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Row</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Field</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {validationErrors.slice(0, 20).map((error, i) => (
                  <tr key={i}>
                    <td className="px-4 py-2 text-gray-600">{error.row}</td>
                    <td className="px-4 py-2 text-gray-600">{error.field}</td>
                    <td className="px-4 py-2 text-red-600">{error.message}</td>
                  </tr>
                ))}
                {validationErrors.length > 20 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-2 text-center text-gray-500">
                      ... and {validationErrors.length - 20} more errors
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Valid Rows Preview */}
      {validRows.length > 0 && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
            <span className="font-medium text-cjc-navy">Preview ({validRows.length} students)</span>
          </div>
          <div className="overflow-x-auto">
          <div className="max-h-60 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-600 text-xs">Student ID</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600 text-xs">First Name</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600 text-xs">Middle Name</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600 text-xs">Last Name</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600 text-xs">Email</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600 text-xs">Birthday</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600 text-xs">Dept</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600 text-xs">Course</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600 text-xs">Year</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600 text-xs">Clubs</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600 text-xs">CSPSG Div</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {validRows.slice(0, 10).map((row, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 font-mono text-xs">{row.studentId}</td>
                    <td className="px-3 py-2 text-xs">{row.firstName}</td>
                    <td className="px-3 py-2 text-xs text-gray-500">{row.middleName || '-'}</td>
                    <td className="px-3 py-2 text-xs">{row.lastName}</td>
                    <td className="px-3 py-2 text-xs text-gray-500">{row.email}</td>
                    <td className="px-3 py-2 text-xs text-gray-500">{row.dateOfBirth || '-'}</td>
                    <td className="px-3 py-2 text-xs">{row.department}</td>
                    <td className="px-3 py-2 text-xs">{row.course}</td>
                    <td className="px-3 py-2 text-xs">{row.yearLevel}</td>
                    <td className="px-3 py-2 text-xs text-gray-500">{row.enrolledClubCodes || '-'}</td>
                    <td className="px-3 py-2 text-xs text-gray-500">{row.cspsgDivisionCode || '-'}</td>
                  </tr>
                ))}
                {validRows.length > 10 && (
                  <tr>
                    <td colSpan={11} className="px-3 py-2 text-center text-gray-500 text-xs">
                      ... and {validRows.length - 10} more students
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="secondary" onClick={() => {
          setStep("upload");
          setFile(null);
          setValidRows([]);
          setValidationErrors([]);
        }}>
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <Button
          variant="primary"
          onClick={handleImport}
          disabled={validRows.length === 0}
        >
          Import {validRows.length} Students
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );

  // Importing step
  const renderImportingStep = () => (
    <div className="py-12 text-center space-y-6">
      <div className="relative w-24 h-24 mx-auto">
        <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
        <div
          className="absolute inset-0 rounded-full border-4 border-cjc-red border-t-transparent animate-spin"
          style={{ animationDuration: "1s" }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Upload className="w-8 h-8 text-cjc-red" />
        </div>
      </div>
      <div>
        <h3 className="text-xl font-semibold text-cjc-navy">Importing Students</h3>
        <p className="text-gray-500 mt-1">Please wait while we create the accounts...</p>
      </div>
      <div className="max-w-xs mx-auto">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-cjc-red transition-all duration-300"
            style={{ width: `${importProgress}%` }}
          />
        </div>
        <p className="text-sm text-gray-500 mt-2">{importProgress}% complete</p>
      </div>
    </div>
  );

  // Results step
  const renderResultsStep = () => {
    const successCount = importResults.filter(r => r.success).length;
    const failedCount = importResults.filter(r => !r.success).length;
    const failedResults = importResults.filter(r => !r.success);

    return (
      <div className="space-y-6">
        {/* Summary */}
        <div className="text-center py-6">
          {failedCount === 0 ? (
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <FileWarning className="w-8 h-8 text-amber-600" />
            </div>
          )}
          <h3 className="text-xl font-semibold text-cjc-navy">
            {failedCount === 0 ? "Import Complete!" : "Import Complete with Issues"}
          </h3>
          <p className="text-gray-500 mt-1">
            {successCount} student{successCount !== 1 ? "s" : ""} imported successfully
            {failedCount > 0 && `, ${failedCount} failed`}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="text-2xl font-bold text-green-600">{successCount}</span>
            </div>
            <p className="text-sm text-green-700">Successful</p>
          </div>
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <XCircle className="w-5 h-5 text-red-600" />
              <span className="text-2xl font-bold text-red-600">{failedCount}</span>
            </div>
            <p className="text-sm text-red-700">Failed</p>
          </div>
        </div>

        {/* Failed Details */}
        {failedResults.length > 0 && (
          <div className="border border-red-200 rounded-lg overflow-hidden">
            <div className="bg-red-50 px-4 py-2 border-b border-red-200">
              <span className="font-medium text-red-900">Failed Imports</span>
            </div>
            <div className="max-h-40 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-600">Student ID</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-600">Email</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-600">Error</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {failedResults.map((result, i) => (
                    <tr key={i}>
                      <td className="px-4 py-2 font-mono text-xs">{result.studentId}</td>
                      <td className="px-4 py-2 text-gray-500">{result.email}</td>
                      <td className="px-4 py-2 text-red-600">{result.error}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Next Steps */}
        <div className="p-4 bg-cjc-blue/5 border border-cjc-blue/20 rounded-lg">
          <h4 className="font-medium text-cjc-navy mb-2">Next Steps</h4>
          <ul className="text-sm text-cjc-navy space-y-1">
            <li>1. Inform students that their accounts have been created</li>
            <li>2. Students should go to the login page and click &quot;Forgot Password&quot;</li>
            <li>3. They will receive an email to set their initial password</li>
          </ul>
        </div>

        {/* Close Button */}
        <div className="text-center">
          <Button variant="primary" onClick={handleClose}>
            Done
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-2xl">
      <div className="p-4 sm:p-6">
        {/* Header */}
        <div className="mb-6 pr-8">
          <h2 className="text-xl font-bold text-cjc-navy">Import Students</h2>
          <p className="text-sm text-gray-500">
            Batch import students from an Excel file
          </p>
        </div>

        {/* Progress Indicator */}
        {(step === "preview" || step === "importing" || step === "results") && (
          <div className="flex items-center gap-2 mb-6">
            {["upload", "preview", "importing", "results"].map((s, i) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                    step === s || ["upload", "preview", "importing", "results"].indexOf(step) > i
                      ? "bg-cjc-red text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {i + 1}
                </div>
                {i < 3 && (
                  <div
                    className={`w-12 h-1 transition-colors ${
                      ["upload", "preview", "importing", "results"].indexOf(step) > i
                        ? "bg-cjc-red"
                        : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Step Content */}
        {renderStepContent()}
      </div>
    </Modal>
  );
}
