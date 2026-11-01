'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
function fn(name){const start=html.indexOf('function '+name+'(');assert(start>=0,name);const end=name==='gaTrainingUpcoming'?html.indexOf('\n\nconst name=',start):html.indexOf('\nfunction ',start+1);assert(end>start,name);return html.slice(start,end);}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const context=vm.createContext({console,Date,Intl,Set,Map,document:{getElementById:()=>null},
 h:esc,by:(rows,id)=>(rows||[]).find(x=>x.ID===id),role:()=>context.STATE.user.Rolle,VIEW:'trainerHome',
 STATE:{user:{ID:'trainer',Name:'Florian Beispiel',Rolle:'Ausbilder'},rechte:{KurseGestalten:true,KurseFreigeben:true,TerminePlanen:true},
  kurse:[{ID:'c1',Titel:'Funk und Geräte',Bereich:'Grundausbildung',Aktiv:'JA'},
   {ID:'c2',Titel:'Weitere Ausbildung',Bereich:'Erweiterte Ausbildung',Aktiv:'JA'},
   {ID:'c3',Titel:'Nicht aktives Modul',Bereich:'Grundausbildung',Aktiv:'NEIN'}],
  turnusse:[{ID:'g1',Bezeichnung:'GAB 2026'},{ID:'e1',Bezeichnung:'Erweitert'}],
  termine:[{ID:'later',KursID:'c2',TurnusID:'e1',Beginn:'2026-11-03T08:00',Ende:'2026-11-03T10:00',Ort:'Hof',Status:'Geplant'},
   {ID:'next',KursID:'c1',TurnusID:'g1',Beginn:'2026-11-01T10:00',Ende:'2026-11-01T12:00',Ort:'Lehrsaal',Status:'Geplant'},
   {ID:'finished',KursID:'c1',TurnusID:'g1',Beginn:'2026-11-02T08:00',Status:'Durchgeführt'},
   {ID:'old',KursID:'c1',TurnusID:'g1',Beginn:'2026-10-01T08:00',Ende:'2026-10-01T10:00',Status:'Geplant'},
   {ID:'bad-date',KursID:'c1',TurnusID:'g1',Beginn:'fehlt',Status:'Geplant'}],
  kursPlanung:{kurse:{c1:{MaterialNotiz:'Beamer und Funkgeräte',VerantwortlicheIDs:['trainer']},
   c2:{MaterialNotiz:'Andere',VerantwortlicheIDs:['jemand']},c3:{MaterialNotiz:'Alt',VerantwortlicheIDs:['trainer']}},projekte:{}},
  benachrichtigungen:[{ID:'n1',Titel:'Kursfreigabe',ErstelltAm:'2026-10-31T12:00',GelesenAm:''},
   {ID:'n2',Titel:'Schon gelesen',ErstelltAm:'2026-10-30T12:00',GelesenAm:'2026-10-30T13:00'}],
  kursProjekte:[{ID:'p1',Titel:'Mein Projekt',Status:'In Ausarbeitung',ErstelltVon:'trainer'},
   {ID:'p2',Titel:'Projekt zur Prüfung',Status:'Zur Prüfung',ErstelltVon:'other'},
   {ID:'p3',Titel:'Altes Projekt',Status:'Veröffentlicht',ErstelltVon:'trainer'}]}});
vm.runInContext(['gaTrainingTimestamp','gaTrainingUpcoming','navs','gaTrainerTime','gaTrainerOverview'].map(fn).join('\n'),context);
vm.runInContext(fs.readFileSync(path.join(root,'admin-ui.js'),'utf8'),context,{filename:'admin-ui.js'});
const initial=JSON.stringify(context.STATE),now=new Date(2026,10,1,9,0).getTime();
const tabs=Array.from(context.navs(),x=>Array.from(x));
assert.equal(tabs[0][0],'trainerHome');assert(tabs.some(t=>t[0]==='notifications'));
const menu=context.gaMenuHtml(tabs);assert(menu.includes('data-view="trainerHome"'));assert.equal((menu.match(/data-view="notifications"/g)||[]).length,1);
const view=context.gaTrainerOverview(now);
assert(view.includes('Servus, Florian!'));assert(view.includes('Funk und Geräte'));assert(view.includes('Beamer und Funkgeräte'));
assert(view.includes('data-training-open="next"'));assert(view.includes('data-training-open="later"'));
assert(!view.includes('data-training-open="finished"'));assert(!view.includes('data-training-open="old"'));assert(!view.includes('data-training-open="bad-date"'));
assert(view.indexOf('data-training-open="next"')<view.indexOf('data-training-open="later"'));
assert(view.includes('Alle geplanten Ausbildungen'));assert(view.includes('Deine Modulzuständigkeit'));
assert(view.includes('Kursfreigabe'));assert(!view.includes('Schon gelesen'));
assert(view.includes('Mein Projekt'));assert(!view.includes('Altes Projekt'));assert(view.includes('1 Modul wartet auf Prüfung'));
assert(view.includes('data-view="quizzes"'));assert(view.includes('data-view="terms"'));
assert.equal(JSON.stringify(context.STATE),initial,'The dashboard must not modify user or training data');

