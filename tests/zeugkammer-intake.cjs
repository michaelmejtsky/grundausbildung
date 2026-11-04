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

const data=(id,extra={})=>({Vorname:id,Nachname:'Beispiel',Email:id.toLowerCase()+'@example.test',Standesbuchnummer:'STB-'+id,Telefon:'0660123456',TurnusID:'g1',Ausbildungsweg:'Grundausbildung',...extra});
const save=(id,extra={})=>{const result=call('saveMember',data(id,extra));return tables.Mitglieder.find(m=>m.Standesbuchnummer==='STB-'+id);};
const beforeAttempts=JSON.stringify(tables.QuizVersuche),originalMembers=JSON.stringify(tables.Mitglieder);
assert.throws(()=>save('NoAddress',{ZeugkammerAnfordern:'JA'}),/Empfängeradresse/);assert.equal(JSON.stringify(tables.Mitglieder),originalMembers);
call('saveAdminMailSettings',{ZeugkammerEmpfaenger:'uniform@example.test'});
assert.throws(()=>save('NoPoints',{ZeugkammerAnfordern:'JA'}),/Checklistenpunkte/);
for(const Titel of ['Dienstbekleidung erhalten','Einsatzbekleidung erhalten'])call('saveChecklistItem',{Titel,Bereich:'Alle',Zustaendig:'Zeugkammer'});
const points=JSON.stringify(tables.Checklistenpunkte),originalChecks=JSON.stringify(tables.MitgliedChecks);
const anna=save('Anna',{ZeugkammerAnfordern:'NEIN'}),berta=save('Berta');assert.equal(mails.length,0,'Unchecked and legacy forms must not send');
const annaChecks=tables.MitgliedChecks.filter(c=>c.MitgliedID===anna.ID);assert.equal(annaChecks.length,2,'Existing checklist points still apply');
annaChecks[0].Status='Erledigt';annaChecks[0].Kommentar='Bereits ausgegeben';
call('saveMember',data('Anna',{ID:anna.ID,ZeugkammerAnfordern:'JA'}));assert.equal(mails.length,1);assert.equal(rawTokens(mails[0]).length,1,'Only the still-open item gets a button');
assert(mails[0].body.includes('Einsatzbekleidung erhalten'));assert.equal(annaChecks[0].Status,'Erledigt');assert.equal(annaChecks[0].Kommentar,'Bereits ausgegeben');
call('saveMember',data('Anna',{ID:anna.ID,ZeugkammerAnfordern:'JA'}));assert.equal(mails.length,1,'Repeated save does not resend');
call('saveMember',data('Anna',{ID:anna.ID,ZeugkammerAnfordern:'NEIN'}));assert.equal(mails.length,1);assert.equal(annaChecks[1].Status,'Offen');
call('confirmMailAction',{LinkToken:rawTokens(mails[0])[0],Bestaetigt:true},'');assert.equal(annaChecks[1].Status,'Erledigt');
const clara=save('Clara',{ZeugkammerAnfordern:'JA'});assert.equal(mails.length,2);assert.equal(rawTokens(mails[1]).length,2);
const bertaChecks=tables.MitgliedChecks.filter(c=>c.MitgliedID===berta.ID);bertaChecks.forEach(c=>c.Status='Erledigt');
assert.throws(()=>call('saveMember',data('Berta',{ID:berta.ID,ZeugkammerAnfordern:'JA'})),/keine offenen/);assert(bertaChecks.every(c=>c.Status==='Erledigt'));
assert.equal(JSON.stringify(tables.Checklistenpunkte),points,'No duplicate checklist definitions');
assert.equal(JSON.stringify(tables.MitgliedChecks.filter(c=>c.MitgliedID==='m1')),originalChecks,'Other member checklist stays untouched');
assert.equal(JSON.stringify(tables.QuizVersuche),beforeAttempts);assert.equal(anna.TurnusID,'g1');
assert.throws(()=>ctx.gaZeugkammerInput_(org,{ZeugkammerAnfordern:'JA'},anna,tables.Turnusse[0]),/Berechtigung/);
assert.throws(()=>ctx.gaZeugkammerInput_(admin,{ZeugkammerAnfordern:'bad'},anna,tables.Turnusse[0]),/Ungültige/);
assert.equal(call('state').verwaltungsMails.ZeugkammerAuswahl,true);
console.log('Zeugkammer intake: explicit opt-in, existing checklist reuse, completed preservation, own-item confirmations, no duplicate mail, recipient/item validation, legacy forms and role boundaries passed.');
