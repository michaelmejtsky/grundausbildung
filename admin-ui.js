/* Grundausbildung V1.7 – skalierbare Verwaltungsoberflächen */
'use strict';
let GA_CHECK_QUERY='',GA_CHECK_TURNUS='',GA_CHECK_STATUS='Offen',GA_CHECK_PERSON='',GA_CHECK_LIMIT=30;
let GA_QUAL_QUERY='',GA_QUAL_TURNUS='',GA_QUAL_PERSON='',GA_QUAL_LIMIT=30;
let GA_CHECK_ITEM_EDIT='';
let GA_MEM_QUERY='',GA_MEM_TURNUS='',GA_MEM_LIMIT=40,GA_MEM_CREATE=false;
const gaDeSearch=s=>String(s||'').toLocaleLowerCase('de-AT').trim();
const gaMatches=(value,query)=>gaDeSearch(value).includes(gaDeSearch(query));
const gaTurnusSelect=(value,attr,empty='Alle Turnusse')=>
 '<select '+attr+'><option value="">'+empty+'</option>'+
 (STATE.turnusse||[]).map(t=>'<option value="'+h(t.ID)+'" '+(value===t.ID?'selected':'')+'>'+h(t.Bezeichnung)+'</option>').join('')+'</select>';
const gaNotice=(text)=>'<p class="ga-dim">'+h(text)+'</p>';
function gaMenuHtml(tabs){
 const admin=role()==='Administrator',trainer=role()==='Ausbilder',organizer=role()==='Organisator Erweiterte Ausbildung';
 const groups=admin?[
  ['Start',['overview','terms','notifications']],
  ['Durchführung & FDISK',['attendance','trainingReports','freeActivities']],
  ['Ausbildung',['courses','projects','quizzes','turnus','qualifications','abschnitt','questionnaires','reviews']],
  ['Mitglieder & Aufgaben',['members','checks','users','attendance']],
  ['Organisation',['rights','reports','messages','adminMails','pushadmin']]
 ]:organizer?[
  ['Start',['advOverview','notifications']],
  ['Erweiterte Ausbildung',['advReady','advMembers','advAccess','advInvite','advChecks','courses','projects','quizzes','terms','turnus','advQual']],
  ['Durchführung & FDISK',['attendance','trainingReports','freeActivities']],
  ['Auswertung & Kommunikation',['questionnaires','reviews','messages','reports']]
 ]:trainer?[
  ['Start',['trainerHome','notifications']],
  ['Ausbildung',['courses','projects','quizzes','terms']],
  ['Durchführung & FDISK',['attendance','trainingReports','freeActivities']],
  ['Auswertung & Nachrichten',['reports','reviews','questionnaires','notifications']]
 ]:[['Dein Bereich',tabs.map(t=>t[0])]];
 const visible=new Set(tabs.map(t=>t[0]));
 const seen=new Set(),out=[];
 const badge=(id)=>id==='notifications'?(STATE.benachrichtigungen||[]).filter(n=>!n.GelesenAm).length:0;
 const item=t=>{seen.add(t[0]);return '<button type="button" data-view="'+t[0]+'" class="'+(VIEW===t[0]?'active':'')+'" aria-current="'+(VIEW===t[0]?'page':'false')+'">'+h(t[1])+(badge(t[0])?' <span class="pillcount">'+badge(t[0])+'</span>':'')+'</button>';};
 for(const [heading,ids] of groups){
  const entries=ids.filter(id=>visible.has(id)&&!seen.has(id)).map(id=>tabs.find(t=>t[0]===id));
  if(entries.length)out.push('<div class="ga-nav-group"><div class="ga-nav-heading">'+heading+'</div>'+entries.map(item).join('')+'</div>');
 }
 const rest=tabs.filter(t=>!seen.has(t[0]));
 if(rest.length)out.push('<div class="ga-nav-group"><div class="ga-nav-heading">Weitere Funktionen</div>'+rest.map(item).join('')+'</div>');
 return out.join('');
}
const gaMetric=(n,label,help)=>'<div class="ga-kpi"><strong>'+h(n)+'</strong><span>'+h(label)+'</span><small>'+h(help||'')+'</small></div>';
// Gemeinsame, rein darstellende Bausteine für die beiden Leitungs-Startseiten.
const gaHomeStat=(n,label,help)=>'<div class="ga-trainer-stat"><strong>'+h(n)+'</strong><span>'+h(label)+'</span><small>'+h(help)+'</small></div>';
function gaHomeShortcuts(items){
 return items.map(([view,icon,label,help])=>'<button type="button" class="ga-trainer-shortcut" data-view="'+h(view)+'">'+
  '<span class="ga-trainer-shortcut-icon" aria-hidden="true">'+h(icon)+'</span><span><strong>'+h(label)+'</strong><small>'+h(help)+'</small></span>'+
  '<span class="ga-trainer-arrow" aria-hidden="true">›</span></button>').join('');
}
function gaHomeUpcoming(now){
 return (STATE.termine||[]).filter(t=>gaTrainingUpcoming(t,now)).slice()
  .sort((a,b)=>gaTrainingTimestamp(a.Beginn)-gaTrainingTimestamp(b.Beginn));
}
function gaHomeAppointments(upcoming){
 return upcoming.slice(0,4).map(t=>{
  const course=by(STATE.kurse||[],t.KursID),turnus=by(STATE.turnusse||[],t.TurnusID);
  return '<article class="ga-trainer-appointment"><div class="ga-trainer-calendar" aria-hidden="true">📅</div><div class="ga-trainer-appointment-main">'+
   '<p class="ga-trainer-when">'+h(gaTrainerTime(t.Beginn))+'</p><h3>'+h(course?.Titel||'Ausbildung')+'</h3>'+
   '<p class="ga-trainer-detail">'+h([turnus?.Bezeichnung,t.Ort||'Ort folgt'].filter(Boolean).join(' · '))+'</p></div>'+
   '<button type="button" class="smallbtn" data-training-open="'+h(t.ID)+'">Kurs öffnen</button></article>';
 }).join('')||'<p class="ga-trainer-empty">Derzeit sind keine kommenden Ausbildungstermine eingetragen.</p>';
}
function gaHomeNoticeList(unread){
 return unread.slice(0,3).map(n=>'<div class="ga-trainer-notice"><span class="ga-trainer-notice-dot" aria-hidden="true"></span><div><strong>'+h(n.Titel||'Mitteilung')+
  '</strong><small>'+h(gaTrainerTime(n.ErstelltAm))+'</small></div></div>').join('')||'<p class="ga-trainer-empty">Du hast keine ungelesenen Benachrichtigungen.</p>';
}
function gaHomeTask(view,count,label,detail){
 return '<button type="button" class="ga-home-task" data-view="'+h(view)+'"><span class="ga-home-task-count '+(Number(count)>0?'has-items':'')+'">'+h(count)+'</span>'+
  '<span><strong>'+h(label)+'</strong><small>'+h(detail)+'</small></span><span aria-hidden="true">›</span></button>';
}
function overview(now=Date.now()){
 const members=(STATE.mitglieder||[]).filter(m=>m.Aktiv==='JA'),ids=new Set(members.map(m=>m.ID));
 const qs=(STATE.qualifikationen||[]).filter(q=>ids.has(q.MitgliedID));
 const checks=(STATE.checks||[]).filter(c=>ids.has(c.MitgliedID)&&c.Status==='Offen');
 const openMembers=new Set(checks.map(c=>c.MitgliedID));
 const pending=(STATE.kursProjekte||[]).filter(p=>p.Status==='Zur Prüfung');
 // Wie in der Nachweisansicht ist nur die jeweils letzte Einreichung prüfbar.
 const latestProofs=new Map();
 (STATE.ersteHilfeNachweise||[]).filter(p=>ids.has(p.MitgliedID)).forEach(p=>latestProofs.set(p.MitgliedID,p));
 const proofs=[...latestProofs.values()].filter(p=>p.Status==='Eingereicht');
 const reports=(STATE.meldungen||[]).filter(m=>['Offen','In Bearbeitung'].includes(m.Status));
 const upcoming=gaHomeUpcoming(now),unread=(STATE.benachrichtigungen||[]).filter(n=>!n.GelesenAm);
 const good=qs.filter(q=>q.GABAbgeschlossen).length,qbad=qs.filter(q=>!q.GABAbgeschlossen).length;
 const attention=qs.filter(q=>!q.GABAbgeschlossen||q.ErsteHilfeStatus!=='Bestätigt');
 const first=String(STATE.user?.Name||'').trim().split(/\s+/)[0]||'Ausbildungsleitung';
 const shortcuts=[
  ['members','👥','Teilnehmer verwalten','Mitglieder und Turnuszuordnung'],
  ['checks','☑️','Checklisten','Offene Punkte bearbeiten'],
  ['qualifications','🎓','GAB & Qualifikationen','Ausbildungsstände und Nachweise'],
  ['projects','📝','Kursprojekte','Module bearbeiten und freigeben'],
  ['terms','📅','Termine planen','Ausbildungen anlegen und verwalten'],
  ['attendance','🚒','Ausbildung durchführen','Kurse öffnen und Anwesenheit erfassen'],
  ['quizzes','✅','Quizverwaltung','Wissenstests und Ergebnisse'],
  ['messages','✉️','Nachrichten','Mitglieder und Team informieren']
 ];
 const more=[['courses','📚','Kurskatalog','Inhalte und Unterlagen'],
  ['trainingReports','📊','Tätigkeitsberichte','Berichte und FDISK-Auszüge'],
  ['users','🔐','Zugänge & Rollen','Konten verwalten'],['rights','🛠️','Ausbilderrechte','Berechtigungen vergeben'],
  ['reports','💡','Mängel & Ideen','Rückmeldungen bearbeiten'],['pushadmin','🔔','Push-Steuerung','Benachrichtigungen verwalten'],
  ['abschnitt','🧭','Abschnittsmodule','Block A und B dokumentieren'],['reviews','⭐','Kursbewertungen','Rückmeldungen ansehen']];
 const attentionHtml=attention.slice(0,4).map(q=>'<div class="ga-trainer-appointment"><div class="ga-trainer-appointment-main"><h3>'+h(q.Name||'Mitglied')+'</h3>'+
  '<p class="ga-trainer-detail">'+h(q.GABAbgeschlossen?'GAB bestätigt · Erste Hilfe prüfen':q.GABHinweis||'GAB noch offen')+'</p></div>'+
  '<button type="button" class="smallbtn" data-go-qual="'+h(q.MitgliedID)+'">Ansehen</button></div>').join('');
 return '<div class="ga-trainer-home ga-lead-home"><section class="ga-trainer-hero"><div><p class="ga-trainer-eyebrow">FEUERWEHR ST. PÖLTEN-STADT · AUSBILDUNGSLEITUNG</p>'+
  '<h2>Servus, '+h(first)+'!</h2><p>Deine Ausbildung im Überblick – von den Teilnehmern bis zu den nächsten Kursen.</p>'+
  '<button type="button" class="ga-trainer-hero-button" data-view="members">Teilnehmer verwalten <span aria-hidden="true">→</span></button></div>'+
  '<div class="ga-trainer-hero-mark" aria-hidden="true">🚒</div></section>'+
  '<div class="ga-trainer-stats ga-home-stats">'+gaHomeStat(members.length,'Aktive Mitglieder','In allen Turnussen')+
   gaHomeStat(checks.length,'Offene Checklistenpunkte',openMembers.size+' Mitglieder mit Aufgaben')+
   gaHomeStat(pending.length,'Module zur Prüfung','Kursprojekte zur Freigabe')+
   gaHomeStat(upcoming.length,'Kommende Termine','GAB und erweiterte Ausbildung')+'</div>'+
  '<section class="ga-trainer-panel"><div class="ga-trainer-panel-head"><div><p class="ga-trainer-kicker">SCHNELLZUGRIFF</p><h2>Was möchtest du tun?</h2></div></div>'+
  '<div class="ga-trainer-shortcuts">'+gaHomeShortcuts(shortcuts)+'</div><details class="ga-home-more"><summary>Weitere Funktionen anzeigen</summary><div class="ga-trainer-shortcuts">'+gaHomeShortcuts(more)+'</div></details></section>'+
  '<section class="ga-trainer-panel"><div class="ga-trainer-panel-head"><div><p class="ga-trainer-kicker">AUSBILDUNGSPLAN</p><h2>Nächste Termine</h2><p>Geplante Ausbildungen in beiden Bereichen.</p></div><button type="button" class="smallbtn" data-view="terms">Alle öffnen</button></div>'+
  gaHomeAppointments(upcoming)+(upcoming.length>4?'<p class="ga-trainer-footnote">'+h(upcoming.length-4)+' weitere geplante Termine.</p>':'')+'</section>'+
  '<div class="ga-trainer-columns"><section class="ga-trainer-panel"><div class="ga-trainer-panel-head"><div><p class="ga-trainer-kicker">JETZT IM BLICK</p><h2>Offene Aufgaben</h2><p>Direkt zu den Bereichen, die Aufmerksamkeit brauchen.</p></div></div>'+
  '<div class="ga-home-tasks">'+gaHomeTask('checks',checks.length,'Checklistenpunkte',openMembers.size+' Mitglieder betroffen')+
  gaHomeTask('projects',pending.length,'Kursprojekte','Zur Prüfung eingereicht')+
  gaHomeTask('qualifications',proofs.length,'Erste-Hilfe-Nachweise','Aktuelle Einreichungen aktiver Mitglieder')+
  gaHomeTask('reports',reports.length,'Mängel & Ideen','Offen oder in Bearbeitung')+'</div></section>'+
  '<section class="ga-trainer-panel"><div class="ga-trainer-panel-head"><div><p class="ga-trainer-kicker">FÜR DICH</p><h2>Benachrichtigungen</h2><p>'+h(unread.length)+' ungelesen · letzte 100 Mitteilungen</p></div><button type="button" class="smallbtn" data-view="notifications">Alle öffnen</button></div>'+
  gaHomeNoticeList(unread)+'</section></div>'+
  '<section class="ga-trainer-panel"><div class="ga-trainer-panel-head"><div><p class="ga-trainer-kicker">AUSBILDUNGSSTAND</p><h2>GAB & Qualifikationen</h2><p>'+h(good)+' GAB abgeschlossen · '+h(qbad)+' noch offen</p></div><button type="button" class="smallbtn" data-view="qualifications">Alle ansehen</button></div>'+
  (attentionHtml||'<p class="ga-trainer-empty">Keine offenen Hinweise bei aktiven Mitgliedern.</p>')+
  (attention.length>4?'<p class="ga-trainer-footnote">'+h(attention.length-4)+' weitere Mitglieder in der Qualifikationsübersicht.</p>':'')+'</section></div>';
}
function gaCheckSelect(row){
 return '<form data-form="check" data-id="'+h(row.ID)+'" class="ga-task-form"><div><strong>'+h(by(STATE.checklistenpunkte,row.PunktID)?.Titel||'Checklistenpunkt')+'</strong>'+
 '<small>'+h(by(STATE.checklistenpunkte,row.PunktID)?.Zustaendig||'')+'</small></div>'+
 '<div><label>Status</label><select name="Status">'+selectStatus(row.Status)+'</select></div>'+
 '<div><label>Notiz</label><input name="Kommentar" maxlength="500" value="'+h(row.Kommentar||'')+'"></div>'+
 '<button type="submit" class="smallbtn">Speichern</button></form>';
}
function gaChecklistManager(){
 if(!['Administrator','Organisator Erweiterte Ausbildung'].includes(role()))return '';
 const ready=Array.isArray(STATE.checkArchiv),items=(STATE.checklistenpunkte||[]).filter(i=>role()==='Administrator'||i.Bereich==='Erweiterte Ausbildung'),edit=items.find(i=>i.ID===GA_CHECK_ITEM_EDIT),
  active=items.filter(i=>i.Aktiv==='JA'),archived=items.filter(i=>i.Aktiv!=='JA');
 const row=i=>'<div class="item"><div class="row between"><div><strong>'+h(i.Titel)+'</strong><p class="small muted">'+h(i.Bereich)+' · '+h(i.Zustaendig)+'</p></div><div class="btnline">'+
  '<button type="button" class="smallbtn" data-check-item-edit="'+h(i.ID)+'" '+(!ready?'disabled':'')+'>Bearbeiten</button>'+
  (i.Aktiv==='JA'?'<button type="button" class="smallbtn" data-check-item-active="'+h(i.ID)+'" data-active="NEIN" '+(!ready?'disabled':'')+'>Entfernen</button>':
   '<button type="button" class="smallbtn" data-check-item-active="'+h(i.ID)+'" data-active="JA" '+(!ready?'disabled':'')+'>Wiederherstellen</button>')+'</div></div></div>';
 const areas=role()==='Administrator'?['Alle','Grundausbildung','Erweiterte Ausbildung']:['Erweiterte Ausbildung'],offices=[...new Set(['Zeugkammer','Administration','IT','Ausbildungsleitung',edit?.Zustaendig].filter(Boolean))];
 const form='<form data-form="checkItem" class="grid">'+(edit?'<input type="hidden" name="ID" value="'+h(edit.ID)+'">':'')+
  '<div><label>Bezeichnung</label><input name="Titel" required maxlength="160" value="'+h(edit?.Titel||'')+'" placeholder="z. B. Bekleidung erhalten"></div>'+
  '<div><label>Ausbildungsbereich</label><select name="Bereich">'+areas.map(a=>'<option value="'+h(a)+'" '+(a===(edit?.Bereich||'Alle')?'selected':'')+'>'+h(a)+'</option>').join('')+'</select></div>'+
  '<div><label>Zuständig</label><select name="Zustaendig">'+offices.map(a=>'<option '+(a===edit?.Zustaendig?'selected':'')+'>'+h(a)+'</option>').join('')+'</select></div>'+
  '<div class="btnline"><button class="primary" type="submit" '+(edit&&!ready?'disabled':'')+'>'+(edit?'Änderungen speichern':'Neuen Punkt anlegen')+'</button>'+
  (edit?'<button type="button" class="secondary" data-check-item-cancel>Abbrechen</button>':'')+'</div></form>';
 const history=STATE.checkArchiv||[];
 return '<section class="panel"><h2>Checklistenpunkte verwalten</h2><p>Hier bearbeitest du die Punkte selbst. Die Erledigung für einzelne Mitglieder kannst du weiterhin oben ändern.</p>'+
  (!ready?'<div class="notice">Bearbeiten und Entfernen nach Aktualisierung der bestehenden Apps-Script-Bereitstellung auf Code.gs 1.13.6 verfügbar.</div>':'')+
  (active.map(row).join('')||'<p class="muted">Keine aktiven Checklistenpunkte vorhanden.</p>')+
  (edit?'<div class="ga-fold-body"><h3>Checklistenpunkt bearbeiten</h3>'+form+'</div>':'<details class="ga-member-fold"><summary>Neuen Checklistenpunkt anlegen</summary><div class="ga-fold-body">'+form+'</div></details>')+
  '<details class="ga-member-fold"><summary>Archivierte Punkte ('+archived.length+')</summary><div class="ga-fold-body"><p class="small muted">Entfernte Punkte zählen nicht mehr als offene Aufgaben. Erledigungen und Notizen bleiben erhalten; Wiederherstellen übernimmt die bisherigen Statuswerte.</p>'+
  (archived.map(row).join('')||'<p class="muted">Keine archivierten Punkte.</p>')+
  (history.length?'<details><summary>Gespeicherte Nachweise und Notizen ('+history.length+')</summary>'+history.map(c=>'<p><strong>'+h(name(by(STATE.mitglieder,c.MitgliedID))||'Archiviertes Mitglied')+'</strong> · '+h(by(items,c.PunktID)?.Titel)+' · '+h(c.Status)+(c.Kommentar?' · '+h(c.Kommentar):'')+'</p>').join('')+'</details>':'')+
  '</div></details></section>';
}
function checks(){
 const members=(STATE.mitglieder||[]).filter(m=>m.Aktiv==='JA');
 const activeMemberIds=new Set(members.map(m=>m.ID));
 const raw=(STATE.checks||[]).filter(c=>activeMemberIds.has(c.MitgliedID)),filtered=members.filter(m=>{
  if(GA_CHECK_TURNUS&&m.TurnusID!==GA_CHECK_TURNUS)return false;
  if(GA_CHECK_QUERY&&!gaMatches(name(m)+' '+m.Standesbuchnummer+' '+m.Email,GA_CHECK_QUERY))return false;
  if(GA_CHECK_STATUS==='Alle')return raw.some(c=>c.MitgliedID===m.ID);
  return raw.some(c=>c.MitgliedID===m.ID&&c.Status===GA_CHECK_STATUS);
 });
 const total=raw.length,open=raw.filter(c=>c.Status==='Offen').length,done=raw.filter(c=>c.Status==='Erledigt').length;
 const current=members.find(m=>m.ID===GA_CHECK_PERSON),own=current?raw.filter(c=>c.MitgliedID===current.ID):[];
 const controls='<div class="ga-admin-toolbar"><div><label>Mitglied suchen</label><input type="search" data-ga-search="check" value="'+h(GA_CHECK_QUERY)+'" placeholder="Name oder Standesbuchnummer"></div>'+
 '<div><label>Turnus</label>'+gaTurnusSelect(GA_CHECK_TURNUS,'data-ga-select="checkTurnus"')+'</div>'+
 '<div><label>Status</label><select data-ga-select="checkStatus">'+
 [['Offen','Nur offene Aufgaben'],['Erledigt','Erledigte Aufgaben'],['Nicht erforderlich','Nicht erforderlich'],['Alle','Alle Einträge']].map(o=>'<option value="'+o[0]+'" '+(GA_CHECK_STATUS===o[0]?'selected':'')+'>'+o[1]+'</option>').join('')+'</select></div></div>';
 const list=filtered.slice(0,GA_CHECK_LIMIT).map(m=>{
  const mine=raw.filter(c=>c.MitgliedID===m.ID),o=mine.filter(c=>c.Status==='Offen').length;
  return '<button type="button" data-ga-person="check" data-id="'+h(m.ID)+'" class="ga-admin-person'+(GA_CHECK_PERSON===m.ID?' selected':'')+'">'+
  '<span><strong>'+h(name(m))+'</strong><small>'+h(by(STATE.turnusse,m.TurnusID)?.Bezeichnung||'Kein Turnus')+'</small></span>'+
  '<span class="tag '+(o?'warn':'ok')+'">'+o+' offen</span><span>›</span></button>';
 }).join('');
 const panel=current?'<section class="panel ga-person-detail"><div class="row between"><div><p class="ga-eyebrow">CHECKLISTE · MITGLIED</p><h2>'+h(name(current))+'</h2>'+
 '<p class="muted">'+own.filter(x=>x.Status==='Erledigt').length+' / '+own.length+' erledigt · '+own.filter(x=>x.Status==='Offen').length+' offen</p></div>'+
 '<button type="button" class="secondary" data-ga-clear="check">Schließen</button></div>'+
 (own.length?own.map(gaCheckSelect).join(''):'<p class="muted">Keine Checklistenpunkte hinterlegt.</p>')+'</section>':'<section class="panel ga-admin-placeholder"><h2>Mitglied auswählen</h2><p>Wähle links eine Person aus, um nur deren Checkliste zu bearbeiten.</p></section>';
 return '<div class="ga-page-heading"><div><h2>Checklistenverwaltung</h2><p>Filtern, Mitglied auswählen, Status bearbeiten – auch bei vielen Teilnehmern.</p></div></div>'+
 '<div class="ga-kpis">'+gaMetric(open,'Offene Punkte','Noch zu bearbeiten')+gaMetric(done,'Erledigt','Bestätigte Aufgaben')+gaMetric(total,'Einträge insgesamt','Über aktive Mitglieder')+'</div>'+
 '<section class="panel"><h2>Mitglieder & Status</h2>'+controls+'<div class="ga-admin-split"><div class="ga-person-list">'+(list||gaNotice('Keine Mitglieder für diesen Filter gefunden.'))+
 (filtered.length>GA_CHECK_LIMIT?'<button class="secondary full" type="button" data-ga-more="check">Weitere '+(filtered.length-GA_CHECK_LIMIT)+' Mitglieder anzeigen</button>':'')+
 '<p class="small muted">'+filtered.length+' Mitglieder entsprechen der Auswahl</p></div>'+panel+'</div></section>'+
 gaChecklistManager();
}

