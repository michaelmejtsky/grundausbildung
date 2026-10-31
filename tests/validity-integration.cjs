'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..');

const values=new Map([['GA_WORKER_SECRET','not-for-the-client']]);
const props={
 getProperties:()=>Object.fromEntries(values),
 getProperty:key=>values.has(key)?values.get(key):null,
 setProperty(key,value){values.set(key,String(value));return this;},
 deleteProperty(key){values.delete(key);return this;}
};
const tables={
 Turnusse:[
  {ID:'gab-old',Bezeichnung:'GAB alt',Bereich:'Grundausbildung',Aktiv:'JA'},
  {ID:'gab-new',Bezeichnung:'GAB neu',Bereich:'Grundausbildung',Aktiv:'JA'},
  {ID:'adv-old',Bezeichnung:'Erweitert alt',Bereich:'Erweiterte Ausbildung',Aktiv:'JA'},
  {ID:'adv-new',Bezeichnung:'Erweitert neu',Bereich:'Erweiterte Ausbildung',Aktiv:'JA'}],
 Mitglieder:[
  {ID:'old',Vorname:'Alt',Nachname:'GAB',Email:'old@example.at',Aktiv:'JA',TurnusID:'gab-old'},
  {ID:'new',Vorname:'Neu',Nachname:'GAB',Email:'new@example.at',Aktiv:'JA',TurnusID:'gab-new'},
  {ID:'guest',Vorname:'Gast',Nachname:'GAB',Email:'guest@example.at',Aktiv:'JA',TurnusID:'gab-old'},
  {ID:'adv',Vorname:'Alt',Nachname:'Erweitert',Email:'adv@example.at',Aktiv:'JA',TurnusID:'adv-old'}],
 ErweiterteZuordnungen:[{MitgliedID:'guest',TurnusID:'adv-new'}],
 Kurse:[
  {ID:'old-course',Titel:'Alt',Bereich:'Grundausbildung',Aktiv:'JA'},
  {ID:'new-course',Titel:'Neu',Bereich:'Grundausbildung',Aktiv:'JA'},
  {ID:'existing-course',Titel:'Vorhanden',Bereich:'Grundausbildung',Aktiv:'JA'},
  {ID:'adv-course',Titel:'Erweitert',Bereich:'Erweiterte Ausbildung',Aktiv:'JA'}],
 Termine:[
  {ID:'old-term',KursID:'old-course',TurnusID:'gab-old',Beginn:'2026-05-01T09:00',Status:'Durchgeführt'},
  {ID:'old-existing-term',KursID:'existing-course',TurnusID:'gab-old',Beginn:'2026-05-01T09:00',Status:'Durchgeführt'},
  {ID:'new-existing-term',KursID:'existing-course',TurnusID:'gab-new',Beginn:'2027-05-01T09:00',Status:'Durchgeführt'},
  {ID:'old-adv-term',KursID:'adv-course',TurnusID:'adv-old',Beginn:'2026-04-01T09:00',Status:'Durchgeführt'},
  {ID:'new-adv-term',KursID:'adv-course',TurnusID:'adv-new',Beginn:'2027-04-01T09:00',Status:'Durchgeführt'}],
 Teilnahmen:[
  {ID:'a1',TerminID:'old-term',MitgliedID:'old',Anwesend:'JA'},
  {ID:'a2',TerminID:'old-existing-term',MitgliedID:'old',Anwesend:'JA'},
  {ID:'a3',TerminID:'new-existing-term',MitgliedID:'new',Anwesend:'JA'},
  {ID:'a4',TerminID:'old-adv-term',MitgliedID:'adv',Anwesend:'JA'},
  {ID:'a5',TerminID:'new-adv-term',MitgliedID:'guest',Anwesend:'JA'}],
 QuizKurse:[],QuizVersuche:[],QuizFreigaben:[],KursAnforderungen:[],
 Benutzer:[
  {ID:'u-old',Email:'old@example.at',Rolle:'Teilnehmer',Aktiv:'JA'},
  {ID:'u-new',Email:'new@example.at',Rolle:'Teilnehmer',Aktiv:'JA'},
  {ID:'u-guest',Email:'guest@example.at',Rolle:'Teilnehmer',Aktiv:'JA'},
  {ID:'u-adv',Email:'adv@example.at',Rolle:'Teilnehmer',Aktiv:'JA'}],
 Benachrichtigungen:[],KursProjekte:[],Berechtigungen:[],Protokoll:[]
};
let seq=0;
const ctx=vm.createContext({console,Date,JSON,Set,Map,PropertiesService:{getScriptProperties:()=>props},
 Utilities:{formatDate:()=> '2026-10-31'},Session:{getScriptTimeZone:()=> 'Europe/Vienna'}});
