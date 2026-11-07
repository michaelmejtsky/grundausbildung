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
for(const u of tables.Benutzer){u.Hash='hash-'+u.ID+'-123456789012345678901234567890';u.Salt='salt-'+u.ID;}
const trainer=tables.Benutzer.find(u=>u.ID==='trainer1'),participantUser=tables.Benutzer.find(u=>u.ID==='participant'),member=tables.Mitglieder[0];member.Vorname='Teil';member.Nachname='Nehmer';member.Telefon='0660123';member.Standesbuchnummer='302';
tables.Einladungen=[{ID:'old-invite',BenutzerID:participantUser.ID,Email:participantUser.Email,Status:'Offen'},{ID:'old-reset',BenutzerID:participantUser.ID,Email:participantUser.Email,Status:'Passwortreset'}];
tables.Sitzungen=[{ID:'session',BenutzerID:trainer.ID,TokenHash:'old-hash',WiderrufenAm:''}];tables.PushGeraete=[{ID:'push',BenutzerID:trainer.ID,Aktiv:'JA'}];
const passwords=Object.fromEntries(tables.Benutzer.map(u=>[u.ID,[u.Hash,u.Salt]])),attempts=JSON.stringify(tables.QuizVersuche),oldTurn=member.TurnusID;
call('saveAccount',{BenutzerID:trainer.ID,Name:'Ausbilder Neu',Email:'trainer.new@example.test',Standesbuchnummer:'0007',Aktiv:'JA'});assert.equal(trainer.Name,'Ausbilder Neu');assert.equal(trainer.Email,'trainer.new@example.test');assert.equal(ctx.gaReportTrainerNumber_(trainer),'0007');assert.equal(call('state').benutzer.find(u=>u.ID===trainer.ID).Standesbuchnummer,'0007');
assert.throws(()=>call('saveAccount',{BenutzerID:trainer.ID,Name:'Dup',Email:participantUser.Email,Aktiv:'JA'}),/anderen Zugang/);
call('saveAccount',{BenutzerID:participantUser.ID,Vorname:'Neuer',Nachname:'Teilnehmer',Email:'participant.new@example.test',Aktiv:'JA'});assert.equal(member.Vorname,'Neuer');assert.equal(member.Nachname,'Teilnehmer');assert.equal(member.Email,'participant.new@example.test');assert.equal(participantUser.Email,member.Email);assert.equal(participantUser.Name,'Neuer Teilnehmer');assert.equal(member.TurnusID,oldTurn);assert(tables.Einladungen.every(i=>i.Status==='Ersetzt'));
call('saveMember',{...member,Vorname:'Umbenannt',Ausbildungsweg:'Grundausbildung'});assert.equal(participantUser.Name,'Umbenannt Teilnehmer','Member editor also updates the participant display name');
// Cached and persistent tokens use an account revocation generation, without touching passwords.
const source=fs.readFileSync(path.join(root,'Code.gs'),'utf8'),start=source.indexOf('function gaSession_(token){'),end=source.indexOf('function gaLogin(',start);
vm.runInContext(source.slice(start,end).replace('function gaSession_(', 'function realAccountSession_('),ctx);const cache=new Map();ctx.CacheService={getScriptCache:()=>({get:k=>cache.get(k),put:(k,v)=>cache.set(k,v)})};ctx.gaTokenKey_=t=>'token-'+t;
const oldFingerprint=ctx.gaSessionFingerprint_(trainer);cache.set('token-old',trainer.ID+'|'+oldFingerprint+'|'+(now+100000));assert.equal(ctx.realAccountSession_('old').ID,trainer.ID);
call('saveAccount',{BenutzerID:trainer.ID,Name:trainer.Name,Email:trainer.Email,Aktiv:'NEIN'});assert.equal(trainer.Aktiv,'NEIN');assert(tables.Sitzungen[0].WiderrufenAm);assert.equal(tables.PushGeraete[0].Aktiv,'NEIN');assert.throws(()=>ctx.realAccountSession_('old'),/abgelaufen/);
call('saveAccount',{BenutzerID:trainer.ID,Name:trainer.Name,Email:trainer.Email,Aktiv:'JA'});assert.equal(trainer.Aktiv,'JA');assert.throws(()=>ctx.realAccountSession_('old'),/abgelaufen/,'Reactivation cannot revive an old cached token');
cache.set('token-new',trainer.ID+'|'+ctx.gaSessionFingerprint_(trainer)+'|'+(now+100000));assert.equal(ctx.realAccountSession_('new').ID,trainer.ID);
assert.throws(()=>call('saveAccount',{BenutzerID:admin.ID,Name:admin.Name,Email:admin.Email,Aktiv:'NEIN'}),/eigenen/);
tables.Benutzer.push({ID:'pending',Name:'Einladung Offen',Email:'pending@example.test',Rolle:'Ausbilder',Aktiv:'NEIN',Hash:'',Salt:''});assert.throws(()=>call('saveAccount',{BenutzerID:'pending',Name:'Einladung Offen',Email:'pending@example.test',Aktiv:'JA'}),/Einladungslink/);
// Advanced access administration cannot enumerate or modify guests, staff, or role assignments.
tables.Mitglieder.push({ID:'native',Vorname:'Erweiterte',Nachname:'Person',Email:'native@example.test',TurnusID:'e1',Aktiv:'JA'});tables.Benutzer.push({ID:'native-user',Name:'Erweiterte Person',Email:'native@example.test',Rolle:'Teilnehmer',Aktiv:'JA',Hash:'native-hash',Salt:'native-salt'});
actor=org;let state=call('state');assert(state.kontoBearbeitung);assert.deepEqual(Array.from(state.verwalteteZugaenge,u=>u.ID),['native-user']);assert(!JSON.stringify(state.verwalteteZugaenge).includes(trainer.Email));
assert.throws(()=>call('saveAccount',{BenutzerID:participantUser.ID,Vorname:'Fremd',Nachname:'Gast',Email:participantUser.Email,Aktiv:'JA'}),/freigegebene/);
assert.throws(()=>call('saveAccount',{BenutzerID:trainer.ID,Name:'Fremder Ausbilder',Email:trainer.Email,Aktiv:'JA'}),/freigegebene/);
assert.throws(()=>call('saveAccount',{BenutzerID:'native-user',Vorname:'Neu',Nachname:'Erweitert',Email:'native@example.test',Aktiv:'JA',Rolle:'Administrator'}),/Rollen/);
call('saveAccount',{BenutzerID:'native-user',Vorname:'Neu',Nachname:'Erweitert',Email:'native.new@example.test',Aktiv:'NEIN'});assert.equal(tables.Mitglieder.find(m=>m.ID==='native').Email,'native.new@example.test');assert.equal(tables.Mitglieder.find(m=>m.ID==='native').Aktiv,'JA');assert.equal(tables.Benutzer.find(u=>u.ID==='native-user').Aktiv,'NEIN');
actor=admin;tables.QualifikationMitglieder=[{ID:'q',MitgliedID:member.ID,GABFreigabe:'JA'}];tables.AbschnittNachweise=['A','B'].map(x=>({ID:'block'+x,MitgliedID:member.ID,KursID:'GAB-ABSCHNITT-BLOCK-'+x,Absolviert:'JA',PruefungBestanden:'JA'}));call('transferAdvancedMember',{MitgliedID:member.ID,TurnusID:'e1',Bestaetigt:true});
actor=org;call('saveAccount',{BenutzerID:participantUser.ID,Vorname:'Überstellt',Nachname:'Teilnehmer',Email:'transferred@example.test',Aktiv:'JA'});assert.equal(member.Email,'transferred@example.test');assert.equal(participantUser.Email,member.Email);assert.equal(member.TurnusID,oldTurn);
actor=admin;const originalReplace=ctx.gaReplace_,before=JSON.stringify(tables),numberBefore=ctx.gaReportTrainerNumber_(trainer);let fail=true;
ctx.gaReplace_=(sheet,id,change)=>{if(fail&&sheet==='Mitglieder'&&id===member.ID){fail=false;throw Error('local write failure');}return originalReplace(sheet,id,change);};assert.throws(()=>call('saveAccount',{BenutzerID:participantUser.ID,Vorname:'Nicht',Nachname:'Gespeichert',Email:'not-saved@example.test',Aktiv:'JA'}),/nicht vollständig/);ctx.gaReplace_=originalReplace;assert.equal(JSON.stringify(tables),before);
const setProp=props.setProperty;let propertyFail=true;const beforeProperty=JSON.stringify(tables);
props.setProperty=(key,value)=>{if(propertyFail&&key==='GA_STAFF_NUMBER_V1_'+trainer.ID){propertyFail=false;throw Error('local property failure');}return setProp.call(props,key,value);};
assert.throws(()=>call('saveAccount',{BenutzerID:trainer.ID,Name:'Not saved',Email:trainer.Email,Aktiv:'JA',Standesbuchnummer:'BAD'}),/nicht vollständig/);props.setProperty=setProp;assert.equal(JSON.stringify(tables),beforeProperty);
assert.equal(ctx.gaReportTrainerNumber_(trainer),numberBefore);for(const [id,valuesBefore] of Object.entries(passwords)){const u=tables.Benutzer.find(u=>u.ID===id);assert.deepEqual([u.Hash,u.Salt],valuesBefore);}
assert.equal(JSON.stringify(tables.QuizVersuche),attempts);assert.equal(member.TurnusID,oldTurn);assert.equal(mails.length,0);
console.log('Accounts: permanent trainer numbers, linked name/email editing, duplicate rejection, unchanged hashes/roles/cohorts/proofs, deactivation and token revocation across reactivation, pending/self guards, advanced ownership isolation and rollback passed.');
