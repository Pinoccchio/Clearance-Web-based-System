const fs = await import("node:fs/promises");
const path = await import("node:path");
const { Presentation, PresentationFile } = await import("@oai/artifact-tool");

const W = 1280;
const H = 720;

const OUT_DIR = path.resolve("C:/Users/User/Documents/first_year_files/THIRD_YEAR/SOFT_ENG/1/clearance-web-based-system/output/clearance-monitoring-presentation/outputs");
const SCRATCH_DIR = path.resolve("C:/Users/User/Documents/first_year_files/THIRD_YEAR/SOFT_ENG/1/clearance-web-based-system/output/clearance-monitoring-presentation/tmp");
const PREVIEW_DIR = path.join(SCRATCH_DIR, "preview");

const MAROON = "#6E131C";
const MAROON_DARK = "#3F0B12";
const GOLD = "#D39D42";
const GREEN = "#1E9B61";
const CREAM = "#F8F3E7";
const WHITE = "#FFFFFF";
const INK = "#16202A";
const INK_SOFT = "#42505C";
const BORDER = "#D7D9DE";
const PANEL = "#FFFDF8";
const SKY = "#EEF6FF";
const SAND = "#FBF4E1";
const MINT = "#EAF8F1";
const BLUSH = "#FFF0EE";

const TITLE_FACE = "Georgia";
const BODY_FACE = "Aptos";
const MONO_FACE = "Consolas";

const slides = [
  {
    title: "Clearance Monitoring Web-Based System",
    subtitle: "with Attendance Integration",
    body:
      "A role-based digital platform for student clearance, requirement tracking, event attendance validation, and review workflows.",
    notes:
      "Introduce the platform as a combined web and mobile system. Emphasize that clearance processing, attendance validation, and staff review all share the same backend and rule set.",
  },
  {
    title: "Problem and Objectives",
    bullets: [
      "Traditional clearance is paper-based, slow, and difficult to track.",
      "Students lack real-time visibility into missing, completed, and returned requirements.",
      "Offices and organizations need a consistent review, approval, and escalation workflow.",
      "Attendance-linked requirements should be validated automatically instead of manually checked.",
    ],
    calloutTitle: "Project Goal",
    calloutBody:
      "Centralize submission, review, attendance validation, announcements, and status tracking in one secure system.",
    notes:
      "Frame the problem first, then explain the system objective. The audience should understand why this became a multi-role platform instead of just a simple document uploader.",
  },
  {
    title: "System Overview",
    bullets: [
      "Web app for students, staff heads, and administrators",
      "Flutter mobile app for event attendance scanning and recording",
      "Supabase backend for authentication, storage, database, and realtime updates",
      "Database-side business rules for submission validation, status history, and revalidation",
    ],
    calloutTitle: "Supported Roles",
    calloutBody:
      "Students, Offices, Departments, Clubs, CSG, CSPSG, CSG-LGU, CSP Division, and Admin",
    notes:
      "Explain that the web app is the main operational console while the mobile app specializes in attendance-based workflows. Mention that multiple organizations share one backend model.",
  },
  {
    title: "Architecture",
    notes:
      "Walk from users to clients, then to the Supabase backend services. Clarify that the database is not just storage: it also contains RPCs, triggers, and row-level security.",
  },
  {
    title: "Technology Stack",
    bullets: [
      "Web: Next.js, React, TypeScript, Tailwind CSS",
      "Mobile: Flutter, Dart, supabase_flutter, mobile_scanner",
      "Backend: Supabase Auth, PostgreSQL, Storage, Realtime",
      "Supporting features: QR or ID attendance, file uploads, Excel import, password reset by email",
    ],
    notes:
      "Keep this slide practical. The purpose is to show that the stack is modern, cross-platform, and aligned with the actual implementation in the repositories.",
  },
  {
    title: "Database Design",
    bullets: [
      "profiles stores identity, roles, and organization membership",
      "requirements defines source-specific clearance rules",
      "clearance_requests and clearance_items track per-student progress",
      "requirement_submissions stores uploaded proof, confirmations, or scan fulfillment",
      "events and attendance_records power attendance-based requirements",
      "clearance_item_history and announcements support auditability and communication",
    ],
    notes:
      "This is the data model slide. Focus on how the entities connect to the workflow instead of listing every column.",
  },
  {
    title: "Security and Access Control",
    bullets: [
      "Authentication is handled by Supabase Auth.",
      "Authorization is role-based for student, staff, and admin users.",
      "Row-Level Security limits data access by role and ownership.",
      "Server-side RPCs validate clearance submission before status changes.",
      "Triggers and revalidation logic reset invalid submissions when requirements or event rules change.",
    ],
    calloutTitle: "Security Principle",
    calloutBody: "The frontend cannot directly force approval or submission state. The database remains the final authority.",
    notes:
      "Emphasize trust boundaries here. Students can interact from the UI, but completion and status changes are still enforced by backend rules.",
  },
  {
    title: "Use Case Diagram",
    notes:
      "Explain the actors and the main interactions with the system. The goal is to show the platform supports different operational responsibilities, not only student submission.",
  },
  {
    title: "Sequence Diagram: Clearance Submission",
    notes:
      "Describe the student submission path from opening the page up to the database validation of completeness. Highlight that incomplete requirements are rejected before the item can become submitted.",
  },
  {
    title: "Sequence Diagram: Attendance Scan and Revalidation",
    notes:
      "Show the mobile attendance flow and explain how requirement fulfillment can happen from attendance. End by mentioning that later rule changes can trigger revalidation and move items back to on hold.",
  },
];

