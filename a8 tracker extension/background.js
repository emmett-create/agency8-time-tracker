// Agency 8 — Time Tracker background.js
// Sends a daily 5 PM ET reminder to log time entries.

const ALARM_NAME  = 'time-reminder';
const PING_ALARM  = 'timer-ping';

chrome.runtime.onInstalled.addListener(scheduleReminder);
chrome.runtime.onStartup.addListener(async () => {
  scheduleReminder();
  const s = await chrome.storage.local.get('timerRunning');
  if (s.timerRunning) chrome.alarms.create(PING_ALARM, { periodInMinutes: 60 });
});

chrome.storage.onChanged.addListener((changes) => {
  if (!changes.timerRunning) return;
  if (changes.timerRunning.newValue) {
    chrome.alarms.create(PING_ALARM, { periodInMinutes: 60 });
  } else {
    chrome.alarms.clear(PING_ALARM);
  }
});

chrome.alarms.onAlarm.addListener(async alarm => {
  if (alarm.name === ALARM_NAME) {
    chrome.notifications.create({
      type:    'basic',
      iconUrl: 'icons/icon48.png',
      title:   'Agency 8 — Time Tracker',
      message: "Don't forget to stop your timer and log any missing entries!",
    });
    scheduleReminder();
  } else if (alarm.name === PING_ALARM) {
    const s = await chrome.storage.local.get('timerRunning');
    if (!s.timerRunning) return;
    await playPing();
  }
});

async function playPing() {
  const exists = await chrome.offscreen.hasDocument();
  if (!exists) {
    await chrome.offscreen.createDocument({
      url: 'offscreen.html',
      reasons: ['AUDIO_PLAYBACK'],
      justification: 'Hourly ping to remind user timer is running',
    });
  }
  chrome.runtime.sendMessage({ type: 'ping' });
  setTimeout(() => chrome.offscreen.closeDocument(), 3000);
}

function scheduleReminder() {
  chrome.alarms.clear(ALARM_NAME, () => {
    chrome.alarms.create(ALARM_NAME, { when: next5pmET() });
  });
}

function next5pmET() {
  const now   = new Date();
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'America/New_York',
    hour: 'numeric', minute: 'numeric', second: 'numeric',
    hour12: false,
  }).formatToParts(now);

  const h = +parts.find(p => p.type === 'hour').value;
  const m = +parts.find(p => p.type === 'minute').value;
  const s = +parts.find(p => p.type === 'second').value;

  const secsElapsed = h * 3600 + m * 60 + s;
  const targetSecs  = 17 * 3600; // 5:00 PM

  let secsUntil = targetSecs - secsElapsed;
  if (secsUntil <= 0) secsUntil += 24 * 3600;

  return now.getTime() + secsUntil * 1000;
}
