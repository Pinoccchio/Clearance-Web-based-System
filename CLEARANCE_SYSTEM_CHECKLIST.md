# CLEARANCE WEB-BASED SYSTEM CHECKLIST

---

**NAME OF ACTIVITY:** CWBS: Clearance Web-Based System

**IMPLEMENTATION DATE:** February 2026 – April 2026

**VENUE:** College of Computing and Information Sciences
Cor Jesu College, Inc., Digos City

**PARTICIPANTS:**
[Student Name 1]
[Student Name 2]
Department Heads, Office Heads, Club Advisers, and Administrators

---

## CLEARANCE WEB-BASED SYSTEM

### Purpose:

This checklist outlines the initial features of the Clearance Web-Based System (CWBS) to be reviewed and approved by the designated office prior to full system development and deployment.

---

| Features | Details | Approve |
|----------|---------|---------|
| **Multi-Role Authentication** | Secure login system supporting five user roles: Admin, Student, Department Head, Office Head, and Club Adviser with role-based access control (RBAC). | |
| **Student Clearance Dashboard** | A personalized dashboard displaying clearance progress, stats cards (approved, pending, action required), and real-time status updates for all clearance sources. | |
| **Multi-Source Clearance Tracking** | Students can track clearance from multiple sources: Department (1), Offices (9), and enrolled Clubs—all in a single unified interface. | |
| **Online Requirement Submission** | Students can view requirements, acknowledge them, and upload supporting documents directly through the web portal with multiple file upload support. | |
| **Clearance Processing Portal** | Office/Department Heads can review, approve, reject, or place clearance requests on hold with remarks/comments for each student. | |
| **Requirements Management** | Administrators and heads can create, publish, edit, and manage clearance requirements with file upload options and priority ranking. | |
| **Bulk Data Import** | Tools to import/sync student master lists and user accounts via CSV or Excel for efficient batch operations with validation and error reporting. | |
| **Academic Period Management** | Settings to configure Academic Year and Semester for accurate data partitioning and historical record keeping. | |
| **Departmental & Office Mapping** | Ability to categorize students by Department, Course, Year Level, and enrolled Clubs for granular institutional reporting. | |
| **Real-Time Analytics Dashboard** | Admin dashboard with system overview statistics: total users by role, active entities, and recent activity with visual indicators. | |
| **Role-Based Access Control (RBAC)** | Tiered login permissions: Super Admin for full system access, Department/Office Heads for entity-specific management, Students for personal clearance only. | |
| **System Activity Logs** | A comprehensive audit trail recording all administrative actions (who changed what and when) to ensure accountability and compliance. | |
| **Announcements System** | Multi-scope announcement creation (system-wide, department, office, club) with priority levels (low, normal, high, urgent) and expiration dates. | |
| **Events & Attendance Module** | Create and manage events with attendance tracking capability for departments, offices, and clubs. | |
| **Document Management** | Secure file storage using Supabase Storage for requirement submissions with upload, download, and removal capabilities. | |
| **Real-Time Synchronization** | WebSocket-based real-time updates for clearance status changes and data synchronization across multiple browser tabs. | |
| **Interactive Campus Map** | Leaflet.js integrated campus map to help students locate offices and departments within the campus. | |
| **Responsive Web Design** | Mobile-first responsive design ensuring accessibility across desktop, tablet, and mobile devices. | |

---

**Prepared by:**

**[STUDENT NAME 1]**
Student, CS Software Engineering 1

**[STUDENT NAME 2]**
Student, CS Software Engineering 1

---

**Noted by:** &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp; **Noted by:**

**CIEMAVIL S. ALCAIN, MIT** &emsp;&emsp;&emsp;&emsp;&emsp;&emsp; **[CLIENT NAME/TITLE]**
Instructor, CS Software Engineering 1 &emsp;&emsp;&emsp; [Position/Office]

---

# System Navigation/Manual

---

## Clearance Web-Based System: Operational Manual

### 1. The Student Experience (Front-End)

- **Landing Page:** The public-facing homepage displays featured announcements, a "How It Works" guide, an interactive campus map, and call-to-action buttons for login and registration.

- **Student Dashboard:** Upon login, students see a personalized dashboard with:
  - Welcome message with their name
  - Clearance progress overview (percentage complete)
  - Stats cards: Approved, Pending, Action Required, Total Sources
  - Quick navigation to each clearance source

- **Clearance Sources:** Students navigate through three clearance categories:
  - **Department:** Their enrolled department's requirements
  - **Offices:** 9 offices (Guidance, Clinic, Library, Prefect of Discipline, Cashier, Registrar, SSC, CJC Store, Computer Laboratory)
  - **Clubs:** Only clubs they are enrolled in (Academic & Non-Academic)

- **Requirement Submission:** For each source, students can:
  - View published requirements
  - Acknowledge requirements
  - Upload required documents (multiple files supported)
  - Track submission status (Pending → Submitted → Approved/Rejected/On Hold)

- **Announcements & Events:** Students can view relevant announcements and upcoming events from their department, offices, and clubs.

### 2. Office/Department Head Portal (Back-End)

- **Secure Access:** Role-specific login redirects users to their dedicated dashboard based on their assigned entity.

- **The Dashboard:**
  - Queue statistics (pending review, approved today, on-hold, total processed)
  - Queue overview by status
  - Recent activity list with student details
  - Current academic period display