function gaExternalBlockForms(q){
 const blocks=[
 {id:'GAB-ABSCHNITT-BLOCK-A',title:'Block A · Basiswissen im Abschnitt',exam:false},
 {id:'GAB-ABSCHNITT-BLOCK-B',title:'Block B · Basiswissen und Abschluss Truppmann',exam:true}
 ];
 return '<div class="ga-abschnitt-head"><h3>Verpflichtende Abschnittsmodule</h3><p class="small muted">Externe Ausbildung dokumentieren. Wir planen keine Abschnittstermine und geben keine Prüfungsergebnisse ohne Nachweis frei.</p></div>'+
 blocks.map(b=>{
 const proof=(STATE.abschnittNachweise||[]).find(x=>x.MitgliedID===q.MitgliedID&&x.KursID===b.id)||{};
 const complete=proof.Absolviert==='JA'&&(!b.exam||proof.PruefungBestanden==='JA');
 return '<details class="ga-member-fold ga-external-block"><summary><span>'+b.title+'</span><span class="tag '+(complete?'ok':'warn')+'">'+(complete?'Abgeschlossen':b.exam&&proof.Absolviert==='JA'?'Prüfung ausständig':'Offen')+'</span></summary>'+
 '<div class="ga-fold-body"><form data-form="abschnitt" class="grid"><input type="hidden" name="MitgliedID" value="'+h(q.MitgliedID)+'">'+
 '<input type="hidden" name="KursID" value="'+b.id+'">'+
 '<div class="wide"><label class="inline-check"><input type="checkbox" name="Absolviert" value="JA" '+(proof.Absolviert==='JA'?'checked':'')+'> Ausbildung Block '+(b.exam?'B':'A')+' im Abschnitt vollständig absolviert</label></div>'+
 '<div><label>Datum der Ausbildung / Bestätigung</label><input type="date" name="Ausbildungsdatum" value="'+h(proof.Ausbildungsdatum||'')+'"></div>'+
 (b.exam?'<div class="wide"><label class="inline-check"><input type="checkbox" name="PruefungBestanden" value="JA" '+(proof.PruefungBestanden==='JA'?'checked':'')+'> Abschluss Truppmann (ASMTRM) erfolgreich bestanden</label></div>'+
 '<div><label>Datum der bestandenen Abschlussprüfung</label><input type="date" name="Pruefungsdatum" value="'+h(proof.Pruefungsdatum||'')+'"></div>':'')+
 '<div class="wide"><label>Nachweis / Bestätigung (Aktenzeichen, Prüfungsbestätigung oder Verweis)</label><input name="Nachweis" maxlength="500" value="'+h(proof.Nachweis||'')+'"></div>'+
 '<div class="wide"><label>Notiz (optional)</label><textarea name="Notiz" rows="2">'+h(proof.Notiz||'')+'</textarea></div>'+
 '<div class="wide"><button class="primary" type="submit">Abschnittsnachweis speichern</button></div></form></div></details>';
 }).join('');
}

