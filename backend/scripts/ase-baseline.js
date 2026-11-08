// Read-only safety check for the Administrative staff (ASE) work.
//
// It records a fingerprint of every table that is NOT part of the new module and later proves
// that none of them changed. It never writes to the database (only SELECT, SHOW and CHECKSUM TABLE).
//
// Usage (from the backend folder):
//   node scripts/ase-baseline.js snapshot before     -> saves baseline/before.json
//   node scripts/ase-baseline.js compare  before     -> compares the database with that snapshot
//
// Take the snapshot BEFORE the first ASE migration, and run `compare` after every ASE phase.
// Exit code: 0 = academic data unchanged, 1 = something changed, 2 = could not run.
import 'dotenv/config';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';

const ASE_PREFIX = 'ase_';

// Tables that legitimately change while the system is used or migrated. They are still recorded,
// but a change in them is reported as "expected" and does not fail the check.
//  - audit_logs, notifications: written by normal use of the application.
//  - schema_migrations: the migration runner records every applied migration here.
const EXPECTED_TO_CHANGE_DATA = new Set(['audit_logs', 'notifications', 'schema_migrations']);

// Tables whose definition may change on purpose. users.role gets the new ASE role values (appended).
const EXPECTED_TO_CHANGE_SCHEMA = new Set(['users']);

const baselineDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'baseline');

const [mode, label = 'before'] = process.argv.slice(2);
if (!['snapshot', 'compare'].includes(mode)) {
  console.error('Usage: node scripts/ase-baseline.js <snapshot|compare> [label]');
  process.exit(2);
}
if (!/^[a-z0-9_-]+$/i.test(label)) {
  console.error('The label may only contain letters, digits, "-" and "_".');
  process.exit(2);
}
const file = path.join(baselineDir, `${label}.json`);

const connection = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME || 'ambo_performance_evaluation',
  dateStrings: true,
});

const sha = (text) => createHash('sha256').update(text).digest('hex').slice(0, 16);

// Normalise SHOW CREATE TABLE so AUTO_INCREMENT counters do not look like schema changes.
const normaliseDdl = (ddl) => ddl.replace(/AUTO_INCREMENT=\d+\s*/g, '');

async function capture() {
  const [tableRows] = await connection.query(
    `SELECT table_name AS name FROM information_schema.tables
      WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE' ORDER BY table_name`,
  );
  const tables = {};

  for (const { name } of tableRows) {
    if (name.toLowerCase().startsWith(ASE_PREFIX)) continue; // new module: not part of the baseline

    const [[count]] = await connection.query(`SELECT COUNT(*) AS n FROM \`${name}\``);
    const [[checksum]] = await connection.query(`CHECKSUM TABLE \`${name}\``);
    const [[ddl]] = await connection.query(`SHOW CREATE TABLE \`${name}\``);

    tables[name] = {
      rows: Number(count.n),
      checksum: String(checksum.Checksum),
      schema: sha(normaliseDdl(ddl['Create Table'])),
    };
  }

  // Human-readable Form E fingerprint: every stored summary with its total, stage and archive state.
  const [formE] = await connection.query(
    `SELECT id, cycle_id, instructor_id, status, total_score FROM evaluation_summaries ORDER BY id`,
  );

  const [[role]] = await connection.query(
    `SELECT column_type AS type FROM information_schema.columns
      WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'role'`,
  );

  return {
    takenAt: new Date().toISOString(),
    database: process.env.DB_NAME || 'ambo_performance_evaluation',
    usersRoleType: role?.type ?? null,
    tables,
    formE,
  };
}

function report(lines, ok = true) {
  for (const line of lines) console.log(line);
  return ok;
}

try {
  const current = await capture();

  if (mode === 'snapshot') {
    await mkdir(baselineDir, { recursive: true });
    await writeFile(file, JSON.stringify(current, null, 2), 'utf8');
    const names = Object.keys(current.tables);
    const totalRows = names.reduce((sum, name) => sum + current.tables[name].rows, 0);
    console.log(`Snapshot "${label}" saved: ${file}`);
    console.log(`  ${names.length} tables, ${totalRows} rows, ${current.formE.length} Form E summaries recorded.`);
    console.log('Keep this file. Run "compare" after every ASE phase.');
    process.exit(0);
  }

  // ---- compare ----
  let saved;
  try {
    saved = JSON.parse(await readFile(file, 'utf8'));
  } catch {
    console.error(`No snapshot found at ${file}. Run: node scripts/ase-baseline.js snapshot ${label}`);
    process.exit(2);
  }

  const problems = [];
  const notes = [];

  for (const [name, before] of Object.entries(saved.tables)) {
    const now = current.tables[name];
    if (!now) {
      problems.push(`MISSING TABLE  ${name} existed in the snapshot but is gone now`);
      continue;
    }

    const dataChanged = now.rows !== before.rows || now.checksum !== before.checksum;
    const schemaChanged = now.schema !== before.schema;

    if (schemaChanged) {
      (EXPECTED_TO_CHANGE_SCHEMA.has(name) ? notes : problems).push(
        `${EXPECTED_TO_CHANGE_SCHEMA.has(name) ? 'expected' : 'SCHEMA CHANGED'}  ${name}: table definition differs from the snapshot`,
      );
    }
    if (dataChanged) {
      (EXPECTED_TO_CHANGE_DATA.has(name) ? notes : problems).push(
        `${EXPECTED_TO_CHANGE_DATA.has(name) ? 'expected' : 'DATA CHANGED'}  ${name}: rows ${before.rows} -> ${now.rows}${
          now.checksum !== before.checksum ? ', content checksum differs' : ''
        }`,
      );
    }
  }

  for (const name of Object.keys(current.tables)) {
    if (!saved.tables[name]) notes.push(`new table  ${name} (not in the snapshot)`);
  }

  // Form E totals must be identical, row by row.
  const beforeE = JSON.stringify(saved.formE);
  const nowE = JSON.stringify(current.formE);
  if (beforeE !== nowE) problems.push('FORM E CHANGED  evaluation_summaries no longer matches the snapshot');

  // users.role may only GROW at the end: every old value must still be in the same position.
  if (saved.usersRoleType && current.usersRoleType && saved.usersRoleType !== current.usersRoleType) {
    const oldBody = saved.usersRoleType.replace(/\)$/, '');
    if (!current.usersRoleType.startsWith(oldBody)) {
      problems.push(`ROLE LIST CHANGED  users.role was ${saved.usersRoleType}, now ${current.usersRoleType} (existing values moved or removed)`);
    } else {
      notes.push(`expected  users.role grew: ${current.usersRoleType}`);
    }
  }

  console.log(`Comparing "${label}" (taken ${saved.takenAt}) with the database now:`);
  if (notes.length) {
    console.log('\nExpected differences:');
    notes.forEach((line) => console.log(`  ${line}`));
  }
  if (problems.length) {
    console.log('\nPROBLEMS - academic data or structure changed:');
    problems.forEach((line) => console.log(`  ${line}`));
    console.log(`\nFAIL: ${problems.length} problem(s).`);
    process.exit(1);
  }
  report([`\nPASS: all ${Object.keys(saved.tables).length} academic tables and every Form E total are unchanged.`]);
  process.exit(0);
} catch (error) {
  console.error('Could not run the baseline check:', error.message);
  process.exit(2);
} finally {
  await connection.end().catch(() => {});
}