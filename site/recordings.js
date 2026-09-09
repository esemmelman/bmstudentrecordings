export function formatPacific(value) {
  if (!value) return '—';
  // This database column is a Pacific wall-clock timestamp WITHOUT a zone.
  // Use UTC only as a neutral container; never shift it into the viewer's zone.
  const match = String(value).match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}:\d{2}(?:\.\d+)?)/);
  if (!match) return '—';
  const date = new Date(`${match[1]}T${match[2]}Z`);
  if (Number.isNaN(date.getTime())) return '—';
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getUTCDay()];
  const hour = date.getUTCHours();
  return `${date.getUTCMonth() + 1}/${date.getUTCDate()} ${day} ${hour % 12 || 12}:${String(date.getUTCMinutes()).padStart(2, '0')} ${hour < 12 ? 'am' : 'pm'}`;
}

export function playableUrl(value) {
  try { const url = new URL(value); return url.protocol === 'https:' ? url.href : null; } catch { return null; }
}

export async function resolveAudio(url, fetcher = fetch) {
  const parsed = new URL(url);
  if (parsed.origin !== 'https://esemmelman.github.io' || parsed.pathname !== '/bradytorah/recording.html') return url;
  const id = parsed.hash.slice(1);
  if (!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id)) throw new Error('Invalid recording link.');
  const response = await fetcher(`https://fgomaujsdblpzxhnnqrg.supabase.co/rest/v1/brady_torah_passage_recordings_v1?id=eq.${id}&select=mime_type,audio_base64`, {
    headers: { apikey: 'sb_publishable_JOUqLZDnfGu_yCa6k6FVDQ_AYwpr72i', 'x-recording-id': id }, signal: AbortSignal.timeout(30000)
  });
  if (!response.ok) throw new Error('Unable to load audio.');
  const [recording] = await response.json();
  if (!recording?.audio_base64) throw new Error('Recording is unavailable.');
  const bytes = Uint8Array.from(atob(recording.audio_base64), character => character.charCodeAt(0));
  return URL.createObjectURL(new Blob([bytes], { type: recording.mime_type || 'audio/webm' }));
}

export async function fetchRecordings(fetcher = fetch) {
  const result = [];
  for (let offset = 0; ; ) {
    const url = new URL('https://fgomaujsdblpzxhnnqrg.supabase.co/rest/v1/rpc/list_brady_recordings');
    url.searchParams.set('limit', '1000');
    url.searchParams.set('offset', String(offset));
    const response = await fetcher(url, { headers: { apikey: 'sb_publishable_JOUqLZDnfGu_yCa6k6FVDQ_AYwpr72i' }, signal: AbortSignal.timeout(20000), cache: 'no-store' });
    if (!response.ok) throw new Error(`Unable to load recordings (${response.status}). Please try again.`);
    const page = await response.json();
    if (!Array.isArray(page)) throw new Error('The recording service returned an unexpected response.');
    if (!page.length) return result;
    result.push(...page);
    offset += page.length;
  }
}