/** Klar sichtbare Verwaltung externer Pflichtmodule – ohne Kurs- oder Terminplanung. */
function gaAbschnittOverview(){
 const qs=STATE.qualifikationen||[];
 const backendReady=Array.isArray(STATE.abschnittNachweise);
 const filtered=qs.filter(q=>{
  const member=by(STATE.mitglieder,q.MitgliedID);
  return (!GA_QUAL_TURNUS||q.TurnusID===GA_QUAL_TURNUS)&&
   (!GA_QUAL_QUERY||gaMatches(q.Name+' '+q.Standesbuchnummer+' '+(member?.Email||''),GA_QUAL_QUERY));
 });
 const selected=qs.find(q=>q.MitgliedID===GA_QUAL_PERSON);
 const proofs=STATE.abschnittNachweise||[];
 const hasProof=(id,cid)=>proofs.some(x=>x.MitgliedID===id&&x.KursID===cid&&x.Absolviert==='JA'&&
    (cid==='GAB-ABSCHNITT-BLOCK-A'||x.PruefungBestanden==='JA'));
 const completedA=qs.filter(q=>hasProof(q.MitgliedID,'GAB-ABSCHNITT-BLOCK-A')).length;
 const completedB=qs.filter(q=>hasProof(q.MitgliedID,'GAB-ABSCHNITT-BLOCK-B')).length;
 const alerts=!backendReady?
 '<div class="ga-alert"><strong>Apps-Script-Aktualisierung erforderlich.</strong> Die neue Nachweistabelle ist bereits vorhanden, aber der aktuell verbundene Server liefert noch keine Abschnittsnachweise. Bitte die aktuelle <a href="https://github.com/michaelmejtsky/grundausbildung/blob/main/Code.gs" target="_blank" rel="noopener noreferrer">Code.gs</a> in die bestehende Apps-Script-Bereitstellung übernehmen und eine neue Version veröffentlichen. Danach hier aktualisieren.</div>':'';
 const list=filtered.slice(0,GA_QUAL_LIMIT).map(q=>{
  const a=hasProof(q.MitgliedID,'GAB-ABSCHNITT-BLOCK-A'),b=hasProof(q.MitgliedID,'GAB-ABSCHNITT-BLOCK-B');
  return '<button type="button" class="ga-admin-person '+(GA_QUAL_PERSON===q.MitgliedID?'selected':'')+
   '" data-ga-person="qual" data-id="'+h(q.MitgliedID)+'">'+
   '<span><strong>'+h(q.Name)+'</strong><small>Block A: '+(a?'erledigt':'offen')+' · Block B + Abschluss: '+(b?'erledigt':'offen')+'</small></span>'+
   '<span class="tag '+(a&&b?'ok':'warn')+'">'+(a&&b?'Vollständig':'Offen')+'</span></button>';
 }).join('');
 const controls='<div class="ga-admin-toolbar"><div><label>Mitglied suchen</label>'+
 '<input type="search" data-ga-search="qual" value="'+h(GA_QUAL_QUERY)+'" placeholder="Name oder Standesbuchnummer"></div>'+
 '<div><label>Turnus</label>'+gaTurnusSelect(GA_QUAL_TURNUS,'data-ga-select="qualTurnus"')+'</div></div>';
 const detail=selected?'<section class="panel ga-person-detail"><div class="row between"><div><p class="ga-eyebrow">EXTERNE AUSBILDUNG · ABSCHNITT</p>'+
 '<h2>'+h(selected.Name)+'</h2><p class="small muted">Block A und Block B mit Abschluss Truppmann getrennt bestätigen.</p></div>'+
 '<button type="button" class="secondary" data-ga-clear="qual">Schließen</button></div>'+
 (backendReady?gaExternalBlockForms(selected):'<p class="muted">Nachweiserfassung erst nach der oben beschriebenen Apps-Script-Aktualisierung möglich.</p>')+
 '</section>':'<section class="panel ga-admin-placeholder"><h2>Mitglied auswählen</h2>'+
 '<p>Wähle links die gewünschte Person aus. Danach kannst du Block A und Block B mit Abschlussprüfung einzeln dokumentieren.</p></section>';
 return '<div class="ga-page-heading"><div><h2>Abschnittsmodule A & B</h2>'+
 '<p>Verpflichtende GAB-Hauptmodule: externe Teilnahme und positive Abschlussprüfung dokumentieren.</p></div>'+
 '<div class="btnline"><button type="button" class="secondary" data-view="adminMails">Block-B-E-Mail und Versandstatus</button><button type="button" class="secondary" data-view="qualifications">Zurück zu Qualifikationen</button></div></div>'+
 '<div class="ga-kpis">'+gaMetric(qs.length,'Teilnehmer','In der Qualifikationsübersicht')+
 gaMetric(completedA,'Block A bestätigt','Abschnittsmodul')+
 gaMetric(completedB,'Block B inkl. ASMTRM','Positiv abgeschlossen')+'</div>'+alerts+
 '<section class="panel"><h2>Teilnehmer auswählen</h2>'+controls+
 '<div class="ga-admin-split"><div class="ga-person-list">'+(list||gaNotice('Keine passenden Teilnehmer gefunden.'))+
 (filtered.length>GA_QUAL_LIMIT?'<button type="button" class="secondary full" data-ga-more="qual">Weitere Teilnehmer anzeigen</button>':'')+
 '<p class="small muted">'+filtered.length+' Teilnehmer in der Auswahl</p></div>'+detail+'</div></section>';
}

