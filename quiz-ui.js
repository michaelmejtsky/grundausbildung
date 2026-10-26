/* Grundausbildung V1.6 · Quiz-Verwaltung und Wissenstests */
'use strict';
let Q_EDIT='',Q_META=null,Q_ITEMS=[],Q_SESSION=null,Q_RESULT=null,Q_PREVIEW_LIMIT=80;
let Q_TEMPLATE_BACKUP=null;
const qCfg=id=>(STATE.quizKurse||[]).find(q=>q.KursID===id);

/** Abgeleiteter Ausbildungsabschluss: keine künstliche Kursabschluss-Tabelle und keine geänderten Nachweise. */
function qCourseStatus(courseId,memberId,turnusId){
 const config=qCfg(courseId);
 const member=memberId?(STATE.mitglieder||[]).find(m=>m.ID===memberId):null;
 const turnus=turnusId||member?.TurnusID||STATE.meMember?.TurnusID||'';
 const terms=(STATE.termine||[]).filter(t=>t.KursID===courseId&&t.Status==='Durchgeführt'&&(!turnus||t.TurnusID===turnus));
 const attended=(STATE.teilnahmen||[]).some(a=>a.MitgliedID===memberId&&a.Anwesend==='JA'&&terms.some(t=>t.ID===a.TerminID));
 const active=config?.Aktiv==='JA',required=active&&config.Pflicht==='JA';
 const success=active&&(STATE.quizVersuche||[]).some(a=>a.KursID===courseId&&a.MitgliedID===memberId&&
  String(a.QuizVersion)===String(config.Version)&&a.Bestanden==='JA');
 const complete=attended&&(!required||success);
 return {attended,required,success,complete,
   label:complete?'Kurs positiv abgeschlossen':attended&&required?'Theorie abgeschlossen · Pflichtquiz offen':'Noch nicht abgeschlossen',
   note:attended&&required&&success?'Pflichtquiz bestanden':attended&&active&&!required&&success?'Freiwilliges Quiz bestanden':
    attended&&active&&!required?'Freiwilliges Quiz möglich':attended&&required?'Pflichtquiz ausständig':''};
}
function qCourseBadge(courseId,memberId,turnusId){
 const s=qCourseStatus(courseId,memberId,turnusId);
 const tone=s.complete?'ok':s.attended?'warn':'blue';
 return '<span class="q-course-status"><span class="tag '+tone+'">'+h(s.label)+'</span>'+
   (s.note?'<span class="tag '+(s.success?'ok':'blue')+'">'+h(s.note)+'</span>':'')+'</span>';
}


