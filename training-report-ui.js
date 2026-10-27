/* Feuerwehr St. Pölten-Stadt – Ausbildungs-Tätigkeitsberichte / FDISK-Auszug V1.9.0 */
'use strict';
let GA_TRAINING_FILTER='';
let GA_PDF_CHECK_RESULT='',GA_PDF_CHECK_KIND='';
function gaReportByTerm(termId){return (STATE.ausbildungsberichte||[]).find(r=>r.TerminID===termId);}
function gaReportVehicles(report){
 try{const a=JSON.parse(report?.FahrzeugeJSON||'[]');return Array.isArray(a)?a:[];}
 catch(e){return [];}
}
function gaTrainingMin(begin,end){
 const mins=Math.round((new Date(end).getTime()-new Date(begin).getTime())/60000);
 return Number.isFinite(mins)&&mins>0?mins:0;
}
function gaTrainingHours(mins){return (Math.round(Number(mins||0)/6)/10).toLocaleString('de-AT',{minimumFractionDigits:1,maximumFractionDigits:1});}
function gaTrainingKm(km){return Number(km||0).toLocaleString('de-AT',{minimumFractionDigits:1,maximumFractionDigits:2});}
function gaVehicleSuggestions(){
 const labels=new Set();
 (STATE.ausbildungsberichte||[]).forEach(r=>gaReportVehicles(r).forEach(v=>{if(v.Fahrzeug)labels.add(String(v.Fahrzeug));}));
 return [...labels].sort((a,b)=>a.localeCompare(b,'de'));
}
function gaVehicleRow(vehicle={},index=0){
 return '<div class="ga-vehicle-row" data-vehicle-row>'+
  '<label>Fahrzeug / Funkrufname<input data-vehicle-name list="gaVehicleNames" maxlength="80" placeholder="z. B. HLF 2 St. Pölten" value="'+h(vehicle.Fahrzeug||'')+'"></label>'+
  '<label>Gefahrene Kilometer<input type="text" inputmode="decimal" data-vehicle-km maxlength="10" placeholder="z. B. 12,5" value="'+h(vehicle.Kilometer===undefined?'':String(vehicle.Kilometer).replace('.',','))+'"></label>'+
  '<button type="button" class="secondary ga-vehicle-remove" data-training-vehicle-remove aria-label="Fahrzeug entfernen" title="Fahrzeug entfernen">×</button>'+
  '</div>';
}
function gaTrainingStatsForTerm(term){
 const r=gaReportByTerm(term.ID);
 const attendance=(STATE.teilnahmen||[]).filter(a=>a.TerminID===term.ID&&a.Anwesend==='JA');
 const vehicle=gaReportVehicles(r);
 const minutes=Number(r?.DauerMinuten||0),trainers=String(r?.AusbilderIDs||'').split(',').filter(Boolean);
 const km=vehicle.reduce((sum,v)=>sum+Number(v.Kilometer||0),0);
 return {recorded:!!r,minutes,attendees:attendance.length,teachers:trainers.length,
  participantMinutes:minutes*attendance.length,trainerMinutes:minutes*trainers.length,km,vehicle};
}
function gaAttendancePage(){
 if(!['Administrator','Ausbilder','Organisator Erweiterte Ausbildung'].includes(role()))return '<section class="panel">Keine Berechtigung.</section>';
 const ready=Array.isArray(STATE.ausbildungsberichte);
 if(!ready)return '<section class="panel"><h2>Ausbildungsdokumentation</h2><p class="ga-alert">Die aktuelle Code.gs muss zuerst in Google Apps Script bereitgestellt werden, damit die Ist-Zeiten und Berichte sicher gespeichert werden.</p></section>';
 const term=TERM&&by(STATE.termine,TERM);
 if(!term){
  const list=(STATE.termine||[]).slice().sort((a,b)=>String(b.Beginn).localeCompare(String(a.Beginn)));
  return '<div class="ga-page-heading"><div><h2>Ausbildungstermine öffnen</h2>'+
   '<p>Unterlagen direkt öffnen, Ausbildung durchführen und erst danach den Tätigkeitsbericht abschließen.</p></div>'+
   '<button class="secondary" type="button" data-view="trainingReports">PDF & Statistik</button></div>'+
   '<section class="panel"><div class="ga-training-list">'+list.map(t=>{
    const c=by(STATE.kurse,t.KursID),r=gaReportByTerm(t.ID);
    return '<div class="ga-training-list-item"><div><strong>'+h(c?.Titel||'Ausbildung')+'</strong>'+
      '<p class="small muted">'+dt(t.Beginn)+' · '+h(t.Ort||'Ort offen')+'</p></div>'+
      '<span class="tag '+(r?'ok':'blue')+'">'+(r?'Dokumentiert':'Noch offen')+'</span>'+
      '<button type="button" class="primary" data-training-open="'+h(t.ID)+'">Kurs öffnen</button></div>';
   }).join('')+'</div></section>';
 }
 const c=by(STATE.kurse,term.KursID),report=gaReportByTerm(term.ID);
 const members=(STATE.mitglieder||[]).filter(m=>m.TurnusID===term.TurnusID&&m.Aktiv==='JA');
 const previous=(STATE.teilnahmen||[]).filter(a=>a.TerminID===term.ID);
 // Auch eingeladene, noch nicht aktivierte Ausbilder dürfen als tatsächlich mitwirkend erfasst werden.
 const trainers=(STATE.benutzer||[]).filter(u=>['Administrator','Ausbilder','Organisator Erweiterte Ausbildung'].includes(u.Rolle));
 const chosen=report?String(report.AusbilderIDs||'').split(','):
  previous[0]?.AusbilderIDs?String(previous[0].AusbilderIDs).split(','):[STATE.user.ID];
 if(!trainers.some(u=>u.ID===STATE.user.ID))trainers.unshift({ID:STATE.user.ID,Name:STATE.user.Name,Rolle:STATE.user.Rolle,Aktiv:'JA'});
 const list=members.map(m=>'<label class="ga-attendance-choice"><input type="checkbox" name="member" value="'+h(m.ID)+'" '+
   (previous.find(x=>x.MitgliedID===m.ID)?.Anwesend==='JA'?'checked':'')+'><span>'+h(name(m))+'</span></label>').join('');
 const teacherOptions=trainers.map(u=>'<label class="ga-attendance-choice"><input type="checkbox" name="trainer" value="'+h(u.ID)+'" '+
  (chosen.includes(u.ID)?'checked':'')+'><span>'+h(u.Name||'Ausbilder')+(u.ID===STATE.user.ID?' · Du':'')+
  (u.Aktiv!=='JA'?' · Einladung offen':'')+'</span></label>').join('');
 const links=safeLinks(c?.Links),vehicles=gaReportVehicles(report);
 const startTime=String(report?.BeginnIst||term.Beginn||'').slice(0,16),
  endTime=String(report?.EndeIst||term.Ende||'').slice(0,16);
 const used=vehicles.length>0;
 const linkBlock=links?'<div class="ga-course-links"><h3>Präsentation und Unterlagen</h3><ul class="url-list">'+links+'</ul></div>':
  '<p class="small muted">Für dieses Modul wurde noch keine Präsentation hinterlegt.</p>';
 const completed=!!report;
 return '<div class="ga-page-heading"><div><p class="ga-eyebrow">AUSBILDUNGSMODUL</p><h2>'+h(c?.Titel||'Ausbildung')+'</h2>'+
 '<p>'+dt(term.Beginn)+' · '+h(term.Ort||'–')+'</p></div><button class="secondary" type="button" data-close-term="1">← Alle Termine</button></div>'+
 '<div class="ga-course-top"><span class="tag '+(completed?'ok':'blue')+'">'+(completed?'Abschluss dokumentiert':'Ausbildung offen')+'</span>'+
 '<span>1. Unterlagen öffnen & ausbilden</span><span>2. Ausbildung abschließen</span></div>'+
 '<details class="ga-course-section" open><summary><span class="ga-course-section-icon">1</span><span><strong>Kursinhalt & Präsentation</strong><small>Direkt beim Öffnen verfügbar</small></span></summary>'+
 '<div class="ga-course-section-body">'+linkBlock+
 '<details class="ga-subsection" open><summary>Ausbildungsinhalt anzeigen</summary><div class="ga-course-text">'+h(c?.Inhalt||'Kein Inhalt hinterlegt')+'</div></details>'+
 (c?.Lernziele?'<details class="ga-subsection"><summary>Lernziele</summary><div class="ga-course-text">'+h(c.Lernziele)+'</div></details>':'')+
 '<div class="ga-training-continue"><button class="primary" type="button" data-training-finish-open>Ausbildung abschließen & Anwesenheit erfassen</button></div></div></details>'+
 '<details class="ga-course-section" id="gaFinishTraining" '+(completed?'':'')+'><summary><span class="ga-course-section-icon">2</span>'+
 '<span><strong>Ausbildung abschließen</strong><small>Anwesende, Ist-Zeiten, Ausbilder und Fahrzeuge</small></span></summary>'+
 '<div class="ga-course-section-body"><form data-form="attendance" class="ga-training-form">'+
 '<section class="ga-training-fieldset"><h3>Beginn und Ende</h3><div class="ga-training-time-grid">'+
 '<label>Beginn<div class="ga-training-time-entry"><input type="datetime-local" name="BeginnIst" required value="'+h(startTime)+'"><button type="button" class="secondary" data-training-now="begin">Jetzt</button></div></label>'+
 '<label>Ende<div class="ga-training-time-entry"><input type="datetime-local" name="EndeIst" required value="'+h(endTime)+'"><button type="button" class="secondary" data-training-now="end">Jetzt</button></div></label></div>'+
 '<p class="ga-training-duration" data-training-duration>'+ (gaTrainingMin(startTime,endTime)?'Ausbildungsdauer: '+gaTrainingHours(gaTrainingMin(startTime,endTime))+' Stunden':'Bitte Beginn und Ende ergänzen')+'</p></section>'+
 '<details class="ga-subsection" open><summary>Teilnehmer markieren <span class="ga-inline-count" data-training-present-count>'+previous.filter(a=>a.Anwesend==='JA').length+'</span></summary>'+
 '<div class="ga-attendance-list">'+list+'</div></details>'+
 '<details class="ga-subsection"><summary>Weitere Ausbilder markieren</summary><p class="small muted">Bereits eingeladene Ausbilder können auch vor dem ersten Login dokumentiert werden.</p>'+
 '<div class="ga-attendance-list ga-trainers-list">'+teacherOptions+'</div></details>'+
 '<section class="ga-training-fieldset"><h3>Wurden Fahrzeuge verwendet?</h3>'+
 '<div class="ga-training-vehicle-choice"><label><input type="radio" name="FahrzeugeVerwendet" value="NEIN" '+(!used?'checked':'')+'> Nein</label>'+
 '<label><input type="radio" name="FahrzeugeVerwendet" value="JA" '+(used?'checked':'')+'> Ja, Fahrzeuge erfassen</label></div>'+
 '<div id="gaTrainingVehicleArea" '+(!used?'hidden':'')+'><datalist id="gaVehicleNames">'+gaVehicleSuggestions().map(x=>'<option value="'+h(x)+'"></option>').join('')+'</datalist>'+
 '<div id="gaTrainingVehicleRows">'+(vehicles.length?vehicles:[{}]).map(gaVehicleRow).join('')+'</div>'+
 '<button class="secondary" type="button" data-training-vehicle-add>+ Weiteres Fahrzeug</button>'+
 '<p class="ga-training-count">Fahrzeugkilometer: <strong data-training-km-total>'+gaTrainingKm(vehicles.reduce((n,v)=>n+Number(v.Kilometer||0),0))+'</strong> km</p></div></section>'+
 '<details class="ga-subsection"><summary>Bemerkungen (optional)</summary><textarea name="Notiz" rows="3" maxlength="1500">'+h(report?.Notiz||'')+'</textarea></details>'+
 '<div class="ga-training-summary" data-training-summary></div><div class="ga-training-finish-buttons">'+
 '<button class="primary" type="submit">Ausbildung abschließen & speichern</button>'+
 '<button class="secondary" type="button" data-training-pdf-term="'+h(term.ID)+'">PDF-Tätigkeitsbericht</button></div>'+
 '<p class="small muted">'+(completed?'Du kannst den bestehenden Bericht hier korrigieren.':'PDF ist auch vor der Erfassung als deutlich vorläufig markierter Bericht verfügbar.')+
 '</p></form></div></details>';
}

