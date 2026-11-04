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

// All messages and triggers stay in this isolated memory. No production mail is sent.
let now=Date.UTC(2026,10,4,12),mailFail=false,statusFail=false,triggerFail=false;
class ClockDate extends Date{constructor(...args){super(...(args.length?args:[now]));}static now(){return now;}}
ctx.Date=ClockDate;ctx.gaInviteDigest_=s=>require('node:crypto').createHash('sha256').update(String(s)).digest('base64url');
const delivered=[],triggers=[];
ctx.MailApp={sendEmail:mail=>{if(mailFail)throw Error('quota');delivered.push({...mail});}};
ctx.ScriptApp={getProjectTriggers:()=>{if(triggerFail)throw Error('authorization');return triggers;},newTrigger:name=>({timeBased:()=>({everyMinutes:n=>({create:()=>{assert.equal(n,5);triggers.push({getHandlerFunction:()=>name});}})})})};
props.setProperties=updates=>{if(statusFail)throw Error('storage failed');for(const [k,v]of Object.entries(updates))values.set(k,String(v));};
const call=(method,data={})=>ctx.gaApi(method,data,'token');
const settings=(trans='transponder@example.test',block='blockb@example.test')=>call('saveAdminMailSettings',{TransponderEmpfaenger:trans,BlockBEmpfaenger:block});
const data=(first,extra={})=>({Vorname:first,Nachname:'Beispiel',Email:first.toLowerCase()+'@example.test',Telefon:'06601234567',Standesbuchnummer:'STB-'+first,Ausbildungsweg:'Grundausbildung',TurnusID:'g1',...extra});
const create=(first,extra={})=>{call('saveMember',data(first,extra));return tables.Mitglieder.find(m=>m.Standesbuchnummer==='STB-'+first);};
const key=(kind,id,date)=>ctx.gaAdminMailKey_(kind,id,date),record=(kind,id,date)=>ctx.gaAdminMailRead_(key(kind,id,date));
const proof=(m,extra={})=>({MitgliedID:m.ID,KursID:'GAB-ABSCHNITT-BLOCK-B',Absolviert:'JA',Ausbildungsdatum:'2026-11-03',PruefungBestanden:'JA',Pruefungsdatum:'2026-11-04',...extra});
// Invalid settings never create a trigger or alter config. Save config sends nothing.
assert.throws(()=>settings('one@example.test,not-an-email'),/gültige/);
assert.throws(()=>settings('one@example.test\nBcc:evil@example.test'),/gültige/);
settings();settings();assert.equal(triggers.length,1);assert.equal(delivered.length,0);
const read=call('state');assert(read.verwaltungsMails.TriggerAktiv);assert.equal(read.verwaltungsMails.TransponderEmpfaenger,'transponder@example.test');
actor=participant;assert(!call('state').verwaltungsMails);assert.throws(()=>settings(),/Berechtigung/);
actor=org;assert.throws(()=>settings(),/Berechtigung/);assert(!call('state').verwaltungsMails);
actor=trainer2;assert.throws(()=>settings(),/auswählen|Berechtigung/);
actor=admin;
// Missing requested details are rejected before a member or checklist is saved.
const before=JSON.stringify(tables.Mitglieder);
assert.throws(()=>create('Invalid',{TransponderErforderlich:'JA',Telefon:''}),/Telefonnummer/);
assert.equal(JSON.stringify(tables.Mitglieder),before);
settings('','blockb@example.test');assert.throws(()=>create('NoRecipient',{TransponderErforderlich:'JA'}),/Empfängeradresse/);settings();
const m=create('Anna',{TransponderErforderlich:'JA'});
assert.equal(delivered.length,1);let mail=delivered[0];assert.equal(mail.to,'transponder@example.test');assert.equal(mail.noReply,true);
for(const text of ['Anna Beispiel','STB-Anna','06601234567','Grundausbildung aufgenommen','benötigt noch einen Transponder','Bitte nicht auf diese E-Mail antworten'])assert(mail.body.includes(text),text);
assert(!mail.body.includes('Geburtsdatum'));assert.equal(record('transponder',m.ID).Status,'Gesendet');
const point=tables.Checklistenpunkte.find(i=>i.Titel==='Transponder für Zugang');assert(point);
assert.equal(tables.MitgliedChecks.find(c=>c.MitgliedID===m.ID&&c.PunktID===point.ID).Status,'Offen');
call('saveMember',{...data('Anna'),ID:m.ID,TransponderErforderlich:'JA',Telefon:'06700000000'});assert.equal(delivered.length,1,'Editing must not resend');
const notRequired=create('Berta',{TransponderErforderlich:'NEIN'}),oldClient=create('Clara');
for(const person of [notRequired,oldClient])assert(!tables.MitgliedChecks.some(c=>c.MitgliedID===person.ID&&c.PunktID===point.ID));
call('saveMember',{...data('Anna'),ID:m.ID});assert.equal(tables.MitgliedChecks.find(c=>c.MitgliedID===m.ID&&c.PunktID===point.ID).Status,'Offen','Old client preserves selection');
call('saveMember',{...data('Anna'),ID:m.ID,TransponderErforderlich:'NEIN'});call('saveMember',{...data('Anna'),ID:m.ID,TransponderErforderlich:'JA'});assert.equal(delivered.length,1,'Toggling an already-sent requirement must not resend');
const ch=tables.MitgliedChecks.find(c=>c.MitgliedID===m.ID&&c.PunktID===point.ID);ch.Status='Erledigt';
call('saveMember',{...data('Anna'),ID:m.ID,TransponderErforderlich:'NEIN'});assert.equal(ch.Status,'Erledigt','Issued transponder proof must stay completed');
// Failed transport preserves the member and open checklist; no automatic retry spam.
mailFail=true;const failed=create('Dora',{TransponderErforderlich:'JA'});assert(failed);assert.equal(record('transponder',failed.ID).Status,'Fehler');
now+=20*60000;mailFail=false;ctx.gaVerwaltungsMailJob_();assert.equal(delivered.length,1);
call('retryAdminMail',{ID:key('transponder',failed.ID)});assert.equal(delivered.length,2);call('retryAdminMail',{ID:key('transponder',failed.ID)});assert.equal(delivered.length,2);
// Explicitly clearing an unsent request cancels it without notifying anyone.
mailFail=true;const cancelled=create('Emma',{TransponderErforderlich:'JA'});mailFail=false;
call('saveMember',{...data('Emma'),ID:cancelled.ID,TransponderErforderlich:'NEIN'});assert.equal(record('transponder',cancelled.ID).Status,'Nicht erforderlich');
ctx.gaVerwaltungsMailJob_();assert.equal(delivered.length,2);
// If mail was accepted but persisting the status fails, the job never blindly sends again.
statusFail=true;const uncertain=create('Fanni',{TransponderErforderlich:'JA'});statusFail=false;assert.equal(record('transponder',uncertain.ID).Status,'Versand läuft');
const deliveredAfterUnknown=delivered.length;now+=10*60000;ctx.gaVerwaltungsMailJob_();assert.equal(delivered.length,deliveredAfterUnknown);
// Record the cohort's individual Block B proofs; debounce creates one grouped mail with exact positive attendees only.
const preservedMembers=JSON.stringify(tables.Mitglieder),preservedAttempts=JSON.stringify(tables.QuizVersuche);
call('saveAbschnittNachweis',proof(m));const due=record('blockB','g1','2026-11-04').FaelligMillis;
assert.equal(delivered.length,deliveredAfterUnknown);now+=2*60000;call('saveAbschnittNachweis',proof(notRequired));
assert(record('blockB','g1','2026-11-04').FaelligMillis>due);
call('saveAbschnittNachweis',proof(oldClient,{PruefungBestanden:'NEIN',Pruefungsdatum:''}));
now+=4*60000;ctx.gaVerwaltungsMailJob_();assert.equal(delivered.length,deliveredAfterUnknown);
now+=2*60000;ctx.gaVerwaltungsMailJob_();assert.equal(delivered.length,deliveredAfterUnknown+1);
mail=delivered.at(-1);assert.equal(mail.to,'blockb@example.test');
for(const text of ['Anna Beispiel','Berta Beispiel','STB-Anna','STB-Berta','04.11.2026','03.11.2026','Truppmann-Abschluss Block B im Bezirk absolviert'])assert(mail.body.includes(text),text);
assert(!mail.body.includes('Clara Beispiel'));assert(!mail.body.includes('Dora Beispiel'));
assert.equal(record('blockB','g1','2026-11-04').Anzahl,2);
assert.equal(JSON.stringify(tables.Mitglieder),preservedMembers);assert.equal(JSON.stringify(tables.QuizVersuche),preservedAttempts);
// Re-save, note edits, date corrections after delivery, and positive toggles do not resend an already reported member.
call('saveAbschnittNachweis',proof(m,{Notiz:'korrigiert'}));call('saveAbschnittNachweis',proof(m,{PruefungBestanden:'NEIN',Pruefungsdatum:''}));call('saveAbschnittNachweis',proof(m));
now+=12*60000;ctx.gaVerwaltungsMailJob_();assert.equal(delivered.length,deliveredAfterUnknown+1);
// A late positive member produces only a supplement, never duplicates of the existing graduates.
call('saveAbschnittNachweis',proof(oldClient));now+=6*60000;ctx.gaVerwaltungsMailJob_();assert.equal(delivered.length,deliveredAfterUnknown+2);
assert(delivered.at(-1).body.includes('Clara Beispiel'));assert(!delivered.at(-1).body.includes('Anna Beispiel'));
// Different cohort/date and failed exam entries are isolated. Withdrawn positives are revalidated before sending.
call('saveAbschnittNachweis',proof(failed,{Pruefungsdatum:'2026-11-05'}));call('saveAbschnittNachweis',proof(failed,{PruefungBestanden:'NEIN',Pruefungsdatum:''}));
now+=6*60000;const count=delivered.length;ctx.gaVerwaltungsMailJob_();assert.equal(delivered.length,count);
assert.equal(record('blockB','g1','2026-11-05').Status,'Nicht mehr erforderlich');
// A correction before dispatch moves the pending positive to the corrected date.
call('saveAbschnittNachweis',proof(failed,{Pruefungsdatum:'2026-11-06'}));call('saveAbschnittNachweis',proof(failed,{Pruefungsdatum:'2026-11-07'}));
now+=6*60000;ctx.gaVerwaltungsMailJob_();assert.equal(delivered.length,count+1);assert(delivered.at(-1).body.includes('07.11.2026'));
// Missing numbers pause reporting with a visible error; fixing member data and retrying sends the correct list.
tables.Mitglieder.find(x=>x.ID===cancelled.ID).Standesbuchnummer='';call('saveAbschnittNachweis',proof(cancelled));now+=6*60000;ctx.gaVerwaltungsMailJob_();
assert.equal(record('blockB','g1','2026-11-04').Status,'Fehler');const beforeRetry=delivered.length;
tables.Mitglieder.find(x=>x.ID===cancelled.ID).Standesbuchnummer='STB-Emma';call('retryAdminMail',{ID:key('blockB','g1','2026-11-04')});assert.equal(delivered.length,beforeRetry+1);
assert(delivered.at(-1).body.includes('STB-Emma'));assert(!delivered.at(-1).body.includes('Anna Beispiel'));
// Config changes alone never backfill older completions. Trigger authorization failure does not break the admin login.
settings('new-transponder@example.test','new-blockb@example.test');now+=6*60000;ctx.gaVerwaltungsMailJob_();assert.equal(delivered.length,beforeRetry+1);
triggerFail=true;assert.equal(call('state').verwaltungsMails.TriggerAktiv,false);assert.throws(()=>settings(),/authorization/);
assert.equal(ctx.gaAdminMailSettings_().BlockBEmpfaenger,'new-blockb@example.test');triggerFail=false;
console.log('Administration mail: optional checklist, privacy/rights, exact recipient/text, trigger setup, grouped positive Block B, debounce, corrections, duplicate protection and failure preservation passed.');