async function ensureDirs() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.mkdir(PREVIEW_DIR, { recursive: true });
}

function addShape(slide, geometry, left, top, width, height, fill, line = BORDER, lineWidth = 1) {
  return slide.shapes.add({
    geometry,
    position: { left, top, width, height },
    fill,
    line: { style: "solid", fill: line, width: lineWidth },
  });
}

function addText(slide, text, left, top, width, height, opts = {}) {
  const shape = addShape(slide, "rect", left, top, width, height, "#00000000", "#00000000", 0);
  shape.text = text;
  shape.text.fontSize = opts.size ?? 20;
  shape.text.color = opts.color ?? INK;
  shape.text.bold = Boolean(opts.bold);
  shape.text.typeface = opts.face ?? BODY_FACE;
  shape.text.alignment = opts.align ?? "left";
  shape.text.verticalAlignment = opts.valign ?? "top";
  shape.text.insets = { left: 0, right: 0, top: 0, bottom: 0 };
  if (opts.autoFit) {
    shape.text.autoFit = opts.autoFit;
  }
  return shape;
}

function addHeaderChrome(slide, index) {
  addShape(slide, "rect", 0, 0, W, H, CREAM, CREAM, 0);
  addShape(slide, "rect", 0, 0, 80, H, MAROON_DARK, MAROON_DARK, 0);
  addShape(slide, "rect", 80, 0, W - 80, 86, WHITE, WHITE, 0);
  addShape(slide, "rect", 80, 86, W - 80, 4, GOLD, GOLD, 0);
  addShape(slide, "roundRect", 1060, 28, 150, 34, "#7A1D28", "#7A1D28", 0);
  addText(slide, `Slide ${index} of ${slides.length}`, 1090, 36, 110, 18, {
    size: 13,
    color: WHITE,
    face: BODY_FACE,
    bold: true,
    align: "center",
  });
}

function addTitleBlock(slide, title, subtitle = "") {
  addText(slide, title, 120, 112, 760, 54, {
    size: 28,
    face: TITLE_FACE,
    bold: true,
    color: MAROON_DARK,
  });
  if (subtitle) {
    addText(slide, subtitle, 120, 168, 850, 36, {
      size: 16,
      face: BODY_FACE,
      color: INK_SOFT,
    });
  }
}

