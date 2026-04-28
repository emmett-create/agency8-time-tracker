// Agency 8 — Time Tracker web app                                                                                                                                                                        
                                                                                                                                                                                                            
  let allEntries = [];                                                                                                                                                                                      
  let charts = {};                                                                                                                                                                                          
                                                                                                                                                                                                            
  async function init() {                                                                                                                                                                                   
    if (!SUPABASE_URL || !SUPABASE_KEY) {                                                                                                                                                                   
      document.getElementById('view-setup').classList.remove('hidden');                                                                                                                                     
      return;                                 
    }                                                                                                                                                                                                       
    document.getElementById('view-main').classList.remove('hidden');
                                                                                                                                                                                                            
    const today = new Date().toISOString().split('T')[0];
    const firstOfMonth = today.slice(0, 7) + '-01';                                                                                                                                                         
    document.getElementById('fil-from').value = firstOfMonth;                                                                                                                                               
    document.getElementById('fil-to').value   = today;
                                                                                                                                                                                                            
    document.getElementById('btn-refresh').addEventListener('click', loadData);                                                                                                                             
    document.getElementById('fil-from').addEventListener('change', render);
    document.getElementById('fil-to').addEventListener('change', render);                                                                                                                                   
    document.getElementById('fil-person').addEventListener('change', render);
    document.getElementById('fil-client').addEventListener('change', render);                                                                                                                               
    document.getElementById('btn-export').addEventListener('click', exportCSV);                                                                                                                             
                                              
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
                                              
    const personSel = document.getElementById('fil-person');
    const clientSel = document.getElementById('fil-client');                                                                                                                                                
                                                                                                                                                                                                            
    const curPerson = personSel.value;                                                                                                                                                                      
    const curClient = clientSel.value;                                                                                                                                                                      
                                                            
    personSel.innerHTML = '<option value="">Everyone</option>';                                                                                                                                             
    people.forEach(p => {
      const opt = new Option(p, p);                                                                                                                                                                         
      if (p === curPerson) opt.selected = true;             
      personSel.appendChild(opt);
    });                                                                                                                                                                                                     
  
    clientSel.innerHTML = '<option value="">All Clients</option>';                                                                                                                                          
    clients.forEach(c => {                                  
      const opt = new Option(c, c);
      if (c === curClient) opt.selected = true;                                                                                                                                                             
      clientSel.appendChild(opt);
    });                                                                                                                                                                                                     
  }                                                         

  function filterEntries() {                                                                                                                                                                                
    const fromVal = document.getElementById('fil-from').value;
    const toVal   = document.getElementById('fil-to').value;                                                                                                                                                
    const person  = document.getElementById('fil-person').value;
    const client  = document.getElementById('fil-client').value;
                                          
    return allEntries.filter(e => {
      if (fromVal && e.entry_date < fromVal) return false;                                                                                                                                                  
      if (toVal   && e.entry_date > toVal)   return false;
      if (person && e.employee_name !== person) return false;                                                                                                                                               
      if (client && e.client !== client) return false;      
      return true;                            
    });                                                                                                                                                                                                     
  }
                                                                                                                                                                                                            
  function render() {                                       
    const entries = filterEntries();                                                                                                                                                                        
    renderStats(entries);                                   
    renderCharts(entries);
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
                                                                                                                                                                                                            
  function groupSum(entries, key) {                         
    return entries.reduce((acc, e) => {                                                                                                                                                                     
      acc[e[key]] = (acc[e[key]] || 0) + e.duration_minutes;
      return acc;                                                                                                                                                                                           
    }, {});                               
  }                                                                                                                                                                                                         
                                                                                                                                                                                                            
  function fmtHours(mins) {
    const h = (mins / 60).toFixed(1);                                                                                                                                                                       
    return `${h}h`;                                         
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
