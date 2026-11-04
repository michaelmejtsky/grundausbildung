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


const crypto=require('node:crypto');let counter=0,now=Date.UTC(2026,10,4,12);
class TestDate extends Date{constructor(...args){super(...(args.length?args:[now]));}static now(){return now;}}
ctx.Date=TestDate;ctx.gaId_=()=> (++counter).toString(16).padStart(8,'0')+'-0000-4000-8000-000000000000';
ctx.gaInviteDigest_=s=>crypto.createHash('sha256').update(String(s)).digest('base64url');
ctx.Utilities.formatDate=(date,zone,format)=>format==='yyyy-MM-dd'?new Date(date).toISOString().slice(0,10):new Date(date).toISOString().slice(0,19);
props.setProperties=o=>{for(const [k,v]of Object.entries(o))values.set(k,String(v));};
ctx.ScriptApp={getProjectTriggers:()=>[{getHandlerFunction:()=> 'gaVerwaltungsMailJob_'}]};
const mails=[],audit=[],notices=[];ctx.MailApp={sendEmail:mail=>mails.push(mail)};ctx.gaLog_=(...args)=>audit.push(args);ctx.gaNotify_=(...args)=>notices.push(args);
const call=(method,data={},token='token')=>ctx.gaApi(method,data,token),rawTokens=mail=>[...mail.body.matchAll(/#token=([a-f0-9]{64})/g)].map(x=>x[1]);
call('saveAdminMailSettings',{TransponderEmpfaenger:'access@example.test',PagerEmpfaenger:'pager@example.test',BlaulichtEmpfaenger:'lea@example.test',ZeugkammerEmpfaenger:'uniform@example.test',BerichtEmpfaenger:'reports@example.test'});
for(const Titel of ['Dienstbekleidung erhalten','Einsatzbekleidung erhalten'])call('saveChecklistItem',{Titel,Bereich:'Alle',Zustaendig:'Zeugkammer'});
// Reuse earlier GAB-only optional points without replacing their IDs or resetting any evidence.
for(const Titel of ['Transponder für Zugang','Pager','Blaulicht SMS/Lea'])call('saveChecklistItem',{Titel,Bereich:'Grundausbildung',Zustaendig:'Administration'});
const optionalIDs=['gaTransponderItem_','gaPagerItem_','gaBlaulichtItem_'].map(fn=>ctx[fn](false).ID);
const beforeGuest=tables.Mitglieder[0],beforeOriginal=JSON.stringify(beforeGuest),beforeAttempts=JSON.stringify(tables.QuizVersuche),beforeChecks=JSON.stringify(tables.MitgliedChecks);
actor=org;
call('saveMember',{Vorname:'Erweitert',Nachname:'Neu',Email:'advanced@example.test',Telefon:'0660123',Standesbuchnummer:'900',TurnusID:'e1',Ausbildungsweg:'Erweiterte Ausbildung',TransponderErforderlich:'JA',PagerErforderlich:'JA',BlaulichtErforderlich:'JA',ZeugkammerAnfordern:'JA'});
const member=tables.Mitglieder.find(m=>m.Standesbuchnummer==='900');assert(member);assert.equal(member.TurnusID,'e1');assert.equal(mails.length,4);
for(const m of mails){assert(m.body.includes('Erweiterte Ausbildung'));assert(m.body.includes('900'));assert(m.body.includes('0660123'));assert(m.body.includes('advanced@example.test'));}
for(const id of optionalIDs){assert.equal(tables.Checklistenpunkte.find(i=>i.ID===id).Bereich,'Alle');assert(tables.MitgliedChecks.some(c=>c.MitgliedID===member.ID&&c.PunktID===id));}
assert.equal(JSON.stringify(tables.MitgliedChecks.filter(c=>c.MitgliedID===beforeGuest.ID)),beforeChecks);
let state=call('state');assert(state.aufnahmeMails.ErweiterteAufnahme);assert(state.aufnahmeMails.TransponderKonfiguriert);assert(state.berichtMail.Aktiv);
for(const address of ['access@example.test','pager@example.test','lea@example.test','uniform@example.test','reports@example.test'])assert(!JSON.stringify(state).includes(address),'Recipient addresses stay admin-only');
assert(!state.verwaltungsMails);assert(state.checks.every(c=>c.MitgliedID===member.ID),'GAB guest checks stay private');assert.equal(state.checks.length,5);
assert.throws(()=>call('saveMember',{...beforeGuest,TurnusID:'e1',Ausbildungsweg:'Erweiterte Ausbildung',PagerErforderlich:'JA'}),/GAB-Mitglieder/);
assert.throws(()=>call('saveMember',{Vorname:'Fremd',Nachname:'GAB',TurnusID:'g1',Ausbildungsweg:'Grundausbildung',PagerErforderlich:'JA'}),/erweitert/);
assert.throws(()=>call('saveAdminMailSettings',{PagerEmpfaenger:'foreign@example.test'}),/berechtigt|Berechtigung|freigegeben/);
const pagerMail=mails.find(m=>m.subject.startsWith('Pager benötigt')),[pagerYes,pagerNo]=rawTokens(pagerMail);
call('confirmMailAction',{LinkToken:pagerNo,Bestaetigt:true},'');state=call('state');assert(state.checks.some(c=>c.MitgliedID===member.ID&&c.Status==='Nicht erforderlich'));
call('confirmMailAction',{LinkToken:pagerYes,Bestaetigt:true},'');assert.equal(call('previewMailAction',{LinkToken:pagerYes},'').Status,'Nicht erforderlich');
const uniformMail=mails.find(m=>m.subject.startsWith('Zeugkammer'));for(const token of rawTokens(uniformMail))call('confirmMailAction',{LinkToken:token,Bestaetigt:true},'');
const ownChecks=tables.MitgliedChecks.filter(c=>c.MitgliedID===member.ID),beforeCount=mails.length;
call('saveMember',{...member,PagerErforderlich:'NEIN',TransponderErforderlich:'JA',BlaulichtErforderlich:'JA',ZeugkammerAnfordern:'JA'});assert.equal(mails.length,beforeCount);assert(ownChecks.some(c=>c.Status==='Nicht erforderlich'));
actor=admin;assert(call('state').checks.some(c=>c.MitgliedID===member.ID));
tables.Benutzer.push({ID:'adv-participant',Email:member.Email,Name:'Erweitert Neu',Rolle:'Teilnehmer',Aktiv:'JA'});actor=tables.Benutzer.at(-1);state=call('state');assert.equal(state.meMember.ID,member.ID);assert.equal(state.checks.length,5);assert(state.checks.every(c=>c.MitgliedID===member.ID));assert(!state.aufnahmeMails);assert(!state.berichtMail);
assert.equal(JSON.stringify(beforeGuest),beforeOriginal);assert.equal(JSON.stringify(tables.QuizVersuche),beforeAttempts);
const noticeBefore=notices.length;ctx.gaNotifyGabCompleted_(member,false,true);assert.equal(notices.length,noticeBefore,'An advanced member does not generate a GAB transfer notice');
console.log('Advanced intake: four opt-in mail flows, legacy point identity migration, organizer permissions, recipient privacy, native-only checks, participant visibility, no duplicate delivery, GAB preservation and separate completion notices passed.');