vm.runInContext(fs.readFileSync(path.join(root,'Code.gs'),'utf8'),ctx,{filename:'Code.gs'});
const actualPushQueue=ctx.gaPushQueue_;
ctx.gaRows_=name=>(tables[name]||[]).map(row=>({...row}));
ctx.gaOptionalRows_=ctx.gaRows_;
ctx.gaAppend_=(name,row)=>{(tables[name]||(tables[name]=[])).push({...row});return row;};
ctx.gaReplace_=(name,id,changes)=>{const row=(tables[name]||[]).find(x=>x.ID===id);if(!row)throw Error('missing '+name+' '+id);Object.assign(row,changes);return row;};
ctx.gaId_=()=>`id-${++seq}`;
ctx.gaLog_=()=>{};
ctx.gaQuizInstalled_=()=>{};
ctx.gaPushQueue_=()=>{};
ctx.gaNotify_=(user,type,title,text,ref)=>{tables.Benachrichtigungen.push({ID:`note-${++seq}`,BenutzerID:user,Typ:type,Titel:title,Text:text,BezugID:ref});};
const admin={ID:'admin',Rolle:'Administrator',Aktiv:'JA'},organizer={ID:'org',Rolle:'Organisator Erweiterte Ausbildung',Aktiv:'JA'};
const set=(kind,id,date,actor=admin)=>ctx.gaSetValidity_(actor,{Art:kind,ID:id,Datum:date});
const dates={'gab-old':'2025-09-01','gab-new':'2027-01-01','adv-old':'2026-01-01','adv-new':'2027-01-01'};
for(const [id,date] of Object.entries(dates))set('turnus',id,date);
let meta=ctx.gaValidityConfig_(),turns=ctx.gaRows_('Turnusse'),assignments=ctx.gaAdvAssignments_(),courses=ctx.gaRows_('Kurse');
const member=id=>ctx.gaRows_('Mitglieder').find(m=>m.ID===id),course=id=>courses.find(c=>c.ID===id);
assert.equal(ctx.gaValidityDecision_('Grundausbildung','2027-01-01',['gab-old'],turns,meta.turnus),'exempt');
assert.equal(ctx.gaValidityDecision_('Grundausbildung','2027-01-01',['gab-new'],turns,meta.turnus),'applies');
assert.equal(ctx.gaValidityDecision_('Grundausbildung','2027-01-01',['missing'],turns,meta.turnus),'unknown');
assert.equal(ctx.gaValidityDecision_('Grundausbildung','2027-01-01',['gab-old'],turns,{}),'unknown');
assert.equal(ctx.gaValidityDecision_('Grundausbildung','',['gab-old'],turns,{}),'applies');
assert.equal(ctx.gaValidityValidDate_('2026-02-30'),false);
assert.equal(ctx.gaValidityValidDate_('2028-02-29'),true);
assert.equal(ctx.gaValidityQuizDate_({kurs:{c:'2027-01-01'},quiz:{c:'0000-invalid'}},'c'),'INVALID');
assert(!JSON.stringify(meta).includes('not-for-the-client'));
assert.throws(()=>set('turnus','gab-old','2025-09-01',organizer),/erweiterte Ausbildung/);
assert.throws(()=>set('kurs','old-course','2027-01-01',organizer),/erweiterte Ausbildung/);
assert.throws(()=>set('turnus','adv-old','2026-01-01',{Rolle:'Teilnehmer'}),/Berechtigung/);
set('kurs','new-course','2027-01-01');
set('kurs','adv-course','2027-01-01',organizer);
meta=ctx.gaValidityConfig_();
assert.equal(ctx.gaValidityForMember_(course('new-course'),member('old'),meta,turns,assignments,'kurs'),'exempt');
assert.equal(ctx.gaValidityForMember_(course('new-course'),member('new'),meta,turns,assignments,'kurs'),'applies');
assert.equal(ctx.gaValidityForMember_(course('new-course'),member('guest'),meta,turns,assignments,'kurs'),'exempt');
assert.equal(ctx.gaValidityForMember_(course('adv-course'),member('guest'),meta,turns,assignments,'kurs'),'applies');
assert.equal(ctx.gaValidityForMember_(course('adv-course'),member('adv'),meta,turns,assignments,'kurs'),'exempt');
assert.throws(()=>set('turnus','gab-old',''),/nicht entfernt/);
// A historical, inactive cohort still needs a real date if active members have old attendance there.
tables.Turnusse.push({ID:'gab-history',Bezeichnung:'Früherer Turnus',Bereich:'Grundausbildung',Aktiv:'NEIN'});
tables.Termine.push({ID:'historic-term',KursID:'old-course',TurnusID:'gab-history',Status:'Durchgeführt'});
tables.Teilnahmen.push({ID:'historic-attendance',TerminID:'historic-term',MitgliedID:'old',Anwesend:'JA'});
assert.throws(()=>set('kurs','old-course','2028-01-01'),/Früherer Turnus/);
set('turnus','gab-history','2024-01-01');
set('kurs','old-course','2028-01-01');
ctx.gaValiditySet_('kurs','old-course','');ctx.gaValiditySet_('turnus','gab-history','');
tables.Turnusse=tables.Turnusse.filter(t=>t.ID!=='gab-history');
tables.Termine=tables.Termine.filter(t=>t.ID!=='historic-term');
tables.Teilnahmen=tables.Teilnahmen.filter(a=>a.ID!=='historic-attendance');
const snapshot=JSON.stringify(tables.Teilnahmen);
const req=[{KursID:'old-course',PflichtGAB:'JA'},{KursID:'new-course',PflichtGAB:'JA'}];
const predecessor={'new-course':{id:'old-course',bis:'2026-10-31'}};
const passed=[{KursID:'old-course',MitgliedID:'old',QuizVersion:'1',Bestanden:'JA'}];
const quizCfg=[{KursID:'old-course',Aktiv:'JA',Pflicht:'JA',Version:'2'}];
function qual(who,requirements=req,attempts=passed,links=predecessor,metadata=meta,configs=quizCfg){
 return ctx.gaQualificationStatus_(member(who),[],requirements,courses,ctx.gaRows_('Termine'),ctx.gaRows_('Teilnahmen'),turns,configs,attempts,[],assignments,links,metadata);
}
assert.equal(qual('old').PflichtGesamt,1);
assert.equal(qual('old').PflichtAbsolviert,1);
assert.equal(qual('new').PflichtGesamt,1);
assert.equal(qual('new').PflichtAbsolviert,0);
assert.equal(qual('old',req,[]).PflichtAbsolviert,0);
assert.equal(qual('old',req,[{...passed[0],MitgliedID:'new'}]).PflichtAbsolviert,0);
const recognized={...member('adv'),Ausbildungsweg:'Erweiterte Ausbildung'};
const recognizedState=ctx.gaQualificationStatus_(recognized,[{MitgliedID:'adv',GABAnerkannt:'JA'}],
 [{KursID:'new-course',PflichtGAB:'JA'}],courses,ctx.gaRows_('Termine'),ctx.gaRows_('Teilnahmen'),
 turns,[],[],[],assignments,{},meta);
