/* Organisator Erweiterte Ausbildung – getrennte Verwaltungsansichten V1.11 */
'use strict';
const GA_ORG_ROLE='Organisator Erweiterte Ausbildung';
function gaOrganizerOverview(){
 const members=STATE.mitglieder||[],terms=STATE.termine||[],courses=STATE.kurse||[];
 return '<div class="ga-page-heading"><div><p class="ga-eyebrow">FEUERWEHR ST. PÖLTEN-STADT</p><h2>Erweiterte Ausbildung</h2>'+
 '<p>Deine organisatorische Übersicht – GAB-Daten bleiben beim GAB-Team.</p></div></div>'+
 '<div class="ga-kpis">'+gaMetric(members.length,'Zugeordnete Teilnehmer','Inklusive GAB-Gästen')+
 gaMetric(courses.length,'Erweiterte Module','Kurskatalog')+gaMetric(terms.length,'Ausbildungstermine','Geplant & durchgeführt')+'</div>'+
 '<div class="ga-organizer-cards">'+
 '<button type="button" data-view="advMembers" class="ga-organizer-tile"><strong>Teilnehmer & GAB-Gäste</strong><span>Personen für erweiterte Module zuordnen</span></button>'+
 '<button type="button" data-view="terms" class="ga-organizer-tile"><strong>Termine planen</strong><span>Nur Kurse und Turnusse der erweiterten Ausbildung</span></button>'+
 '<button type="button" data-view="messages" class="ga-organizer-tile"><strong>Nachrichten</strong><span>Einzeln, gesamter Turnus oder alle zugeordneten Mitglieder</span></button>'+
 '<button type="button" data-view="trainingReports" class="ga-organizer-tile"><strong>FDISK-Tätigkeitsberichte</strong><span>Stunden, Personen und Fahrzeuge</span></button></div>';
}
function gaOrganizerMembers(){
 const turnusse=(STATE.turnusse||[]).filter(x=>x.Aktiv==='JA');
 const everyone=STATE.gabNamen||[],members=STATE.mitglieder||[];
 const opts=turnusse.map(t=>'<option value="'+h(t.ID)+'">'+h(t.Bezeichnung)+'</option>').join('');
 return '<div class="ga-page-heading"><div><h2>Teilnehmer & GAB-Gäste</h2><p>GAB-Mitglieder bleiben in ihrem bisherigen Turnus und können trotzdem erweiterte Module besuchen.</p></div></div>'+
 '<section class="panel"><h3>GAB-Mitglied zusätzlich aufnehmen</h3>'+
 '<p class="small muted">Hier werden von der GAB ausschließlich Namen angezeigt – keine Kontaktdaten, Nachweise oder Ausbildungsstände.</p>'+
 '<form data-form="advEnroll"><div class="grid"><label>GAB-Mitglied<select name="MitgliedID" required><option value="">Mitglied auswählen</option>'+
 everyone.map(m=>'<option value="'+h(m.ID)+'">'+h(m.Nachname+', '+m.Vorname)+'</option>').join('')+'</select></label>'+
 '<label>Erweiterter Turnus<select name="TurnusID" required><option value="">Turnus auswählen</option>'+opts+'</select></label></div>'+
 '<button class="primary" type="submit">Für erweiterte Ausbildung zuordnen</button></form></section>'+
 '<section class="panel"><h3>Neues Mitglied nur für die erweiterte Ausbildung anlegen</h3>'+
 '<form data-form="advMember"><div class="grid"><label>Vorname<input name="Vorname" required maxlength="100"></label>'+
 '<label>Nachname<input name="Nachname" required maxlength="100"></label>'+
 '<label>E-Mail für späteren Zugang<input name="Email" type="email"></label>'+
 '<label>Telefon (optional)<input name="Telefon"></label>'+
 '<label>Standesbuchnummer (optional)<input name="Standesbuchnummer"></label>'+
 '<label>Turnus<select name="TurnusID" required><option value="">Turnus auswählen</option>'+opts+'</select></label></div>'+
 '<button type="submit" class="primary">Mitglied anlegen</button></form></section>'+
 '<section class="panel"><h3>Meine erweiterten Teilnehmer ('+members.length+')</h3>'+
 '<div class="ga-organizer-roster">'+members.map(m=>'<div><b>'+h(m.Nachname+', '+m.Vorname)+'</b>'+
 '<span class="tag '+(m.Ausbildungsweg==='GAB-Gast'?'blue':'ok')+'">'+(m.Ausbildungsweg==='GAB-Gast'?'GAB-Gast':'Erweiterte Ausbildung')+'</span></div>').join('')+
 (members.length?'':'<p class="muted">Noch keine Teilnehmer zugeordnet.</p>')+'</div></section>';
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
 const table=people.map(m=>{
  const progress=courses.map(c=>{
   const attended=terms.some(t=>t.KursID===c.ID&&t.Status==='Durchgeführt'&&
    present.some(p=>p.TerminID===t.ID&&p.MitgliedID===m.ID&&p.Anwesend==='JA'));
   const q=quiz.find(x=>x.KursID===c.ID&&x.Aktiv==='JA'),required=q?.Pflicht==='JA';
   const passed=q&&attempts.some(a=>a.KursID===c.ID&&a.MitgliedID===m.ID&&
    a.Bestanden==='JA'&&String(a.QuizVersion)===String(q.Version));
   return {name:c.Titel,attended,passed,required,done:attended&&(!required||passed)};
  });
  const done=progress.filter(x=>x.done).length;
  return '<details class="ga-member-fold ga-org-qualification"><summary><span>'+h(m.Nachname+', '+m.Vorname)+
   '</span><span class="tag '+(done===progress.length&&progress.length?'ok':'blue')+'">'+done+' / '+progress.length+' Module</span></summary>'+
   '<div class="ga-fold-body">'+(m.Ausbildungsweg==='GAB-Gast'?
    '<p class="small muted">Als GAB-Gast aufgenommen. GAB-Ausbildungsstand und private Nachweise sind hier nicht einsehbar.</p>':'')+
   (progress.length?progress.map(c=>
    '<div class="ga-org-list-row"><strong>'+h(c.name)+'</strong><span class="tag '+(c.done?'ok':c.attended?'warn':'blue')+'">'+
    (c.done?'Positiv abgeschlossen':c.attended&&c.required?'Pflichtquiz ausständig':'Noch offen')+'</span></div>').join(''):
    '<p class="muted">Noch keine erweiterten Module vorhanden.</p>')+'</div></details>';
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