function addBulletsPanel(slide, title, bullets, left = 120, top = 230, width = 670, height = 380) {
  addShape(slide, "roundRect", left, top, width, height, PANEL, BORDER, 1);
  addText(slide, title, left + 28, top + 24, width - 56, 28, {
    size: 18,
    face: BODY_FACE,
    bold: true,
    color: MAROON,
  });
  bullets.forEach((bullet, idx) => {
    addShape(slide, "ellipse", left + 30, top + 76 + idx * 60, 16, 16, GOLD, GOLD, 0);
    addText(slide, bullet, left + 60, top + 72 + idx * 60, width - 90, 42, {
      size: 18,
      face: BODY_FACE,
      color: INK,
      autoFit: "shrinkText",
    });
  });
}

function addCallout(slide, title, body, left = 830, top = 230, width = 340, height = 190, fill = MINT) {
  addShape(slide, "roundRect", left, top, width, height, fill, BORDER, 1);
  addText(slide, title, left + 24, top + 22, width - 48, 26, {
    size: 17,
    face: BODY_FACE,
    bold: true,
    color: MAROON,
  });
  addText(slide, body, left + 24, top + 60, width - 48, height - 82, {
    size: 17,
    face: BODY_FACE,
    color: INK,
    autoFit: "shrinkText",
  });
}

function addFooterNote(slide, text) {
  addShape(slide, "roundRect", 120, 632, 1050, 46, SKY, "#C3D8FF", 1);
  addText(slide, text, 144, 646, 1000, 18, {
    size: 12,
    face: BODY_FACE,
    color: INK_SOFT,
    align: "center",
  });
}

function addDiagramNode(slide, label, left, top, width, height, fill = WHITE, line = BORDER, textColor = INK) {
  addShape(slide, "roundRect", left, top, width, height, fill, line, 1.2);
  addText(slide, label, left + 12, top + 16, width - 24, height - 24, {
    size: 17,
    face: BODY_FACE,
    color: textColor,
    bold: true,
    align: "center",
    valign: "middle",
    autoFit: "shrinkText",
  });
}

function addArrow(slide, label, left, top, width, height, fill = GOLD) {
  addShape(slide, "rightArrow", left, top, width, height, fill, fill, 0);
  if (label) {
    addText(slide, label, left + 8, top + 8, width - 22, height - 16, {
      size: 12,
      face: MONO_FACE,
      color: WHITE,
      bold: true,
      align: "center",
      valign: "middle",
      autoFit: "shrinkText",
    });
  }
}

function addMermaidPanel(slide, title, body, left, top, width, height) {
  addShape(slide, "roundRect", left, top, width, height, "#111827", "#111827", 0);
  addText(slide, title, left + 20, top + 16, width - 40, 24, {
    size: 14,
    face: BODY_FACE,
    color: "#93C5FD",
    bold: true,
  });
  addText(slide, body, left + 20, top + 48, width - 40, height - 68, {
    size: 11,
    face: MONO_FACE,
    color: "#E5E7EB",
    autoFit: "shrinkText",
  });
}

function slide1(presentation) {
  const slide = presentation.slides.add();
  addHeaderChrome(slide, 1);
  addShape(slide, "roundRect", 120, 148, 660, 360, WHITE, BORDER, 1);
  addShape(slide, "roundRect", 800, 148, 370, 360, BLUSH, BORDER, 1);
  addText(slide, slides[0].title, 154, 196, 600, 90, {
    size: 34,
    face: TITLE_FACE,
    color: MAROON_DARK,
    bold: true,
    autoFit: "shrinkText",
  });
  addText(slide, slides[0].subtitle, 154, 286, 520, 34, {
    size: 20,
    face: BODY_FACE,
    color: GOLD,
    bold: true,
  });
  addText(slide, slides[0].body, 154, 346, 560, 112, {
    size: 20,
    face: BODY_FACE,
    color: INK,
    autoFit: "shrinkText",
  });
  addShape(slide, "ellipse", 900, 212, 170, 170, "#FFF6F4", MAROON, 2);
  addText(slide, "WEB\n+\nMOBILE", 925, 252, 120, 90, {
    size: 28,
    face: TITLE_FACE,
    color: MAROON,
    bold: true,
    align: "center",
    valign: "middle",
  });
  addCallout(
    slide,
    "Core Message",
    "The system combines digital clearance processing, attendance validation, and staff review into one centralized platform.",
    840,
    410,
    290,
    110,
    SAND,
  );
  addFooterNote(slide, "Presentation prepared from the implemented web app, mobile app, and Supabase backend design.");
  slide.speakerNotes.setText(slides[0].notes);
}

