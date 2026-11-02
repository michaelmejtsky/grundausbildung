'use strict';
// Isoliert im Speicher: keine Produktivdaten, keine echten Nachrichten.
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'..','Code.gs'),'utf8');
const user=(id,role,email=id+'@example.test')=>({ID:id,Name:id,Email:email,Rolle:role,Aktiv:'JA'});
const admin=user('admin','Administrator'),trainer=user('trainer','Ausbilder'),org=user('org','Organisator Erweiterte Ausbildung');
const native=user('native-user','Teilnehmer','native@example.test'),guest=user('guest-user','Teilnehmer','guest@example.test'),outsider=user('outsider-user','Teilnehmer','outsider@example.test');
const member=(id,turnus,email=id+'@example.test')=>({ID:id,Vorname:id,Nachname:'Beispiel',Email:email,TurnusID:turnus,Aktiv:'JA',Ausbildungsweg:turnus==='g'?'Grundausbildung':'Erweiterte Ausbildung'});
const tables={Benutzer:[admin,trainer,org,native,guest,outsider],Mitglieder:[member('native','e'),member('guest','g'),member('outsider','g'),member('noaccount','e')],
 Turnusse:[{ID:'g',Bezeichnung:'GAB',Bereich:'Grundausbildung',Aktiv:'JA'},{ID:'e',Bezeichnung:'Erweitert',Bereich:'Erweiterte Ausbildung',Aktiv:'JA'}],
 ErweiterteZuordnungen:[{ID:'assignment',MitgliedID:'guest',TurnusID:'e'}],
 Kurse:[{ID:'required',Titel:'Funk',Bereich:'Erweiterte Ausbildung',Aktiv:'JA'},
 {ID:'optional',Titel:'Technik',Bereich:'Erweiterte Ausbildung',Aktiv:'JA'}],
 Termine:[{ID:'term1',KursID:'required',TurnusID:'e',Status:'Geplant',Beginn:'2026-11-01T08:00'},
 {ID:'term2',KursID:'optional',TurnusID:'e',Status:'Geplant',Beginn:'2026-11-03T08:00'}],
 Teilnahmen:[],Ausbildungsberichte:[],Benachrichtigungen:[],Bewertungen:[],Checklistenpunkte:[],MitgliedChecks:[],Nachrichten:[],
 QuizKurse:[{ID:'q1',KursID:'required',Aktiv:'JA',Pflicht:'JA',Version:'1',Bestehensgrenze:'100',MaxVersuche:'3',ZeitlimitMinuten:'0',
 FragenJSON:'[{"typ":"tf","text":"Frage?","options":["Richtig","Falsch"],"correct":[0]}]'},
 {ID:'q2',KursID:'optional',Aktiv:'JA',Pflicht:'NEIN',Version:'1',Bestehensgrenze:'100',MaxVersuche:'3',ZeitlimitMinuten:'0',
 FragenJSON:'[{"typ":"tf","text":"Frage?","options":["Richtig","Falsch"],"correct":[0]}]'}],
 QuizVersuche:[],QuizFreigaben:[],KursAnforderungen:[],AbschnittNachweise:[],KursProjekte:[]};
const values=new Map(),props={getProperty:k=>values.has(k)?values.get(k):null,getProperties:()=>Object.fromEntries(values),
 setProperty(k,v){values.set(k,String(v));return this;},deleteProperty(k){values.delete(k);return this;}};
let actor=admin,seq=0;const pushes=[];
const ctx=vm.createContext({console,Date,JSON,Set,Map,PropertiesService:{getScriptProperties:()=>props},
 Utilities:{formatDate:()=> '2026-11-02'},Session:{getScriptTimeZone:()=> 'Europe/Vienna'}});
