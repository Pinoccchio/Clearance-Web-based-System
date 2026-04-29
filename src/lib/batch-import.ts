import * as XLSX from 'xlsx';
import { Department, Course, Club, CspsgDivision } from './supabase';

// ==========================================
// Types
// ==========================================

export interface StudentRow {
  studentId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  dateOfBirth?: string;
  department: string;
  course: string;
  yearLevel: string;
  enrolledClubs?: string;      // Club IDs for database
  enrolledClubCodes?: string;  // Club codes for display
  cspsgDivision?: string;      // Division ID for CSP students
  cspsgDivisionCode?: string;  // Division code for display
}

export interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export interface ParsedData {
  rows: StudentRow[];
  errors: ValidationError[];
  totalRows: number;
  invalidRowCount: number;
}

// ==========================================
// Constants
// ==========================================

const STUDENT_ID_REGEX = /^\d{4}-\d{4}-\d+$/;
const EMAIL_DOMAIN = '@g.cjc.edu.ph';
const VALID_YEAR_LEVELS = ['1', '2', '3', '4'];

// Column headers expected in the Excel file
export const EXPECTED_HEADERS = [
  'Student ID',
  'First Name',
  'Middle Name',
  'Last Name',
  'Email',
  'Date of Birth',
  'Department',
  'Course',
  'Year Level',
  'Enrolled Clubs',
  'CSP Division',
];

// ==========================================
// Excel Parsing
// ==========================================

/**
 * Parse an Excel file and extract student data
 */
export function parseExcelFile(file: ArrayBuffer): { headers: string[]; data: Record<string, string>[] } {
  const workbook = XLSX.read(file, { type: 'array' });

  // Get the first sheet (Students sheet)
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Convert to JSON with headers
  // Use raw: true to get raw cell values, especially for dates (as serial numbers)
  // This avoids locale-dependent date formatting issues
  const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(worksheet, {
    raw: false,
    defval: '',
    dateNF: 'yyyy-mm-dd', // Force ISO date format for date cells
  });

  // Get headers
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  const headers: string[] = [];
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cell = worksheet[XLSX.utils.encode_cell({ r: 0, c: col })];
    headers.push(cell ? String(cell.v).trim() : '');
  }

  return { headers, data: jsonData };
}

