const STORE = 'schooltrack.data.v1';
const DEFAULTS = {events:[], notes:{}, settings:{theme:'dark',weekStart:1,schoolDays:[1,2,3,4,5],reminder:false,reminderTime:'15:30',timezone:Intl.DateTimeFormat().resolvedOptions().timeZone||'Europe/Amsterdam',schoolName:'School'}};
let state = load();
let tab = 'dashboard';
let calendarDate = new Date();
let toastTimer;

function load(){
  try { return {...structuredClone(DEFAULTS), ...JSON.parse(localStorage.getItem(STORE)||'{}'), settings:{...DEFAULTS.settings,...(JSON.parse(localStorage.getItem(STORE)||'{}').settings||{})}}; }
  catch { return structuredClone(DEFAULTS); }
}
function save(){ localStorage.setItem(STORE, JSON.stringify(state)); }
function pad(n){return String(n).padStart(2,'0')}
function isoDay(d=new Date()){return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`}
function timeOf(iso){return new Date(iso).toLocaleTimeString('nl-NL',{hour:'2-digit',minute:'2-digit'})}
function dateOf(iso){return new Date(iso).toLocaleDateString('nl-NL',{weekday:'short',day:'numeric',month:'short'})}
function fmtDuration(ms){let m=Math.max(0,Math.floor(ms/60000));return `${Math.floor(m/60)}u ${pad(m%60)}m`}
function dayEvents(day){return state.events.filter(e=>e.at.slice(0,10)===day).sort((a,b)=>a.at.localeCompare(b.at))}
function isIn(){const all=[...state.events].sort((a,b)=>a.at.localeCompare(b.at));return all.length>0&&all[all.length-1].type==='in'}
function currentOpen(){const all=[...state.events].sort((a,b)=>a.at.localeCompare(b.at));return isIn()?all[all.length-1]:null}
function todayTotal(day=isoDay()){
  const ev=dayEvents(day);let total=0,open=null;
  for(const e of ev){if(e.type==='in')open=e;else if(e.type==='out'&&open){total+=new Date(e.at)-new Date(open.at);open=null}}
  if(open)total+=Date.now()-new Date(open.at);
  return total;
}
function toast(msg){const el=document.getElementById('toast');el.textContent=msg;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2500)}
function esc(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function eventMarkup(e){
  return `<div class="event-row"><div class="event-icon">${e.type==='in'?'↓':'↑'}</div><div class="event-main"><strong>${e.type==='in'?'Ingeklokt':'Uitgeklokt'}</strong><small>${dateOf(e.at)} · ${e.note?esc(e.note):'Geen notitie'}</small></div><span class="pill ${e.source==='NFC'?'nfc':'manual'}">${e.source}</span><span class="event-time">${timeOf(e.at)}</span><button class="icon-btn" data-edit="${e.id}" aria-label="Registratie bewerken">···</button></div>`;
}
function metric(label,value,note=''){return `<div class="card"><div class="metric-label">${label}</div><div class="metric-value">${value}</div><div class="metric-note">${note}</div></div>`}
function dashboard(){
  const today=dayEvents(isoDay()), open=currentOpen(), first=today.find(e=>e.type==='in'), lastOut=[...today].reverse().find(e=>e.type==='out');
  const status=open?'INGECLOCKT':'UITGECLOCKT';
  return `<div class="eyebrow">${new Date().toLocaleDateString('nl-NL',{weekday:'long',day:'numeric',month:'long'})}</div><h1 class="page-title">Jouw schooldag</h1>
  <div class="grid">
    <section class="card status-card span-12">
      <div class="status-line"><i class="dot ${open?'in':''}"></i><span class="status-text">${status}</span><span class="pill">${open?'Sessie actief':'Geen actieve sessie'}</span></div>
      <div class="big-time" id="liveClock">${timeOf(new Date().toISOString())}</div>
      <div class="status-sub">${open?'Sinds '+timeOf(open.at)+' · '+fmtDuration(todayTotal()):'Laatste scan: '+(state.events.length?timeOf(state.events[state.events.length-1].at):'Nog geen scans')}</div>
      <div class="actions"><button class="primary" id="toggleClock">${open?'Uitklokken':'Inklokken'} <span>→</span></button><button class="secondary" id="quickNote">＋ Notitie</button></div>
    </section>
    <div class="span-4">${metric('Aanwezig vandaag',fmtDuration(todayTotal()),'Inclusief lopende sessie')}</div>
    <div class="span-4">${metric('Eerste aankomst',first?timeOf(first.at):'—','Vandaag')}</div>
    <div class="span-4">${metric('Laatste vertrek',lastOut?timeOf(lastOut.at):'—','Vandaag')}</div>
    <div class="span-6">${metric('Aantal registraties',today.length,'Scans en handmatige acties')}</div>
    <div class="span-6">${metric('Schooldagen gelogd',new Set(state.events.map(e=>e.at.slice(0,10))).size,'Totaal')}</div>
    <div class="span-12"><div class="section-head"><h2>Vandaag</h2><button class="text-btn" data-goto="logboek">Alles bekijken</button></div><div class="card list-card">${today.length?today.map(eventMarkup).join(''):'<div class="empty">Nog geen registraties vandaag.<br>Klok in met de knop hierboven of je NFC-shortcut.</div>'}</div></div>
  </div>`;
}
function logbook(){
  const days=[...new Set(state.events.map(e=>e.at.slice(0,10)))].sort().reverse();
  return `<div class="eyebrow">Alle registraties</div><h1 class="page-title">Logboek</h1>
  <div class="toolbar"><input class="btn" type="date" id="filterDate" value="${esc(window.logFilter||'')}"><button class="btn" id="clearFilter">Wis filter</button><button class="btn" id="addEvent">＋ Toevoegen</button></div>
  ${days.filter(d=>!window.logFilter||d===window.logFilter).map(d=>`<div class="section-head"><h2>${dateOf(d+'T12:00:00')}</h2><span class="muted">${fmtDuration(totalForDay(d))}</span></div><div class="card list-card">${dayEvents(d).map(eventMarkup).join('')}</div>`).join('')||'<div class="card empty">Geen registraties gevonden.</div>'}`;
}
function totalForDay(day){let t=0,o=null;for(const e of dayEvents(day)){if(e.type==='in')o=e;else if(e.type==='out'&&o){t+=new Date(e.at)-new Date(o.at);o=null}}return t}
function stats(){
  const dates=[...new Set(state.events.map(e=>e.at.slice(0,10)))].sort();
  const now=new Date(), weekStart=new Date(now);weekStart.setDate(now.getDate()-((now.getDay()+6)%7));
  const weekDates=Array.from({length:7},(_,i)=>{let d=new Date(weekStart);d.setDate(d.getDate()+i);return isoDay(d)});
  const month=isoDay().slice(0,7), monthDates=dates.filter(d=>d.startsWith(month));
  const totalWeek=weekDates.reduce((a,d)=>a+totalForDay(d),0),totalMonth=monthDates.reduce((a,d)=>a+totalForDay(d),0);
  const completeDays=dates.filter(d=>dayEvents(d).filter(e=>e.type==='in').length===dayEvents(d).filter(e=>e.type==='out').length);
  const arrivals=state.events.filter(e=>e.type==='in').map(e=>e.at).sort(),departures=state.events.filter(e=>e.type==='out').map(e=>e.at).sort();
  const daily=weekDates.map(d=>({d,h:totalForDay(d)/3600000}));
  const max=Math.max(1,...daily.map(x=>x.h));
  const avg=dates.length?dates.reduce((a,d)=>a+totalForDay(d),0)/dates.length:0;
  const longest=dates.reduce((m,d)=>Math.max(m,totalForDay(d)),0);
  return `<div class="eyebrow">Inzicht in je aanwezigheid</div><h1 class="page-title">Statistieken</h1><div class="grid">
  <div class="span-6">${metric('Deze week',fmtDuration(totalWeek),'Maandag t/m zondag')}</div><div class="span-6">${metric('Deze maand',fmtDuration(totalMonth),'Tot nu toe')}</div>
  <div class="span-6">${metric('Gemiddeld per dag',fmtDuration(avg),'Alle dagen met data')}</div><div class="span-6">${metric('Schooldagen',dates.length,'Dagen met registraties')}</div>
  <div class="span-6">${metric('Vroegste aankomst',arrivals.length?timeOf(arrivals[0]):'—','Ooit geregistreerd')}</div><div class="span-6">${metric('Laatste vertrek',departures.length?timeOf(departures[departures.length-1]):'—','Ooit geregistreerd')}</div>
  <div class="span-12"><div class="card"><div class="section-head"><h2>Aanwezigheid deze week</h2><span class="muted">Uren</span></div><div class="bar-chart">${daily.map(x=>`<div class="bar-col"><div class="bar" style="height:${Math.max(2,x.h/max*100)}%"></div><small>${new Date(x.d+'T12:00:00').toLocaleDateString('nl-NL',{weekday:'short'})}</small></div>`).join('')}</div></div></div>
  <div class="span-6">${metric('Langste schooldag',fmtDuration(longest),'Op basis van gekoppelde sessies')}</div><div class="span-6">${metric('Volledig gelogd',completeDays.length,'Dagen met evenveel in- en uitklokken')}</div>
  </div>`;
}
function calendar(){
  const y=calendarDate.getFullYear(),m=calendarDate.getMonth(),first=new Date(y,m,1),offset=(first.getDay()+6)%7,days=new Date(y,m+1,0).getDate();
  const cells=Array.from({length:offset},()=>'<div class="cal-day blank"></div>');
  for(let d=1;d<=days;d++){const date=`${y}-${pad(m+1)}-${pad(d)}`,ev=dayEvents(date),ins=ev.filter(e=>e.type==='in').length,outs=ev.filter(e=>e.type==='out').length;let cls=date===isoDay()?'today ':'';cls+=ev.length?(ins===outs&&ins>0?'complete':'partial'):'';cells.push(`<button class="cal-day ${cls}" data-day="${date}">${d}</button>`)}
  return `<div class="eyebrow">Jouw aanwezigheid</div><h1 class="page-title">Kalender</h1><div class="card"><div class="month-head"><button class="btn" id="prevMonth">‹</button><strong>${calendarDate.toLocaleDateString('nl-NL',{month:'long',year:'numeric'})}</strong><button class="btn" id="nextMonth">›</button></div><div class="calendar">${['ma','di','wo','do','vr','za','zo'].map(d=>`<div class="cal-head">${d}</div>`).join('')}${cells.join('')}</div><div class="toolbar" style="margin-top:15px"><span class="pill">● Groen: compleet</span><span class="pill">● Oranje: onvolledig</span><span class="pill">● Blauw: vandaag</span></div></div><div id="dayDetail"></div>`;
}
function settings(){
 return `<div class="eyebrow">Jouw voorkeuren</div><h1 class="page-title">Instellingen</h1>
 <div class="card">
 <div class="section-head"><h2>NFC & koppelen</h2></div>
 <p class="muted" style="font-size:12px;line-height:1.6">Gebruik de NFC-automatisering in Apple Opdrachten om deze app te openen met een scanparameter. De app registreert dit als NFC-bron; een webapp kan de fysieke scan zelf niet uitlezen.</p>
 <button class="secondary" id="shortcutGuide">Bekijk Shortcut-handleiding</button>
 <div class="setting-row"><div><strong>NFC-test</strong><small>Test de URL-trigger zonder je echte schoolpas</small></div><button class="btn" id="nfcTest">Test</button></div>
 <div class="setting-row"><div><strong>Schoolpas-trigger</strong><small>Teststatus: ${localStorage.getItem('schooltrack.nfcTest')?'laatst getest':'nog niet getest'}</small></div><button class="btn" id="resetNfc">Reset</button></div>
 </div>
 <div class="card" style="margin-top:14px"><div class="section-head"><h2>Schoolinstellingen</h2></div>
 <div class="field"><label>Naam van school</label><input id="schoolName" value="${esc(state.settings.schoolName)}"></div>
 <div class="field"><label>Week begint op</label><select id="weekStart"><option value="1" ${state.settings.weekStart===1?'selected':''}>Maandag</option><option value="0" ${state.settings.weekStart===0?'selected':''}>Zondag</option></select></div>
 <div class="field"><label>Tijdzone</label><input id="timezone" value="${esc(state.settings.timezone)}"></div>
 <div class="field"><label>Schooldagen</label><div class="toolbar">${['Ma','Di','Wo','Do','Vr','Za','Zo'].map((d,i)=>`<label class="pill"><input type="checkbox" data-schoolday="${i+1}" ${state.settings.schoolDays.includes(i+1)?'checked':''}> ${d}</label>`).join('')}</div></div>
 </div>
 <div class="card" style="margin-top:14px"><div class="section-head"><h2>Gegevens & back-up</h2></div>
 <div class="setting-row"><div><strong>CSV-export</strong><small>Openen in Excel of Numbers</small></div><button class="btn" id="exportCsv">Export</button></div>
 <div class="setting-row"><div><strong>Back-up maken</strong><small>Download alle registraties en instellingen</small></div><button class="btn" id="backup">Download</button></div>
 <div class="setting-row"><div><strong>Back-up herstellen</strong><small>Vervangt huidige gegevens na bevestiging</small></div><button class="btn" id="restore">Importeer</button></div>
 <div class="setting-row"><div><strong>PDF / maandoverzicht</strong><small>Gebruik afdrukken en kies Bewaar als PDF</small></div><button class="btn" id="printReport">Maak PDF</button></div>
 </div>
 <div class="card" style="margin-top:14px"><div class="section-head"><h2>Herinneringen</h2></div>
 <p class="muted" style="font-size:12px;line-height:1.6">Betrouwbare meldingen op vaste tijden zijn niet beschikbaar vanuit deze volledig lokale PWA wanneer de app gesloten is. Stel hiervoor gratis een herinnering in via de Herinneringen-app van iOS. Zo krijg je geen meldingen die stilzwijgend niet aankomen.</p>
 </div>
 <div class="card" style="margin-top:14px"><div class="setting-row"><div><strong>Alle gegevens wissen</strong><small>Dit kan niet ongedaan worden gemaakt</small></div><button class="btn danger" id="wipe">Wissen</button></div></div>`;
}
function render(){
 document.documentElement.classList.toggle('light',state.settings.theme==='light');
 const views={dashboard,logboek:logbook,statistieken:stats,kalender:calendar,instellingen:settings};
 document.getElementById('view').innerHTML=views[tab]();
 document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
 bind();
}
function toggleClock(source='handmatig'){
 const last=[...state.events].sort((a,b)=>a.at.localeCompare(b.at)).at(-1);
 if(last&&Date.now()-new Date(last.at).getTime()<8000){toast('Dubbele registratie geblokkeerd (8 sec.)');return}
 const type=isIn()?'out':'in';
 state.events.push({id:crypto.randomUUID(),at:new Date().toISOString(),type,source:source==='NFC'?'NFC':'Handmatig',note:''});
 state.events.sort((a,b)=>a.at.localeCompare(b.at));save();render();toast(type==='in'?'Je bent ingeklokt':'Je bent uitgeklokt');
}
function modal(title,body,buttons=''){
 document.getElementById('modalRoot').innerHTML=`<div class="modal-backdrop"><div class="modal"><h2>${title}</h2>${body}${buttons?`<div class="modal-actions">${buttons}</div>`:''}</div></div>`;
 document.querySelector('.modal-backdrop').addEventListener('click',e=>{if(e.target.classList.contains('modal-backdrop'))closeModal()});
}
function closeModal(){document.getElementById('modalRoot').innerHTML=''}
function editEvent(id){
 const e=state.events.find(x=>x.id===id);if(!e)return;
 modal('Registratie aanpassen',`<div class="field"><label>Type</label><select id="editType"><option value="in" ${e.type==='in'?'selected':''}>Ingeklokt</option><option value="out" ${e.type==='out'?'selected':''}>Uitgeklokt</option></select></div><div class="field"><label>Datum en tijd</label><input id="editAt" type="datetime-local" value="${e.at.slice(0,16)}"></div><div class="field"><label>Bron</label><select id="editSource"><option ${e.source==='NFC'?'selected':''}>NFC</option><option ${e.source!=='NFC'?'selected':''}>Handmatig</option></select></div><div class="field"><label>Notitie</label><textarea id="editNote">${esc(e.note||'')}</textarea></div>`,
 `<button class="btn danger" id="deleteEvent">Verwijderen</button><button class="btn" id="cancelModal">Annuleren</button><button class="primary" id="saveEvent">Opslaan</button>`);
 document.getElementById('cancelModal').onclick=closeModal;
 document.getElementById('saveEvent').onclick=()=>{const d=document.getElementById('editAt').value;if(!d)return toast('Kies een datum en tijd');e.type=document.getElementById('editType').value;e.at=new Date(d).toISOString();e.source=document.getElementById('editSource').value;e.note=document.getElementById('editNote').value;state.events.sort((a,b)=>a.at.localeCompare(b.at));save();closeModal();render();toast('Registratie bijgewerkt')};
 document.getElementById('deleteEvent').onclick=()=>{if(confirm('Deze registratie definitief verwijderen?')){state.events=state.events.filter(x=>x.id!==id);save();closeModal();render();toast('Registratie verwijderd')}};
}
function addEvent(){
 modal('Registratie toevoegen',`<div class="field"><label>Type</label><select id="newType"><option value="in">Ingeklokt</option><option value="out">Uitgeklokt</option></select></div><div class="field"><label>Datum en tijd</label><input id="newAt" type="datetime-local" value="${new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16)}"></div><div class="field"><label>Notitie</label><textarea id="newNote"></textarea></div>`,
 `<button class="btn" id="cancelModal">Annuleren</button><button class="primary" id="saveNew">Toevoegen</button>`);
 document.getElementById('cancelModal').onclick=closeModal;
 document.getElementById('saveNew').onclick=()=>{const d=document.getElementById('newAt').value;if(!d)return toast('Kies een datum en tijd');state.events.push({id:crypto.randomUUID(),type:document.getElementById('newType').value,at:new Date(d).toISOString(),source:'Handmatig',note:document.getElementById('newNote').value});state.events.sort((a,b)=>a.at.localeCompare(b.at));save();closeModal();render();toast('Registratie toegevoegd')};
}
function addNote(){
 const day=isoDay();modal('Notitie voor vandaag',`<div class="field"><label>Notitie</label><textarea id="dayNote">${esc(state.notes[day]||'')}</textarea></div>`,`<button class="btn" id="cancelModal">Annuleren</button><button class="primary" id="saveNote">Opslaan</button>`);
 document.getElementById('cancelModal').onclick=closeModal;document.getElementById('saveNote').onclick=()=>{state.notes[day]=document.getElementById('dayNote').value;save();closeModal();toast('Notitie opgeslagen')};
}
function exportCsv(){
 const rows=[['Datum','Tijdstip','Type','Bron','Notitie'],...state.events.map(e=>[e.at.slice(0,10),timeOf(e.at),e.type==='in'?'Ingeklokt':'Uitgeklokt',e.source,e.note||''])];
 const csv='\ufeff'+rows.map(r=>r.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(';')).join('\r\n');
 download(new Blob([csv],{type:'text/csv;charset=utf-8'}),`schooltrack-${isoDay()}.csv`);
}
function download(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
function backup(){download(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),`schooltrack-backup-${isoDay()}.json`)}
function restore(){
 const input=document.createElement('input');input.type='file';input.accept='application/json';input.onchange=async()=>{const f=input.files[0];if(!f)return;try{const x=JSON.parse(await f.text());if(!Array.isArray(x.events)||!x.settings)throw Error('invalid');if(!confirm('Huidige gegevens vervangen door deze back-up?'))return;state={...structuredClone(DEFAULTS),...x};save();render();toast('Back-up hersteld')}catch{toast('Dit back-upbestand is ongeldig')}};input.click();
}
function printReport(){
 const month=isoDay().slice(0,7),dates=[...new Set(state.events.filter(e=>e.at.startsWith(month)).map(e=>e.at.slice(0,10)))].sort();
 const rows=dates.map(d=>`<tr><td>${d}</td><td>${dayEvents(d).map(e=>`${timeOf(e.at)} ${e.type==='in'?'in':'uit'}`).join('<br>')}</td><td>${fmtDuration(totalForDay(d))}</td></tr>`).join('');
 const w=window.open('','_blank');if(!w){toast('Sta pop-ups toe om PDF te maken');return}
 w.document.write(`<html><head><title>SchoolTrack ${month}</title><style>body{font:14px Arial;padding:30px;color:#17243a}h1{font-size:24px}table{width:100%;border-collapse:collapse}td,th{padding:10px;border-bottom:1px solid #ddd;text-align:left}</style></head><body><h1>SchoolTrack · ${month}</h1><p>Maandoverzicht aanwezigheid</p><table><tr><th>Datum</th><th>Registraties</th><th>Aanwezig</th></tr>${rows}</table><p>Gegenereerd op ${new Date().toLocaleString('nl-NL')}</p><script>window.onload=()=>window.print()<\/script></body></html>`);w.document.close();
}
function showDay(day){
 const ev=dayEvents(day),root=document.getElementById('dayDetail');root.innerHTML=`<div class="section-head"><h2>${dateOf(day+'T12:00:00')}</h2><span class="muted">${fmtDuration(totalForDay(day))}</span></div><div class="card list-card">${ev.length?ev.map(eventMarkup).join(''):'<div class="empty">Geen registraties op deze dag.</div>'}<div class="field"><label>Dagnotitie</label><textarea id="calendarNote">${esc(state.notes[day]||'')}</textarea></div><button class="secondary" id="saveCalendarNote">Notitie opslaan</button></div>`;
 document.getElementById('saveCalendarNote').onclick=()=>{state.notes[day]=document.getElementById('calendarNote').value;save();toast('Notitie opgeslagen')};
 root.scrollIntoView({behavior:'smooth',block:'nearest'});
}
function shortcutGuide(){
 modal('Apple Shortcut instellen',`<ol class="muted" style="font-size:13px;line-height:1.8;padding-left:20px"><li>Open <b>Opdrachten</b> en kies Automatisering.</li><li>Maak een persoonlijke automatisering met trigger <b>NFC</b>.</li><li>Scan je schoolpas en geef de tag een naam.</li><li>Kies <b>Voer onmiddellijk uit</b> als die optie beschikbaar is.</li><li>Voeg de actie <b>Open URL</b> toe.</li><li>Gebruik de SchoolTrack-URL met achteraan <code>?scan=1</code>.</li><li>Bewaar de automatisering en test eerst met de testknop.</li></ol><p class="muted" style="font-size:11px">Vervang de bestaande actie die Somtoday opent, of voeg SchoolTrack toe als aparte NFC-automatisering. Een NFC-trigger via Opdrachten herkent de tag; de PWA ontvangt alleen het bezoek aan de URL.</p>`,`<button class="primary" id="closeGuide">Begrepen</button>`);
 document.getElementById('closeGuide').onclick=closeModal;
}
function bind(){
 document.getElementById('toggleClock')?.addEventListener('click',()=>toggleClock('handmatig'));
 document.getElementById('quickNote')?.addEventListener('click',addNote);
 document.getElementById('addEvent')?.addEventListener('click',addEvent);
 document.getElementById('filterDate')?.addEventListener('change',e=>{window.logFilter=e.target.value;render()});
 document.getElementById('clearFilter')?.addEventListener('click',()=>{window.logFilter='';render()});
 document.querySelectorAll('[data-edit]').forEach(b=>b.addEventListener('click',()=>editEvent(b.dataset.edit)));
 document.querySelectorAll('[data-goto]').forEach(b=>b.addEventListener('click',()=>{tab=b.dataset.goto;render()}));
 document.getElementById('prevMonth')?.addEventListener('click',()=>{calendarDate.setMonth(calendarDate.getMonth()-1);render()});
 document.getElementById('nextMonth')?.addEventListener('click',()=>{calendarDate.setMonth(calendarDate.getMonth()+1);render()});
 document.querySelectorAll('[data-day]').forEach(b=>b.addEventListener('click',()=>showDay(b.dataset.day)));
 document.getElementById('exportCsv')?.addEventListener('click',exportCsv);
 document.getElementById('backup')?.addEventListener('click',backup);
 document.getElementById('restore')?.addEventListener('click',restore);
 document.getElementById('printReport')?.addEventListener('click',printReport);
 document.getElementById('shortcutGuide')?.addEventListener('click',shortcutGuide);
 document.getElementById('nfcTest')?.addEventListener('click',()=>{localStorage.setItem('schooltrack.nfcTest',new Date().toISOString());toast('Test geslaagd: app kan worden geopend. Er is niets ingeklokt.') ; render()});
 document.getElementById('resetNfc')?.addEventListener('click',()=>{localStorage.removeItem('schooltrack.nfcTest');render();toast('Teststatus gewist')});
 document.getElementById('schoolName')?.addEventListener('change',e=>{state.settings.schoolName=e.target.value;save()});
 document.getElementById('weekStart')?.addEventListener('change',e=>{state.settings.weekStart=Number(e.target.value);save()});
 document.getElementById('timezone')?.addEventListener('change',e=>{state.settings.timezone=e.target.value;save()});
 document.querySelectorAll('[data-schoolday]').forEach(c=>c.addEventListener('change',()=>{state.settings.schoolDays=[...document.querySelectorAll('[data-schoolday]:checked')].map(x=>Number(x.dataset.schoolday));save()}));
 document.getElementById('wipe')?.addEventListener('click',()=>{if(confirm('Weet je zeker dat je alle SchoolTrack-gegevens wilt wissen?')){state=structuredClone(DEFAULTS);save();render();toast('Alle gegevens gewist')}});
}
function handleShortcut(){
 const params=new URLSearchParams(location.search);
 if(params.get('scan')==='1'){
   history.replaceState({},'',location.pathname+location.hash);
   setTimeout(()=>toggleClock('NFC'),150);
 }
}
if('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(()=>{});
handleShortcut();
document.getElementById('themeToggle')?.addEventListener('click',()=>{state.settings.theme=state.settings.theme==='dark'?'light':'dark';save();render()});
document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>{tab=b.dataset.tab;render()}));
render();
setInterval(()=>{const c=document.getElementById('liveClock');if(c)c.textContent=timeOf(new Date().toISOString());},1000);
