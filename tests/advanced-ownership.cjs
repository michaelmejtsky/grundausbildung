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
const member=tables.Mitglieder[0];member.Telefon='0660123';member.Standesbuchnummer='302';member.Geburtsdatum='2000-01-01';member.Ausbildungsweg='Grundausbildung';
tables.QualifikationMitglieder=[{ID:'qual',MitgliedID:member.ID,GABFreigabe:'JA',Notiz:'Privater GAB-Vermerk',FDISKEintragDatum:'2026-10-31'}];
tables.AbschnittNachweise=['A','B'].map(x=>({ID:'block'+x,MitgliedID:member.ID,KursID:'GAB-ABSCHNITT-BLOCK-'+x,Absolviert:'JA',PruefungBestanden:'JA'}));
tables.QuizVersuche[0].AntwortenJSON='GAB-ANTWORTEN-GEHEIM';tables.QuizVersuche[0].Prozent='95';
tables.QuizVersuche.push({ID:'advanced-past',KursID:'adv',MitgliedID:member.ID,Bestanden:'JA',Status:'Abgegeben',QuizVersion:'1',Prozent:'100'});
tables.Teilnahmen=[{ID:'old-att',TerminID:'t1',MitgliedID:member.ID,Anwesend:'JA'},{ID:'guest-att',TerminID:'t2',MitgliedID:member.ID,Anwesend:'JA'}];tables.Termine.find(t=>t.ID==='t2').Status='Durchgeführt';
const before={member:JSON.stringify(member),attempts:JSON.stringify(tables.QuizVersuche),attendance:JSON.stringify(tables.Teilnahmen),qual:JSON.stringify(tables.QualifikationMitglieder),proofs:JSON.stringify(tables.AbschnittNachweise)};
call('saveChecklistItem',{Titel:'GAB-Unterlagen',Bereich:'Grundausbildung',Zustaendig:'Administration'});const gabItem=tables.Checklistenpunkte.find(i=>i.Titel==='GAB-Unterlagen'),gabCheck=tables.MitgliedChecks.find(c=>c.PunktID===gabItem.ID);gabCheck.Kommentar='Private GAB-Notiz';
actor=org;let state=call('state'),guest=state.mitglieder.find(m=>m.ID===member.ID);assert.equal(guest.Ausbildungsweg,'GAB-Gast');assert(!guest.Email);assert(!guest.Telefon);assert(!guest.Geburtsdatum);assert(!guest.VerwaltungErweitert);assert(!JSON.stringify(state).includes('GAB-ANTWORTEN-GEHEIM'));assert(!JSON.stringify(state).includes('Privater GAB-Vermerk'));assert(!state.checks.some(c=>c.ID===gabCheck.ID));
const edit={ID:member.ID,Vorname:'Verwaltet',Nachname:'Mitglied',Email:'changed@example.test',Telefon:'0670000',Geburtsdatum:member.Geburtsdatum,Standesbuchnummer:member.Standesbuchnummer,TurnusID:'e1',Ausbildungsweg:'Erweiterte Ausbildung'};
assert.throws(()=>call('saveMember',{...edit,VerwaltungErweitert:true,GABUeberstellt:true}),/GAB-Mitglieder/);
assert.throws(()=>call('transferAdvancedMember',{MitgliedID:member.ID,TurnusID:'e1',Bestaetigt:true}),/Berechtigung/);
assert.throws(()=>call('setCheck',{ID:gabCheck.ID,Status:'Erledigt'}),/Berechtigung/);
assert.throws(()=>call('resetPassword',{BenutzerID:'participant'}),/freigegebene/);
assert.throws(()=>call('state',{_gaRolePreview:'admin'}),/Ansichten wechseln/);
assert.throws(()=>call('state',{_gaAdvancedView:true}),/Ansichten wechseln/);
actor=admin;
assert.throws(()=>call('transferAdvancedMember',{MitgliedID:member.ID,TurnusID:'e1'}),/ausdrücklich/);
tables.QualifikationMitglieder[0].GABFreigabe='NEIN';assert.throws(()=>call('transferAdvancedMember',{MitgliedID:member.ID,TurnusID:'e1',Bestaetigt:true}),/abgeschlossen/);tables.QualifikationMitglieder[0].GABFreigabe='JA';
const assignmentsBefore=tables.ErweiterteZuordnungen.length;
call('transferAdvancedMember',{MitgliedID:member.ID,TurnusID:'e1',Bestaetigt:true});assert.equal(JSON.stringify(member),before.member);assert.equal(tables.ErweiterteZuordnungen.length,assignmentsBefore);
const record=ctx.gaAdvTransfer_(member);assert.equal(record.FreigegebenVon,'admin');assert.equal(record.UrspruenglicherTurnusID,'g1');assert.equal(record.TurnusID,'e1');
const auditAfter=audit.length,noticeAfter=notices.length;call('transferAdvancedMember',{MitgliedID:member.ID,TurnusID:'e1',Bestaetigt:true});assert.equal(audit.length,auditAfter);assert.equal(notices.length,noticeAfter);
actor=org;state=call('state');const owned=state.mitglieder.find(m=>m.ID===member.ID);assert(owned.VerwaltungErweitert);assert(owned.GABUeberstellt);assert.equal(owned.Telefon,'0660123');assert.equal(owned.TurnusID,'e1');assert.equal(owned.ZugangBenutzerID,'participant');
assert(!JSON.stringify(state).includes('GAB-ANTWORTEN-GEHEIM'));assert(!JSON.stringify(state).includes('Privater GAB-Vermerk'));assert(!JSON.stringify(state).includes('Private GAB-Notiz'));assert(!state.gabNamen.some(m=>m.ID===member.ID));assert(!state.qualifikationen.some(q=>Object.hasOwn(q,'FDISKEintragDatum')));
call('saveMember',edit);assert.equal(member.Email,'changed@example.test');assert.equal(member.Telefon,'0670000');assert.equal(member.TurnusID,'g1');assert.equal(member.Ausbildungsweg,'Grundausbildung');assert.equal(tables.Benutzer.find(u=>u.ID==='participant').Email,'changed@example.test');
assert.equal(JSON.stringify(tables.QuizVersuche),before.attempts);assert.equal(JSON.stringify(tables.Teilnahmen),before.attendance);assert.equal(JSON.stringify(tables.QualifikationMitglieder),before.qual);assert.equal(JSON.stringify(tables.AbschnittNachweise),before.proofs);
assert.throws(()=>call('saveMember',{...edit,TurnusID:'g1'}),/erweitert/);
tables.Turnusse.push({ID:'e2',Bereich:'Erweiterte Ausbildung',Bezeichnung:'Nächster Turnus',Aktiv:'JA'});call('saveMember',{...edit,TurnusID:'e2'});assert.equal(member.TurnusID,'g1');assert.equal(ctx.gaAdvTransfer_(member).TurnusID,'e2');assert(tables.ErweiterteZuordnungen.some(a=>a.MitgliedID===member.ID&&a.TurnusID==='e1'));assert(tables.ErweiterteZuordnungen.some(a=>a.MitgliedID===member.ID&&a.TurnusID==='e2'));
call('saveChecklistItem',{Titel:'Erweitertes Aufnahmegespräch',Bereich:'Erweiterte Ausbildung',Zustaendig:'Ausbildungsleitung'});const ownItem=tables.Checklistenpunkte.find(i=>i.Titel==='Erweitertes Aufnahmegespräch'),ownCheck=tables.MitgliedChecks.find(c=>c.MitgliedID===member.ID&&c.PunktID===ownItem.ID);assert(ownCheck);call('setCheck',{ID:ownCheck.ID,Status:'Erledigt',Kommentar:'Erweitert dokumentiert'});assert.equal(ownCheck.Status,'Erledigt');
assert.throws(()=>call('setCheck',{ID:gabCheck.ID,Status:'Erledigt'}),/Berechtigung/);assert.equal(gabCheck.Status,'Offen');assert.equal(gabCheck.Kommentar,'Private GAB-Notiz');
assert.throws(()=>call('saveChecklistItem',{ID:gabItem.ID,Titel:'Fremd',Bereich:'Erweiterte Ausbildung',Zustaendig:'Administration'}),/Berechtigung/);
call('setChecklistItemActive',{ID:ownItem.ID,Aktiv:'NEIN'});call('setChecklistItemActive',{ID:ownItem.ID,Aktiv:'JA'});assert.equal(ownCheck.Status,'Erledigt');assert.equal(ownCheck.Kommentar,'Erweitert dokumentiert');
call('resetPassword',{BenutzerID:'participant'});assert(mails.some(m=>m.to==='changed@example.test'&&m.subject.includes('Passwort')));assert.throws(()=>call('resetPassword',{BenutzerID:'admin'}),/freigegebene/);
assert.throws(()=>call('saveQualification',{MitgliedID:member.ID,GABFreigabe:'NEIN'}),/Berechtigung/);assert.throws(()=>call('removeMember',{ID:member.ID}),/Berechtigung/);
actor=tables.Benutzer.find(u=>u.ID==='participant');state=call('state');assert.equal(state.meMember.ID,member.ID);assert.equal(state.meMember.TurnusID,'g1');assert(state.quizVersuche.some(q=>q.ID==='past'));assert(state.quizVersuche.some(q=>q.ID==='advanced-past'&&q.Bestanden==='JA'));assert(state.teilnahmen.some(a=>a.ID==='guest-att'));assert(state.teilnahmen.some(a=>a.ID==='old-att'));assert(state.turnusse.some(t=>t.ID==='e1'));assert(state.turnusse.some(t=>t.ID==='e2'));
actor=admin;assert(call('state').erweiterteUeberstellungen.some(t=>t.MitgliedID===member.ID));
call('revokeAdvancedTransfer',{MitgliedID:member.ID,Bestaetigt:true});assert(!ctx.gaAdvManaged_(member));assert.equal(member.TurnusID,'g1');assert.equal(ownCheck.Status,'Erledigt');
actor=org;state=call('state');guest=state.mitglieder.find(m=>m.ID===member.ID);assert(!guest.Telefon);assert(!guest.Email);assert(!guest.VerwaltungErweitert);assert(!state.checks.some(c=>c.MitgliedID===member.ID));assert.throws(()=>call('saveMember',{...edit,TurnusID:'e2'}),/GAB-Mitglieder/);assert.throws(()=>call('resetPassword',{BenutzerID:'participant'}),/freigegebene/);
console.log('Ownership: explicit admin handover, guest privacy, idempotent audit, full managed-profile editing, linked login preservation, immutable GAB cohort/evidence, advanced-only checklist management, scoped password reset, participant history and revocation passed.');
