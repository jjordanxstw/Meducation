#!/usr/bin/env ts-node-esm
/**
 * Mock data for the LOCAL Supabase stack.
 *
 * Wipes every content table and fills it with realistic-looking MedPi data:
 * subjects for Years 1–6 (one deliberately inactive, to check the student
 * read path hides it), sections, lectures, resources, calendar events around
 * today, news, announcements, Learning Hub cards, team members, students and
 * one local admin.
 *
 * Usage:
 *   pnpm db:local:seed
 *
 * Refuses to run against anything but a local database (see lib/db-target.ts).
 */

import { Client } from 'pg';
import bcrypt from 'bcrypt';
import { assertLocalDatabase, isLocalDatabase, LOCAL_DB_URL } from './lib/db-target';

const LOCAL_ADMIN = { username: 'admin', password: 'MedPi-local-1234!' };

// Big Buck Bunny (Blender Foundation, CC-BY) plays for each subject's first
// lecture; the rest get unique placeholder ids (they show the "Video
// unavailable" state). CVS section 2 deliberately reuses one link so the admin
// "duplicate links" check has something to find.
const MOCK_YOUTUBE_URL = 'https://www.youtube.com/watch?v=aqz-KE-bpKQ';

function mockVideoUrl(subjectCode: string, sectionIndex: number, lectureIndex: number, lectureCount: number): string {
  if (sectionIndex === 0 && lectureIndex <= 1) return MOCK_YOUTUBE_URL.replace('aqz-KE-bpKQ', lectureIndex === 0 ? 'aqz-KE-bpKQ' : 'YE7VzlLtp-4');
  const n = subjectCode === 'MDCV201' && sectionIndex === 1 && lectureIndex === 1 ? lectureCount - 1 : lectureCount;
  return `https://www.youtube.com/watch?v=mock${String(n).padStart(7, '0')}`;
}

type SubjectSeed = {
  code: string;
  name: string;
  year: number;
  description: string;
  sections: string[];
  active?: boolean;
};

