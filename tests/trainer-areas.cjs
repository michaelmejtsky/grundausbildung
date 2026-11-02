'use strict';
// Rein lokale Prüfungen ohne Änderungen an der produktiven Datenbank.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..'),values=new Map([['GA_WORKER_SECRET','secret-stays-private']]);
const props={getProperties:()=>Object.fromEntries(values),getProperty:k=>values.has(k)?values.get(k):null,
 setProperty(k,v){values.set(k,String(v));return this;},deleteProperty(k){values.delete(k);return this;}};
const tables={
 Benutzer:[{ID:'admin',Name:'Admin',Email:'admin@example.test',Rolle:'Administrator',Aktiv:'JA'},
  {ID:'trainer1',Name:'Ausbilder Eins',Email:'one@example.test',Rolle:'Ausbilder',Aktiv:'JA'},
  {ID:'trainer2',Name:'Ausbilder Zwei',Email:'two@example.test',Rolle:'Ausbilder',Aktiv:'JA'},
  {ID:'org',Name:'Organisation',Email:'org@example.test',Rolle:'Organisator Erweiterte Ausbildung',Aktiv:'JA'},
  {ID:'participant',Name:'Teilnehmer',Email:'p@example.test',Rolle:'Teilnehmer',Aktiv:'JA'}],
 Berechtigungen:[{BenutzerID:'trainer1',KurseBearbeiten:'JA',KurseGestalten:'JA'},
  {BenutzerID:'trainer2',KurseBearbeiten:'NEIN',KurseGestalten:'NEIN'}],
 Turnusse:[{ID:'g1',Bezeichnung:'GAB',Bereich:'Grundausbildung',Aktiv:'JA'},
  {ID:'e1',Bezeichnung:'Erweitert',Bereich:'Erweiterte Ausbildung',Aktiv:'JA'}],
 Mitglieder:[{ID:'m1',Vorname:'Teil',Nachname:'Nehmer',Email:'p@example.test',TurnusID:'g1',Aktiv:'JA'}],
 Kurse:[{ID:'gab',Titel:'GAB Modul',Bereich:'Grundausbildung',Inhalt:'GAB Inhalt',Lernziele:'Ziele',Links:'https://example.test/gab',Aktiv:'JA'},
  {ID:'adv',Titel:'Erweitertes Modul',Bereich:'Erweiterte Ausbildung',Inhalt:'Erweitert',Lernziele:'Ziele',Links:'https://example.test/adv',Aktiv:'JA'}],
 Termine:[{ID:'t1',KursID:'gab',TurnusID:'g1',Beginn:'2026-10-01T08:00',Ende:'2026-10-01T10:00',Status:'Geplant'},
  {ID:'t2',KursID:'adv',TurnusID:'e1',Beginn:'2026-10-02T08:00',Ende:'2026-10-02T10:00',Status:'Geplant'}],
 ErweiterteZuordnungen:[{ID:'extra',MitgliedID:'m1',TurnusID:'e1'}],
 Teilnahmen:[],QuizVersuche:[{ID:'past',KursID:'gab',MitgliedID:'m1',Bestanden:'JA',Status:'Abgegeben',QuizVersion:'1'}],
 QuizKurse:[],QuizFreigaben:[],KursAnforderungen:[],KursProjekte:[],Ausbildungsberichte:[]
};
let seq=0;
const ctx=vm.createContext({console,Date,JSON,Set,Map,PropertiesService:{getScriptProperties:()=>props},
 Utilities:{formatDate:()=> '2026-11-01',newBlob:s=>({getBytes:()=>Buffer.from(s,'utf8')})},
 Session:{getScriptTimeZone:()=> 'Europe/Vienna'}});
