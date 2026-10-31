/* Grundausbildung V1.7 – skalierbare Verwaltungsoberflächen */
'use strict';
let GA_CHECK_QUERY='',GA_CHECK_TURNUS='',GA_CHECK_STATUS='Offen',GA_CHECK_PERSON='',GA_CHECK_LIMIT=30;
let GA_QUAL_QUERY='',GA_QUAL_TURNUS='',GA_QUAL_PERSON='',GA_QUAL_LIMIT=30;
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
  ['Organisation',['rights','reports','messages','pushadmin']]
 ]:organizer?[
  ['Start',['advOverview','notifications']],
  ['Erweiterte Ausbildung',['advMembers','advInvite','courses','projects','quizzes','terms','turnus','advQual']],
  ['Durchführung & FDISK',['attendance','trainingReports','freeActivities']],
  ['Auswertung & Kommunikation',['questionnaires','reviews','messages','reports']]
 ]:trainer?[
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
function overview(){
 const members=(STATE.mitglieder||[]).filter(m=>m.Aktiv==='JA');
 const qs=STATE.qualifikationen||[],pending=(STATE.kursProjekte||[]).filter(p=>p.Status==='Zur Prüfung');
 const activeMemberIds=new Set(members.map(m=>m.ID));
 const checks=(STATE.checks||[]).filter(c=>activeMemberIds.has(c.MitgliedID)&&c.Status==='Offen');
 const openMembers=new Set(checks.map(c=>c.MitgliedID));
 const qbad=qs.filter(q=>!q.GABAbgeschlossen).length,good=qs.filter(q=>q.GABAbgeschlossen).length;
 const due=(STATE.termine||[]).filter(t=>gaTrainingUpcoming(t)).sort((a,b)=>gaTrainingTimestamp(a.Beginn)-gaTrainingTimestamp(b.Beginn)).slice(0,4);
 const attention=qs.filter(q=>!q.GABAbgeschlossen||q.ErsteHilfeStatus!=='Bestätigt').slice(0,6);
 const shortcuts=[
 ['members','Teilnehmer verwalten','users-round'],['checks','Checklisten bearbeiten','list-checks'],['qualifications','GAB & Qualifikationen','award'],['projects','Module zur Kontrolle','clipboard-check'],['terms','Ausbildungstermine','calendar-days']
 ];
 return '<div class="ga-admin-intro"><div><span>FEUERWEHR ST. PÖLTEN-STADT</span><h2>Ausbildung im Überblick</h2>'+
 '<p>Die wichtigsten offenen Punkte und Ausbildungsstände – ohne endlose Tabellen.</p></div><span class="ga-dashboard-count">'+members.length+' aktive Mitglieder</span></div>'+
 '<div class="ga-kpis">'+gaMetric(good,'GAB bestätigt','Abgeschlossen')+gaMetric(qbad,'GAB noch offen','Freigabe prüfen')+
 gaMetric(openMembers.size,'Mitglieder mit Aufgaben',checks.length+' offene Checklistenpunkte')+
 gaMetric(pending.length,'Module zur Prüfung','Freigaben ausständig')+'</div>'+
 '<section class="panel"><h2>Schnellzugriff</h2><div class="ga-action-grid">'+shortcuts.map(x=>'<button type="button" data-view="'+x[0]+'">'+h(x[1])+'<span>Öffnen ›</span></button>').join('')+'</div></section>'+
 '<div class="ga-admin-two"><section class="panel"><div class="row between"><h2>Ausbildungsstand prüfen</h2><button type="button" data-view="qualifications" class="smallbtn">Alle ansehen</button></div>'+
 (attention.length?attention.map(q=>'<div class="ga-dense-row"><div><strong>'+h(q.Name)+'</strong><small>'+h(q.GABAbgeschlossen?'GAB bestätigt · Erste Hilfe prüfen':q.GABHinweis||'GAB offen')+'</small></div>'+
 '<button type="button" class="smallbtn" data-go-qual="'+h(q.MitgliedID)+'">Ansehen</button></div>').join(''):'<p class="muted">Keine offenen Hinweise bei den aktiven Mitgliedern.</p>')+'</section>'+
 '<section class="panel"><div class="row between"><h2>Nächste Ausbildungen</h2><button type="button" data-view="terms" class="smallbtn">Termine öffnen</button></div>'+
 (due.length?due.map(t=>'<div class="ga-dense-row"><div><strong>'+h(by(STATE.kurse,t.KursID)?.Titel||'Kurs')+'</strong>'+
 '<small>'+dt(t.Beginn)+' · '+h(t.Ort||'Ort folgt')+'</small></div></div>').join(''):'<p class="muted">Derzeit sind keine kommenden Termine eingetragen.</p>')+'</section></div>';
}
function gaCheckSelect(row){
 return '<form data-form="check" data-id="'+h(row.ID)+'" class="ga-task-form"><div><strong>'+h(by(STATE.checklistenpunkte,row.PunktID)?.Titel||'Checklistenpunkt')+'</strong>'+
 '<small>'+h(by(STATE.checklistenpunkte,row.PunktID)?.Zustaendig||'')+'</small></div>'+
 '<div><label>Status</label><select name="Status">'+selectStatus(row.Status)+'</select></div>'+
 '<div><label>Notiz</label><input name="Kommentar" maxlength="500" value="'+h(row.Kommentar||'')+'"></div>'+
 '<button type="submit" class="smallbtn">Speichern</button></form>';
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
 '<details class="ga-member-fold ga-admin-bottom"><summary>Neuen Checklistenpunkt anlegen</summary><div class="ga-fold-body">'+
 '<form data-form="checkItem" class="grid"><div><label>Bezeichnung</label><input name="Titel" required placeholder="z. B. Bekleidung erhalten"></div>'+
 '<div><label>Ausbildungsbereich</label><select name="Bereich"><option value="Alle">Alle</option>'+areaOptions()+'</select></div>'+
 '<div><label>Zuständig</label><select name="Zustaendig"><option>Zeugkammer</option><option>Administration</option><option>IT</option><option>Ausbildungsleitung</option></select></div>'+
 '<div><button class="primary" type="submit">Anlegen</button></div></form></div></details>';
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
 '<button type="button" class="secondary" data-view="qualifications">Zurück zu Qualifikationen</button></div>'+
 '<div class="ga-kpis">'+gaMetric(qs.length,'Teilnehmer','In der Qualifikationsübersicht')+
 gaMetric(completedA,'Block A bestätigt','Abschnittsmodul')+
 gaMetric(completedB,'Block B inkl. ASMTRM','Positiv abgeschlossen')+'</div>'+alerts+
 '<section class="panel"><h2>Teilnehmer auswählen</h2>'+controls+
 '<div class="ga-admin-split"><div class="ga-person-list">'+(list||gaNotice('Keine passenden Teilnehmer gefunden.'))+
 (filtered.length>GA_QUAL_LIMIT?'<button type="button" class="secondary full" data-ga-more="qual">Weitere Teilnehmer anzeigen</button>':'')+
 '<p class="small muted">'+filtered.length+' Teilnehmer in der Auswahl</p></div>'+detail+'</div></section>';
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
 gaExternalBlockForms(q)+
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
 '<button type="button" class="primary" data-ga-add-member="1">+ Mitglied aufnehmen</button></div>'+
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
function gaUserEdit(u){
 const roles=['Zeugkammer','Administration','IT','Ausbildungsleitung'];
 return '<section class="panel ga-person-detail"><div class="row between"><div><p class="ga-eyebrow">BESTEHENDER ZUGANG</p>'+
 '<h2>'+h(u.Name)+'</h2><p class="muted">'+h(u.Email)+'</p></div>'+
 '<button type="button" class="secondary" data-ga-close-user="1">Schließen</button></div>'+
 '<p class="small muted">Du änderst nur die Benutzerrolle. Passwort, Login-Adresse, Mitgliedsprofil und Ausbildungsnachweise bleiben erhalten.</p>'+
 '<form data-form="roleChange"><input type="hidden" name="BenutzerID" value="'+h(u.ID)+'">'+
 '<div class="grid"><div><label>Hauptrolle</label>'+gaUserRoleSelect(u.Rolle,'name="Rolle" data-ga-user-role="1"')+'</div>'+
 '<div><label>Zuständigkeit für Fachverwaltung</label><select name="Bereich">'+
 '<option value="">Keine</option>'+roles.map(r=>'<option '+(r===u.Bereich?'selected':'')+'>'+r+'</option>').join('')+'</select>'+
 '<p class="small muted">Nur für Fachverwaltung erforderlich; z. B. Zeugkammer oder IT.</p></div></div>'+
 '<div class="ga-alert">Ein Rollenwechsel gilt für die bestehenden Anmeldungen und wird protokolliert. Ausbildungsnachweise werden nicht gelöscht.</div>'+
 '<div class="btnline"><button class="primary" type="submit">Rolle und Fachbereich speichern</button></div></form>'+
 '<div class="ga-account-reset"><h3>Passwort</h3><p class="muted small">Wenn das Passwort vergessen wurde, sende einen einmaligen Reset-Link. Der Benutzer legt sein neues Passwort selbst fest (30 Minuten gültig).</p>'+
 '<button type="button" class="secondary" data-reset-password="'+h(u.ID)+'">Passwort-Reset per E-Mail senden</button></div>'+
 (u.Rolle==='Ausbilder'?'<div class="ga-account-reset"><h3>Ausbilderrechte</h3><p class="small muted">Berechtigungen zum Anlegen, Freigeben und Bearbeiten von Kursen legst du separat fest.</p>'+
 '<button type="button" class="secondary" data-go-rights="'+h(u.ID)+'">Ausbilderrechte für diese Person öffnen</button></div>':'')+'</section>';
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
