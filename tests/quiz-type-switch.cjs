'use strict';
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'..','quiz-ui.js'),'utf8');
const listeners={};let root=null;
const app={addEventListener:(event,fn)=>{(listeners[event]??=[]).push(fn);}};
const context=vm.createContext({console,Date,JSON,Set,Map,Promise,sessionStorage:{setItem(){},getItem(){return null}},
 document:{getElementById:id=>id==='app'?app:id==='q-editor-rows'?root:null,querySelector:()=>null},
 STATE:{version:'1.13.3',user:{ID:'admin'},kurse:[{ID:'course',Titel:'Kurs'}],quizKurse:[]},
 VIEW:'quizzes',by:(xs,id)=>xs.find(x=>x.ID===id),role:()=> 'Administrator',h:s=>String(s??''),tip:()=>{},confirm:()=>true});
vm.runInContext(source,context,{filename:'quiz-ui.js'});
context.qRepaint=()=>{};
function set(expr){return vm.runInContext(expr,context);}
function createCard(fromType,toType){
 const select={value:toType,closest:()=>card};
 const old={typ:fromType,text:'Wichtige Frage',options:['Antwort A','Antwort B','Antwort C','Antwort D'],correct:[1],pairs:[['links','rechts'],['oben','unten']]};
 set(`Q_ITEMS=${JSON.stringify([old])}; Q_EDIT='course'; Q_EDITOR_READY=false; Q_PREVIEW=false;`);
 const card={dataset:{qitem:'0'},querySelector:q=>q==='[data-qtype]'?select:q==='[name=qtext]'?{value:old.text}:q==='[name=qtf]'?{value:'1'}:null,
  querySelectorAll:q=>q==='[data-qanswer]'?old.options.map(value=>({value})):q==='[data-qcorrect]:checked'?[{value:'1'}]:
   q==='[data-qleft]'?old.pairs.map(pair=>({value:pair[0]})):q==='[data-qright]'?old.pairs.map(pair=>({value:pair[1]})):[]};
 root={querySelectorAll:()=>[card]};return select;
}
function switchType(from,to){const select=createCard(from,to);listeners.change[0]({target:{closest:()=>select}});return JSON.parse(set('JSON.stringify(Q_ITEMS[0])'));}
let next=switchType('single','tf');assert.equal(next.typ,'tf');assert.equal(next.text,'Wichtige Frage');
next=switchType('tf','yn');assert.equal(next.typ,'yn');assert.equal(next.correct[0],1);assert.equal(next.text,'Wichtige Frage');
next=switchType('yn','match');assert.equal(next.typ,'match');assert.equal(next.text,'Wichtige Frage');
next=switchType('match','single');assert.equal(next.typ,'single');assert.equal(next.text,'Wichtige Frage');
next=switchType('single','multi');assert.deepEqual(next.options,['Antwort A','Antwort B','Antwort C','Antwort D']);assert.deepEqual(next.correct,[1]);
// Labels, preview and backend-version guard.
set("Q_ITEMS=[{typ:'yn',text:'Ist das richtig?',correct:[1]}]; Q_OPEN=0; Q_EDIT='course'; Q_PREVIEW_ANSWERS=null; Q_PREVIEW_RESULT=null;");
assert.match(context.qAnswerHtml({typ:'yn',correct:[1]},0),/>Ja<\/option>/);assert.match(context.qAnswerHtml({typ:'yn',correct:[1]},0),/>Nein<\/option>/);
const preview=context.qPreviewPage();assert.match(preview,/>Ja<\/span>/);assert.match(preview,/>Nein<\/span>/);assert(!preview.includes('>Falsch</span>'));
assert.equal(context.qValidity({typ:'yn',text:'Frage?',correct:[1]}),null);
context.STATE.version='1.13.2';assert.match(context.qValidity({typ:'yn',text:'Frage?',correct:[1]}).message,/1\.13\.3/);
set("Q_ITEMS=[{typ:'single',text:'Alt',options:['A','B','C','D'],correct:[0]}]");
assert(!context.qEditorRows().includes('value="yn"'));
context.STATE.version='1.13.3';assert(context.qEditorRows().includes('value="yn"'));
console.log('Quiz type switching, preserved fields, Ja/Nein labels, preview and old backend guard passed.');