vm.runInContext(source,ctx,{filename:'Code.gs'});
ctx.gaRows_=name=>(tables[name]||[]).map(x=>({...x}));ctx.gaOptionalRows_=ctx.gaRows_;
ctx.gaAppend_=(name,row)=>{(tables[name]||(tables[name]=[])).push({...row});};
ctx.gaReplace_=(name,id,changes)=>{const row=(tables[name]||[]).find(x=>x.ID===id);assert(row,`${name} ${id}`);Object.assign(row,changes);};
ctx.gaId_=()=>`generated-${++seq}`;ctx.gaNow_=()=> '2026-11-02T12:00:00';ctx.gaLock_=f=>f();ctx.gaSession_=()=>actor;
ctx.gaLog_=()=>{};ctx.gaPushQueue_=(limit,id)=>pushes.push({limit,id});ctx.gaQuizInstalled_=()=>{};
ctx.gaSheet_=()=>({getSheetByName:()=>({})});ctx.gaTrainingDetails_=()=>({BeginnIst:'2026-11-01T08:00',EndeIst:'2026-11-01T10:00',DauerMinuten:'120',FahrzeugeJSON:'[]',Notiz:''});
const completeTerm=(term,nativePresent=true,guestPresent=true)=>ctx.gaApi('saveAttendance',{TerminID:term,
 Anwesend:[{MitgliedID:'native',Anwesend:nativePresent},{MitgliedID:'guest',Anwesend:guestPresent},{MitgliedID:'noaccount',Anwesend:false}],AusbilderIDs:['admin']},'token');
const beforeMember=JSON.stringify(tables.Mitglieder),beforeAssignment=JSON.stringify(tables.ErweiterteZuordnungen);
// Admin-conducted expanded courses include GAB guests as well as native members.
completeTerm('term1');assert.equal(tables.Teilnahmen.filter(x=>x.TerminID==='term1'&&x.Anwesend==='JA').length,2);
for(const id of ['native-user','guest-user']){
 assert(tables.Benachrichtigungen.some(n=>n.BenutzerID===id&&n.Titel==='Kursteilnahme bestätigt'&&/Pflichtquiz/.test(n.Text)));
 assert(tables.Benachrichtigungen.some(n=>n.BenutzerID===id&&n.Titel==='Pflichtquiz ist eröffnet!'));
 assert(!tables.Benachrichtigungen.some(n=>n.BenutzerID===id&&n.Titel==='Kurs abgeschlossen'&&n.BezugID==='term1'));
}
assert(!tables.Benachrichtigungen.some(n=>n.BenutzerID==='outsider-user'));
const count1=tables.Benachrichtigungen.length;completeTerm('term1');assert.equal(tables.Benachrichtigungen.length,count1);
// A correction from present to absent and back must not repeat old app/push notices.
completeTerm('term1',true,false);completeTerm('term1');assert.equal(tables.Benachrichtigungen.length,count1);
// With a voluntary quiz, participation already completes the course, with a separate quiz notice.
completeTerm('term2');for(const id of ['native-user','guest-user']){
 assert(tables.Benachrichtigungen.some(n=>n.BenutzerID===id&&n.BezugID==='term2'&&n.Titel==='Kurs abgeschlossen'));
 assert(tables.Benachrichtigungen.some(n=>n.BenutzerID===id&&n.Titel==='Freiwilliges Quiz verfügbar!'));
}
// A failed attempt is not a course pass; a positive mandatory quiz creates one pass notice.
actor=guest;let started=ctx.gaApi('startQuiz',{KursID:'required'},'token');
let result=ctx.gaApi('submitQuiz',{VersuchID:started.VersuchID,Antworten:[1]},'token');assert.equal(result.Bestanden,false);
assert(!tables.Benachrichtigungen.some(n=>n.BenutzerID===guest.ID&&n.BezugID==='COURSEPASS:required:guest'));
started=ctx.gaApi('startQuiz',{KursID:'required'},'token');result=ctx.gaApi('submitQuiz',{VersuchID:started.VersuchID,Antworten:[0]},'token');
assert.equal(result.Bestanden,true);assert(tables.Benachrichtigungen.some(n=>n.BenutzerID===guest.ID&&n.BezugID==='COURSEPASS:required:guest'&&n.Titel.includes('bestanden')));
assert.throws(()=>ctx.gaApi('startQuiz',{KursID:'required'},'token'),/bereits erfolgreich bestanden/);
assert(tables.Benachrichtigungen.some(n=>n.BenutzerID===org.ID&&n.Titel==='Kursquiz abgegeben'));
// An instructor also sees and can confirm additional GAB guests in an expanded cohort.
tables.Termine.push({ID:'term3',KursID:'required',TurnusID:'e',Status:'Geplant',Beginn:'2026-11-05T08:00'});
actor=trainer;ctx.gaApi('saveAttendance',{_gaTrainerArea:'Erweiterte Ausbildung',TerminID:'term3',Anwesend:[{MitgliedID:'native',Anwesend:true},
 {MitgliedID:'guest',Anwesend:true},{MitgliedID:'noaccount',Anwesend:false}],AusbilderIDs:['trainer']},'token');
