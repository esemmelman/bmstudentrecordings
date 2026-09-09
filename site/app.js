import { formatPacific, playableUrl, fetchRecordings, resolveAudio } from './recordings.js';
const $ = id => document.getElementById(id);
let records = [];
let playRequest = 0;
let objectUrl;
function render() {
  const query = $('search').value.trim().toLowerCase();
  const visible = records.filter(row => String(row.name ?? '').toLowerCase().includes(query));
  $('recordings').replaceChildren();
  for (const row of visible) {
    const tr = document.createElement('tr');
    const name = document.createElement('td');
    name.textContent = row.name || 'Untitled recording';
    const time = document.createElement('td');
    time.textContent = formatPacific(row.start_time_pacific);
    const playback = document.createElement('td');
    const url = playableUrl(row.playback_url);
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.textContent = '▶ Play recording';
      link.setAttribute('aria-label', `Play ${name.textContent}`);
      link.addEventListener('click', async event => {
        event.preventDefault();
        const request = ++playRequest;
        $('audio').pause();
        $('player-panel').hidden = false;
        $('playing-name').textContent = name.textContent;
        $('playback-status').textContent = 'Loading audio…';
        $('open-recording').href = url;
        try {
          const source = await resolveAudio(url);
          if (request !== playRequest) { if (source.startsWith('blob:')) URL.revokeObjectURL(source); return; }
          if (objectUrl) URL.revokeObjectURL(objectUrl);
          objectUrl = source.startsWith('blob:') ? source : null;
          $('audio').src = source;
          $('playback-status').textContent = '';
          await $('audio').play();
        } catch { if (request === playRequest) $('playback-status').textContent = 'Playback could not start. Try the player controls or open the recording.'; }
      });
      playback.append(link);
    } else playback.textContent = 'Not available';
    tr.append(name, time, playback);
    $('recordings').append(tr);
  }
  $('status').textContent = records.length === 0 ? 'No recordings yet. New recordings will appear here when available.' : visible.length === 0 ? 'No recordings match your search.' : `${visible.length} recording${visible.length === 1 ? '' : 's'}`;
}
async function load() {
  $('refresh').disabled = true;
  $('status').textContent = 'Loading recordings…';
  try { records = await fetchRecordings(); render(); } catch (error) { $('status').textContent = `${error.message}${records.length ? ' Previously loaded recordings are still shown.' : ''}`; }
  finally { $('refresh').disabled = false; }
}
$('audio').addEventListener('error', () => { $('playback-status').textContent = 'This recording could not be played. Try opening it directly.'; });
$('search').addEventListener('input', render);
$('refresh').addEventListener('click', load);
load();
setInterval(() => { if (!document.hidden && !$('refresh').disabled) load(); }, 60000);