function standardContentSlide(presentation, index, panelTitle) {
  const data = slides[index - 1];
  const slide = presentation.slides.add();
  addHeaderChrome(slide, index);
  addTitleBlock(slide, data.title);
  addBulletsPanel(slide, panelTitle, data.bullets);
  if (data.calloutTitle && data.calloutBody) {
    addCallout(slide, data.calloutTitle, data.calloutBody, 830, 230, 340, 190, index === 7 ? BLUSH : MINT);
  }
  if (index === 5) {
    addCallout(slide, "Architecture Fit", "The stack supports real-time status updates, secure auth, file storage, and cross-platform attendance operations.", 830, 442, 340, 140, SKY);
  }
  if (index === 6) {
    addCallout(slide, "Workflow Focus", "The schema is centered on clearance items, requirement submissions, events, and attendance records.", 830, 442, 340, 140, SKY);
  }
  if (index === 7) {
    addCallout(slide, "Security Principle", "Business rules stay on the backend so the client cannot directly force sensitive status transitions.", 830, 442, 340, 140, SKY);
  }
  addFooterNote(slide, "All major workflow decisions are enforced by the backend rather than relying only on client-side checks.");
  slide.speakerNotes.setText(data.notes);
}

function slideArchitecture(presentation) {
  const slide = presentation.slides.add();
  addHeaderChrome(slide, 4);
  addTitleBlock(slide, slides[3].title, "Clients, backend services, and database-enforced business rules");
  addShape(slide, "roundRect", 120, 228, 1050, 360, WHITE, BORDER, 1);
  addDiagramNode(slide, "Users\nStudents, Staff, Admin", 160, 292, 170, 96, BLUSH, "#F1B4AF", MAROON_DARK);
  addDiagramNode(slide, "Next.js Web App", 410, 256, 190, 72, SKY, "#B9D5FF", INK);
  addDiagramNode(slide, "Flutter Attendance App", 410, 362, 190, 72, SKY, "#B9D5FF", INK);
  addDiagramNode(slide, "Supabase Backend", 690, 308, 220, 92, MINT, "#A8DFC4", INK);
  addDiagramNode(slide, "Auth", 980, 218, 120, 60, SAND, "#E6C989", INK);
  addDiagramNode(slide, "PostgreSQL", 970, 308, 140, 60, SAND, "#E6C989", INK);
  addDiagramNode(slide, "Storage", 980, 398, 120, 60, SAND, "#E6C989", INK);
  addDiagramNode(slide, "Realtime", 980, 488, 120, 60, SAND, "#E6C989", INK);
  addArrow(slide, "", 330, 320, 70, 28, GOLD);
  addArrow(slide, "", 600, 320, 70, 28, GREEN);
  addArrow(slide, "", 900, 230, 60, 24, GOLD);
  addArrow(slide, "", 900, 320, 60, 24, GOLD);
  addArrow(slide, "", 900, 410, 60, 24, GOLD);
  addArrow(slide, "", 900, 500, 60, 24, GOLD);
  addShape(slide, "roundRect", 700, 472, 210, 70, "#EEF2FF", "#C6CCFF", 1);
  addText(slide, "Business Rules\nRPCs, Triggers, RLS", 724, 492, 162, 36, {
    size: 16,
    face: BODY_FACE,
    color: "#2D3A82",
    bold: true,
    align: "center",
    valign: "middle",
  });
  addFooterNote(slide, "The database layer is responsible for validation, history, access control, and workflow consistency.");
  slide.speakerNotes.setText(slides[3].notes);
}

