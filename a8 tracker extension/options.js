// Agency 8 — Time Tracker options.js

const DEFAULT_CLIENTS = [
  'BORNTOSTANDOUT','Brodo','Counter','Emma Relief','EvolveTogether',
  'Feals','Fur','Harper Wilde','HigherDOSE','Ilia','Internal','Kind Patches','Lenox and Sixteenth',
  'MadeGood','Magic Molecule','Magna','Maev','Merit','Momofuku',
  'Nette','Pattern','Raazi','Roz','Snif','Squigs','Stardust','SYS','Timebeam','TodayTix','Tushy',
];

const DEFAULT_TASKS = [
  'Meetings (Ext)','Meetings (Int)','Sourcing/List Building','Strategy/Planning',
  'Paid','Client Comms','Creator Comms (DM)','Creator Comms (Email)',
  'Reporting','Shopify','Spreadsheet Management','Content Brief',
  'Outreach Copy','ShopMy','TikTok Shop','LTK','Onboarding','Offboarding','Newsletters',
];

async function init() {
  const s = await chrome.storage.local.get([
    'name','supabaseUrl','supabaseKey','dashboardUrl','clients','tasks',
  ]);

  document.getElementById('inp-name').value      = s.name || '';
  document.getElementById('inp-url').value       = s.supabaseUrl || '';
  document.getElementById('inp-key').value       = s.supabaseKey || '';
  document.getElementById('inp-dashboard').value = s.dashboardUrl || '';
  document.getElementById('inp-clients').value   = (s.clients || DEFAULT_CLIENTS).join('\n');
  document.getElementById('inp-tasks').value     = (s.tasks || DEFAULT_TASKS).join('\n');

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
