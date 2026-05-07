// Agency 8 — Time Tracker popup.js                                                                                                                                                                       
   
  const DEFAULT_CLIENTS = [                                                                                                                                                                                 
    'BORNTOSTANDOUT','Brodo','Emma Relief','EvolveTogether',
    'Feals','HigherDOSE','Ilia','Internal','Kind Patches','Lenox and Sixteenth',                                                                                                                            
    'MadeGood','Magic Molecule','Magna','Maev','Merit','Momofuku',
    'Nette','Roz','Snif','Squigs','SYS','Timebeam','TodayTix','Tushy',                                                                                                                                      
  ];                                                        
                                                                                                                                                                                                            
  const DEFAULT_TASKS = [                                   
    'Meetings (Ext)','Meetings (Int)','Sourcing/List Building','Strategy/Planning',
    'Paid','Client Comms','Creator Comms (DM)','Creator Comms (Email)',                                                                                                                                     
    'Reporting','Shopify','Spreadsheet Management','Content Brief',
    'Outreach Copy','ShopMy','TikTok Shop','LTK','Onboarding','Offboarding','Newsletters',                                                                                                                  
  ];                                                                                                                                                                                                        
   
  let timerInterval = null;                                                                                                                                                                                 
  let settings = {};                                        
  let selectedDate = todayDate();

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
    setupDayTabs();                                                                                                                                                                                         
   
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
  
    const elapsed = Math.floor((Date.now() - startTime) / 1000);                                                                                                                                            
    display.textContent = formatSeconds(elapsed);           
  }
                                                                                                                                                                                                            
  async function handleTimer() {
    const s = await chrome.storage.local.get(['timerRunning','timerStart','timerClient','timerTask','timerNotes']);                                                                                         
                                                            
    if (s.timerRunning) {                                                                                                                                                                                   
      clearInterval(timerInterval);
      timerInterval = null;                                                                                                                                                                                 
                                                            
      const durationMinutes = Math.round((Date.now() - s.timerStart) / 60000);                                                                                                                              
      if (durationMinutes < 1) {
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
      await loadEntriesForDate(selectedDate);                                                                                                                                                               
                                                                                                                                                                                                            
    } else {
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
    if (!resp.ok) console.error('Supabase error:', await resp.text());
  }                                                                                                                                                                                                         
  
  function setupDayTabs() {                                                                                                                                                                                 
    const today = new Date();                               
    const days = [0, 1, 2].map(offset => {
      const d = new Date(today);                                                                                                                                                                            
      d.setDate(today.getDate() - offset);
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;                                                                                         
    });                                                     
                                                                                                                                                                                                            
    selectedDate = days[0];                                 
                                                                                                                                                                                                            
    const tabsEl = document.getElementById('day-tabs');     
    tabsEl.innerHTML = days.map((date, i) => {
      const label = i === 0 ? 'Today' : i === 1 ? 'Yesterday' : shortDate(date);                                                                                                                            
      return `<button class="day-tab${i === 0 ? ' active' : ''}" data-date="${date}">${label}</button>`;                                                                                                    
    }).join('');                                                                                                                                                                                            
                                                                                                                                                                                                            
    tabsEl.querySelectorAll('.day-tab').forEach(btn => {    
      btn.addEventListener('click', async () => {                                                                                                                                                           
        tabsEl.querySelectorAll('.day-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');                                                                                                                                                                        
        selectedDate = btn.dataset.date;
        await loadEntriesForDate(selectedDate);                                                                                                                                                             
      });                                                   
    });

    loadEntriesForDate(selectedDate);                                                                                                                                                                       
  }
                                                                                                                                                                                                            
  function shortDate(dateStr) {                             
    const [, m, d] = dateStr.split('-');
    return `${parseInt(m)}/${parseInt(d)}`;
  }                                                                                                                                                                                                         
  
  async function loadEntriesForDate(date) {                                                                                                                                                                 
    const url = `${settings.supabaseUrl}/rest/v1/time_entries`
      + `?entry_date=eq.${date}`                                                                                                                                                                            
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

    renderEntries(entries);
  }
                                                                                                                                                                                                            
  function renderEntries(entries) {
    const container = document.getElementById('today-entries');                                                                                                                                             
    const totalEl   = document.getElementById('today-total');
                                                                                                                                                                                                            
    if (!entries.length) {
      container.innerHTML = '<div class="no-entries">No entries</div>';                                                                                                                                     
      totalEl.textContent = '';                             
      return;                                                                                                                                                                                               
    }
                                                                                                                                                                                                            
    const totalMins = entries.reduce((sum, e) => sum + e.duration_minutes, 0);
    totalEl.textContent = formatMinutes(totalMins);
                                                                                                                                                                                                            
    container.innerHTML = entries.map(e => `
      <div class="entry-item" data-id="${e.id}">                                                                                                                                                            
        <div class="entry-left">                                                                                                                                                                            
          <span class="entry-client">${e.client}</span>
          <span class="entry-task">${e.task_type}</span>                                                                                                                                                    
          ${e.notes ? `<span class="entry-notes">${e.notes}</span>` : ''}
        </div>                                                                                                                                                                                              
        <div class="entry-right">
          <span class="entry-duration">${formatMinutes(e.duration_minutes)}</span>                                                                                                                          
          <button class="btn-edit" data-id="${e.id}">Edit</button>                                                                                                                                          
        </div>
      </div>                                                                                                                                                                                                
    `).join('');                                            
                                                                                                                                                                                                            
    container.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', () => {                                                                                                                                                                 
        const entry = entries.find(e => String(e.id) === btn.dataset.id);
        if (entry) startEditEntry(entry);                                                                                                                                                                   
      });
    });                                                                                                                                                                                                     
  }                                                         

  function startEditEntry(entry) {
    const entryEl = document.querySelector(`.entry-item[data-id="${entry.id}"]`);
    if (!entryEl) return;                                                                                                                                                                                   
   
    const clientOptions = settings.clients.map(c =>                                                                                                                                                         
      `<option value="${c}"${c === entry.client ? ' selected' : ''}>${c}</option>`
    ).join('');                                                                                                                                                                                             
    const taskOptions = settings.tasks.map(t =>             
      `<option value="${t}"${t === entry.task_type ? ' selected' : ''}>${t}</option>`
    ).join('');                                                                                                                                                                                             
   
    entryEl.innerHTML = `                                                                                                                                                                                   
      <div class="edit-form">                               
        <div class="field-row">
          <div class="field">                                                                                                                                                                               
            <label>Client</label>
            <select class="edit-client">${clientOptions}</select>                                                                                                                                           
          </div>                                                                                                                                                                                            
          <div class="field">
            <label>Task</label>                                                                                                                                                                             
            <select class="edit-task">${taskOptions}</select>
          </div>
        </div>
        <div class="field-row">
          <div class="field">                                                                                                                                                                               
            <label>Duration (min)</label>
            <input type="number" class="edit-duration" value="${entry.duration_minutes}" min="1">                                                                                                           
          </div>                                            
          <div class="field">
            <label>Notes</label>                                                                                                                                                                            
            <input type="text" class="edit-notes" value="${entry.notes || ''}">
          </div>                                                                                                                                                                                            
        </div>                                              
        <div class="edit-actions">
          <button class="btn-save-edit">Save</button>                                                                                                                                                       
          <button class="btn-delete-edit">Delete</button>
          <button class="btn-cancel-edit">Cancel</button>                                                                                                                                                   
        </div>                                                                                                                                                                                              
      </div>
    `;                                                                                                                                                                                                      
                                                            
    entryEl.querySelector('.btn-save-edit').addEventListener('click', () => saveEditEntry(entry.id, entryEl));                                                                                              
    entryEl.querySelector('.btn-delete-edit').addEventListener('click', () => deleteEntry(entry.id));
    entryEl.querySelector('.btn-cancel-edit').addEventListener('click', () => loadEntriesForDate(selectedDate));                                                                                            
  }                                                                                                                                                                                                         
   
  async function saveEditEntry(id, entryEl) {                                                                                                                                                               
    const client   = entryEl.querySelector('.edit-client').value;
    const taskType = entryEl.querySelector('.edit-task').value;                                                                                                                                             
    const duration = parseInt(entryEl.querySelector('.edit-duration').value);
    const notes    = entryEl.querySelector('.edit-notes').value.trim();                                                                                                                                     
                                                                                                                                                                                                            
    await fetch(`${settings.supabaseUrl}/rest/v1/time_entries?id=eq.${id}`, {
      method: 'PATCH',                                                                                                                                                                                      
      headers: {                                            
        'Content-Type':  'application/json',
        'apikey':        settings.supabaseKey,                                                                                                                                                              
        'Authorization': `Bearer ${settings.supabaseKey}`,
        'Prefer':        'return=minimal',                                                                                                                                                                  
      },                                                    
      body: JSON.stringify({ client, task_type: taskType, duration_minutes: duration, notes }),
    });                                                                                                                                                                                                     
   
    await loadEntriesForDate(selectedDate);                                                                                                                                                                 
  }                                                         

  async function deleteEntry(id) {
    await fetch(`${settings.supabaseUrl}/rest/v1/time_entries?id=eq.${id}`, {
      method: 'DELETE',                                                                                                                                                                                     
      headers: {
        'apikey':        settings.supabaseKey,                                                                                                                                                              
        'Authorization': `Bearer ${settings.supabaseKey}`,  
      },
    });

    await loadEntriesForDate(selectedDate);                                                                                                                                                                 
  }
                                                                                                                                                                                                            
  function formatSeconds(s) {                               
    const h   = Math.floor(s / 3600).toString().padStart(2, '0');
    const m   = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
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
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;                                                                                           
  }
                                                                                                                                                                                                            
  function show(view) {                                                                                                                                                                                     
    document.getElementById('view-setup')?.classList.toggle('hidden', view !== 'setup');
    document.getElementById('view-main')?.classList.toggle('hidden',  view !== 'main');                                                                                                                     
  }                                                         
                                                                                                                                                                                                            
  document.addEventListener('DOMContentLoaded', init);