function slideUseCase(presentation) {
  const slide = presentation.slides.add();
  addHeaderChrome(slide, 8);
  addTitleBlock(slide, slides[7].title, "Main actors and system interactions");
  addShape(slide, "roundRect", 120, 220, 1050, 392, WHITE, BORDER, 1);
  addDiagramNode(slide, "Student", 150, 268, 140, 56, SKY, "#B9D5FF", INK);
  addDiagramNode(slide, "Staff Head", 150, 352, 140, 56, SKY, "#B9D5FF", INK);
  addDiagramNode(slide, "Attendance Scanner", 150, 438, 140, 56, SKY, "#B9D5FF", INK);
  addDiagramNode(slide, "Administrator", 150, 522, 140, 56, SKY, "#B9D5FF", INK);
  addShape(slide, "ellipse", 450, 286, 360, 230, "#FFF8ED", "#F0C77C", 2);
  addText(slide, "Clearance Monitoring\nSystem", 530, 356, 200, 66, {
    size: 28,
    face: TITLE_FACE,
    color: MAROON_DARK,
    bold: true,
    align: "center",
    valign: "middle",
  });
  ["Submit requirements", "Review submissions", "Record attendance", "Manage users"].forEach((label, idx) => {
    addArrow(slide, label, 300, 278 + idx * 84, 130, 28, idx % 2 === 0 ? GOLD : GREEN);
  });
  addShape(slide, "roundRect", 850, 246, 280, 332, MINT, "#B7E5CF", 1);
  addText(
    slide,
    "Key use cases\n\n- View requirements and status\n- Upload files or confirm requirements\n- Submit for review\n- Approve, reject, or place on hold\n- Manage announcements and events\n- Monitor system activity",
    876,
    272,
    228,
    274,
    {
      size: 16,
      face: BODY_FACE,
      color: INK,
      autoFit: "shrinkText",
    },
  );
  addFooterNote(slide, "Different roles share one platform, but each role is limited to its own responsibilities and data scope.");
  slide.speakerNotes.setText(slides[7].notes);
}

function slideSequenceSubmission(presentation) {
  const slide = presentation.slides.add();
  addHeaderChrome(slide, 9);
  addTitleBlock(slide, slides[8].title, "Validation path for student submission");
  addShape(slide, "roundRect", 120, 220, 620, 392, WHITE, BORDER, 1);
  addShape(slide, "roundRect", 770, 220, 400, 392, "#121926", "#121926", 0);
  const columns = [
    { label: "Student", x: 166 },
    { label: "Web App", x: 312 },
    { label: "RPC/API", x: 458 },
    { label: "Database", x: 604 },
  ];
  columns.forEach((column) => {
    addDiagramNode(slide, column.label, column.x - 46, 244, 92, 38, BLUSH, "#F1B4AF", MAROON_DARK);
    addShape(slide, "rect", column.x, 292, 2, 260, "#C8CED6", "#C8CED6", 0);
  });
  const steps = [
    { y: 330, from: 166, to: 312, label: "Open source page" },
    { y: 372, from: 312, to: 458, label: "Load requirements" },
    { y: 414, from: 458, to: 604, label: "Query records" },
    { y: 456, from: 312, to: 458, label: "Sync submissions" },
    { y: 498, from: 458, to: 604, label: "Check completeness" },
    { y: 540, from: 458, to: 312, label: "Return success or error" },
  ];
  steps.forEach((step, idx) => {
    const left = Math.min(step.from, step.to);
    const width = Math.abs(step.to - step.from) + 34;
    addArrow(slide, step.label, left, step.y, width, 26, idx % 2 === 0 ? GOLD : GREEN);
  });
  addMermaidPanel(
    slide,
    "Mermaid Source",
    `sequenceDiagram\n  actor Student\n  participant Web\n  participant API\n  participant DB\n  Student->>Web: Open page\n  Web->>API: Load requirements\n  API->>DB: Query current data\n  Student->>Web: Submit for review\n  Web->>API: submit_clearance_item_if_complete()\n  API->>DB: Validate completeness`,
    792,
    242,
    356,
    348,
  );
  slide.speakerNotes.setText(slides[8].notes);
}