const SUBJECTS: SubjectSeed[] = [
  { code: 'MDAN101', name: 'Gross Anatomy', year: 1, description: 'Regional anatomy of the trunk, limbs, head and neck with cadaveric dissection.', sections: ['Upper limb', 'Lower limb', 'Thorax'] },
  { code: 'MDBC102', name: 'Medical Biochemistry', year: 1, description: 'Metabolism, enzymes and molecular biology for clinical medicine.', sections: ['Metabolism', 'Molecular biology'] },
  { code: 'MDPS103', name: 'Physiology I', year: 1, description: 'Cell, nerve and muscle physiology.', sections: ['Cell physiology', 'Neuromuscular'] },
  { code: 'MDHI104', name: 'Histology & Embryology', year: 1, description: 'Microscopic structure of tissues and human development.', sections: ['Basic tissues', 'Embryology'] },
  { code: 'MDCV201', name: 'Cardiovascular System', year: 2, description: 'Integrated anatomy, physiology and pathology of the heart and vessels.', sections: ['Cardiac physiology', 'Haemodynamics', 'Clinical correlation', 'Pharmacology'] },
  { code: 'MDRS202', name: 'Respiratory System', year: 2, description: 'Ventilation, gas exchange and respiratory disease.', sections: ['Mechanics', 'Gas exchange', 'Disease'] },
  { code: 'MDRN203', name: 'Renal System', year: 2, description: 'Kidney function, fluid balance and acid–base.', sections: ['Filtration', 'Acid–base'] },
  { code: 'MDGI204', name: 'Gastrointestinal System', year: 2, description: 'Digestion, absorption, liver and GI pathology.', sections: ['Upper GI', 'Hepatobiliary'] },
  { code: 'MDNS205', name: 'Nervous System', year: 2, description: 'Neuroanatomy, neurophysiology and clinical neurology.', sections: ['Neuroanatomy', 'Pathways', 'Clinical neurology'] },
  { code: 'MDPA301', name: 'General Pathology', year: 3, description: 'Cell injury, inflammation, repair and neoplasia.', sections: ['Cell injury', 'Neoplasia'] },
  { code: 'MDPH302', name: 'Pharmacology', year: 3, description: 'Pharmacokinetics, pharmacodynamics and drug classes.', sections: ['Principles', 'Autonomic drugs', 'Antimicrobials'] },
  { code: 'MDMI303', name: 'Microbiology & Immunology', year: 3, description: 'Pathogens, host defence and infectious disease.', sections: ['Bacteriology', 'Immunology'] },
  { code: 'MDCS304', name: 'Clinical Skills I', year: 3, description: 'History taking, physical examination and communication.', sections: ['History taking', 'Examination'] },
  { code: 'MDIM401', name: 'Internal Medicine I', year: 4, description: 'Ward-based internal medicine: cardiology, pulmonology and nephrology.', sections: ['Cardiology', 'Pulmonology'] },
  { code: 'MDSG402', name: 'Surgery I', year: 4, description: 'Principles of surgery, trauma and perioperative care.', sections: ['Principles', 'Trauma'] },
  { code: 'MDPD403', name: 'Paediatrics', year: 4, description: 'Growth, development and common childhood illness.', sections: ['Neonatology', 'General paediatrics'] },
  { code: 'MDOG404', name: 'Obstetrics & Gynaecology', year: 4, description: 'Antenatal care, labour and gynaecological disease.', sections: ['Obstetrics', 'Gynaecology'] },
  { code: 'MDPY501', name: 'Psychiatry', year: 5, description: 'Psychiatric assessment, mood and psychotic disorders.', sections: ['Assessment', 'Disorders'] },
  { code: 'MDEM502', name: 'Emergency Medicine', year: 5, description: 'Resuscitation, triage and acute presentations.', sections: ['Resuscitation', 'Acute care'] },
  { code: 'MDOR503', name: 'Orthopaedics', year: 5, description: 'Fractures, joint disease and musculoskeletal examination.', sections: ['Fractures'] },
  { code: 'MDFM504', name: 'Family Medicine', year: 5, description: 'Primary care, prevention and community health.', sections: ['Primary care'] },
  { code: 'MDIM601', name: 'Internal Medicine Externship', year: 6, description: 'Final-year ward rotation and case conferences.', sections: ['Case conferences'] },
  { code: 'MDSG602', name: 'Surgery Externship', year: 6, description: 'Final-year surgical rotation.', sections: ['Rotation'] },
  // Inactive on purpose: must never appear in the student app (security fix S1).
  { code: 'MDZZ999', name: 'Hidden Draft Subject', year: 2, description: 'Inactive draft used to verify hidden content stays hidden.', sections: ['Draft'], active: false },
];

const LECTURE_TOPICS = [
  'Introduction and overview',
  'Core concepts',
  'Clinical correlation',
  'Applied physiology',
  'Imaging and investigations',
  'Case-based discussion',
  'Pathophysiology',
  'Management principles',
  'Review and practice questions',
];

const LECTURERS = ['Dr. Anan S.', 'Dr. Pimchanok W.', 'Assoc. Prof. Kittipong R.', 'Dr. Siriporn T.', 'Prof. Somchai P.', 'Dr. Nattaya K.'];

const FIRST_NAMES = ['Ploy', 'Nont', 'Mint', 'Bank', 'Fah', 'Tee', 'Praew', 'Ice', 'Beam', 'Kaew', 'Pun', 'Gun', 'Muk', 'Pete', 'Jane', 'Film', 'Earn', 'Tong', 'Fern', 'Boss'];
const LAST_NAMES = ['Srisuk', 'Wongsa', 'Chaiyaporn', 'Thongdee', 'Rattanakul', 'Saengchan', 'Boonmee', 'Phromma', 'Jitpakdee', 'Kaewmanee'];

function dateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function timestampOffset(days: number, hour = 9): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

async function insertReturningId(client: Client, sql: string, params: unknown[]): Promise<string> {
  const result = await client.query(sql, params);
  return result.rows[0].id;
}

