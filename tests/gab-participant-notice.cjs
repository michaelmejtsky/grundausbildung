'use strict';
// Nur isolierte Beispieldaten im Speicher; kein Versand und keine Produktivdaten.
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'..','Code.gs'),'utf8');
const member=(id,extra={})=>({ID:id,Vorname:id,Nachname:'Person',Email:id+'@example.test',TurnusID:'g',Ausbildungsweg:'Grundausbildung',Aktiv:'JA',...extra});
const people=['ready','passed','missing','exhaust','noaccount','ambiguous','notdone','inactive','special'].map(id=>member(id));
people.find(x=>x.ID==='inactive').Aktiv='NEIN';people.find(x=>x.ID==='special').TurnusID='e';
const admins=[{ID:'admin',Name:'Admin',Email:'admin@example.test',Rolle:'Administrator',Aktiv:'JA'},
 {ID:'org',Name:'Org',Rolle:'Organisator Erweiterte Ausbildung',Aktiv:'JA'}];
const account=id=>({ID:'u-'+id,Name:id,Email:id+'@example.test',Rolle:'Teilnehmer',Aktiv:'JA'});
const users=admins.concat(['ready','passed','missing','exhaust','ambiguous','notdone','inactive','special'].map(account));
users.push({...account('ambiguous'),ID:'duplicate-account'});
const tables={Benutzer:users,Mitglieder:people,Turnusse:[{ID:'g',Bereich:'Grundausbildung',Aktiv:'JA'},
 {ID:'e',Bereich:'Erweiterte Ausbildung',Aktiv:'JA'}],Kurse:[{ID:'bsw',Titel:'Brandsicherheitswache',Bereich:'Grundausbildung',Aktiv:'JA'}],
 Termine:[{ID:'term',KursID:'bsw',TurnusID:'g',Beginn:'2026-09-01T08:00',Status:'Durchgeführt'}],
 Teilnahmen:['ready','passed','exhaust'].map(id=>({ID:'a-'+id,MitgliedID:id,TerminID:'term',Anwesend:'JA'})),
 QualifikationMitglieder:people.map(m=>({ID:'q-'+m.ID,MitgliedID:m.ID,GABFreigabe:m.ID==='notdone'?'NEIN':'JA'})),
 AbschnittNachweise:people.flatMap(m=>['A','B'].map(b=>({ID:'p-'+m.ID+b,MitgliedID:m.ID,KursID:'GAB-ABSCHNITT-BLOCK-'+b,Absolviert:'JA',PruefungBestanden:b==='B'?'JA':'NEIN'}))),
 KursAnforderungen:[{ID:'requirement',KursID:'bsw',PflichtBSW:'JA',PflichtGAB:'NEIN'}],
 QuizKurse:[{ID:'quiz',KursID:'bsw',Aktiv:'JA',Pflicht:'JA',Version:'3',MaxVersuche:'2',ZeitlimitMinuten:'0',Bestehensgrenze:'80',FragenJSON:'[{"typ":"tf","text":"Frage","options":["Richtig","Falsch"],"correct":[0]}]'}],
 QuizVersuche:[{ID:'v-pass',MitgliedID:'passed',KursID:'bsw',QuizVersion:'1',Bestanden:'JA',Status:'Abgegeben'},
 {ID:'v-e1',MitgliedID:'exhaust',KursID:'bsw',QuizVersion:'3',Bestanden:'NEIN',Status:'Abgegeben'},
 {ID:'v-e2',MitgliedID:'exhaust',KursID:'bsw',QuizVersion:'3',Bestanden:'NEIN',Status:'Abgegeben'}],
 QuizFreigaben:[],ErweiterteZuordnungen:[{ID:'as1',MitgliedID:'ready',TurnusID:'e'}],Benachrichtigungen:[],
 PushGeraete:[{ID:'dev',BenutzerID:'u-ready',Aktiv:'JA'}]};
let actor=admins[0],seq=0,push=[];
const values=new Map(),properties={getProperties:()=>Object.fromEntries(values),getProperty:k=>values.has(k)?values.get(k):null};
const ctx=vm.createContext({console,Date,JSON,Set,Map,PropertiesService:{getScriptProperties:()=>properties},
 Utilities:{formatDate:()=> '2026-11-02'},Session:{getScriptTimeZone:()=> 'Europe/Vienna'}});