function slideSequenceAttendance(presentation) {
  const slide = presentation.slides.add();
  addHeaderChrome(slide, 10);
  addTitleBlock(slide, slides[9].title, "Attendance fulfillment and later rule revalidation");
  addShape(slide, "roundRect", 120, 220, 620, 392, WHITE, BORDER, 1);
  addShape(slide, "roundRect", 770, 220, 400, 392, "#121926", "#121926", 0);
  const columns = [
    { label: "Staff", x: 166 },
    { label: "Mobile App", x: 312 },
    { label: "Backend", x: 458 },
    { label: "Database", x: 604 },
  ];
  columns.forEach((column) => {
    addDiagramNode(slide, column.label, column.x - 46, 244, 92, 38, BLUSH, "#F1B4AF", MAROON_DARK);
    addShape(slide, "rect", column.x, 292, 2, 260, "#C8CED6", "#C8CED6", 0);
  });
  const steps = [
    { y: 330, from: 166, to: 312, label: "Open event screen" },
    { y: 372, from: 312, to: 458, label: "Record scan" },
    { y: 414, from: 458, to: 604, label: "Save attendance" },
    { y: 456, from: 458, to: 604, label: "Fulfill linked requirement" },
    { y: 498, from: 458, to: 604, label: "Revalidate if rules change" },
    { y: 540, from: 458, to: 312, label: "Return attendance result" },
  ];
  steps.forEach((step, idx) => {
    const left = Math.min(step.from, step.to);
    const width = Math.abs(step.to - step.from) + 34;
    addArrow(slide, step.label, left, step.y, width, 26, idx % 2 === 0 ? GREEN : GOLD);
  });
  addMermaidPanel(
    slide,
    "Mermaid Source",
    `sequenceDiagram\n  actor Staff\n  actor Student\n  participant App\n  participant API\n  participant DB\n  Staff->>App: Open attendance screen\n  Student->>App: Present QR or ID\n  App->>API: Record attendance\n  API->>DB: Save attendance_records\n  API->>DB: Fulfill requirement if linked\n  API->>DB: Revalidate when rules change`,
    792,
    242,
    356,
    348,
  );
  slide.speakerNotes.setText(slides[9].notes);
}

function createPresentation() {
  const presentation = Presentation.create({ slideSize: { width: W, height: H } });
  slide1(presentation);
  standardContentSlide(presentation, 2, "Why the system was built");
  standardContentSlide(presentation, 3, "Core platform composition");
  slideArchitecture(presentation);
  standardContentSlide(presentation, 5, "Implemented stack");
  standardContentSlide(presentation, 6, "Core data model");
  standardContentSlide(presentation, 7, "Security model");
  slideUseCase(presentation);
  slideSequenceSubmission(presentation);
  slideSequenceAttendance(presentation);
  return presentation;
}

async function saveBlob(blob, filePath) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  await fs.writeFile(filePath, bytes);
}

async function exportDeck(presentation) {
  await ensureDirs();
  for (let idx = 0; idx < presentation.slides.items.length; idx += 1) {
    const slide = presentation.slides.items[idx];
    const preview = await presentation.export({ slide, format: "png", scale: 1 });
    await saveBlob(preview, path.join(PREVIEW_DIR, `slide-${String(idx + 1).padStart(2, "0")}.png`));
  }
  const pptxBlob = await PresentationFile.exportPptx(presentation);
  const pptxPath = path.join(OUT_DIR, "clearance-monitoring-system-presentation.pptx");
  await pptxBlob.save(pptxPath);
  return pptxPath;
}

const presentation = createPresentation();
const pptxPath = await exportDeck(presentation);
console.log(pptxPath);
