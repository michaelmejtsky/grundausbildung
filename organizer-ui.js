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
 members.filter(m=>m.Email).map(m=>'<option value="'+h(m.ID)+'">'+h(m.Nachname+', '+m.Vorname)+'</option>').join('')+
 '</select></label><p class="small muted">GAB-Gäste ohne freigegebene Kontaktdaten werden hier nicht angeboten. Eine Einladung an sie kann ein Administrator versenden.</p>'+
 '<button class="primary" type="submit">Zugangseinladung senden</button></form></section>';
}
function gaOrganizerQualifications(){
 const qs=STATE.qualifikationen||[];
 return '<div class="ga-page-heading"><div><h2>Qualifikationen – erweiterte Ausbildung</h2>'+
 '<p>Nur die Ergebnisse der eigenen erweiterten Mitglieder. GAB-Daten werden nicht angezeigt.</p></div></div>'+
 '<section class="panel"><div class="items">'+qs.map(q=>'<div class="item"><b>'+h(q.Name)+'</b>'+
 '<p class="small muted">Erweiterte Ausbildung · '+h(q.PflichtAbsolviert||0)+' / '+h(q.PflichtGesamt||0)+' Module dokumentiert</p></div>').join('')+
 (!qs.length?'<p class="muted">Noch keine Qualifikationsdaten vorhanden.</p>':'')+'</div></section>';
}