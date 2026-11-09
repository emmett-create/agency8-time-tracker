// Agency 8 — Time Tracker options.js

// Kept in sync with popup.js's copy of this same list — see there for the
// full note on what changed and why.
const DEFAULT_CLIENTS = [
  'Biossance','BORNTOSTANDOUT','Brodo','Clare V.','Counter',"Dr. Diamond's Metacine",'Dr. Squatch','EvolveTogether',
  'Feals','Fenty','Fur','Gimme Seaweed','Harper Wilde','Ilia','MadeGood','Maev','Magic Molecule','Magna','Merit','Momofuku','Moon Juice','Murad','Personal Day',
  'Raazi Tea','Reale Actives','Roz','Snif','Squigs','Stardust','Stars + Honey','Stocked','SYS',
  'Tein','The Absorption Company','Tilt Beauty','Timebeam','Tushy','U Beauty',
  'DTC','1:1s','Professional Development',
];

// Kept in sync with popup.js's copy — see there for the full note.
const DEFAULT_TASKS = [
  'External Comms','Internal Meetings','Strategy/Planning','Sourcing + Spreadsheet Management',
  'Creator Comms','Material Development','Contracting + Invoicing','Monthly Reporting','Mailer / Special Project',
];

// Kept in sync with popup.js's copy — see there for the full note on why a
// version mismatch force-resets stored clients/tasks instead of merging.
const LISTS_VERSION = 2;

async function init() {
  const s = await chrome.storage.local.get([
    'name','supabaseUrl','supabaseKey','dashboardUrl','clients','tasks','listsVersion',
  ]);

  let clients = s.clients;
  let tasks   = s.tasks;
  if (s.listsVersion !== LISTS_VERSION) {
    clients = DEFAULT_CLIENTS;
    tasks   = DEFAULT_TASKS;
    await chrome.storage.local.set({ clients, tasks, listsVersion: LISTS_VERSION });
  }

  document.getElementById('inp-name').value      = s.name || '';
  document.getElementById('inp-url').value       = s.supabaseUrl || '';
  document.getElementById('inp-key').value       = s.supabaseKey || '';
  document.getElementById('inp-dashboard').value = s.dashboardUrl || '';
  document.getElementById('inp-clients').value   = (clients && clients.length ? clients : DEFAULT_CLIENTS).join('\n');
  document.getElementById('inp-tasks').value     = (tasks && tasks.length ? tasks : DEFAULT_TASKS).join('\n');

  document.getElementById('btn-save').addEventListener('click', save);
}

async function save() {
  const name        = document.getElementById('inp-name').value.trim();
  const supabaseUrl = document.getElementById('inp-url').value.trim().replace(/\/$/, '');
  const supabaseKey = document.getElementById('inp-key').value.trim();
  const dashboardUrl = document.getElementById('inp-dashboard').value.trim();
  const clients     = document.getElementById('inp-clients').value
    .split('\n').map(l => l.trim()).filter(Boolean);
  const tasks       = document.getElementById('inp-tasks').value
    .split('\n').map(l => l.trim()).filter(Boolean);

  await chrome.storage.local.set({ name, supabaseUrl, supabaseKey, dashboardUrl, clients, tasks });

  const confirm = document.getElementById('save-confirm');
  confirm.classList.add('visible');
  setTimeout(() => confirm.classList.remove('visible'), 2000);
}

document.addEventListener('DOMContentLoaded', init);
