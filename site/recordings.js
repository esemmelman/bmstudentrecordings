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
