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
for(const title of ['Dienstbekleidung erhalten','Einsatzbekleidung erhalten'])call('saveChecklistItem',{Titel:title,Bereich:'Alle',Zustaendig:'Zeugkammer'});
const member=tables.Mitglieder[0];member.Standesbuchnummer='302';member.Telefon='0660123456';
call('saveAdminMailSettings',{ZeugkammerEmpfaenger:'zeug1@example.test,zeug2@example.test',TransponderEmpfaenger:'keys@example.test'});
assert.equal(mails.length,0);call('sendZeugkammerRequest',{MitgliedID:member.ID});assert.equal(mails.length,1);
const mail=mails[0],tokens=rawTokens(mail);assert(mail.body.includes('60 Tage gültig'));for(const token of tokens)assert.equal(JSON.parse(values.get('GA_MAIL_ACTION_V1_'+ctx.gaInviteDigest_(token))).AblaufMillis-now,60*86400000);assert.equal(tokens.length,2);assert.equal(mail.to,'zeug1@example.test,zeug2@example.test');assert(mail.htmlBody.includes('Dienstbekleidung erhalten bestätigen'));assert(mail.htmlBody.includes('Einsatzbekleidung erhalten bestätigen'));
assert(tokens.every(t=>t.length===64));assert(!mail.body.includes('secret-stays-private'));assert(mail.body.includes('302'));assert(mail.body.includes('0660123456'));
const originalTables=JSON.stringify(tables),originalProps=JSON.stringify(Object.fromEntries(values));
for(const token of tokens){const data=call('previewMailAction',{LinkToken:token},'');assert.equal(data.Name,'Teil Nehmer');assert.equal(data.Erledigt,false);assert(!data.Email);assert(!data.Telefon);assert(!data.MitgliedID);assert(!data.CheckID);}
assert.equal(JSON.stringify(tables),originalTables);assert.equal(JSON.stringify(Object.fromEntries(values)),originalProps,'Link scanners and preview have no writes');
assert(!JSON.stringify(Object.fromEntries(values)).includes(tokens[0]),'Only hashes are stored');
const realSession=ctx.gaSession_;ctx.gaSession_=()=>{throw Error('Login required');};
assert(call('previewMailAction',{LinkToken:tokens[0]},'').Aufgabe);assert.throws(()=>call('state',{LinkToken:tokens[0]},''),/Login required/);assert.throws(()=>call('setCheck',{LinkToken:tokens[0],ID:'arbitrary',Status:'Erledigt'},''),/Login required/);ctx.gaSession_=realSession;
assert.throws(()=>call('confirmMailAction',{LinkToken:tokens[0]},''),/ausdrücklich/);
for(const bad of ['', 'x'.repeat(64),'a'.repeat(64),tokens[0].slice(1)])assert.throws(()=>call('previewMailAction',{LinkToken:bad},''),/ungültig/);
const dutyPoint=tables.Checklistenpunkte.find(i=>i.Titel==='Dienstbekleidung erhalten'),firePoint=tables.Checklistenpunkte.find(i=>i.Titel==='Einsatzbekleidung erhalten'),duty=tables.MitgliedChecks.find(c=>c.PunktID===dutyPoint.ID),fire=tables.MitgliedChecks.find(c=>c.PunktID===firePoint.ID);
duty.Kommentar='Vorhandene Notiz bleibt';
let result=call('confirmMailAction',{LinkToken:tokens[0],Bestaetigt:true,MitgliedID:'foreign',CheckID:fire.ID,PunktID:firePoint.ID,Status:'Offen'},'');
assert(result.Erledigt);assert.equal(duty.Status,'Erledigt');assert.equal(fire.Status,'Offen');assert.equal(duty.Kommentar,'Vorhandene Notiz bleibt');assert.equal(duty.GeaendertVon,'EMAIL_LINK');
const auditCount=audit.length,noticeCount=notices.length;call('confirmMailAction',{LinkToken:tokens[0],Bestaetigt:true},'');assert.equal(audit.length,auditCount);assert.equal(notices.length,noticeCount);
assert.equal(call('previewMailAction',{LinkToken:tokens[1]},'').Erledigt,false);call('confirmMailAction',{LinkToken:tokens[1],Bestaetigt:true},'');assert.equal(fire.Status,'Erledigt');
call('setCheck',{ID:duty.ID,Status:'Offen',Kommentar:duty.Kommentar});assert.throws(()=>call('confirmMailAction',{LinkToken:tokens[0],Bestaetigt:true},''),/bereits verwendet/);
call('renewChecklistMail',{ID:ctx.gaAdminMailKey_('zeugkammer',member.ID)});assert.equal(mails.length,2);const fresh=rawTokens(mails.at(-1));assert.equal(fresh.length,1);assert.throws(()=>call('previewMailAction',{LinkToken:tokens[0]},''),/ersetzt/);
call('saveAdminMailSettings',{ZeugkammerEmpfaenger:'changed@example.test'});assert.throws(()=>call('previewMailAction',{LinkToken:fresh[0]},''),/ersetzt/);
call('renewChecklistMail',{ID:ctx.gaAdminMailKey_('zeugkammer',member.ID)});const current=rawTokens(mails.at(-1))[0];
call('setChecklistItemActive',{ID:dutyPoint.ID,Aktiv:'NEIN'});assert.throws(()=>call('confirmMailAction',{LinkToken:current,Bestaetigt:true},''),/nicht mehr/);assert.equal(duty.Status,'Offen');call('setChecklistItemActive',{ID:dutyPoint.ID,Aktiv:'JA'});
member.Aktiv='NEIN';assert.throws(()=>call('previewMailAction',{LinkToken:current},''),/nicht mehr aktiv/);member.Aktiv='JA';
const replace=ctx.gaReplace_;ctx.gaReplace_=()=>{throw Error('sheet unavailable');};assert.throws(()=>call('confirmMailAction',{LinkToken:current,Bestaetigt:true},''),/nicht vollständig/);ctx.gaReplace_=replace;assert.equal(duty.Status,'Offen');call('confirmMailAction',{LinkToken:current,Bestaetigt:true},'');assert.equal(duty.Status,'Erledigt');
// New-member events create one transponder and one uniform mail, scoped to that member's own checklist.
call('saveMember',{Vorname:'Neu',Nachname:'Mitglied',Email:'new@example.test',Telefon:'0670123456',Standesbuchnummer:'777',ZeugkammerAnfordern:'JA',TurnusID:'g1',Ausbildungsweg:'Grundausbildung',TransponderErforderlich:'JA'});
const newMember=tables.Mitglieder.find(m=>m.Standesbuchnummer==='777'),keyMail=mails.find(m=>m.subject.includes('Transponder für Zugang benötigt')&&m.body.includes('777'));
assert(keyMail);assert(mails.some(m=>m.subject.startsWith('Zeugkammer')&&m.body.includes('777')));const keyToken=rawTokens(keyMail)[0];assert(keyToken);
const previousDutyStatus=duty.Status;call('confirmMailAction',{LinkToken:keyToken,Bestaetigt:true,MitgliedID:member.ID,CheckID:duty.ID},'');const trans=ctx.gaTransponderItem_(false);
assert.equal(tables.MitgliedChecks.find(c=>c.MitgliedID===newMember.ID&&c.PunktID===trans.ID).Status,'Erledigt');assert.equal(duty.Status,previousDutyStatus);
const beforeExpiry=JSON.stringify(tables);assert(keyMail.body.includes('60 Tage gültig'));now+=31*86400000;assert(call('previewMailAction',{LinkToken:keyToken},'').Erledigt);now+=29*86400000+1;assert.throws(()=>call('previewMailAction',{LinkToken:keyToken},''),/abgelaufen/);ctx.gaCleanupMailActions_();assert.equal(JSON.stringify(tables),beforeExpiry);assert(![...values.keys()].some(k=>k.startsWith('GA_MAIL_ACTION_V1_')));
console.log('Mail links: no-write previews, hashed credentials, per-member/per-item scope, no login escalation, separate buttons, idempotence, revocation, archive checks, expiry, retries and automatic intake passed.');