vm.runInContext(fs.readFileSync(path.join(root,'Code.gs'),'utf8'),ctx,{filename:'Code.gs'});
ctx.gaRows_=name=>(tables[name]||[]).map(row=>({...row}));ctx.gaOptionalRows_=ctx.gaRows_;
ctx.gaAppend_=(name,row)=>{(tables[name]||(tables[name]=[])).push({...row});return row;};
ctx.gaReplace_=(name,id,changes)=>{const row=(tables[name]||[]).find(x=>x.ID===id);if(!row)throw Error('missing '+name+' '+id);Object.assign(row,changes);return row;};
ctx.gaId_=()=>`id-${++seq}`;ctx.gaLog_=()=>{};ctx.gaNotify_=()=>{};ctx.gaPushQueue_=()=>{};
ctx.gaSheet_=()=>({getSheetByName:()=>({})});ctx.gaTrainingDetails_=()=>({DauerMinuten:120,FahrzeugeJSON:'[]'});
ctx.gaLock_=fn=>fn();let actor=tables.Benutzer[0];ctx.gaSession_=()=>actor;
const admin=tables.Benutzer[0],trainer2=tables.Benutzer[2],org=tables.Benutzer[3],participant=tables.Benutzer[4];
const course=id=>({...tables.Kurse.find(x=>x.ID===id)});
const courseData=(id,extra={})=>({...course(id),...extra});
const plain=x=>JSON.parse(JSON.stringify(x));
const originals={quiz:JSON.stringify(tables.QuizVersuche),members:JSON.stringify(tables.Mitglieder),links:course('gab').Links};