/* Editor V2.0: Einzelantworten, sichere Entwurfssicherung und lokale Testvorschau. */
let Q_PREVIEW=false,Q_PREVIEW_RESULT=null,Q_PREVIEW_ANSWERS=null,Q_OPEN=0;
const qNew=(typ='single')=>({typ,text:'',options:['','','',''],correct:typ==='multi'?[0,1]:[0],pairs:[['',''],['','']]});
const qDraftKey=id=>'ga-quiz-draft-v2-'+String(STATE?.user?.ID||'')+'-'+String(id||'');
const qLetter=n=>String.fromCharCode(65+n);
function qAutoDraft(){
 if(!Q_EDIT)return;
 try{const form=document.querySelector('form[data-form="quizSave"]');
  const meta=form?qCurrentMeta(form):(Q_META||qCfg(Q_EDIT)||{});
  sessionStorage.setItem(qDraftKey(Q_EDIT),JSON.stringify({saved:Date.now(),items:Q_ITEMS,meta}));}
 catch(e){/* Unavailable storage must never prevent saving on the server. */}
}
function qClearDraft(id){try{sessionStorage.removeItem(qDraftKey(id));}catch(e){}}
function qGetDraft(id){
 try{const x=JSON.parse(sessionStorage.getItem(qDraftKey(id))||'null');
  return x&&Array.isArray(x.items)&&x.items.length?x:null;
 }catch(e){return null;}
}
function qCapture(){
 const root=document.getElementById('q-editor-rows');
 if(!root)return;
 Q_ITEMS=Array.from(root.querySelectorAll('[data-qitem]')).map(el=>{
  const typ=el.querySelector('[data-qtype]').value;
  const text=el.querySelector('[name=qtext]').value;
  if(typ==='match'){
   const left=Array.from(el.querySelectorAll('[data-qleft]')).map(x=>x.value.trim());
   const right=Array.from(el.querySelectorAll('[data-qright]')).map(x=>x.value.trim());
   return {typ,text,pairs:left.map((value,i)=>[value,right[i]])};
  }
  if(typ==='tf')return {typ,text,correct:[Number(el.querySelector('[name=qtf]').value)]};
  const options=Array.from(el.querySelectorAll('[data-qanswer]')).map(x=>x.value.trim());
  const correct=Array.from(el.querySelectorAll('[data-qcorrect]:checked')).map(x=>Number(x.value));
  return {typ,text,options,correct};
 });
 qAutoDraft();
}
function qValidity(q){
 if(!String(q.text||'').trim())return {field:'qtext',message:'Bitte eine Fragestellung eingeben.'};
 if(q.typ==='match'){
  const pairs=q.pairs||[];
  if(pairs.length<2||pairs.length>6)return {field:'qleft',message:'Bitte zwei bis sechs Zuordnungspaare anlegen.'};
  if(pairs.some(p=>!String(p[0]||'').trim()||!String(p[1]||'').trim()))
   return {field:'qleft',message:'Jedes Zuordnungspaar benötigt links und rechts einen Text.'};
  if(new Set(pairs.map(p=>p[1].toLowerCase())).size!==pairs.length)
   return {field:'qright',message:'Die rechten Zuordnungsantworten müssen unterschiedlich sein.'};
  return null;
 }
 if(q.typ==='tf')return [0,1].includes(Number(q.correct?.[0]))?null:{field:'qtf',message:'Bitte Richtig oder Falsch als Lösung auswählen.'};
 const answers=q.options||[];
 if(answers.length!==4)return {field:'qanswer',message:'Es sind genau vier Antwortfelder erforderlich.'};
 const empty=answers.findIndex(a=>!String(a).trim());
 if(empty!==-1)return {field:'qanswer',at:empty,message:'Antwort '+qLetter(empty)+' ist leer. Bitte alle vier Antworten ausfüllen.'};
 if(new Set(answers.map(a=>a.toLocaleLowerCase('de-AT'))).size!==4)
  return {field:'qanswer',message:'Alle vier Antwortmöglichkeiten müssen unterschiedlich sein.'};
 const right=q.correct||[];
 if(!right.length)return {field:'qcorrect',message:'Markiere mindestens eine richtige Antwort.'};
 if(right.some(n=>!Number.isInteger(n)||n<0||n>3)||new Set(right).size!==right.length)
  return {field:'qcorrect',message:'Die richtige Antwort ist ungültig.'};
 if(q.typ==='single'&&right.length!==1)return {field:'qcorrect',message:'Markiere genau eine richtige Antwort.'};
 if(q.typ==='multi'&&right.length<2)return {field:'qcorrect',message:'Markiere mindestens zwei richtige Antworten.'};
 return null;
}
function qValidateBeforeSave(){
 if(!Q_ITEMS.length)throw new Error('Bitte mindestens eine Frage anlegen.');
 if(Q_ITEMS.length>20)throw new Error('Maximal 20 Quizfragen möglich.');
 const problems=Q_ITEMS.map((q,i)=>({index:i,problem:qValidity(q)})).filter(x=>x.problem);
 if(problems.length){
  const i=problems[0].index,issue=problems[0].problem;
  Q_OPEN=i;
  const card=document.querySelector('[data-qitem="'+i+'"]');
  if(card){
   card.open=true;card.classList.add('q-invalid');
   let input=card.querySelector('[data-'+issue.field+']')||card.querySelector('[name="'+issue.field+'"]');
   if(issue.field==='qanswer')input=card.querySelectorAll('[data-qanswer]')[issue.at||0]||input;
   if(input){input.focus();input.scrollIntoView({block:'center',behavior:'smooth'});}
  }
  throw new Error('Frage '+(i+1)+': '+issue.message);
 }
}
function qAnswerHtml(q,i){
 if(q.typ==='tf')return '<div class="q-right-toggle"><label>Welche Aussage ist richtig?</label><select name="qtf">'+
  '<option value="0" '+(Number(q.correct?.[0]??0)===0?'selected':'')+'>Richtig</option>'+
  '<option value="1" '+(Number(q.correct?.[0]??0)===1?'selected':'')+'>Falsch</option></select></div>';
 if(q.typ==='match')return '<div class="q-matching"><div class="q-match-head"><span>Begriff / Links</span><span>Passende Zuordnung / Rechts</span></div>'+
  (q.pairs||[['',''],['','']]).map((pair,j)=>'<div class="q-match-row">'+
   '<input type="text" data-qleft="'+j+'" maxlength="150" placeholder="Begriff '+(j+1)+'" value="'+h(pair[0]||'')+'">'+
   '<input type="text" data-qright="'+j+'" maxlength="150" placeholder="Richtige Zuordnung '+(j+1)+'" value="'+h(pair[1]||'')+'">'+
   '<button type="button" class="q-iconbtn" data-qpair-delete="'+j+'" aria-label="Zuordnung entfernen" title="Paar entfernen" '+((q.pairs||[]).length<=2?'disabled':'')+'>×</button></div>').join('')+
  '<button type="button" class="secondary smallbtn" data-qpair-add="1" '+((q.pairs||[]).length>=6?'disabled':'')+'>+ Zuordnung hinzufügen</button>'+
  '<p class="small muted">Die richtige Zuordnung wird beim Test automatisch gemischt.</p></div>';
 return '<div class="q-answers">'+
  '<p class="small muted">Trage vier Antworten ein und markiere rechts '+(q.typ==='multi'?'mindestens zwei richtige Antworten.':'die eine richtige Antwort.')+'</p>'+
  Array.from({length:4},(_,j)=>'<label class="q-answer-edit"><span class="q-answer-letter">'+qLetter(j)+'</span>'+
   '<input type="text" data-qanswer="'+j+'" maxlength="220" placeholder="Antwort '+qLetter(j)+' eingeben" value="'+h(q.options?.[j]||'')+'">'+
   '<span class="q-correct-label"><input data-qcorrect="1" type="'+(q.typ==='multi'?'checkbox':'radio')+'" name="qc'+i+'" value="'+j+'" '+((q.correct||[]).includes(j)?'checked':'')+'><span>Richtig</span></span></label>').join('')+'</div>';
}
function qEditorRows(){
 return Q_ITEMS.map((q,i)=>{
  const issue=qValidity(q),open=i===Q_OPEN;
  return '<details class="q-author-card '+(issue?'q-unfinished':'q-complete')+'" data-qitem="'+i+'" '+(open?'open':'')+'>'+
   '<summary class="q-author-summary"><span class="q-number">'+String(i+1).padStart(2,'0')+'</span>'+
   '<span class="q-author-title"><strong>'+h(q.text||'Neue Frage')+'</strong><small>'+(
      q.typ==='multi'?'Mehrfachauswahl':q.typ==='tf'?'Richtig / Falsch':q.typ==='match'?'Zuordnung':'Eine richtige Antwort')+'</small></span>'+
   '<span class="q-status '+(issue?'q-status-warn':'q-status-ok')+'">'+(issue?'Unvollständig':'Fertig')+'</span></summary>'+
   '<div class="q-author-body"><div class="q-item-toolbar"><button type="button" class="smallbtn" data-qmove="-1" '+(i===0?'disabled':'')+'>↑ Hinauf</button>'+
   '<button type="button" class="smallbtn" data-qmove="1" '+(i===Q_ITEMS.length-1?'disabled':'')+'>↓ Hinunter</button>'+
   '<button type="button" class="smallbtn" data-qcopy="1">Duplizieren</button>'+
   '<button type="button" class="smallbtn q-remove" data-qdel="1">Entfernen</button></div>'+
   '<div class="q-author-fields"><label>Fragetyp<select data-qtype="'+i+'">'+
   [['single','Eine richtige Antwort'],['multi','Mehrere richtige Antworten'],['tf','Richtig / Falsch'],['match','Begriffe zuordnen']].map(a=>
    '<option value="'+a[0]+'" '+(a[0]===q.typ?'selected':'')+'>'+a[1]+'</option>').join('')+'</select></label>'+
   '<label>Fragestellung<textarea name="qtext" rows="2" maxlength="450" placeholder="Was sollen die Teilnehmer beantworten?">'+h(q.text||'')+'</textarea></label>'+
   qAnswerHtml(q,i)+'</div>'+
   (issue?'<p class="q-validation-hint"><span>!</span> '+h(issue.message)+'</p>':'')+
   '</div></details>';
 }).join('');
}
function qRepaint(){
 const el=document.getElementById('q-editor-rows');if(el)el.innerHTML=qEditorRows();
 qUpdateStats();
}
function qUpdateStats(){
 const amount=Q_ITEMS.length,ready=Q_ITEMS.filter(q=>!qValidity(q)).length;
 const total=document.getElementById('qTotal'),done=document.getElementById('qReady');
 if(total)total.textContent=String(amount);
 if(done)done.textContent=String(ready);
 const meter=document.querySelector('.q-editor-meter>span');
 if(meter)meter.style.width=(amount?Math.round(ready/amount*100):0)+'%';
}
function qEditPage(){
 const course=by(STATE.kurse,Q_EDIT),cfg=Q_META||qCfg(Q_EDIT)||{};
 const total=Q_ITEMS.length,done=Q_ITEMS.filter(q=>!qValidity(q)).length;
 return '<section class="panel q-studio"><div class="q-studio-hero"><div><p class="ga-eyebrow">QUIZ-STUDIO / AUSBILDER</p>'+
  '<h2>'+h(course?.Titel||'Kursquiz')+'</h2><p>Fragen zusammenstellen, richtige Antworten auswählen und das Quiz vor der Veröffentlichung testen.</p></div>'+
  '<button type="button" class="secondary" data-qback="1">← Zur Übersicht</button></div>'+
  '<form data-form="quizSave" data-course="'+h(Q_EDIT)+'">'+
  '<section class="q-studio-settings"><div class="q-studio-settings-top"><h3>Quiz-Einstellungen</h3><span class="tag blue">Nur nach bestätigter Teilnahme</span></div>'+
  '<div class="q-checkboxes"><label class="inline-check"><input type="checkbox" name="Aktiv" value="JA" '+(cfg.Aktiv==='JA'?'checked':'')+'> Quiz für den Kurs aktivieren</label>'+
  '<label class="inline-check"><input type="checkbox" name="Pflicht" value="JA" '+(cfg.Pflicht==='JA'?'checked':'')+'> Zum Abschluss verpflichtend</label></div>'+
  '<div class="q-setting-grid"><label>Bestehensgrenze (%)<input name="Bestehensgrenze" type="number" min="50" max="100" required value="'+h(cfg.Bestehensgrenze??80)+'"></label>'+
  '<label>Versuche<input name="MaxVersuche" type="number" min="1" max="10" required value="'+h(cfg.MaxVersuche??3)+'"></label>'+
  '<label>Zeitlimit in Minuten<input name="ZeitlimitMinuten" type="number" min="0" max="120" required value="'+h(cfg.ZeitlimitMinuten??0)+'"></label></div></section>'+
  '<div class="q-editor-head"><div><h3>Fragenkatalog <span class="q-count" id="qTotal">'+total+'</span></h3>'+
  '<p><span id="qReady">'+done+'</span> von '+total+' Fragen vollständig</p></div>'+
  '<div class="q-editor-actions"><button type="button" class="secondary" data-qadd="1" '+(total>=20?'disabled':'')+'>+ Frage hinzufügen</button>'+
  '<button type="button" class="secondary" data-qbackup="1">Entwurf exportieren</button>'+ 
  '<button type="button" class="secondary" data-qimport="1">Entwurf importieren</button>'+ 
  ((/brandsicherheitswach|\bbsw\b/i).test(String(course?.Titel||''))?'<button type="button" class="primary" data-qbsw-template="1">🚒 13 BSW-Fragen laden</button>':'')+
  (Q_TEMPLATE_BACKUP?.courseId===Q_EDIT?'<button type="button" class="secondary" data-qbsw-undo="1">Vorlage rückgängig</button>':'')+
  '<input id="gaQuizDraftImport" type="file" accept="application/json,.json" data-quiz-import-file hidden></div></div>'+
  '<div class="q-editor-meter"><span style="width:'+(total?Math.round(done/total*100):0)+'%"></span></div>'+
  '<p class="q-draft-note"><span>●</span> Der Entwurf wird während dieser Browser-Sitzung automatisch zwischengespeichert. Exportiere ihn zusätzlich, wenn du später auf einem anderen Gerät weitermachen möchtest.</p>'+
  '<div id="q-editor-rows" class="q-editor-list">'+qEditorRows()+'</div>'+
  '<div class="q-studio-footer"><button type="button" class="secondary" data-qpreview="1"> <span>▷</span> Quiz testen – ohne Speicherung</button>'+
  '<button type="submit" class="primary">Quiz speichern und übernehmen</button></div>'+
  '<p class="small muted">Die Testvorschau verändert keine Teilnehmerdaten und verbraucht keine Versuche. Nach dem Speichern wird die aktive Quizversion gemäß den Einstellungen aktualisiert.</p></form></section>';
}
function qPreviewPage(){
 const course=by(STATE.kurse,Q_EDIT);
 const answers=Q_PREVIEW_ANSWERS||[];
 const result=Q_PREVIEW_RESULT;
 const content=Q_ITEMS.map((q,i)=>{
  const selected=answers[i];
  const correctLabel=q.typ==='match'?(q.pairs||[]).map(p=>p[0]+' → '+p[1]).join('; '):
   (q.correct||[]).map(j=>q.typ==='tf'?(j===0?'Richtig':'Falsch'):q.options?.[j]).join(', ');
  const choices=q.typ==='match'?'<div class="q-preview-matches">'+q.pairs.map((pair,j)=>
   '<label>'+h(pair[0])+'<select name="pm'+i+'_'+j+'" '+(result?'disabled':'required')+'><option value="">Bitte zuordnen</option>'+
    q.pairs.map((p,k)=>'<option value="'+k+'" '+(selected?.[j]===k?'selected':'')+'>'+h(p[1])+'</option>').reverse().join('')+'</select></label>').join('')+'</div>':
   (q.typ==='tf'?['Richtig','Falsch']:q.options).map((t,j)=>
    '<label class="q-preview-choice"><input name="pa'+i+'" type="'+(q.typ==='multi'?'checkbox':'radio')+'" value="'+j+'" '+
    ((Array.isArray(selected)?selected.includes(j):selected===j)?'checked':'')+' '+(result?'disabled':'')+'> '+h(t)+'</label>').join('');
  const hit=result?.details?.[i];
  return '<section class="q-preview-question"><div class="row between"><span>Frage '+(i+1)+' / '+Q_ITEMS.length+'</span>'+
   (result?'<span class="tag '+(hit?'ok':'bad')+'">'+(hit?'Richtig':'Falsch')+'</span>':'')+'</div>'+
   '<h3>'+h(q.text)+'</h3>'+choices+
   (result?'<p class="q-solution"><b>Richtige Lösung:</b> '+h(correctLabel)+'</p>':'')+'</section>';
 }).join('');
 return '<section class="panel q-studio"><div class="q-studio-hero"><div><p class="ga-eyebrow">LOKALER PROBELAUF</p>'+
  '<h2>'+h(course?.Titel||'Wissenstest')+'</h2><p>Du siehst das Quiz aus Sicht eines Teilnehmers. Das Ergebnis wird nur hier im Browser berechnet.</p></div>'+
  '<button type="button" class="secondary" data-qpreview-back="1">← Editor</button></div>'+
  (result?'<div class="q-preview-result"><span>Testergebnis</span><strong>'+result.percent+' %</strong>'+
   '<p>'+result.correct+' von '+Q_ITEMS.length+' Fragen richtig – '+(result.passed?'Bestanden':'Noch nicht bestanden')+' (Grenze: '+result.limit+' %)</p></div>':
   '<p class="q-draft-note">Dies ist eine Vorschau. Keine Eintragung in Teilnehmerlisten, keine Quizversuche, keine Änderung am gespeicherten Kurs.</p>')+
  '<form data-form="quizPreview">'+content+
  '<div class="q-studio-footer">'+(result?'<button type="button" class="secondary" data-qpreview-again="1">Erneut testen</button>':
   '<button type="submit" class="primary">Test auswerten</button>')+
  '<button type="button" class="secondary" data-qpreview-back="1">Zur Bearbeitung</button></div></form></section>';
}
function qPreviewSubmit(form){
 const answers=Q_ITEMS.map((q,i)=>{
  if(q.typ==='match'){
   const values=q.pairs.map((_,j)=>form.querySelector('[name="pm'+i+'_'+j+'"]')?.value||'');
   if(values.some(x=>x===''))throw new Error('Bitte Frage '+(i+1)+' vollständig beantworten.');
   return values.map(Number);
  }
  const selected=Array.from(form.querySelectorAll('[name="pa'+i+'"]:checked')).map(x=>Number(x.value));
  if(!selected.length)throw new Error('Bitte Frage '+(i+1)+' beantworten.');
  return q.typ==='multi'?selected:selected[0];
 });
 const details=Q_ITEMS.map((q,i)=>{
  const answer=answers[i];
  if(q.typ==='match')return answer.every((v,j)=>v===j);
  if(q.typ==='multi')return [...answer].sort((a,b)=>a-b).join(',')===[...(q.correct||[])].sort((a,b)=>a-b).join(',');
  return answer===(q.correct||[])[0];
 });
 const correct=details.filter(Boolean).length;
 const setting=document.querySelector('[name="Bestehensgrenze"]'); // unavailable in preview; use saved temporary settings
 const limit=Number(Q_PREVIEW_LIMIT)||80;
 Q_PREVIEW_ANSWERS=answers;
 Q_PREVIEW_RESULT={details,correct,percent:Math.round(correct/Q_ITEMS.length*100),limit,passed:Math.round(correct/Q_ITEMS.length*100)>=limit};
 render();
}

