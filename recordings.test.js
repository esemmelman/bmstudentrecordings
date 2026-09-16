import test from 'node:test';
import assert from 'node:assert/strict';
import { formatPacific, playableUrl, fetchRecordings, resolveAudio } from './site/recordings.js';
test('Pacific wall clock survives viewer time zone, midnight and noon', () => {
  assert.equal(formatPacific('2026-09-09T13:05:00'), '9/9 Wed 1:05 pm');
  assert.equal(formatPacific('2026-01-01 00:07:00'), '1/1 Thu 12:07 am');
  assert.equal(formatPacific('2026-09-09T12:00:00'), '9/9 Wed 12:00 pm');
  assert.equal(formatPacific(null), '—');
  assert.equal(formatPacific('bad'), '—');
});
test('unsafe playback links are rejected', () => {
  assert.equal(playableUrl('javascript:alert(1)'), null);
  assert.equal(playableUrl('https://example.com/a.mp3'), 'https://example.com/a.mp3');
});
test('pagination handles server limits smaller than requested', async () => {
  const offsets = [];
  const rows = await fetchRecordings(async url => {
    const offset = Number(url.searchParams.get('offset')); offsets.push(offset);
    return { ok: true, json: async () => offset < 2 ? [{ name: String(offset) }] : [] };
  });
  assert.equal(rows.length, 2); assert.deepEqual(offsets, [0, 1, 2]);
});
test('service failures are not mistaken for an empty library', async () => {
  await assert.rejects(fetchRecordings(async () => ({ ok: false, status: 403 })), /403/);
});
test('Brady and Aria player links resolve through the recording table', async () => {
  const id = '824f23e6-480e-46ec-85b2-460f846cf8e8';
  for (const path of ['bradytorah', 'aria-torah']) {
    const link = `https://esemmelman.github.io/${path}/recording.html#${id}`;
    let requested = false;
    const source = await resolveAudio(link, async (url, options) => {
      requested = true;
      assert.match(url, /brady_torah_passage_recordings_v1/);
      assert.equal(options.headers['x-recording-id'], id);
      return { ok: true, json: async () => [{ mime_type: 'audio/webm', audio_base64: 'AA==' }] };
    });
    assert.equal(requested, true);
    assert.match(source, /^blob:/);
    URL.revokeObjectURL(source);
  }
});
