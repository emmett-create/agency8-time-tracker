// Agency 8 — Time Tracker background.js                                                                                                                                                                  
  // Sends a daily 5 PM ET reminder to log time entries.                                                                                                                                                    
                                                                                                                                                                                                            
  const ALARM_NAME = 'time-reminder';                                                                                                                                                                       
   
  chrome.runtime.onInstalled.addListener(scheduleReminder);                                                                                                                                                 
  chrome.runtime.onStartup.addListener(scheduleReminder);   

  chrome.alarms.onAlarm.addListener(alarm => {                                                                                                                                                              
    if (alarm.name !== ALARM_NAME) return;
    chrome.notifications.create({                                                                                                                                                                           
      type:    'basic',                                     
      iconUrl: 'icons/icon48.png',
      title:   'Agency 8 — Time Tracker',                                                                                                                                                                   
      message: "Don't forget to stop your timer and log any missing entries!",
    });                                                                                                                                                                                                     
    scheduleReminder();                                     
  });
                                                                                                                                                                                                            
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