function gaAdvancedTransferForm(q){
 if(role()!=='Administrator')return '';
 if(!Array.isArray(STATE.erweiterteUeberstellungen))return '<p class="notice">Für eine Verwaltungsüberstellung zuerst Code.gs 1.13.13 aktualisieren.</p>';
 const member=by(STATE.mitglieder,q.MitgliedID);if(by(STATE.turnusse,member?.TurnusID)?.Bereich!=='Grundausbildung')return '';
 const transfer=STATE.erweiterteUeberstellungen.find(t=>t.MitgliedID===q.MitgliedID);
 if(transfer)return '<section class="panel"><h3>Verwaltung übergeben</h3><p>Erweiterter Turnus: '+h(by(STATE.turnusse,transfer.TurnusID)?.Bezeichnung||'–')+' · Freigabe: '+dt(transfer.FreigegebenAm)+'</p><p class="small muted">GAB-Turnus und Nachweise bleiben erhalten. Die erweiterte Ausbildungsleitung darf dieses Mitglied verwalten.</p><button type="button" class="secondary" data-revoke-adv-transfer="'+h(q.MitgliedID)+'">Verwaltung zurückholen</button></section>';
 if(!q.GABAbgeschlossen)return '<p class="small muted">Die vollständige Verwaltungsüberstellung ist erst nach dem offiziellen GAB-Abschluss möglich. Eine Gastzuordnung ist vorher weiterhin möglich.</p>';
 const turns=(STATE.turnusse||[]).filter(t=>t.Bereich==='Erweiterte Ausbildung'&&t.Aktiv==='JA');
 return '<section class="panel"><h3>In die erweiterte Verwaltung überstellen</h3><p>Nur diese ausdrückliche Freigabe übergibt die Mitgliedsverwaltung. Eine Gastzuordnung allein erteilt keine Stammdatenrechte.</p><form data-form="advancedTransfer"><input type="hidden" name="MitgliedID" value="'+h(q.MitgliedID)+'"><label>Erweiterter Turnus<select name="TurnusID" required><option value="">Bitte wählen</option>'+turns.map(t=>'<option value="'+h(t.ID)+'">'+h(t.Bezeichnung)+'</option>').join('')+'</select></label><button type="submit" class="primary" '+(!turns.length?'disabled':'')+'>Nach GAB-Abschluss Verwaltung übergeben</button></form></section>';
}
function gaQualForm(q){
 const warn=q.GABManuellBestaetigt&&!q.GABDokuVollstaendig?
  '<div class="ga-alert">GAB ist durch den Administrator bestätigt. Dokumentation noch unvollständig: '+h(q.GABHinweis)+'</div>':
  '<p class="small muted">'+h(q.GABHinweis||'')+'</p>';
 return '<section class="panel ga-person-detail"><div class="row between"><div><p class="ga-eyebrow">QUALIFIKATION · MITGLIED</p><h2>'+h(q.Name)+'</h2></div>'+
 '<button type="button" class="secondary" data-ga-clear="qual">Schließen</button></div>'+
 ((q.GueltigkeitUnklar||[]).length?'<div class="ga-alert">Das Startdatum eines zugeordneten Turnus fehlt. Bitte unter „Turnusse“ ergänzen; die Pflicht wird bis dahin geprüft.</div>':'')+
 '<div class="ga-status-line">'+gaStatusBadge(q.GABAbgeschlossen,'GAB abgeschlossen','GAB nicht bestätigt')+
 gaStatusBadge(q.BSWModulAbgeschlossen,'BSW-Modul vollständig','BSW noch offen')+
 gaStatusBadge(q.Alter16,'Mindestalter erreicht','Alter fehlt/unter 16')+'</div>'+warn+
 '<p class="small muted">Pflichtmodule: '+h(q.PflichtAbsolviert)+' / '+h(q.PflichtGesamt)+' · '+h(q.Fortschritt)+' % · Ausbildungsstufe: '+h(q.Ausbildungsweg||'–')+'</p>'+
 gaExternalBlockForms(q)+gaAdvancedTransferForm(q)+
 '<form data-form="qualification"><input type="hidden" name="MitgliedID" value="'+h(q.MitgliedID)+'">'+
 '<div class="ga-qual-approval"><label class="inline-check"><input type="checkbox" name="GABFreigabe" value="JA" '+(q.GABFreigabe==='JA'?'checked':'')+'> <b>GAB abgeschlossen und durch die Ausbildungsleitung bestätigt</b></label>'+
 '<p class="small muted">Diese Bestätigung setzt den GAB-Status auf abgeschlossen. Noch fehlende Nachweise bleiben als Hinweis sichtbar.</p></div>'+
 '<div class="grid"><div><label>Geburtsdatum</label><input type="date" name="Geburtsdatum" value="'+h(q.Geburtsdatum||'')+'"></div>'+
 '<div><label>Erste-Hilfe-Status</label><select name="ErsteHilfeStatus"><option '+(q.ErsteHilfeStatus==='Ausständig'?'selected':'')+'>Ausständig</option><option '+(q.ErsteHilfeStatus==='Bestätigt'?'selected':'')+'>Bestätigt</option></select></div>'+
 '<div><label>Erste-Hilfe-Kursdatum</label><input type="date" name="ErsteHilfeBestaetigtAm" value="'+h(q.ErsteHilfeBestaetigtAm||'')+'"></div>'+
 '<div><label>FDISK-Eintrag</label><input type="date" name="FDISKEintragDatum" value="'+h(q.FDISKEintragDatum||'')+'"></div>'+
 '<div class="wide"><label class="inline-check"><input type="checkbox" name="FDISKPlatzhalter" value="JA" '+(q.FDISKPlatzhalter==='JA'?'checked':'')+'> FDISK-Platzhalter vorhanden (kein bestätigter Erste-Hilfe-Nachweis)</label></div>'+
 '<div class="wide"><label class="inline-check"><input type="checkbox" name="GABAnerkannt" value="JA" '+(q.GABAnerkannt==='JA'?'checked':'')+'> Bereits absolvierte GAB anerkennen (nur bei direktem Einstieg in erweiterte Ausbildung)</label></div>'+
 '</div><div class="btnline"><button type="submit" class="primary">Qualifikation speichern</button></div></form></section>';
}
function qualifications(){
 const qs=STATE.qualifikationen||[];
 const filtered=qs.filter(q=>{
  const member=by(STATE.mitglieder,q.MitgliedID);
  return (!GA_QUAL_TURNUS||q.TurnusID===GA_QUAL_TURNUS)&&(!GA_QUAL_QUERY||gaMatches(q.Name+' '+q.Standesbuchnummer+' '+member?.Email,GA_QUAL_QUERY));
 });
 const selected=qs.find(q=>q.MitgliedID===GA_QUAL_PERSON);
 const list=filtered.slice(0,GA_QUAL_LIMIT).map(q=>
 '<button type="button" class="ga-admin-person'+(GA_QUAL_PERSON===q.MitgliedID?' selected':'')+'" data-ga-person="qual" data-id="'+h(q.MitgliedID)+'">'+
 '<span><strong>'+h(q.Name)+'</strong><small>'+h(q.Ausbildungsweg||'Grundausbildung')+' · '+h(q.PflichtAbsolviert)+' / '+h(q.PflichtGesamt)+' Module</small></span>'+
 '<span class="tag '+(q.GABAbgeschlossen?'ok':'warn')+'">'+(q.GABAbgeschlossen?'GAB fertig':'GAB offen')+'</span><span>›</span></button>').join('');
 const requirements='<details class="ga-member-fold ga-admin-bottom"><summary>Pflichtmodule für GAB und BSW festlegen</summary><div class="ga-fold-body"><p class="small muted">Hier werden die Ausbildungsanforderungen definiert. Sie werden unabhängig von einer ausdrücklich erteilten GAB-Bestätigung weiterhin angezeigt.</p>'+
 (STATE.kurse||[]).filter(c=>c.Aktiv==='JA').map(c=>{const r=(STATE.kursAnforderungen||[]).find(x=>x.KursID===c.ID)||{};
 return '<form class="ga-requirement-row" data-form="requirement"><input type="hidden" name="KursID" value="'+h(c.ID)+'"><strong>'+h(c.Titel)+'</strong>'+
 (STATE.gueltigkeit?.kurs?.[c.ID]?'<span class="small muted">Gültig für Turnusse ab '+h(gaShortDate(STATE.gueltigkeit.kurs[c.ID]))+'</span>':'')+
 '<label class="inline-check"><input type="checkbox" name="PflichtGAB" value="JA" '+(r.PflichtGAB==='JA'?'checked':'')+'> GAB</label>'+
 '<label class="inline-check"><input type="checkbox" name="PflichtBSW" value="JA" '+(r.PflichtBSW==='JA'?'checked':'')+'> BSW</label>'+
 (STATE.kursVorgaenger?'<label>Vorgängerkurs <select name="VorgaengerID"><option value="">Keiner</option>'+(STATE.kurse||[]).filter(p=>p.ID!==c.ID&&p.Bereich===c.Bereich).map(p=>'<option value="'+h(p.ID)+'" '+(STATE.kursVorgaenger[c.ID]?.id===p.ID?'selected':'')+'>'+h(p.Titel)+'</option>').join('')+'</select></label><span class="small muted">Abgeschlossene Termine des Vorgängers bis zur Verknüpfung werden für das neue Pflichtmodul angerechnet. Ist auch der Vorgänger als Pflichtmodul markiert, zählt das neuere Modul für diese Pflicht.</span>':'<span class="small muted">Vorgängerkurse verfügbar nach Aktualisierung des Backends.</span>')+
 '<button class="smallbtn" type="submit">Speichern</button></form>'}).join('')+'</div></details>';
 const attendance='<details class="ga-member-fold ga-admin-bottom"><summary>Teilnahme nachträglich bestätigen oder korrigieren</summary><div class="ga-fold-body">'+
 '<form data-form="singleAttendance" class="grid"><div><label>Mitglied</label><select name="MitgliedID" required>'+option(STATE.mitglieder.filter(m=>m.Aktiv==='JA'),name)+'</select></div>'+
 '<div><label>Ausbildungstermin</label><select name="TerminID" required>'+option(STATE.termine,t=>(by(STATE.kurse,t.KursID)?.Titel||'Kurs')+' · '+t.Beginn)+'</select></div>'+
 '<div><label>Teilgenommen?</label><select name="Anwesend"><option value="JA">Ja</option><option value="NEIN">Nein</option></select></div>'+
 '<div><button type="submit" class="primary">Teilnahme speichern</button></div></form></div></details>';
 return '<div class="ga-page-heading"><div><h2>Qualifikationen</h2><p>GAB, Brandsicherheitswachen und persönliche Nachweise übersichtlich verwalten.</p></div></div>'+ 
 '<section class="panel ga-external-link"><div><h3>Externe Pflichtmodule – Block A und Block B</h3><p>Abschnittsausbildung und positiven Abschluss Truppmann getrennt bestätigen. Die Erfassung ist auch ohne eigenen Ausbildungstermin möglich.</p></div><button type="button" class="primary" data-view="abschnitt">Abschnittsmodule öffnen</button></section>'+
 '<div class="ga-kpis">'+gaMetric(qs.filter(x=>x.GABAbgeschlossen).length,'GAB abgeschlossen','Bestätigte Mitglieder')+
 gaMetric(qs.filter(x=>!x.GABAbgeschlossen).length,'GAB offen','Noch nicht freigegeben')+
 gaMetric(qs.filter(x=>x.BSWDienstMoeglich).length,'BSW freigegeben','Drei Bedingungen erfüllt')+'</div>'+
 '<section class="panel"><h2>Mitglied auswählen</h2><div class="ga-admin-toolbar"><div><label>Suche</label><input type="search" data-ga-search="qual" value="'+h(GA_QUAL_QUERY)+'" placeholder="Name, E-Mail oder Standesbuchnummer"></div>'+
 '<div><label>Turnus</label>'+gaTurnusSelect(GA_QUAL_TURNUS,'data-ga-select="qualTurnus"')+'</div></div>'+
 '<div class="ga-admin-split"><div class="ga-person-list">'+(list||gaNotice('Keine Mitglieder gefunden.'))+
 (filtered.length>GA_QUAL_LIMIT?'<button type="button" class="secondary full" data-ga-more="qual">Weitere Mitglieder anzeigen</button>':'')+
 '<p class="small muted">'+filtered.length+' Mitglieder</p></div>'+
 (selected?gaQualForm(selected):'<section class="panel ga-admin-placeholder"><h2>Eine Person auswählen</h2><p>Erst nach der Auswahl öffnet sich das Qualifikationsformular.</p></section>')+'</div></section>'+
 attendance+requirements+
 '<details class="ga-member-fold ga-admin-bottom"><summary>Erste-Hilfe-Nachweise und E-Mail-Weiterleitung</summary><div class="ga-fold-body">'+aidPanel(true)+'</div></details>';
}
function gaAdminMailPage(){
 if(role()!=='Administrator')return '';
 const s=STATE.verwaltungsMails;
 if(!s)return '<section class="panel"><h2>Verwaltungs-Mails</h2><p>Bitte die vollständige Code.gs 1.13.8 in der bestehenden Apps-Script-Bereitstellung aktualisieren.</p></section>';
 const rows=(s.Verlauf||[]).map(r=>{
  const member=by(STATE.mitglieder,r.MitgliedID),turnus=by(STATE.turnusse,r.TurnusID),term=by(STATE.termine,r.BerichtID),reportTitle=r.Art==='ausbildungsbericht'?(by(STATE.kurse,term?.KursID)?.Titel||'Ausbildungsbericht'):r.Art==='freieTaetigkeit'?(by(STATE.freieTaetigkeiten,r.BerichtID)?.Titel||'Freie Tätigkeit'):'',retry=['Fehler','Versand läuft'].includes(r.Status);
  return '<div class="item"><div class="row between"><strong>'+h(r.Art==='pager'?'Pager':r.Art==='blaulicht'?'Blaulicht SMS/Lea':r.Art==='transponder'?'Transponder für Zugang':r.Art==='zeugkammer'?'Zeugkammer – Ausgaben':r.Art==='ersteHilfe'?'Erste-Hilfe-Zertifikat':r.Art==='blockB'?'Truppmann-Abschluss Block B':r.Art==='ausbildungsbericht'?'Ausbildungsbericht als PDF':r.Art==='freieTaetigkeit'?'Tätigkeitsbericht als PDF':'Verwaltungs-Mail')+'</strong>'+
   '<span class="tag '+(r.Status==='Gesendet'?'ok':r.Status==='Fehler'||r.Status==='Versand läuft'?'warn':'blue')+'">'+h(r.Status)+'</span></div>'+
   '<p>'+h(['transponder','pager','blaulicht','zeugkammer','ersteHilfe'].includes(r.Art)?(member?name(member):r.Name||'Mitglied'):reportTitle||(turnus?.Bezeichnung||'Turnus')+' · '+gaShortDate(r.Datum))+'</p>'+
   (r.GesendetAm?'<p class="small muted">Gesendet: '+dt(r.GesendetAm)+(r.Anzahl?' · '+h(r.Anzahl)+' Teilnehmer':'')+'</p>':'')+
   (r.Status==='Wartend'?'<p class="small muted">Automatischer Versand vorgemerkt. Die Prüfung läuft alle 5 Minuten.</p>':'')+
   (r.Hinweis?'<p class="notice">'+h(r.Hinweis)+'</p>':'')+
   (retry?'<button type="button" class="secondary" data-admin-mail-retry="'+h(r.ID)+'">Versand erneut versuchen</button>':'')+
   (r.Status==='Gesendet'&&['transponder','pager','blaulicht','zeugkammer','ersteHilfe'].includes(r.Art)?'<button type="button" class="secondary" data-renew-checklist-mail="'+h(r.ID)+'">Offene Bestätigungslinks neu senden</button>':'')+'</div>';
 }).join('');
 return '<div class="ga-page-heading"><div><h2>Verwaltungs-Mails</h2><p>Getrennte Empfänger für Transponder, Pager, Blaulicht SMS/Lea, Zeugkammer, Truppmann-Abschlussmeldungen und fertige Tätigkeitsberichte.</p></div></div>'+
 '<section class="panel"><h3>Empfänger hinterlegen</h3><form data-form="adminMailSettings"><div class="grid">'+
 '<label>Transponder für Zugang<input name="TransponderEmpfaenger" type="email" multiple maxlength="5000" placeholder="adresse1@beispiel.at, adresse2@beispiel.at" value="'+h(s.TransponderEmpfaenger)+'"></label>'+
 '<label>Pager – Ausgabe<input name="PagerEmpfaenger" type="email" multiple maxlength="5000" placeholder="adresse@beispiel.at" value="'+h(s.PagerEmpfaenger||'')+'" '+(!s.PagerAuswahl?'disabled':'')+'></label>'+
 '<label>Blaulicht SMS/Lea – Registrierung und Zuordnung<input name="BlaulichtEmpfaenger" type="email" multiple maxlength="5000" placeholder="adresse@beispiel.at" value="'+h(s.BlaulichtEmpfaenger||'')+'" '+(!s.BlaulichtSMSLea?'disabled':'')+'></label>'+
 '<label>Zeugkammer – Dienst- und Einsatzbekleidung<input name="ZeugkammerEmpfaenger" type="email" multiple maxlength="5000" placeholder="zeugkammer@beispiel.at" value="'+h(s.ZeugkammerEmpfaenger||'')+'"></label>'+
 '<label>Truppmann-Abschluss Block B<input name="BlockBEmpfaenger" type="email" multiple maxlength="5000" placeholder="adresse1@beispiel.at, adresse2@beispiel.at" value="'+h(s.BlockBEmpfaenger)+'"></label>'+
 '<label>Fertige Tätigkeitsberichte als PDF<input name="BerichtEmpfaenger" type="email" multiple maxlength="5000" placeholder="adresse1@beispiel.at, adresse2@beispiel.at" value="'+h(s.BerichtEmpfaenger||'')+'"></label></div>'+
 '<p class="small muted">Mehrere Adressen mit Komma trennen (höchstens 20 je Bereich). Doppelte Adressen werden nur einmal verwendet. Ein leeres Feld deaktiviert den jeweiligen Versand. Wartende Meldungen verwenden die aktuell gespeicherte Adresse. Das Speichern verschickt keine alten Abschlussmeldungen. Wenn sich Empfänger ändern, werden bisherige Bestätigungslinks dieser Versandart ungültig; bei Bedarf neue Links senden.</p>'+
 (!s.PagerAuswahl?'<p class="notice">Pager und die Mail-Auswahl „Nicht erforderlich“ benötigen Code.gs 1.13.11.</p>':'')+
 (!s.BlaulichtSMSLea?'<p class="notice">Blaulicht SMS/Lea benötigt die vollständige Code.gs 1.13.9 in der bestehenden Bereitstellung.</p>':'')+
 (!s.MailBestaetigungen?'<p class="notice">Zeugkammer-Mails und Bestätigungsbuttons benötigen Code.gs 1.13.8 in der bestehenden Bereitstellung.</p>':'')+
 (!s.MehrereEmpfaenger?'<p class="notice">Für mehrere Empfänger bitte Code.gs 1.13.8 in der bestehenden Bereitstellung aktualisieren.</p>':'')+
 '<button class="primary" type="submit">Empfänger speichern</button></form></section>'+
 (!s.TriggerAktiv?'<div class="notice">Der automatische Versandtrigger ist noch nicht aktiv. Empfänger speichern oder im bestehenden Google Sheet unter Grundausbildung → 9 · Verwaltungs-Mail-Trigger einrichten einmalig ausführen und Berechtigungen erlauben.</div>':'')+
 '<section class="panel"><h3>So werden die Mails versendet</h3><p><strong>Transponder:</strong> Bei der Aufnahme eines GAB-Mitglieds „Transponder für Zugang erforderlich“ anhaken. Standesbuchnummer und Telefonnummer sind dafür erforderlich. Der Punkt bleibt offen, bis die Ausgabe unter Checklisten bestätigt wird. Die Anforderung wird einmalig per Mail verschickt.</p>'+
 '<p><strong>Pager:</strong> Beim GAB-Mitglied „Pager erforderlich“ anhaken. Eigene Empfängeradresse; die Mail enthält die Buttons „Pager ausgegeben“ und „Pager nicht erforderlich“. Auch die Transponder-Mail bietet beide Möglichkeiten. Die erste Bestätigung schließt den Punkt ab; die andere Auswahl kann ihn nicht überschreiben.</p>'+
 '<p><strong>Blaulicht SMS/Lea:</strong> Beim GAB-Mitglied „Registrierung und Zuordnung erforderlich“ anhaken und speichern. Der hinterlegte Empfänger erhält Name, Standesbuchnummer, Telefon und E-Mail mit einem Bestätigungsbutton. Erst nach der tatsächlichen Registrierung und Zuordnung bestätigt er den Punkt als erledigt. Gewöhnliches Speichern versendet keine zweite Mail.</p>'+
 '<p><strong>Zeugkammer:</strong> Beim neuen oder bestehenden Mitglied „Zeugkammer-Ausstattung anfordern (E-Mail)“ anhaken und speichern. Nur mit dieser Auswahl wird beim Speichern eine Anforderung verschickt; die bestehenden Bekleidungs-Checklistenpunkte bleiben erhalten. Die Mail enthält pro Mitglied getrennte Buttons für die tatsächlich offenen Aufgaben. Der Empfänger bestätigt die Ausgabe auf einer persönlichen Seite; erst dann wird der jeweilige Punkt erledigt. Das gilt auch für den Transponder. Links gelten '+h(s.MailLinkTage||30)+' Tage und geben keinen allgemeinen App-Zugang.</p>'+
 '<p><strong>Block B:</strong> Unter Abschnittsmodule A & B die Ausbildung und den positiven Abschluss Truppmann samt Datum bestätigen. Pro Turnus und Abschlussdatum entsteht eine Sammelmail. Sie wird frühestens 5 Minuten nach dem letzten neuen positiven Abschluss versendet; die Prüfung läuft alle 5 Minuten. Nicht bestandene oder noch unbestätigte Teilnehmer werden nicht als Absolventen gemeldet. Später bestätigte Teilnehmer folgen in einer ergänzenden Meldung.</p>'+
 '<p><strong>Tätigkeitsberichte:</strong> Beim ersten vollständigen Abschluss eines Ausbildungstermins oder Speichern einer fertigen freien Tätigkeit wird das PDF automatisch vorgemerkt und bei der nächsten Versandprüfung als Anhang verschickt. Im PDF stehen die Standesbuchnummern direkt bei den Teilnehmernamen. Spätere Änderungen lösen keinen zweiten Versand aus.</p>'+
 '<p class="small muted">Normales Bearbeiten oder erneutes Speichern löst keinen zweiten Versand aus. Alle Mailtexte enthalten „Automatische Nachricht – bitte nicht antworten“.</p></section>'+
 '<section class="panel"><h3>Zeugkammer-Mail für vorhandene Mitglieder</h3><p>Für bereits angelegte Mitglieder kannst du eine noch nicht versendete Zeugkammer-Anforderung gezielt starten.</p><form data-form="zeugkammerRequest"><label>Mitglied<select name="MitgliedID" required>'+option((STATE.mitglieder||[]).filter(m=>m.Aktiv==='JA'),name)+'</select></label><button class="primary" type="submit" '+(!s.MailBestaetigungen?'disabled':'')+'>Zeugkammer-Anforderung senden</button></form></section>'+
 '<section class="panel"><h3>Versandstatus</h3><p class="small muted">Die letzten 40 vorgemerkten oder bearbeiteten Meldungen. Fehler werden nicht automatisch erneut versendet.</p>'+ (rows||'<p class="muted">Noch keine Verwaltungs-Mails vorgemerkt.</p>')+'</section>';
}
function gaIntakeMailSettings(){
 if(role()==='Administrator')return STATE.verwaltungsMails;
 const s=STATE.aufnahmeMails;if(!s?.ErweiterteAufnahme)return null;
 return {...s,TransponderEmpfaenger:!!s.TransponderKonfiguriert,PagerEmpfaenger:!!s.PagerKonfiguriert,BlaulichtEmpfaenger:!!s.BlaulichtKonfiguriert,ZeugkammerEmpfaenger:!!s.ZeugkammerKonfiguriert};
}
function gaTransponderFields(edit){
 if(!['Administrator','Organisator Erweiterte Ausbildung'].includes(role()))return '';
 const cfg=gaIntakeMailSettings();
 if(!cfg)return '<p class="small muted">Transponder-Anforderungen nach Aktualisierung auf Code.gs 1.13.6 verfügbar.</p>';
 if(edit&&!['Grundausbildung','Erweiterte Ausbildung'].includes(by(STATE.turnusse,edit.TurnusID)?.Bereich))return '';
 if(edit&&by(STATE.turnusse,edit.TurnusID)?.Bereich==='Erweiterte Ausbildung'&&!cfg?.ErweiterteAufnahme)return '<p class="notice">Aufnahme-Häkchen für die erweiterte Ausbildung benötigen Code.gs 1.13.12.</p>';
 const item=(STATE.checklistenpunkte||[]).find(i=>i.ID===cfg.TransponderPunktID||i.Titel==='Transponder für Zugang'),check=item&&(STATE.checks||[]).find(c=>c.MitgliedID===edit?.ID&&c.PunktID===item.ID);
 if(cfg.TransponderPunktFehler)return '<p class="notice">'+h(cfg.TransponderPunktFehler)+' Bitte unter Checklisten → Checklistenpunkte verwalten prüfen.</p>';
 if(cfg.TransponderPunktArchiviert)return '<p class="notice">Transponder-Checklistenpunkt archiviert. Unter Checklisten → Checklistenpunkte verwalten wiederherstellen, um neue Transponder anzufordern.</p>';
 if(check?.Status==='Erledigt')return '<p class="notice">Transponder für Zugang: bereits erledigt. Der bestätigte Checklistenpunkt bleibt erhalten.</p>';
 return '<div data-transponder-field><label class="inline-check"><input type="checkbox" name="TransponderErforderlich" value="JA" '+(check?.Status==='Offen'?'checked':'')+'> Transponder für Zugang erforderlich</label>'+
 '<p class="small muted">Für neue und bestehende Mitglieder: erstellt einen offenen Checklistenpunkt und meldet Name, Standesbuchnummer und Kontaktdaten an den hinterlegten Empfänger. Kein erneuter Versand bei späterem Speichern.</p>'+
 (!cfg.TransponderEmpfaenger?'<p class="notice">Vor dem Anhaken bitte die Transponder-Empfängeradresse unter Verwaltungs-Mails speichern.</p>':'')+
 (role()==='Administrator'?'<button type="button" class="smallbtn" data-view="adminMails">E-Mail-Einstellungen und Versandstatus</button>':'<p class="small muted">Die Empfänger werden zentral durch die Administration hinterlegt.</p>')+'</div>';
}
function gaPagerFields(edit){
 if(!['Administrator','Organisator Erweiterte Ausbildung'].includes(role()))return '';
 const cfg=gaIntakeMailSettings();
 if(!cfg?.PagerAuswahl)return '<p class="small muted">Pager-Anforderungen nach Aktualisierung auf Code.gs 1.13.11 verfügbar.</p>';
 if(edit&&!['Grundausbildung','Erweiterte Ausbildung'].includes(by(STATE.turnusse,edit.TurnusID)?.Bereich))return '';
 if(edit&&by(STATE.turnusse,edit.TurnusID)?.Bereich==='Erweiterte Ausbildung'&&!cfg?.ErweiterteAufnahme)return '<p class="notice">Aufnahme-Häkchen für die erweiterte Ausbildung benötigen Code.gs 1.13.12.</p>';
 const item=(STATE.checklistenpunkte||[]).find(i=>i.ID===cfg.PagerPunktID||i.Titel==='Pager'),check=item&&(STATE.checks||[]).find(c=>c.MitgliedID===edit?.ID&&c.PunktID===item.ID);
 if(cfg.PagerPunktFehler)return '<p class="notice">'+h(cfg.PagerPunktFehler)+' Bitte unter Checklisten → Checklistenpunkte verwalten prüfen.</p>';
 if(cfg.PagerPunktArchiviert)return '<p class="notice">Pager-Checklistenpunkt archiviert. Unter Checklisten → Checklistenpunkte verwalten wiederherstellen, um neue Pager anzufordern.</p>';
 if(check?.Status==='Erledigt')return '<p class="notice">Pager: bereits erledigt. Der bestätigte Checklistenpunkt bleibt erhalten.</p>';
 return '<div data-pager-field><label class="inline-check"><input type="checkbox" name="PagerErforderlich" value="JA" '+(check?.Status==='Offen'?'checked':'')+'> Pager erforderlich</label>'+
 '<p class="small muted">Für neue und bestehende Mitglieder: erstellt einen offenen Checklistenpunkt und meldet Name, Standesbuchnummer und Kontaktdaten an den hinterlegten Empfänger. Kein erneuter Versand bei späterem Speichern.</p>'+
 (!cfg.PagerEmpfaenger?'<p class="notice">Vor dem Anhaken bitte die Pager-Empfängeradresse unter Verwaltungs-Mails speichern.</p>':'')+
 (role()==='Administrator'?'<button type="button" class="smallbtn" data-view="adminMails">E-Mail-Einstellungen und Versandstatus</button>':'<p class="small muted">Die Empfänger werden zentral durch die Administration hinterlegt.</p>')+'</div>';
}
function gaBlaulichtFields(edit){
 if(!['Administrator','Organisator Erweiterte Ausbildung'].includes(role()))return '';
 const cfg=gaIntakeMailSettings();
 if(!cfg?.BlaulichtSMSLea)return '<p class="small muted">Blaulicht SMS/Lea nach Aktualisierung auf Code.gs 1.13.9 verfügbar.</p>';
 if(edit&&!['Grundausbildung','Erweiterte Ausbildung'].includes(by(STATE.turnusse,edit.TurnusID)?.Bereich))return '';
 if(edit&&by(STATE.turnusse,edit.TurnusID)?.Bereich==='Erweiterte Ausbildung'&&!cfg?.ErweiterteAufnahme)return '<p class="notice">Aufnahme-Häkchen für die erweiterte Ausbildung benötigen Code.gs 1.13.12.</p>';
 const item=(STATE.checklistenpunkte||[]).find(i=>i.ID===cfg.BlaulichtPunktID||i.Titel==='Blaulicht SMS/Lea'),check=item&&(STATE.checks||[]).find(c=>c.MitgliedID===edit?.ID&&c.PunktID===item.ID);
 if(cfg.BlaulichtPunktFehler)return '<p class="notice">'+h(cfg.BlaulichtPunktFehler)+' Bitte unter Checklisten → Checklistenpunkte verwalten prüfen.</p>';
 if(cfg.BlaulichtPunktArchiviert)return '<p class="notice">Blaulicht-Checklistenpunkt archiviert. Unter Checklisten → Checklistenpunkte verwalten wiederherstellen, um eine Registrierung anzufordern.</p>';
 if(check?.Status==='Erledigt')return '<p class="notice">Blaulicht SMS/Lea: bereits registriert und zugeordnet. Der bestätigte Checklistenpunkt bleibt erhalten.</p>';
 return '<div data-blaulicht-field><label class="inline-check"><input type="checkbox" name="BlaulichtErforderlich" value="JA" '+(check?.Status==='Offen'?'checked':'')+'> Blaulicht SMS/Lea: Registrierung und Zuordnung erforderlich</label>'+
 '<p class="small muted">Für neue und bestehende Mitglieder: erstellt einen offenen Checklistenpunkt und meldet Name, Standesbuchnummer und Kontaktdaten an den hinterlegten Empfänger. Kein erneuter Versand bei späterem Speichern.</p>'+
 (!cfg.BlaulichtEmpfaenger?'<p class="notice">Vor dem Anhaken bitte die Blaulicht-Empfängeradresse unter Verwaltungs-Mails speichern.</p>':'')+
 (role()==='Administrator'?'<button type="button" class="smallbtn" data-view="adminMails">E-Mail-Einstellungen und Versandstatus</button>':'<p class="small muted">Die Empfänger werden zentral durch die Administration hinterlegt.</p>')+'</div>';
}
function gaZeugkammerFields(edit){
 if(!['Administrator','Organisator Erweiterte Ausbildung'].includes(role()))return '';
 const cfg=gaIntakeMailSettings();
 const settings=cfg;
 if(!settings?.ZeugkammerAuswahl)return '<p class="small muted">Zeugkammer-Auswahl beim Mitglied nach Aktualisierung auf Code.gs 1.13.10 verfügbar.</p>';
 return '<div data-zeugkammer-field><label class="inline-check"><input type="checkbox" name="ZeugkammerAnfordern" value="JA"> Zeugkammer-Ausstattung anfordern (E-Mail)</label>'+
 '<p class="small muted">Beim Speichern eine Anforderungsmail für die offenen Zeugkammer-Punkte senden, z. B. Dienstbekleidung und Einsatzbekleidung. Die vorhandenen Checklistenpunkte und Erledigungen bleiben erhalten. Bereits versendete Anforderungen werden nicht wiederholt.</p>'+
 (!settings.ZeugkammerEmpfaenger?'<p class="notice">Vor dem Anhaken bitte die Zeugkammer-Empfängeradresse unter Verwaltungs-Mails speichern.</p>':'')+
 (role()==='Administrator'?'<button type="button" class="smallbtn" data-view="adminMails">E-Mail-Einstellungen und Versandstatus</button>':'<p class="small muted">Die Empfänger werden zentral durch die Administration hinterlegt.</p>')+'</div>';
}
function gaMemberForm(edit){
 const options=(STATE.turnusse||[]).filter(t=>t.Aktiv==='JA').map(t=>'<option value="'+h(t.ID)+'" '+(edit?.TurnusID===t.ID?'selected':'')+'>'+h(t.Bezeichnung)+'</option>').join('');
 return '<section class="panel ga-member-form"><div class="row between"><h2>'+ (edit?'Mitglied bearbeiten':'Neues Mitglied aufnehmen')+'</h2><button type="button" class="secondary" data-ga-clear="member">Schließen</button></div>'+
 '<form data-form="member"><div class="grid">'+
 '<div><label>Vorname</label><input name="Vorname" maxlength="100" required value="'+h(edit?.Vorname||'')+'"></div>'+
 '<div><label>Nachname</label><input name="Nachname" maxlength="100" required value="'+h(edit?.Nachname||'')+'"></div>'+
 '<div><label>E-Mail (Teilnehmerzugang)</label><input name="Email" type="email" value="'+h(edit?.Email||'')+'"></div>'+
 (edit?'<div class="wide"><p class="small muted">Eine neue E-Mail-Adresse wird beim Speichern auch für den zugeordneten App-Zugang übernommen. Passwort und Ausbildungsnachweise bleiben bestehen. Offene Einladungen an die alte Adresse werden ungültig.</p></div>':'')+
 '<div><label>Telefon</label><input name="Telefon" type="tel" value="'+h(edit?.Telefon||'')+'"></div>'+
 '<div><label>Geburtsdatum</label><input type="date" name="Geburtsdatum" value="'+h(edit?.Geburtsdatum||'')+'"></div>'+
 '<div><label>Standesbuchnummer</label><input name="Standesbuchnummer" maxlength="35" value="'+h(edit?.Standesbuchnummer||'')+'"></div>'+
 '<div><label>Ausbildungsweg</label><select name="Ausbildungsweg" required>'+
 '<option value="Grundausbildung" '+(edit?.Ausbildungsweg!=='Erweiterte Ausbildung'?'selected':'')+'>Grundausbildung</option>'+
 '<option value="Erweiterte Ausbildung" '+(edit?.Ausbildungsweg==='Erweiterte Ausbildung'?'selected':'')+'>Erweiterte Ausbildung</option></select></div>'+
 '<div><label>Turnus</label><select name="TurnusID" required><option value="">Bitte auswählen</option>'+options+'</select></div></div>'+
 gaTransponderFields(edit)+gaPagerFields(edit)+gaBlaulichtFields(edit)+gaZeugkammerFields(edit)+
 (!edit?'<label class="inline-check"><input type="checkbox" name="SofortEinladen" value="JA"> Zugangs-Einladung per E-Mail senden</label>':'')+
 '<div class="btnline"><button class="primary" type="submit">'+(edit?'Änderungen speichern':'Mitglied aufnehmen')+'</button></div></form></section>';
}
function members(){
 const members=STATE.mitglieder||[],query=GA_MEM_QUERY;
 const filtered=members.filter(m=>(!GA_MEM_TURNUS||GA_MEM_TURNUS===m.TurnusID)&&
 (!query||gaMatches(name(m)+' '+m.Email+' '+m.Standesbuchnummer,query)));
 const selected=FORM==='member'&&EDIT?by(members,EDIT):null;
 const listing=filtered.slice(0,GA_MEM_LIMIT).map(m=>{
  const q=(STATE.qualifikationen||[]).find(x=>x.MitgliedID===m.ID),open=(STATE.checks||[]).filter(x=>x.MitgliedID===m.ID&&x.Status==='Offen').length;
  const access=(STATE.benutzer||[]).some(u=>String(u.Email).toLowerCase()===String(m.Email||'').toLowerCase()&&u.Aktiv==='JA');
  return '<div class="ga-member-row"><div><strong>'+h(name(m))+'</strong><small>'+h(by(STATE.turnusse,m.TurnusID)?.Bezeichnung||'Kein Turnus')+
  ' · '+h(m.Standesbuchnummer||'Keine Stb.-Nr.')+'</small></div>'+
  '<span class="tag '+(q?.GABAbgeschlossen?'ok':'warn')+'">'+(q?.GABAbgeschlossen?'GAB fertig':'GAB offen')+'</span>'+
  '<span class="small muted">'+open+' Aufgaben offen</span>'+
  '<div class="ga-row-actions"><button type="button" class="smallbtn" data-edit="member" data-id="'+h(m.ID)+'">Bearbeiten</button>'+
  '<button type="button" class="smallbtn" data-go-qual="'+h(m.ID)+'">Qualifikation</button>'+
  (m.Aktiv==='JA'&&m.Email&&!access?'<button type="button" class="smallbtn" data-invite-member="'+h(m.ID)+'">Einladen</button>':'')+
  (m.Aktiv==='JA'?'<button type="button" class="smallbtn" data-remove-member="'+h(m.ID)+'">Entfernen</button>':'')+'</div></div>';
 }).join('');
 return '<div class="ga-page-heading"><div><h2>Mitgliederverwaltung</h2><p>Nur die ausgewählte Person bearbeiten. Die vollständige Liste ist durchsuchbar.</p></div>'+
 '<div class="btnline"><button type="button" class="secondary" data-view="adminMails">Verwaltungs-Mails</button><button type="button" class="primary" data-ga-add-member="1">+ Mitglied aufnehmen</button></div></div>'+
 '<div class="ga-kpis">'+gaMetric(members.filter(x=>x.Aktiv==='JA').length,'Aktive Mitglieder','')+
 gaMetric(members.filter(x=>x.Aktiv!=='JA').length,'Deaktiviert','Archivierte Mitglieder')+
 gaMetric((STATE.qualifikationen||[]).filter(x=>x.GABAbgeschlossen).length,'GAB bestätigt','')+'</div>'+
 ((GA_MEM_CREATE||selected)?gaMemberForm(selected):'')+
 '<section class="panel"><h2>Mitgliederliste ('+filtered.length+')</h2>'+
 '<div class="ga-admin-toolbar"><div><label>Suchen</label><input type="search" data-ga-search="member" value="'+h(GA_MEM_QUERY)+'" placeholder="Name, E-Mail, Standesbuchnummer"></div>'+
 '<div><label>Turnus</label>'+gaTurnusSelect(GA_MEM_TURNUS,'data-ga-select="memberTurnus"')+'</div></div>'+
 '<div class="ga-member-list">'+(listing||gaNotice('Keine Mitglieder gefunden.'))+'</div>'+
 (filtered.length>GA_MEM_LIMIT?'<button type="button" class="secondary full" data-ga-more="member">Weitere Mitglieder anzeigen</button>':'')+'</section>';
}
const gaApp=document.getElementById('app');
gaApp?.addEventListener('click',e=>{
 const x=e.target.closest('[data-ga-person],[data-ga-clear],[data-ga-more],[data-ga-add-member],[data-go-qual]');
 if(!x)return;
 if(x.dataset.gaPerson){if(x.dataset.gaPerson==='check')GA_CHECK_PERSON=x.dataset.id;else GA_QUAL_PERSON=x.dataset.id;render();return;}
 if(x.dataset.goQual){GA_QUAL_PERSON=x.dataset.goQual;VIEW='qualifications';FORM='';EDIT=null;render();return;}
 if(x.dataset.gaClear){if(x.dataset.gaClear==='check')GA_CHECK_PERSON='';if(x.dataset.gaClear==='qual')GA_QUAL_PERSON='';
 if(x.dataset.gaClear==='member'){GA_MEM_CREATE=false;FORM='';EDIT=null;}render();return;}
 if(x.dataset.gaMore){if(!['check','qual','member'].includes(x.dataset.gaMore))return;
 if(x.dataset.gaMore==='check')GA_CHECK_LIMIT+=30;
 if(x.dataset.gaMore==='qual')GA_QUAL_LIMIT+=30;if(x.dataset.gaMore==='member')GA_MEM_LIMIT+=40;render();return;}
 if(x.dataset.gaAddMember){GA_MEM_CREATE=true;FORM='';EDIT=null;render();}
});
gaApp?.addEventListener('input',e=>{
 const x=e.target.closest('[data-ga-search]');if(!x)return;
 const typ=x.dataset.gaSearch;
 if(!['check','qual','member'].includes(typ))return;
 if(typ==='check'){GA_CHECK_QUERY=x.value;GA_CHECK_LIMIT=30;}
 if(typ==='qual'){GA_QUAL_QUERY=x.value;GA_QUAL_LIMIT=30;}
 if(typ==='member'){GA_MEM_QUERY=x.value;GA_MEM_LIMIT=40;}
 const caret=x.selectionStart;
 render();
 const el=document.querySelector('[data-ga-search="'+typ+'"]');if(el){el.focus();try{el.setSelectionRange(caret,caret);}catch(_){}}
});
gaApp?.addEventListener('change',e=>{
 const x=e.target.closest('[data-ga-select]');if(!x)return;
 if(!['checkTurnus','checkStatus','qualTurnus','memberTurnus'].includes(x.dataset.gaSelect))return;
 if(x.dataset.gaSelect==='checkTurnus')GA_CHECK_TURNUS=x.value;
 if(x.dataset.gaSelect==='checkStatus')GA_CHECK_STATUS=x.value;
 if(x.dataset.gaSelect==='qualTurnus')GA_QUAL_TURNUS=x.value;
 if(x.dataset.gaSelect==='memberTurnus')GA_MEM_TURNUS=x.value;
 render();
});
document.getElementById('gaOpenMenu')?.addEventListener('click',()=>document.body.classList.toggle('ga-nav-open'));
document.getElementById('gaBackdrop')?.addEventListener('click',()=>document.body.classList.remove('ga-nav-open'));


