// ============================================================
// utils.js — שירותים משותפים למערכת טכנודע
// ============================================================

const STATUS = {
  idle:     { label: 'המתנה',              css: 'idle',     icon: '⬜' },
  running:  { label: 'בפעילות',            css: 'running',  icon: '🟢' },
  setup:    { label: 'הכנה לפעילות חדשה', css: 'setup',    icon: '🟡' },
  boarding: { label: 'קליטת קהל',          css: 'boarding', icon: '🔵' },
  closed:   { label: 'סגור / תקלה',        css: 'closed',   icon: '🔴' },
  break:    { label: 'הפסקה',              css: 'break',    icon: '☕' }
};

const STATUS_COLORS = {
  idle:     '#546e7a',
  running:  '#00e676',   // ירוק
  setup:    '#ffc107',   // צהוב
  boarding: '#2196f3',   // כחול
  closed:   '#f44336',
  break:    '#ff9800'    // כתום
};

// Format seconds → MM:SS
function formatTimer(totalSeconds) {
  if (isNaN(totalSeconds) || totalSeconds < 0) totalSeconds = 0;
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// Format Unix timestamp → HH:MM
function formatTime(ts) {
  if (!ts) return '--:--';
  return new Date(ts).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
}

// "בעוד X דקות" relative
function formatTimeUntil(ts) {
  if (!ts) return '';
  const diffMs = ts - Date.now();
  if (diffMs <= 0) return 'עכשיו';
  const mins = Math.ceil(diffMs / 60000);
  if (mins === 1) return 'בעוד דקה';
  if (mins < 60) return `בעוד ${mins} דק'`;
  const h = Math.floor(mins / 60), m = mins % 60;
  return `בעוד ${h}:${String(m).padStart(2,'0')} שע'`;
}

// Detect video source type
function detectVideo(url) {
  if (!url) return null;
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
  if (ytMatch) return { type: 'youtube', id: ytMatch[1] };
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return { type: 'vimeo', id: vimeoMatch[1] };
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (driveMatch) return { type: 'gdrive', id: driveMatch[1] };
  if (/\.(mp4|webm|ogg|mov)(\?|$)/i.test(url)) return { type: 'video', url };
  return { type: 'iframe', url };
}

// Build embed URL/HTML for a video
function buildVideoEmbed(url) {
  const v = detectVideo(url);
  if (!v) return null;
  switch (v.type) {
    case 'youtube':
      return {
        tag: 'iframe',
        src: `https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1&controls=0&rel=0&modestbranding=1&playsinline=1`
      };
    case 'vimeo':
      return { tag: 'iframe', src: `https://player.vimeo.com/video/${v.id}?autoplay=1&title=0&byline=0&portrait=0` };
    case 'gdrive':
      return { tag: 'iframe', src: `https://drive.google.com/file/d/${v.id}/preview` };
    case 'video':
      return { tag: 'video', src: v.url };
    default:
      return { tag: 'iframe', src: v.url };
  }
}

// Toast notifications
function showToast(msg, type = 'info', ms = 3500) {
  const c = document.getElementById('toast-container');
  if (!c) return;
  const t = document.createElement('div');
  t.className = `toast toast--${type}`;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translateY(12px)';
    t.style.transition = 'opacity 0.3s, transform 0.3s';
    setTimeout(() => t.remove(), 300);
  }, ms);
}

// Offline detection
function initOfflineDetector() {
  const banner = document.getElementById('offline-banner');
  if (!banner) return;
  function update() {
    banner.classList.toggle('visible', !navigator.onLine);
  }
  window.addEventListener('online', update);
  window.addEventListener('offline', update);
  update();
}

// Station URL helpers
function getStationUrl(page, stationId) {
  return `${window.location.origin}/${page}.html?station=${encodeURIComponent(stationId)}`;
}

// Get URL param
function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

// Firebase helpers
function stationsRef() { return db.ref('stations'); }
function stationRef(id) { return db.ref(`stations/${id}`); }
function configRef()    { return db.ref('config'); }

