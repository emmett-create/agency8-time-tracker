// Agency 8 — Time Tracker web app

let allEntries = [];
let charts = {};
let personChartMode = 'client'; // always by client now

// Reusable plugin: draw total on top of every stacked bar
const totalLabelPlugin = {
  id: 'totalLabels',
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    const lastMeta = chart.getDatasetMeta(chart.data.datasets.length - 1);
    lastMeta.data.forEach((bar, i) => {
      const total = chart.data.datasets.reduce((s, ds) => s + (ds.data[i] || 0), 0);
      if (!total) return;
      ctx.save();
      ctx.font = 'bold 11px -apple-system, sans-serif';
      ctx.fillStyle = '#cccccc';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(total.toFixed(1) + 'h', bar.x, bar.y - 4);
      ctx.restore();
    });
  }
};

const TASK_COLORS = {
  'Meetings (Ext)':          '#9c8fff',
  'Meetings (Int)':          '#6c63ff',
  'Sourcing/List Building':  '#ff6b9d',
  'Strategy/Planning':       '#43e97b',
  'Paid':                    '#ffd700',
  'Client Comms':            '#4fc3f7',
  'Creator Comms (DM)':      '#f06292',
  'Creator Comms (Email)':   '#4db6ac',
  'Reporting':               '#ff8a65',
  'Shopify':                 '#ff7043',
  'Spreadsheet Management':  '#fff176',
  'Content Brief':           '#aed581',
  'Outreach Copy':           '#f48fb1',
  'ShopMy':                  '#ce93d8',
  'TikTok Shop':             '#80cbc4',
  'LTK':                     '#f7971e',
  'Onboarding':              '#aed581',
  'Offboarding':             '#4db6ac',
  'Newsletters':             '#80deea',
};

const AUTO_COLORS = [
  '#6c63ff','#ff6b9d','#43e97b','#f7971e','#4fc3f7',
  '#f06292','#ff8a65','#ba68c8','#4db6ac','#fff176',
  '#ff7043','#ce93d8','#80cbc4','#aed581','#f48fb1',
  '#80deea','#ffcc80','#a5d6a7','#ef9a9a','#90caf9',
];

async function init() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    document.getElementById('view-setup').classList.remove('hidden');
    return;
  }
  document.getElementById('view-main').classList.remove('hidden');

  const today = new Date().toISOString().split('T')[0];
  document.getElementById('fil-from').value = today.slice(0, 7) + '-01';
  document.getElementById('fil-to').value   = today;

  document.getElementById('btn-refresh').addEventListener('click', loadData);
  document.getElementById('fil-from').addEventListener('change', loadData);
  document.getElementById('fil-to').addEventListener('change', loadData);
  document.getElementById('btn-export').addEventListener('click', exportCSV);

  document.querySelectorAll('.chart-toggle[data-chart="person"]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.chart-toggle[data-chart="person"]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      personChartMode = btn.dataset.mode;
      render();
    });
  });

  setupMultiSelectToggles();
  await loadData();
}