assert.equal(recognizedState.GABAbgeschlossen,true);
assert.equal(recognizedState.GueltigkeitUnklar.length,0);
const noStarts={turnus:{},kurs:{'new-course':'2027-01-01'},quiz:{},projekt:{}};
assert(qual('old',req,[],predecessor,noStarts).GueltigkeitUnklar.includes('new-course'));
assert.equal(JSON.stringify(tables.Teilnahmen),snapshot);

// A new mandatory quiz on an existing course must not reopen older cohorts.
ctx.gaValiditySet_('quiz','existing-course','2027-01-01');
meta=ctx.gaValidityConfig_();
const existingReq=[{KursID:'existing-course',PflichtBSW:'JA'}];
const existingCfg=[{KursID:'existing-course',Aktiv:'JA',Pflicht:'JA',Version:'2'}];
assert.equal(qual('old',existingReq,[],{},meta,existingCfg).BSWModulAbgeschlossen,true);
assert.equal(qual('new',existingReq,[],{},meta,existingCfg).BSWModulAbgeschlossen,false);
assert.equal(qual('new',existingReq,[{KursID:'existing-course',MitgliedID:'new',QuizVersion:'1',Bestanden:'JA'}],{},meta,existingCfg).BSWModulAbgeschlossen,true);
const qc={members:ctx.gaRows_('Mitglieder'),attempts:[],meta,turns,assignments,
 terms:ctx.gaRows_('Termine'),attendance:ctx.gaRows_('Teilnahmen')};
