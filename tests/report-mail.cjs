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

// Mock Docs, Drive and transport only; run the real report data and PDF-builder functions.
const mails=[],tablesWritten=[],trashed=[],propsSet=props.setProperty;
props.setProperties=updates=>{for(const [k,v]of Object.entries(updates))values.set(k,String(v));};
ctx.ScriptApp={getProjectTriggers:()=>[{getHandlerFunction:()=> 'gaVerwaltungsMailJob_'}]};
ctx.MailApp={sendEmail:m=>mails.push(m)};
ctx.Utilities.base64Encode=bytes=>Buffer.from(bytes).toString('base64');ctx.Utilities.base64Decode=s=>[...Buffer.from(s,'base64')];
ctx.Utilities.getUuid=()=> 'temporary-document';ctx.Utilities.newBlob=(bytes,mime,name)=>({bytes:[...bytes],mime,name,getBytes(){return this.bytes;},getName(){return this.name;}});
ctx.MimeType={PDF:'application/pdf'};
ctx.DocumentApp={create:()=>({getId:()=> 'temp',saveAndClose(){}})};
ctx.DriveApp={getFileById:()=>({getAs:()=>({setName:()=>({getBytes:()=>Buffer.from('%PDF-1.4 mock report')})}),setTrashed:v=>trashed.push(v)})};
const chain={setSpacingBefore(){return this;},setSpacingAfter(){return this;}};
ctx.gaPdfStart_=()=>({});ctx.gaPdfStats_=ctx.gaPdfSection_=ctx.gaPdfSpace_=ctx.gaPdfFooter_=()=>{};
ctx.gaPdfLine_=()=>chain;ctx.gaTrainingPdfTable_=(_body,head,rows)=>tablesWritten.push({head,rows});
const call=(m,d={})=>ctx.gaApi(m,d,'token');
call('saveAdminMailSettings',{TransponderEmpfaenger:'trans@example.test',BlockBEmpfaenger:'block@example.test',BerichtEmpfaenger:'reports@example.test,archive@example.test'});
tables.Mitglieder[0].Standesbuchnummer='302';
const beforeMembers=JSON.stringify(tables.Mitglieder),beforeQuiz=JSON.stringify(tables.QuizVersuche);
call('saveAttendance',{TerminID:'t1',Anwesend:[{MitgliedID:'m1',Anwesend:true}],AusbilderIDs:['admin']});
assert.equal(mails.length,0,'PDF is queued until after the report has been saved');
assert.equal(ctx.gaAdminMailRead_(ctx.gaAdminMailKey_('ausbildungsbericht','t1')).Status,'Wartend');
const data=ctx.gaTrainingPdfData_({TerminID:'t1'},admin);assert(data.participants[0].name.includes('302'));assert(data.details[0].present[0].name.includes('302'));
// For valid complete saved data, generate the real template with test services and attach the PDF bytes.
Object.assign(tables.Ausbildungsberichte.find(r=>r.TerminID==='t1'),{BeginnIst:'2026-11-04T08:00',EndeIst:'2026-11-04T10:00',DauerMinuten:'120'});
ctx.gaVerwaltungsMailJob_();assert.equal(mails.length,1);const mail=mails[0];assert.equal(mail.to,'reports@example.test,archive@example.test');assert.equal(mail.noReply,true);
assert.equal(mail.attachments.length,1);assert.equal(mail.attachments[0].mime,'application/pdf');assert(mail.attachments[0].name.startsWith('FDISK_Design2_'));
assert(Buffer.from(mail.attachments[0].bytes).toString().startsWith('%PDF'));
for(const text of ['GAB Modul','Anhang','04.11.2026','Standesbuchnummern','Bitte nicht auf diese E-Mail antworten'])assert(mail.body.includes(text),text);
assert(tablesWritten.some(t=>t.rows.some(row=>row.some(v=>String(v).includes('302')))),'Actual report tables include participant stand number');
assert.equal(trashed.length,1,'Only temporary PDF generation documents are trashed');
call('saveAttendance',{TerminID:'t1',Anwesend:[{MitgliedID:'m1',Anwesend:true}],AusbilderIDs:['admin']});ctx.gaVerwaltungsMailJob_();assert.equal(mails.length,1,'Re-saving attendance does not resend a finished report');
const details={Titel:'Gerätewartung',Kategorie:'Diensttätigkeit',Ort:'Feuerwehrhaus',BeginnIst:'2026-11-04T11:00',EndeIst:'2026-11-04T12:00',AusbilderIDs:['admin'],TeilnehmerIDs:['m1'],Fahrzeuge:[]};
const saved=call('saveFreeActivity',details);Object.assign(tables.FreieTaetigkeiten.find(r=>r.ID===saved.ID),{BeginnIst:details.BeginnIst,EndeIst:details.EndeIst});
ctx.gaVerwaltungsMailJob_();assert.equal(mails.length,2);assert(mails[1].subject.includes('Gerätewartung'));assert(mails[1].attachments.length===1);
assert(tablesWritten.some(t=>t.head[0]==='Mitglied'&&t.rows.some(row=>row[0].includes('302'))));
call('saveFreeActivity',{...details,ID:saved.ID,Notiz:'Korrektur'});ctx.gaVerwaltungsMailJob_();assert.equal(mails.length,2,'Report correction never creates a second automatic mail');
// A PDF failure preserves the completed report and records a retryable mail failure.
const actualExport=ctx.gaExportTrainingPdf_;ctx.gaExportTrainingPdf_=()=>{throw Error('PDF conversion unavailable');};
call('saveAttendance',{TerminID:'t2',Anwesend:[{MitgliedID:'m1',Anwesend:true}],AusbilderIDs:['admin']});
Object.assign(tables.Ausbildungsberichte.find(r=>r.TerminID==='t2'),{BeginnIst:'2026-11-04T14:00',EndeIst:'2026-11-04T16:00'});ctx.gaVerwaltungsMailJob_();
const reportKey=ctx.gaAdminMailKey_('ausbildungsbericht','t2');assert.equal(ctx.gaAdminMailRead_(reportKey).Status,'Fehler');assert(tables.Ausbildungsberichte.some(r=>r.TerminID==='t2'));
ctx.gaExportTrainingPdf_=actualExport;ctx.gaVerwaltungsMailJob_();assert.equal(mails.length,2,'No unrequested repeated attempts');
call('retryAdminMail',{ID:reportKey});assert.equal(mails.length,3);assert(mails[2].body.includes('Erweitertes Modul'));
// No retroactive mail generation from enabling a recipient or downloading an existing PDF.
ctx.gaExportTrainingPdf_(admin,{TerminID:'t1'});assert.equal(mails.length,3);
assert.equal(JSON.stringify(tables.Mitglieder),beforeMembers);assert.equal(JSON.stringify(tables.QuizVersuche),beforeQuiz);
assert(ctx.gaReportParticipantName_({Vorname:'Ohne',Nachname:'Nummer'}).includes('nicht hinterlegt'));
console.log('Report PDF/mail: real report builders include stand numbers, complete reports only, exact PDF attachment/text, free activities, once-only delivery and failure preservation passed.');

