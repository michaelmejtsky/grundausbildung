'use strict';
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const start=html.indexOf('async function api(action,payload={})'),end=html.indexOf('\nfunction role()',start);
assert(start>=0&&end>start);
const elements={},messages=[],calls=[],savedHandlers={};
function element(id){return elements[id]??=(function(){const classes=new Set();return {id,disabled:false,value:'',textContent:'',innerHTML:'',
 classList:{add:c=>classes.add(c),remove:c=>classes.delete(c),toggle:(c,on)=>{if(on===undefined){if(classes.has(c)){classes.delete(c);return false;}classes.add(c);return true;}on?classes.add(c):classes.delete(c);return on;},contains:c=>classes.has(c)},
 focus(){this.focused=true;},querySelector(){return {focus(){}};},querySelectorAll(){return [];},addEventListener:(type,fn,capture)=>{savedHandlers[id+':'+type+(capture?':capture':'')]=fn;}};})();}
const admin={ID:'a',Name:'Admin',Rolle:'Administrator'},participant={ID:'p',Name:'Teilnehmer',Rolle:'Teilnehmer'};
const roster=[{...admin,Email:'a@example.test',Aktiv:'JA'}, {...participant,Email:'p@example.test',Aktiv:'JA'},
 {ID:'o',Name:'Org',Rolle:'Organisator Erweiterte Ausbildung',Email:'o@example.test',Aktiv:'JA'},
 {ID:'i',Name:'Inaktiv',Rolle:'Ausbilder',Aktiv:'NEIN'}];
let legacy=false,resolveSlow=null;
const context=vm.createContext({console,Set,JSON,document:{body:{classList:{remove(){}}}},$:element,
 h:s=>String(s??'').replaceAll('<','&lt;').replaceAll('>','&gt;'),
 TOKEN:'token',STATE:{user:admin,benutzer:roster},VIEW:'overview',FORM:'',EDIT:null,TERM:null,PROJECT_REVIEW_ID:'',
 GA_TRAINER_AREA:'',GA_ROLE_PREVIEW:'',GA_ADMIN_ADV_VIEW:false,GA_ADMIN_USERS:[],GA_VIEW_BUSY:false,
 role:()=>context.STATE?.user?.Rolle,render:()=>{context.rendered=(context.rendered||0)+1;},tip:(s,error)=>messages.push({s,error}),
 rpc:async(_fn,method,data,token)=>{calls.push({method,data,token});if(method==='slow')return new Promise(resolve=>{resolveSlow=resolve;});
  if(method!=='state')return {ok:true};
  if(legacy)return {user:admin,benutzer:roster};
  if(data._gaRolePreview)return {administratorRollenvorschau:true,user:roster.find(x=>x.ID===data._gaRolePreview)};
  if(data._gaAdvancedView)return {administratorErweitert:true,organisatorErweitert:true,user:{...admin,Rolle:'Organisator Erweiterte Ausbildung'}};
  return {user:admin,benutzer:roster};}
});
vm.runInContext(html.slice(start,end),context,{filename:'index-view-switch.js'});
const G='Grundausbildung',E='Erweiterte Ausbildung',trainer={ID:'t',Name:'Florian Beispiel',Rolle:'Ausbilder'};
const state=area=>({user:trainer,ausbilderBereiche:[G,E],ausbilderBereich:area,ausbilderBereichAuswahlNoetig:!area,
 kurse:area?[{ID:area===G?'g':'e',Bereich:area}]:[],benachrichtigungen:[]});
let slowResolve=null,oldBackend=false;
context.rpc=async(_fn,method,data,token)=>{calls.push({method,data,token});if(method!=='state')return {ok:true};
 if(data.slow)return new Promise(resolve=>{slowResolve=resolve;});
 if(oldBackend)return {user:trainer};
 return {...state(data._gaTrainerArea||''),...(data._gaRolePreview?{administratorRollenvorschau:true}: {})};};
(async()=>{
 context.STATE=state('');context.gaOpenTrainerChooser(true);
 assert(!element('gaTrainerChooser').classList.contains('hidden'));assert(element('gaTrainerCancel').classList.contains('hidden'));assert.equal(element('app').inert,true);
 assert(element('gaTrainerChoices').innerHTML.includes(G));assert(element('gaTrainerChoices').innerHTML.includes(E));
 await context.gaChooseTrainerArea(G);assert.equal(context.GA_TRAINER_AREA,G);assert.equal(context.STATE.kurse[0].ID,'g');
 assert(element('gaTrainerChooser').classList.contains('hidden'));assert.equal(element('app').inert,false);
 assert.equal(context.VIEW,'trainerHome');
 context.gaUpdateViewControls();assert(!element('gaTrainerButton').classList.contains('hidden'));assert(element('gaTrainerButton').textContent.includes(G));
 await context.api('saveCourse',{ID:'g'});assert.equal(calls.at(-1).data._gaTrainerArea,G);
 const before=context.STATE;oldBackend=true;await context.gaChooseTrainerArea(E);assert.equal(context.STATE,before);assert.equal(context.GA_TRAINER_AREA,G);assert.match(messages.at(-1).s,/1\.13\.5/);oldBackend=false;
 context.EDIT='g';context.TERM={ID:'old'};context.FORM='course';await context.gaChooseTrainerArea(E);
 assert.equal(context.GA_TRAINER_AREA,E);assert.equal(context.EDIT,null);assert.equal(context.TERM,null);assert.equal(context.FORM,'');assert.equal(context.STATE.kurse[0].ID,'e');
 const snapshot=JSON.stringify(context.STATE);await context.gaChooseTrainerArea('Administrator');assert.equal(JSON.stringify(context.STATE),snapshot);
 // Actual user preview carries both flags, retains the preview identity and stays read-only.
 context.GA_ROLE_PREVIEW='t';await context.gaChooseTrainerArea(G);assert.equal(calls.at(-1).data._gaRolePreview,'t');assert.equal(calls.at(-1).data._gaTrainerArea,G);
 assert.equal(context.STATE.administratorRollenvorschau,true);await assert.rejects(context.api('saveQuiz',{}),/schreibgeschützt/);
 context.GA_ROLE_PREVIEW='';
 // A pending old-area refresh must not overwrite a successfully switched area.
 const rpc=context.rpc;let resolveRefresh;
 context.rpc=(_fn,method,data,token)=>method==='state'&&data._gaTrainerArea===G?new Promise(resolve=>{resolveRefresh=resolve;}):rpc(_fn,method,data,token);
 const refresh=context.reload();await context.gaChooseTrainerArea(E);resolveRefresh(state(G));await refresh;assert.equal(context.STATE.ausbilderBereich,E);
 context.rpc=rpc;
 // Signing out during a pending area selection discards its response.
 let complete;context.rpc=()=>new Promise(resolve=>{complete=resolve;});const switching=context.gaChooseTrainerArea(G);context.TOKEN='';context.STATE=null;complete(state(G));await switching;assert.equal(context.STATE,null);
 assert(html.includes('data-trainer-areas'));assert(html.includes("fd.getAll('Ausbildungsbereiche')"));assert(html.includes("STATE.ausbilderBereich?[STATE.ausbilderBereich]"));
 console.log('Trainer area UI: required chooser, scoped API calls, reset on switch, old backend, preview and response races passed.');
})().catch(e=>{console.error(e);process.exitCode=1;});