const user=id=>ctx.gaRows_('Benutzer').find(u=>u.ID===id);
assert.equal(ctx.gaQuizNoticeEligible_(user('u-old'),course('existing-course'),existingCfg[0],qc),false);
assert.equal(ctx.gaQuizNoticeEligible_(user('u-new'),course('existing-course'),existingCfg[0],qc),true);
assert.equal(ctx.gaQuizNoticeEligible_(user('u-guest'),course('adv-course'),{KursID:'adv-course',Aktiv:'JA',Pflicht:'JA'},qc),true);
assert.equal(ctx.gaQuizNoticeEligible_(user('u-adv'),course('adv-course'),{KursID:'adv-course',Aktiv:'JA',Pflicht:'JA'},qc),false);
qc.attempts=[{KursID:'existing-course',MitgliedID:'new',QuizVersion:'1',Bestanden:'JA'}];
assert.equal(ctx.gaQuizNoticeEligible_(user('u-new'),course('existing-course'),existingCfg[0],qc),false);
const original=props.getProperty(ctx.gaValidityKey_('kurs','new-course'));
assert.throws(()=>ctx.gaValidityWithRollback_('kurs','new-course','2028-01-01',()=>{throw Error('simulated');}),/simulated/);
assert.equal(props.getProperty(ctx.gaValidityKey_('kurs','new-course')),original);

// Saving a dated quiz announces it only to the cohort for which it applies.
const question={typ:'single',text:'Frage?',options:['A','B','C','D'],correct:[0]};
const quizData={KursID:'existing-course',Aktiv:'JA',Pflicht:'JA',Bestehensgrenze:80,
 MaxVersuche:3,ZeitlimitMinuten:0,Fragen:[question],GueltigAb:'2027-01-01'};
tables.Benachrichtigungen.length=0;
ctx.gaSaveQuiz_(admin,quizData);
assert.deepEqual(tables.Benachrichtigungen.map(x=>x.BenutzerID),['u-new']);
assert.equal(ctx.gaValidityConfig_().quiz['existing-course'],'2027-01-01');
tables.QuizVersuche.push({ID:'passed-new',KursID:'existing-course',MitgliedID:'new',QuizVersion:'1',Bestanden:'JA'});
ctx.gaSaveQuiz_(admin,{...quizData,Fragen:[{...question,text:'Geänderte Frage?'}]});
assert.equal(tables.Benachrichtigungen.length,1,'A passed participant must not receive a new quiz announcement');
const withoutDate={...quizData,Fragen:[{...question,text:'Nochmals geändert?'}]};delete withoutDate.GueltigAb;
ctx.gaSaveQuiz_(admin,withoutDate);
assert.equal(ctx.gaValidityConfig_().quiz['existing-course'],'2027-01-01','Old clients must not erase the date');

// Missing cohort dates prevent a newly dated quiz from being saved or announced.
const key=ctx.gaValidityKey_('turnus','gab-old');props.deleteProperty(key);
const beforeQuiz=JSON.stringify(tables.QuizKurse),beforeNotes=JSON.stringify(tables.Benachrichtigungen);
assert.throws(()=>ctx.gaSaveQuiz_(admin,{...quizData,KursID:'old-course'}),/Startdatum/);
assert.equal(JSON.stringify(tables.QuizKurse),beforeQuiz);
assert.equal(JSON.stringify(tables.Benachrichtigungen),beforeNotes);
props.setProperty(key,dates['gab-old']);

