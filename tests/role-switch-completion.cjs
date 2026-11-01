'use strict';
// Alle Daten und Benachrichtigungen bleiben in diesem isolierten Speicher.
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'..','Code.gs'),'utf8');
const users=[
 {ID:'admin',Name:'Admin',Email:'admin@example.test',Rolle:'Administrator',Aktiv:'JA'},
 {ID:'org1',Name:'Org Eins',Email:'org1@example.test',Rolle:'Organisator Erweiterte Ausbildung',Aktiv:'JA'},
 {ID:'org2',Name:'Org Zwei',Email:'org2@example.test',Rolle:'Organisator Erweiterte Ausbildung',Aktiv:'JA'},
 {ID:'inactive',Name:'Org Inaktiv',Rolle:'Organisator Erweiterte Ausbildung',Aktiv:'NEIN'},
 {ID:'teacher',Name:'Ausbilder',Rolle:'Ausbilder',Aktiv:'JA'},
 {ID:'person',Name:'M Eins',Email:'m1@example.test',Rolle:'Teilnehmer',Aktiv:'JA'}];
const member=(id)=>({ID:id,Vorname:'Vor'+id,Nachname:'Nach'+id,Email:id+'@example.test',Telefon:'secret-'+id,TurnusID:'gab',Ausbildungsweg:'Grundausbildung',Aktiv:'JA'});
const tables={Benutzer:users,Turnusse:[{ID:'gab',Bezeichnung:'GAB',Bereich:'Grundausbildung',Aktiv:'JA'},
 {ID:'adv',Bezeichnung:'Erweitert',Bereich:'Erweiterte Ausbildung',Aktiv:'JA'}],
 Mitglieder:['m1','m2','m3','m4'].map(member),Kurse:[{ID:'c',Titel:'GAB geheim',Bereich:'Grundausbildung',Aktiv:'JA',Links:'https://secret.example'}],
 Termine:[],Teilnahmen:[],Checklistenpunkte:[],MitgliedChecks:[],Nachrichten:[],Benachrichtigungen:[],
 ErweiterteZuordnungen:[{ID:'existing',MitgliedID:'m4',TurnusID:'adv'}],
 QualifikationMitglieder:[{ID:'q1',MitgliedID:'m1',GABFreigabe:'NEIN'},{ID:'q2',MitgliedID:'m2',GABFreigabe:'JA'},
 {ID:'q3',MitgliedID:'m3',GABFreigabe:'JA'},{ID:'q4',MitgliedID:'m4',GABFreigabe:'JA'}],
 AbschnittNachweise:[],QuizVersuche:[{ID:'old-attempt',MitgliedID:'m1',KursID:'c',Status:'Abgegeben',Bestanden:'JA',QuizVersion:'1'}],
 PushGeraete:[{ID:'device',BenutzerID:'org1',Aktiv:'JA'}]};
function proof(id,which,passed='JA'){tables.AbschnittNachweise.push({ID:id+'-'+which,MitgliedID:id,KursID:'GAB-ABSCHNITT-BLOCK-'+which,Absolviert:'JA',PruefungBestanden:passed,Ausbildungsdatum:'2026-01-01',Pruefungsdatum:'2026-01-01'});}
for(const id of ['m1','m3','m4']){proof(id,'A');proof(id,'B',id==='m3'?'NEIN':'JA');}proof('m2','A');
let seq=0,actor=users[0],push=[];
const props={getProperties:()=>({}),getProperty:()=>null};
const ctx=vm.createContext({console,Date,JSON,Set,Map,PropertiesService:{getScriptProperties:()=>props},
 Utilities:{formatDate:()=> '2026-11-01'},Session:{getScriptTimeZone:()=> 'Europe/Vienna'}});