function qAdmin(){
 if(Q_EDIT)return Q_PREVIEW?qPreviewPage():qEditPage();
 const courses=(STATE.kurse||[]).filter(c=>c.Aktiv==='JA');
 const cards=courses.map(c=>{
  const cfg=qCfg(c.ID),enabled=cfg?.Aktiv==='JA';
  return '<article class="ga-project-card"><div class="row between"><div><b>'+h(c.Titel)+'</b><div class="detail">'+h(c.Bereich)+'</div></div>'+
  '<span class="tag '+(enabled?'ok':'blue')+'">'+(enabled?(cfg.Pflicht==='JA'?'Pflichtquiz':'Freiwilliges Quiz'):'Kein Quiz')+'</span></div>'+
  (enabled?'<p class="small muted">'+h(cfg.FrageAnzahl)+' Fragen · Bestehen ab '+h(cfg.Bestehensgrenze)+' %</p>':'')+
  '<div class="btnline"><button class="primary" type="button" data-qedit="'+h(c.ID)+'">'+(cfg?'Quiz bearbeiten':'Quiz erstellen')+'</button></div></article>';
 }).join('');
 const recent=(STATE.quizVersuche||[]).filter(a=>a.Status==='Abgegeben').slice().reverse().slice(0,30);
 return '<div class="ga-review-banner"><div><p class="ga-eyebrow">AUSBILDUNGSMODULE</p><h2>Quizverwaltung</h2><p>Wissenstests je Kurs verwalten und prüfen.</p></div></div>'+
 '<section class="panel"><h2>Veröffentlichte Kurse</h2><div class="ga-project-list">'+(cards||'<p class="muted">Noch keine Kurse vorhanden.</p>')+'</div></section>'+
 '<details class="ga-member-fold"><summary><span>Ergebnisse und Versuche</span><span class="tag blue">'+recent.length+'</span></summary><div class="ga-fold-body">'+
 (recent.length?recent.map(a=>{const course=by(STATE.kurse,a.KursID),member=by(STATE.mitglieder,a.MitgliedID);
 return '<div class="ga-course-row"><div><b>'+h(course?.Titel||'Kurs')+'</b><p class="small muted">'+h(member?name(member):'Teilnehmer')+' · Versuch '+h(a.Versuch)+' · '+dt(a.AbgegebenAm)+'</p></div>'+
 '<span class="tag '+(a.Bestanden==='JA'?'ok':'bad')+'">'+h(a.Prozent)+' %</span>'+
 (a.Bestanden==='JA'?'':'<button type="button" class="smallbtn" data-qunlock="'+h(a.KursID)+'|'+h(a.MitgliedID)+'">Zusatzversuch freigeben</button>')+'</div>'}).join(''):'<p class="muted">Noch keine Ergebnisse.</p>')+'</div></details>';
}
function qExam(){
 const s=Q_SESSION;
 return '<section class="panel ga-quiz-exam"><div class="row between"><div><p class="ga-eyebrow">WISSENSÜBERPRÜFUNG</p><h2>Quiz beantworten</h2></div>'+
 '<span class="tag warn">Versuch '+h(s.Versuch)+' / '+h(s.MaxVersuche)+'</span></div>'+
 '<p class="muted">'+(s.ZeitlimitMinuten?'Zeitlimit: '+h(s.ZeitlimitMinuten)+' Minuten ab Start.':'Kein Zeitlimit.')+' Alle Fragen beantworten und dann abgeben.</p>'+
 '<form data-form="quizAttempt">'+s.Fragen.map((q,i)=>{
 let content='';
 if(q.typ==='match'){const options=q.right.map(v=>'<option value="'+h(v.id)+'">'+h(v.text)+'</option>').join('');
   content=q.left.map((label,j)=>'<label>'+h(label)+'<select name="qm'+i+'_'+j+'" required><option value="">Zuordnen</option>'+options+'</select></label>').join('');
 }else{content=q.options.map((label,j)=>'<label class="q-answer"><input type="'+(q.typ==='multi'?'checkbox':'radio')+'" name="qa'+i+'" value="'+j+'"> '+h(label)+'</label>').join('');}
 return '<div class="ga-q-card"><b>Frage '+(i+1)+' von '+s.Fragen.length+'</b><h3>'+h(q.text)+'</h3>'+content+'</div>';
 }).join('')+'<div class="btnline"><button class="primary" type="submit">Antworten abgeben</button></div></form></section>';
}
function qParticipant(){
 if(Q_SESSION)return qExam();
 const assigned=new Set((STATE.kurse||[]).map(c=>c.ID));
 const quizzes=(STATE.quizKurse||[]).filter(c=>c.Aktiv==='JA'&&assigned.has(c.KursID));
 const cards=quizzes.map(q=>{
  const course=by(STATE.kurse,q.KursID);
  const eligible=(STATE.teilnahmen||[]).some(a=>STATE.meMember&&a.MitgliedID===STATE.meMember.ID&&a.Anwesend==='JA'&&(STATE.termine||[]).some(t=>
    t.ID===a.TerminID&&t.KursID===q.KursID&&t.Status==='Durchgeführt'));
  const attempts=(STATE.quizVersuche||[]).filter(a=>STATE.meMember&&a.MitgliedID===STATE.meMember.ID&&a.KursID===q.KursID&&String(a.QuizVersion)===String(q.Version));
  const passed=attempts.some(a=>a.Bestanden==='JA'),started=attempts.some(a=>a.Status==='In Bearbeitung');
  const last=attempts.filter(a=>a.Status==='Abgegeben').slice(-1)[0];
  const extra=(STATE.quizFreigaben||[]).filter(u=>STATE.meMember&&u.MitgliedID===STATE.meMember.ID&&u.KursID===q.KursID&&String(u.QuizVersion)===String(q.Version)).reduce((n,u)=>n+Number(u.ZusatzVersuche||0),0);
  const courseStatus=qCourseStatus(q.KursID,STATE.meMember?.ID,STATE.meMember?.TurnusID);
  return '<article class="ga-project-card"><div class="row between"><div><b>'+h(course?.Titel||'Kurs')+'</b>'+
   '<div class="detail">'+h(q.FrageAnzahl)+' Fragen · Bestehensgrenze '+h(q.Bestehensgrenze)+' %</div></div>'+
   '<span class="tag '+(passed?'ok':eligible?'warn':'blue')+'">'+(passed?(q.Pflicht==='JA'?'Pflichtquiz bestanden':'Freiwilliges Quiz bestanden'):!eligible?'Noch gesperrt':q.Pflicht==='JA'?'Pflichtquiz':'Freiwilliges Quiz')+'</span></div>'+
   (last?'<p>Letztes Ergebnis: <b>'+h(last.Prozent)+' %</b></p>':'')+
  (courseStatus.attended?'<p class="q-course-status">'+qCourseBadge(q.KursID,STATE.meMember?.ID,STATE.meMember?.TurnusID)+'</p>':'')+
   (passed?'<p class="muted small">Dein Ergebnis wurde gespeichert.</p>':!eligible?'<p class="muted small">Nach bestätigter Kursteilnahme verfügbar.</p>':
   attempts.length<Number(q.MaxVersuche)+extra?'<div class="btnline"><button class="primary" type="button" data-qstart="'+h(q.KursID)+'">'+(started?'Fortsetzen':'Quiz starten')+'</button></div>':
   '<p class="muted small">Maximale Versuche erreicht. Ausbilder kontaktieren.</p>')+'</article>';
 }).join('');
 const result=Q_RESULT?'<div class="ga-q-result"><h2>'+ (Q_RESULT.Bestanden?'Bestanden!':'Nicht bestanden')+'</h2>'+
 '<strong>'+h(Q_RESULT.Prozent)+' %</strong><p>'+h(Q_RESULT.Punkte)+' von '+h(Q_RESULT.MaxPunkte)+' Fragen richtig. Mindestwert: '+h(Q_RESULT.Bestehensgrenze)+' %.</p>'+
 '<p>'+(Q_RESULT.Bestanden?'Dein Abschluss wurde gespeichert.':'Verbleibende Versuche: '+h(Q_RESULT.VersucheVerbleibend))+'</p>'+
 '<button type="button" class="secondary" data-qresult-close="1">Schließen</button></div>':'';
 return '<div class="ga-review-banner"><div><p class="ga-eyebrow">NACH DEM KURS</p><h2>Meine Wissenstests</h2>'+
 '<p>Fragen beantworten und den Lernfortschritt überprüfen.</p></div></div>'+result+
 '<section class="panel"><h2>Wissenstests</h2><div class="ga-project-list">'+(cards||'<div class="ga-empty">Für deine Kurse sind noch keine Quiz freigeschaltet.</div>')+'</div></section>';
}
function quizPage(){if(!Array.isArray(STATE?.quizKurse))return '<section class="panel"><h2>Quizfunktion vorbereiten</h2><p>GitHub Pages ist aktualisiert. Für Quizspeicherung und automatische Auswertung muss die neue Code.gs im bestehenden Google Apps Script bereitgestellt werden. Danach im Tabellenmenü <b>Grundausbildung → Tabellen prüfen/erstellen</b> ausführen.</p></section>';return VIEW==='myquiz'||role()==='Teilnehmer'?qParticipant():qAdmin();}