/* Zugang und Rollenverwaltung – V1.8: vorhandene Konten weiterverwenden */
let GA_USER_QUERY='',GA_USER_ROLE='',GA_USER_LIMIT=40,GA_SELECTED_USER='';
let GA_RIGHTS_FOCUS='';
function gaUserRoleSelect(current,attr){
 return '<select '+attr+'>'+['Teilnehmer','Ausbilder','Fachverwaltung','Organisator Erweiterte Ausbildung','Administrator'].map(r=>
  '<option value="'+r+'" '+(r===current?'selected':'')+'>'+r+'</option>').join('')+'</select>';
}
function gaAccountForm(u){
 if(!STATE.kontoBearbeitung)return '<p class="notice">Für Name, E-Mail, Standesbuchnummer und Zugangssperre zuerst Code.gs 1.13.15 aktualisieren.</p>';
 const member=(STATE.mitglieder||[]).find(m=>m.ID===u.MitgliedID||String(m.Email||'').toLowerCase()===String(u.Email||'').toLowerCase()),participant=u.Rolle==='Teilnehmer';
 return '<form data-form="accountEdit"><input type="hidden" name="BenutzerID" value="'+h(u.ID)+'"><div class="grid">'+
 (participant?'<label>Vorname<input name="Vorname" required maxlength="100" value="'+h(member?.Vorname||'')+'"></label><label>Nachname<input name="Nachname" required maxlength="100" value="'+h(member?.Nachname||'')+'"></label>':'<label>Name<input name="Name" required maxlength="140" value="'+h(u.Name)+'"></label>')+
 '<label>E-Mail / Login<input name="Email" required type="email" maxlength="240" value="'+h(u.Email)+'"></label>'+
 (!participant?'<label>Dauerhafte Standesbuchnummer<input name="Standesbuchnummer" maxlength="35" value="'+h(u.Standesbuchnummer||'')+'" placeholder="Stb.-Nr. für Tätigkeitsberichte"></label>':'')+
 '<label>Zugangsstatus<select name="Aktiv"><option value="JA" '+(u.Aktiv==='JA'?'selected':'')+' '+(u.Aktiv!=='JA'&&!u.KannAktiviertWerden?'disabled':'')+'>Aktiv</option><option value="NEIN" '+(u.Aktiv!=='JA'?'selected':'')+'>Inaktiv / gesperrt</option></select></label></div>'+
 '<p class="small muted">E-Mail-Änderungen werden bei einem eindeutig verknüpften Mitglied mitgeführt. Passwort, ursprünglicher Turnus, Kurse, Quiz und Nachweise bleiben erhalten. Deaktivieren sperrt nur den Zugang.</p>'+
 (u.Aktiv!=='JA'&&!u.KannAktiviertWerden?'<p class="notice">Dieser Zugang muss zuerst über einen Einladungslink aktiviert werden.</p>':'')+
 '<button type="submit" class="primary">Zugangsdaten speichern</button></form>';
}
function gaUserEdit(u){
 const roles=['Zeugkammer','Administration','IT','Ausbildungsleitung'],admin=role()==='Administrator';
 return '<section class="panel ga-person-detail"><div class="row between"><div><p class="ga-eyebrow">BESTEHENDER ZUGANG</p><h2>'+h(u.Name)+'</h2><p class="muted">'+h(u.Email)+'</p></div>'+
 '<button type="button" class="secondary" '+(admin?'data-ga-close-user="1"':'data-adv-account-close')+'>Schließen</button></div>'+gaAccountForm(u)+
 (admin?'<details class="ga-member-fold"><summary>Rolle und Fachbereich ändern</summary><div class="ga-fold-body"><form data-form="roleChange"><input type="hidden" name="BenutzerID" value="'+h(u.ID)+'">'+
 '<div class="grid"><div><label>Hauptrolle</label>'+gaUserRoleSelect(u.Rolle,'name="Rolle" data-ga-user-role="1"')+'</div><div><label>Zuständigkeit für Fachverwaltung</label><select name="Bereich"><option value="">Keine</option>'+roles.map(r=>'<option '+(r===u.Bereich?'selected':'')+'>'+r+'</option>').join('')+'</select></div></div><button type="submit" class="primary">Rolle und Fachbereich speichern</button></form></div></details>':'')+
 (u.Aktiv==='JA'?'<div class="ga-account-reset"><h3>Passwort</h3><p class="muted small">Einmaligen Reset-Link an die hinterlegte E-Mail-Adresse senden.</p><button type="button" class="secondary" data-reset-password="'+h(u.ID)+'">Passwort-Reset per E-Mail senden</button></div>':!u.KannAktiviertWerden?'<div class="ga-account-reset"><button type="button" class="secondary" data-account-invite="'+h(u.ID)+'">Einladungslink erneut senden</button></div>':'')+
 (admin&&u.Rolle==='Ausbilder'?'<div class="ga-account-reset"><button type="button" class="secondary" data-go-rights="'+h(u.ID)+'">Ausbilderrechte öffnen</button></div>':'')+'</section>';
}
function users(){
 const all=STATE.benutzer||[],members=STATE.mitglieder||[];
 const filtered=all.filter(u=>(!GA_USER_ROLE||u.Rolle===GA_USER_ROLE)&&(!GA_USER_QUERY||gaMatches(u.Name+' '+u.Email+' '+u.Rolle,GA_USER_QUERY)));
 const selected=all.find(u=>u.ID===GA_SELECTED_USER);
 const list=filtered.slice(0,GA_USER_LIMIT).map(u=>{
  const hasMember=members.some(m=>String(m.Email||'').toLowerCase()===String(u.Email||'').toLowerCase());
  return '<button type="button" class="ga-admin-person'+(u.ID===GA_SELECTED_USER?' selected':'')+'" data-ga-user="'+h(u.ID)+'">'+
   '<span><strong>'+h(u.Name)+'</strong><small>'+h(u.Email)+' · '+(hasMember?'Mitgliedsprofil vorhanden':'Ohne Mitgliedsprofil')+'</small></span>'+
   '<span class="tag '+(u.Aktiv==='JA'?'ok':'warn')+'">'+h(u.Rolle)+'</span><span>›</span></button>';
 }).join('');
 const invite='<details class="ga-member-fold ga-admin-bottom"><summary>Neuen Zugang einladen – nur wenn noch kein Benutzer existiert</summary>'+
 '<div class="ga-fold-body"><p class="muted small">Ist die E-Mail bereits vorhanden, verwende oben „Rolle ändern“. Es ist kein zweiter Account erforderlich.</p>'+
 '<form data-form="user"><div class="grid">'+
 '<div><label>Name</label><input name="Name" required maxlength="140"></div>'+
 '<div><label>E-Mail-Adresse</label><input name="Email" type="email" required></div>'+
 '<div><label>Rolle</label>'+gaUserRoleSelect('Teilnehmer','name="Rolle"')+'</div>'+
 '<div><label>Fachbereich (wenn Fachverwaltung)</label><select name="Bereich"><option value="">Keine</option>'+
 ['Zeugkammer','Administration','IT','Ausbildungsleitung'].map(x=>'<option>'+x+'</option>').join('')+'</select></div>'+
 '</div><p class="small muted">Der neue Benutzer erhält einen Einladungslink und legt sein Passwort selbst fest.</p>'+
 '<button type="submit" class="primary">Einladung versenden</button></form></div></details>';
 return '<div class="ga-page-heading"><div><h2>Zugänge & Rollen</h2>'+
 '<p>Bestehenden Zugang hochstufen, Zuständigkeiten festlegen und Passwörter zurücksetzen.</p></div></div>'+
 '<div class="ga-kpis">'+gaMetric(all.filter(x=>x.Aktiv==='JA').length,'Aktive Zugänge','')+
 gaMetric(all.filter(x=>x.Rolle==='Ausbilder').length,'Ausbilder','')+
 gaMetric(all.filter(x=>x.Rolle==='Fachverwaltung').length,'Fachverwaltung','')+'</div>'+
 '<section class="panel"><h2>Benutzer suchen</h2><div class="ga-admin-toolbar"><div><label>Suche nach Name oder E-Mail</label>'+
 '<input type="search" data-ga-search="user" value="'+h(GA_USER_QUERY)+'" placeholder="Mitglied oder Benutzer suchen"></div>'+
 '<div><label>Hauptrolle filtern</label><select data-ga-select="userRole"><option value="">Alle Rollen</option>'+
 ['Teilnehmer','Ausbilder','Fachverwaltung','Organisator Erweiterte Ausbildung','Administrator'].map(role=>'<option value="'+role+'" '+(GA_USER_ROLE===role?'selected':'')+'>'+role+'</option>').join('')+
 '</select></div></div><div class="ga-admin-split"><div class="ga-person-list">'+
 (list||gaNotice('Kein Benutzer gefunden.'))+
 (filtered.length>GA_USER_LIMIT?'<button type="button" class="secondary full" data-ga-more="user">Weitere Zugänge anzeigen</button>':'')+
 '<p class="small muted">'+filtered.length+' Benutzer passen zum Filter</p></div>'+
 (selected?gaUserEdit(selected):'<section class="panel ga-admin-placeholder"><h2>Zugang auswählen</h2>'+
 '<p>Wähle eine Person aus, um Rolle, Fachbereich und Passwort zurückzusetzen.</p></section>')+'</div></section>'+invite;
}
gaApp?.addEventListener('click',event=>{
 const x=event.target.closest('[data-go-rights]');
 if(!x)return;
 GA_RIGHTS_FOCUS=x.dataset.goRights;
 VIEW='rights';FORM='';EDIT=null;render();
});
gaApp?.addEventListener('click',event=>{
 const x=event.target.closest('[data-ga-user],[data-ga-close-user]');
 if(!x)return;
 if(x.dataset.gaUser){GA_SELECTED_USER=x.dataset.gaUser;render();return;}
 GA_SELECTED_USER='';render();
});
gaApp?.addEventListener('input',event=>{
 const x=event.target.closest('[data-ga-search="user"]');if(!x)return;
 GA_USER_QUERY=x.value;GA_USER_LIMIT=40;
 const caret=x.selectionStart;render();
 const next=document.querySelector('[data-ga-search="user"]');
 if(next){next.focus();try{next.setSelectionRange(caret,caret);}catch(_){}}
});
gaApp?.addEventListener('change',event=>{
 const x=event.target.closest('[data-ga-select="userRole"]');if(!x)return;
 GA_USER_ROLE=x.value;GA_USER_LIMIT=40;render();
});
gaApp?.addEventListener('click',event=>{
 const x=event.target.closest('[data-ga-more="user"]');if(!x)return;
 GA_USER_LIMIT+=40;render();
});

