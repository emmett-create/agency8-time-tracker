// Agency 8 — Time Tracker web app                                                                                                                                                                        
                                                            
  let allEntries = [];                    
  let charts = {};
                                                                                                                                                                                                            
  const TASK_COLORS = {                       
    'Meetings':          '#6c63ff',                                                                                                                                                                         
    'Sourcing':          '#ff6b9d',                         
    'Outreach/Response': '#43e97b',                                                                                                                                                                         
    'Reporting':         '#f7971e',           
    'Shopify':           '#4fc3f7',                                                                                                                                                                         
    'Strategy':          '#ff8a65',                         
  };                                                                                                                                                                                                        
   
  const PERSON_PALETTE = [                                                                                                                                                                                  
    '#6c63ff','#ff6b9d','#43e97b','#f7971e','#4fc3f7',      
    '#ff8a65','#ba68c8','#4db6ac','#e8c96b','#f06292',                                                                                                                                                      
  ];                                                                                                                                                                                                        
                                              
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
    document.getElementById('btn-export').addEventListener('click', exportCSV);                                                                                                                             
                                                                                                                                                                                                            
    ['ms-person','ms-client'].forEach(id => {                                                                                                                                                               
      document.getElementById(id).querySelector('.ms-toggle').addEventListener('click', e => {
        e.stopPropagation();                                                                                                                                                                                
        const panel = document.getElementById(id).querySelector('.ms-panel');
        const isOpen = !panel.classList.contains('hidden');                                                                                                                                                 
        document.querySelectorAll('.ms-panel').forEach(p => p.classList.add('hidden'));                                                                                                                     
        if (!isOpen) panel.classList.remove('hidden');
      });                                                                                                                                                                                                   
    });                                                                                                                                                                                                     
   
    document.addEventListener('click', () => {                                                                                                                                                              
      document.querySelectorAll('.ms-panel').forEach(p => p.classList.add('hidden'));
    });                                                                                                                                                                                                     
                                                            
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
    buildCheckboxes('ms-person', people, 'Everyone');
    buildCheckboxes('ms-client', clients, 'All Clients');                                                                                                                                                   
  }                                                         
                                                                                                                                                                                                            
  function buildCheckboxes(containerId, values, allLabel) {                                                                                                                                                 
    const panel = document.getElementById(containerId).querySelector('.ms-panel');                                                                                                                          
    const current = getSelected(containerId);                                                                                                                                                               
                                                            
    panel.innerHTML = `                       
      <label class="ms-option ms-option--all">                                                                                                                                                              
        <input type="checkbox" class="ms-all-cb"> Select All
      </label>                                                                                                                                                                                              
    ` + values.map(v => `                                   
      <label class="ms-option">                                                                                                                                                                             
        <input type="checkbox" value="${v}"${current.includes(v) ? ' checked' : ''}> ${v}                                                                                                                   
      </label>                                
    `).join('');                                                                                                                                                                                            
                                                            
    const allCb   = panel.querySelector('.ms-all-cb');                                                                                                                                                      
    const itemCbs = [...panel.querySelectorAll('input[value]')];
                                                                                                                                                                                                            
    allCb.addEventListener('change', () => {                                                                                                                                                                
      itemCbs.forEach(cb => cb.checked = allCb.checked);
      updateToggleLabel(containerId, allLabel);                                                                                                                                                             
      render();                                             
    });                                                                                                                                                                                                     
                                                            
    itemCbs.forEach(cb => {                                                                                                                                                                                 
      cb.addEventListener('change', () => {
        allCb.checked       = itemCbs.every(c => c.checked);                                                                                                                                                
        allCb.indeterminate = !allCb.checked && itemCbs.some(c => c.checked);                                                                                                                               
        updateToggleLabel(containerId, allLabel);
        render();                                                                                                                                                                                           
      });                                                   
    });                                                                                                                                                                                                     
  }
                                                                                                                                                                                                            
  function updateToggleLabel(containerId, allLabel) {       
    const checked = getSelected(containerId);
    const toggle = document.getElementById(containerId).querySelector('.ms-toggle');
    if (checked.length === 0) toggle.textContent = allLabel;                                                                                                                                                
    else if (checked.length === 1) toggle.textContent = checked[0];
    else toggle.textContent = `${checked.length} selected`;                                                                                                                                                 
  }                                                         
                                                                                                                                                                                                            
  function getSelected(containerId) {
    return [...document.getElementById(containerId).querySelectorAll('input[value]:checked')].map(cb => cb.value);                                                                                          
  }                                                         
                                                                                                                                                                                                            
  function filterEntries() {                                
    const fromVal = document.getElementById('fil-from').value;                                                                                                                                              
    const toVal   = document.getElementById('fil-to').value;
    const people  = getSelected('ms-person');                                                                                                                                                               
    const clients = getSelected('ms-client');               

    return allEntries.filter(e => {                                                                                                                                                                         
      if (fromVal && e.entry_date < fromVal) return false;
      if (toVal   && e.entry_date > toVal)   return false;                                                                                                                                                  
      if (people.length  && !people.includes(e.employee_name)) return false;
      if (clients.length && !clients.includes(e.client)) return false;
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
    const byClient  = groupSum(entries, 'client');                                                                                                                                                          
    const topClient = Object.entries(byClient).sort((a, b) => b[1] - a[1])[0];
                                              
    document.getElementById('stat-total').textContent      = fmtHours(totalMins);                                                                                                                           
    document.getElementById('stat-top-client').textContent = topClient ? topClient[0] : '—';
  }                                                                                                                                                                                                         
                                                                                                                                                                                                            
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
                                                                                                                                                                                                            
  function stackedByPerson(entries, groupKey, sortByTotal) {
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
                                                                                                                                                                                                            
    const people = [...new Set(entries.map(e => e.employee_name))].sort();
    const datasets = people.map((person, i) => ({
      label: person,
      data: groups.map(g =>                                                                                                                                                                                 
        +(entries.filter(e => e[groupKey] === g && e.employee_name === person)
                 .reduce((s, e) => s + e.duration_minutes, 0) / 60).toFixed(2)                                                                                                                              
      ),                                                    
      backgroundColor: PERSON_PALETTE[i % PERSON_PALETTE.length],                                                                                                                                           
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
      options: stackedBarOptions(),                                                                                                                                                                         
    });
                                                                                                                                                                                                            
    // Hours by Person — stacked by task                    
    const { groups: personGroups, datasets: personDatasets } = stackedByTask(entries, 'employee_name', true);                                                                                               
    charts.person = new Chart(document.getElementById('chart-person'), {
      type: 'bar',                                                                                                                                                                                          
      data: { labels: personGroups, datasets: personDatasets },
      options: stackedBarOptions(),                                                                                                                                                                         
    });                                                     
                                                                                                                                                                                                            
    // Hours by Task Type — stacked by person
    const { groups: taskGroups, datasets: taskDatasets } = stackedByPerson(entries, 'task_type', true);                                                                                                     
    charts.task = new Chart(document.getElementById('chart-task'), {
      type: 'bar',                        
      data: { labels: taskGroups, datasets: taskDatasets },
      options: stackedBarOptions(),                                                                                                                                                                         
    });                                       
                                                                                                                                                                                                            
    // Daily Hours — stacked by person                      
    const { groups: dayGroups, datasets: dayDatasets } = stackedByPerson(entries, 'entry_date', false);                                                                                                     
    charts.daily = new Chart(document.getElementById('chart-daily'), {
      type: 'bar',                                                                                                                                                                                          
      data: { labels: dayGroups.map(formatDate), datasets: dayDatasets },
      options: stackedBarOptions(),
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
                                                                                                                                                                                                            
  function stackedBarOptions() {                                                                                                                                                                            
    return {
      responsive: true,                                                                                                                                                                                     
      plugins: {                                            
        legend: {                         
          position: 'bottom',
          labels: { color: '#aaa', font: { size: 11 }, padding: 10, boxWidth: 12 },                                                                                                                         
        },                                    
        tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y}h` } },                                                                                                                
      },                                                    
      scales: {                                                                                                                                                                                             
        x: { stacked: true, ticks: { color: '#666', font: { size: 11 } }, grid: { color: '#1a1a1a' } },
        y: { stacked: true, ticks: { color: '#666', font: { size: 11 } }, grid: { color: '#1a1a1a' } },                                                                                                     
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
    return `${(mins / 60).toFixed(1)}h`;                    
  }                                           
                                          
  function formatDate(dateStr) {
    const [y, m, d] = dateStr.split('-');                                                                                                                                                                   
    return `${m}/${d}/${y.slice(2)}`;         
  }                                                                                                                                                                                                         
                                                            
  document.addEventListener('DOMContentLoaded', init);
