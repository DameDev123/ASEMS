// READ-ONLY login diagnostic. Changes nothing, never prints the password or the hash.
// Usage (in backend/):  node scripts/diagnoseLogin.js <username-or-email>
import readline from 'node:readline';
import bcrypt from 'bcrypt';
import { pool } from '../src/config/database.js';

const identifier = (process.argv[2] || '').trim();
if (!identifier) {
  console.error('Usage: node scripts/diagnoseLogin.js <username-or-email>');
  process.exit(1);
}

// Reads a line without echoing it. The text is only compared in memory, never logged.
function askHidden(prompt) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    let muted = false;
    const write = rl._writeToOutput.bind(rl);
    rl._writeToOutput = (text) => { if (!muted) write(text); };
    rl.question(prompt, (answer) => { rl.close(); process.stdout.write('\n'); resolve(answer); });
    muted = true;
  });
}

const yes = (value) => (value ? 'yes' : 'no');

async function main() {
  const byEmail = identifier.includes('@');
  const column = byEmail ? 'email' : 'username';
  console.log(`\nLogin lookup the service performs: users.${column} = "${identifier}"`);

  const [rows] = await pool.execute(
    `SELECT id, name, email, username, role, status, id_number, credentials_issued_at, password
       FROM users WHERE ${column} = ? LIMIT 1`,
    [byEmail ? identifier.toLowerCase() : identifier],
  );
  const user = rows[0];

  if (!user) {
    console.log('RESULT: no account found in that column -> login returns "Invalid credentials".');
    if (!byEmail) {
      const [similar] = await pool.execute(
        `SELECT id, username, role, id_number FROM users
          WHERE id_number = ? OR username LIKE ? ORDER BY id DESC LIMIT 5`,
        [identifier, `%${identifier}%`],
      );
      console.log(similar.length
        ? `Possible matches (id, username, role, id_number): ${JSON.stringify(similar)}`
        : 'No account has this value in username or id_number either.');
    }
    return;
  }

  const hash = String(user.password || '');
  const validFormat = /^\$2[aby]\$\d{2}\$/.test(hash) && hash.length === 60;
  console.log('Account found:');
  console.log(`  id=${user.id} role=${user.role} status=${user.status}`);
  console.log(`  username=${user.username ?? '(empty)'} email=${user.email} id_number=${user.id_number ?? '(empty)'}`);
  console.log(`  credentials_issued_at=${user.credentials_issued_at ?? '(empty)'}`);
  console.log(`  password hash: algorithm+cost=${hash.slice(0, 7)} length=${hash.length} valid bcrypt format=${yes(validFormat)}`);
  console.log(`  username matches exactly (same case): ${yes(user.username === identifier)}`);

  if (!validFormat) {
    console.log('RESULT: stored password is not a bcrypt hash -> every password will be rejected.');
    return;
  }

  const typed = await askHidden('Type the password you are trying (hidden, not stored): ');
  const exact = await bcrypt.compare(typed, hash);
  console.log(`\nPassword matches the stored hash exactly: ${yes(exact)}`);

  if (!exact) {
    console.log(`  typed length=${typed.length}, has leading/trailing space: ${yes(typed !== typed.trim())}, has lowercase letters: ${yes(/[a-z]/.test(typed))}`);
    const trimmedMatches = typed !== typed.trim() && (await bcrypt.compare(typed.trim(), hash));
    const upperMatches = /[a-z]/.test(typed) && (await bcrypt.compare(typed.toUpperCase(), hash));
    console.log(`  would match if whitespace were trimmed: ${yes(trimmedMatches)}`);
    console.log(`  would match if typed in UPPERCASE: ${yes(upperMatches)}`);
  }

  console.log(`Role "${user.role}" and status "${user.status}" -> ${user.status === 'active' ? 'account is allowed to sign in' : 'login would be refused (account not active)'}.`);
  console.log(exact
    ? 'RESULT: credentials are valid for this account. If the app still rejects them, the running backend is not using the current auth.service.js.'
    : 'RESULT: the typed password is not the one that was hashed for this account.');
}

try {
  await main();
} catch (error) {
  console.error(`Diagnostic failed: ${error.code || error.message}`);
  process.exitCode = 1;
} finally {
  await pool.end().catch(() => {});
}