// The new choice works for both areas and both report kinds, with unchanged no-resend behavior.
const beforeOpt=mails.length;
tables.Termine.push({ID:'skip-adv',KursID:'adv',TurnusID:'e1',Beginn:'2026-11-04T08:00',Ende:'2026-11-04T10:00',Status:'Geplant'});
actor=org;
call('saveAttendance',{TerminID:'skip-adv',Anwesend:[{MitgliedID:'m1',Anwesend:true}],AusbilderIDs:['org'],BerichtMailSenden:'NEIN'});
assert(!ctx.gaAdminMailRead_(ctx.gaAdminMailKey_('ausbildungsbericht','skip-adv')));assert.equal(tables.Termine.find(t=>t.ID==='skip-adv').Status,'Durchgeführt');
const skipFree=call('saveFreeActivity',{...details,Titel:'Erweiterte Wartung ohne Mail',AusbilderIDs:['org'],BerichtMailSenden:'NEIN'});assert(!ctx.gaAdminMailRead_(ctx.gaAdminMailKey_('freieTaetigkeit',skipFree.ID)));assert.equal(tables.FreieTaetigkeiten.find(r=>r.ID===skipFree.ID).Bereich,'Erweiterte Ausbildung');
ctx.gaVerwaltungsMailJob_();assert.equal(mails.length,beforeOpt);
const includeFree=call('saveFreeActivity',{...details,Titel:'Erweiterte Wartung mit Mail',AusbilderIDs:['org'],BerichtMailSenden:'JA'});assert.equal(ctx.gaAdminMailRead_(ctx.gaAdminMailKey_('freieTaetigkeit',includeFree.ID)).Status,'Wartend');
assert.throws(()=>call('saveFreeActivity',{...details,AusbilderIDs:['org'],BerichtMailSenden:'invalid'}),/PDF-Mail-Auswahl/);
actor=admin;tables.Termine.push({ID:'skip-gab',KursID:'gab',TurnusID:'g1',Beginn:'2026-11-04T08:00',Ende:'2026-11-04T10:00',Status:'Geplant'});
call('saveAttendance',{TerminID:'skip-gab',Anwesend:[{MitgliedID:'m1',Anwesend:true}],AusbilderIDs:['admin'],BerichtMailSenden:'NEIN'});assert(!ctx.gaAdminMailRead_(ctx.gaAdminMailKey_('ausbildungsbericht','skip-gab')));
console.log('Report choice: GAB and advanced attendance/free-activity completion can opt out without losing reports; opt-in queues only the intended report.');
