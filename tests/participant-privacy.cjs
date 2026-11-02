'use strict';
// Isoliert im Speicher; es werden keine Daten in Google Sheets geschrieben.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const course=(ID,Titel,Bereich)=>({ID,Titel,Bereich,Aktiv:'JA',Inhalt:'Beschreibung '+Titel+' https://private.example/'+ID,
 Lernziele:'Lernziel '+Titel+' docs.google.com/document/'+ID,Links:'https://private.example/'+ID});
const tables={
 Turnusse:[{ID:'g1',Bereich:'Grundausbildung',Aktiv:'JA'},{ID:'g2',Bereich:'Grundausbildung',Aktiv:'JA'},
  {ID:'g0',Bereich:'Grundausbildung',Aktiv:'NEIN'},{ID:'e1',Bereich:'Erweiterte Ausbildung',Aktiv:'JA'},{ID:'e2',Bereich:'Erweiterte Ausbildung',Aktiv:'JA'}],
 Mitglieder:[{ID:'m1',Vorname:'Eins',Nachname:'Person',Email:'one@example.test',TurnusID:'g1',Aktiv:'JA'},
  {ID:'m2',Vorname:'Zwei',Nachname:'Person',Email:'two@example.test',TurnusID:'g2',Aktiv:'JA'}],
 Kurse:[course('c1','Eigener GAB-Kurs','Grundausbildung'),course('c2','Fremder GAB-Kurs','Grundausbildung'),
  course('ce1','Eigener erweiterter Kurs','Erweiterte Ausbildung'),course('ce2','Fremder erweiterter Kurs','Erweiterte Ausbildung'),
  {...course('old','Eigener früherer Kurs','Grundausbildung'),Aktiv:'NEIN'},
  course('unplanned','Ungeplanter Katalogkurs','Grundausbildung')],
 Termine:[{ID:'t1',KursID:'c1',TurnusID:'g1',Beginn:'2027-05-01T08:00',Ende:'2027-05-01T10:00',Status:'Geplant'},
  {ID:'t2',KursID:'c2',TurnusID:'g2',Beginn:'2027-05-01T08:00',Status:'Geplant'},
  {ID:'te1',KursID:'ce1',TurnusID:'e1',Beginn:'2026-05-01T08:00',Status:'Durchgeführt'},
  {ID:'te2',KursID:'ce2',TurnusID:'e2',Beginn:'2026-05-01T08:00',Status:'Durchgeführt'},
  {ID:'told',KursID:'old',TurnusID:'g0',Beginn:'2025-05-01T08:00',Status:'Durchgeführt'}],
 ErweiterteZuordnungen:[{MitgliedID:'m1',TurnusID:'e1'}],
 Teilnahmen:[{ID:'a1',MitgliedID:'m1',TerminID:'te1',Anwesend:'JA'},
  {ID:'aold',MitgliedID:'m1',TerminID:'told',Anwesend:'JA'},
  {ID:'a2',MitgliedID:'m2',TerminID:'t2',Anwesend:'JA'}],
 QuizKurse:['c1','c2','ce1','ce2','unplanned'].map((id,i)=>({ID:'q'+i,KursID:id,Aktiv:'JA',Pflicht:'JA',Version:'1',FragenJSON:'[]'})),
 QuizVersuche:[{ID:'v1',MitgliedID:'m1',KursID:'ce1',TerminID:'te1',Bestanden:'JA',Status:'Abgegeben',QuizVersion:'1'},
  {ID:'v2',MitgliedID:'m2',KursID:'c2',TerminID:'t2',Bestanden:'JA',Status:'Abgegeben',QuizVersion:'1'}],
 BewertungsFrageboegen:[{ID:'f1',KursID:'c1',Aktiv:'JA'},{ID:'f2',KursID:'c2',Aktiv:'JA'},
  {ID:'fall',KursID:'ALLGEMEIN',Aktiv:'JA'}],
 Benutzer:[{ID:'p1',Name:'Eins',Email:'one@example.test',Rolle:'Teilnehmer',Aktiv:'JA'},
  {ID:'p2',Name:'Zwei',Email:'two@example.test',Rolle:'Teilnehmer',Aktiv:'JA'},
  {ID:'admin',Name:'Admin',Rolle:'Administrator',Aktiv:'JA'},
  {ID:'trainer',Name:'Trainer',Rolle:'Ausbilder',Aktiv:'JA'},
  {ID:'organizer',Name:'Organisation',Rolle:'Organisator Erweiterte Ausbildung',Aktiv:'JA'}],
 KursProjekte:[{ID:'project-g',Bereich:'Grundausbildung',PraesentationURL:'https://private.example/project-g'},
  {ID:'project-e',Bereich:'Erweiterte Ausbildung',PraesentationURL:'https://private.example/project-e'}]
};
const ctx=vm.createContext({console,Date,JSON,Set,Map,PropertiesService:{getScriptProperties:()=>({getProperties:()=>({}),getProperty:()=>null})},
 Utilities:{formatDate:()=> '2026-11-01'},Session:{getScriptTimeZone:()=> 'Europe/Vienna'}});
