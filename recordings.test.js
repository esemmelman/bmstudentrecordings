import test from 'node:test';
import assert from 'node:assert/strict';
import { compareRecordings, formatPacific, playableUrl, fetchRecordings, resolveAudio } from './site/recordings.js';
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
test('service selection uses the service listing and audio table', async () => {
  const id = '824f23e6-480e-46ec-85b2-460f846cf8e8';
  await fetchRecordings(async url => {
    assert.match(url.pathname, /list_brady_service_recordings$/);
    return { ok: true, json: async () => [] };
  }, 'service');
  const source = await resolveAudio(`https://example.com/#${id}`, async url => {
    assert.match(url, /bradymenu_service_recordings_v1/);
    return { ok: true, json: async () => [{ mime_type: 'audio/webm', audio_base64: 'AA==' }] };
  }, 'service');
  URL.revokeObjectURL(source);
});
test('student player links resolve through the correct recording table', async () => {
  const id = '824f23e6-480e-46ec-85b2-460f846cf8e8';
  for (const path of ['bradytorah', 'aria-torah', 'viviennetorah']) {
    const link = `https://esemmelman.github.io/${path}/recording.html#${id}`;
    let requested = false;
    const source = await resolveAudio(link, async (url, options) => {
      requested = true;
      assert.ok(url.includes(path === 'viviennetorah' ? '/vivienne_torah_passage_recordings_v1?' : '/brady_torah_passage_recordings_v1?'));
      assert.equal(options.headers['x-recording-id'], id);
      return { ok: true, json: async () => [{ mime_type: 'audio/webm', audio_base64: 'AA==' }] };
    });
    assert.equal(requested, true);
    assert.match(source, /^blob:/);
    URL.revokeObjectURL(source);
  }
});

test('names ascend and each name has newest Pacific date/time first', () => {
  const rows = [
    { id: 1, name: 'Brady', start_time_pacific: '2026-10-19T12:00:00' },
    { id: 2, name: 'aria', start_time_pacific: '2026-10-19T09:00:00' },
    { id: 3, name: 'Aria ', start_time_pacific: '2026-10-19 13:00:00' },
    { id: 4, name: 'Aria', start_time_pacific: null },
    { id: 5, name: 'Brady', start_time_pacific: '2026-10-20 08:00:00' },
    { id: 6, name: 'Aria', start_time_pacific: '2025-12-31T23:59:00' }
  ];
  assert.deepEqual(rows.sort(compareRecordings).map(row => row.id), [3, 2, 6, 4, 5, 1]);
});
