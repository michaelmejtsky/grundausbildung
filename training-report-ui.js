/* Feuerwehr St. Pölten-Stadt – Ausbildungs-Tätigkeitsberichte / FDISK-Auszug V1.9.0 */
'use strict';
let GA_TRAINING_FILTER='';
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
 if(!['Administrator','Ausbilder'].includes(role()))return '<section class="panel"><p>Keine Berechtigung.</p></section>';
 if(!Array.isArray(STATE.ausbildungsberichte))return '<section class="panel"><h2>Ausbildungsdokumentation aktualisieren</h2><div class="ga-alert">Die neue Tätigkeitsbericht-Funktion ist am Server noch nicht aktiv. Bitte die aktuelle Code.gs in deinem bestehenden Google Apps Script als neue Version veröffentlichen und danach die App aktualisieren. Anwesenheiten und bisherige Daten bleiben erhalten.</div></section>';
 const term=TERM&&by(STATE.termine,TERM);
 if(!term)return '<div class="ga-page-heading"><div><h2>Ausbildung durchführen</h2>'+
  '<p>Termin auswählen, anwesende Teilnehmer, tatsächliche Zeiten, Ausbilder und Fahrzeuge dokumentieren.</p></div>'+
  '<button type="button" class="secondary" data-view="trainingReports">Tätigkeitsberichte</button></div>'+
  '<section class="panel"><div class="ga-training-list">'+(STATE.termine||[]).slice().sort((a,b)=>String(b.Beginn).localeCompare(String(a.Beginn))).map(t=>{
   const c=by(STATE.kurse,t.KursID),r=gaReportByTerm(t.ID);
   return '<div class="ga-training-list-item"><div><strong>'+h(c?.Titel||'Kurs')+'</strong>'+
    '<p class="small muted">'+dt(t.Beginn)+' · '+h(t.Ort||'Ort nicht eingetragen')+'</p></div>'+
    '<span class="tag '+(r?'ok':'blue')+'">'+(r?'Tätigkeitsbericht vorhanden':t.Status==='Durchgeführt'?'Bericht nachtragen':'Noch nicht abgeschlossen')+'</span>'+
    '<button type="button" class="primary" data-term="'+h(t.ID)+'">Öffnen</button></div>';
  }).join('')+'</div></section>';
 const course=by(STATE.kurse,term.KursID),report=gaReportByTerm(term.ID);
 const members=(STATE.mitglieder||[]).filter(m=>m.TurnusID===term.TurnusID&&m.Aktiv==='JA');
 const prev=(STATE.teilnahmen||[]).filter(a=>a.TerminID===term.ID);
 const availableTrainers=(STATE.benutzer||[]).filter(x=>['Administrator','Ausbilder'].includes(x.Rolle)&&x.Aktiv==='JA');
 const selectedTeachers=report?String(report.AusbilderIDs||'').split(','):
  (prev[0]?.AusbilderIDs?String(prev[0].AusbilderIDs).split(','):[STATE.user.ID]);
 const vehicles=gaReportVehicles(report);
 const existingKm=vehicles.reduce((sum,v)=>sum+Number(v.Kilometer||0),0);
 const memberRows=members.map(m=>{
  const seen=prev.find(x=>x.MitgliedID===m.ID);
  return '<label class="ga-attendance-choice"><input type="checkbox" name="member" value="'+h(m.ID)+'" '+(seen?.Anwesend==='JA'?'checked':'')+'>'+
  '<span>'+h(name(m))+'</span></label>';
 }).join('');
 const trainerRows=availableTrainers.map(u=>'<label class="ga-attendance-choice"><input type="checkbox" name="trainer" value="'+h(u.ID)+'" '+
 (selectedTeachers.includes(u.ID)?'checked':'')+'><span>'+h(u.Name)+(u.ID===STATE.user.ID?' · Du':'')+'</span></label>').join('');
 const start=String(report?.BeginnIst||term.Beginn||'').slice(0,16),end=String(report?.EndeIst||term.Ende||'').slice(0,16);
 const count=prev.filter(x=>x.Anwesend==='JA').length;
 return '<div class="ga-page-heading"><div><p class="ga-eyebrow">FDISK-TÄTIGKEITSERFASSUNG</p>'+
 '<h2>'+h(course?.Titel||'Ausbildungstermin')+'</h2><p>'+dt(term.Beginn)+' · '+h(term.Ort||'Ort offen')+'</p></div>'+
 '<button type="button" class="secondary" data-close-term="1">← Terminliste</button></div>'+
 (report?'<div class="ga-training-status"><span class="tag ok">Tätigkeitsbericht gespeichert</span>'+
 '<span>Letzte Erfassung: '+h(report.AktualisiertAm||'')+'</span>'+
 '<button type="button" class="secondary" data-training-pdf-term="'+h(term.ID)+'">PDF dieses Termins</button></div>':
 '<div class="ga-training-status"><span class="tag warn">Noch kein vollständiger Tätigkeitsbericht</span>'+
 '<span>Mit dem Abschluss speicherst du die Ist-Zeiten, Teilnehmer, Ausbilder und Fahrzeuge.</span></div>')+
 '<form data-form="attendance" class="ga-training-form"><section class="panel">'+
 '<h3><span class="ga-training-step">1</span> Tatsächliche Ausbildungszeit</h3>'+
 '<p class="muted small">Geplante Zeiten werden vorgeschlagen. Bitte den tatsächlichen Beginn und das tatsächliche Ende kontrollieren bzw. korrigieren.</p>'+
 '<div class="ga-training-time-grid"><label>Beginn (Datum und Uhrzeit)<div class="ga-training-time-entry"><input type="datetime-local" data-training-begin name="BeginnIst" required value="'+h(start)+'">'+
 '<button type="button" class="secondary" data-training-now="begin">Jetzt</button></div></label>'+
 '<label>Ende (Datum und Uhrzeit)<div class="ga-training-time-entry"><input type="datetime-local" data-training-end name="EndeIst" required value="'+h(end)+'">'+
 '<button type="button" class="secondary" data-training-now="end">Jetzt</button></div></label></div>'+
 '<div class="ga-training-duration" data-training-duration>'+
 (gaTrainingMin(start,end)?'Ausbildungsdauer: '+gaTrainingHours(gaTrainingMin(start,end))+' Stunden':'Bitte gültigen Beginn und Ende eingeben')+'</div>'+
 '</section><section class="panel"><h3><span class="ga-training-step">2</span> Teilnehmer</h3>'+
 '<p class="small muted">Nur tatsächlich anwesende Mitglieder markieren. Für die FDISK-Summen zählt jedes markierte Mitglied mit der vollen angegebenen Ausbildungsdauer.</p>'+
 '<div class="ga-attendance-list">'+memberRows+'</div>'+
 '<div class="ga-training-count">Anwesende Teilnehmer: <strong data-training-present-count>'+count+'</strong> / '+members.length+'</div></section>'+
 '<section class="panel"><h3><span class="ga-training-step">3</span> Mitwirkende Ausbilder</h3>'+
 '<p class="muted small">Alle Ausbilder anhaken, die bei diesem Modul mitgewirkt haben. Der bestätigende Ausbilder muss selbst angeführt sein.</p>'+
 '<div class="ga-attendance-list ga-trainers-list">'+trainerRows+'</div></section>'+
 '<section class="panel"><h3><span class="ga-training-step">4</span> Fahrzeuge und Kilometer</h3>'+
 '<p class="small muted">Alle verwendeten Fahrzeuge einzeln erfassen. Bei stationär eingesetzten Fahrzeugen sind 0 km zulässig.</p>'+
 '<datalist id="gaVehicleNames">'+gaVehicleSuggestions().map(v=>'<option value="'+h(v)+'"></option>').join('')+'</datalist>'+
 '<div id="gaTrainingVehicleRows">'+(vehicles.length?vehicles:[{}]).map(gaVehicleRow).join('')+'</div>'+
 '<button type="button" class="secondary" data-training-vehicle-add>+ Weiteres Fahrzeug</button>'+
 '<p class="ga-training-count">Gesamte Fahrzeugkilometer: <strong data-training-km-total>'+gaTrainingKm(existingKm)+'</strong> km</p></section>'+
 '<section class="panel"><h3><span class="ga-training-step">5</span> Tätigkeitsbericht</h3>'+
 '<label>Besonderheiten / Bemerkungen (optional)<textarea name="Notiz" rows="3" maxlength="1500" placeholder="z. B. praktische Tätigkeiten, besondere Vorkommnisse, Ausbildungsinhalte">'+h(report?.Notiz||'')+'</textarea></label>'+
 '<div class="ga-training-summary" data-training-summary></div>'+
 '<p class="small muted">Alle Änderungen werden mit Benutzer und Zeitpunkt protokolliert. Ein erneutes Speichern korrigiert den bestehenden Termin, erzeugt keinen doppelten Tätigkeitsbericht.</p>'+
 '<div class="btnline"><button type="submit" class="primary">Ausbildung und Tätigkeitsbericht speichern</button>'+
 '<button type="button" class="secondary" data-view="trainingReports">Gesamtauswertung</button></div></section></form>';
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
 if(!['Administrator','Ausbilder'].includes(role()))return '';
 const backendReady=Array.isArray(STATE.ausbildungsberichte);
 if(!backendReady)return '<section class="panel"><h2>Tätigkeitsberichte</h2>'+
 '<div class="ga-alert">Das Apps-Script-Backend muss auf den aktuellen Stand gebracht werden. Im Google Sheet unter „Grundausbildung → 7 · Tätigkeitsberichte einrichten“ zuerst die neue Tabelle erstellen.</div></section>';
 const modules=gaTrainingModuleRows(),filter=GA_TRAINING_FILTER;
 const current=filter?modules.filter(x=>x.id===filter):modules;
 const total=current.reduce((o,x)=>(o.terms+=x.saved.length,o.hours+=x.duration,o.participant+=x.pMinutes,o.trainers+=x.tMinutes,o.km+=x.km,o),{terms:0,hours:0,participant:0,trainers:0,km:0});
 const cards=current.map(x=>'<article class="ga-training-report-card">'+
 '<div class="row between"><div><h3>'+h(x.title)+'</h3><p class="small muted">'+x.saved.length+' dokumentierte von '+x.list.length+' Terminen'+
 (x.missing?' · '+x.missing+' ohne Tätigkeitsbericht':'')+'</p></div>'+
 '<button class="primary" type="button" data-training-pdf-course="'+h(x.id)+'" '+(!x.saved.length?'disabled':'')+'>Modul-PDF</button></div>'+
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
 '<button class="secondary" type="button" data-training-pdf-term="'+h(t.ID)+'" '+(!r?'disabled':'')+'>PDF</button></div>';
 }).join('')+'</div></details></article>').join('');
 return '<div class="ga-page-heading"><div><h2>Tätigkeitsberichte für FDISK</h2>'+
 '<p>Jederzeit abrufbare Summen nach Modul, Ausbildungsstunden, Fahrzeugen, Teilnehmern und Ausbildern.</p></div>'+
 '<button type="button" class="secondary" data-view="attendance">Ausbildung erfassen</button></div>'+
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
 const form=document.querySelector('form[data-form="attendance"]');
 if(!form)return;
 const b=form.querySelector('[name="BeginnIst"]')?.value,e=form.querySelector('[name="EndeIst"]')?.value;
 const mins=gaTrainingMin(b,e);
 const count=form.querySelectorAll('input[name="member"]:checked').length;
 const teachers=form.querySelectorAll('input[name="trainer"]:checked').length;
 const veh=[...form.querySelectorAll('[data-vehicle-row]')];
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
  Fahrzeuge:gaTrainingVehiclesFromForm(form),AusbilderIDs:teachers,
  Anwesend:members.map(m=>({MitgliedID:m.ID,Anwesend:present.has(m.ID)}))};
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
  const result=await api('exportTrainingPdf',args);
  if(!result?.base64)throw new Error('PDF konnte nicht erzeugt werden.');
  const raw=atob(result.base64),u=new Uint8Array(raw.length);
  for(let i=0;i<raw.length;i++)u[i]=raw.charCodeAt(i);
  const blob=new Blob([u],{type:'application/pdf'}),url=URL.createObjectURL(blob),link=document.createElement('a');
  link.href=url;link.download=result.dateiname||'FDISK_Taetigkeitsbericht.pdf';
  document.body.appendChild(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),60000);
  tip('Tätigkeitsbericht als PDF heruntergeladen.');
 }catch(e){tip(e.message||'PDF-Export nicht möglich.',true);}
 finally{if(button){button.disabled=false;button.textContent=previous;}}
}
document.getElementById('app')?.addEventListener('click',event=>{
 const x=event.target.closest('[data-training-now],[data-training-vehicle-add],[data-training-vehicle-remove],[data-training-pdf-term],[data-training-pdf-course],[data-training-open]');
 if(!x)return;
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
 if(event.target.closest('form[data-form="attendance"]'))gaTrainingUpdateSummary();
});
document.getElementById('app')?.addEventListener('change',event=>{
 if(event.target.matches('[data-training-filter]')){GA_TRAINING_FILTER=event.target.value;render();return;}
 if(event.target.closest('form[data-form="attendance"]'))gaTrainingUpdateSummary();
});