async function seedSubjects(client: Client): Promise<Map<string, string>> {
  const subjectIds = new Map<string, string>();
  let lectureCount = 0;

  for (const [subjectIndex, subject] of SUBJECTS.entries()) {
    const subjectId = await insertReturningId(
      client,
      `INSERT INTO subjects (code, name, year_level, description, order_index, is_active)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [subject.code, subject.name, subject.year, subject.description, subjectIndex + 1, subject.active ?? true],
    );
    subjectIds.set(subject.code, subjectId);

    for (const [sectionIndex, sectionName] of subject.sections.entries()) {
      // The last section of the CVS subject is an inactive draft (S1 check).
      const sectionActive = !(subject.code === 'MDCV201' && sectionIndex === subject.sections.length - 1);
      const sectionId = await insertReturningId(
        client,
        `INSERT INTO sections (subject_id, name, description, order_index, is_active)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [subjectId, sectionName, `${sectionName} — ${subject.name}`, sectionIndex + 1, sectionActive],
      );

      const lecturesInSection = 4 + ((subjectIndex + sectionIndex) % 5);
      for (let lectureIndex = 0; lectureIndex < lecturesInSection; lectureIndex += 1) {
        lectureCount += 1;
        const topic = LECTURE_TOPICS[(lectureIndex + sectionIndex) % LECTURE_TOPICS.length];
        // Spread lecture dates over the last ~10 weeks; a few land in the last
        // week so "New" badges have something to show.
        const daysAgo = (lectureCount * 3) % 70;
        // One inactive lecture in the first CVS section (S1 check).
        const lectureActive = !(subject.code === 'MDCV201' && sectionIndex === 0 && lectureIndex === 1);
        const lectureId = await insertReturningId(
          client,
          `INSERT INTO lectures (section_id, title, description, lecture_date, lecturer_name, order_index, is_active, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
          [
            sectionId,
            `${sectionName}: ${topic}`,
            `Lecture ${lectureIndex + 1} of ${sectionName.toLowerCase()} in ${subject.name}.`,
            dateOffset(-daysAgo),
            LECTURERS[(subjectIndex + lectureIndex) % LECTURERS.length],
            lectureIndex + 1,
            lectureActive,
            timestampOffset(-daysAgo),
          ],
        );

        await client.query(
          `INSERT INTO resources (lecture_id, label, url, type, duration_seconds, order_index, is_active)
           VALUES ($1, 'Lecture recording', $2, 'youtube', $3, 1, true),
                  ($1, 'Slides (PDF)', $4, 'gdrive_pdf', NULL, 2, true)`,
          [
            lectureId,
            mockVideoUrl(subject.code, sectionIndex, lectureIndex, lectureCount),
            2400 + ((lectureCount * 137) % 1800),
            `https://drive.google.com/file/d/mock-slides-${lectureCount}/view`,
          ],
        );

        if (lectureIndex % 3 === 0) {
          await client.query(
            `INSERT INTO resources (lecture_id, label, url, type, order_index, is_active)
             VALUES ($1, 'Supplementary reading', 'https://www.ncbi.nlm.nih.gov/books/', 'external', 3, true),
                    ($1, 'Old draft handout', 'https://example.com/draft', 'external', 4, false)`,
            [lectureId],
          );
        }
      }
    }
  }

  console.log(`  [OK] ${SUBJECTS.length} subjects, ${lectureCount} lectures`);
  return subjectIds;
}