// New turnuses require their actual start and leave no partial row on validation failure.
const beforeTurns=tables.Turnusse.length;
assert.throws(()=>ctx.gaSaveTurnus_(admin,{Bezeichnung:'Ohne Datum',Bereich:'Grundausbildung'}),/Startdatum/);
assert.equal(tables.Turnusse.length,beforeTurns);
ctx.gaSaveTurnus_(admin,{Bezeichnung:'Neuer Turnus',Bereich:'Grundausbildung',Startdatum:'2028-01-15'});
const createdTurn=tables.Turnusse.find(t=>t.Bezeichnung==='Neuer Turnus');
assert.equal(ctx.gaValidityConfig_().turnus[createdTurn.ID],'2028-01-15');

// A date entered in a course project survives review and is copied to its published course.
ctx.gaSaveProject_(admin,{Titel:'Neues Modul',Bereich:'Grundausbildung',Typ:'Praxis',
 Inhalt:'Übungsinhalt',Lernziele:'',PraesentationURL:'',WeitereLinks:'',Status:'Neu',GueltigAb:'2028-01-01'});
const project=tables.KursProjekte.find(p=>p.Titel==='Neues Modul');
assert.equal(ctx.gaValidityConfig_().projekt[project.ID],'2028-01-01');
ctx.gaSubmitProject_(admin,{ID:project.ID});
ctx.gaReviewProject_(admin,{ID:project.ID,Entscheidung:'Freigeben'});
assert.equal(ctx.gaValidityConfig_().kurs[project.KursID],'2028-01-01');

// The organizer cannot use the normal API to mutate GAB dates or GAB quiz settings.
ctx.gaSession_=()=>organizer;ctx.gaLock_=fn=>fn();
assert.throws(()=>ctx.gaApi('setValidity',{Art:'kurs',ID:'old-course',Datum:'2028-01-01'},'token'),/erweiterte Ausbildung/);
assert.throws(()=>ctx.gaApi('saveQuiz',{...quizData,KursID:'old-course'},'token'),/erweiterten Ausbildung/);
ctx.gaApi('saveCourse',{ID:'adv-course',Titel:'Erweitert',Bereich:'Erweiterte Ausbildung',Inhalt:'Inhalt',Lernziele:'',Links:'',GueltigAb:'2028-01-01'},'token');
assert.equal(ctx.gaValidityConfig_().kurs['adv-course'],'2028-01-01');
set('kurs','adv-course','2027-01-01',organizer);
const trainer={ID:'trainer',Rolle:'Ausbilder',Aktiv:'JA'};
tables.Berechtigungen.push({BenutzerID:'trainer',KurseBearbeiten:'JA'});
ctx.gaSession_=()=>trainer;
const courseBefore=JSON.stringify(tables.Kurse.find(c=>c.ID==='new-course'));
assert.throws(()=>ctx.gaApi('saveCourse',{ID:'new-course',Titel:'Neu',Bereich:'Grundausbildung',Inhalt:'Inhalt',Lernziele:'',Links:'',GueltigAb:'2028-01-01'},'token'),/Berechtigung/);
assert.equal(JSON.stringify(tables.Kurse.find(c=>c.ID==='new-course')),courseBefore);
assert.throws(()=>ctx.gaApi('setValidity',{Art:'turnus',ID:'gab-old',Datum:'2025-09-01'},'token'),/Berechtigung/);

