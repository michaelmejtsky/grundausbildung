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

const call=(method,data={})=>ctx.gaApi(method,data,'token');
const add=extra=>call('saveChecklistItem',{Titel:'Gerät erhalten',Bereich:'Grundausbildung',Zustaendig:'Administration',...extra});
add();const item=tables.Checklistenpunkte.find(i=>i.Titel==='Gerät erhalten');
let check=tables.MitgliedChecks.find(c=>c.PunktID===item.ID&&c.MitgliedID==='m1');assert(check);check.Status='Erledigt';check.Kommentar='Bereits bestätigt';
const baseline={members:JSON.stringify(tables.Mitglieder),attempts:JSON.stringify(tables.QuizVersuche),checks:JSON.stringify(tables.MitgliedChecks)};
add({ID:item.ID,Titel:'Gerät und Unterlagen erhalten',Zustaendig:'IT'});assert.equal(check.Status,'Erledigt');assert.equal(check.Kommentar,'Bereits bestätigt');
call('setChecklistItemActive',{ID:item.ID,Aktiv:'NEIN'});assert.equal(tables.Checklistenpunkte.find(i=>i.ID===item.ID).Aktiv,'NEIN');
let state=call('state');assert(!state.checks.some(c=>c.ID===check.ID));assert(state.checkArchiv.some(c=>c.ID===check.ID&&c.Status==='Erledigt'&&c.Kommentar==='Bereits bestätigt'));
assert.throws(()=>call('setCheck',{ID:check.ID,Status:'Offen'}),/archiviert/);
assert.equal(JSON.stringify(tables.MitgliedChecks),baseline.checks,'Archiving does not delete or reset any recorded checks');
// New members do not get archived points. Restore fills only genuinely missing rows.
tables.Mitglieder.push({ID:'new',Vorname:'Neu',Nachname:'Person',TurnusID:'g1',Aktiv:'JA'});
call('setChecklistItemActive',{ID:item.ID,Aktiv:'JA'});assert.equal(check.Status,'Erledigt');assert.equal(check.Kommentar,'Bereits bestätigt');
assert(tables.MitgliedChecks.some(c=>c.MitgliedID==='new'&&c.PunktID===item.ID&&c.Status==='Offen'));
const count=tables.MitgliedChecks.length;call('setChecklistItemActive',{ID:item.ID,Aktiv:'JA'});assert.equal(tables.MitgliedChecks.length,count);
// Narrowing the area archives out-of-scope evidence without deleting it; expanding it restores the existing status.
add({ID:item.ID,Bereich:'Erweiterte Ausbildung'});state=call('state');assert(!state.checks.some(c=>c.ID===check.ID));assert(state.checkArchiv.some(c=>c.ID===check.ID));
add({ID:item.ID,Bereich:'Alle'});state=call('state');assert(state.checks.some(c=>c.ID===check.ID&&c.Status==='Erledigt'));
// Auto-maintained points keep their identity after a label edit. Transponders remain optional for each member.
add({Titel:'Transponder für Zugang'});const trans=tables.Checklistenpunkte.find(i=>i.Titel==='Transponder für Zugang');assert(trans);
assert(!tables.MitgliedChecks.some(c=>c.PunktID===trans.ID));add({ID:trans.ID,Titel:'Zutritts-Transponder',Bereich:'Grundausbildung'});
assert.equal(ctx.gaTransponderItem_(false).ID,trans.ID);assert.equal(call('state').verwaltungsMails.TransponderPunktID,trans.ID);
call('setChecklistItemActive',{ID:trans.ID,Aktiv:'NEIN'});call('setChecklistItemActive',{ID:trans.ID,Aktiv:'JA'});assert(!tables.MitgliedChecks.some(c=>c.PunktID===trans.ID));
add({Titel:'Erste-Hilfe-Bescheinigung abgegeben'});const aid=tables.Checklistenpunkte.find(i=>i.Titel==='Erste-Hilfe-Bescheinigung abgegeben');
add({ID:aid.ID,Titel:'Erste Hilfe dokumentiert'});ctx.gaAidSetChecklist_(admin,'m1',true);
assert.equal(tables.MitgliedChecks.find(c=>c.PunktID===aid.ID&&c.MitgliedID==='m1').Status,'Erledigt');
// Other roles cannot edit, remove or restore points; valid specialty staff can only update active assigned member checks.
for(const who of [trainer2,org,participant]){actor=who;assert.throws(()=>call('setChecklistItemActive',{ID:item.ID,Aktiv:'NEIN'}),/Berechtigung|auswählen/);assert.throws(()=>add({ID:item.ID}),/Berechtigung|auswählen/);}
actor=admin;assert.throws(()=>call('setChecklistItemActive',{ID:item.ID,Aktiv:'possibly'}),/Ungültiger/);
assert.equal(JSON.stringify(tables.QuizVersuche),baseline.attempts);assert.equal(tables.Mitglieder[0].ID,'m1');
console.log('Checklist management: edit, archive, restore, evidence preservation, exact counts, cohort scope, special-point identity and role guards passed.');
