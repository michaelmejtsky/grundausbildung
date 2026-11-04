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
const getCheck=(member,kind)=>tables.MitgliedChecks.find(c=>c.MitgliedID===member.ID&&c.PunktID===(kind==='pager'?ctx.gaPagerItem_(false):ctx.gaTransponderItem_(false)).ID);
const findMail=(member,kind)=>mails.findLast(m=>m.subject.startsWith(kind==='pager'?'Pager benötigt':'Transponder für Zugang')&&m.body.includes(member.Standesbuchnummer));
const beforeMembers=JSON.stringify(tables.Mitglieder),beforeAttempts=JSON.stringify(tables.QuizVersuche);
assert.throws(()=>save('Missing',{PagerErforderlich:'JA'}),/Empfängeradresse/);assert.equal(JSON.stringify(tables.Mitglieder),beforeMembers);
call('saveAdminMailSettings',{PagerEmpfaenger:'pager@example.test,PAGER@example.test,office@example.test',TransponderEmpfaenger:'keys@example.test'});assert.equal(mails.length,0);
const anna=save('Anna',{PagerErforderlich:'JA',TransponderErforderlich:'JA'});assert.equal(mails.length,2);
const trans=getCheck(anna,'transponder'),pager=getCheck(anna,'pager'),pagerMail=findMail(anna,'pager');
assert.equal(pagerMail.to,'pager@example.test,office@example.test');assert(pagerMail.noReply);assert(pagerMail.body.includes('Pager ausgegeben bestätigen'));assert(pagerMail.body.includes('Pager nicht erforderlich bestätigen'));
assert(pagerMail.body.includes('STB-Anna'));assert(pagerMail.body.includes('0660123456'));assert(pagerMail.body.includes('anna@example.test'));assert(pagerMail.body.includes('Bitte nicht auf diese E-Mail antworten'));
assert.equal(rawTokens(pagerMail).length,2);assert.equal(rawTokens(findMail(anna,'transponder')).length,2);
const berta=save('Berta');assert(!tables.MitgliedChecks.some(c=>c.MitgliedID===berta.ID&&c.PunktID===pager.PunktID));
const [pagerYes,pagerNo]=rawTokens(pagerMail),[transYes,transNo]=rawTokens(findMail(anna,'transponder'));
const before=JSON.stringify(tables),propsBefore=JSON.stringify(Object.fromEntries(values));
let preview=call('previewMailAction',{LinkToken:pagerNo},'');assert(preview.NichtErforderlichAktion);assert.equal(preview.Erledigt,false);assert.equal(preview.Status,'Offen');
assert.equal(JSON.stringify(tables),before);assert.equal(JSON.stringify(Object.fromEntries(values)),propsBefore);assert(!JSON.stringify(Object.fromEntries(values)).includes(pagerNo));
pager.Kommentar='Pager-Notiz';assert.throws(()=>call('confirmMailAction',{LinkToken:pagerNo},''),/ausdrücklich/);
let result=call('confirmMailAction',{LinkToken:pagerNo,Bestaetigt:true,Status:'Erledigt',CheckID:trans.ID,MitgliedID:berta.ID},'');
assert.equal(result.Status,'Nicht erforderlich');assert(result.Erledigt);assert.equal(pager.Status,'Nicht erforderlich');assert.equal(trans.Status,'Offen');assert.equal(pager.Kommentar,'Pager-Notiz');
const snapshots=JSON.stringify(tables),noticeCount=notices.length;call('confirmMailAction',{LinkToken:pagerYes,Bestaetigt:true},'');call('confirmMailAction',{LinkToken:pagerNo,Bestaetigt:true},'');
assert.equal(JSON.stringify(tables),snapshots,'The opposite button cannot turn not-required into issued');assert.equal(notices.length,noticeCount);
call('confirmMailAction',{LinkToken:transYes,Bestaetigt:true},'');assert.equal(trans.Status,'Erledigt');
result=call('confirmMailAction',{LinkToken:transNo,Bestaetigt:true},'');assert.equal(result.Status,'Erledigt');assert.equal(trans.Status,'Erledigt','An issued device cannot be undone by the other button');
call('saveMember',data('Anna',{ID:anna.ID,PagerErforderlich:'NEIN',TransponderErforderlich:'NEIN'}));assert.equal(pager.Status,'Nicht erforderlich');assert.equal(trans.Status,'Erledigt');assert.equal(mails.length,2);
// Explicitly reopening by the administrator invalidates both choices until a new mail is issued.
call('setCheck',{ID:pager.ID,Status:'Offen',Kommentar:'Neue Anforderung'});
for(const token of [pagerYes,pagerNo])assert.throws(()=>call('confirmMailAction',{LinkToken:token,Bestaetigt:true},''),/bereits verwendet/);
call('renewChecklistMail',{ID:ctx.gaAdminMailKey_('pager',anna.ID)});assert.equal(mails.length,3);
const [freshYes,freshNo]=rawTokens(mails.at(-1));assert.throws(()=>call('previewMailAction',{LinkToken:pagerNo},''),/ersetzt/);
// Failed writes do not consume either choice or leave a closure marker behind.
const originalReplace=ctx.gaReplace_;ctx.gaReplace_=(sheet,id,value)=>{if(sheet==='MitgliedChecks'&&id===pager.ID)throw Error('local write failure');return originalReplace(sheet,id,value);};
assert.throws(()=>call('confirmMailAction',{LinkToken:freshNo,Bestaetigt:true},''),/nicht vollständig/);assert.equal(pager.Status,'Offen');
assert.equal(call('previewMailAction',{LinkToken:freshYes},'').Erledigt,false);assert.equal(call('previewMailAction',{LinkToken:freshNo},'').Erledigt,false);
ctx.gaReplace_=originalReplace;call('confirmMailAction',{LinkToken:freshYes,Bestaetigt:true},'');assert.equal(pager.Status,'Erledigt');
const sameCount=mails.length;call('saveMember',data('Anna',{ID:anna.ID,PagerErforderlich:'JA'}));assert.equal(mails.length,sameCount);
// Existing members can request a pager, and archived/renamed optional points keep their identity.
call('saveMember',data('Berta',{ID:berta.ID,PagerErforderlich:'JA'}));const bertaPager=getCheck(berta,'pager'),bertaToken=rawTokens(findMail(berta,'pager'))[1];assert.equal(bertaPager.Status,'Offen');
const point=ctx.gaPagerItem_(false);call('saveChecklistItem',{ID:point.ID,Titel:'Funkmeldeempfänger',Bereich:'Grundausbildung',Zustaendig:'Administration'});assert.equal(ctx.gaPagerItem_(false).ID,point.ID);
assert.throws(()=>call('saveChecklistItem',{Titel:'Pager',Bereich:'Grundausbildung',Zustaendig:'Administration'}),/besteht bereits/);
assert(!tables.MitgliedChecks.some(c=>c.MitgliedID==='m1'&&c.PunktID===point.ID));
call('setChecklistItemActive',{ID:point.ID,Aktiv:'NEIN'});assert.throws(()=>call('previewMailAction',{LinkToken:bertaToken},''),/nicht mehr/);call('setChecklistItemActive',{ID:point.ID,Aktiv:'JA'});
call('saveAdminMailSettings',{PagerEmpfaenger:'changed@example.test'});assert.throws(()=>call('previewMailAction',{LinkToken:bertaToken},''),/ersetzt/);
assert.equal(call('state').verwaltungsMails.TransponderEmpfaenger,'keys@example.test');assert(call('state').verwaltungsMails.PagerAuswahl);assert(call('state').verwaltungsMails.MailNichtErforderlich);
assert.throws(()=>ctx.gaPagerInput_(org,{PagerErforderlich:'JA'},anna,tables.Turnusse[0]),/Berechtigung/);
const clara=save('Clara',{TransponderErforderlich:'JA'}),claraTrans=getCheck(clara,'transponder');call('confirmMailAction',{LinkToken:rawTokens(findMail(clara,'transponder'))[1],Bestaetigt:true},'');assert.equal(claraTrans.Status,'Nicht erforderlich');
assert.equal(JSON.stringify(tables.QuizVersuche),beforeAttempts);assert.equal(anna.TurnusID,'g1');
console.log('Pager and Transponder: opt-in intake, two scoped outcomes, no cross-member writes, opposite-button protection, no duplicate notifications/mail, reopened-link invalidation, write-failure recovery, archived/renamed identity and recipient/role guards passed.');