assert(tables.Teilnahmen.some(a=>a.TerminID==='term3'&&a.MitgliedID==='guest'&&a.Anwesend==='JA'));
assert(tables.Benachrichtigungen.some(n=>n.BenutzerID===guest.ID&&n.BezugID==='term3'&&n.Titel==='Kurs abgeschlossen'));
// Publishing a quiz after an expanded course informs its native and GAB guest attendees.
tables.Kurse.push({ID:'latequiz',Titel:'Geräte',Bereich:'Erweiterte Ausbildung',Aktiv:'JA'});
tables.Termine.push({ID:'term-late',KursID:'latequiz',TurnusID:'e',Status:'Geplant',Beginn:'2026-11-07T08:00'});
actor=admin;completeTerm('term-late');actor=org;
const quizData={KursID:'latequiz',Aktiv:'JA',Pflicht:'JA',Bestehensgrenze:80,MaxVersuche:3,ZeitlimitMinuten:0,
 Fragen:[{typ:'tf',text:'Ist das richtig?',correct:[0]}]};
ctx.gaApi('saveQuiz',quizData,'token');
for(const id of ['native-user','guest-user'])assert(tables.Benachrichtigungen.some(n=>n.BenutzerID===id&&n.BezugID==='QUIZREADY:latequiz:1:P'));
assert(!tables.Benachrichtigungen.some(n=>n.BenutzerID==='outsider-user'&&n.BezugID==='QUIZREADY:latequiz:1:P'));
ctx.gaApi('saveQuiz',quizData,'token');
assert.equal(tables.Benachrichtigungen.filter(n=>n.BenutzerID==='guest-user'&&n.BezugID==='QUIZREADY:latequiz:1:P').length,1);
// Only admins and advanced organizers may confirm a genuinely associated active member.
actor=outsider;assert.throws(()=>ctx.gaApi('completeAdvancedTraining',{MitgliedID:'outsider'},'token'),/Berechtigung/);
actor=org;assert.throws(()=>ctx.gaApi('completeAdvancedTraining',{MitgliedID:'outsider'},'token'),/zugeordnete Teilnehmer/);
actor=admin;assert.throws(()=>ctx.gaApi('completeAdvancedTraining',{_gaRolePreview:'org',MitgliedID:'guest'},'token'),/schreibgeschützt/);
const beforeAttempts=JSON.stringify(tables.QuizVersuche),beforeAttendance=JSON.stringify(tables.Teilnahmen),beforeCourses=JSON.stringify(tables.Kurse);
actor=org;result=ctx.gaApi('completeAdvancedTraining',{MitgliedID:'guest'},'token');
assert.equal(result.benachrichtigt,true);assert.equal(tables.Mitglieder.find(m=>m.ID==='guest').TurnusID,'g');
assert.equal(JSON.stringify(tables.Mitglieder),beforeMember);assert.equal(JSON.stringify(tables.ErweiterteZuordnungen),beforeAssignment);
assert.equal(JSON.stringify(tables.QuizVersuche),beforeAttempts);assert.equal(JSON.stringify(tables.Teilnahmen),beforeAttendance);assert.equal(JSON.stringify(tables.Kurse),beforeCourses);
assert.equal(tables.Benachrichtigungen.filter(n=>n.BezugID==='ADVCOMPLETE:guest').length,1);
assert.match(tables.Benachrichtigungen.find(n=>n.BezugID==='ADVCOMPLETE:guest').Text,/Herzlichen Glückwunsch/);
assert.equal(JSON.parse(values.get(ctx.gaAdvCompletionKey_('guest'))).BestaetigtVon,'org');
ctx.gaApi('completeAdvancedTraining',{MitgliedID:'guest'},'token');assert.equal(tables.Benachrichtigungen.filter(n=>n.BezugID==='ADVCOMPLETE:guest').length,1);
const orgState=ctx.gaState_(org);assert.equal(orgState.erweiterteAbschluesse.find(x=>x.MitgliedID==='guest').Benachrichtigt,true);
actor=guest;const guestState=ctx.gaState_(guest);assert.deepEqual(Array.from(guestState.erweiterteAbschluesse,x=>x.MitgliedID),['guest']);
actor=outsider;assert.equal(ctx.gaState_(outsider).erweiterteAbschluesse.length,0);
// Without a usable account, save the completion and allow a later, idempotent notice retry.
actor=org;result=ctx.gaApi('completeAdvancedTraining',{MitgliedID:'noaccount'},'token');assert.equal(result.benachrichtigt,false);
const recorded=values.get(ctx.gaAdvCompletionKey_('noaccount'));assert(recorded);
tables.Benutzer.push(user('newaccount','Teilnehmer','noaccount@example.test'));
result=ctx.gaApi('completeAdvancedTraining',{MitgliedID:'noaccount'},'token');assert.equal(result.benachrichtigt,true);
assert.equal(values.get(ctx.gaAdvCompletionKey_('noaccount')),recorded);
ctx.gaApi('completeAdvancedTraining',{MitgliedID:'noaccount'},'token');assert.equal(tables.Benachrichtigungen.filter(n=>n.BezugID==='ADVCOMPLETE:noaccount').length,1);
// Never overwrite a malformed existing completion record.
values.set(ctx.gaAdvCompletionKey_('native'),'not-json');
assert.throws(()=>ctx.gaApi('completeAdvancedTraining',{MitgliedID:'native'},'token'),/beschädigt/);
assert.equal(values.get(ctx.gaAdvCompletionKey_('native')),'not-json');
assert(ctx.gaState_(org).erweiterteAbschluesse.find(x=>x.MitgliedID==='native').Fehler);
console.log('Advanced education: guest attendance, course/quiz notices, pass, access isolation, completion, retries and preservation passed.');