function gaTrainingModuleRows(){
 const terms=(STATE.termine||[]),reports=(STATE.ausbildungsberichte||[]);
 const ids=new Set(terms.map(t=>t.KursID));
 return [...ids].map(id=>{
  const c=by(STATE.kurse,id),list=terms.filter(t=>t.KursID===id),saved=list.filter(t=>reports.some(r=>r.TerminID===t.ID));
  const aggregate=saved.reduce((out,t)=>{
   const x=gaTrainingStatsForTerm(t);
   out.duration+=x.minutes;out.pMinutes+=x.participantMinutes;
   out.tMinutes+=x.trainerMinutes;out.km+=x.km;
   x.vehicle.forEach(v=>out.vehicles.add(v.Fahrzeug));return out;
  },{duration:0,pMinutes:0,tMinutes:0,km:0,vehicles:new Set()});
  return {id,title:c?.Titel||'Unbekanntes Modul',list,saved,missing:list.length-saved.length,...aggregate};
 }).sort((a,b)=>a.title.localeCompare(b.title,'de'));
}
function gaTrainingReportsPage(){
 if(!['Administrator','Ausbilder','Organisator Erweiterte Ausbildung'].includes(role()))return '';
 const backendReady=Array.isArray(STATE.ausbildungsberichte);
 if(!backendReady)return '<section class="panel"><h2>Tätigkeitsberichte</h2>'+
 '<div class="ga-alert">Das Apps-Script-Backend muss auf den aktuellen Stand gebracht werden. Im Google Sheet unter „Grundausbildung → 7 · Tätigkeitsberichte einrichten“ zuerst die neue Tabelle erstellen.</div></section>';

 const backendVersion=String(STATE?.version||'nicht gemeldet');
 const oldBackend=!/^1\.(?:1[1-9]|[2-9]\d)\.|^1\.10\.(?:[2-9]|\d{2,})$/.test(backendVersion);
 const checkPanel='<section class="ga-pdf-check-panel"><div class="ga-pdf-check-text"><strong>PDF-Vorlage prüfen</strong>'+
 '<p>Verbundener Server: Version <b>'+h(backendVersion)+'</b> · Benötigt: <b>1.10.2</b> (FDISK-Design 2).</p>'+
 (oldBackend?'<p class="ga-pdf-check-warning">Die verbundene Backend-Version ist noch zu alt oder unbekannt. GitHub und Apps Script können unterschiedliche Versionen haben.</p>':'')+
 '</div><button type="button" class="secondary" data-pdf-check="1">Aktive PDF-Vorlage testen</button>'+
 '<p id="gaPdfCheckResult" class="ga-pdf-check-result '+h(GA_PDF_CHECK_KIND)+'" aria-live="polite">'+h(GA_PDF_CHECK_RESULT)+'</p></section>';

 const modules=gaTrainingModuleRows(),filter=GA_TRAINING_FILTER;
 const current=filter?modules.filter(x=>x.id===filter):modules;
 const total=current.reduce((o,x)=>(o.terms+=x.saved.length,o.hours+=x.duration,o.participant+=x.pMinutes,o.trainers+=x.tMinutes,o.km+=x.km,o),{terms:0,hours:0,participant:0,trainers:0,km:0});
 const cards=current.map(x=>'<article class="ga-training-report-card">'+
 '<div class="row between"><div><h3>'+h(x.title)+'</h3><p class="small muted">'+x.saved.length+' dokumentierte von '+x.list.length+' Terminen'+
 (x.missing?' · '+x.missing+' ohne Tätigkeitsbericht':'')+'</p></div>'+
 '<button class="primary" type="button" data-training-pdf-course="'+h(x.id)+'">'+(x.saved.length?'Modul-PDF':'Vorläufiges PDF')+'</button></div>'+
 '<div class="ga-training-report-metrics"><span>'+gaTrainingHours(x.duration)+' h Ausbildungsdauer</span>'+
 '<span>'+gaTrainingHours(x.pMinutes)+' Teilnehmerstunden</span>'+
 '<span>'+gaTrainingHours(x.tMinutes)+' Ausbilderstunden</span>'+
 '<span>'+gaTrainingKm(x.km)+' km</span><span>'+x.vehicles.size+' Fahrzeuge</span></div>'+
 '<details><summary>Einzeltermine ansehen</summary><div class="ga-training-list">'+
 x.list.slice().sort((a,b)=>String(b.Beginn).localeCompare(String(a.Beginn))).map(t=>{
 const r=gaReportByTerm(t.ID),metrics=gaTrainingStatsForTerm(t);
 return '<div class="ga-training-list-item"><div><strong>'+h(dt(t.Beginn))+'</strong>'+
 '<p class="small muted">'+h(t.Ort||'–')+' · '+(r?gaTrainingHours(metrics.minutes)+' h · '+gaTrainingKm(metrics.km)+' km':'Bericht fehlt')+'</p></div>'+
 '<button class="secondary" type="button" data-training-open="'+h(t.ID)+'">Bearbeiten</button>'+
 '<button class="secondary" type="button" data-training-pdf-term="'+h(t.ID)+'">'+(r?'PDF':'Vorläufiges PDF')+'</button></div>';
 }).join('')+'</div></details></article>').join('');
 return '<div class="ga-page-heading"><div><h2>Tätigkeitsberichte für FDISK</h2>'+
 '<p>Jederzeit abrufbare Summen nach Modul, Ausbildungsstunden, Fahrzeugen, Teilnehmern und Ausbildern.</p></div>'+
 '<div class="ga-action-grid"><button type="button" class="secondary" data-view="attendance">Ausbildungstermin öffnen</button><button type="button" class="primary" data-view="freeActivities">Freie Tätigkeit erfassen</button></div></div>'+
 checkPanel+
 '<div class="ga-admin-toolbar"><div><label>Modul auswählen</label><select data-training-filter>'+
 '<option value="">Alle Ausbildungsmodule</option>'+modules.map(x=>'<option value="'+h(x.id)+'" '+(x.id===filter?'selected':'')+'>'+h(x.title)+'</option>').join('')+'</select></div></div>'+
 '<div class="ga-kpis">'+
 '<div class="ga-kpi"><strong>'+total.terms+'</strong><span>Dokumentierte Termine</span></div>'+
 '<div class="ga-kpi"><strong>'+gaTrainingHours(total.hours)+' h</strong><span>Ausbildungsdauer</span></div>'+
 '<div class="ga-kpi"><strong>'+gaTrainingHours(total.participant)+' h</strong><span>Teilnehmerstunden</span></div>'+
 '<div class="ga-kpi"><strong>'+gaTrainingKm(total.km)+' km</strong><span>Fahrzeugkilometer</span></div></div>'+
 '<section class="panel"><h2>Ausbildungsberichte nach Modul</h2>'+
 (cards||'<p class="muted">Noch keine Termine vorhanden.</p>')+
 '<p class="small muted">Die PDF-Dateien enthalten alle erfassten Teilnehmer und Ausbilder mit ihren anrechenbaren Stunden sowie die Fahrzeugkilometer. Der Auszug muss anschließend manuell in FDISK übertragen werden.</p></section>';
}
function gaTrainingUpdateSummary(){
 const form=document.querySelector('form[data-form="attendance"],form[data-form="freeActivity"]');
 if(!form)return;
 const b=form.querySelector('[name="BeginnIst"]')?.value,e=form.querySelector('[name="EndeIst"]')?.value;
 const mins=gaTrainingMin(b,e);
 const count=form.querySelectorAll('input[name="member"]:checked,input[name="participant"]:checked').length;
 const teachers=form.querySelectorAll('input[name="trainer"]:checked').length;
 const veh=form.querySelector('input[name="FahrzeugeVerwendet"]:checked')?.value==='JA'?[...form.querySelectorAll('[data-vehicle-row]')]:[];
 const km=veh.reduce((sum,x)=>sum+Number(String(x.querySelector('[data-vehicle-km]')?.value||'0').replace(',','.'))||0,0);
 const duration=form.querySelector('[data-training-duration]'),label=form.querySelector('[data-training-present-count]'),kmLabel=form.querySelector('[data-training-km-total]'),summary=form.querySelector('[data-training-summary]');
 if(duration)duration.textContent=mins?'Ausbildungsdauer: '+gaTrainingHours(mins)+' Stunden':'Bitte gültigen Beginn und Ende eingeben';
 if(label)label.textContent=String(count);
 if(kmLabel)kmLabel.textContent=gaTrainingKm(km);
 if(summary)summary.innerHTML='<strong>Voraussichtliche FDISK-Werte</strong><div class="ga-training-summary-grid">'+
 '<span>'+gaTrainingHours(mins)+' h Dauer</span><span>'+count+' Teilnehmer / '+gaTrainingHours(mins*count)+' Teilnehmerstunden</span>'+
 '<span>'+teachers+' Ausbilder / '+gaTrainingHours(mins*teachers)+' Ausbilderstunden</span><span>'+gaTrainingKm(km)+' km</span></div>';
}
function gaTrainingVehiclesFromForm(form){
 const rows=[...form.querySelectorAll('[data-vehicle-row]')];
 return rows.map((row,i)=>{
  const Fahrzeug=String(row.querySelector('[data-vehicle-name]')?.value||'').trim();
  const Kilometer=String(row.querySelector('[data-vehicle-km]')?.value||'').trim();
  if(!Fahrzeug&&!Kilometer)return null;
  if(!Fahrzeug||!Kilometer)throw new Error('Fahrzeug '+(i+1)+': Bitte Fahrzeugname und Kilometer vollständig angeben.');
  if(!/^\d+(?:[,.]\d{1,2})?$/.test(Kilometer))throw new Error('Fahrzeug '+(i+1)+': Kilometer als Zahl angeben (z. B. 12,5).');
  return {Fahrzeug,Kilometer};
 }).filter(Boolean);
}
async function gaSaveTrainingAttendance(form,fd){
 if(!Array.isArray(STATE.ausbildungsberichte))throw new Error('Der Tätigkeitsbericht ist am Apps-Script-Backend noch nicht aktiviert. Bitte zuerst die Code.gs aktualisieren.');
 const term=by(STATE.termine,TERM);
 if(!term)throw new Error('Bitte einen Ausbildungstermin auswählen.');
 const members=(STATE.mitglieder||[]).filter(m=>m.TurnusID===term.TurnusID&&m.Aktiv==='JA');
 const present=new Set(fd.getAll('member')),teachers=fd.getAll('trainer');
 const begin=String(fd.get('BeginnIst')||''),end=String(fd.get('EndeIst')||'');
 if(!gaTrainingMin(begin,end))throw new Error('Bitte einen gültigen tatsächlichen Beginn und ein späteres Ende angeben.');
 if(!teachers.length)throw new Error('Bitte mindestens einen Ausbilder anhaken.');
 if(STATE.user.Rolle==='Ausbilder'&&!teachers.includes(STATE.user.ID))throw new Error('Du musst dich selbst als durchführenden Ausbilder anhaken.');
 const data={TerminID:term.ID,BeginnIst:begin,EndeIst:end,Notiz:fd.get('Notiz')||'',
  Fahrzeuge:fd.get('FahrzeugeVerwendet')==='JA'?gaTrainingVehiclesFromForm(form):[],AusbilderIDs:teachers,
  Anwesend:members.map(m=>({MitgliedID:m.ID,Anwesend:present.has(m.ID)}))};
 if(fd.get('FahrzeugeVerwendet')==='JA'&&!data.Fahrzeuge.length)throw new Error('Bitte mindestens ein Fahrzeug erfassen.');
 if(!confirm('Ausbildung mit '+present.size+' anwesenden Teilnehmern, '+teachers.length+
  ' Ausbilder(n) und '+data.Fahrzeuge.length+' Fahrzeug(en) verbindlich dokumentieren?'))return;
 const result=await api('saveAttendance',data);
 tip(result?.message||'Tätigkeitsbericht und Anwesenheiten gespeichert.');
 await reload();
}
async function gaDownloadTrainingPdf(args,button){
 const previous=button?.textContent;
 if(button){button.disabled=true;button.textContent='PDF wird erstellt …';}
 try{
  const free=!!args.FreieTaetigkeitID;
 const result=await api(free?'exportFreeActivityPdf':'exportTrainingPdf',free?{ID:args.FreieTaetigkeitID}:args);
  if(!result?.base64)throw new Error('PDF konnte nicht erzeugt werden.');
  const designOk=result.pdfDesign==='FDISK-DESIGN-2';
  GA_PDF_CHECK_KIND=designOk?'ok':'warn';
  GA_PDF_CHECK_RESULT=designOk?
   'Neues PDF-Design aktiv · Backend '+String(result.backendVersion||'1.10.2'):
   'PDF stammt offenbar noch aus einer alten Apps-Script-Bereitstellung. Bitte die aktive Bereitstellungs-URL kontrollieren.';
  const display=document.getElementById('gaPdfCheckResult');
  if(display){display.textContent=GA_PDF_CHECK_RESULT;display.className='ga-pdf-check-result '+GA_PDF_CHECK_KIND;}
  const raw=atob(result.base64),u=new Uint8Array(raw.length);
  for(let i=0;i<raw.length;i++)u[i]=raw.charCodeAt(i);
  const blob=new Blob([u],{type:'application/pdf'}),url=URL.createObjectURL(blob),link=document.createElement('a');
  link.href=url;link.download=result.dateiname||'FDISK_Taetigkeitsbericht.pdf';
  document.body.appendChild(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),60000);
  tip(designOk?'Neues Design 2 als PDF heruntergeladen.':'PDF heruntergeladen, aber der Server meldet noch nicht das neue Design! Bitte Backend prüfen.',!designOk);
 }catch(e){tip(e.message||'PDF-Export nicht möglich.',true);}
 finally{if(button){button.disabled=false;button.textContent=previous;}}
}

