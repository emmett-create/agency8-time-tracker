// Agency 8 — Time Tracker popup.js

const DEFAULT_CLIENTS = [
  'BORNTOSTANDOUT','Brodo','Camp','dpHue','EvolveTogether','Facile',
  'Feals','Fellow','Golden Age Fat','Ilia','Lenox and Sixteenth','MadeGood',
  'Magna','Masa','Merit','Momofuku','MPH','Nette','Roz','Skinfix','Snif',
  'Squigs','SYS','Timebeam','TodayTix','Tushy','Vandy',
];

const DEFAULT_TASKS = [
  'Meetings','Sourcing','Strategy','Outreach','Reporting','Email','Admin',
];

let timerInterval = null;
let settings = {};

async function init() {
  document.getElementById('btn-settings').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
  document.getElementById('btn-open-settings')?.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  settings = await loadSettings();

  if (!settings.name || !settings.supabaseUrl || !settings.supabaseKey) {
    show('setup');
    return;
  }

  show('main');
  populateSelects();
  await restoreTimerState();
  await loadTodayEntries();

  // Set dashboard link
  if (settings.dashboardUrl) {
    document.getElementById('dashboard-link').href = settings.dashboardUrl;
  }

  document.getElementById('btn-timer').addEventListener('click', handleTimer);
}

async function loadSettings() {
  const s = await chrome.storage.local.get([
    'name','supabaseUrl','supabaseKey','dashboardUrl','clients','tasks',
  ]);
  return {
    name:         s.name || '',
    supabaseUrl:  s.supabaseUrl || '',
    supabaseKey:  s.supabaseKey || '',
    dashboardUrl: s.dashboardUrl || '',
    clients:      s.clients || DEFAULT_CLIENTS,
    tasks:        s.tasks || DEFAULT_TASKS,
  };
}

function populateSelects() {
  const clientSel = document.getElementById('sel-client');
  const taskSel   = document.getElementById('sel-task');

  // Restore last used client/task
  chrome.storage.local.get(['lastClient','lastTask'], s => {
    settings.clients.forEach(c => {
      const opt = document.createElement('option');
      opt.value = opt.textContent = c;
      if (c === s.lastClient) opt.selected = true;
      clientSel.appendChild(opt);
    });
    settings.tasks.forEach(t => {
      const opt = document.createElement('option');
      opt.value = opt.textContent = t;
      if (t === s.lastTask) opt.selected = true;
      taskSel.appendChild(opt);
    });
  });

  clientSel.addEventListener('change', () =>
    chrome.storage.local.set({ lastClient: clientSel.value })
  );
  taskSel.addEventListener('change', () =>
    chrome.storage.local.set({ lastTask: taskSel.value })
  );
}

async function restoreTimerState() {
  const s = await chrome.storage.local.get(['timerRunning','timerStart','timerClient','timerTask','timerNotes']);
  if (s.timerRunning && s.timerStart) {
    // Timer was running — restore UI
    document.getElementById('sel-client').value = s.timerClient || '';
    document.getElementById('sel-task').value   = s.timerTask || '';
    document.getElementById('txt-notes').value  = s.timerNotes || '';
    document.getElementById('sel-client').disabled = true;
    document.getElementById('sel-task').disabled   = true;
    document.getElementById('txt-notes').disabled  = true;

    const btn = document.getElementById('btn-timer');
    btn.textContent = 'Stop Timer';
    btn.className   = 'btn-stop';

    startDisplayUpdate(s.timerStart);
  }
}

function startDisplayUpdate(startTime) {
  const display = document.getElementById('timer-display');
  display.classList.add('running');

  timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    display.textContent = formatSeconds(elapsed);
  }, 1000);

  // Initial render
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  display.textContent = formatSeconds(elapsed);
}