// Multiple recipients apply to each category; existing single-address settings remain valid.
actor=admin;
assert.equal(ctx.gaAdminMailAddress_(' One@Example.Test , two@example.test,ONE@example.test '),'one@example.test,two@example.test');
for(const bad of ['one@example.test,','one@example.test,,two@example.test','one@example.test,not-an-email','one@example.test,\nBcc:evil@example.test','Name <one@example.test>'])assert.throws(()=>ctx.gaAdminMailAddress_(bad),/gültige/);
assert.throws(()=>ctx.gaAdminMailAddress_(Array.from({length:21},(_,i)=>'person'+i+'@example.test').join(',')),/höchstens 20/);
settings('first@example.test,second@example.test','block1@example.test,block2@example.test');
const multi=create('Greta',{TransponderErforderlich:'JA'});assert.equal(delivered.at(-1).to,'first@example.test,second@example.test');
const multiCount=delivered.length;call('saveMember',{...data('Greta'),ID:multi.ID,TransponderErforderlich:'JA'});assert.equal(delivered.length,multiCount);
call('saveAbschnittNachweis',proof(multi,{Pruefungsdatum:'2026-11-08'}));now+=6*60000;ctx.gaVerwaltungsMailJob_();assert.equal(delivered.at(-1).to,'block1@example.test,block2@example.test');
assert.equal(call('state').verwaltungsMails.MehrereEmpfaenger,true);
const oldSettings=JSON.stringify(ctx.gaAdminMailSettings_());assert.throws(()=>settings('valid@example.test,invalid'),/gültige/);assert.equal(JSON.stringify(ctx.gaAdminMailSettings_()),oldSettings);
console.log('Multiple recipients: validation, normalization, deduplication, saved-settings preservation, transponder/Block B delivery and repeat protection passed.');