vm.runInContext(source,ctx,{filename:'Code.gs'});
const actualPushQueue=ctx.gaPushQueue_;
ctx.gaRows_=name=>(tables[name]||[]).map(x=>({...x}));ctx.gaOptionalRows_=ctx.gaRows_;
ctx.gaAppend_=(name,row)=>{(tables[name]||(tables[name]=[])).push({...row});};
ctx.gaReplace_=(name,id,changes)=>{const row=(tables[name]||[]).find(x=>x.ID===id);assert(row);Object.assign(row,changes);};
ctx.gaId_=()=>`id-${++seq}`;ctx.gaNow_=()=> '2026-11-02T12:00:00';ctx.gaLock_=f=>f();ctx.gaSession_=()=>actor;
ctx.gaLog_=()=>{};ctx.gaPushQueue_=(limit,id)=>{push.push({limit,id});};
const plain=x=>JSON.parse(JSON.stringify(x)),original=JSON.stringify(tables);
const preview=plain(ctx.gaApi('gabCompletionNoticePreview',{},'token'));
assert.equal(JSON.stringify(tables),original,'Preview must not write anything');
const byId=id=>preview.Teilnehmer.find(x=>x.MitgliedID===id);
assert.deepEqual(preview.Teilnehmer.map(x=>x.MitgliedID).sort(),['ambiguous','exhaust','missing','noaccount','passed','ready']);
assert.equal(byId('ready').Status,'Bereit');assert.equal(byId('ready').BSW,'BSW-Quiz offen und freigeschaltet');
assert.match(byId('ready').Text,/Menü → Wissenstests/);assert.match(byId('ready').Text,/offiziell bestätigt/);
assert.match(byId('ready').Text,/Herzlichen Glückwunsch/);assert.match(byId('ready').Text,/nächsten Wochen/);
assert.equal(byId('passed').Status,'Bereit');assert(!byId('passed').Text.includes('BSW'));
assert.equal(byId('missing').BSW,'BSW offen; Quiz noch nicht freigeschaltet');assert.match(byId('missing').Text,/Nach bestätigter Kursteilnahme/);
assert.equal(byId('exhaust').BSW,'BSW offen; Quizzugang prüfen');assert.match(byId('exhaust').Text,/weiteren Versuch/);
assert.match(byId('noaccount').Status,/Kein eindeutig/);assert.match(byId('ambiguous').Status,/nicht eindeutig/);
assert(!JSON.stringify(preview).includes('@example.test'));assert(!JSON.stringify(preview).includes('BenutzerID'));
for(const person of [account('ready'),admins[1]]){actor=person;
 assert.throws(()=>ctx.gaApi('gabCompletionNoticePreview',{},'token'),/Berechtigung/);
 assert.throws(()=>ctx.gaApi('sendGabCompletionNotices',{MitgliedIDs:['ready']},'token'),/Berechtigung/);}