async function handleTimer() {
  const s = await chrome.storage.local.get(['timerRunning','timerStart','timerClient','timerTask','timerNotes']);

  if (s.timerRunning) {
    // Stop
    clearInterval(timerInterval);
    timerInterval = null;

    const durationMinutes = Math.round((Date.now() - s.timerStart) / 60000);
    if (durationMinutes < 1) {
      // Too short — just cancel
      await chrome.storage.local.remove(['timerRunning','timerStart','timerClient','timerTask','timerNotes']);
      resetTimerUI();
      return;
    }

    await submitEntry({
      employee_name:    settings.name,
      client:           s.timerClient,
      task_type:        s.timerTask,
      duration_minutes: durationMinutes,
      entry_date:       todayDate(),
      notes:            s.timerNotes || '',
    });

    await chrome.storage.local.remove(['timerRunning','timerStart','timerClient','timerTask','timerNotes']);
    resetTimerUI();
    await loadTodayEntries();

  } else {
    // Start
    const client = document.getElementById('sel-client').value;
    const task   = document.getElementById('sel-task').value;
    const notes  = document.getElementById('txt-notes').value.trim();
    const startTime = Date.now();

    await chrome.storage.local.set({
      timerRunning: true,
      timerStart:   startTime,
      timerClient:  client,
      timerTask:    task,
      timerNotes:   notes,
    });

    document.getElementById('sel-client').disabled = true;
    document.getElementById('sel-task').disabled   = true;
    document.getElementById('txt-notes').disabled  = true;

    const btn = document.getElementById('btn-timer');
    btn.textContent = 'Stop Timer';
    btn.className   = 'btn-stop';

    startDisplayUpdate(startTime);
  }
}

function resetTimerUI() {
  document.getElementById('timer-display').textContent = '00:00:00';
  document.getElementById('timer-display').classList.remove('running');
  document.getElementById('sel-client').disabled = false;
  document.getElementById('sel-task').disabled   = false;
  document.getElementById('txt-notes').disabled  = false;
  document.getElementById('txt-notes').value     = '';

  const btn = document.getElementById('btn-timer');
  btn.textContent = 'Start Timer';
  btn.className   = 'btn-start';
}

async function submitEntry(entry) {
  const resp = await fetch(`${settings.supabaseUrl}/rest/v1/time_entries`, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'apikey':        settings.supabaseKey,
      'Authorization': `Bearer ${settings.supabaseKey}`,
      'Prefer':        'return=minimal',
    },
    body: JSON.stringify(entry),
  });
  if (!resp.ok) {
    const err = await resp.text();
    console.error('Supabase error:', err);
  }
}

async function loadTodayEntries() {
  const today = todayDate();
  const url = `${settings.supabaseUrl}/rest/v1/time_entries`
    + `?entry_date=eq.${today}`
    + `&employee_name=eq.${encodeURIComponent(settings.name)}`
    + `&order=created_at.desc`;

  let entries = [];
  try {
    const resp = await fetch(url, {
      headers: {
        'apikey':        settings.supabaseKey,
        'Authorization': `Bearer ${settings.supabaseKey}`,
      },
    });
    if (resp.ok) entries = await resp.json();
  } catch {}

  renderTodayEntries(entries);
}

function renderTodayEntries(entries) {
  const container = document.getElementById('today-entries');
  const totalEl   = document.getElementById('today-total');

  if (!entries.length) {
    container.innerHTML = '<div class="no-entries">No entries yet today</div>';
    totalEl.textContent = '';
    return;
  }

  const totalMins = entries.reduce((sum, e) => sum + e.duration_minutes, 0);
  totalEl.textContent = formatMinutes(totalMins);

  container.innerHTML = entries.map(e => `
    <div class="entry-item">
      <div class="entry-left">
        <span class="entry-client">${e.client}</span>
        <span class="entry-task">${e.task_type}</span>
        ${e.notes ? `<span class="entry-notes">${e.notes}</span>` : ''}
      </div>
      <span class="entry-duration">${formatMinutes(e.duration_minutes)}</span>
    </div>
  `).join('');
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatSeconds(s) {
  const h = Math.floor(s / 3600).toString().padStart(2, '0');
  const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${h}:${m}:${sec}`;
}

function formatMinutes(mins) {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function todayDate() {
  return new Date().toISOString().split('T')[0];
}

function show(view) {
  document.getElementById('view-setup')?.classList.toggle('hidden', view !== 'setup');
  document.getElementById('view-main')?.classList.toggle('hidden',  view !== 'main');
}

document.addEventListener('DOMContentLoaded', init);