async function loadData() {
  try {
    const fromVal = document.getElementById('fil-from').value;
    const toVal   = document.getElementById('fil-to').value;
    let url = `${SUPABASE_URL}/rest/v1/time_entries?order=entry_date.desc,created_at.desc`;
    if (fromVal) url += `&entry_date=gte.${fromVal}`;
    if (toVal)   url += `&entry_date=lte.${toVal}`;
    const resp = await fetch(url,
      { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
    );
    if (!resp.ok) throw new Error(await resp.text());
    allEntries = await resp.json();
    populateFilters();
    render();
  } catch (e) {
    console.error('Failed to load entries:', e);
  }
}

function populateFilters() {
  const HIDDEN_PEOPLE = ["Melia"];
  const people  = [...new Set(allEntries.map(e => e.employee_name))]
    .filter(n => !HIDDEN_PEOPLE.includes(n)).sort();
  const clients = [...new Set(allEntries.map(e => e.client))].sort();
  const tasks   = [...new Set(allEntries.map(e => e.task_type))].sort();

  buildMultiSelect('ms-person-list', 'ms-person-btn', people, 'Everyone');
  buildMultiSelect('ms-client-list', 'ms-client-btn', clients, 'All Clients');
  buildMultiSelect('ms-task-list',   'ms-task-btn',   tasks,   'All Tasks');
}

function buildMultiSelect(listId, btnId, items, allLabel) {
  const list = document.getElementById(listId);
  const btn  = document.getElementById(btnId);

  list.innerHTML = `
    <label class="ms-item ms-item--all">
      <input type="checkbox" class="ms-all-cb"> Select All
    </label>
  ` + items.map(item => `
    <label class="ms-item">
      <input type="checkbox" value="${item}"> ${item}
    </label>
  `).join('');

  const allCb   = list.querySelector('.ms-all-cb');
  const itemCbs = [...list.querySelectorAll('input[value]')];

  allCb.addEventListener('change', () => {
    itemCbs.forEach(cb => cb.checked = allCb.checked);
    const checked = getSelected(listId);
    btn.textContent = checked.length === 0 ? `${allLabel} ▾` : `${checked.length} selected ▾`;
    render();
  });

  itemCbs.forEach(cb => {
    cb.addEventListener('change', () => {
      allCb.checked       = itemCbs.every(c => c.checked);
      allCb.indeterminate = !allCb.checked && itemCbs.some(c => c.checked);
      const checked = getSelected(listId);
      btn.textContent = checked.length === 0 ? `${allLabel} ▾` : `${checked.length} selected ▾`;
      render();
    });
  });
}

function setupMultiSelectToggles() {
  document.querySelectorAll('.multi-select').forEach(wrapper => {
    const btn  = wrapper.querySelector('.ms-trigger');
    const list = wrapper.querySelector('.ms-dropdown');

    btn.addEventListener('click', e => {
      e.stopPropagation();
      document.querySelectorAll('.ms-dropdown').forEach(d => {
        if (d !== list) d.classList.add('hidden');
      });
      list.classList.toggle('hidden');
    });

    list.addEventListener('click', e => e.stopPropagation());
  });

  document.addEventListener('click', () => {
    document.querySelectorAll('.ms-dropdown').forEach(d => d.classList.add('hidden'));
  });
}

function getSelected(listId) {
  return [...document.getElementById(listId).querySelectorAll('input[value]:checked')].map(i => i.value);
}

function filterEntries() {
  const people  = getSelected('ms-person-list');
  const clients = getSelected('ms-client-list');
  const tasks   = getSelected('ms-task-list');

  return allEntries.filter(e => {
    if (people.length  && !people.includes(e.employee_name)) return false;
    if (clients.length && !clients.includes(e.client))       return false;
    if (tasks.length   && !tasks.includes(e.task_type))      return false;
    return true;
  });
}

function render() {
  const entries = filterEntries();
  renderStats(entries);
  renderCharts(entries);
  renderTable(entries);
}

function renderStats(entries) {
  const totalMins = entries.reduce((s, e) => s + e.duration_minutes, 0);

  const byClient = groupSum(entries, 'client');
  const topClient = Object.entries(byClient).sort((a, b) => b[1] - a[1])[0];

  const byTask = groupSum(entries, 'task_type');
  const topTask = Object.entries(byTask).sort((a, b) => b[1] - a[1])[0];

  document.getElementById('stat-total').textContent      = fmtHours(totalMins);
  document.getElementById('stat-top-client').textContent = topClient ? topClient[0] : '—';
  document.getElementById('stat-top-task').textContent   = topTask ? topTask[0] : '—';
}

// ── Stacked chart helpers ──────────────────────────────────────────────────────

function stackedByTask(entries, groupKey, sortByTotal) {
  let groups = [...new Set(entries.map(e => e[groupKey]))];
  if (sortByTotal) {
    groups.sort((a, b) => {
      const ta = entries.filter(e => e[groupKey] === a).reduce((s, e) => s + e.duration_minutes, 0);
      const tb = entries.filter(e => e[groupKey] === b).reduce((s, e) => s + e.duration_minutes, 0);
      return tb - ta;
    });
  } else {
    groups.sort();
  }

  const tasks = Object.keys(TASK_COLORS).filter(t => entries.some(e => e.task_type === t));
  entries.forEach(e => { if (!tasks.includes(e.task_type)) tasks.push(e.task_type); });

  const datasets = tasks.map(task => ({
    label: task,
    data: groups.map(g =>
      +(entries.filter(e => e[groupKey] === g && e.task_type === task)
               .reduce((s, e) => s + e.duration_minutes, 0) / 60).toFixed(2)
    ),
    backgroundColor: TASK_COLORS[task] || '#aaa',
  }));

  return { groups, datasets };
}

function stackedByClient(entries, groupKey) {
  let groups = [...new Set(entries.map(e => e[groupKey]))];
  groups.sort((a, b) => {
    const ta = entries.filter(e => e[groupKey] === a).reduce((s, e) => s + e.duration_minutes, 0);
    const tb = entries.filter(e => e[groupKey] === b).reduce((s, e) => s + e.duration_minutes, 0);
    return tb - ta;
  });

  const clients = [...new Set(entries.map(e => e.client))];

  const datasets = clients.map((client, i) => ({
    label: client,
    data: groups.map(g =>
      +(entries.filter(e => e[groupKey] === g && e.client === client)
               .reduce((s, e) => s + e.duration_minutes, 0) / 60).toFixed(2)
    ),
    backgroundColor: AUTO_COLORS[i % AUTO_COLORS.length],
  }));

  return { groups, datasets };
}

// Tooltip: stacked by person — shows "Person: Xh" with no task breakdown
function personTooltip(entries, groupKey, isDate) {
  return ctx => {
    const person = ctx.dataset.label;
    return ` ${person}: ${ctx.parsed.y}h`;
  };
}

// Tooltip for daily chart: stacked by client, shows client → person breakdown
function clientPersonTooltip(entries, groupKey) {
  return ctx => {
    const client = ctx.dataset.label;
    const label  = ctx.label; // formatted date string
    const relevant = entries.filter(e => formatDate(e[groupKey]) === label && e.client === client);
    const byPerson = {};
    relevant.forEach(e => {
      byPerson[e.employee_name] = (byPerson[e.employee_name] || 0) + e.duration_minutes;
    });
    const people = Object.entries(byPerson).sort((a, b) => b[1] - a[1]);
    if (!people.length) return ` ${client}: ${ctx.parsed.y}h`;
    return [
      ` ${client}: ${ctx.parsed.y}h`,
      ...people.map(([p, m]) => `  ↳ ${p}: ${(m / 60).toFixed(2)}h`),
    ];
  };
}

// Stack by person within each group (for Hours by Client chart)
function stackedByPerson(entries, groupKey, sortByTotal) {
  let groups = [...new Set(entries.map(e => e[groupKey]))];
  if (sortByTotal) {
    groups.sort((a, b) => {
      const ta = entries.filter(e => e[groupKey] === a).reduce((s, e) => s + e.duration_minutes, 0);
      const tb = entries.filter(e => e[groupKey] === b).reduce((s, e) => s + e.duration_minutes, 0);
      return tb - ta;
    });
  } else groups.sort();
  const people = [...new Set(entries.map(e => e.employee_name))];
  const datasets = people.map((person, i) => ({
    label: person,
    data: groups.map(g =>
      +(entries.filter(e => e[groupKey] === g && e.employee_name === person)
               .reduce((s, e) => s + e.duration_minutes, 0) / 60).toFixed(2)
    ),
    backgroundColor: AUTO_COLORS[i % AUTO_COLORS.length],
  }));
  return { groups, datasets };
}

function renderCharts(entries) {
  Object.values(charts).forEach(c => c.destroy());
  charts = {};

  // Hours by Client — stacked by person
  const { groups: clientGroups, datasets: clientDatasets } = stackedByPerson(entries, 'client', true);
  charts.client = new Chart(document.getElementById('chart-client'), {
    type: 'bar',
    data: { labels: clientGroups, datasets: clientDatasets },
    options: stackedBarOptions(personTooltip(entries, 'client', false)),
    plugins: [totalLabelPlugin],
  });

  // Hours by Person — always by client (no task toggle)
  const { groups: personGroups, datasets: personDatasets } = stackedByClient(entries, 'employee_name');
  charts.person = new Chart(document.getElementById('chart-person'), {
    type: 'bar',
    data: { labels: personGroups, datasets: personDatasets },
    options: stackedBarOptions(ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y}h`),
    plugins: [totalLabelPlugin],
  });

  // Hours by Client (bottom-left) — stacked by person, sorted by total
  const { groups: taskGroups, datasets: taskDatasets } = stackedByPerson(entries, 'client', true);
  charts.task = new Chart(document.getElementById('chart-task'), {
    type: 'bar',
    data: { labels: taskGroups, datasets: taskDatasets },
    options: stackedBarOptions(personTooltip(entries, 'client', false)),
    plugins: [totalLabelPlugin],
  });

  // Daily Hours — stacked by client, tooltip shows client → person breakdown
  const { groups: dayGroups, datasets: dayDatasets } = stackedByClient(entries, 'entry_date');
  charts.daily = new Chart(document.getElementById('chart-daily'), {
    type: 'bar',
    data: { labels: dayGroups.map(formatDate), datasets: dayDatasets },
    options: stackedBarOptions(clientPersonTooltip(entries, 'entry_date'), 10),
    plugins: [totalLabelPlugin],
  });
}

function renderTable(entries) {
  const tbody = document.getElementById('entries-body');
  tbody.innerHTML = entries.map(e => `
    <tr>
      <td>${formatDate(e.entry_date)}</td>
      <td>${e.employee_name}</td>
      <td>${e.client}</td>
      <td>${e.task_type}</td>
      <td>${fmtMinutes(e.duration_minutes)}</td>
      <td class="muted">${e.notes || ''}</td>
    </tr>
  `).join('') || '<tr><td colspan="6" style="text-align:center;color:#444;padding:24px">No entries found</td></tr>';
}

function exportCSV() {
  const entries = filterEntries();
  const rows = [
    ['Date','Person','Client','Task','Duration (min)','Notes'],
    ...entries.map(e => [e.entry_date, e.employee_name, e.client, e.task_type, e.duration_minutes, e.notes || '']),
  ];
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `agency8-time-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
}

// ── Chart option helpers ───────────────────────────────────────────────────────

function stackedBarOptions(tooltipLabel, xTicksLimit) {
  return {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#aaa', font: { size: 11 }, padding: 10, boxWidth: 12 },
      },
      tooltip: { callbacks: { label: tooltipLabel } },
    },
    scales: {
      x: { stacked: true, ticks: { color: '#666', font: { size: 11 }, ...(xTicksLimit ? { maxTicksLimit: xTicksLimit } : {}) }, grid: { color: '#1a1a1a' } },
      y: { stacked: true, ticks: { color: '#666', font: { size: 11 } }, grid: { color: '#1a1a1a' } },
    },
  };
}

function donutOptions(entries) {
  return {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
        labels: { color: '#aaa', font: { size: 12 }, padding: 12, boxWidth: 14 },
      },
      tooltip: {
        callbacks: {
          label: ctx => {
            const task = ctx.label;
            const byPerson = {};
            entries.filter(e => e.task_type === task).forEach(e => {
              byPerson[e.employee_name] = (byPerson[e.employee_name] || 0) + e.duration_minutes;
            });
            const people = Object.entries(byPerson).sort((a, b) => b[1] - a[1]);
            if (people.length <= 1) return ` ${task}: ${ctx.parsed}h`;
            return [
              ` ${task}: ${ctx.parsed}h`,
              ...people.map(([p, m]) => `  ↳ ${p}: ${(m / 60).toFixed(2)}h`),
            ];
          },
        },
      },
    },
  };
}

// ── Utility ────────────────────────────────────────────────────────────────────

function groupSum(entries, key) {
  return entries.reduce((acc, e) => {
    acc[e[key]] = (acc[e[key]] || 0) + e.duration_minutes;
    return acc;
  }, {});
}

function fmtHours(mins) {
  return `${(mins / 60).toFixed(1)}h`;
}

function fmtMinutes(mins) {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-');
  return `${m}/${d}/${y.slice(2)}`;
}

document.addEventListener('DOMContentLoaded', init);
