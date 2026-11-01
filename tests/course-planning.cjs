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

// Ein bestehender Kurs erhält Material und mehrere zuständige Ausbilder.
ctx.gaApi('saveCourse',courseData('gab',{MaterialNotiz:'Beamer und 2 Funkgeräte',VerantwortlicheIDs:['trainer1','admin']}),'token');
assert.deepEqual(plain(ctx.gaCoursePlanRead_('kurs','gab')),{MaterialNotiz:'Beamer und 2 Funkgeräte',VerantwortlicheIDs:['trainer1','admin']});
assert.equal(course('gab').Links,originals.links);
assert.equal(JSON.stringify(tables.QuizVersuche),originals.quiz);assert.equal(JSON.stringify(tables.Mitglieder),originals.members);
const adminState=ctx.gaState_(admin),participantState=ctx.gaState_(participant);
assert.equal(adminState.kursPlanung.kurse.gab.MaterialNotiz,'Beamer und 2 Funkgeräte');
assert(!Object.hasOwn(participantState,'kursPlanung'));assert(!JSON.stringify(participantState).includes('Beamer und 2 Funkgeräte'));
assert(!JSON.stringify(participantState).includes('VerantwortlicheIDs'));assert(!JSON.stringify(participantState).includes('example.test/gab'));

// Ein anderer Ausbilder kann den Kurs dennoch dokumentieren; seine tatsächliche Teilnahme wird gespeichert.
actor=trainer2;
ctx.gaApi('saveAttendance',{TerminID:'t1',Anwesend:[{MitgliedID:'m1',Anwesend:true}],AusbilderIDs:['trainer2']},'token');
assert.equal(tables.Ausbildungsberichte.find(x=>x.TerminID==='t1').AusbilderIDs,'trainer2');
assert.equal(tables.Teilnahmen.find(x=>x.TerminID==='t1').AusbilderIDs,'trainer2');
assert.deepEqual(Array.from(ctx.gaCoursePlanRead_('kurs','gab').VerantwortlicheIDs),['trainer1','admin']);
assert.equal(JSON.stringify(tables.QuizVersuche),originals.quiz);

// Alte App-Versionen und einzelne Feldänderungen behalten andere interne Angaben.
actor=admin;ctx.gaApi('saveCourse',courseData('gab',{Titel:'GAB Modul aktualisiert'}),'token');
assert.equal(ctx.gaCoursePlanRead_('kurs','gab').MaterialNotiz,'Beamer und 2 Funkgeräte');
ctx.gaApi('saveCourse',courseData('gab',{MaterialNotiz:'Neues Material'}),'token');
assert.deepEqual(Array.from(ctx.gaCoursePlanRead_('kurs','gab').VerantwortlicheIDs),['trainer1','admin']);
// Eine nachträglich geänderte Benutzerrolle zerstört bestehende Zuordnungen nicht.
tables.Benutzer.find(u=>u.ID==='trainer1').Rolle='Teilnehmer';
ctx.gaApi('saveCourse',courseData('gab',{MaterialNotiz:'Neues Material',VerantwortlicheIDs:['trainer1','admin']}),'token');
assert.deepEqual(Array.from(ctx.gaCoursePlanRead_('kurs','gab').VerantwortlicheIDs),['trainer1','admin']);
tables.Benutzer.find(u=>u.ID==='trainer1').Rolle='Ausbilder';
ctx.gaApi('saveCourse',courseData('gab',{MaterialNotiz:'Neues Material',VerantwortlicheIDs:[]}),'token');
assert.deepEqual(Array.from(ctx.gaCoursePlanRead_('kurs','gab').VerantwortlicheIDs),[]);

