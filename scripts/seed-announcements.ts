import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://joyrstittieqqfvvuuwb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpveXJzdGl0dGllcXFmdnZ1dXdiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDM3MTEwMCwiZXhwIjoyMDg1OTQ3MTAwfQ.gMuY1d-JwWkomYsOQmjKuN3NCx_yjB_3v_jukIOgpfk';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── helpers ────────────────────────────────────────────────────────────────

async function getProfileIdByEmail(email: string): Promise<string> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single();
  if (error || !data) throw new Error(`Profile not found for email: ${email} — ${error?.message}`);
  return data.id;
}

async function getDepartmentIdByCode(code: string): Promise<string> {
  const { data, error } = await supabase
    .from('departments')
    .select('id')
    .ilike('code', code)
    .limit(1)
    .maybeSingle();
  if (error || !data) throw new Error(`Department not found for code: ${code} — ${error?.message}`);
  return data.id;
}

async function getOfficeIdByCode(code: string): Promise<string> {
  const { data, error } = await supabase
    .from('offices')
    .select('id')
    .ilike('code', code)
    .limit(1)
    .maybeSingle();
  if (error || !data) throw new Error(`Office not found for code: ${code} — ${error?.message}`);
  return data.id;
}

async function getClubIdByCode(code: string): Promise<string> {
  const { data, error } = await supabase
    .from('clubs')
    .select('id')
    .ilike('code', code)
    .limit(1)
    .maybeSingle();
  if (error || !data) throw new Error(`Club not found for code: ${code} — ${error?.message}`);
  return data.id;
}

async function insertAnnouncements(
  label: string,
  rows: object[]
): Promise<void> {
  const { data, error } = await supabase
    .from('announcements')
    .insert(rows)
    .select('id');

  if (error) {
    console.error(`  ✗ ${label}: ${error.message}`);
  } else {
    console.log(`  ✓ ${label}: inserted ${data?.length ?? 0} announcements`);
  }
}

