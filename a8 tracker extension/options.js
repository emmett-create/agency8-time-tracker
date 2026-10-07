// Agency 8 — Time Tracker options.js

// Kept in sync with popup.js's copy of this same list (2026-10-07: these had
// drifted apart — options.js was missing Gimme Seaweed, the Internal -
// categories, Oura, Stardust, and U Beauty that popup.js already had).
const DEFAULT_CLIENTS = [
  'Allies of Skin','Biossance','BORNTOSTANDOUT','Brodo','Counter',"Dr. Diamond's Metacine",'Dr. Squatch','Emma Relief','EvolveTogether',
  'Feals','Fenty','Fur','Gimme Seaweed','Harper Wilde','HigherDOSE','Ilia','Internal - Calls','Internal - Ops','Internal - Professional Development','Kalshi','Kind Patches','Lenox and Sixteenth',
  'MadeGood','Magic Molecule','Magna','Maev','Merit','Momofuku','Murad','Nette','Oura',
  'Pattern','Raazi Tea','Reale Actives','Roz','Snif','Squigs','Stardust','SYS','Tein','The Absorption Company','Tilt Beauty','Timebeam','TodayTix','Tushy','U Beauty',
];

function mergeDefaults(stored, defaults) {
  const lower = new Set(stored.map(c => c.toLowerCase()));
  const merged = [...stored];
  for (const c of defaults) {
    if (!lower.has(c.toLowerCase())) merged.push(c);
  }
  return merged.sort((a, b) => a.localeCompare(b));
}

async function init() {
  const s = await chrome.storage.local.get([
    'name','supabaseUrl','supabaseKey','dashboardUrl','clients',
  ]);

  document.getElementById('inp-name').value      = s.name || '';
  document.getElementById('inp-url').value       = s.supabaseUrl || '';
  document.getElementById('inp-key').value       = s.supabaseKey || '';
  document.getElementById('inp-dashboard').value = s.dashboardUrl || '';
  document.getElementById('inp-clients').value   = (s.clients ? mergeDefaults(s.clients, DEFAULT_CLIENTS) : DEFAULT_CLIENTS).join('\n');

  document.getElementById('btn-save').addEventListener('click', save);
}

async function save() {
  const name        = document.getElementById('inp-name').value.trim();
  const supabaseUrl = document.getElementById('inp-url').value.trim().replace(/\/$/, '');
  const supabaseKey = document.getElementById('inp-key').value.trim();
  const dashboardUrl = document.getElementById('inp-dashboard').value.trim();
  const clients     = document.getElementById('inp-clients').value
    .split('\n').map(l => l.trim()).filter(Boolean);

  await chrome.storage.local.set({ name, supabaseUrl, supabaseKey, dashboardUrl, clients });

  const confirm = document.getElementById('save-confirm');
  confirm.classList.add('visible');
  setTimeout(() => confirm.classList.remove('visible'), 2000);
}

document.addEventListener('DOMContentLoaded', init);