actor=admins[0];assert.throws(()=>ctx.gaApi('sendGabCompletionNotices',{_gaRolePreview:'u-ready',MitgliedIDs:['ready']},'token'),/schreibgeschützt/);
assert.throws(()=>ctx.gaApi('sendGabCompletionNotices',{MitgliedIDs:Array(9).fill('ready')},'token'),/acht/);
const memberBefore=JSON.stringify(tables.Mitglieder),attemptBefore=JSON.stringify(tables.QuizVersuche),assignmentBefore=JSON.stringify(tables.ErweiterteZuordnungen);
const result=plain(ctx.gaApi('sendGabCompletionNotices',{MitgliedIDs:['ready','passed','missing','exhaust','noaccount','ambiguous','notdone','special']},'token'));
assert.deepEqual(result,{ok:true,erstellt:4,uebersprungen:4,fehler:0});
const notices=tables.Benachrichtigungen;assert.equal(notices.length,4);assert.equal(push.length,4);
assert.deepEqual(notices.map(x=>x.BenutzerID).sort(),['u-exhaust','u-missing','u-passed','u-ready']);
assert.equal(notices.find(n=>n.BenutzerID==='u-ready').PushStatus,'Wartend');
assert.match(notices.find(n=>n.BenutzerID==='u-ready').Titel,/BSW-Quiz offen/);
assert.equal(notices.find(n=>n.BenutzerID==='u-passed').PushStatus,'Kein Gerät registriert');
assert.equal(JSON.stringify(tables.Mitglieder),memberBefore);assert.equal(JSON.stringify(tables.QuizVersuche),attemptBefore);
assert.equal(JSON.stringify(tables.ErweiterteZuordnungen),assignmentBefore);
assert.equal(tables.Mitglieder.find(x=>x.ID==='ready').TurnusID,'g');
const again=plain(ctx.gaApi('sendGabCompletionNotices',{MitgliedIDs:['ready','passed']},'token'));
assert.equal(again.erstellt,0);assert.equal(again.uebersprungen,2);assert.equal(notices.length,4);assert.equal(push.length,4);
assert.equal(plain(ctx.gaApi('gabCompletionNoticePreview',{},'token')).Teilnehmer.find(x=>x.MitgliedID==='ready').Status,'Bereits benachrichtigt');
// A fresh participant who completes later is notified only on the false-to-true transition.
tables.Teilnahmen.push({ID:'a-notdone',MitgliedID:'notdone',TerminID:'term',Anwesend:'JA'});
actor=admins[0];ctx.gaApi('saveQualification',{MitgliedID:'notdone',GABFreigabe:'JA'},'token');
assert.equal(notices.filter(n=>n.BezugID==='GABCOMPLETE:notdone').length,1);
assert.equal(notices.find(n=>n.BezugID==='GABCOMPLETE:notdone').BenutzerID,'u-notdone');
assert.match(notices.find(n=>n.BezugID==='GABCOMPLETE:notdone').Text,/freigeschaltete BSW-Quiz/);
ctx.gaApi('saveQualification',{MitgliedID:'notdone',GABFreigabe:'JA'},'token');
assert.equal(notices.filter(n=>n.BezugID==='GABCOMPLETE:notdone').length,1);
// Missing registered devices or a push transport exception never prevents the in-app message.
const newMember=member('pushfail'),newUser=account('pushfail');tables.Mitglieder.push(newMember);tables.Benutzer.push(newUser);
tables.QualifikationMitglieder.push({ID:'q-pushfail',MitgliedID:'pushfail',GABFreigabe:'JA'});
tables.AbschnittNachweise.push(...['A','B'].map(b=>({ID:'p-pushfail-'+b,MitgliedID:'pushfail',KursID:'GAB-ABSCHNITT-BLOCK-'+b,Absolviert:'JA',PruefungBestanden:'JA'})));
ctx.gaPushQueue_=()=>{throw Error('push temporarily unavailable');};
const failure=plain(ctx.gaApi('sendGabCompletionNotices',{MitgliedIDs:['pushfail']},'token'));
assert.equal(failure.erstellt,1);assert.equal(notices.filter(n=>n.BezugID==='GABCOMPLETE:pushfail').length,1);
// Delayed push rechecks the current status: a quiz completed meanwhile is not advertised as open.
values.set('GA_WORKER_SECRET','s'.repeat(48));ctx.Utilities.computeHmacSha256Signature=()=>[1,2,3];ctx.Utilities.Charset={UTF_8:'UTF-8'};
const delivered=[];ctx.UrlFetchApp={fetch:(_url,request)=>{const outer=JSON.parse(request.payload);delivered.push(JSON.parse(outer.payload));
 return {getResponseCode:()=>200,getContentText:()=>' {"ok":true,"results":[{"ok":true}]}' };}};
tables.QuizVersuche.push({ID:'passed-later',MitgliedID:'ready',KursID:'bsw',QuizVersion:'3',Bestanden:'JA',Status:'Abgegeben'});
const queued=notices.find(n=>n.BezugID==='GABCOMPLETE:ready');actualPushQueue(1,queued.ID);
assert.equal(delivered.length,1);assert(!delivered[0].notification.title.includes('BSW-Quiz offen'));
assert(!delivered[0].notification.body.includes('BSW-Quiz'));
assert.equal(queued.PushStatus,'Gesendet (1)');actualPushQueue(1,queued.ID);assert.equal(delivered.length,1);
// A revoked graduation cannot result in a later congratulation push.
const revoked=notices.find(n=>n.BezugID==='GABCOMPLETE:missing');revoked.PushStatus='Wartend';
tables.PushGeraete.push({ID:'dev-missing',BenutzerID:'u-missing',Aktiv:'JA'});
tables.QualifikationMitglieder.find(q=>q.MitgliedID==='missing').GABFreigabe='NEIN';
actualPushQueue(1,revoked.ID);assert.equal(revoked.PushStatus,'Nicht mehr erforderlich');assert.equal(delivered.length,1);
console.log('GAB participant notices: targeted backfill, consented content, BSW eligibility, previous passes, push, missing accounts, deduplication and no data loss passed.');
