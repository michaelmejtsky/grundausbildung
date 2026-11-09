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
const save=(id,extra={})=>{call('saveMember',data(id,extra));return tables.Mitglieder.find(m=>m.Standesbuchnummer==='STB-'+id);};
const checkFor=id=>tables.MitgliedChecks.find(c=>c.MitgliedID===id&&c.PunktID===ctx.gaBlaulichtItem_(false)?.ID);
const beforeMembers=JSON.stringify(tables.Mitglieder),beforeAttempts=JSON.stringify(tables.QuizVersuche);
assert.throws(()=>save('MissingRecipient',{BlaulichtErforderlich:'JA'}),/Empfängeradresse/);
assert.equal(JSON.stringify(tables.Mitglieder),beforeMembers);
call('saveAdminMailSettings',{BlaulichtEmpfaenger:'lea@example.test,LEA@example.test,office@example.test',TransponderEmpfaenger:'keys@example.test'});
assert.equal(mails.length,0,'Configuration must not backfill or send');
assert.equal(call('state').verwaltungsMails.BlaulichtSMSLea,true);
assert.throws(()=>save('MissingPhone',{Telefon:'',BlaulichtErforderlich:'JA'}),/Telefonnummer/);
const anna=save('Anna',{BlaulichtErforderlich:'JA',TransponderErforderlich:'JA'});
assert.equal(mails.length,2,'Each selected workflow gets its separate recipient');
const mail=mails.find(m=>m.subject.startsWith('Blaulicht SMS/Lea:'));
assert.equal(mail.to,'lea@example.test,office@example.test');assert(mail.noReply);assert(mail.htmlBody.includes('registriert und zugeordnet bestätigen'));
for(const value of ['Anna Beispiel','STB-Anna','0660123456','anna@example.test','Bitte nicht auf diese E-Mail antworten'])assert(mail.body.includes(value));
const point=ctx.gaBlaulichtItem_(false),check=checkFor(anna.ID);assert.equal(point.Titel,'Blaulicht SMS/Lea');assert.equal(point.Zustaendig,'IT');assert.equal(check.Status,'Offen');
assert(!checkFor('m1'),'Existing members are not assigned implicitly');
const berta=save('Berta');assert(!checkFor(berta.ID),'Unselected new member stays unaffected');
const token=rawTokens(mail)[0];assert.equal(JSON.parse(values.get('GA_MAIL_ACTION_V1_'+ctx.gaInviteDigest_(token))).AblaufMillis-now,60*86400000);assert.equal(rawTokens(mail).length,1);assert(!JSON.stringify(Object.fromEntries(values)).includes(token));
const tablesBefore=JSON.stringify(tables),propsBefore=JSON.stringify(Object.fromEntries(values));
assert.equal(call('previewMailAction',{LinkToken:token},'').Erledigt,false);
assert.equal(JSON.stringify(tables),tablesBefore);assert.equal(JSON.stringify(Object.fromEntries(values)),propsBefore);
check.Kommentar='Bestehende Notiz';
const trans=tables.MitgliedChecks.find(c=>c.MitgliedID===anna.ID&&c.PunktID===ctx.gaTransponderItem_(false).ID);
call('confirmMailAction',{LinkToken:token,Bestaetigt:true,CheckID:trans.ID,MitgliedID:berta.ID},'');
assert.equal(check.Status,'Erledigt');assert.equal(trans.Status,'Offen');assert.equal(check.Kommentar,'Bestehende Notiz');assert(!checkFor(berta.ID));
const noticesAfter=notices.length;call('confirmMailAction',{LinkToken:token,Bestaetigt:true},'');assert.equal(notices.length,noticesAfter);
call('saveMember',data('Anna',{ID:anna.ID,BlaulichtErforderlich:'NEIN'}));assert.equal(check.Status,'Erledigt');assert.equal(mails.length,2);
call('saveMember',data('Berta',{ID:berta.ID,BlaulichtErforderlich:'JA'}));assert.equal(mails.length,3);assert.equal(checkFor(berta.ID).Status,'Offen');
call('saveMember',data('Berta',{ID:berta.ID,BlaulichtErforderlich:'JA',Telefon:'0670000000'}));assert.equal(mails.length,3);
const bertaToken=rawTokens(mails[2])[0];
call('saveMember',data('Berta',{ID:berta.ID,BlaulichtErforderlich:'NEIN'}));assert.throws(()=>call('confirmMailAction',{LinkToken:bertaToken,Bestaetigt:true},''),/nicht erforderlich/);
call('saveMember',data('Berta',{ID:berta.ID,BlaulichtErforderlich:'JA'}));assert.equal(mails.length,3,'No automatic duplicate after toggling');
const key=ctx.gaAdminMailKey_('blaulicht',berta.ID);call('renewChecklistMail',{ID:key});assert.equal(mails.length,4);
assert.throws(()=>call('previewMailAction',{LinkToken:bertaToken},''),/ersetzt/);
const renewed=rawTokens(mails[3])[0];
call('saveChecklistItem',{ID:point.ID,Titel:'Alarmierung registriert',Bereich:'Grundausbildung',Zustaendig:'IT'});
assert.equal(ctx.gaBlaulichtItem_(false).ID,point.ID);assert.equal(call('state').verwaltungsMails.BlaulichtPunktID,point.ID);
assert(!checkFor('m1'),'Renaming the optional item must not assign every member');
assert.throws(()=>call('saveChecklistItem',{Titel:'Blaulicht SMS/Lea',Bereich:'Grundausbildung',Zustaendig:'IT'}),/besteht bereits/);
call('setChecklistItemActive',{ID:point.ID,Aktiv:'NEIN'});assert.throws(()=>call('previewMailAction',{LinkToken:renewed},''),/nicht mehr/);
call('setChecklistItemActive',{ID:point.ID,Aktiv:'JA'});assert.equal(check.Status,'Erledigt');assert(!checkFor('m1'));
call('saveAdminMailSettings',{BlaulichtEmpfaenger:'changed@example.test'});assert.throws(()=>call('previewMailAction',{LinkToken:renewed},''),/ersetzt/);
assert.equal(call('state').verwaltungsMails.TransponderEmpfaenger,'keys@example.test');
assert.equal(call('state').verwaltungsMails.Verlauf.filter(r=>r.Art==='blaulicht').length,2);
assert.throws(()=>ctx.gaBlaulichtInput_(org,{BlaulichtErforderlich:'JA'},anna,tables.Turnusse[0]),/Berechtigung/);
assert.equal(JSON.stringify(tables.QuizVersuche),beforeAttempts);
console.log('Blaulicht SMS/Lea: opt-in intake, existing members, scoped confirmations, no duplicate mail, preserved completion and notes, renamed identity, archive/recipient revocation and role boundaries passed.');
