// Agency 8 — Time Tracker web app                        
                                    
  let allEntries = [];                                                                                                                                                                                      
  let charts = {};                                                                                                                                                                                          
                                                                                                                                                                                                            
  async function init() {                                                                                                                                                                                   
    if (!SUPABASE_URL || !SUPABASE_KEY) {                                                                                                                                                                   
      document.getElementById('view-setup').classList.remove('hidden');
      return;                                                                                                                                                                                               
    }
    document.getElementById('view-main').classList.remove('hidden');                                                                                                                                        
                                                                                                                                                                                                            
    document.getElementById('btn-refresh').addEventListener('click', loadData);
    document.getElementById('fil-period').addEventListener('change', render);                                                                                                                               
    document.getElementById('btn-export').addEventListener('click', exportCSV);                                                                                                                             
  
    setupMultiSelectToggles();                                                                                                                                                                              
    await loadData();                                       
  }                                                                                                                                                                                                         
                                                            
  async function loadData() {
    try {
      const resp = await fetch(
        `${SUPABASE_URL}/rest/v1/time_entries?order=entry_date.desc,created_at.desc&limit=2000`,
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
    const people  = [...new Set(allEntries.map(e => e.employee_name))].sort();
    const clients = [...new Set(allEntries.map(e => e.client))].sort();                                                                                                                                     
  
    buildMultiSelect('ms-person-list', 'ms-person-btn', people, 'Everyone');                                                                                                                                
    buildMultiSelect('ms-client-list', 'ms-client-btn', clients, 'All Clients');
  }                                                                                                                                                                                                         
                                                            
  function buildMultiSelect(listId, btnId, items, allLabel) {                                                                                                                                               
    const list = document.getElementById(listId);           
    const btn  = document.getElementById(btnId);                                                                                                                                                            
                                                            
    list.innerHTML = items.map(item => `
      <label class="ms-item">
        <input type="checkbox" value="${item}"> ${item}                                                                                                                                                     
      </label>
    `).join('');                                                                                                                                                                                            
                                                            
    list.querySelectorAll('input').forEach(cb => {                                                                                                                                                          
      cb.addEventListener('change', () => {
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
    return [...document.getElementById(listId).querySelectorAll('input:checked')].map(i => i.value);
  }                                                                                                                                                                                                         
   
  function getDateRange(period) {                                                                                                                                                                           
    const today = new Date();                               
    today.setHours(0, 0, 0, 0);                                                                                                                                                                             
                                                            
    if (period === 'today') {
      return { from: today, to: new Date() };
    }                                                                                                                                                                                                       
    if (period === 'week') {
      const from = new Date(today);                                                                                                                                                                         
      from.setDate(today.getDate() - today.getDay());       
      return { from, to: new Date() };
    }                                                                                                                                                                                                       
    if (period === 'month') {
      const from = new Date(today.getFullYear(), today.getMonth(), 1);                                                                                                                                      
      return { from, to: new Date() };                      
    }
    if (period === 'last_month') {
      const from = new Date(today.getFullYear(), today.getMonth() - 1, 1);                                                                                                                                  
      const to   = new Date(today.getFullYear(), today.getMonth(), 0);
      return { from, to };                                                                                                                                                                                  
    }                                                       
    return { from: new Date(0), to: new Date() };                                                                                                                                                           
  }                                                         

  function filterEntries() {                                                                                                                                                                                
    const period  = document.getElementById('fil-period').value;
    const people  = getSelected('ms-person-list');                                                                                                                                                          
    const clients = getSelected('ms-client-list');          
    const { from, to } = getDateRange(period);                                                                                                                                                              
   
    return allEntries.filter(e => {                                                                                                                                                                         
      const d = new Date(e.entry_date + 'T00:00:00');       
      if (d < from || d > to) return false;                                                                                                                                                                 
      if (people.length  && !people.includes(e.employee_name)) return false;
      if (clients.length && !clients.includes(e.client))       return false;                                                                                                                                
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
                                                                                                                                                                                                            
    const byPerson = groupSum(entries, 'employee_name');
    const topPerson = Object.entries(byPerson).sort((a, b) => b[1] - a[1])[0];                                                                                                                              
                                                                                                                                                                                                            
    document.getElementById('stat-total').textContent      = fmtHours(totalMins);
    document.getElementById('stat-top-client').textContent = topClient ? topClient[0] : '—';                                                                                                                
    document.getElementById('stat-top-person').textContent = topPerson ? topPerson[0] : '—';                                                                                                                
    document.getElementById('stat-entries').textContent    = entries.length;                                                                                                                                
  }                                                                                                                                                                                                         
                                                                                                                                                                                                            
  function renderCharts(entries) {                          
    Object.values(charts).forEach(c => c.destroy());
    charts = {};

    const COLORS = [                                                                                                                                                                                        
      '#6c63ff','#ff6b9d','#43e97b','#f7971e','#4fc3f7',
      '#ff8a65','#ba68c8','#4db6ac','#fff176','#f06292',                                                                                                                                                    
      '#aed581','#ffb74d','#4dd0e1','#ce93d8','#80cbc4',    
    ];                                                                                                                                                                                                      
   
    const byClient = groupSum(entries, 'client');                                                                                                                                                           
    const clientEntries = Object.entries(byClient).sort((a, b) => b[1] - a[1]).slice(0, 12);
    charts.client = new Chart(document.getElementById('chart-client'), {                                                                                                                                    
      type: 'bar',
      data: {                                                                                                                                                                                               
        labels: clientEntries.map(e => e[0]),               
        datasets: [{ data: clientEntries.map(e => +(e[1]/60).toFixed(1)), backgroundColor: COLORS }],                                                                                                       
      },
      options: barOptions('Hours'),                                                                                                                                                                         
    });                                                     

    const byPerson = groupSum(entries, 'employee_name');                                                                                                                                                    
    const personEntries = Object.entries(byPerson).sort((a, b) => b[1] - a[1]);
    charts.person = new Chart(document.getElementById('chart-person'), {                                                                                                                                    
      type: 'bar',                                          
      data: {                                                                                                                                                                                               
        labels: personEntries.map(e => e[0]),
        datasets: [{ data: personEntries.map(e => +(e[1]/60).toFixed(1)), backgroundColor: COLORS }],                                                                                                       
      },                                                    
      options: barOptions('Hours'),
    });                                                                                                                                                                                                     
   
    const byTask = groupSum(entries, 'task_type');                                                                                                                                                          
    const taskEntries = Object.entries(byTask).sort((a, b) => b[1] - a[1]);
    charts.task = new Chart(document.getElementById('chart-task'), {
      type: 'doughnut',                                                                                                                                                                                     
      data: {
        labels: taskEntries.map(e => e[0]),                                                                                                                                                                 
        datasets: [{ data: taskEntries.map(e => +(e[1]/60).toFixed(1)), backgroundColor: COLORS }],
      },                                                                                                                                                                                                    
      options: donutOptions(),
    });                                                                                                                                                                                                     
                                                            
    const byDay = groupSum(entries, 'entry_date');
    const dayEntries = Object.entries(byDay).sort((a, b) => a[0].localeCompare(b[0]));
    charts.daily = new Chart(document.getElementById('chart-daily'), {                                                                                                                                      
      type: 'bar',
      data: {                                                                                                                                                                                               
        labels: dayEntries.map(e => formatDate(e[0])),      
        datasets: [{                                                                                                                                                                                        
          data: dayEntries.map(e => +(e[1]/60).toFixed(1)),
          backgroundColor: '#6c63ff',                                                                                                                                                                       
          borderRadius: 4,                                  
        }],
      },
      options: barOptions('Hours'),
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

  function barOptions(yLabel) {
    return {
      responsive: true,
      plugins: {
        legend: { display: false },                                                                                                                                                                         
        tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.y}h` } },
      },                                                                                                                                                                                                    
      scales: {                                             
        x: { ticks: { color: '#666', font: { size: 11 } }, grid: { color: '#1a1a1a' } },
        y: { ticks: { color: '#666', font: { size: 11 } }, grid: { color: '#1a1a1a' }, title: { display: false } },                                                                                         
      },                                                                                                                                                                                                    
    };                                                                                                                                                                                                      
  }                                                                                                                                                                                                         
                                                            
  function donutOptions() {
    return {
      responsive: true,
      plugins: {
        legend: {
          position: 'right',
          labels: { color: '#aaa', font: { size: 12 }, padding: 12, boxWidth: 14 },
        },                                                                                                                                                                                                  
        tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed}h` } },
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