vm.runInContext(source,ctx,{filename:'Code.gs'});
ctx.gaRows_=name=>(tables[name]||[]).map(x=>({...x}));ctx.gaOptionalRows_=ctx.gaRows_;
ctx.gaAppend_=(name,row)=>{(tables[name]||(tables[name]=[])).push({...row});};
ctx.gaReplace_=(name,id,changes)=>{const row=(tables[name]||[]).find(x=>x.ID===id);assert(row,`${name} ${id}`);Object.assign(row,changes);};
ctx.gaId_=()=>`new-${++seq}`;ctx.gaLog_=()=>{};ctx.gaNow_=()=> '2026-11-01T12:00:00';ctx.gaLock_=fn=>fn();ctx.gaSession_=()=>actor;
ctx.gaPushQueue_=(limit,id)=>{push.push({limit,id});};
const before=JSON.stringify(tables),org=ctx.gaState_(users[1]);
assert.deepEqual(Array.from(org.gabAbgeschlossen,x=>x.ID),['m4']);
assert.deepEqual(Array.from(org.gabAbgeschlossen[0].ErweiterteTurnusIDs),['adv']);
assert.deepEqual(Object.keys(org.gabAbgeschlossen[0]).sort(),['ErweiterteTurnusIDs','ID','Nachname','Vorname']);
assert(!JSON.stringify(org).includes('secret-m4'));assert(!JSON.stringify(org).includes('GAB geheim'));
assert.equal(JSON.stringify(tables),before,'Opening the overview cannot create notices or change data');
// The administrator sees a particular person's own state; neither role nor login changes.
let result=ctx.gaApi('state',{_gaRolePreview:'person'},'token');
assert.equal(result.administratorRollenvorschau,true);assert.equal(result.user.ID,'person');assert.equal(result.meMember.ID,'m1');
assert(!JSON.stringify(result).includes('secret-m2'));
assert.throws(()=>ctx.gaApi('saveQualification',{_gaRolePreview:'person',MitgliedID:'m1'},'token'),/schreibgeschützt/);
assert.throws(()=>ctx.gaApi('readNotification',{_gaRolePreview:'person',ID:'x'},'token'),/schreibgeschützt/);
assert.throws(()=>ctx.gaApi('state',{_gaRolePreview:'inactive'},'token'),/Aktives Benutzerkonto/);
assert.throws(()=>ctx.gaApi('state',{_gaRolePreview:'person',_gaAdvancedView:true},'token'),/Ungültige Ansicht/);
assert.equal(JSON.stringify(tables),before);
actor=users[5];assert.throws(()=>ctx.gaApi('state',{_gaRolePreview:'admin'},'token'),/Administratoren/);
assert.throws(()=>ctx.gaApi('state',{_gaAdvancedView:true},'token'),/Administratoren/);
actor=users[0];result=ctx.gaApi('state',{_gaAdvancedView:true},'token');
assert.equal(result.administratorErweitert,true);assert.equal(result.user.ID,'admin');assert.equal(result.user.Rolle,'Organisator Erweiterte Ausbildung');
assert(!result.kurse.some(x=>x.ID==='c'));
assert.throws(()=>ctx.gaApi('saveQualification',{_gaAdvancedView:true,MitgliedID:'m1'},'token'),/Berechtigung/);
assert.throws(()=>ctx.gaApi('saveCourse',{_gaAdvancedView:true,ID:'c'},'token'),/erweiterten Ausbildung/);
ctx.gaApi('saveAdvancedEnrollment',{_gaAdvancedView:true,MitgliedID:'m1',TurnusID:'adv'},'token');
assert.equal(tables.Mitglieder.find(m=>m.ID==='m1').TurnusID,'gab');
assert(tables.ErweiterteZuordnungen.some(x=>x.MitgliedID==='m1'&&x.TurnusID==='adv'&&x.ZugeordnetVon==='admin'));
// Release alone is insufficient for m3 because the Block B exam is not passed.
ctx.gaApi('saveQualification',{MitgliedID:'m3',GABFreigabe:'JA'},'token');
assert.equal(tables.Benachrichtigungen.length,0);
// Final release creates one in-app message per active organizer; push is queued by ID.
ctx.gaApi('saveQualification',{MitgliedID:'m1',GABFreigabe:'JA'},'token');
let notices=tables.Benachrichtigungen.filter(x=>x.BezugID==='GABREADY:m1');
assert.deepEqual(notices.map(x=>x.BenutzerID).sort(),['org1','org2']);
assert.equal(notices.find(x=>x.BenutzerID==='org1').PushStatus,'Wartend');
assert.equal(notices.find(x=>x.BenutzerID==='org2').PushStatus,'Kein Gerät registriert');
assert.equal(push.length,2);
ctx.gaApi('saveQualification',{MitgliedID:'m1',GABFreigabe:'JA'},'token');
ctx.gaApi('saveQualification',{MitgliedID:'m1',GABFreigabe:'NEIN'},'token');
ctx.gaApi('saveQualification',{MitgliedID:'m1',GABFreigabe:'JA'},'token');
assert.equal(tables.Benachrichtigungen.filter(x=>x.BezugID==='GABREADY:m1').length,2,'No duplicates after repeat saves or re-confirmation');
// Alternatively the final Block B proof may finish the GAB.
ctx.gaApi('saveAbschnittNachweis',{MitgliedID:'m2',KursID:'GAB-ABSCHNITT-BLOCK-B',Absolviert:'JA',PruefungBestanden:'JA',Ausbildungsdatum:'2026-04-01',Pruefungsdatum:'2026-04-02'},'token');
assert.equal(tables.Benachrichtigungen.filter(x=>x.BezugID==='GABREADY:m2').length,2);
result=ctx.gaState_(users[1]);
assert.deepEqual(Array.from(result.gabAbgeschlossen,x=>x.ID).sort(),['m1','m2','m4']);
assert.equal(result.gabAbgeschlossen.find(x=>x.ID==='m1').ErweiterteTurnusIDs[0],'adv');
assert.equal(result.gabAbgeschlossen.find(x=>x.ID==='m2').ErweiterteTurnusIDs.length,0);
assert.deepEqual(tables.QuizVersuche,[{ID:'old-attempt',MitgliedID:'m1',KursID:'c',Status:'Abgegeben',Bestanden:'JA',QuizVersion:'1'}]);
assert.equal(tables.Mitglieder.find(x=>x.ID==='m1').TurnusID,'gab');
// Old and new two-choice question types remain distinct on the server.
const normalized=ctx.gaQuizQuestions_([{typ:'tf',text:'Aussage?',correct:[1]},{typ:'yn',text:'Frage?',correct:[0]}]);
assert.deepEqual(Array.from(normalized[0].options),['Richtig','Falsch']);assert.deepEqual(Array.from(normalized[1].options),['Ja','Nein']);
assert.deepEqual(Array.from(normalized[0].correct),[1]);assert.deepEqual(Array.from(normalized[1].correct),[0]);
// The real start and grading paths use the two distinct labels and preserve passing attempts.
const participant2={ID:'person2',Name:'M Zwei',Email:'m2@example.test',Rolle:'Teilnehmer',Aktiv:'JA'};
tables.Benutzer.push(participant2);
tables.Termine.push({ID:'term',KursID:'c',TurnusID:'gab',Status:'Durchgeführt',Beginn:'2026-01-01T08:00'});
tables.Teilnahmen.push({ID:'attendance',TerminID:'term',MitgliedID:'m2',Anwesend:'JA'});
tables.QuizKurse=[{ID:'quiz',KursID:'c',Aktiv:'JA',Pflicht:'JA',Version:'1',Bestehensgrenze:'100',MaxVersuche:'3',ZeitlimitMinuten:'0',FragenJSON:JSON.stringify(normalized)}];
ctx.gaQuizInstalled_=()=>{};actor=participant2;
const attempt=ctx.gaApi('startQuiz',{KursID:'c'},'token');
assert.deepEqual(Array.from(attempt.Fragen[0].options),['Richtig','Falsch']);assert.deepEqual(Array.from(attempt.Fragen[1].options),['Ja','Nein']);
const grade=ctx.gaApi('submitQuiz',{VersuchID:attempt.VersuchID,Antworten:[1,0]},'token');
assert.equal(grade.Bestanden,true);assert.equal(grade.Prozent,100);
assert.throws(()=>ctx.gaApi('startQuiz',{KursID:'c'},'token'),/bereits erfolgreich bestanden/);
assert(tables.QuizVersuche.some(x=>x.ID==='old-attempt'&&x.Bestanden==='JA'));
console.log('Role switch, read-only security, GAB completion, scoped notifications, preserved cohorts and quiz types passed.');
