/* Organisator Erweiterte Ausbildung – getrennte Verwaltungsansichten V1.11 */
'use strict';
const GA_ORG_ROLE='Organisator Erweiterte Ausbildung';
let GA_ORG_MEMBER_EDIT='',GA_ORG_ACCOUNT_EDIT='';
function gaOrganizerOverview(now=Date.now()){
 const members=(STATE.mitglieder||[]).filter(m=>m.Aktiv==='JA');
 const readyKnown=Array.isArray(STATE.gabAbgeschlossen);
 const ready=readyKnown?STATE.gabAbgeschlossen.filter(m=>m.VerwaltungUeberstellt===undefined?!m.ErweiterteTurnusIDs?.length:!m.VerwaltungUeberstellt):[];
 const upcoming=gaHomeUpcoming(now),unread=(STATE.benachrichtigungen||[]).filter(n=>!n.GelesenAm);
 const pending=(STATE.kursProjekte||[]).filter(p=>p.Status==='Zur Prüfung');
 const reports=(STATE.meldungen||[]).filter(m=>['Offen','In Bearbeitung'].includes(m.Status));
 const first=String(STATE.user?.Name||'').trim().split(/\s+/)[0]||'Ausbildungsleitung';
 const shortcuts=[['advReady','🎓','GAB-Absolventen','Abschlüsse und Übergaben ansehen'],
  ['advMembers','👥','Teilnehmer & GAB-Gäste','Personen zusätzlich zuordnen'],
  ['terms','📅','Termine planen','Erweiterte Ausbildungen verwalten'],
  ['attendance','🚒','Ausbildung durchführen','Kurse öffnen und Anwesenheit erfassen'],
  ['courses','📚','Erweiterter Kurskatalog','Module, Inhalte und Unterlagen'],
  ['projects','📝','Kursprojekte','Module bearbeiten und freigeben'],
  ['quizzes','✅','Quizverwaltung','Wissenstests und Ergebnisse'],
  ['messages','✉️','Nachrichten','Zugeordnete Teilnehmer informieren']];
 const more=[['advInvite','📨','Teilnehmer einladen','App-Zugang einrichten'],
  ['advQual','🏅','Qualifikationen','Erweiterte Module und Abschlüsse'],
  ['turnus','🗓️','Erweiterte Turnusse','Ausbildungsgruppen verwalten'],
  ['trainingReports','📊','Tätigkeitsberichte','Berichte und FDISK-Auszüge'],
  ['freeActivities','🔧','Freie Tätigkeiten','Diensttätigkeiten dokumentieren'],
  ['questionnaires','📋','Bewertungsfragebögen','Fragen gestalten'],
  ['reviews','⭐','Kursbewertungen','Rückmeldungen ansehen'],
  ['reports','💡','Mängel & Ideen','Rückmeldungen bearbeiten']];
 const people=ready.slice().sort((a,b)=>String(a.Nachname||'').localeCompare(String(b.Nachname||''),'de')).slice(0,4)
  .map(m=>'<div class="ga-trainer-module"><span class="ga-home-person-icon" aria-hidden="true">🎓</span><div><strong>'+h([m.Vorname,m.Nachname].filter(Boolean).join(' '))+
   '</strong><small>GAB abgeschlossen · Verwaltungsübergabe durch Oberadmin offen</small></div></div>').join('');
 const readyText=!readyKnown?'Die Übersicht ist mit dem aktuell verbundenen Backend noch nicht verfügbar.':
  !ready.length?'Derzeit warten keine GAB-Absolventen auf eine Zuordnung.':'';
 return '<div class="ga-trainer-home ga-lead-home"><section class="ga-trainer-hero"><div><p class="ga-trainer-eyebrow">FEUERWEHR ST. PÖLTEN-STADT · ERWEITERTE AUSBILDUNG</p>'+
  '<h2>Servus, '+h(first)+'!</h2><p>Deine Teilnehmer, Module und Termine für die erweiterte Ausbildung auf einen Blick.</p>'+
  '<button type="button" class="ga-trainer-hero-button" data-view="advMembers">Teilnehmer verwalten <span aria-hidden="true">→</span></button></div>'+
  '<div class="ga-trainer-hero-mark" aria-hidden="true">🚒</div></section>'+
  '<div class="ga-trainer-stats ga-home-stats">'+gaHomeStat(members.length,'Aktive Teilnehmer','Inklusive zugeordneter GAB-Gäste')+
  gaHomeStat(readyKnown?ready.length:'–','GAB zur Übergabe',readyKnown?'Abgeschlossen, Überstellung offen':'Derzeit nicht verfügbar')+
  gaHomeStat(upcoming.length,'Kommende Termine','Erweiterte Ausbildung')+
  gaHomeStat(unread.length,'Ungelesene Mitteilungen','Unter deinen letzten 100')+'</div>'+
  '<section class="ga-trainer-panel"><div class="ga-trainer-panel-head"><div><p class="ga-trainer-kicker">SCHNELLZUGRIFF</p><h2>Was möchtest du tun?</h2></div></div>'+
  '<div class="ga-trainer-shortcuts">'+gaHomeShortcuts(shortcuts)+'</div><details class="ga-home-more"><summary>Weitere Funktionen anzeigen</summary><div class="ga-trainer-shortcuts">'+gaHomeShortcuts(more)+'</div></details></section>'+
  '<section class="ga-trainer-panel"><div class="ga-trainer-panel-head"><div><p class="ga-trainer-kicker">AUSBILDUNGSPLAN</p><h2>Nächste Termine</h2><p>Geplante Kurse der erweiterten Ausbildung.</p></div><button type="button" class="smallbtn" data-view="terms">Alle öffnen</button></div>'+
  gaHomeAppointments(upcoming)+(upcoming.length>4?'<p class="ga-trainer-footnote">'+h(upcoming.length-4)+' weitere geplante Termine.</p>':'')+'</section>'+
  '<div class="ga-trainer-columns"><section class="ga-trainer-panel"><div class="ga-trainer-panel-head"><div><p class="ga-trainer-kicker">ÜBERGABE AUS DER GAB</p><h2>GAB-Absolventen</h2><p>'+h(readyKnown?ready.length+' noch ohne Verwaltungsfreigabe':'Übersicht derzeit nicht verfügbar')+'</p></div><button type="button" class="smallbtn" data-view="advReady">Alle ansehen</button></div>'+
  (people||'<p class="ga-trainer-empty">'+h(readyText)+'</p>')+
  (ready.length>4?'<p class="ga-trainer-footnote">'+h(ready.length-4)+' weitere Personen in der Übersicht.</p>':'')+'</section>'+
  '<section class="ga-trainer-panel"><div class="ga-trainer-panel-head"><div><p class="ga-trainer-kicker">FÜR DICH</p><h2>Benachrichtigungen</h2><p>'+h(unread.length)+' ungelesen · letzte 100 Mitteilungen</p></div><button type="button" class="smallbtn" data-view="notifications">Alle öffnen</button></div>'+
  gaHomeNoticeList(unread)+'</section>'+
  '<section class="ga-trainer-panel"><div class="ga-trainer-panel-head"><div><p class="ga-trainer-kicker">ERWEITERTE AUSBILDUNG</p><h2>Offene Aufgaben</h2><p>Projekte und Rückmeldungen in deinem Bereich.</p></div></div><div class="ga-home-tasks">'+
  gaHomeTask('projects',pending.length,'Kursprojekte','Zur Prüfung eingereicht')+
  gaHomeTask('reports',reports.length,'Mängel & Ideen','Offen oder in Bearbeitung')+'</div></section></div></div>';
}
function gaOrganizerReady(){
 if(!Array.isArray(STATE.gabAbgeschlossen))return '<section class="panel"><h2>GAB-Absolventen</h2><p>Für diese Übersicht bitte zuerst Code.gs 1.13.3 in der bestehenden Apps-Script-Bereitstellung aktualisieren.</p></section>';
 const turns=STATE.turnusse||[],active=turns.filter(t=>t.Aktiv==='JA');
 const opts=active.map(t=>'<option value="'+h(t.ID)+'">'+h(t.Bezeichnung)+'</option>').join('');
 const people=[...STATE.gabAbgeschlossen].sort((a,b)=>(a.Nachname+' '+a.Vorname).localeCompare(b.Nachname+' '+b.Vorname,'de'));
 const cards=people.map(m=>{
  const ids=m.ErweiterteTurnusIDs||[],assigned=ids.map(id=>turns.find(t=>t.ID===id)?.Bezeichnung||'Erweiterter Turnus');
  return '<section class="panel"><div class="row between"><strong>'+h(m.Vorname+' '+m.Nachname)+'</strong><span class="tag '+(ids.length?'ok':'warn')+'">'+
   (m.VerwaltungUeberstellt?'Verwaltung vom Oberadmin übergeben':ids.length?'Als Gast zugeordnet · Überstellung offen':'Noch nicht zugeordnet')+'</span></div>'+
   (assigned.length?'<p class="small muted">'+h(assigned.join(', '))+'</p>':'')+
   (active.length&&!m.VerwaltungUeberstellt?'<form data-form="advEnroll"><input type="hidden" name="MitgliedID" value="'+h(m.ID)+'">'+
    '<label>Erweiterter Turnus<select name="TurnusID" required><option value="">Turnus auswählen</option>'+opts+'</select></label>'+
    '<button type="submit" class="primary">'+(ids.length?'Weiteren Turnus zuordnen':'Zur erweiterten Ausbildung zuordnen')+'</button></form>':
    (m.VerwaltungUeberstellt?'<p class="small muted">Die Mitgliedsverwaltung wurde freigegeben. Stammdaten unter Teilnehmer & Gäste bearbeiten.</p>':'<p class="small muted">Bitte zuerst einen aktiven erweiterten Turnus anlegen.</p>'))+'</section>';
 }).join('');
 return '<div class="ga-page-heading"><div><h2>GAB-Absolventen</h2><p>Personen mit bestätigtem GAB-Abschluss. Eine zusätzliche Zuordnung erhält ihren ursprünglichen GAB-Turnus und alle Nachweise.</p></div></div>'+
  (cards||'<section class="panel"><p class="muted">Derzeit sind keine abgeschlossenen GAB-Mitglieder vorhanden.</p></section>');
}
function gaOrganizerMembers(){
 const turnusse=(STATE.turnusse||[]).filter(x=>x.Aktiv==='JA');
 const everyone=STATE.gabNamen||[],members=STATE.mitglieder||[],edit=members.find(m=>m.ID===GA_ORG_MEMBER_EDIT&&m.VerwaltungErweitert);
 const editOpts=turnusse.map(t=>'<option value="'+h(t.ID)+'" '+(edit?.TurnusID===t.ID?'selected':'')+'>'+h(t.Bezeichnung)+'</option>').join('');
 const opts=turnusse.map(t=>'<option value="'+h(t.ID)+'">'+h(t.Bezeichnung)+'</option>').join('');
 return '<div class="ga-page-heading"><div><h2>Teilnehmer & GAB-Gäste</h2><p>GAB-Mitglieder bleiben in ihrem bisherigen Turnus und können trotzdem erweiterte Module besuchen.</p></div></div>'+
 '<section class="panel"><h3>GAB-Mitglied zusätzlich aufnehmen</h3>'+
 '<p class="small muted">Hier werden von der GAB Namen angezeigt. Unter „GAB-Absolventen“ siehst du zusätzlich, wer die GAB abgeschlossen hat; Kontaktdaten und einzelne Nachweise bleiben verborgen.</p>'+
 '<form data-form="advEnroll"><div class="grid"><label>GAB-Mitglied<select name="MitgliedID" required><option value="">Mitglied auswählen</option>'+
 everyone.map(m=>'<option value="'+h(m.ID)+'">'+h(m.Nachname+', '+m.Vorname)+'</option>').join('')+'</select></label>'+
 '<label>Erweiterter Turnus<select name="TurnusID" required><option value="">Turnus auswählen</option>'+opts+'</select></label></div>'+
 '<button class="primary" type="submit">Für erweiterte Ausbildung zuordnen</button></form></section>'+
 '<section class="panel" id="gaOrgMemberEditor"><h3>'+ (edit?'Mitglied bearbeiten: '+h(name(edit)):'Neues Mitglied nur für die erweiterte Ausbildung anlegen')+'</h3>'+
 (edit?.GABUeberstellt?'<p class="notice">Durch den Oberadmin überstellt. Du verwaltest jetzt die Stammdaten und erweiterte Ausbildung; ursprünglicher GAB-Turnus und GAB-Ergebnisse bleiben geschützt.</p>':'')+
 '<form data-form="advMember">'+(edit?'<input type="hidden" name="ID" value="'+h(edit.ID)+'">':'')+'<div class="grid">'+
 '<label>Vorname<input name="Vorname" required maxlength="100" value="'+h(edit?.Vorname||'')+'"></label>'+
 '<label>Nachname<input name="Nachname" required maxlength="100" value="'+h(edit?.Nachname||'')+'"></label>'+
 '<label>E-Mail / Teilnehmerzugang<input name="Email" type="email" value="'+h(edit?.Email||'')+'"></label>'+
 '<label>Telefon<input name="Telefon" value="'+h(edit?.Telefon||'')+'"></label>'+
 '<label>Geburtsdatum<input name="Geburtsdatum" type="date" value="'+h(edit?.Geburtsdatum||'')+'"></label>'+
 '<label>Standesbuchnummer<input name="Standesbuchnummer" value="'+h(edit?.Standesbuchnummer||'')+'"></label>'+
 '<label>Erweiterter Turnus<select name="TurnusID" required><option value="">Turnus auswählen</option>'+editOpts+'</select></label></div>'+
 (edit?'<p class="small muted">Eine geänderte E-Mail wird auch für den verknüpften Teilnehmerzugang übernommen. Passwort und Ausbildungsnachweise bleiben erhalten.</p>':'')+
 gaTransponderFields(edit)+gaPagerFields(edit)+gaBlaulichtFields(edit)+gaZeugkammerFields(edit)+
 '<button type="submit" class="primary">'+(edit?'Änderungen speichern':'Mitglied anlegen')+'</button>'+ (edit?'<button type="button" class="secondary" data-adv-edit-close>Schließen</button>':'')+'</form></section>'+
 '<section class="panel"><h3>Meine erweiterten Teilnehmer ('+members.length+')</h3>'+
 '<div class="ga-organizer-roster">'+members.map(m=>'<div><b>'+h(m.Nachname+', '+m.Vorname)+'</b>'+
 '<span class="tag '+(m.Ausbildungsweg==='GAB-Gast'?'blue':'ok')+'">'+(m.Ausbildungsweg==='GAB-Gast'?'GAB-Gast · nur Teilnahme':m.GABUeberstellt?'Überstellt · Verwaltung übernommen':'Eigene Mitgliedsverwaltung')+'</span>'+
 ((STATE.erweiterteAbschluesse||[]).some(a=>a.MitgliedID===m.ID&&!a.Fehler)?'<span class="tag ok">Ausbildung abgeschlossen</span>':'')+
 (STATE.checks||[]).filter(c=>c.MitgliedID===m.ID).map(c=>'<span class="tag '+(c.Status==='Erledigt'?'ok':c.Status==='Nicht erforderlich'?'blue':'warn')+'">'+h(by(STATE.checklistenpunkte,c.PunktID)?.Titel||'Aufnahme')+': '+h(c.Status)+'</span>').join('')+
 (m.VerwaltungErweitert?'<p class="small muted">'+h(m.Email||'Keine E-Mail')+' · '+h(m.Telefon||'Kein Telefon')+' · Stb.-Nr. '+h(m.Standesbuchnummer||'–')+'</p><div class="btnline">'+
 '<button type="button" class="smallbtn" data-adv-edit="'+h(m.ID)+'">Bearbeiten</button>'+
 (m.ZugangAktiv?'<span class="tag ok">Zugang aktiv</span><button type="button" class="smallbtn" data-adv-reset="'+h(m.ID)+'">Passwort-Reset senden</button>':'<button type="button" class="smallbtn" data-adv-invite="'+h(m.ID)+'">Einladungslink senden</button>')+'</div>':'<p class="small muted">GAB-Stammdaten bleiben gesperrt. Teilnahme, Anwesenheit und Ergebnisse der erweiterten Module werden diesem Mitglied angerechnet.</p>')+'</div>').join('')+
 (members.length?'':'<p class="muted">Noch keine Teilnehmer zugeordnet.</p>')+'</div></section>';
}
function gaOrganizerAccounts(){
 if(role()!=='Organisator Erweiterte Ausbildung')return '';
 if(!STATE.kontoBearbeitung)return '<section class="panel"><h2>Eigene Zugänge</h2><p>Bitte zuerst Code.gs 1.13.15 aktualisieren.</p></section>';
 const accounts=STATE.verwalteteZugaenge||[],selected=accounts.find(a=>a.ID===GA_ORG_ACCOUNT_EDIT);
 return '<div class="ga-page-heading"><div><h2>Eigene Teilnehmerzugänge</h2><p>Nur direkt angelegte oder vom Oberadmin zur Verwaltung überstellte Teilnehmer. GAB-Gäste und andere Rollen bleiben geschützt.</p></div></div>'+
 (selected?gaUserEdit(selected):'')+'<section class="panel"><div class="ga-person-list">'+accounts.map(u=>'<button type="button" class="ga-admin-person" data-adv-account="'+h(u.ID)+'"><span><strong>'+h(u.Name)+'</strong><small>'+h(u.Email)+'</small></span><span class="tag '+(u.Aktiv==='JA'?'ok':'warn')+'">'+(u.Aktiv==='JA'?'Aktiv':'Inaktiv')+'</span><span>›</span></button>').join('')+(accounts.length?'':'<p>Noch keine eigenen Teilnehmerzugänge vorhanden. Unter Teilnehmer einladen kannst du einen Zugang anlegen.</p>')+'</div></section>';
}
function gaOrganizerInvite(){
 const members=(STATE.mitglieder||[]).filter(x=>x.Aktiv==='JA');
 return '<section class="panel"><h2>Teilnehmer einladen</h2>'+
 '<p>Einladungen können nur an Mitglieder gesendet werden, die deiner erweiterten Ausbildung bereits zugeordnet sind. Eine gültige E-Mail-Adresse muss beim Mitglied hinterlegt sein.</p>'+
 '<form data-form="advInvite"><label>Teilnehmer<select required name="MitgliedID"><option value="">Bitte wählen</option>'+
 members.map(m=>'<option value="'+h(m.ID)+'">'+h(m.Nachname+', '+m.Vorname)+'</option>').join('')+
 '</select></label><p class="small muted">Bei GAB-Gästen werden keine Kontaktdaten angezeigt. Der Server versendet die Einladung an die bereits hinterlegte Mitglieds-E-Mail, sofern vorhanden.</p>'+
 '<button class="primary" type="submit">Zugangseinladung senden</button></form></section>';
}
function gaOrganizerQualifications(){
 const people=STATE.mitglieder||[],courses=STATE.kurse||[],terms=STATE.termine||[];
 const present=STATE.teilnahmen||[],attempts=STATE.quizVersuche||[],quiz=STATE.quizKurse||[];
 const validity=(...args)=>typeof gaUiValidityDecision==='function'?gaUiValidityDecision(...args):STATE.gueltigkeit?'unknown':'applies';
 const table=people.map(m=>{
  const allowed=new Set([m.TurnusID,...(STATE.erweiterteZuordnungen||[]).filter(a=>a.MitgliedID===m.ID).map(a=>a.TurnusID)]);
  const progress=courses.map(c=>{
   const attendedTerms=terms.filter(t=>t.KursID===c.ID&&t.Status==='Durchgeführt'&&allowed.has(t.TurnusID)&&
    present.some(p=>p.TerminID===t.ID&&p.MitgliedID===m.ID&&p.Anwesend==='JA'));
   const attended=attendedTerms.length>0,courseScope=validity(c.ID,m.ID,'kurs');
   const quizScopes=attendedTerms.map(t=>validity(c.ID,m.ID,'quiz',t.TurnusID));
   const q=quiz.find(x=>x.KursID===c.ID&&x.Aktiv==='JA');
   const passed=!!q&&attempts.some(a=>a.KursID===c.ID&&a.MitgliedID===m.ID&&a.Bestanden==='JA');
   const uncertain=courseScope==='unknown'||courseScope==='unassigned'||
    (!!q&&q.Pflicht==='JA'&&!quizScopes.includes('exempt')&&quizScopes.some(x=>x==='unknown'||x==='unassigned'));
   const required=!!q&&q.Pflicht==='JA'&&!quizScopes.includes('exempt');
   return {name:c.Titel,attended,passed,required,uncertain,applicable:courseScope!=='exempt',
    done:attended&&(!required||passed)&&!uncertain};
  });
  const applicable=progress.filter(x=>x.applicable),done=applicable.filter(x=>x.done).length;
  const available=Array.isArray(STATE.erweiterteAbschluesse),completion=(STATE.erweiterteAbschluesse||[]).find(x=>x.MitgliedID===m.ID);
  const completionHtml=!available?'<p class="notice">Für die Abschlussbestätigung zuerst Code.gs 1.13.4 bereitstellen.</p>':
   completion?.Fehler?'<p class="notice">Der gespeicherte Abschluss muss durch den Administrator geprüft werden.</p>':
   completion?'<div class="notice"><b>Erweiterte Ausbildung abgeschlossen</b> · '+h(gaTrainerTime(completion.AbgeschlossenAm))+
    (completion.Benachrichtigt?'<br>Glückwunsch als App-Benachrichtigung erstellt.':'<br>Glückwunsch noch nicht zugestellt. Bitte den Teilnehmerzugang prüfen.')+'</div>'+
    (!completion.Benachrichtigt&&m.Aktiv==='JA'?'<button type="button" class="secondary" data-adv-complete="'+h(m.ID)+'" data-adv-retry="1">Glückwunsch erneut prüfen</button>':''):
   m.Aktiv==='JA'?'<p class="small muted">Die Ausbildungsleitung bestätigt den Gesamtabschluss nach Prüfung der Voraussetzungen.</p>'+
    '<button type="button" class="primary" data-adv-complete="'+h(m.ID)+'" data-adv-open="'+h(applicable.length-done)+'" data-adv-total="'+h(applicable.length)+'">Erweiterte Ausbildung abschließen</button>':'';
  return '<details class="ga-member-fold ga-org-qualification"><summary><span>'+h(m.Nachname+', '+m.Vorname)+
   '</span><span class="tag '+(done===applicable.length&&applicable.length?'ok':'blue')+'">'+done+' / '+applicable.length+' Module</span></summary>'+
   '<div class="ga-fold-body">'+(m.Ausbildungsweg==='GAB-Gast'?
    '<p class="small muted">Als GAB-Gast aufgenommen. GAB-Ausbildungsstand und private Nachweise sind hier nicht einsehbar.</p>':'')+
   (progress.length?progress.map(c=>
    '<div class="ga-org-list-row"><strong>'+h(c.name)+'</strong><span class="tag '+(c.done?'ok':c.attended?'warn':'blue')+'">'+
    (c.done?'Positiv abgeschlossen':c.uncertain?'Turnus-Startdatum prüfen':!c.applicable?'Für diesen Turnus nicht verpflichtend':c.attended&&c.required?'Pflichtquiz ausständig':'Noch offen')+'</span></div>').join(''):
    '<p class="muted">Noch keine erweiterten Module vorhanden.</p>')+completionHtml+'</div></details>';
 });
 return '<section class="panel"><h2>Qualifikationen – Erweiterte Ausbildung</h2>'+
 '<p class="muted">Nur Anwesenheit, Wissenstests und Kursabschlüsse der erweiterten Ausbildung. Die GAB-Dokumentation bleibt verborgen.</p>'+
 (table.length?table.join(''):'<p class="muted">Noch keine Teilnehmer zugeordnet.</p>')+'</section>';
}
function gaOrganizerMessages(){
 const members=(STATE.mitglieder||[]).filter(m=>m.Aktiv==='JA'),turns=STATE.turnusse||[];
 const inbox=(STATE.direktnachrichten||[]).filter(n=>n.AnBenutzerID===STATE.user.ID);
 const inboxHtml='<section class="panel"><h3>Persönliche Nachrichten</h3>'+
 (inbox.length?inbox.map(n=>'<div class="ga-org-list-row"><div><strong>'+h(n.Titel)+'</strong>'+
 '<p>Von '+h(n.VonName||'Teilnehmer')+' · '+h(dt(n.ErstelltAm))+'</p><p>'+h(n.Text)+'</p>'+
 (n.AntwortMoeglich?'<form data-form="advDirect" class="ga-org-reply">'+
 '<input name="AnBenutzerID" type="hidden" value="'+h(n.VonBenutzerID)+'">'+
 '<label>Betreff<input name="Titel" value="AW: '+h(n.Titel)+'" required maxlength="160"></label>'+
 '<label>Antwort<textarea name="Text" rows="2" maxlength="3000" required></textarea></label>'+
 '<button type="submit" class="secondary">Antwort senden</button></form>':'')+'</div></div>').join(''):
 '<p class="muted">Noch keine persönlichen Nachrichten erhalten.</p>')+'</section>';
 return inboxHtml+'<section class="panel"><h2>Nachrichten – Erweiterte Ausbildung</h2>'+
 '<p class="muted">Nur bereits für die erweiterte Ausbildung zugeordnete Mitglieder können benachrichtigt werden. Push folgt den Benachrichtigungseinstellungen der Empfänger.</p>'+
 '<form data-form="advMessage"><div class="grid">'+
 '<div class="wide"><label>Betreff<input name="Titel" required maxlength="160"></label></div>'+
 '<div><label>Empfänger<select name="EmpfaengerArt" data-adv-msg-select>'+
 '<option value="ALLE">Alle erweiterten Teilnehmer</option>'+
 '<option value="TURNUS">Ein erweiterter Turnus</option>'+
 '<option value="MITGLIED">Einzelnes Mitglied</option></select></label></div>'+
 '<div data-adv-msg="TURNUS" hidden><label>Turnus<select name="TurnusID">'+
 turns.map(t=>'<option value="'+h(t.ID)+'">'+h(t.Bezeichnung)+'</option>').join('')+'</select></label></div>'+
 '<div data-adv-msg="MITGLIED" hidden><label>Mitglied<select name="MitgliedID">'+
 members.map(m=>'<option value="'+h(m.ID)+'">'+h(m.Nachname+', '+m.Vorname)+'</option>').join('')+'</select></label></div>'+
 '<div class="wide"><label>Nachricht<textarea name="Text" rows="5" required maxlength="3000"></textarea></label></div>'+
 '</div><button class="primary" type="submit">Nachricht senden</button></form></section>'+
 '<section class="panel"><h3>Meine gesendeten Nachrichten</h3><div class="items">'+
 (STATE.nachrichten||[]).slice().reverse().map(n=>'<article class="item"><strong>'+h(n.Titel)+'</strong>'+
 '<div class="small muted">'+h(dt(n.ErstelltAm))+'</div><p class="msg">'+h(n.Text)+'</p></article>').join('')+
 (!(STATE.nachrichten||[]).length?'<p class="muted">Noch keine Nachrichten vorhanden.</p>':'')+'</div></section>';
}
function gaOrganizerQuestionnaires(){
 const courses=(STATE.kurse||[]).filter(c=>c.Aktiv==='JA'),forms=STATE.frageboegen||[];
 return '<section class="panel"><h2>Bewertungsfragebögen</h2>'+
 '<p class="muted">Nur deine Kurse der erweiterten Ausbildung – keine GAB- oder globale Fragebögen.</p>'+
 (courses.length?courses.map(c=>{
  const cfg=forms.find(x=>x.KursID===c.ID);let qs=[];
  try{qs=JSON.parse(cfg?.FragenJSON||'[]')}catch(e){}
  return '<form class="item" data-form="questionnaire">'+
  '<input type="hidden" name="KursID" value="'+h(c.ID)+'"><h3>'+h(c.Titel)+'</h3>'+
  '<p class="small muted">Eine Bewertungsfrage pro Zeile, maximal 15 Fragen.</p>'+
  '<textarea name="Fragen" rows="7" required>'+h(qs.join('\n'))+'</textarea>'+
  '<button class="primary" type="submit">Fragebogen speichern</button></form>';
 }).join(''):'<p class="muted">Zuerst einen erweiterten Kurs veröffentlichen.</p>')+'</section>';
}
document.getElementById('app')?.addEventListener('change',e=>{
 if(!e.target.matches('[data-adv-msg-select]'))return;
 const mode=e.target.value;
 e.target.closest('form')?.querySelectorAll('[data-adv-msg]').forEach(x=>{x.hidden=x.dataset.advMsg!==mode;});
});
document.getElementById('app')?.addEventListener('click',async e=>{
 const button=e.target.closest('[data-adv-complete]');if(!button)return;
 if(typeof GA_ROLE_PREVIEW!=='undefined'&&GA_ROLE_PREVIEW){tip('Die Rollenvorschau ist schreibgeschützt.',true);return;}
 const member=(STATE.mitglieder||[]).find(m=>m.ID===button.dataset.advComplete);
 if(!member||member.Aktiv!=='JA')return tip('Aktives Mitglied nicht gefunden.',true);
 const retry=button.dataset.advRetry==='1',open=Number(button.dataset.advOpen||0),total=Number(button.dataset.advTotal||0);
 const question=retry?'Den Glückwunsch für '+name(member)+' erneut prüfen und bei eindeutigem Zugang zustellen?':
  'Die erweiterte Ausbildung für '+name(member)+' offiziell als abgeschlossen bestätigen?'+
  (!total?'\n\nFür diese Person werden derzeit keine anwendbaren Module angezeigt. Bitte die Voraussetzungen prüfen.':
   open?'\n\nIn der Übersicht sind '+open+' Module noch nicht als abgeschlossen angezeigt. Bitte die Voraussetzungen prüfen.':'')+
  '\n\nDer Teilnehmer erhält eine Gratulation. Bestehende Turnuszuordnungen und Nachweise bleiben erhalten.';
 if(!confirm(question))return;
 button.disabled=true;
 try{const result=await api('completeAdvancedTraining',{MitgliedID:member.ID});
  tip(result.message||'Abschluss gespeichert.',result.benachrichtigt===false);await reload();
 }catch(error){tip(error.message||'Abschluss konnte nicht gespeichert werden.',true);}
 finally{button.disabled=false;}
});