vm.runInContext(fs.readFileSync(path.join(root,'Code.gs'),'utf8'),ctx,{filename:'Code.gs'});
ctx.gaRows_=name=>(tables[name]||[]).map(x=>({...x}));ctx.gaOptionalRows_=ctx.gaRows_;ctx.gaQuizInstalled_=()=>{};
const user=id=>tables.Benutzer.find(x=>x.ID===id);
const before=JSON.stringify(tables),person=ctx.gaState_(user('p1')),other=ctx.gaState_(user('p2'));
const ids=rows=>Array.from(rows,x=>x.ID).sort();
assert.deepEqual(ids(person.kurse),['c1','ce1','old']);
assert.deepEqual(ids(person.termine),['t1','te1','told']);
assert.deepEqual(ids(person.turnusse),['e1','g0','g1']);
assert.deepEqual(ids(other.kurse),['c2']);
assert(person.kurse.every(c=>!Object.hasOwn(c,'Links')&&Object.keys(c).sort().join(',')==='Aktiv,Bereich,ID,Inhalt,Lernziele,Titel'));
assert(!JSON.stringify(person).includes('private.example'));
assert(!JSON.stringify(person).includes('docs.google.com'));
assert(!JSON.stringify(person).includes('Fremder GAB-Kurs'));
assert(!JSON.stringify(person).includes('Ungeplanter Katalogkurs'));
assert.equal(person.kurse.find(c=>c.ID==='c1').Inhalt.includes('Beschreibung Eigener GAB-Kurs'),true);
assert.equal(person.kurse.find(c=>c.ID==='c1').Lernziele.includes('Lernziel Eigener GAB-Kurs'),true);
assert.deepEqual(Array.from(person.quizKurse,q=>q.KursID).sort(),['c1','ce1']);
assert.deepEqual(ids(person.frageboegen),['f1','fall']);
assert.deepEqual(ids(person.quizVersuche),['v1']);
assert.deepEqual(ids(person.teilnahmen),['a1','aold']);
assert.equal(person.kursProjekte.length,0);
const noProfile=ctx.gaState_({ID:'orphan',Name:'Niemals zugeordnet',Email:'nobody@example.test',Rolle:'Teilnehmer',Aktiv:'JA'});
assert.equal(noProfile.kurse.length,0);assert.equal(noProfile.quizKurse.length,0);assert.equal(noProfile.frageboegen.length,0);
assert.throws(()=>ctx.gaGetQuizEdit_(user('p1'),{KursID:'c1'}),/Recht/);
for(const staffId of ['admin']){
 const staff=ctx.gaState_(user(staffId));
 assert.equal(staff.kurse.length,tables.Kurse.length);
 assert.equal(staff.kurse.find(c=>c.ID==='c1').Links,'https://private.example/c1');
}
const trainerChoice=ctx.gaState_(user('trainer'));assert.equal(trainerChoice.ausbilderBereichAuswahlNoetig,true);assert(!trainerChoice.kurse);
const trainerGab=ctx.gaState_({...user('trainer'),_gaTrainerArea:'Grundausbildung'});assert.deepEqual(ids(trainerGab.kurse),['c1','c2','old','unplanned']);assert(trainerGab.kurse.every(c=>c.Links));
const org=ctx.gaState_(user('organizer'));
assert.deepEqual(ids(org.kurse),['ce1','ce2']);
assert.equal(org.kurse[0].Links.startsWith('https://private.example/'),true);
const diagnostic=ctx.gaParticipantStatus_(user('p1'));
assert.equal(diagnostic.kurse,person.kurse.length);assert.equal(diagnostic.termine,person.termine.length);
assert.equal(JSON.stringify(tables),before,'Read-only state must never modify existing records');

// Echte Teilnehmeransicht auch mit altem Backend: keine Anzeige der bereits gelieferten Links.
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
function functionText(name){const start=html.indexOf('function '+name+'(');assert(start>=0,name);
 const end=html.indexOf('\nfunction ',start+1);assert(end>start,name);return html.slice(start,end);}
const front=vm.createContext({STATE:{...person,kurse:person.kurse.map(c=>({...c,Links:'https://private.example/inherited'})),
 user:{Rolle:'Teilnehmer'},rechte:{}},Date,Set,console,
 h:x=>String(x??''),by:(rows,id)=>(rows||[]).find(x=>x.ID===id),role:()=> 'Teilnehmer',
 dt:x=>String(x||''),gaTrainingUpcoming:t=>t.ID==='t1',gaTrainingTimestamp:x=>Date.parse(x)||0,
 qCourseBadge:()=>'<span>Bestätigt</span>',safeLinks:x=>'<a href="'+x+'">Unterlagen</a>'});
vm.runInContext(['navs','gaCoursePrivacyBanner','gaParticipantCourseText','gaCoursePlanInfo','courseCard','myterms'].map(functionText).join('\n'),front);
assert(!front.navs().some(x=>x[0]==='courses'));
const participantHtml=front.myterms();
assert(participantHtml.includes('Eigener GAB-Kurs'));
assert(participantHtml.includes('Ausbildungsinhalt'));
assert(participantHtml.includes('Lernziel Eigener GAB-Kurs'));
assert(!participantHtml.includes('private.example'));
assert(!participantHtml.includes('Präsentation und Unterlagen'));
assert(!front.courseCard({...tables.Kurse[0]}).includes('private.example'));
front.role=()=> 'Ausbilder';assert(front.courseCard({...tables.Kurse[0]}).includes('private.example'));
front.role=()=> 'Administrator';front.STATE.version='1.13.0';assert(front.gaCoursePrivacyBanner().includes('1.13.1'));
front.STATE.version='1.13.1';assert.equal(front.gaCoursePrivacyBanner(),'');
front.STATE.version='1.14.0';assert.equal(front.gaCoursePrivacyBanner(),'');
front.STATE.version='';assert(front.gaCoursePrivacyBanner().includes('1.13.1'));
console.log('Participant privacy: own courses, no course links/catalog, trainer access, advanced guests and history passed.');