// Actual state responses must keep cohorts and personal records separate.
const beforeStates=JSON.stringify(tables);
const oldState=ctx.gaState_(user('u-old')),newState=ctx.gaState_(user('u-new'));
const oldQuiz=oldState.quizKurse.find(q=>q.KursID==='existing-course');
const newQuiz=newState.quizKurse.find(q=>q.KursID==='existing-course');
assert.equal(oldQuiz.GueltigkeitStatus,'exempt');
assert.equal(oldQuiz.Pflicht,'NEIN');
assert.equal(newQuiz.GueltigkeitStatus,'applies');
assert.equal(newQuiz.Pflicht,'JA');
assert.deepEqual(Array.from(oldState.mitglieder,m=>m.ID),['old']);
assert(oldState.teilnahmen.every(a=>a.MitgliedID==='old'));
assert(!Object.keys(oldState.gueltigkeit.turnus).includes('gab-new'));
assert(!Object.keys(oldState.gueltigkeit.kurs).includes('adv-course'));
assert(!JSON.stringify(oldState).includes('not-for-the-client'));
const orgState=ctx.gaAdvancedOrganizerState_(organizer);
assert(!Object.keys(orgState.gueltigkeit.turnus).includes('gab-old'));
assert(!Object.keys(orgState.gueltigkeit.kurs).includes('new-course'));
const orgGuest=orgState.mitglieder.find(m=>m.ID==='guest');
assert(orgGuest&&!Object.prototype.hasOwnProperty.call(orgGuest,'Email'));
assert(orgState.erweiterteZuordnungen.every(a=>['adv-old','adv-new'].includes(a.TurnusID)));
assert.equal(JSON.stringify(tables),beforeStates,'Loading states must not modify training records');

// Old queued quiz notifications remain stored but cannot generate stale pushes.
const savedAttempts=tables.QuizVersuche,savedNotes=tables.Benachrichtigungen;
tables.QuizVersuche=[];
const version=tables.QuizKurse.find(q=>q.KursID==='existing-course').Version;
tables.Benachrichtigungen=[
 {ID:'pending-old',BenutzerID:'u-old',Typ:'Aufgabe',Titel:'Quiz',Text:'Quiz',BezugID:`QUIZREADY:existing-course:${version}:P`,PushStatus:'Wartend'},
 {ID:'pending-new',BenutzerID:'u-new',Typ:'Aufgabe',Titel:'Quiz',Text:'Quiz',BezugID:`QUIZREADY:existing-course:${version}:P`,PushStatus:'Wartend'}];
tables.PushGeraete=[{ID:'device-old',BenutzerID:'u-old',Aktiv:'JA',Endpoint:'https://example.test/old',P256DH:'x',Auth:'x'},
 {ID:'device-new',BenutzerID:'u-new',Aktiv:'JA',Endpoint:'https://example.test/new',P256DH:'x',Auth:'x'}];
let pushes=0;props.setProperty('GA_WORKER_SECRET','s'.repeat(48));
ctx.Utilities.computeHmacSha256Signature=()=>[1,2,3];ctx.Utilities.Charset={UTF_8:'UTF_8'};
ctx.UrlFetchApp={fetch:()=>{pushes++;return {getResponseCode:()=>200,getContentText:()=>'{"ok":true,"results":[{"ok":true}]}'}}};
actualPushQueue(10);
assert.equal(tables.Benachrichtigungen.find(n=>n.ID==='pending-old').PushStatus,'Nicht mehr erforderlich');
assert.equal(tables.Benachrichtigungen.find(n=>n.ID==='pending-new').PushStatus,'Gesendet (1)');
assert.equal(pushes,1);
tables.QuizVersuche=savedAttempts;tables.Benachrichtigungen=savedNotes;
props.setProperty('GA_WORKER_SECRET','not-for-the-client');

// Exercise the actual front-end render helpers with the same cohort records.
const front=vm.createContext({console,document:{getElementById:()=>null},
 h:x=>String(x??''),by:(rows,id)=>(rows||[]).find(x=>x.ID===id),
 STATE:{turnusse:turns,kurse:courses,mitglieder:ctx.gaRows_('Mitglieder'),
  termine:ctx.gaRows_('Termine'),teilnahmen:ctx.gaRows_('Teilnahmen'),
  erweiterteZuordnungen:assignments,gueltigkeit:meta,quizKurse:existingCfg,
  quizVersuche:[],quizFreigaben:[],meMember:member('old')}});