document.getElementById('app')?.addEventListener('click',async event=>{
 const b=event.target.closest('[data-adv-edit],[data-adv-edit-close],[data-adv-invite],[data-adv-reset]');if(!b)return;
 if(b.hasAttribute('data-adv-edit-close')){GA_ORG_MEMBER_EDIT='';render();return;}
 const id=b.dataset.advEdit||b.dataset.advInvite||b.dataset.advReset,m=(STATE.mitglieder||[]).find(m=>m.ID===id&&m.VerwaltungErweitert);
 if(!m)return tip('Mitglied nicht zur Verwaltung freigegeben.',true);
 if(b.dataset.advEdit){GA_ORG_MEMBER_EDIT=id;render();document.getElementById('gaOrgMemberEditor')?.scrollIntoView({block:'start',behavior:'smooth'});return;}
 if(GA_ROLE_PREVIEW)return tip('Die Rollenvorschau ist schreibgeschützt.',true);
 if(!confirm((b.dataset.advReset?'Passwort-Reset':'Einladungslink')+' an die hinterlegte Adresse von '+name(m)+' senden?'))return;
 b.disabled=true;try{const r=await api(b.dataset.advReset?'resetPassword':'inviteUser',b.dataset.advReset?{BenutzerID:m.ZugangBenutzerID}:{MitgliedID:m.ID,Rolle:'Teilnehmer'});tip(r.message||'Link versendet.');await reload();}
 catch(e){tip(e.message,true);}finally{b.disabled=false;}
});

document.getElementById('app')?.addEventListener('click',event=>{
 const b=event.target.closest('[data-adv-account],[data-adv-account-close]');if(!b)return;
 if(b.hasAttribute('data-adv-account-close'))GA_ORG_ACCOUNT_EDIT='';
 else if((STATE.verwalteteZugaenge||[]).some(u=>u.ID===b.dataset.advAccount))GA_ORG_ACCOUNT_EDIT=b.dataset.advAccount;
 render();
});