async function gaCheckPdfTemplate(button){
 const original=button?.textContent;
 if(button){button.disabled=true;button.textContent='Server wird geprüft …';}
 try{
  const info=await api('pdfTemplateInfo');
  if(info?.template!=='FDISK-DESIGN-2'){
   GA_PDF_CHECK_KIND='warn';
   GA_PDF_CHECK_RESULT='Der Server antwortet, meldet aber nicht die aktuelle PDF-Vorlage. Bitte die Apps-Script-Bereitstellung aktualisieren.';
  }else{
   GA_PDF_CHECK_KIND='ok';
   GA_PDF_CHECK_RESULT='Bestätigt: PDF-Design 2 aktiv · Backend '+String(info.backendVersion||'unbekannt')+'. Erneut einen Kursbericht herunterladen.';
  }
 }catch(error){
  GA_PDF_CHECK_KIND='warn';
  GA_PDF_CHECK_RESULT='Die verbundene Apps-Script-Bereitstellung kennt die neue PDF-Prüfung noch nicht ('+
   String(error?.message||'keine Antwort')+'). Bitte die richtige /exec-Bereitstellung auf Version 1.10.2 setzen.';
 }
 const display=document.getElementById('gaPdfCheckResult');
 if(display){display.textContent=GA_PDF_CHECK_RESULT;display.className='ga-pdf-check-result '+GA_PDF_CHECK_KIND;}
 if(button){button.disabled=false;button.textContent=original;}
}