const G='Grundausbildung',E='Erweiterte Ausbildung',trainer=tables.Benutzer[1],key=id=>'GA_TRAINER_AREAS_V1_'+encodeURIComponent(id);
const setAreas=(u,a)=>values.set(key(u.ID),JSON.stringify(a));
const call=(method,data={},area)=>ctx.gaApi(method,{...data,...(area?{_gaTrainerArea:area}:{})},'token');
tables.Mitglieder.push({ID:'native',Vorname:'Erweitert',Nachname:'Person',Email:'native@example.test',TurnusID:'e1',Telefon:'secret-advanced',Aktiv:'JA'});
tables.Mitglieder[0].Telefon='secret-gab';tables.Mitglieder[0].Geburtsdatum='2010-01-01';
tables.Benutzer.push({ID:'pn',Name:'Erweiterter Teilnehmer',Email:'native@example.test',Rolle:'Teilnehmer',Aktiv:'JA'});
tables.KursProjekte.push({ID:'pg',Bereich:G,Status:'Neu',ErstelltVon:trainer.ID},{ID:'pe',Bereich:E,Status:'Neu',ErstelltVon:trainer.ID});
tables.FreieTaetigkeiten=[{ID:'fg',Bereich:G},{ID:'fe',Bereich:E},{ID:'legacy',Bereich:'',ErfasstVon:trainer.ID},{ID:'otherlegacy',Bereich:'',ErfasstVon:org.ID}];
tables.Meldungen=[{ID:'rg',KursID:'gab'},{ID:'re',KursID:'adv'},{ID:'r-own',ErstelltVon:trainer.ID},{ID:'r-other',ErstelltVon:org.ID}];
tables.Bewertungen=[{ID:'bg',KursID:'gab',TerminID:'t1'},{ID:'be',KursID:'adv',TerminID:'t2'}];
tables.BewertungsFrageboegen=[{ID:'qg',KursID:'gab',Aktiv:'JA'},{ID:'qe',KursID:'adv',Aktiv:'JA'},{ID:'qa',KursID:'ALLGEMEIN',Aktiv:'JA'}];
tables.Berechtigungen[0].BewertungenAnsehen='JA';tables.Berechtigungen[0].MeldungenBearbeiten='JA';
tables.QuizKurse=[{KursID:'gab',FragenJSON:'[]'},{KursID:'adv',FragenJSON:'[]'}];
tables.QuizFreigaben=[{KursID:'gab',MitgliedID:'m1'},{KursID:'adv',MitgliedID:'m1'}];
tables.Teilnahmen=[{ID:'ag',TerminID:'t1',MitgliedID:'m1'},{ID:'ae',TerminID:'t2',MitgliedID:'m1'}];
tables.Ausbildungsberichte=[{ID:'tg',TerminID:'t1'},{ID:'te',TerminID:'t2'}];
const dataBefore=JSON.stringify(tables);
actor=trainer;
let state=call('state');assert.equal(state.ausbilderBereichAuswahlNoetig,true);assert(!state.kurse);assert(!state.mitglieder);
assert.deepEqual(plain(state.ausbilderBereiche),[G,E]);
assert.throws(()=>call('getQuizEdit',{KursID:'gab'}),/auswählen/);
assert.equal(call('state',{},'Administrator').ausbilderBereichAuswahlNoetig,true);
for(const [area,cid,tid,pid] of [[G,'gab','t1','pg'],[E,'adv','t2','pe']]){
 state=call('state',{},area);assert.equal(state.user.Rolle,'Ausbilder');assert.equal(state.ausbilderBereich,area);
 assert.deepEqual(plain(state.kurse.map(x=>x.ID)),[cid]);assert.deepEqual(plain(state.termine.map(x=>x.ID)),[tid]);
 assert.deepEqual(plain(state.kursProjekte.map(x=>x.ID)),[pid]);assert.deepEqual(plain(state.ausbildungsberichte.map(x=>x.TerminID)),[tid]);
 assert(state.teilnahmen.every(x=>x.TerminID===tid));assert(state.quizKurse.every(x=>x.KursID===cid));assert(state.quizFreigaben.every(x=>x.KursID===cid));
 assert(state.bewertungen.every(x=>x.KursID===cid));assert(state.frageboegen.every(x=>x.KursID==='ALLGEMEIN'||x.KursID===cid));assert(state.frageboegen.some(x=>x.KursID==='ALLGEMEIN'));
 assert(state.meldungen.every(x=>x.KursID===cid||x.ErstelltVon===trainer.ID));assert(!state.freieTaetigkeiten.some(x=>x.ID==='otherlegacy'));
 assert(state.freieTaetigkeiten.some(x=>x.ID==='legacy'));
 if(area===E){const guest=state.mitglieder.find(m=>m.ID==='m1');assert(guest);assert(!guest.Email);assert(!guest.Telefon);assert(!guest.Geburtsdatum);assert.equal(guest.TurnusID,'e1');}
 else{assert(state.mitglieder.some(m=>m.ID==='m1'&&m.Telefon==='secret-gab'));assert(!state.nachrichtenEmpfaenger.some(x=>x.ID==='pn'));}
}
assert.equal(JSON.stringify(tables),dataBefore,'State selection and switching must never write training data or create notifications');
// Exact object-ID guards protect every trainer operation, including old source + new target IDs.
const deny=[['saveCourse',{ID:'adv',Bereich:G}],['saveCourse',{ID:'gab',Bereich:E}],
 ['saveQuiz',{KursID:'adv'}],['getQuizEdit',{KursID:'adv'}],['unlockQuiz',{KursID:'adv',MitgliedID:'m1'}],
 ['saveQuestionnaire',{KursID:'ALLGEMEIN'}],['saveQuestionnaire',{KursID:'adv'}],
 ['saveTermin',{ID:'t2',KursID:'gab',TurnusID:'g1'}],['saveTermin',{KursID:'adv',TurnusID:'g1'}],
 ['saveAttendance',{TerminID:'t2'}],['saveProject',{ID:'pe',Bereich:G}],['saveProject',{Bereich:E}],
 ['submitProject',{ID:'pe'}],['reviewProject',{ID:'pe'}],['submitReport',{KursID:'adv'}],['setReportStatus',{ID:'re'}],['setReportStatus',{ID:'r-other'}],
 ['exportTrainingPdf',{KursID:'adv'}],['exportTrainingPdf',{TerminID:'t2'}],['exportFreeActivityPdf',{ID:'fe'}],
 ['saveFreeActivity',{ID:'fe'}],['saveFreeActivity',{TeilnehmerIDs:['native']}],['sendDirect',{AnBenutzerID:'pn'}],
 ['completeAdvancedTraining',{MitgliedID:'m1'}],['saveMember',{ID:'m1'}],['setPermission',{BenutzerID:trainer.ID}]];