// Update station status + timestamps
async function transitionStation(stationId, newStatus, station, extraData = {}) {
  const now = Date.now();
  let update = { status: newStatus, lastUpdated: now, ...extraData };

  if (newStatus === 'running') {
    const durMs = (station.activityDuration || 25) * 60 * 1000;
    const setupMs = (station.setupDuration || 7) * 60 * 1000;
    update.sessionStartTime = now;
    update.sessionEndTime   = now + durMs;
    update.nextSessionTime  = now + durMs + setupMs;
    update.extensions       = 0;
    update.totalExtensionMinutes = 0;
  } else if (newStatus === 'boarding') {
    const boardMs = (station.boardingDuration || 5) * 60 * 1000;
    update.boardingStartTime = now;
    update.boardingEndTime   = now + boardMs;
  } else if (newStatus === 'setup') {
    const setupMs = (station.setupDuration || 7) * 60 * 1000;
    update.setupStartTime = now;
    update.setupEndTime   = now + setupMs;
  } else if (newStatus === 'break') {
    update.breakStartTime = now;
    update.breakEndTime   = now + 30 * 60 * 1000;
  } else if (newStatus === 'idle' || newStatus === 'closed') {
    update.sessionStartTime = 0;
    update.sessionEndTime   = 0;
    update.nextSessionTime  = 0;
  }

  await stationRef(stationId).update(update);

  // Analytics log (Phase 2 infrastructure)
  await db.ref(`analytics/${stationId}/events`).push({
    event: `status_${newStatus}`,
    timestamp: now,
    previousStatus: station.status,
    ...extraData
  });
}

// Extend session time
async function extendSession(stationId, station, extraMinutes) {
  const extraMs = extraMinutes * 60 * 1000;
  const newEnd  = (station.sessionEndTime || Date.now()) + extraMs;
  const newNext = (station.nextSessionTime || Date.now()) + extraMs;
  await stationRef(stationId).update({
    sessionEndTime:      newEnd,
    nextSessionTime:     newNext,
    extensions:          (station.extensions || 0) + 1,
    totalExtensionMinutes: (station.totalExtensionMinutes || 0) + extraMinutes,
    lastUpdated: Date.now()
  });
  await db.ref(`analytics/${stationId}/events`).push({
    event: 'extend',
    minutes: extraMinutes,
    timestamp: Date.now()
  });
}

// Copy text to clipboard
async function copyToClipboard(text, successMsg = 'הועתק!') {
  try {
    await navigator.clipboard.writeText(text);
    showToast(successMsg, 'success');
  } catch (e) {
    showToast('שגיאה בהעתקה', 'error');
  }
}

// ── Auto-transition watcher ──
// Call once per management page: startAutoTransitionWatcher(() => stations)
// Checks every 4s; fires transitionStation when a timer expires.
// Firebase re-read before writing prevents double-writes if multiple tabs are open.
const _autoWatchLocks = new Set();

function startAutoTransitionWatcher(getStations) {
  console.log('%c[AutoTransition] v20260816 — running→setup→boarding→running', 'color:#00e676;font-weight:700');
  setInterval(async () => {
    const now  = Date.now();
    const stns = typeof getStations === 'function' ? getStations() : getStations;
    if (!stns) return;

    for (const [id, s] of Object.entries(stns)) {
      if (_autoWatchLocks.has(id)) continue;

      let next = null;
      if      (s.status === 'running'  && s.sessionEndTime  > 0 && now >= s.sessionEndTime)  next = 'setup';
      else if (s.status === 'setup'    && s.setupEndTime    > 0 && now >= s.setupEndTime)    next = 'boarding';
      else if (s.status === 'boarding' && s.boardingEndTime > 0 && now >= s.boardingEndTime) next = 'running';
      if (!next) continue;

      _autoWatchLocks.add(id);
      try {
        // Re-read from Firebase to verify status hasn't already changed (e.g. via remote.html)
        const snap  = await stationRef(id).once('value');
        const fresh = snap.val();
        if (fresh && fresh.status === s.status) {
          await transitionStation(id, next, fresh, { auto: true });
        }
      } catch (e) {
        console.warn('[AutoTransition]', id, e.message);
      } finally {
        _autoWatchLocks.delete(id);
      }
    }
  }, 4000); // every 4s — remote.html grace is 3s so it gets priority when open
}

// Default station template
function defaultStation(id, name, order) {
  return {
    id,
    name:                name || 'מתחם חדש',
    topic:               '',
    topicColor:          '#00e5ff',
    videoUrl:            '',
    activityDuration:    25,
    setupDuration:       7,
    boardingDuration:    3,
    autoTransitionDelay: 3,
    status:              'idle',
    sessionStartTime:    0,
    sessionEndTime:      0,
    nextSessionTime:     0,
    boardingStartTime:   0,
    boardingEndTime:     0,
    setupStartTime:      0,
    setupEndTime:        0,
    extensions:          0,
    totalExtensionMinutes: 0,
    managerMessage:      '',
    enabled:             true,
    order:               order || 0,
    createdAt:           Date.now(),
    lastUpdated:         Date.now()
  };
}