// Keine Teilnehmer, keine GAB-Fremdbearbeitung; erweiterte Planung ist auf ihren Bereich begrenzt.
const beforeInvalid=JSON.stringify(tables.Kurse),beforeProps=JSON.stringify([...values]);
assert.throws(()=>ctx.gaApi('saveCourse',courseData('gab',{MaterialNotiz:'x',VerantwortlicheIDs:['participant']}),'token'),/nicht auswählbar/);
assert.throws(()=>ctx.gaApi('saveCourse',courseData('gab',{MaterialNotiz:'x',VerantwortlicheIDs:['org']}),'token'),/nicht auswählbar/);
assert.equal(JSON.stringify(tables.Kurse),beforeInvalid);assert.equal(JSON.stringify([...values]),beforeProps);
actor=org;assert.throws(()=>ctx.gaApi('saveCourse',courseData('gab',{MaterialNotiz:'x',VerantwortlicheIDs:['org']}),'token'),/erweiterten Ausbildung/);
ctx.gaApi('saveCourse',courseData('adv',{MaterialNotiz:'Schutzausrüstung',VerantwortlicheIDs:['org','trainer2']}),'token');
const orgState=ctx.gaState_(org);assert.equal(orgState.kursPlanung.kurse.adv.MaterialNotiz,'Schutzausrüstung');
assert(!Object.hasOwn(orgState.kursPlanung.kurse,'gab'));
assert(!JSON.stringify(ctx.gaState_(participant)).includes('Schutzausrüstung'));
actor=participant;assert.throws(()=>ctx.gaApi('saveCourse',courseData('gab',{MaterialNotiz:'Unerlaubt',VerantwortlicheIDs:[]}),'token'),/Berechtigung/);

// Planung eines neuen Projekts wird nach Prüfung auf den veröffentlichten Kurs übertragen.
actor=admin;
ctx.gaApi('saveProject',{Titel:'Projekt mit Planung',Bereich:'Grundausbildung',Typ:'Praxis',Inhalt:'Inhalt',Lernziele:'Ziele',
 PraesentationURL:'',WeitereLinks:'https://example.test/handout',Status:'Neu',MaterialNotiz:'3 Helme',VerantwortlicheIDs:['trainer1','trainer2']},'token');
const project=tables.KursProjekte.find(p=>p.Titel==='Projekt mit Planung');
assert.equal(ctx.gaCoursePlanRead_('projekt',project.ID).MaterialNotiz,'3 Helme');
ctx.gaApi('submitProject',{ID:project.ID},'token');ctx.gaApi('reviewProject',{ID:project.ID,Entscheidung:'Freigeben'},'token');
const newCourse=tables.Kurse.find(c=>c.ID===project.KursID);
assert(newCourse);assert.deepEqual(plain(ctx.gaCoursePlanRead_('kurs',newCourse.ID)),{MaterialNotiz:'3 Helme',VerantwortlicheIDs:['trainer1','trainer2']});
assert.equal(newCourse.Links,'https://example.test/handout');

// Ein altes Projekt ohne eigene Planung überschreibt keine vorhandene Kursplanung.
tables.KursProjekte.push({ID:'legacy-project',KursID:'gab',Titel:'Alter Entwurf',Bereich:'Grundausbildung',Typ:'Praxis',Inhalt:'Inhalt',
 Lernziele:'Ziele',PraesentationURL:'',WeitereLinks:originals.links,Status:'Zur Prüfung',ErstelltVon:'admin'});
const savedPlan=plain(ctx.gaCoursePlanRead_('kurs','gab'));
ctx.gaApi('reviewProject',{ID:'legacy-project',Entscheidung:'Freigeben'},'token');
assert.deepEqual(plain(ctx.gaCoursePlanRead_('kurs','gab')),savedPlan);

// Bei Fehlern bleiben sowohl Planung als auch Gültigkeitsdatum unverändert.
ctx.gaValiditySet_('turnus','g1','2026-01-01');ctx.gaValiditySet_('kurs','gab','2027-01-01');
const originalReplace=ctx.gaReplace_,planBefore=plain(ctx.gaCoursePlanRead_('kurs','gab'));
ctx.gaReplace_=(name,id,data)=>{if(name==='Kurse'&&id==='gab')throw Error('simulierter Tabellenfehler');return originalReplace(name,id,data);};
assert.throws(()=>ctx.gaApi('saveCourse',courseData('gab',{MaterialNotiz:'Nicht speichern',VerantwortlicheIDs:['trainer1'],GueltigAb:'2028-01-01'}),'token'),/Tabellenfehler/);
assert.deepEqual(plain(ctx.gaCoursePlanRead_('kurs','gab')),planBefore);assert.equal(ctx.gaValidityConfig_().kurs.gab,'2027-01-01');
ctx.gaReplace_=originalReplace;
const key=ctx.gaCoursePlanKey_('kurs','gab'),validRaw=props.getProperty(key);props.setProperty(key,'beschädigt');
assert(ctx.gaState_(admin).kursPlanung.kurse.gab.Fehler);
assert.throws(()=>ctx.gaApi('saveCourse',courseData('gab',{MaterialNotiz:'Nicht überschreiben',VerantwortlicheIDs:[]}),'token'),/beschädigt/);
assert.equal(props.getProperty(key),'beschädigt');props.setProperty(key,validRaw);