document.getElementById('app')?.addEventListener('click',event=>{
 const x=event.target.closest('[data-pdf-check],[data-training-finish-open],[data-training-now],[data-training-vehicle-add],[data-training-vehicle-remove],[data-training-pdf-term],[data-training-pdf-course],[data-training-open]');
 if(!x)return;
 if(x.dataset.pdfCheck!==undefined){gaCheckPdfTemplate(x);return;}
 if(x.dataset.trainingFinishOpen!==undefined){const box=document.getElementById('gaFinishTraining');if(box){box.open=true;box.scrollIntoView({block:'start',behavior:'smooth'});}return;}
 if(x.dataset.trainingNow){
  const now=new Date(),p=n=>String(n).padStart(2,'0');
  const value=now.getFullYear()+'-'+p(now.getMonth()+1)+'-'+p(now.getDate())+'T'+p(now.getHours())+':'+p(now.getMinutes());
  const input=x.closest('.ga-training-time-entry')?.querySelector('input');
  if(input){input.value=value;gaTrainingUpdateSummary();}
  return;
 }
 if(x.dataset.trainingVehicleAdd!==undefined){
  const holder=document.getElementById('gaTrainingVehicleRows');
  if(!holder)return;
  if(holder.querySelectorAll('[data-vehicle-row]').length>=12)return tip('Maximal 12 Fahrzeuge pro Termin möglich.',true);
  holder.insertAdjacentHTML('beforeend',gaVehicleRow());
  gaTrainingUpdateSummary();return;
 }
 if(x.dataset.trainingVehicleRemove!==undefined){
  x.closest('[data-vehicle-row]')?.remove();gaTrainingUpdateSummary();return;
 }
 if(x.dataset.trainingOpen){VIEW='attendance';TERM=x.dataset.trainingOpen;render();return;}
 if(x.dataset.trainingPdfTerm){gaDownloadTrainingPdf({TerminID:x.dataset.trainingPdfTerm},x);return;}
 if(x.dataset.trainingPdfCourse){gaDownloadTrainingPdf({KursID:x.dataset.trainingPdfCourse},x);}
});
document.getElementById('app')?.addEventListener('input',event=>{
 if(event.target.closest('form[data-form="attendance"],form[data-form="freeActivity"]'))gaTrainingUpdateSummary();
});
document.getElementById('app')?.addEventListener('change',event=>{
 if(event.target.matches('[data-training-filter]')){GA_TRAINING_FILTER=event.target.value;render();return;}
 if(event.target.matches('input[name="FahrzeugeVerwendet"]')){
  const area=event.target.closest('form')?.querySelector('#gaTrainingVehicleArea');if(area)area.hidden=event.target.value!=='JA';gaTrainingUpdateSummary();return;
 }
 if(event.target.closest('form[data-form="attendance"],form[data-form="freeActivity"]'))gaTrainingUpdateSummary();
});