function qCurrentMeta(form){
 const fd=new FormData(form);
 return {...(Q_META||qCfg(Q_EDIT)||{}),
  Aktiv:fd.has('Aktiv')?'JA':'NEIN',Pflicht:fd.has('Pflicht')?'JA':'NEIN',
  Bestehensgrenze:Number(fd.get('Bestehensgrenze')||80),
  MaxVersuche:Number(fd.get('MaxVersuche')||3),
  ZeitlimitMinuten:Number(fd.get('ZeitlimitMinuten')||0)};
}
async function qOpenEditor(id){
 const course=by(STATE.kurse,id);
 if(!course)return tip('Kurs nicht gefunden.',true);
 Q_EDIT=id;Q_META=null;Q_ITEMS=[qNew()];Q_OPEN=0;Q_TEMPLATE_BACKUP=null;Q_PREVIEW=false;Q_PREVIEW_RESULT=null;Q_PREVIEW_ANSWERS=null;
 VIEW='quizzes';render();
 try{
  const saved=await api('getQuizEdit',{KursID:id});
  if(Q_EDIT!==id)return;
  Q_META=saved||qCfg(id)||{};
  Q_ITEMS=saved?.Fragen?.length?saved.Fragen:[qNew()];
  const draft=qGetDraft(id);
  if(draft&&draft.saved&&draft.saved>Date.now()-14*86400000){
   Q_ITEMS=draft.items;Q_META={...Q_META,...draft.meta};
   tip('Dein zwischengespeicherter Quiz-Entwurf wurde wiederhergestellt.');
  }
  render();
 }catch(error){
  const draft=qGetDraft(id);
  if(draft){Q_ITEMS=draft.items;Q_META=draft.meta;render();tip('Server derzeit nicht erreichbar. Lokaler Entwurf geöffnet.',true);}
  else{Q_EDIT='';render();tip(error.message,true);}
 }
}
async function qSave(form,fd){
 qCapture();
 qValidateBeforeSave();
 const meta=qCurrentMeta(form);
 const payload={KursID:form.dataset.course,Aktiv:meta.Aktiv,Pflicht:meta.Pflicht,
  Bestehensgrenze:meta.Bestehensgrenze,MaxVersuche:meta.MaxVersuche,
  ZeitlimitMinuten:meta.ZeitlimitMinuten,Fragen:Q_ITEMS};
 const response=await api('saveQuiz',payload);
 qClearDraft(Q_EDIT);Q_EDIT='';Q_META=null;Q_ITEMS=[];Q_TEMPLATE_BACKUP=null;
 Q_PREVIEW=false;Q_PREVIEW_RESULT=null;
 tip(response.message||'Quiz gespeichert.');
 await reload();
}
function qLocalExport(){
 qCapture();
 const meta=qCurrentMeta(document.querySelector('form[data-form="quizSave"]'));
 const data=JSON.stringify({format:'ga-quiz-draft',version:2,kursId:Q_EDIT,exportiert:new Date().toISOString(),meta,fragen:Q_ITEMS},null,2);
 const blob=new Blob([data],{type:'application/json;charset=utf-8'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='quiz-entwurf-'+String(Q_EDIT||'kurs').replace(/[^a-zA-Z0-9_-]/g,'')+'.json';
 document.body.appendChild(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),2500);
 tip('Quiz-Entwurf als JSON gesichert.');
}
/**
 * Einmaliger BSW-Vorlagenpatch: lädt nur Quizfragen vom selben GitHub-Pages-Ursprung.
 * Speichert niemals automatisch in Google Sheets und verändert keine Live-Teilnahmen.
 */
async function qLoadBswTemplate(){
 const course=by(STATE.kurse,Q_EDIT);
 if(!course||!/(brandsicherheitswach|\bbsw\b)/i.test(String(course.Titel||'')))
  throw new Error('Die BSW-Vorlage ist nur für das Modul Brandsicherheitswachen gedacht.');
 const response=await fetch('./bsw-quiz-vorlage.json',{cache:'no-store'});
 if(!response.ok)throw new Error('BSW-Vorlage konnte nicht geladen werden. Bitte Internetverbindung und GitHub-Veröffentlichung prüfen.');
 const template=await response.json();
 if(template?.format!=='ga-quiz-draft'||!Array.isArray(template.fragen)||template.fragen.length!==13)
  throw new Error('Die BSW-Vorlagendatei ist beschädigt oder unvollständig.');
 const invalid=template.fragen.findIndex(q=>qValidity(q));
 if(invalid>=0)throw new Error('Die BSW-Vorlage enthält in Frage '+(invalid+1)+' einen Fehler.');
 qCapture();
 if(!confirm('13 vorbereitete BSW-Fragen laden? Der aktuelle Entwurf wird im Editor ersetzt. Das gespeicherte Kursquiz bleibt bis zu deinem Klick auf „Quiz speichern“ unverändert.'))return;
 Q_TEMPLATE_BACKUP={courseId:Q_EDIT,items:JSON.parse(JSON.stringify(Q_ITEMS)),meta:{...Q_META}};
 Q_ITEMS=template.fragen.map(q=>JSON.parse(JSON.stringify(q)));
 Q_OPEN=0;qAutoDraft();render();
 tip('13 BSW-Fragen geladen. Bitte durchsehen, mit „Quiz testen“ prüfen und dann speichern.');
}
function qUndoBswTemplate(){
 if(!Q_TEMPLATE_BACKUP||Q_TEMPLATE_BACKUP.courseId!==Q_EDIT)return;
 if(!confirm('Wieder den Entwurf vor dem Laden der BSW-Vorlage anzeigen?'))return;
 Q_ITEMS=Q_TEMPLATE_BACKUP.items;Q_META=Q_TEMPLATE_BACKUP.meta;
 Q_TEMPLATE_BACKUP=null;Q_OPEN=0;qAutoDraft();render();
 tip('Vorheriger Entwurf wurde wiederhergestellt.');
}

async function qLocalImport(file){
 if(!file)return;
 if(file.size>100000)throw new Error('Die Entwurfsdatei ist zu groß.');
 const parsed=JSON.parse(await file.text());
 if(parsed?.format!=='ga-quiz-draft'||!Array.isArray(parsed.fragen)||!parsed.fragen.length||parsed.fragen.length>20)
  throw new Error('Keine gültige Quiz-Entwurfsdatei.');
 if(parsed.kursId!==Q_EDIT&&!confirm('Dieser Entwurf gehört zu einem anderen Kurs. Trotzdem importieren?'))return;
 qCapture();
 if(!confirm('Aktuellen ungespeicherten Entwurf durch die importierten Fragen ersetzen?'))return;
 Q_ITEMS=parsed.fragen;Q_META={...Q_META,...parsed.meta};
 Q_OPEN=0;qAutoDraft();render();tip(parsed.fragen.length+' Fragen aus Entwurf geladen.');
}
function qGoPreview(){
 qCapture();
 qValidateBeforeSave();
 const form=document.querySelector('form[data-form="quizSave"]');
 const meta=qCurrentMeta(form);
 Q_PREVIEW_LIMIT=Number(meta.Bestehensgrenze)||80;
 Q_META=meta;Q_PREVIEW=true;Q_PREVIEW_RESULT=null;Q_PREVIEW_ANSWERS=null;
 qAutoDraft();render();
}
function qExitPreview(){
 Q_PREVIEW=false;Q_PREVIEW_RESULT=null;Q_PREVIEW_ANSWERS=null;
 render();
}

async function qStart(id){
 Q_SESSION=await api('startQuiz',{KursID:id});Q_RESULT=null;VIEW='myquiz';render();
}
async function qSubmit(form){
 const answer=Q_SESSION.Fragen.map((q,i)=>{
  if(q.typ==='match'){
   const values=q.left.map((_,j)=>form.querySelector('[name="qm'+i+'_'+j+'"]')?.value||'');
   if(values.some(v=>v===''))throw Error('Bitte Frage '+(i+1)+' vollständig beantworten.');
   return values;
  }
  const selected=Array.from(form.querySelectorAll('[name="qa'+i+'"]:checked')).map(x=>Number(x.value));
  if(!selected.length)throw Error('Bitte Frage '+(i+1)+' beantworten.');
  return q.typ==='multi'?selected:selected[0];
 });
 if(!confirm('Antworten endgültig abgeben?'))return;
 const result=await api('submitQuiz',{VersuchID:Q_SESSION.VersuchID,Antworten:answer});
 Q_SESSION=null;Q_RESULT=result;await reload();
}

document.getElementById('app')?.addEventListener('submit',event=>{
 const form=event.target.closest('form[data-form="quizPreview"]');
 if(!form)return;
 event.preventDefault();
 try{qPreviewSubmit(form);}catch(error){tip(error.message,true);}
});
document.getElementById('app')?.addEventListener('click',async event=>{
 const x=event.target.closest(
  '[data-qedit],[data-qback],[data-qadd],[data-qdel],[data-qmove],[data-qcopy],'+
  '[data-qpair-add],[data-qpair-delete],[data-qpreview],[data-qpreview-back],[data-qpreview-again],'+
  '[data-qbackup],[data-qimport],[data-qbsw-template],[data-qbsw-undo],[data-qstart],[data-qresult-close],[data-course-quiz],[data-qunlock]');
 if(!x)return;
 if(x.dataset.qresultClose!==undefined){Q_RESULT=null;render();return;}
 if(x.dataset.qpreviewBack!==undefined){qExitPreview();return;}
 if(x.dataset.qpreviewAgain!==undefined){Q_PREVIEW_RESULT=null;Q_PREVIEW_ANSWERS=null;render();return;}
 if(x.dataset.qback!==undefined){
  qCapture();
  if(Q_ITEMS.some(q=>q.text||q.options?.some(Boolean)||q.pairs?.some(p=>p[0]||p[1]))&&!confirm('Editor verlassen? Der Entwurf ist nur in diesem Browser zwischengespeichert.'))return;
  Q_EDIT='';Q_META=null;Q_ITEMS=[];Q_PREVIEW=false;render();return;
 }
 if(x.dataset.qpreview!==undefined){try{qGoPreview();}catch(e){tip(e.message,true);}return;}
 if(x.dataset.qbackup!==undefined){try{qLocalExport();}catch(e){tip(e.message,true);}return;}
 if(x.dataset.qimport!==undefined){document.getElementById('gaQuizDraftImport')?.click();return;}
 if(x.dataset.qbswUndo!==undefined){qUndoBswTemplate();return;}
 if(x.dataset.qbswTemplate!==undefined){x.disabled=true;try{await qLoadBswTemplate();}catch(error){tip(error.message,true);}finally{x.disabled=false;}return;}
 if(x.dataset.qedit||x.dataset.courseQuiz){await qOpenEditor(x.dataset.qedit||x.dataset.courseQuiz);return;}
 const card=x.closest('[data-qitem]');
 if(card){
  qCapture();
  const i=Number(card.dataset.qitem),q=Q_ITEMS[i];
  Q_OPEN=i;
  if(x.dataset.qdel!==undefined){
   if(Q_ITEMS.length<=1)return tip('Mindestens eine Quizfrage muss bestehen bleiben.',true);
   if(!confirm('Frage '+(i+1)+' entfernen?'))return;
   Q_ITEMS.splice(i,1);Q_OPEN=Math.max(0,Math.min(i,Q_ITEMS.length-1));
  }else if(x.dataset.qmove!==undefined){
   const at=i+Number(x.dataset.qmove);
   if(at>=0&&at<Q_ITEMS.length)[Q_ITEMS[i],Q_ITEMS[at]]=[Q_ITEMS[at],Q_ITEMS[i]];
   Q_OPEN=Math.max(0,Math.min(at,Q_ITEMS.length-1));
  }else if(x.dataset.qcopy!==undefined){
   if(Q_ITEMS.length>=20)return tip('Maximal 20 Fragen.',true);
   Q_ITEMS.splice(i+1,0,JSON.parse(JSON.stringify(q)));Q_OPEN=i+1;
  }else if(x.dataset.qpairAdd!==undefined){
   if(q.typ!=='match'||q.pairs.length>=6)return;
   q.pairs.push(['','']);
  }else if(x.dataset.qpairDelete!==undefined){
   if(q.typ!=='match'||q.pairs.length<=2)return;
   q.pairs.splice(Number(x.dataset.qpairDelete),1);
  }
  qAutoDraft();qRepaint();return;
 }
 if(x.dataset.qadd!==undefined){
  qCapture();if(Q_ITEMS.length>=20)return tip('Maximal 20 Fragen.',true);
  Q_ITEMS.push(qNew());Q_OPEN=Q_ITEMS.length-1;qAutoDraft();qRepaint();return;
 }
 if(x.dataset.qunlock){
  const [KursID,MitgliedID]=x.dataset.qunlock.split('|');
  if(!confirm('Einen zusätzlichen Quizversuch für dieses Mitglied freigeben?'))return;
  x.disabled=true;
  try{const r=await api('unlockQuiz',{KursID,MitgliedID});tip(r.message);await reload();}
  catch(error){tip(error.message,true);}
  finally{x.disabled=false;}
  return;
 }
 if(x.dataset.qstart){
  x.disabled=true;
  try{await qStart(x.dataset.qstart);}catch(error){tip(error.message,true);x.disabled=false;}
 }
});
document.getElementById('app')?.addEventListener('input',event=>{
 const field=event.target.closest('[data-qitem] input, [data-qitem] textarea, .q-studio-settings input');
 if(!field||!Q_EDIT||Q_PREVIEW)return;
 const card=field.closest('[data-qitem]');
 if(card)Q_OPEN=Number(card.dataset.qitem);
 qCapture();qUpdateStats();
});
document.getElementById('app')?.addEventListener('change',event=>{
 const el=event.target.closest('[data-qtype]');
 if(el){
  qCapture();const i=Number(el.closest('[data-qitem]').dataset.qitem);
  const previous=Q_ITEMS[i],fresh=qNew(el.value);
  Q_ITEMS[i]={...fresh,text:previous?.text||''};
  Q_OPEN=i;qAutoDraft();qRepaint();return;
 }
 const file=event.target.closest('[data-quiz-import-file]');
 if(file){qLocalImport(file.files?.[0]).catch(e=>tip(e.message,true));}
});