async function seedCalendar(client: Client, subjectIds: Map<string, string>, adminId: string): Promise<void> {
  const events: Array<[string, string, string, number, number | null, string | null, string | null, string | null, string | null]> = [
    // title, type, subject code, start offset, end offset, start time, end time, location, description
    ['CVS lab: ECG interpretation', 'lecture', 'MDCV201', 1, null, '09:00', '12:00', 'Lab 3, Building B', 'Bring your ECG workbook.'],
    ['Respiratory tutorial', 'lecture', 'MDRS202', 3, null, '13:00', '15:00', 'Room 402', null],
    ['Anatomy spot test', 'exam', 'MDAN101', 6, null, '08:30', '10:00', 'Dissection hall', 'Upper limb only.'],
    ['Chulalongkorn Day', 'holiday', '', 9, null, null, null, null, 'No classes.'],
    ['CVS midterm', 'exam', 'MDCV201', 12, null, '09:00', '12:00', 'Exam hall 1', 'Covers sections 1–3.'],
    ['Research week', 'event', '', 18, 22, null, null, 'Main auditorium', 'Student research posters and talks.'],
    ['Pharmacology quiz', 'exam', 'MDPH302', 15, null, '10:00', '11:00', 'Online', null],
    ['Clinical skills OSCE practice', 'event', 'MDCS304', 20, 21, '08:30', '16:30', 'Skills lab', null],
    ['Renal lecture series', 'lecture', 'MDRN203', -2, null, '09:00', '11:00', 'Room 301', null],
    ['Orientation for Year 1', 'event', '', -20, null, '09:00', '12:00', 'Main auditorium', null],
  ];

  for (const [title, type, code, start, end, startTime, endTime, location, description] of events) {
    await client.query(
      `INSERT INTO calendar_events (title, description, start_date, end_date, start_time, end_time, type, subject_id, location, created_by_admin, daily_schedule)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        title,
        description,
        dateOffset(start),
        dateOffset(end ?? start),
        startTime,
        endTime,
        type,
        code ? subjectIds.get(code) ?? null : null,
        location,
        adminId,
        end !== null && startTime !== null,
      ],
    );
  }
  console.log(`  [OK] ${events.length} calendar events`);
}

async function seedNews(client: Client): Promise<void> {
  const categories = await client.query<{ id: string; name: string }>('SELECT id, name FROM news_categories');
  const categoryId = (name: string) => categories.rows.find((row) => row.name === name)?.id ?? null;

  const articles: Array<[string, string, string, number, boolean, boolean]> = [
    ['CVS midterm moved to Exam hall 1', 'Academic', 'The cardiovascular midterm will now be held in Exam hall 1. Seating plans are posted on the faculty board.', -1, true, true],
    ['Research week call for posters', 'Research', 'Submit your abstract by the end of the month to present at Research week.', -3, false, true],
    ['New skills lab opening hours', 'Campus', 'The clinical skills lab is now open until 20:00 on weekdays for OSCE practice.', -5, false, true],
    ['Guest lecture: modern heart failure therapy', 'Clinical', 'A guest lecture on SGLT2 inhibitors and ARNI therapy in heart failure.', -8, false, true],
    ['Student wellbeing week', 'Events', 'Workshops on sleep, study habits and stress management all week.', -12, false, true],
    ['Unpublished draft: library changes', 'Campus', 'This draft must not appear in the student app.', -2, false, false],
  ];

  for (const [title, category, summary, offset, featured, published] of articles) {
    await client.query(
      `INSERT INTO news (title, summary, body, author_name, category_id, is_featured, is_published, published_at)
       VALUES ($1, $2, $3, 'MedPi team', $4, $5, $6, $7)`,
      [
        title,
        summary,
        `## ${title}\n\n${summary}\n\n- Check the calendar for dates\n- Contact the faculty office with questions\n\nThis article is mock data for local testing.`,
        categoryId(category),
        featured,
        published,
        timestampOffset(offset),
      ],
    );
  }
  console.log(`  [OK] ${articles.length} news articles`);
}

async function seedAnnouncements(client: Client, adminId: string): Promise<void> {
  await client.query(
    `INSERT INTO announcements (title, content, is_pinned, is_published, created_by_admin) VALUES
     ('CVS midterm in 12 days', 'Revision lectures for sections 1–3 are uploaded. Good luck!', true, true, $1),
     ('Server maintenance on Sunday', 'MedPi may be unavailable for up to 30 minutes on Sunday morning.', false, true, $1),
     ('Draft announcement', 'Unpublished; must not appear for students.', false, false, $1)`,
    [adminId],
  );
  console.log('  [OK] 3 announcements');
}