// Quiz-result staff notifications respect both course and cohort permissions for legacy mixed terms.
const advancedOnly=user('advanced-trainer','Ausbilder'),gabOnly=user('gab-trainer','Ausbilder');
tables.Benutzer.push(advancedOnly,gabOnly);
tables.Berechtigungen=[{BenutzerID:trainer.ID,KurseGestalten:'JA'},{BenutzerID:advancedOnly.ID,KurseGestalten:'JA'},{BenutzerID:gabOnly.ID,KurseGestalten:'JA'}];
values.set('GA_TRAINER_AREAS_V1_'+advancedOnly.ID,JSON.stringify(['Erweiterte Ausbildung']));
values.set('GA_TRAINER_AREAS_V1_'+gabOnly.ID,JSON.stringify(['Grundausbildung']));
tables.Kurse.push({ID:'mixed-quiz-course',Titel:'Zusatzmodul in GAB',Bereich:'Erweiterte Ausbildung',Aktiv:'JA'});
tables.Termine.push({ID:'mixed-quiz-term',KursID:'mixed-quiz-course',TurnusID:'g',Status:'Durchgeführt',Beginn:'2026-11-01T08:00'});
tables.Teilnahmen.push({ID:'mixed-attendance',TerminID:'mixed-quiz-term',MitgliedID:'outsider',Anwesend:'JA'});
tables.QuizKurse.push({...tables.QuizKurse[0],ID:'mixed-quiz-config',KursID:'mixed-quiz-course'});
actor=outsider;const mixedQuiz=ctx.gaApi('startQuiz',{KursID:'mixed-quiz-course'},'token');
ctx.gaApi('submitQuiz',{VersuchID:mixedQuiz.VersuchID,Antworten:[0]},'token');
assert(tables.Benachrichtigungen.some(n=>n.BenutzerID===trainer.ID&&n.BezugID==='mixed-quiz-course'&&n.Titel==='Kursquiz abgegeben'));
assert(!tables.Benachrichtigungen.some(n=>[advancedOnly.ID,gabOnly.ID,org.ID].includes(n.BenutzerID)&&n.BezugID==='mixed-quiz-course'&&n.Titel==='Kursquiz abgegeben'));
console.log('Mixed-cohort quiz notifications respect staff course and cohort permissions.');