- **Clearance Processing:**
  - View all student clearance requests for their entity
  - Process requests with status options: Approve, Reject, On Hold
  - Add remarks/comments for each decision
  - View student information and submitted documents
  - Download student files for verification

- **Requirements Management:**
  - Create requirements with name, description, and file upload options
  - Publish/unpublish requirements
  - Set priority ranking
  - Manage requirement dependencies

- **Announcements & Events:**
  - Create entity-specific announcements
  - Manage events with attendance tracking

### 3. Admin Control Panel (Super Admin)

- **System Dashboard:**
  - Overview statistics: Total users by role, active entities
  - Recently added users
  - System health indicators

- **User Management:**
  - Full CRUD operations for all user types
  - Batch import users via CSV/Excel
  - Search and filter users

- **Entity Management:**
  - Manage Departments (create, edit, assign heads, manage courses)
  - Manage Offices (9 offices with head assignments)
  - Manage Clubs (academic/non-academic with adviser assignments)

- **System Settings:**
  - Configure current academic year and semester
  - Manage system-wide settings

- **Activity Logs:**
  - View comprehensive audit trail
  - Filter by date, user, action type

---

## System Feature Checklist

| Feature | Details | Status |
|---------|---------|--------|
| **Landing Page** | Public homepage with announcements, campus map, and auth buttons | [ ] |
| **User Registration** | Multi-role registration with email verification | [ ] |
| **Secure Authentication** | Email/password login with role-based redirection | [ ] |
| **Password Reset** | Email-based password recovery functionality | [ ] |
| **Student Dashboard** | Personalized clearance progress and stats overview | [ ] |
| **Clearance Progress Tracking** | Visual progress bar and percentage completion | [ ] |
| **Multi-Source Navigation** | Department, Offices (9), and Clubs clearance sections | [ ] |
| **Requirement Viewing** | Students view published requirements per source | [ ] |
| **Document Upload** | Multiple file upload with removal capability | [ ] |
| **Status Indicators** | Color-coded badges (Pending, Submitted, Approved, Rejected, On Hold) | [ ] |
| **Office/Department Dashboard** | Queue stats and recent activity for heads | [ ] |
| **Clearance Request Queue** | List of student requests with filtering | [ ] |
| **Request Processing** | Approve/Reject/On Hold with remarks | [ ] |
| **Student Document Download** | View and download submitted files | [ ] |
| **Requirements CRUD** | Create, edit, publish, delete requirements | [ ] |
| **Announcement Creation** | Multi-scope announcements with priority | [ ] |
| **Event Management** | Create events with attendance tracking | [ ] |
| **Admin Dashboard** | System-wide statistics and overview | [ ] |
| **User Management** | Full CRUD for all user roles | [ ] |
| **Batch User Import** | CSV/Excel import with validation | [ ] |
| **Department Management** | CRUD for departments with head assignment | [ ] |
| **Office Management** | CRUD for 9 offices with head assignment | [ ] |
| **Club Management** | CRUD for clubs with adviser assignment | [ ] |
| **Course Management** | Create and assign courses to departments | [ ] |
| **Academic Period Settings** | Configure year and semester | [ ] |
| **Activity Logs** | Comprehensive audit trail with filtering | [ ] |
| **Real-Time Updates** | WebSocket-based live data synchronization | [ ] |
| **Campus Map** | Interactive Leaflet.js map integration | [ ] |
| **Responsive Design** | Mobile, tablet, and desktop compatibility | [ ] |
| **Dark Mode** | Theme switching support | [ ] |
| **RLS Security** | Row-Level Security policies for data protection | [ ] |

---

## Clearance Sources (9 Offices + Departments + Clubs)

| Office/Entity | Code | Clearance Scope |
|---------------|------|-----------------|
| Guidance Office | GUIDANCE | Student counseling clearance |
| Clinic | CLINIC | Health/medical clearance |
| Library | LIBRARY | Book returns and library clearance |
| Prefect of Discipline | PREFECT | Disciplinary clearance |
| Cashier | CASHIER | Financial/payment clearance |
| Registrar | REGISTRAR | Academic records clearance |
| Supreme Student Council | SSC | Student government clearance |
| CJC Store | STORE | Store/uniform clearance |
| Computer Laboratory | COMLAB | Laboratory equipment clearance |
| Department (CCIS, etc.) | DEPT | Department-specific clearance |
| Clubs (Academic/Non-Academic) | CLUB | Club membership clearance |

---

## User Roles & Permissions

| Role | Permissions |
|------|-------------|
| **Super Admin** | Full system access: manage all users, entities, settings, view all logs |
| **Department Head** | Manage department requirements, process department clearances, view department students |
| **Office Head** | Manage office requirements, process office clearances, view all students |
| **Club Adviser** | Manage club requirements, process club clearances, view club members |
| **Student** | View/submit own clearance, upload documents, view announcements/events |

---

## Technology Stack

| Component | Technology |
|-----------|------------|
| Frontend Framework | Next.js 16, React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Backend/Database | Supabase (PostgreSQL) |
| Authentication | Supabase Auth |
| File Storage | Supabase Storage |
| Real-Time | Supabase Realtime |
| State Management | React Query, Zustand |
| Maps | Leaflet.js, React-Leaflet |
| Forms | React Hook Form |
| Deployment | Vercel |

---