async function seedLearningHub(client: Client): Promise<void> {
  const cards = [
    {
      title: 'ECG made simple',
      description: 'A structured approach to reading 12-lead ECGs, from rate to axis to ischaemia.',
      author: 'MedPi team',
      tags: ['Cardiology', 'ECG'],
      categories: [
        { name: 'Basics', links: [{ label: 'Rate and rhythm', url: 'https://litfl.com/ecg-library/' }] },
        { name: 'Practice', links: [{ label: 'ECG quiz bank', url: 'https://litfl.com/top-150-ecg-series/' }] },
      ],
    },
    {
      title: 'Anatomy 3D atlases',
      description: 'Free interactive 3D anatomy resources for self-study.',
      author: 'Anatomy club',
      tags: ['Anatomy'],
      categories: [{ name: 'Atlases', links: [{ label: 'Open 3D atlas', url: 'https://www.anatomy.app/' }] }],
    },
    {
      title: 'Pharmacology flashcards',
      description: 'Spaced-repetition decks for drug classes and mechanisms.',
      author: 'Year 3 reps',
      tags: ['Pharmacology', 'Flashcards'],
      categories: [{ name: 'Decks', links: [{ label: 'Autonomic drugs deck', url: 'https://example.com/deck' }] }],
    },
    {
      title: 'OSCE station checklists',
      description: 'Checklists for common history and examination stations.',
      author: 'Clinical skills unit',
      tags: ['OSCE', 'Clinical skills'],
      categories: [{ name: 'Stations', links: [{ label: 'Cardiovascular exam', url: 'https://example.com/osce-cvs' }] }],
    },
  ];

  for (const [index, card] of cards.entries()) {
    await client.query(
      `INSERT INTO learning_resources (title, description, author_name, technologies, categories, is_published, order_index)
       VALUES ($1, $2, $3, $4, $5::jsonb, true, $6)`,
      [card.title, card.description, card.author, card.tags, JSON.stringify(card.categories), index + 1],
    );
  }
  console.log(`  [OK] ${cards.length} Learning Hub cards`);
}

async function seedTeam(client: Client): Promise<void> {
  await client.query(
    `INSERT INTO team_members (full_name, role, bio, order_index, is_active) VALUES
     ('Jordan', 'Founder & engineer', 'Builds and runs MedPi.', 1, true),
     ('Content lead', 'Curriculum & uploads', 'Keeps lectures organised every week.', 2, true),
     ('Design volunteer', 'Design', 'Helped shape the student experience.', 3, true),
     ('Former member', 'Alumni', 'Inactive; hidden from the About page.', 4, false)`,
  );
  console.log('  [OK] 4 team members');
}

async function seedStudents(client: Client): Promise<void> {
  let count = 0;
  for (let year = 1; year <= 6; year += 1) {
    for (let n = 0; n < 6; n += 1) {
      count += 1;
      const first = FIRST_NAMES[(count * 7) % FIRST_NAMES.length];
      const last = LAST_NAMES[(count * 3) % LAST_NAMES.length];
      const studentId = `${70 - year}${String(10000 + count).slice(1)}`;
      await client.query(
        `INSERT INTO profiles (id, email, full_name, role, year_level, student_id, created_at)
         VALUES ($1, $2, $3, 'student', $4, $5, $6)`,
        [
          `mock-google-sub-${String(count).padStart(3, '0')}`,
          `${first.toLowerCase()}.${last.toLowerCase()}.${count}@student.mahidol.edu`,
          `${first} ${last}`,
          year,
          studentId,
          timestampOffset(-count * 2),
        ],
      );
    }
  }
  console.log(`  [OK] ${count} student profiles`);
}

async function main(): Promise<void> {
  const dbUrl = process.env.SUPABASE_DB_URL || LOCAL_DB_URL;
  assertLocalDatabase(dbUrl, 'db:local:seed');

  const client = new Client({ connectionString: dbUrl, ssl: isLocalDatabase(dbUrl) ? false : { rejectUnauthorized: false } });
  await client.connect();

  try {
    console.log('> Seeding mock data...');
    await client.query('BEGIN');

    await client.query(`
      TRUNCATE subjects, calendar_events, news, announcements, learning_resources,
               team_members, profiles, admins, refresh_tokens, audit_logs
      RESTART IDENTITY CASCADE
    `);

    const passwordHash = await bcrypt.hash(LOCAL_ADMIN.password, 12);
    const adminId = await insertReturningId(
      client,
      `INSERT INTO admins (username, password_hash, full_name, email, is_active, is_super_admin)
       VALUES ($1, $2, 'Local Admin', 'admin@medpi.local', true, true) RETURNING id`,
      [LOCAL_ADMIN.username, passwordHash],
    );
    console.log(`  [OK] admin "${LOCAL_ADMIN.username}" / "${LOCAL_ADMIN.password}"`);

    const subjectIds = await seedSubjects(client);
    await seedCalendar(client, subjectIds, adminId);
    await seedNews(client);
    await seedAnnouncements(client, adminId);
    await seedLearningHub(client);
    await seedTeam(client);
    await seedStudents(client);

    await client.query('COMMIT');
    console.log('> Done.');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('Error:', error instanceof Error ? error.message : error);
  process.exit(1);
});