export function validateHeaders(headers: string[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const normalizedHeaders = headers.map((header) => header.trim());
  const headerCounts = new Map<string, number>();

  for (const header of normalizedHeaders) {
    headerCounts.set(header, (headerCounts.get(header) ?? 0) + 1);
  }

  for (const expected of EXPECTED_HEADERS) {
    if (!normalizedHeaders.includes(expected)) {
      errors.push({
        row: 1,
        field: expected,
        message: `Missing required column: ${expected}`,
      });
    }
  }

  for (const [header, count] of headerCounts.entries()) {
    if (!header) {
      continue;
    }

    if (!EXPECTED_HEADERS.includes(header)) {
      errors.push({
        row: 1,
        field: header,
        message: "Unexpected column in workbook",
      });
    } else if (count > 1) {
      errors.push({
        row: 1,
        field: header,
        message: "Duplicate column header",
      });
    }
  }

  return errors;
}

/**
 * Validate parsed rows against business rules
 */
export function validateRows(
  rows: Record<string, string>[],
  validDepartments: Department[],
  validCourses: Course[],
  validClubs: Club[],
  validCspsgDivisions: CspsgDivision[] = []
): ParsedData {
  const result: ParsedData = {
    rows: [],
    errors: [],
    totalRows: 0,
    invalidRowCount: 0,
  };

  const seenStudentIds = new Set<string>();
  const seenEmails = new Set<string>();
  const invalidRows = new Set<number>();

  // Create lookup maps
  const deptCodeMap = new Map(validDepartments.map(d => [d.code.toUpperCase(), d]));
  const courseCodeMap = new Map(validCourses.map(c => [c.code.toUpperCase(), c]));
  const clubCodeMap = new Map(validClubs.map(c => [c.code.toUpperCase(), c]));
  const divisionCodeMap = new Map(validCspsgDivisions.map(d => [d.code.toUpperCase(), d]));

  rows.forEach((row, index) => {
    const rowNum = index + 2; // Excel row (1-indexed, plus header)
    const errors: ValidationError[] = [];

    // Extract and normalize values
    const studentId = (row['Student ID'] || '').trim();
    const firstName = (row['First Name'] || '').trim();
    const middleName = (row['Middle Name'] || '').trim();
    const lastName = (row['Last Name'] || '').trim();
    const email = (row['Email'] || '').trim().toLowerCase();
    const dateOfBirth = (row['Date of Birth'] || '').trim();
    const department = (row['Department'] || '').trim().toUpperCase();
    const course = (row['Course'] || '').trim().toUpperCase();
    const yearLevel = (row['Year Level'] || '').toString().trim();
    const enrolledClubs = (row['Enrolled Clubs'] || '').trim();
    const cspsgDivisionCode = (row['CSP Division'] || '').trim().toUpperCase();

    // Skip completely empty rows
    if (!studentId && !firstName && !lastName && !email) {
      return;
    }

    result.totalRows += 1;

    // Validate Student ID
    if (!studentId) {
      errors.push({ row: rowNum, field: 'Student ID', message: 'Student ID is required' });
    } else if (!STUDENT_ID_REGEX.test(studentId)) {
      errors.push({ row: rowNum, field: 'Student ID', message: 'Invalid format (expected YYYY-NNNN-N)' });
    } else if (seenStudentIds.has(studentId)) {
      errors.push({ row: rowNum, field: 'Student ID', message: 'Duplicate Student ID in file' });
    } else {
      seenStudentIds.add(studentId);
    }

    // Validate First Name
    if (!firstName) {
      errors.push({ row: rowNum, field: 'First Name', message: 'First name is required' });
    }

    // Validate Last Name
    if (!lastName) {
      errors.push({ row: rowNum, field: 'Last Name', message: 'Last name is required' });
    }

    // Validate Email
    if (!email) {
      errors.push({ row: rowNum, field: 'Email', message: 'Email is required' });
    } else if (!email.endsWith(EMAIL_DOMAIN)) {
      errors.push({ row: rowNum, field: 'Email', message: `Must end with ${EMAIL_DOMAIN}` });
    } else if (seenEmails.has(email)) {
      errors.push({ row: rowNum, field: 'Email', message: 'Duplicate email in file' });
    } else {
      seenEmails.add(email);
    }

    // Validate Date of Birth (optional, but must be valid if provided)
    if (dateOfBirth) {
      const parsed = parseDate(dateOfBirth);
      if (!parsed) {
        errors.push({ row: rowNum, field: 'Date of Birth', message: 'Invalid date format (use YYYY-MM-DD or DD/MM/YYYY)' });
      }
    }

    // Validate Department
    if (!department) {
      errors.push({ row: rowNum, field: 'Department', message: 'Department is required' });
    } else if (!deptCodeMap.has(department)) {
      errors.push({ row: rowNum, field: 'Department', message: `Unknown department code: ${department}` });
    }

    // Validate Course
    if (!course) {
      errors.push({ row: rowNum, field: 'Course', message: 'Course is required' });
    } else if (!courseCodeMap.has(course)) {
      errors.push({ row: rowNum, field: 'Course', message: `Unknown course code: ${course}` });
    } else {
      // Check if course belongs to department
      const courseObj = courseCodeMap.get(course);
      const deptObj = deptCodeMap.get(department);
      if (courseObj && deptObj && courseObj.department_id !== deptObj.id) {
        errors.push({ row: rowNum, field: 'Course', message: `Course ${course} does not belong to department ${department}` });
      }
    }

    // Validate Year Level
    if (!yearLevel) {
      errors.push({ row: rowNum, field: 'Year Level', message: 'Year level is required' });
    } else if (!VALID_YEAR_LEVELS.includes(yearLevel)) {
      errors.push({ row: rowNum, field: 'Year Level', message: 'Must be 1, 2, 3, or 4' });
    }

    // Validate Enrolled Clubs (optional)
    let validClubIds: string[] = [];
    let validClubCodes: string[] = [];
    if (enrolledClubs) {
      const clubCodes = enrolledClubs.split(',').map(c => c.trim().toUpperCase()).filter(Boolean);
      for (const code of clubCodes) {
        const club = clubCodeMap.get(code);
        if (!club) {
          errors.push({ row: rowNum, field: 'Enrolled Clubs', message: `Unknown club code: ${code}` });
        } else {
          validClubIds.push(club.id);
          validClubCodes.push(club.code);
        }
      }
    }

    // Validate CSPSG Division (required only if department = CSP)
    let cspsgDivisionValue: string | undefined;
    let cspsgDivisionCodeResolved: string | undefined;
    const isCsp = department === 'CSP';
    if (isCsp) {
      if (!cspsgDivisionCode) {
        errors.push({ row: rowNum, field: 'CSP Division', message: 'Required for CSP students — use code from CSP Divisions table' });
      } else {
        const division = divisionCodeMap.get(cspsgDivisionCode);
        if (!division) {
          errors.push({ row: rowNum, field: 'CSP Division', message: `Unknown CSP Division code: ${cspsgDivisionCode}` });
        } else {
          cspsgDivisionValue = division.code;
          cspsgDivisionCodeResolved = division.code;
        }
      }
    } else if (cspsgDivisionCode) {
      errors.push({ row: rowNum, field: 'CSP Division', message: 'Only applicable for CSP students' });
    }

    // If no errors, add to valid rows
    if (errors.length === 0) {
      result.rows.push({
        studentId,
        firstName,
        middleName: middleName || undefined,
        lastName,
        email,
        dateOfBirth: dateOfBirth ? parseDate(dateOfBirth) || undefined : undefined,
        department,
        course,
        yearLevel,
        enrolledClubs: validClubIds.length > 0 ? validClubIds.join(',') : undefined,
        enrolledClubCodes: validClubCodes.length > 0 ? validClubCodes.join(', ') : undefined,
        cspsgDivision: cspsgDivisionValue,
        cspsgDivisionCode: cspsgDivisionCodeResolved,
      });
    } else {
      invalidRows.add(rowNum);
      result.errors.push(...errors);
    }
  });

  result.invalidRowCount = invalidRows.size;
  return result;
}

/**
 * Parse date string to ISO format (YYYY-MM-DD)
 */
function parseDate(dateStr: string): string | null {
  // Trim whitespace
  dateStr = dateStr.trim();

  // Handle Excel serial date (integer or decimal number like 38363 or 38363.0)
  if (/^\d+(\.\d+)?$/.test(dateStr)) {
    const serial = parseFloat(dateStr);
    const date = XLSX.SSF.parse_date_code(serial);
    if (date) {
      const year = date.y;
      const month = String(date.m).padStart(2, '0');
      const day = String(date.d).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return null;
  }

  // ISO format: YYYY-MM-DD
  const isoMatch = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // DD/MM/YYYY or MM/DD/YYYY - detect based on values
  const slashMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, first, second, y] = slashMatch;
    const firstNum = parseInt(first, 10);
    const secondNum = parseInt(second, 10);

    // If first number > 12, it must be day (DD/MM/YYYY format)
    // If second number > 12, it must be day (MM/DD/YYYY format)
    // Otherwise, assume DD/MM/YYYY (more common internationally)
    let day: string, month: string;
    if (firstNum > 12) {
      // DD/MM/YYYY
      day = first;
      month = second;
    } else if (secondNum > 12) {
      // MM/DD/YYYY
      day = second;
      month = first;
    } else {
      // Ambiguous - assume DD/MM/YYYY (international format)
      day = first;
      month = second;
    }
    return `${y}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // D/M/YYYY or M/D/YYYY (single digits without leading zeros)
  const shortSlashMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (shortSlashMatch) {
    let [, first, second, y] = shortSlashMatch;
    // Handle 2-digit year
    if (y.length === 2) {
      const yearNum = parseInt(y, 10);
      y = yearNum >= 50 ? `19${y}` : `20${y}`;
    }
    const firstNum = parseInt(first, 10);
    const secondNum = parseInt(second, 10);

    let day: string, month: string;
    if (firstNum > 12) {
      day = first;
      month = second;
    } else if (secondNum > 12) {
      day = second;
      month = first;
    } else {
      day = first;
      month = second;
    }
    return `${y}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // DD-MM-YYYY
  const dashMatch = dateStr.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (dashMatch) {
    const [, d, m, y] = dashMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  return null;
}

// ==========================================
// Excel Template Generation
// ==========================================

/**
 * Generate an Excel template file with sample data and reference sheets
 */
export function generateExcelTemplate(
  departments: Department[],
  courses: Course[],
  clubs: Club[],
  cspsgDivisions: CspsgDivision[] = []
): ArrayBuffer {
  const workbook = XLSX.utils.book_new();

  // ========== Sheet 1: Students (Sample Data) ==========
  const studentsData = [
    // Headers
    EXPECTED_HEADERS,
  // Sample rows - using DD/MM/YYYY format for dates
    // Last column = CSPSG Division (only for CSP students)
    ['2021-0001-5', 'Juan', 'Santos', 'Dela Cruz', 'juan.delacruz@g.cjc.edu.ph', '15/01/2003', 'CCIS', 'BSCS', '3', '', ''],
    ['2021-0002-3', 'Maria', 'Clara', 'Santos', 'maria.santos@g.cjc.edu.ph', '20/05/2003', 'CABE', 'BSA', '2', '', ''],
    ['2022-0015-7', 'Pedro', 'Jose', 'Reyes', 'pedro.reyes@g.cjc.edu.ph', '10/03/2004', 'CHS', 'BSN', '1', '', ''],
    ['2020-0088-2', 'Ana', '', 'Garcia', 'ana.garcia@g.cjc.edu.ph', '25/11/2002', 'CCIS', 'BSLIS', '4', '', ''],
    ['2021-0099-1', 'Jose', 'Miguel', 'Cruz', 'jose.cruz@g.cjc.edu.ph', '08/07/2003', 'CSP', 'BSED', '3', '', 'DATCH'],
  ];

  const studentsSheet = XLSX.utils.aoa_to_sheet(studentsData);

  // Set column widths
  studentsSheet['!cols'] = [
    { wch: 15 }, // Student ID
    { wch: 15 }, // First Name
    { wch: 15 }, // Middle Name
    { wch: 15 }, // Last Name
    { wch: 30 }, // Email
    { wch: 15 }, // Date of Birth
    { wch: 12 }, // Department
    { wch: 10 }, // Course
    { wch: 12 }, // Year Level
    { wch: 20 }, // Enrolled Clubs
    { wch: 18 }, // CSPSG Division
  ];

  // Set Date of Birth column (F) to text format to prevent Excel auto-conversion
  // This ensures dates stay in YYYY-MM-DD format
  const range = XLSX.utils.decode_range(studentsSheet['!ref'] || 'A1:J6');
  for (let row = 1; row <= range.e.r; row++) {
    const cellRef = XLSX.utils.encode_cell({ r: row, c: 5 }); // Column F (0-indexed = 5)
    if (studentsSheet[cellRef]) {
      studentsSheet[cellRef].t = 's'; // Set cell type to string
      studentsSheet[cellRef].z = '@'; // Set number format to text
    }
  }

  XLSX.utils.book_append_sheet(workbook, studentsSheet, 'Students');

  // ========== Sheet 2: Reference ==========
  const referenceData: (string | number)[][] = [];

  // Title
  referenceData.push(['REFERENCE DATA - DO NOT MODIFY THIS SHEET']);
  referenceData.push([]);

  // Departments section
  referenceData.push(['DEPARTMENTS']);
  referenceData.push(['Code', 'Name']);
  for (const dept of departments.filter(d => d.status === 'active')) {
    referenceData.push([dept.code, dept.name]);
  }
  referenceData.push([]);

  // Courses section (grouped by department)
  referenceData.push(['COURSES']);
  referenceData.push(['Code', 'Name', 'Department']);
  for (const course of courses.filter(c => c.status === 'active')) {
    const dept = departments.find(d => d.id === course.department_id);
    referenceData.push([course.code, course.name, dept?.code || '']);
  }
  referenceData.push([]);

  // Clubs section
  referenceData.push(['CLUBS (optional - use code in Enrolled Clubs column)']);
  referenceData.push(['Code', 'Name', 'Type']);
  for (const club of clubs.filter(c => c.status === 'active')) {
    referenceData.push([club.code, club.name, club.type]);
  }
  referenceData.push([]);

  // CSPSG Divisions section
  referenceData.push(['CSPSG DIVISIONS (required for CSP students only)']);
  referenceData.push(['Code', 'Name']);
  for (const div of cspsgDivisions.filter(d => d.status === 'active')) {
    referenceData.push([div.code, div.name]);
  }
  referenceData.push([]);

  // Year Levels
  referenceData.push(['YEAR LEVELS']);
  referenceData.push(['Value', 'Description']);
  referenceData.push(['1', '1st Year']);
  referenceData.push(['2', '2nd Year']);
  referenceData.push(['3', '3rd Year']);
  referenceData.push(['4', '4th Year']);
  referenceData.push([]);

  // Field Requirements
  referenceData.push(['FIELD REQUIREMENTS']);
  referenceData.push(['Field', 'Required', 'Format/Notes']);
  referenceData.push(['Student ID', 'Yes', 'YYYY-NNNN-N (e.g., 2021-0001-5)']);
  referenceData.push(['First Name', 'Yes', 'Text']);
  referenceData.push(['Middle Name', 'No', 'Text (leave blank if none)']);
  referenceData.push(['Last Name', 'Yes', 'Text']);
  referenceData.push(['Email', 'Yes', 'Must end with @g.cjc.edu.ph']);
    referenceData.push(['Date of Birth', 'No', 'YYYY-MM-DD or DD/MM/YYYY (e.g., 2003-01-15 or 15/01/2003)']);
  referenceData.push(['Department', 'Yes', 'Use code from Departments table']);
  referenceData.push(['Course', 'Yes', 'Use code from Courses table']);
  referenceData.push(['Year Level', 'Yes', '1, 2, 3, or 4']);
  referenceData.push(['Enrolled Clubs', 'No', 'Comma-separated club codes (e.g., ACSS,CRCYC)']);
  referenceData.push(['CSP Division', 'CSP only', 'Use code from CSP Divisions table (e.g., DATCH)']);

  const referenceSheet = XLSX.utils.aoa_to_sheet(referenceData);

  // Set column widths for reference sheet
  referenceSheet['!cols'] = [
    { wch: 20 },
    { wch: 50 },
    { wch: 15 },
  ];

  XLSX.utils.book_append_sheet(workbook, referenceSheet, 'Reference');

  // Generate buffer
  const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  return buffer;
}

/**
 * Convert ArrayBuffer to downloadable Blob
 */
export function downloadExcelTemplate(
  departments: Department[],
  courses: Course[],
  clubs: Club[],
  cspsgDivisions: CspsgDivision[] = []
): void {
  const buffer = generateExcelTemplate(departments, courses, clubs, cspsgDivisions);
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = 'student_import_template.xlsx';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
