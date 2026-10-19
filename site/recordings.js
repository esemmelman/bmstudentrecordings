export function compareRecordings(a, b) {
  const nameOrder = String(a.name ?? '').trim().localeCompare(String(b.name ?? '').trim(), 'en', { sensitivity: 'base' });
  if (nameOrder) return nameOrder;
  // Compare Pacific wall-clock values consistently, whether separated by T or a space.
  const timestamp = value => {
    const match = String(value ?? '').match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}:\d{2}(?:\.\d+)?)/);
    const time = match ? Date.parse(`${match[1]}T${match[2]}Z`) : NaN;
    return Number.isFinite(time) ? time : -Infinity;
  };
  const first = timestamp(a.start_time_pacific);
  const second = timestamp(b.start_time_pacific);
  return first === second ? 0 : second > first ? 1 : -1;
}

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

export async function resolveAudio(url, fetcher = fetch, category = 'torah') {
  const parsed = new URL(url);
  const service = category === 'service';
  const torahTables = {
    '/bradytorah/recording.html': 'brady_torah_passage_recordings_v1',
    '/aria-torah/recording.html': 'brady_torah_passage_recordings_v1',
    '/viviennetorah/recording.html': 'vivienne_torah_passage_recordings_v1'
  };
  if (!service && (parsed.origin !== 'https://esemmelman.github.io' || !Object.hasOwn(torahTables, parsed.pathname))) return url;
  const id = parsed.hash.slice(1);
  if (!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id)) throw new Error('Invalid recording link.');
  const table = service ? 'bradymenu_service_recordings_v1' : torahTables[parsed.pathname];
  const response = await fetcher(`https://fgomaujsdblpzxhnnqrg.supabase.co/rest/v1/${table}?id=eq.${id}&select=mime_type,audio_base64`, {
    headers: { apikey: 'sb_publishable_JOUqLZDnfGu_yCa6k6FVDQ_AYwpr72i', 'x-recording-id': id }, signal: AbortSignal.timeout(30000)
  });
  if (!response.ok) throw new Error('Unable to load audio.');
  const [recording] = await response.json();
  if (!recording?.audio_base64) throw new Error('Recording is unavailable.');
  const bytes = Uint8Array.from(atob(recording.audio_base64), character => character.charCodeAt(0));
  return URL.createObjectURL(new Blob([bytes], { type: recording.mime_type || 'audio/webm' }));
}

export async function fetchRecordings(fetcher = fetch, category = 'torah') {
  const result = [];
  for (let offset = 0; ; ) {
    const rpc = category === 'service' ? 'list_brady_service_recordings' : 'list_brady_recordings';
    const url = new URL(`https://fgomaujsdblpzxhnnqrg.supabase.co/rest/v1/rpc/${rpc}`);
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