// ── main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('Seeding announcements…\n');

  // ── look up IDs ──────────────────────────────────────────────────────────
  console.log('Looking up UUIDs…');

  const [
    adminId,
    ccisHeadId,
    guidanceHeadId,
    libraryHeadId,
    cashierHeadId,
    acssAdvId,
    crcycAdvId,
  ] = await Promise.all([
    getProfileIdByEmail('pinocchio@g.cjc.edu.ph'),
    getProfileIdByEmail('ccis@g.cjc.edu.ph'),
    getProfileIdByEmail('guidance@g.cjc.edu.ph'),
    getProfileIdByEmail('library@g.cjc.edu.ph'),
    getProfileIdByEmail('cashier@g.cjc.edu.ph'),
    getProfileIdByEmail('acss@g.cjc.edu.ph'),
    getProfileIdByEmail('crcyc@g.cjc.edu.ph'),
  ]);

  const [ccisDeptId, guidanceOfficeId, libraryOfficeId, cashierOfficeId, acssClubId, crcycClubId] =
    await Promise.all([
      getDepartmentIdByCode('CCIS'),
      getOfficeIdByCode('GUID'),
      getOfficeIdByCode('LIB'),
      getOfficeIdByCode('CASH'),
      getClubIdByCode('ACSS'),
      getClubIdByCode('CRCYC'),
    ]);

  console.log('  All UUIDs resolved.\n');

  // ── GROUP A — System-wide (posted by Admin) ───────────────────────────────
  await insertAnnouncements('GROUP A — System-wide', [
    {
      title: 'Academic Year 2025–2026 Final Examinations Schedule',
      content:
        'The final examination schedule for Academic Year 2025–2026 has been released. All students are required to review their respective schedules and prepare accordingly. Examination rooms and seat assignments will be posted on the bulletin boards one week before the examination period.',
      posted_by_id: adminId,
      is_system_wide: true,
      priority: 'urgent',
      event_date: '2026-03-15T09:00:00+08:00',
      event_location: 'Main Campus',
      expires_at: null,
      is_active: true,
    },
    {
      title: 'CJC Foundation Week Celebration',
      content:
        'The College celebrates its Foundation Week from March 20–24, 2026. Various activities have been planned, including academic exhibits, sports competitions, cultural performances, and a grand alumni homecoming. All students, faculty, and staff are encouraged to participate and show their CJC spirit.',
      posted_by_id: adminId,
      is_system_wide: true,
      priority: 'high',
      event_date: '2026-03-20T08:00:00+08:00',
      event_location: 'CJC Grounds',
      expires_at: null,
      is_active: true,
    },
    {
      title: 'Updated Student Handbook — New Policies Effective March 2026',
      content:
        'The revised Student Handbook is now available on the official CJC website and at the Office of Student Affairs. Key updates include the revised academic integrity policy, updated dress code guidelines, and new procedures for grievance filing. All students are expected to familiarize themselves with the changes.',
      posted_by_id: adminId,
      is_system_wide: true,
      priority: 'normal',
      event_date: null,
      event_location: null,
      expires_at: null,
      is_active: true,
    },
    {
      title: 'Suspension of Classes — National Holiday',
      content:
        'Classes at all levels are suspended on February 25, 2026 in observance of the National Holiday. Administrative offices will also be closed. Regular classes resume on February 26, 2026. Students with scheduled activities on this date are advised to coordinate with their respective teachers.',
      posted_by_id: adminId,
      is_system_wide: true,
      priority: 'high',
      event_date: '2026-02-25T00:00:00+08:00',
      event_location: null,
      expires_at: '2026-02-26T00:00:00+08:00',
      is_active: true,
    },
    {
      title: 'Clearance Processing Deadline Reminder',
      content:
        'All students are reminded that the deadline for clearance processing is March 10, 2026. Incomplete clearances will not be processed after this date and may affect enrollment for the next semester. Please ensure that all office, department, and club clearances are settled before the deadline.',
      posted_by_id: adminId,
      is_system_wide: true,
      priority: 'urgent',
      event_date: null,
      event_location: null,
      expires_at: '2026-03-10T23:59:59+08:00',
      is_active: true,
    },
  ]);

  // ── GROUP B — Department-scoped (CCIS dept head) ──────────────────────────
  await insertAnnouncements('GROUP B — Department: CCIS', [
    {
      title: 'CCIS Midterm Examination Reminders and Guidelines',
      content:
        'All CCIS students are reminded of the midterm examination schedule starting March 12, 2026. Students must bring their school ID and examination permit. Mobile phones and other electronic devices are strictly prohibited inside the examination room. Latecomers beyond 30 minutes will not be allowed to take the exam.',
      posted_by_id: ccisHeadId,
      department_id: ccisDeptId,
      is_system_wide: false,
      priority: 'high',
      event_date: '2026-03-12T08:00:00+08:00',
      event_location: 'CCIS Building',
      expires_at: null,
      is_active: true,
    },
    {
      title: 'Department Faculty and Student General Assembly',
      content:
        'The CCIS Department will hold its general assembly on March 5, 2026, at 1:00 PM in AVR Room 201. Attendance is mandatory for all CCIS students. The assembly will cover important announcements regarding the upcoming semester, curriculum updates, and student council elections. Please bring your student ID.',
      posted_by_id: ccisHeadId,
      department_id: ccisDeptId,
      is_system_wide: false,
      priority: 'normal',
      event_date: '2026-03-05T13:00:00+08:00',
      event_location: 'AVR Room 201',
      expires_at: null,
      is_active: true,
    },
    {
      title: 'Thesis and Capstone Submission Deadline — AY 2025–2026',
      content:
        'All graduating CCIS students enrolled in Thesis/Capstone Project courses are reminded that the final manuscript and deliverables must be submitted to the department office no later than the last week of March 2026. Submissions must be accompanied by the approval form signed by the adviser and panel members. Late submissions will not be accepted.',
      posted_by_id: ccisHeadId,
      department_id: ccisDeptId,
      is_system_wide: false,
      priority: 'normal',
      event_date: null,
      event_location: null,
      expires_at: null,
      is_active: true,
    },
  ]);

  // ── GROUP C — Office-scoped (Guidance) ───────────────────────────────────
  await insertAnnouncements('GROUP C — Office: Guidance', [
    {
      title: 'Mandatory Exit Interview for Graduating Students',
      content:
        'All graduating students are required to attend a mandatory exit interview with the Guidance Office on March 8, 2026. The exit interview is part of the clearance process and must be completed before graduation. Please bring your clearance form and a valid school ID. Walk-ins are not accepted — kindly schedule your appointment through the Guidance Office.',
      posted_by_id: guidanceHeadId,
      office_id: guidanceOfficeId,
      is_system_wide: false,
      priority: 'urgent',
      event_date: '2026-03-08T09:00:00+08:00',
      event_location: 'Guidance Office',
      expires_at: null,
      is_active: true,
    },
    {
      title: 'Mental Health Awareness Week: Free Counseling Sessions',
      content:
        'In celebration of Mental Health Awareness Week, the Guidance Office is offering free counseling sessions from March 10–14, 2026. Sessions are open to all students, faculty, and staff. Each session lasts approximately 45 minutes. To secure a slot, please fill out the online registration form or visit the Guidance Office in person.',
      posted_by_id: guidanceHeadId,
      office_id: guidanceOfficeId,
      is_system_wide: false,
      priority: 'high',
      event_date: '2026-03-10T10:00:00+08:00',
      event_location: 'Guidance Office',
      expires_at: null,
      is_active: true,
    },
    {
      title: 'Updated Walk-In Counseling Schedule for Sem 2',
      content:
        'The Guidance Office is pleased to announce the updated walk-in counseling schedule for the Second Semester. Walk-in sessions are available Monday to Friday, 8:00 AM–12:00 PM and 1:00 PM–4:00 PM. No appointment is necessary for walk-in sessions, but priority will be given to students with urgent concerns. For non-urgent matters, scheduled appointments are recommended.',
      posted_by_id: guidanceHeadId,
      office_id: guidanceOfficeId,
      is_system_wide: false,
      priority: 'normal',
      event_date: null,
      event_location: null,
      expires_at: null,
      is_active: true,
    },
  ]);

  // ── GROUP D — Office-scoped (Library) ────────────────────────────────────
  await insertAnnouncements('GROUP D — Office: Library', [
    {
      title: 'Library Extended Hours During Finals Week',
      content:
        'To support students during the final examination period, the Main Library will extend its operating hours starting March 15, 2026. The library will be open from 7:00 AM to 9:00 PM, Monday through Saturday. Students are encouraged to make use of the study rooms, which are available on a first-come, first-served basis. Quiet study protocols must be observed at all times.',
      posted_by_id: libraryHeadId,
      office_id: libraryOfficeId,
      is_system_wide: false,
      priority: 'normal',
      event_date: '2026-03-15T07:00:00+08:00',
      event_location: 'Main Library',
      expires_at: null,
      is_active: true,
    },
    {
      title: 'New Book Acquisitions Now Available for Borrowing',
      content:
        'The library has received its latest batch of book acquisitions across all academic disciplines. New titles are now available for borrowing and can be found in the New Arrivals section near the main entrance. Students, faculty, and staff may borrow up to three (3) books at a time for a period of two (2) weeks. Please present your valid school ID when borrowing.',
      posted_by_id: libraryHeadId,
      office_id: libraryOfficeId,
      is_system_wide: false,
      priority: 'low',
      event_date: null,
      event_location: null,
      expires_at: null,
      is_active: true,
    },
  ]);

  // ── GROUP E — Office-scoped (Cashier) ────────────────────────────────────
  await insertAnnouncements('GROUP E — Office: Cashier', [
    {
      title: 'Tuition Fee Payment Deadline — Second Semester',
      content:
        'All students are reminded that the deadline for tuition fee payment for the Second Semester is February 28, 2026, at 5:00 PM. Students who fail to settle their account balance by this date will incur a late payment surcharge. The Cashier\'s Office accepts payments via cash, bank transfer (BPI/BDO), and GCash. Kindly present your Statement of Account when making payment.',
      posted_by_id: cashierHeadId,
      office_id: cashierOfficeId,
      is_system_wide: false,
      priority: 'urgent',
      event_date: '2026-02-28T17:00:00+08:00',
      event_location: null,
      expires_at: null,
      is_active: true,
    },
    {
      title: 'Scholarship Disbursement Schedule — March 2026',
      content:
        'The Cashier\'s Office announces the scholarship disbursement schedule for March 2026. Government scholars (CHED, DOST, TESDA) may claim their stipends on March 5, 2026, from 9:00 AM to 3:00 PM. Institutional scholars may claim on March 6–7, 2026. Please bring your Scholarship Certification, school ID, and valid government-issued ID. Processing will be in alphabetical order.',
      posted_by_id: cashierHeadId,
      office_id: cashierOfficeId,
      is_system_wide: false,
      priority: 'high',
      event_date: '2026-03-05T09:00:00+08:00',
      event_location: null,
      expires_at: null,
      is_active: true,
    },
  ]);

  // ── GROUP F — Club-scoped (ACSS) ─────────────────────────────────────────
  await insertAnnouncements('GROUP F — Club: ACSS', [
    {
      title: 'ACSS General Assembly — All Members Required',
      content:
        'The Association of Computing Students and Scholars (ACSS) will hold its General Assembly on March 7, 2026, at 2:00 PM in ICT Lab 3. Attendance is mandatory for all registered ACSS members. The agenda includes the presentation of the annual report, election of new officers, and planning for upcoming events. Members who cannot attend must submit an excuse letter to the ACSS adviser prior to the event.',
      posted_by_id: acssAdvId,
      club_id: acssClubId,
      is_system_wide: false,
      priority: 'urgent',
      event_date: '2026-03-07T14:00:00+08:00',
      event_location: 'ICT Lab 3',
      expires_at: null,
      is_active: true,
    },
    {
      title: 'Inter-School Coding Competition — Registration Open',
      content:
        'ACSS is proud to announce that registration for the Inter-School Coding Competition is now open! The competition will be held on March 22, 2026. Teams of 2–3 members are required. CJC students who are ACSS members are given priority registration until March 15, 2026. The competition features categories in Web Development, Algorithm Design, and Mobile App Development. Cash prizes await the top three teams in each category.',
      posted_by_id: acssAdvId,
      club_id: acssClubId,
      is_system_wide: false,
      priority: 'high',
      event_date: '2026-03-22T08:00:00+08:00',
      event_location: 'TBA',
      expires_at: '2026-03-15T23:59:59+08:00',
      is_active: true,
    },
  ]);

  // ── GROUP G — Club-scoped (CRCYC) ────────────────────────────────────────
  await insertAnnouncements('GROUP G — Club: CRCYC', [
    {
      title: 'CRCYC Leadership Training Seminar',
      content:
        'The CJC Red Cross Youth Club (CRCYC) invites all active members to the Leadership Training Seminar on March 14, 2026, at 9:00 AM at the Red Cross Hall. The seminar is designed to develop leadership, teamwork, and humanitarian values among youth volunteers. Resource speakers from the Philippine Red Cross will lead the sessions. Lunch and training materials will be provided. Please confirm your attendance by March 10.',
      posted_by_id: crcycAdvId,
      club_id: crcycClubId,
      is_system_wide: false,
      priority: 'normal',
      event_date: '2026-03-14T09:00:00+08:00',
      event_location: 'Red Cross Hall',
      expires_at: null,
      is_active: true,
    },
  ]);

  console.log('\nSeeding complete.');
}

main().catch((err) => {
  console.error('\nFatal error:', err);
  process.exit(1);
});
