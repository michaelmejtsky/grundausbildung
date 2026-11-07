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
ctx.gaSheet_=()=>({getSheetByName:()=>({})});
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
const captured={headers:[],stats:[],sections:[],lines:[],tables:[]};
ctx.gaPdfStart_=(_doc,_type,_title,_subtitle,metadata)=>{captured.headers=metadata;return {};};ctx.gaPdfStats_=(_b,rows)=>captured.stats=rows;
ctx.gaPdfSection_=(_b,n,title)=>captured.sections.push({n,title});ctx.gaPdfLine_=(_b,text)=>{captured.lines.push(text);return chain;};ctx.gaTrainingPdfTable_=(_b,head,rows)=>captured.tables.push({head,rows});
const clear=()=>{captured.headers=[];captured.stats=[];captured.sections=[];captured.lines=[];captured.tables=[];};
tables.Mitglieder[0].Standesbuchnummer='302';tables.Mitglieder.push({ID:'staff-record',Vorname:'Admin',Nachname:'Mitglied',Email:'admin@example.test',Standesbuchnummer:'0018',Aktiv:'NEIN',TurnusID:'g1'});
tables.Termine.find(t=>t.ID==='t1').Ort='Geplanter Lehrsaal';
const originalMembers=JSON.stringify(tables.Mitglieder),originalUsers=JSON.stringify(tables.Benutzer),originalAttempts=JSON.stringify(tables.QuizVersuche);
const data={TerminID:'t1',Anwesend:[{MitgliedID:'m1',Anwesend:true}],AusbilderIDs:['admin','trainer1'],BeginnIst:'2026-11-07T08:00',EndeIst:'2026-11-07T10:00',Fahrzeuge:[],Ort:'Übungshof · Tor 2',AusbilderStandesbuchnummern:{trainer1:'0034'},BerichtMailSenden:'NEIN'};
call('saveAttendance',data);assert.equal(tables.Termine.find(t=>t.ID==='t1').Ort,'Geplanter Lehrsaal','Actual report location must not rewrite the plan');
let view=call('state');assert(view.berichtDetails.Version===1);assert.equal(view.ausbildungsberichte.find(r=>r.TerminID==='t1').Ort,'Übungshof · Tor 2');assert.equal(view.benutzer.find(u=>u.ID==='admin').Standesbuchnummer,'0018');
let report=ctx.gaTrainingPdfData_({TerminID:'t1'},admin);assert(report.trainers.some(t=>t.name.includes('0018')));assert(report.trainers.some(t=>t.name.includes('0034')));assert(report.participants[0].name.includes('302'));
clear();call('exportTrainingPdf',{TerminID:'t1'});assert(captured.headers.some(([k,v])=>k==='ÖRTLICHKEIT'&&v==='Übungshof · Tor 2'));
assert(!JSON.stringify(captured).match(/FAHRZEUGKILOMETER|Fahrzeuge|Kilometer|"km"/));assert.equal(captured.stats.length,3);assert.equal(captured.sections.at(-1).n,3);
// Vehicles can be used in place, with no mileage field or zero mileage printed.
const corrected={...data,Fahrzeuge:[{Fahrzeug:'HLF 2',Kilometer:''}]};delete corrected.Ort;delete corrected.AusbilderStandesbuchnummern;
call('saveAttendance',corrected);clear();call('exportTrainingPdf',{TerminID:'t1'});assert(captured.sections.some(s=>s.title==='Eingesetzte Fahrzeuge'));assert(!JSON.stringify(captured).match(/FAHRZEUGKILOMETER|Kilometer|"km"/));assert(captured.tables.some(t=>t.head.length===1&&t.head[0]==='Fahrzeug'&&t.rows[0][0]==='HLF 2'));
assert.equal(call('state').ausbildungsberichte.find(r=>r.TerminID==='t1').Ort,'Übungshof · Tor 2','Older clients keep the actual location');assert(ctx.gaTrainingPdfData_({TerminID:'t1'},admin).trainers.some(t=>t.name.includes('0034')));
call('saveAttendance',{...corrected,Fahrzeuge:[{Fahrzeug:'HLF 2',Kilometer:0},{Fahrzeug:'MTFA',Kilometer:'12,5'}]});clear();const exported=call('exportTrainingPdf',{KursID:'gab'});assert.equal(exported.gesamtKm,12.5);assert(captured.stats.some(s=>s[1]==='FAHRZEUGKILOMETER'));assert(captured.tables.some(t=>t.head.includes('Kilometer')&&t.rows.some(r=>r[0]==='HLF 2'&&r.at(-1)==='')));assert(!JSON.stringify(captured).includes('0,0 km'));
const beforeInvalid=JSON.stringify(tables.Ausbildungsberichte);assert.throws(()=>call('saveAttendance',{...data,AusbilderStandesbuchnummern:{trainer2:'FOREIGN'}}),/ausgewählte/);assert.equal(JSON.stringify(tables.Ausbildungsberichte),beforeInvalid);
const previousMeta=JSON.stringify(ctx.gaReportMeta_('ausbildungsbericht','t1')),replace=ctx.gaReplace_;
ctx.gaReplace_=(sheet,...args)=>{if(sheet==='Ausbildungsberichte')throw Error('local write failure');return replace(sheet,...args);};assert.throws(()=>call('saveAttendance',{...data,Ort:'Nicht gespeichert'}),/local write/);ctx.gaReplace_=replace;assert.equal(JSON.stringify(ctx.gaReportMeta_('ausbildungsbericht','t1')),previousMeta);
const free={Titel:'Gerätewartung',Kategorie:'Diensttätigkeit',Ort:'Werkstatt',BeginnIst:'2026-11-07T11:00',EndeIst:'2026-11-07T12:00',TeilnehmerIDs:['m1'],AusbilderIDs:['admin','trainer1'],Fahrzeuge:[],AusbilderStandesbuchnummern:{trainer1:'0045'},BerichtMailSenden:'NEIN'};
const saved=call('saveFreeActivity',free);clear();call('exportFreeActivityPdf',{ID:saved.ID});assert(captured.headers.some(([k,v])=>k==='ÖRTLICHKEIT'&&v==='Werkstatt'));assert(captured.tables.some(t=>t.rows.some(r=>r[0].includes('0045'))));assert(captured.tables.some(t=>t.rows.some(r=>r[0].includes('0018'))));assert(!JSON.stringify(captured).match(/FAHRZEUGKILOMETER|Fahrzeuge|Kilometer/));
// Blank explicit location hides the location; legacy reports still use their scheduled location.
call('saveAttendance',{...data,Ort:''});clear();call('exportTrainingPdf',{TerminID:'t1'});assert(!captured.headers.some(([k])=>k==='ÖRTLICHKEIT'));assert(!captured.lines.some(s=>s.includes('Geplanter Lehrsaal')));
const legacy=ctx.gaReportLocation_({}, {Ort:'Alte Planung'});assert.equal(legacy,'Alte Planung');
actor=tables.Benutzer.find(u=>u.ID==='trainer1');view=call('state',{_gaTrainerArea:'Grundausbildung'});assert(view.berichtDetails);assert.equal(view.benutzer.find(u=>u.ID==='admin').Standesbuchnummer,'0018');
actor=tables.Benutzer.find(u=>u.ID==='participant');view=call('state');assert(!view.berichtDetails);assert(!JSON.stringify(view).includes('0034'));assert(!JSON.stringify(view).includes('0045'));
assert.equal(JSON.stringify(tables.Mitglieder),originalMembers);assert.equal(JSON.stringify(tables.Benutzer),originalUsers);assert.equal(JSON.stringify(tables.QuizVersuche),originalAttempts);assert.equal(mails.length,0);
console.log('Report layout: actual location separate from plan, trainer number snapshots/unique links, course/module/free PDFs, omitted vehicles/zero mileage, preserved positive km, legacy compatibility, invalid-input rejection, metadata rollback and participant privacy passed.');
