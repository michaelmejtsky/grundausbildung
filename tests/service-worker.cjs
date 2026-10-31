'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const handlers={},added=[],deleted=[],cacheOptions=[],fallback=[];
let online=true,claimed=false,skipped=false;
const cache={add:async req=>{added.push(req);},put:async()=>{}};
const sw={location:{origin:'https://example.test',href:'https://example.test/grundausbildung/service-worker.js'},
 addEventListener:(name,fn)=>{handlers[name]=fn;},skipWaiting:async()=>{skipped=true;},
 clients:{claim:async()=>{claimed=true;}}};
class FakeRequest{constructor(url,opts){this.url=url;this.cache=opts.cache;}}
const caches={open:async()=>cache,keys:async()=>['ga-shell-v2.31','ga-shell-v2.32','other'],
 delete:async key=>{deleted.push(key);},match:async key=>{fallback.push(key);return {cached:true};}};
const context={self:sw,caches,Request:FakeRequest,URL,console,
 fetch:async(req,opts)=>{cacheOptions.push(opts.cache);if(!online)throw Error('offline');return {ok:true,clone:()=>({})};}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','service-worker.js'),'utf8'),context,{filename:'service-worker.js'});
(async()=>{
 let task;handlers.install({waitUntil:p=>{task=p;}});await task;
 assert(skipped);assert(added.every(x=>x.cache==='reload'));
 assert(added.some(x=>x.url==='https://example.test/grundausbildung/quiz-ui.js?v=gueltigkeit-1'));
 handlers.activate({waitUntil:p=>{task=p;}});await task;
 assert(claimed);assert.deepEqual(deleted,['ga-shell-v2.31']);
 let response;const req={method:'GET',mode:'navigate',url:'https://example.test/grundausbildung/'};
 handlers.fetch({request:req,respondWith:p=>{response=p;}});assert((await response).ok);
 assert.equal(cacheOptions.at(-1),'no-cache');
 online=false;handlers.fetch({request:req,respondWith:p=>{response=p;}});
 assert((await response).cached);assert.equal(fallback.at(-1),'./index.html');
 console.log('Service Worker: update revalidation and offline fallback passed.');
})().catch(error=>{console.error(error);process.exitCode=1;});
