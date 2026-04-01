# SOFTWARE REQUIREMENTS SPECIFICATION

## CLEARANCE WEB-BASED SYSTEM (CWBS)

---

**Version:** 1.0
**Date:** March 2026
**Institution:** Cor Jesu College, Inc.
**Document Type:** Software Requirements Specification (IEEE-Style)

---

# REVISIONS

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | March 2026 | Development Team | Initial Release - Complete SRS Documentation |

---

# TABLE OF CONTENTS

1. [INTRODUCTION](#1-introduction)
   - 1.1 [Product Overview](#11-product-overview)
2. [SPECIFIC REQUIREMENTS](#2-specific-requirements)
   - 2.1 [External Interface Requirements](#21-external-interface-requirements)
     - 2.1.1 [User Interfaces](#211-user-interfaces)
     - 2.1.2 [Hardware Interfaces](#212-hardware-interfaces)
     - 2.1.3 [Software Interfaces](#213-software-interfaces)
     - 2.1.4 [Communications Protocols](#214-communications-protocols)
   - 2.2 [Software Product Features](#22-software-product-features)
   - 2.3 [Software System Attributes](#23-software-system-attributes)
     - 2.3.1 [Reliability](#231-reliability)
     - 2.3.2 [Availability](#232-availability)
     - 2.3.3 [Security](#233-security)
     - 2.3.4 [Maintainability](#234-maintainability)
     - 2.3.5 [Portability](#235-portability)
     - 2.3.6 [Performance](#236-performance)
   - 2.4 [Database Requirements](#24-database-requirements)
     - 2.4.1 [Entity Relationship Diagram](#241-entity-relationship-diagram)
     - 2.4.2 [Data Dictionary](#242-data-dictionary)

---

# 1. INTRODUCTION

## 1.1 Product Overview

### 1.1.1 System Purpose

The **Clearance Web-Based System (CWBS)** is a comprehensive digital platform designed to streamline and automate the student clearance process at Cor Jesu College, Inc. The system replaces traditional paper-based clearance procedures with an efficient, transparent, and real-time digital workflow that connects students with academic departments, administrative offices, and student organizations.

### 1.1.2 System Scope

The CWBS manages the complete lifecycle of student clearance requests, from initial submission through final approval. The system encompasses:

- **Multi-source clearance tracking** across departments, offices, and clubs
- **Online requirement submission** with document upload capabilities
- **Real-time status monitoring** and notification systems
- **Role-based access control** for different user types
- **Academic period management** with semester-based clearance cycles
- **Event and attendance integration** for activity-based requirements
- **Comprehensive reporting and audit trails**

### 1.1.3 Target Users

| User Role | Description | Primary Functions |
|-----------|-------------|-------------------|
| **Students** | Enrolled students seeking clearance | Submit requirements, track clearance status, view announcements |
| **Department Heads** | Academic department administrators | Review student clearances, manage department requirements, approve submissions |
| **Office Heads** | Administrative office personnel | Process office-specific clearances, manage requirements |
| **Club Advisers** | Student organization faculty advisers | Manage club member clearances, track attendance |
| **System Administrators** | IT and administrative staff | Configure system settings, manage users, oversee all operations |

### 1.1.4 System Context

The CWBS operates within the educational institution's digital ecosystem, integrating with:

- **Supabase Backend Services** for database, authentication, and file storage
- **Web browsers** across desktop and mobile devices
- **Email services** for notifications and password recovery

### 1.1.5 System Benefits

1. **Efficiency** - Eliminates paper-based processes and reduces processing time
2. **Transparency** - Provides real-time visibility into clearance status
3. **Accessibility** - Available 24/7 from any internet-connected device
4. **Accountability** - Complete audit trail of all actions and approvals
5. **Scalability** - Supports multiple academic periods and organizational units
6. **Centralization** - Single platform for all clearance-related activities

---

# 2. SPECIFIC REQUIREMENTS

## 2.1 External Interface Requirements

### 2.1.1 User Interfaces

The CWBS provides role-specific user interfaces accessible through web browsers. All interfaces follow responsive design principles for cross-device compatibility.

#### 2.1.1.1 Public Interfaces

| Interface | Route | Description |
|-----------|-------|-------------|
| **Landing Page** | `/` | Public homepage with system overview, announcements, features showcase, how-it-works guide, video section, campus map, and login modal |
| **Password Reset** | `/reset-password` | Password recovery page with validation, strength indicator, and session verification |

#### 2.1.1.2 Student Interfaces

| Interface | Route | Description |
|-----------|-------|-------------|
| **Student Dashboard** | `/student` | Main dashboard with clearance progress tracking, status breakdown by source, completion rate, and real-time updates |
| **Department Clearance** | `/student/department/clearance` | View department-specific clearance requirements and submission status |
| **Department Requirements** | `/student/department/requirements` | List of department requirements with file upload areas |
| **Department Submit** | `/student/department/submit` | Form to submit department clearance with file uploads and checklist |
| **Offices Clearance** | `/student/offices/clearance` | View all offices requiring clearance with individual status |
| **Offices Requirements** | `/student/offices/requirements` | Requirements for each office with upload areas |
| **Offices Submit** | `/student/offices/submit` | Submit clearance to selected office |
| **Clubs Clearance** | `/student/clubs/clearance` | View enrolled clubs and clearance status |
| **Clubs Requirements** | `/student/clubs/requirements` | Club requirements with file upload areas |
| **Clubs Submit** | `/student/clubs/submit` | Submit club clearance |
| **Announcements** | `/student/announcements` | System, department, office, and club announcements with filtering |
| **Documents** | `/student/documents` | Uploaded documents organized by semester with verification status and preview |
| **Events** | `/student/events` | Department, office, and club events listing |
| **Profile** | `/student/profile` | Personal information management |
| **History** | `/student/history` | Previous semester clearance records and archives |
| **Requirements Overview** | `/student/requirements` | Consolidated view of all requirements |

#### 2.1.1.3 Department Head Interfaces

| Interface | Route | Description |
|-----------|-------|-------------|
| **Department Dashboard** | `/department` | Overview with student counts, completion rates, progress visualization, and recent activity |
| **Clearance Queue** | `/department/clearance` | Student submissions list with status filtering and approval actions |
| **Students** | `/department/students` | Department student list with status overview |
| **Courses** | `/department/courses` | Course management with creation, editing, and status control |
| **Requirements** | `/department/requirements` | Create and manage department requirements |
| **Announcements** | `/department/announcements` | Post and manage department announcements |
| **Events** | `/department/events` | Create and manage department events |
| **Profile** | `/department/profile` | Department information management |
| **History** | `/department/history` | Past semester clearance records |

#### 2.1.1.4 Office Head Interfaces

| Interface | Route | Description |
|-----------|-------|-------------|
| **Office Dashboard** | `/office` | Overview with pending reviews, approval counts, processing progress, and queue breakdown |
| **Clearance Queue** | `/office/clearance` | Student clearance submissions with status filtering and actions |
| **Students** | `/office/students` | Students under office clearance |
| **Requirements** | `/office/requirements` | Create and manage office requirements |
| **Announcements** | `/office/announcements` | Post and manage office announcements |
| **Events** | `/office/events` | List and manage office events |
| **Profile** | `/office/profile` | Office information management |
| **History** | `/office/history` | Past clearance records |

#### 2.1.1.5 Club Adviser Interfaces

| Interface | Route | Description |
|-----------|-------|-------------|
| **Club Dashboard** | `/club` | Overview with member counts, pending reviews, processing progress, and club type indicator |
| **Clearance Queue** | `/club/clearance` | Member clearance submissions with status filtering |
| **Members** | `/club/members` | Club member list with clearance status |
| **Requirements** | `/club/requirements` | Create and manage club requirements |
| **Announcements** | `/club/announcements` | Post and manage club announcements |
| **Events** | `/club/events` | Create and manage club events |
| **Profile** | `/club/profile` | Club information management |
| **History** | `/club/history` | Past clearance records |

#### 2.1.1.6 Administrator Interfaces

| Interface | Route | Description |
|-----------|-------|-------------|
| **Admin Dashboard** | `/admin` | System overview with user counts, entity counts, active announcements, and recent users |
| **User Management** | `/admin/users` | Complete user list with search, filtering, CRUD operations, and batch import |
| **Departments** | `/admin/departments` | Department CRUD with head assignment and status management |
| **Offices** | `/admin/offices` | Office CRUD with head assignment and status management |
| **Clubs** | `/admin/clubs` | Club CRUD with adviser assignment and type classification |
| **Announcements** | `/admin/announcements` | System-wide announcement management |
| **Events** | `/admin/events` | System-wide event management |
| **Logs** | `/admin/logs` | System activity logs with filtering and search |
| **Settings** | `/admin/settings` | Academic year, semester, and system configuration |

### 2.1.2 Hardware Interfaces

The CWBS is a web-based application that requires no specialized hardware. Standard computing devices with web browser capabilities are sufficient.

| Hardware | Requirements |
|----------|--------------|
| **Client Devices** | Desktop computers, laptops, tablets, or smartphones with modern web browsers |
| **Display** | Minimum 320px width (mobile) to full desktop resolution; responsive design adapts to all screen sizes |
| **Input Devices** | Keyboard, mouse, or touchscreen for navigation and data entry |
| **Camera/Scanner** | Optional for document scanning and QR code attendance (where applicable) |
| **Network** | Internet connectivity (broadband recommended for optimal performance) |

### 2.1.3 Software Interfaces

| Software Component | Interface Description |
|--------------------|----------------------|
| **Supabase PostgreSQL** | Primary database for all application data storage, accessed via Supabase JavaScript client library with real-time subscriptions |
| **Supabase Auth** | Authentication service for user login, session management, password reset, and role-based access control |
| **Supabase Storage** | File storage service for document uploads, profile avatars, and organization logos |
| **Supabase Realtime** | Real-time data synchronization using WebSocket connections for live updates |
| **Next.js 14** | React framework with App Router for server-side rendering, API routes, and client-side navigation |
| **React 18** | UI component library for building interactive user interfaces |
| **TypeScript** | Type-safe JavaScript for improved code reliability and developer experience |
| **Tailwind CSS** | Utility-first CSS framework for responsive styling |
| **Lucide Icons** | Icon library for consistent visual elements |

### 2.1.4 Communications Protocols

| Protocol | Usage |
|----------|-------|
| **HTTPS** | Secure HTTP for all client-server communication; TLS encryption for data in transit |
| **WebSocket (WSS)** | Secure WebSocket for Supabase Realtime subscriptions enabling live data updates |
| **REST API** | RESTful API endpoints for CRUD operations via Next.js API routes |
| **OAuth 2.0** | Authentication protocol used by Supabase Auth for secure user authentication |
| **SMTP** | Email protocol for password reset and notification emails |
| **JSON** | Data interchange format for API requests and responses |

---

## 2.2 Software Product Features

### Feature 1: Authentication & Authorization

**Description:** Secure user authentication and role-based access control system.

**Inputs:**
- User credentials (email, password)
- Password reset requests

**Processing:**
- Validate credentials against Supabase Auth
- Generate and manage session tokens
- Enforce role-based permissions
- Process password recovery emails

**Outputs:**
- Authenticated user session
- Role-specific dashboard access
- Password reset confirmation

---

### Feature 2: Student Clearance Dashboard

**Description:** Centralized dashboard for students to monitor clearance progress across all sources.

**Inputs:**
- Student authentication
- Current academic period

**Processing:**
- Aggregate clearance status from all sources
- Calculate completion percentages
- Retrieve pending actions and requirements

**Outputs:**
- Visual progress indicators
- Status breakdown by source (department, offices, clubs)
- Action items requiring attention
- Historical clearance notices

---

### Feature 3: Multi-Source Clearance Tracking

**Description:** Track clearance status across multiple organizational units (departments, offices, clubs).

**Inputs:**
- Clearance requests per source
- Clearance item statuses

**Processing:**
- Create clearance items for each published requirement
- Track status transitions (pending → submitted → approved/rejected/on_hold)
- Aggregate statuses to determine overall clearance completion

**Outputs:**
- Individual source clearance status
- Combined clearance request status
- Status change notifications

---

### Feature 4: Online Requirement Submission

**Description:** Digital submission of clearance requirements including document uploads and acknowledgments.

**Inputs:**
- Requirement details
- Uploaded documents (images, PDFs)
- Acknowledgment checkboxes

**Processing:**
- Validate file types and sizes
- Store files in Supabase Storage
- Create/update requirement submission records
- Track submission timestamps

**Outputs:**
- Submission confirmation
- File upload status
- Requirement completion tracking

---

### Feature 5: Clearance Processing Portal

**Description:** Interface for department heads, office heads, and club advisers to review and process clearance submissions.

**Inputs:**
- Student submissions
- Reviewer decisions (approve/reject/hold)
- Remarks and feedback

**Processing:**
- Display pending submissions queue
- Record reviewer decisions with timestamps
- Update clearance item statuses
- Generate audit trail entries

**Outputs:**
- Updated clearance status
- Feedback to students
- Processing statistics
- Audit log entries

---

### Feature 6: Requirements Management

**Description:** Create, edit, and manage clearance requirements for departments, offices, and clubs.

**Inputs:**
- Requirement name and description
- Requirement type (upload/attendance/acknowledgment)
- Publication status
- External resource links
- Display order

**Processing:**
- Store requirement definitions
- Manage requirement visibility (publish/unpublish)
- Auto-create clearance items when requirements are first published
- Handle requirement links

**Outputs:**
- Published requirements visible to students
- Requirement-linked clearance items
- Structured requirement catalog

---

### Feature 7: Bulk Data Import

**Description:** Import multiple users via CSV/Excel file upload.

**Inputs:**
- CSV/Excel file with user data
- Column mappings

**Processing:**
- Parse uploaded file
- Validate data format and required fields
- Create user accounts in batch
- Assign roles and associations

**Outputs:**
- Import success/failure report
- Created user accounts
- Error log for failed entries

---

### Feature 8: Academic Period Management

**Description:** Configure and manage academic years and semesters for clearance cycles.

**Inputs:**
- Academic year (e.g., "2025-2026")
- Semester (1st, 2nd, Summer)
- Start and deadline dates
- Clearance availability toggle

**Processing:**
- Store system settings
- Control clearance request availability
- Associate clearance requests with academic periods

**Outputs:**
- Current period configuration
- Period-scoped clearance requests
- Deadline enforcement

---

### Feature 9: Departmental & Office Mapping

**Description:** Manage organizational structure including departments, offices, and clubs.

**Inputs:**
- Entity details (name, code, description)
- Head/adviser assignments
- Logo uploads
- Status (active/inactive)

**Processing:**
- CRUD operations for entities
- Assign heads/advisers from user pool
- Manage entity logos in storage
- Control entity visibility

**Outputs:**
- Organized entity catalog
- Role-entity associations
- Entity-specific clearance sources

---

### Feature 10: Real-Time Analytics Dashboard

**Description:** Live statistics and progress monitoring for administrators and signatories.

**Inputs:**
- Clearance data across all requests
- User activity data

**Processing:**
- Calculate real-time statistics
- Aggregate data by status, source, and period
- Track processing progress

**Outputs:**
- Dashboard statistics (pending, approved, rejected counts)
- Completion rates and progress bars
- Recent activity feeds

---

### Feature 11: Role-Based Access Control

**Description:** Enforce permissions based on user roles throughout the system.

**Inputs:**
- User role (student, department, office, club, admin)
- Requested action/resource

**Processing:**
- Verify role permissions
- Enforce Row-Level Security policies
- Restrict UI elements based on role

**Outputs:**
- Permitted or denied access
- Role-specific navigation menus
- Filtered data views

---

### Feature 12: System Activity Logs

**Description:** Comprehensive audit trail of all clearance-related actions.

**Inputs:**
- User actions on clearance items
- System-triggered events

**Processing:**
- Record status transitions
- Log actor information and timestamps
- Store remarks and context

**Outputs:**
- Searchable activity log
- Status transition history
- Actor accountability records

---

### Feature 13: Announcements System

**Description:** Multi-scope announcement platform for system-wide and organization-specific communications.

**Inputs:**
- Announcement content (title, body)
- Scope (system-wide, department, office, club)
- Priority level (low, normal, high, urgent)
- Event date and location (optional)
- Expiration date

**Processing:**
- Store announcements with scope metadata
- Filter announcements for target audiences
- Manage announcement lifecycle

**Outputs:**
- Targeted announcement display
- Priority-sorted announcement lists
- Announcement detail views

---

### Feature 14: Events & Attendance Module

**Description:** Event management with attendance tracking for activity-based requirements.

**Inputs:**
- Event details (name, date, description)
- Event source (department, office, club)
- Linked requirement (optional)
- Attendance records (student, type, timestamp)

**Processing:**
- Create and manage events
- Record attendance (check-in/check-out)
- Auto-fulfill attendance requirements upon check-in
- Track attendance statistics

**Outputs:**
- Event listings by organization
- Attendance records
- Automatic requirement completion

---

### Feature 15: Document Management

**Description:** Centralized storage and tracking of submitted documents.

**Inputs:**
- Uploaded files
- Associated requirements
- Submission metadata

**Processing:**
- Store files in Supabase Storage
- Track document verification status
- Organize by semester and source

**Outputs:**
- Document repository view
- Verification status indicators
- File preview and download

---

### Feature 16: Real-Time Synchronization

**Description:** Live updates across the application using WebSocket subscriptions.

**Inputs:**
- Database change events
- User subscriptions

**Processing:**
- Establish real-time connections
- Broadcast relevant changes to subscribers
- Update UI without page refresh

**Outputs:**
- Instant status updates
- Live dashboard refreshes
- Real-time notification delivery

---

### Feature 17: Interactive Campus Map

**Description:** Google Maps integration displaying campus locations.

**Inputs:**
- Map configuration
- Location data

**Processing:**
- Render interactive map component
- Display campus markers

**Outputs:**
- Visual campus map
- Location information overlays

---

### Feature 18: Responsive Web Design

**Description:** Cross-device compatible interface adapting to all screen sizes.

**Inputs:**
- Device viewport dimensions
- User interactions

**Processing:**
- Apply responsive CSS rules
- Adapt layout components
- Optimize touch/click interactions

**Outputs:**
- Mobile-optimized views
- Tablet-compatible layouts
- Full desktop experience

---

## 2.3 Software System Attributes

### 2.3.1 Reliability

| Attribute | Specification |
|-----------|---------------|
| **Mean Time Between Failures (MTBF)** | System designed for 99.5% uptime reliability |
| **Error Handling** | Graceful error handling with user-friendly messages; no system crashes from user input |
| **Data Integrity** | Database constraints and foreign keys ensure referential integrity; CASCADE deletes prevent orphaned records |
| **Transaction Safety** | Database triggers ensure atomic status updates; clearance request status calculated consistently |
| **Backup & Recovery** | Supabase provides automatic database backups; point-in-time recovery available |

### 2.3.2 Availability

| Attribute | Specification |
|-----------|---------------|
| **System Uptime** | 24/7 availability excluding scheduled maintenance windows |
| **Cloud Infrastructure** | Hosted on Supabase cloud infrastructure with distributed architecture |
| **Failover Capability** | Supabase provides automatic failover and redundancy |
| **Maintenance Windows** | Scheduled during low-usage periods with advance notification |
| **Geographic Distribution** | Cloud hosting provides low-latency access from institution location |

### 2.3.3 Security

| Attribute | Specification |
|-----------|---------------|
| **Authentication** | Supabase Auth with secure password hashing (bcrypt); session token management |
| **Authorization** | Role-Based Access Control (RBAC) with five user roles; Row-Level Security (RLS) policies on all tables |
| **Data Encryption** | TLS/HTTPS for data in transit; Supabase encryption at rest |
| **Password Policy** | Minimum 8 characters; password strength validation |
| **Session Management** | Secure session tokens with expiration; automatic logout on inactivity |
| **SQL Injection Prevention** | Parameterized queries via Supabase client; no raw SQL execution from user input |
| **XSS Prevention** | React's built-in XSS protection; sanitized user inputs |
| **Audit Trail** | Immutable clearance_item_history table logs all status changes with actor identification |

### 2.3.4 Maintainability

| Attribute | Specification |
|-----------|---------------|
| **Code Organization** | Modular component architecture; separation of concerns (UI, logic, data) |
| **Type Safety** | TypeScript throughout codebase ensuring compile-time error detection |
| **Documentation** | Code comments, type definitions, and this SRS document |
| **Database Migrations** | Version-controlled schema changes via Supabase migrations |
| **Testing Capability** | Component structure supports unit and integration testing |
| **Dependency Management** | npm package management with version locking |

### 2.3.5 Portability

| Attribute | Specification |
|-----------|---------------|
| **Browser Support** | Compatible with Chrome, Firefox, Safari, Edge (latest 2 versions) |
| **Device Support** | Responsive design supports desktop, tablet, and mobile devices |
| **Operating System** | Platform-independent; runs on any OS with modern web browser |
| **Deployment** | Containerizable Next.js application; deployable to various cloud platforms |
| **Database Portability** | PostgreSQL-based; standard SQL with potential for migration |

### 2.3.6 Performance

| Attribute | Specification |
|-----------|---------------|
| **Page Load Time** | Initial load < 3 seconds on standard broadband; subsequent navigation < 1 second (client-side routing) |
| **API Response Time** | API endpoints respond within 500ms under normal load |
| **Concurrent Users** | System supports 500+ concurrent users without degradation |
| **Database Optimization** | Indexed columns for frequent queries; composite indexes for complex lookups |
| **File Upload** | Support for files up to 10MB per upload |
| **Real-Time Updates** | WebSocket latency < 100ms for status change propagation |

---

## 2.4 Database Requirements

### 2.4.1 Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        CLEARANCE WEB-BASED SYSTEM ERD                          │
└─────────────────────────────────────────────────────────────────────────────────┘

                                    ┌──────────────┐
                                    │   profiles   │
                                    │──────────────│
                                    │ PK: id       │
                                    │ email        │
                                    │ first_name   │
                                    │ last_name    │
                                    │ role         │
                                    │ student_id   │
                                    │ department   │
                                    └──────┬───────┘
                                           │
           ┌───────────────────────────────┼───────────────────────────────┐
           │                               │                               │
           ▼                               ▼                               ▼
┌──────────────────┐            ┌──────────────────┐            ┌──────────────────┐
│   departments    │            │     offices      │            │      clubs       │
│──────────────────│            │──────────────────│            │──────────────────│
│ PK: id           │            │ PK: id           │            │ PK: id           │
│ name             │            │ name             │            │ name             │
│ code             │            │ code             │            │ code             │
│ FK: head_id      │◄───────────│ FK: head_id      │◄───────────│ FK: adviser_id   │
│ status           │            │ status           │            │ type             │
└────────┬─────────┘            └────────┬─────────┘            │ status           │
         │                               │                      └────────┬─────────┘
         │                               │                               │
         └───────────────────────────────┼───────────────────────────────┘
                                         │
                                         ▼
                              ┌──────────────────────┐
                              │    requirements      │
                              │──────────────────────│
                              │ PK: id               │
                              │ source_type          │◄──────┐
                              │ source_id            │       │
                              │ name                 │       │
                              │ is_published         │       │
                              │ requires_upload      │       │
                              │ is_attendance        │       │
                              └──────────┬───────────┘       │
                                         │                   │
              ┌──────────────────────────┼───────────────────┤
              │                          │                   │
              ▼                          ▼                   │
┌─────────────────────┐     ┌─────────────────────┐          │
│  requirement_links  │     │       events        │          │
│─────────────────────│     │─────────────────────│          │
│ PK: id              │     │ PK: id              │          │
│ FK: requirement_id  │     │ FK: requirement_id  │          │
│ url                 │     │ source_type         │          │
│ label               │     │ source_id           │          │
└─────────────────────┘     │ name                │          │
                            │ event_date          │          │
                            └──────────┬──────────┘          │
                                       │                     │
                                       ▼                     │
                          ┌─────────────────────┐            │
                          │ attendance_records  │            │
                          │─────────────────────│            │
                          │ PK: id              │            │
                          │ FK: event_id        │            │
                          │ FK: student_id      │            │
                          │ attendance_type     │            │
                          │ scanned_at          │            │
                          └─────────────────────┘            │
                                                             │
┌─────────────────────┐                                      │
│ clearance_requests  │                                      │
│─────────────────────│                                      │
│ PK: id              │                                      │
│ FK: student_id      │──────────────────────────────────────┤
│ academic_year       │                                      │
│ semester            │                                      │
│ status              │                                      │
└──────────┬──────────┘                                      │
           │                                                 │
           ▼                                                 │
┌─────────────────────┐                                      │
│   clearance_items   │                                      │
│─────────────────────│                                      │
│ PK: id              │                                      │
│ FK: request_id      │                                      │
│ source_type         │──────────────────────────────────────┘
│ source_id           │
│ status              │
│ FK: reviewed_by     │
│ remarks             │
└──────────┬──────────┘
           │
           ├─────────────────────────────┐
           │                             │
           ▼                             ▼
┌─────────────────────────┐   ┌─────────────────────────┐
│ requirement_submissions │   │ clearance_item_history  │
│─────────────────────────│   │─────────────────────────│
│ PK: id                  │   │ PK: id                  │
│ FK: clearance_item_id   │   │ FK: clearance_item_id   │
│ FK: requirement_id      │   │ from_status             │
│ FK: student_id          │   │ to_status               │
│ file_urls[]             │   │ FK: actor_id            │
│ status                  │   │ remarks                 │
│ remarks                 │   │ created_at              │
└─────────────────────────┘   └─────────────────────────┘

┌──────────────────┐         ┌──────────────────┐
│     courses      │         │  announcements   │
│──────────────────│         │──────────────────│
│ PK: id           │         │ PK: id           │
│ FK: department_id│         │ title            │
│ name             │         │ content          │
│ code             │         │ FK: posted_by_id │
│ status           │         │ FK: department_id│
└──────────────────┘         │ FK: office_id    │
                             │ FK: club_id      │
┌──────────────────┐         │ is_system_wide   │
│ system_settings  │         │ priority         │
│──────────────────│         │ expires_at       │
│ PK: id           │         └──────────────────┘
│ academic_year    │
│ current_semester │
│ semester_deadline│
│ FK: updated_by   │
└──────────────────┘
```

### 2.4.2 Data Dictionary

#### Table: profiles

**Description:** Core user profile data for all system users.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY | Auth user ID from Supabase Auth |
| email | TEXT | NOT NULL | User email address |
| first_name | TEXT | NOT NULL | User's first name |
| last_name | TEXT | NOT NULL | User's last name |
| middle_name | TEXT | NULLABLE | User's middle name |
| role | ENUM | NOT NULL | User role: 'student', 'office', 'department', 'club', 'admin' |
| student_id | TEXT | NULLABLE | Student ID number (for students) |
| course | TEXT | NULLABLE | Course/program name (for students) |
| year_level | TEXT | NULLABLE | Academic year level (for students) |
| department | TEXT | NULLABLE | Department code (for students) |
| avatar_url | TEXT | NULLABLE | Profile picture URL |
| enrolled_clubs | TEXT | NULLABLE | Comma-separated list of enrolled club IDs |
| date_of_birth | DATE | NULLABLE | Student date of birth |
| created_at | TIMESTAMPTZ | DEFAULT now() | Account creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT now() | Last update timestamp |

**Indexes:** idx_profiles_role (role), idx_profiles_student_id (student_id)

---

#### Table: departments

**Description:** Academic departments that students belong to and issue clearance requirements.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique department identifier |
| name | TEXT | NOT NULL | Department full name |
| code | TEXT | UNIQUE, NOT NULL | Department code (e.g., "CCIS", "CAS") |
| description | TEXT | NULLABLE | Department description |
| head_id | UUID | FK → profiles.id, NULLABLE | Department head user ID |
| logo_url | TEXT | NULLABLE | Department logo URL |
| status | ENUM | DEFAULT 'active' | Department status: 'active', 'inactive' |
| created_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT now() | Last update timestamp (auto-updated) |

---

#### Table: offices

**Description:** Administrative offices (Registrar, Finance, Library, etc.) that issue clearance requirements.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique office identifier |
| name | TEXT | NOT NULL | Office full name |
| code | TEXT | UNIQUE, NOT NULL | Office code (e.g., "REG", "FIN", "LIB") |
| description | TEXT | NULLABLE | Office description |
| head_id | UUID | FK → profiles.id, NULLABLE | Office head user ID |
| logo_url | TEXT | NULLABLE | Office logo URL |
| status | ENUM | DEFAULT 'active' | Office status: 'active', 'inactive' |
| created_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT now() | Last update timestamp (auto-updated) |

---

#### Table: clubs

**Description:** Student organizations (academic and non-academic) that issue clearance requirements.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique club identifier |
| name | TEXT | NOT NULL | Club full name |
| code | TEXT | UNIQUE, NOT NULL | Club code (e.g., "CSG", "ACME") |
| description | TEXT | NULLABLE | Club description |
| type | ENUM | NOT NULL | Club type: 'academic', 'non-academic' |
| adviser_id | UUID | FK → profiles.id, NULLABLE | Club adviser user ID |
| department | TEXT | NULLABLE | Home department code (for academic clubs) |
| logo_url | TEXT | NULLABLE | Club logo URL |
| status | ENUM | DEFAULT 'active' | Club status: 'active', 'inactive' |
| created_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT now() | Last update timestamp (auto-updated) |

---

#### Table: courses

**Description:** Academic courses/programs offered by departments.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique course identifier |
| department_id | UUID | FK → departments.id, NOT NULL | Offering department |
| name | TEXT | NOT NULL | Course full name |
| code | TEXT | UNIQUE, NOT NULL | Course code |
| status | ENUM | DEFAULT 'active' | Course status: 'active', 'inactive' |
| created_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT now() | Last update timestamp (auto-updated) |

---

#### Table: system_settings

**Description:** System-wide configuration settings (singleton table).

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY | Settings record ID |
| academic_year | TEXT | NOT NULL | Current academic year (e.g., "2025-2026") |
| current_semester | TEXT | NOT NULL | Current semester: "1st Semester", "2nd Semester", "Summer" |
| semester_start_date | DATE | NULLABLE | Semester start date |
| semester_deadline | DATE | NULLABLE | Clearance submission deadline |
| allow_semester_clearance | BOOLEAN | DEFAULT true | Whether clearance requests are allowed |
| updated_by | UUID | FK → profiles.id, NULLABLE | User who last updated settings |
| updated_at | TIMESTAMPTZ | DEFAULT now() | Last update timestamp |
| created_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |

---

#### Table: clearance_requests

**Description:** Student clearance request records for specific academic periods.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique request identifier |
| student_id | UUID | FK → profiles.id, NOT NULL | Requesting student ID |
| type | ENUM | DEFAULT 'semester' | Request type (currently only 'semester') |
| academic_year | TEXT | NOT NULL | Academic year for this request |
| semester | TEXT | NOT NULL | Semester for this request |
| status | ENUM | DEFAULT 'pending' | Request status: 'pending', 'in_progress', 'completed' |
| created_at | TIMESTAMPTZ | DEFAULT now() | Request creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT now() | Last update timestamp (auto-updated by trigger) |

**Triggers:**
- create_clearance_items_for_request (AFTER INSERT)
- update_clearance_request_status (AFTER UPDATE on clearance_items)

---

#### Table: requirements

**Description:** Clearance requirement definitions created by departments, offices, and clubs.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique requirement identifier |
| source_type | ENUM | NOT NULL | Source type: 'department', 'office', 'club' |
| source_id | UUID | NOT NULL | ID of the source entity |
| name | TEXT | NOT NULL | Requirement name |
| description | TEXT | NULLABLE | Requirement description/instructions |
| is_required | BOOLEAN | DEFAULT true | Whether requirement is mandatory |
| requires_upload | BOOLEAN | DEFAULT false | Whether document upload is needed |
| is_published | BOOLEAN | DEFAULT false | Whether requirement is visible to students |
| is_attendance | BOOLEAN | DEFAULT false | Whether this tracks event attendance |
| first_published_at | TIMESTAMPTZ | NULLABLE | First publish timestamp (prevents re-triggering) |
| order | INTEGER | DEFAULT 0 | Display order |
| created_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT now() | Last update timestamp (auto-updated) |

**Indexes:** idx_requirements_source (source_type, source_id)

**Triggers:**
- set_first_published_at (BEFORE UPDATE)
- reset_clearance_items_on_new_published_requirement (AFTER INSERT/UPDATE)

---

#### Table: requirement_links

**Description:** External links/resources associated with requirements.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique link identifier |
| requirement_id | UUID | FK → requirements.id (CASCADE), NOT NULL | Associated requirement |
| url | TEXT | NOT NULL | External URL |
| label | TEXT | NULLABLE | Display label for the link |
| order | INTEGER | DEFAULT 0 | Display order |
| created_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |

**Indexes:** idx_requirement_links_requirement (requirement_id)

---

#### Table: clearance_items

**Description:** Individual clearance status per source for each student request.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique item identifier |
| request_id | UUID | FK → clearance_requests.id (CASCADE), NOT NULL | Parent clearance request |
| source_type | ENUM | NOT NULL | Source type: 'department', 'office', 'club' |
| source_id | UUID | NOT NULL | ID of the source entity |
| status | ENUM | DEFAULT 'pending' | Item status: 'pending', 'submitted', 'approved', 'rejected', 'on_hold' |
| reviewed_by | UUID | FK → profiles.id, NULLABLE | Reviewer user ID |
| reviewed_at | TIMESTAMPTZ | NULLABLE | Review timestamp |
| remarks | TEXT | NULLABLE | Reviewer feedback |
| created_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |

**Indexes:** UNIQUE (request_id, source_type, source_id)

**Triggers:** update_clearance_request_status (AFTER INSERT/UPDATE/DELETE)

---

#### Table: requirement_submissions

**Description:** Student submissions for individual requirements.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique submission identifier |
| clearance_item_id | UUID | FK → clearance_items.id (CASCADE), NOT NULL | Associated clearance item |
| requirement_id | UUID | FK → requirements.id, NOT NULL | Associated requirement |
| student_id | UUID | FK → profiles.id, NOT NULL | Submitting student |
| file_urls | TEXT[] | NULLABLE | Array of uploaded file URLs |
| status | ENUM | DEFAULT 'pending' | Submission status: 'pending', 'submitted', 'verified', 'rejected' |
| remarks | TEXT | NULLABLE | Reviewer remarks |
| submitted_at | TIMESTAMPTZ | NULLABLE | Submission timestamp |
| reviewed_at | TIMESTAMPTZ | NULLABLE | Review timestamp |

**Indexes:** idx_req_submissions_item_student (clearance_item_id, student_id)

**Constraints:** UNIQUE (clearance_item_id, requirement_id)

---

#### Table: clearance_item_history

**Description:** Immutable audit log of all clearance item status changes.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique history entry identifier |
| clearance_item_id | UUID | FK → clearance_items.id (CASCADE), NOT NULL | Associated clearance item |
| from_status | TEXT | NULLABLE | Previous status (null for creation) |
| to_status | TEXT | NOT NULL | New status |
| actor_id | UUID | FK → profiles.id, NULLABLE | User who made change (null for system) |
| actor_role | TEXT | NULLABLE | Role of actor at time of change |
| remarks | TEXT | NULLABLE | Reason for change |
| created_at | TIMESTAMPTZ | DEFAULT now() | Change timestamp |

---

#### Table: announcements

**Description:** System and organization announcements with scope control.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique announcement identifier |
| title | TEXT | NOT NULL | Announcement title |
| content | TEXT | NOT NULL | Announcement body content |
| posted_by_id | UUID | FK → profiles.id, NOT NULL | Posting user ID |
| department_id | UUID | FK → departments.id (CASCADE), NULLABLE | Department scope (if applicable) |
| office_id | UUID | FK → offices.id (CASCADE), NULLABLE | Office scope (if applicable) |
| club_id | UUID | FK → clubs.id (CASCADE), NULLABLE | Club scope (if applicable) |
| is_system_wide | BOOLEAN | DEFAULT false | Whether visible to all users |
| priority | ENUM | DEFAULT 'normal' | Priority: 'low', 'normal', 'high', 'urgent' |
| event_date | DATE | NULLABLE | Associated event date |
| event_location | TEXT | NULLABLE | Associated event location |
| expires_at | TIMESTAMPTZ | NULLABLE | Auto-hide after this timestamp |
| is_active | BOOLEAN | DEFAULT true | Whether announcement is active |
| created_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT now() | Last update timestamp (auto-updated) |

---

#### Table: events

**Description:** Events for attendance tracking linked to requirements.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique event identifier |
| source_type | ENUM | NOT NULL | Source type: 'department', 'office', 'club' |
| source_id | UUID | NOT NULL | ID of the organizing entity |
| name | TEXT | NOT NULL | Event name |
| description | TEXT | NULLABLE | Event description |
| event_date | DATE | NOT NULL | Event date |
| requirement_id | UUID | FK → requirements.id, NULLABLE | Linked attendance requirement |
| is_active | BOOLEAN | DEFAULT true | Whether event is accepting attendance |
| require_logout | BOOLEAN | DEFAULT false | Whether logout is required |
| created_by | UUID | FK → profiles.id, NULLABLE | Creating user ID |
| created_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT now() | Last update timestamp (auto-updated) |

**Triggers:** update_events_updated_at (BEFORE UPDATE)

---

#### Table: attendance_records

**Description:** Student attendance log for events.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique attendance record identifier |
| event_id | UUID | FK → events.id (CASCADE), NOT NULL | Associated event |
| student_id | UUID | FK → profiles.id, NOT NULL | Attending student |
| attendance_type | ENUM | NOT NULL | Type: 'log_in', 'log_out' |
| scanned_by | UUID | FK → profiles.id, NULLABLE | User who recorded attendance |
| scanned_at | TIMESTAMPTZ | DEFAULT now() | Attendance timestamp |

**Triggers:** fulfill_clearance_on_attendance (AFTER INSERT)

---

### Enumerated Types Summary

| Type Name | Values |
|-----------|--------|
| UserRole | 'student', 'office', 'department', 'club', 'admin' |
| ClearanceStatus | 'pending', 'in_progress', 'completed' |
| ClearanceItemStatus | 'pending', 'submitted', 'approved', 'rejected', 'on_hold' |
| SubmissionStatus | 'pending', 'submitted', 'verified', 'rejected' |
| ClubType | 'academic', 'non-academic' |
| AnnouncementPriority | 'low', 'normal', 'high', 'urgent' |
| AttendanceType | 'log_in', 'log_out' |
| SourceType | 'department', 'office', 'club' |
| EntityStatus | 'active', 'inactive' |

---

## Document End

**Prepared By:** Development Team
**Approved By:** [Pending Approval]
**Document Version:** 1.0
**Last Updated:** March 2026