// Fehlerhafte Sendungen nur nach ausdrücklicher Prüfung erneut anstoßen.
gaApp?.addEventListener('click',async e=>{
 const button=e.target.closest('[data-admin-mail-retry]');if(!button)return;
 if(role()!=='Administrator'||GA_ROLE_PREVIEW)return;
 if(!confirm('Vor erneutem Versand bitte den Posteingang prüfen: Bei unklarem Versandstatus könnte die Mail bereits angekommen sein. Jetzt an den aktuell hinterlegten Empfänger erneut versuchen?'))return;
 button.disabled=true;
 try{const result=await api('retryAdminMail',{ID:button.dataset.adminMailRetry});tip(result.message);await reload();}
 catch(error){tip(error.message||'Versand nicht möglich.',true);}finally{button.disabled=false;}
});

gaApp?.addEventListener('click',async e=>{
 const b=e.target.closest('[data-check-item-edit],[data-check-item-cancel],[data-check-item-active]');if(!b||role()!=='Administrator')return;
 if(b.dataset.checkItemEdit){GA_CHECK_ITEM_EDIT=b.dataset.checkItemEdit;render();return;}
 if(b.hasAttribute('data-check-item-cancel')){GA_CHECK_ITEM_EDIT='';render();return;}
 if(GA_ROLE_PREVIEW){tip('Die Rollenvorschau ist schreibgeschützt.',true);return;}
 const point=by(STATE.checklistenpunkte,b.dataset.checkItemActive);if(!point)return;
 const active=b.dataset.active==='JA';
 if(!confirm(active?'„'+point.Titel+'“ wiederherstellen? Bestehende Erledigungen bleiben erhalten.':'„'+point.Titel+'“ aus den aktiven Checklisten entfernen? Der Punkt zählt danach nicht mehr als offene Aufgabe. Alle Erledigungen und Notizen bleiben im Archiv erhalten.'))return;
 b.disabled=true;try{const result=await api('setChecklistItemActive',{ID:point.ID,Aktiv:active?'JA':'NEIN'});GA_CHECK_ITEM_EDIT='';tip(result.message);await reload();}
 catch(error){tip(error.message||'Checklistenpunkt konnte nicht geändert werden.',true);}finally{b.disabled=false;}
});

