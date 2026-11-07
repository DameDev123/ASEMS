import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcrypt';
import {
  GENERATED_PASSWORD_MAX_LENGTH,
  GENERATED_PASSWORD_MIN_LENGTH,
  PASSWORD_ALPHABET,
  generateInitialPassword,
} from './credentials.js';

const allowed = new RegExp(`^[${PASSWORD_ALPHABET}]+$`);

test('default generated password is 6 characters from the allowed alphabet', () => {
  for (let i = 0; i < 200; i += 1) {
    const password = generateInitialPassword();
    assert.equal(password.length, 6);
    assert.match(password, allowed);
  }
});

test('requested lengths 4, 5 and 6 are honoured', () => {
  for (const length of [4, 5, 6]) {
    assert.equal(generateInitialPassword(length).length, length);
  }
});

test('a password longer than 6 is never generated, even when 8 or 12 is requested', () => {
  for (const length of [7, 8, 12, 128, Infinity]) {
    const { length: got } = generateInitialPassword(length);
    assert.ok(got >= GENERATED_PASSWORD_MIN_LENGTH && got <= GENERATED_PASSWORD_MAX_LENGTH, `length ${length} gave ${got}`);
  }
  assert.equal(generateInitialPassword(12).length, 6);
});

test('lengths below 4 or invalid values fall back into the 4-6 range', () => {
  assert.equal(generateInitialPassword(1).length, 4);
  assert.equal(generateInitialPassword(0).length, 4);
  assert.equal(generateInitialPassword('12').length, 6);
  assert.equal(generateInitialPassword(null).length, 6);
});

test('generated passwords are random and verify against their bcrypt hash', async () => {
  const seen = new Set(Array.from({ length: 50 }, () => generateInitialPassword()));
  assert.ok(seen.size > 40);
  const password = generateInitialPassword();
  const hash = await bcrypt.hash(password, 4);
  assert.ok(hash.startsWith('$2'));
  assert.equal(await bcrypt.compare(password, hash), true);
  assert.equal(await bcrypt.compare('WRONG1', hash), false);
});