vm.runInContext(fs.readFileSync(path.join(root,'quiz-ui.js'),'utf8'),front,{filename:'quiz-ui.js'});
vm.runInContext(fs.readFileSync(path.join(root,'organizer-ui.js'),'utf8'),front,{filename:'organizer-ui.js'});
assert.equal(front.qCourseStatus('existing-course','old','gab-old').complete,true);
assert.equal(front.qCourseStatus('existing-course','new','gab-new').complete,false);
front.STATE.quizVersuche=[{KursID:'existing-course',MitgliedID:'new',QuizVersion:'1',Bestanden:'JA',Status:'Abgegeben',Prozent:'90'}];
assert.equal(front.qCourseStatus('existing-course','new','gab-new').complete,true);
assert.equal(front.gaUiValidityDecision('adv-course','guest','kurs'),'applies');
assert.equal(front.gaUiValidityDecision('new-course','guest','kurs'),'exempt');
front.STATE.quizKurse=[{...existingCfg[0],GueltigkeitStatus:'exempt',FrageAnzahl:2,Bestehensgrenze:80}];
front.STATE.quizVersuche=[];
assert(!front.qParticipant().includes('existing-course'), 'Exempt participants must not be prompted to do a new quiz');
front.STATE.quizKurse[0].GueltigkeitStatus='unknown';
assert(front.qParticipant().includes('Startdatum prüfen'));
front.STATE.quizKurse[0].GueltigkeitStatus='exempt';
front.STATE.quizVersuche=[{KursID:'existing-course',MitgliedID:'old',QuizVersion:'1',Bestanden:'JA',Status:'Abgegeben',Prozent:'90'}];
assert(front.qParticipant().includes('Quiz bestanden'));

// Organizer sees only the advanced metadata supplied to the role; previous quiz versions count.
front.STATE={turnusse:turns.filter(t=>t.Bereich==='Erweiterte Ausbildung'),
 kurse:[course('adv-course')],mitglieder:[{...member('guest'),TurnusID:'adv-new',Ausbildungsweg:'GAB-Gast'}],
 termine:tables.Termine.filter(t=>t.KursID==='adv-course'),teilnahmen:tables.Teilnahmen,
 erweiterteZuordnungen:assignments,gueltigkeit:meta,
 quizKurse:[{KursID:'adv-course',Aktiv:'JA',Pflicht:'JA',Version:'2'}],
 quizVersuche:[{KursID:'adv-course',MitgliedID:'guest',QuizVersion:'1',Bestanden:'JA'}]};
assert(front.gaOrganizerQualifications().includes('Positiv abgeschlossen'));

// Render the real admin controls with an updated backend and again with an old backend.
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
function functionText(name){
 const start=html.indexOf(`function ${name}(`);assert(start>=0,name);
 const end=html.indexOf('\nfunction ',start+1);assert(end>start,name+' end');
 return html.slice(start,end);
}
front.areaOptions=()=>'<option>Grundausbildung</option>';front.courseCard=()=>'';
front.role=()=> 'Administrator';
front.by=(rows,id)=>(rows||[]).find(x=>x.ID===id);
front.STATE={turnusse:turns,mitglieder:tables.Mitglieder,kurse:courses,
 gueltigkeit:meta,rechte:{KurseBearbeiten:true},kursProjekte:[]};
front.FORM='course';front.EDIT='existing-course';front.PROJECT_REVIEW_ID='';
vm.runInContext(functionText('turnusse')+'\n'+functionText('courses')+'\n'+functionText('projects'),front);
assert(front.turnusse().includes('name="Startdatum"'));
assert(front.turnusse().includes('value="2025-09-01"'));
assert(front.courses().includes('name="GueltigAb"'));
front.role=()=> 'Ausbilder';
assert(!front.courses().includes('name="GueltigAb"'),'Trainers must not change the course obligation date');
front.role=()=> 'Administrator';
front.STATE.rechte.KurseGestalten=true;
assert(front.projects().includes('name="GueltigAb"'));
front.STATE.quizKurse=[{KursID:'existing-course',Aktiv:'JA',Pflicht:'JA',Version:'2',FrageAnzahl:0}];
vm.runInContext("Q_EDIT='existing-course';Q_META=null;Q_ITEMS=[];",front);
assert(front.qEditPage().includes('name="GueltigAb"'));
assert(front.qEditPage().includes('value="2027-01-01"'));
delete front.STATE.gueltigkeit;
assert(!front.courses().includes('name="GueltigAb"'),'Old backend must not pretend to save a date');

console.log('Backend: Cohorts, legacy passes, replacement chains, quiz notices, permissions and rollback passed.');
console.log('Frontend: cohort display, participant and advanced guest quiz results passed.');