for(const [method,data] of deny)assert.throws(()=>call(method,data,G),/Zugriff|Bereich|Turnus|Berechtigung|Teilnehmer|Kurs muss|Kursprojekt muss|Meldungen/,'must deny '+method);
assert.equal(JSON.stringify(tables),dataBefore);
// Members outside advanced scope cannot be granted attempts just by forging an ID.
tables.Mitglieder.push({ID:'outsider',TurnusID:'g1',Aktiv:'JA'});
assert.throws(()=>call('unlockQuiz',{KursID:'adv',MitgliedID:'outsider'},E),/Teilnehmer/);
// Admin permissions explicitly replace areas; old clients preserve the existing area choice.
actor=admin;call('setPermission',{BenutzerID:trainer.ID,KurseGestalten:'JA',Ausbildungsbereiche:[E]});
assert.deepEqual(plain(ctx.gaTrainerAreas_(trainer)),[E]);
call('setPermission',{BenutzerID:trainer.ID,KurseGestalten:'JA'});assert.deepEqual(plain(ctx.gaTrainerAreas_(trainer)),[E]);
assert.throws(()=>call('setPermission',{BenutzerID:trainer.ID,Ausbildungsbereiche:[]}),/mindestens/);
assert.throws(()=>call('setPermission',{BenutzerID:trainer.ID,Ausbildungsbereiche:['Administrator']}),/gültigen/);
actor=trainer;state=call('state');assert.equal(state.ausbilderBereich,E);assert.equal(state.ausbilderBereichAuswahlNoetig,false);
assert.throws(()=>call('getQuizEdit',{KursID:'gab'},G),/Berechtigung/);
// Revoked area refresh recovers into the remaining valid area; writes with a stale area fail.
state=call('state',{},G);assert.equal(state.ausbilderBereichNeuWaehlen,true);assert.equal(state.ausbilderBereich,E);
assert.throws(()=>call('saveCourse',{ID:'gab',Bereich:G},G),/Berechtigung/);
// Advanced-only instructors cannot access GAB-cohort advanced modules. Dual instructors retain that legacy workflow.
tables.Termine.push({ID:'mixed',KursID:'adv',TurnusID:'g1',Status:'Geplant'});
assert(!call('state').termine.some(t=>t.ID==='mixed'));
assert.throws(()=>call('saveAttendance',{TerminID:'mixed'}),/Turnus/);
setAreas(trainer,[G,E]);assert(call('state',{},E).termine.some(t=>t.ID==='mixed'));
ctx.gaTrainerGuard_(ctx.gaTrainerContext_(trainer,E),'saveAttendance',{TerminID:'mixed'});
// Trainer permission scope also applies to admin read-only previews and never changes the target account.
actor=admin;state=call('state',{_gaRolePreview:trainer.ID});assert.equal(state.administratorRollenvorschau,true);assert.equal(state.ausbilderBereichAuswahlNoetig,true);
state=call('state',{_gaRolePreview:trainer.ID},E);assert.equal(state.user.ID,trainer.ID);assert.equal(state.ausbilderBereich,E);
assert.throws(()=>call('saveCourse',{_gaRolePreview:trainer.ID,ID:'adv',Bereich:E},E),/schreibgeschützt/);
// Failed sheet write rolls area properties back; corrupt stored permission data fails closed.
const replace=ctx.gaReplace_,oldRaw=values.get(key(trainer.ID));ctx.gaReplace_=()=>{throw Error('write failed');};
assert.throws(()=>call('setPermission',{BenutzerID:trainer.ID,Ausbildungsbereiche:[G]}),/write failed/);assert.equal(values.get(key(trainer.ID)),oldRaw);ctx.gaReplace_=replace;
// A permission revoked while waiting for the write lock is checked again inside it.
actor=trainer;setAreas(trainer,[G,E]);const lock=ctx.gaLock_;ctx.gaLock_=fn=>{setAreas(trainer,[G]);return fn();};
assert.throws(()=>call('saveCourse',{ID:'adv',Bereich:E},E),/Berechtigung/);ctx.gaLock_=lock;
values.set(key(trainer.ID),'broken');assert.throws(()=>ctx.gaTrainerAreas_(trainer),/beschädigt/);
console.log('Trainer areas: dual/single selection, complete scoped state, guest privacy, all API guards, permission revocation, mixed cohorts, admin preview and rollback passed.');
