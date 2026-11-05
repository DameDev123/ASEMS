import test from 'node:test';
import assert from 'node:assert/strict';
import { TEMP_PASSWORD_DIGITS, generateTemporaryPassword } from './credentials.js';

test('temporary password is a six-digit string', () => {
  assert.equal(TEMP_PASSWORD_DIGITS, 6);
  for (let i = 0; i < 2000; i += 1) {
    const value = generateTemporaryPassword();
    assert.equal(typeof value, 'string');
    assert.match(value, /^\d{6}$/);
  }
});

test('range boundaries are 000000 and 999999 and leading zeros are preserved', () => {
  assert.equal(generateTemporaryPassword(() => 0), '000000');
  assert.equal(generateTemporaryPassword(() => 47), '000047');
  assert.equal(generateTemporaryPassword(() => 4721), '004721');
  assert.equal(generateTemporaryPassword(() => 999999), '999999');
});

test('generator asks the random source for the full 0..999999 range', () => {
  let requestedMax = null;
  generateTemporaryPassword((max) => { requestedMax = max; return 0; });
  assert.equal(requestedMax, 1_000_000);
});

test('about one in ten values start with zero (leading zeros are really produced)', () => {
  const n = 100_000;
  let zeros = 0;
  for (let i = 0; i < n; i += 1) if (generateTemporaryPassword()[0] === '0') zeros += 1;
  const share = zeros / n;
  assert.ok(share > 0.09 && share < 0.11, `share was ${share}`);
});

test('passwords are not constant or sequential', () => {
  const seen = new Set();
  for (let i = 0; i < 1000; i += 1) seen.add(generateTemporaryPassword());
  assert.ok(seen.size > 990);
});