'use strict';
// Isolierte UI-Prüfung: Es werden keine Produktivdaten oder echten Konten verwendet.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const source=fs.readFileSync(path.resolve(__dirname,'..','quiz-ui.js'),'utf8');
const entries=new Map();
const storage={get length(){return entries.size;},key:i=>[...entries.keys()][i]??null,
 getItem:k=>entries.has(k)?entries.get(k):null,setItem:(k,v)=>entries.set(k,String(v)),removeItem:k=>entries.delete(k)};
const listeners={},app={addEventListener:(kind,fn)=>{(listeners[kind]??=[]).push(fn);}};
const questions=[
 {typ:'single',text:'Bestehende Frage eins?',options:['A','B','C','D'],correct:[0]},
 {typ:'single',text:'Bestehende Frage zwei?',options:['E','F','G','H'],correct:[1]}
];
const cfg={ID:'quiz',KursID:'course',Aktiv:'JA',Pflicht:'JA',Bestehensgrenze:80,MaxVersuche:3,ZeitlimitMinuten:0,FrageAnzahl:2,Version:'2'};
const context=vm.createContext({console,Date,JSON,Set,Map,Promise,sessionStorage:storage,
 document:{getElementById:id=>id==='app'?app:null,querySelector:()=>null},
 STATE:{user:{ID:'admin'},kurse:[{ID:'course',Titel:'Bestehender Kurs',Bereich:'Grundausbildung',Aktiv:'JA'},
  {ID:'new',Titel:'Neuer Kurs',Bereich:'Grundausbildung',Aktiv:'JA'}],quizKurse:[cfg],quizVersuche:[],
  gueltigkeit:{quiz:{course:'2027-01-01'}}},
 VIEW:'quizzes',by:(xs,id)=>xs.find(x=>x.ID===id),role:()=> 'Administrator',
 h:x=>String(x??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;'),
 confirm:()=>true,tip:()=>{},reload:async()=>{},
 FormData:class {constructor(form){this.values=form.values;} get(k){return this.values[k]??null;} has(k){return Object.hasOwn(this.values,k);}}
});
vm.runInContext(source,context,{filename:'quiz-ui.js'});
context.render=()=>{context.html=context.qAdmin();};
const get=expression=>vm.runInContext(expression,context);
const state=()=>JSON.parse(JSON.stringify(get('({items:Q_ITEMS,ready:Q_EDITOR_READY,error:Q_EDITOR_ERROR,loading:Q_EDITOR_LOADING,recover:Q_RECOVERABLE})')));
const pending=[],writes=[];
context.api=(method,payload)=>{
 if(method==='getQuizEdit')return new Promise((resolve,reject)=>pending.push({payload,resolve,reject}));
 if(method==='saveQuiz'){writes.push(JSON.parse(JSON.stringify(payload)));return Promise.resolve({message:'Gespeichert'});}
 throw Error('Unexpected action: '+method);
};
const complete=i=>({...cfg,Fragen:questions.map(q=>({...q})),GueltigAb:'2027-01-01',...(i||{})});
const form={dataset:{course:'course'},elements:{namedItem:name=>name==='GueltigAb'?{}:null},
 values:{Aktiv:'JA',Pflicht:'JA',Bestehensgrenze:'80',MaxVersuche:'3',ZeitlimitMinuten:'0',GueltigAb:'2028-01-01'}};

(async()=>{
 // Ein leerer lokaler Entwurf darf nie die tatsächlich gespeicherten Fragen verdecken.
 const originalDraft={saved:Date.now(),items:[{typ:'single',text:'',options:['','','',''],correct:[0]}],meta:{}};
 storage.setItem('ga-quiz-draft-v2-admin-course',JSON.stringify(originalDraft));
 let open=context.qOpenEditor('course');
 assert.match(context.html,/Quiz wird geladen/);
 assert(!context.html.includes('data-form="quizSave"'));
 await assert.rejects(context.qSave(form),/vollständig geladen/);
 assert.equal(writes.length,0);
 pending.shift().resolve(complete());await open;
 assert.equal(state().ready,true);
 assert.deepEqual(state().items.map(x=>x.text),questions.map(x=>x.text));
 assert.match(context.html,/Bestehende Frage eins/);
 assert.match(context.html,/Entwurf wiederherstellen/);
 assert.equal(JSON.parse(storage.getItem('ga-quiz-draft-v2-admin-course')).items[0].text,'');
 // Beim Bearbeiten wird ein vorhandener Entwurf erhalten, bevor das Autosave ihn ersetzen kann.
 context.qAutoDraft();
 assert([...entries.keys()].some(k=>k.startsWith('ga-quiz-draft-v2-admin-course-recovery-')));
 await context.qSave(form);
 assert.equal(writes.length,1);
 assert.deepEqual(writes[0].Fragen.map(q=>q.text),questions.map(q=>q.text));
 assert.equal(writes[0].GueltigAb,'2028-01-01');

 // Der gespeicherte Entwurf darf ausdrücklich gewählt werden, bleibt aber bis dahin unangetastet.
 entries.clear();storage.setItem('ga-quiz-draft-v2-admin-course',JSON.stringify(originalDraft));
 open=context.qOpenEditor('course');pending.shift().resolve(complete());await open;
 context.qRestoreDraft();
 assert.equal(state().items[0].text,'');
 assert([...entries.keys()].some(k=>k.startsWith('ga-quiz-draft-v2-admin-course-recovery-')));

 // Fehlende, leere oder nicht erreichbare Serverdaten dürfen kein leeres bestehendes Quiz erzeugen.
 for(const answer of [null,{...cfg,Fragen:[]},new Error('Verbindung unterbrochen')]){
  entries.clear();open=context.qOpenEditor('course');const request=pending.shift();
  if(answer instanceof Error)request.reject(answer);else request.resolve(answer);await open;
  assert.equal(state().ready,false);assert.match(context.html,/konnte nicht geladen werden/);
  assert(!context.html.includes('data-form="quizSave"'));
  await assert.rejects(context.qSave(form),/vollständig geladen/);
 }
 assert.equal(writes.length,1);

 // Ein wirklich neues Quiz darf dagegen nach erfolgreicher Serverantwort angelegt werden.
 open=context.qOpenEditor('new');pending.shift().resolve(null);await open;
 assert.equal(state().ready,true);assert.equal(state().items.length,1);assert.equal(state().items[0].text,'');

 // Eine spät eintreffende Antwort darf eine neuere Öffnung nicht überschreiben.
 const first=context.qOpenEditor('course'),second=context.qOpenEditor('course');
 const r1=pending.shift(),r2=pending.shift();
 r2.resolve(complete());await second;
 r1.resolve(complete({Fragen:[{...questions[0],text:'Veraltete Antwort'}]}));await first;
 assert.deepEqual(state().items.map(x=>x.text),questions.map(x=>x.text));
 console.log('Quiz editor: safe loading, original questions, date-only saves, draft recovery, server failures and request races passed.');
})().catch(e=>{console.error(e);process.exitCode=1;});