// Anzeige und Formulare verwenden dieselbe Planung; fremde Teilnehmer sehen sie auch mit alten App-Daten nicht.
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
function fn(name){const start=html.indexOf('function '+name+'(');assert(start>=0,name);const end=html.indexOf('\nfunction ',start+1);assert(end>start,name);return html.slice(start,end);}
const front=vm.createContext({console,Date,Set,document:{getElementById:()=>null},
 h:x=>String(x??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;'),
 by:(rows,id)=>(rows||[]).find(x=>x.ID===id),safeLinks:x=>x?'<li>'+x+'</li>':'',
 STATE:{...ctx.gaState_(admin),user:admin,rechte:{KurseBearbeiten:true,KurseGestalten:true,KurseFreigeben:true}},
 role:()=> 'Administrator',FORM:'course',EDIT:'gab',PROJECT_REVIEW_ID:'',TERM:'t1',
 dt:x=>String(x||''),name:x=>x.Vorname+' '+x.Nachname,areaOptions:()=>'<option>Grundausbildung</option>'});
vm.runInContext(['gaParticipantCourseText','gaCoursePlanInfo','gaCoursePlanFields','gaCourseFormData','courseCard','courses','gaProjectDocumentLinks','gaProjectReviewDetail','projects'].map(fn).join('\n'),front);
assert(front.courses().includes('name="MaterialNotiz"'));assert(front.courses().includes('name="VerantwortlicheIDs"'));
assert(front.courses().includes('name="DokumenteHinzu"'));
const built=front.gaCourseFormData({querySelector:()=>true},{getAll:()=>['trainer1','trainer2']},
 {Links:'https://example.test/praesentation',DokumenteHinzu:'https://drive.google.com/file/d/abc/view',MaterialNotiz:'Beamer'});
assert.equal(built.Links,'https://example.test/praesentation\nhttps://drive.google.com/file/d/abc/view');
assert.deepEqual(Array.from(built.VerantwortlicheIDs),['trainer1','trainer2']);assert(!Object.hasOwn(built,'DokumenteHinzu'));
assert.throws(()=>front.gaCourseFormData({querySelector:()=>false},{getAll:()=>[]},{Links:'x'.repeat(5001)}),/5000/);
assert(front.courses().includes('Neues Material'));assert(front.courses().includes('jeder berechtigte Ausbilder')||front.courses().includes('Jeder berechtigte Ausbilder'));
assert(front.gaCoursePlanFields('kurse','adv','Erweiterte Ausbildung').includes('value="org" checked'));
assert(front.gaCoursePlanFields('kurse','gab','Grundausbildung').includes('data-ga-advanced-trainer hidden'));
front.role=()=> 'Teilnehmer';assert.equal(front.gaCoursePlanInfo('kurse','gab'),'');assert(!front.courseCard(course('gab')).includes('Neues Material'));
front.role=()=> 'Ausbilder';front.STATE.user=trainer2;front.STATE.rechte={};
vm.runInContext(fs.readFileSync(path.join(root,'training-report-ui.js'),'utf8'),front,{filename:'training-report-ui.js'});
const training=front.gaAttendancePage();assert(training.includes('Neues Material'));assert(training.includes('Ausbildung abschließen'));
const oldState=front.STATE;front.STATE={...oldState};delete front.STATE.kursPlanung;
assert(front.gaCoursePlanFields('kurse','gab','Grundausbildung').includes('Code.gs 1.13.2'));
console.log('Course planning: material, multiple responsible trainers, privacy, publication, compatibility and attendance passed.');