// Without extra rights, links to privileged features are not offered.
context.STATE.rechte={};let simple=context.gaTrainerOverview(now);
assert(!simple.includes('data-view="quizzes"'));assert(!simple.includes('data-view="terms"'));
assert(simple.includes('data-view="attendance"'));assert(simple.includes('data-view="courses"'));
assert(!Array.from(context.navs(),x=>x[0]).includes('terms'));
// Old backends must not claim zero assigned courses; assignment data is not available there.
delete context.STATE.kursPlanung;let legacy=context.gaTrainerOverview(now);
assert(legacy.includes('Modulzuständigkeiten sind derzeit noch nicht verfügbar'));
assert(legacy.includes('Noch nicht verfügbar'));
context.STATE.kursPlanung={kurse:{c1:{Fehler:'Problem'}},projekte:{}};
assert(context.gaTrainerOverview(now).includes('Prüfung erforderlich'));
// Empty state and escaping for arbitrary course names.
context.STATE.termine=[];context.STATE.benachrichtigungen=[];context.STATE.kursProjekte=[];context.STATE.kursPlanung={kurse:{},projekte:{}};
context.STATE.user.Name='<script>alert(1)</script> Beispiel';let empty=context.gaTrainerOverview(now);
assert(empty.includes('keine kommenden Ausbildungstermine'));assert(empty.includes('keine ungelesenen Benachrichtigungen'));
assert(!empty.includes('<script>alert(1)</script>'));assert(empty.includes('&lt;script&gt;'));
// Default routing and existing role entry points remain intact.
for(const [role,expected] of [['Administrator','overview'],['Teilnehmer','mine'],['Organisator Erweiterte Ausbildung','advOverview']]){
 context.STATE.user.Rolle=role;context.STATE.meMember=role==='Teilnehmer'?{ID:'m'}:null;
 assert.equal(context.navs()[0][0],expected);assert.equal(context.gaTrainerOverview(now),'');
}
const restoreBlock=html.match(/if\(document\.readyState==='loading'\)document\.addEventListener\('DOMContentLoaded',gaRestoreLogin,\{once:true\}\);\s*else gaRestoreLogin\(\);/);
assert(restoreBlock,'Session restoration must wait until the remaining scripts finish loading');
let restored=0,readyHandler=null;const loading={document:{readyState:'loading',addEventListener:(event,cb)=>{assert.equal(event,'DOMContentLoaded');readyHandler=cb;}},gaRestoreLogin:()=>{restored++;}};
vm.runInNewContext(restoreBlock[0],loading);assert.equal(restored,0);readyHandler();assert.equal(restored,1);
restored=0;vm.runInNewContext(restoreBlock[0],{document:{readyState:'complete'},gaRestoreLogin:()=>{restored++;}});assert.equal(restored,1);
// Manual login cannot be overwritten by a late saved-session response.
const restoreStart=html.indexOf('async function gaRestoreLogin()'),restoreEnd=html.indexOf('\nasync function initInvite(',restoreStart);
assert(restoreStart>=0&&restoreEnd>restoreStart);
let resolveState,calls=0,renders=0;
const auth=vm.createContext({URLSearchParams,location:{hash:''},GA_MANUAL_LOGIN_PENDING:false,STATE:null,TOKEN:'',VIEW:'',NOTICE_FOCUS:'',
 gaGetStoredLogin:()=>({token:'saved-token'}),api:()=>{calls++;return new Promise(resolve=>{resolveState=resolve;});},
 $:()=>({classList:{add(){},remove(){}},textContent:''}),gaCountAppVisit:()=>{},render:()=>{renders++;},openPushNotification:()=>{},gaClearLogin:()=>{}});
vm.runInContext(html.slice(restoreStart,restoreEnd),auth);
(async()=>{
 auth.GA_MANUAL_LOGIN_PENDING=true;await auth.gaRestoreLogin();assert.equal(calls,0);
 auth.GA_MANUAL_LOGIN_PENDING=false;let request=auth.gaRestoreLogin();assert.equal(calls,1);
 auth.GA_MANUAL_LOGIN_PENDING=true;resolveState({user:{ID:'old'}});await request;assert.equal(auth.STATE,null);assert.equal(renders,0);
 auth.GA_MANUAL_LOGIN_PENDING=false;request=auth.gaRestoreLogin();resolveState({user:{ID:'correct'}});await request;
 assert.equal(auth.STATE.user.ID,'correct');assert.equal(renders,1);assert.equal(auth.VIEW,'overview');
 console.log('Trainer start: role-specific entry, rights, dates, assignments, notices, empty states, escaping and login race passed.');
})().catch(error=>{console.error(error);process.exitCode=1;});