gaApp?.addEventListener('click',async e=>{
 const button=e.target.closest('[data-renew-checklist-mail]');if(!button||role()!=='Administrator'||GA_ROLE_PREVIEW)return;
 if(!confirm('Eine neue Mail mit persönlichen Bestätigungslinks an die aktuell hinterlegten Empfänger senden? Alte Links dieser Mail werden dadurch ungültig. Bereits erledigte Aufgaben werden nicht zurückgesetzt.'))return;
 button.disabled=true;try{const result=await api('renewChecklistMail',{ID:button.dataset.renewChecklistMail});tip(result.message);await reload();}
 catch(error){tip(error.message||'Neue Links konnten nicht versendet werden.',true);}finally{button.disabled=false;}
});

document.getElementById('app')?.addEventListener('click',async event=>{
 const b=event.target.closest('[data-revoke-adv-transfer]');if(!b)return;
 if(role()!=='Administrator'||GA_ROLE_PREVIEW)return tip('Nur der Oberadmin kann Verwaltungsrechte zurückholen.',true);
 if(!confirm('Die erweiterte Mitgliedsverwaltung zurückholen? Kurszuordnungen und Ausbildungsnachweise bleiben erhalten.'))return;
 b.disabled=true;try{const r=await api('revokeAdvancedTransfer',{MitgliedID:b.dataset.revokeAdvTransfer,Bestaetigt:true});tip(r.message);await reload();}catch(e){tip(e.message,true);}finally{b.disabled=false;}
});

document.getElementById('app')?.addEventListener('click',async event=>{
 const b=event.target.closest('[data-account-invite]');if(!b)return;
 if(GA_ROLE_PREVIEW)return tip('Die Rollenvorschau ist schreibgeschützt.',true);
 const u=(role()==='Administrator'?STATE.benutzer:STATE.verwalteteZugaenge||[]).find(u=>u.ID===b.dataset.accountInvite);if(!u)return;
 if(!confirm('Einladungslink an '+u.Email+' senden?'))return;
 b.disabled=true;try{const d=role()==='Administrator'?{Name:u.Name,Email:u.Email,Rolle:u.Rolle,Bereich:u.Bereich}:{MitgliedID:u.MitgliedID,Rolle:'Teilnehmer'};const r=await api('inviteUser',d);tip(r.message||'Einladung versendet.');await reload();}catch(e){tip(e.message,true);}finally{b.disabled=false;}
});
