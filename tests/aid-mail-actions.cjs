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
const member=tables.Mitglieder[0];member.Standesbuchnummer='302';
tables.ErsteHilfeNachweise=[{ID:'proof',MitgliedID:member.ID,Kursdatum:'2026-10-15',Stunden:'16',Dateiname:'ErsteHilfe.pdf',DriveDateiID:'private-file',Status:'Eingereicht',EingereichtVon:participant.ID,EingereichtAm:'2026-11-01T12:00'}];
tables.QualifikationMitglieder=[{ID:'qual',MitgliedID:member.ID,GABFreigabe:'JA',ErsteHilfeStatus:'Ausständig',FDISKPlatzhalter:'JA',FDISKEintragDatum:'2026-01-01',Notiz:'Bestehende Notiz',GeprueftVon:'prior-admin',GeprueftAm:'2026-10-20T10:00'}];
const proof=tables.ErsteHilfeNachweise[0],qual=tables.QualifikationMitglieder[0],blob={setName(){return this;}};
ctx.DriveApp={getFileById:()=>({getBlob:()=>blob})};
call('saveAidSettings',{Empfaenger:'records@example.test,admin-copy@example.test',Aktiv:'JA'});
let sent=ctx.gaAidSendEmail_(proof,member,blob);assert.equal(sent.status,'Gesendet');assert.equal(mails.length,1);const mail=mails[0],tokens=rawTokens(mail);assert.equal(tokens.length,2);assert(mail.body.includes('60 Tage gültig'));for(const token of tokens)assert.equal(JSON.parse(values.get('GA_MAIL_ACTION_V1_'+ctx.gaInviteDigest_(token))).AblaufMillis-now,60*86400000);assert.equal(mail.to,'records@example.test,admin-copy@example.test');assert.equal(mail.attachments[0],blob);assert(mail.noReply);assert(mail.htmlBody.includes('Zertifikat abgelegt'));assert(mail.htmlBody.includes('In FDISK eingetragen'));
const beforeActions={tables:JSON.stringify(tables),props:JSON.stringify(Object.fromEntries(values))};
let filed=call('previewMailAction',{LinkToken:tokens[0]},''),fdisk=call('previewMailAction',{LinkToken:tokens[1]},'');assert(!filed.DatumErforderlich);assert(fdisk.DatumErforderlich);assert.equal(fdisk.AktuellesDatum,'2026-01-01');
assert(!JSON.stringify(fdisk).includes('private-file'));assert(!JSON.stringify(fdisk).includes('records@example.test'));assert.equal(JSON.stringify(tables),beforeActions.tables);assert.equal(JSON.stringify(Object.fromEntries(values)),beforeActions.props);
call('confirmMailAction',{LinkToken:tokens[0],Bestaetigt:true},'');assert(ctx.gaAidMailAck_(proof.ID).AbgelegtAm);assert.equal(qual.ErsteHilfeStatus,'Ausständig');assert.equal(qual.GABFreigabe,'JA');assert.equal(proof.Status,'Eingereicht');
const filedCount=audit.length;call('confirmMailAction',{LinkToken:tokens[0],Bestaetigt:true},'');assert.equal(audit.length,filedCount);
for(const date of ['', '2026-02-30','2026-10-14','2026-12-01','2026-11-04garbage'])assert.throws(()=>call('confirmMailAction',{LinkToken:tokens[1],Bestaetigt:true,Datum:date,VorherigesDatum:'2026-01-01'},''),/tatsächliche/);
assert.throws(()=>call('confirmMailAction',{LinkToken:tokens[1],Bestaetigt:true,Datum:'2026-11-04',VorherigesDatum:'2025-01-01'},''),/inzwischen geändert/);
const result=call('confirmMailAction',{LinkToken:tokens[1],Bestaetigt:true,Datum:'2026-11-04',VorherigesDatum:'2026-01-01',MitgliedID:'foreign',GABFreigabe:'NEIN',ErsteHilfeStatus:'Bestätigt'},'');
assert(result.Erledigt);assert.equal(qual.FDISKEintragDatum,'2026-11-04');assert.equal(qual.FDISKPlatzhalter,'NEIN');assert.equal(qual.GABFreigabe,'JA');assert.equal(qual.ErsteHilfeStatus,'Ausständig');assert.equal(qual.Notiz,'Bestehende Notiz');assert.equal(qual.GeprueftVon,'prior-admin');assert.equal(qual.GeprueftAm,'2026-10-20T10:00');assert.equal(proof.Status,'Eingereicht');
const logCount=audit.length;call('confirmMailAction',{LinkToken:tokens[1],Bestaetigt:true,Datum:'2026-11-03'},'');assert.equal(audit.length,logCount);assert.equal(qual.FDISKEintragDatum,'2026-11-04');
const state=call('state');assert(state.ersteHilfeNachweise.find(p=>p.ID===proof.ID).mailBestaetigung.AbgelegtAm);assert.equal(state.ersteHilfeNachweise[0].mailBestaetigung.FDISKEintragDatum,'2026-11-04');
actor=participant;const own=call('state');assert(own.ersteHilfeNachweise[0].mailBestaetigung.AbgelegtAm);assert(!own.ersteHilfeMail);actor=admin;
// A corrected/replaced proof invalidates old certificate actions without changing the new proof or existing GAB/quiz data.
ctx.gaAidSendEmail_(proof,member,blob);const old=rawTokens(mails.at(-1));assert.throws(()=>call('previewMailAction',{LinkToken:tokens[0]},''),/ersetzt/);
tables.ErsteHilfeNachweise.push({...proof,ID:'new-proof',Status:'Eingereicht'});assert.throws(()=>call('confirmMailAction',{LinkToken:old[1],Bestaetigt:true,Datum:'2026-11-04'},''),/ersetzt oder abgelehnt/);
const latest=tables.ErsteHilfeNachweise.at(-1);ctx.gaAidSendEmail_(latest,member,blob);const fresh=rawTokens(mails.at(-1));latest.Status='Abgelehnt';assert.throws(()=>call('previewMailAction',{LinkToken:fresh[0]},''),/abgelehnt/);latest.Status='Eingereicht';
call('saveAidSettings',{Empfaenger:'new-recipient@example.test',Aktiv:'JA'});assert.throws(()=>call('previewMailAction',{LinkToken:fresh[0]},''),/ersetzt/);
assert(tables.QuizVersuche.some(a=>a.ID==='past'&&a.Bestanden==='JA'));assert.equal(member.ID,'m1');assert.equal(member.TurnusID,'g1');
console.log('First-aid mail actions: PDF attachment, separate file/FDISK buttons, real date validation, own-only display, preserved review/GAB flags, duplicate protection and proof/config revocation passed.');
