/* Grundausbildung V1.6 · Quiz-Verwaltung und Wissenstests */
'use strict';
let Q_EDIT='',Q_META=null,Q_ITEMS=[],Q_SESSION=null,Q_RESULT=null;
const qCfg=id=>(STATE.quizKurse||[]).find(q=>q.KursID===id);
const qNew=(typ='single')=>({typ,text:'',options:['','','',''],correct:[0],pairs:[['',''],['','']]});
function qEditorRows(){
 return Q_ITEMS.map((q,i)=>'<div class="q-editor-item" data-qitem="'+i+'">'+
 '<div class="row between"><b>Frage '+(i+1)+'</b><button type="button" class="smallbtn" data-qdel="'+i+'">Entfernen</button></div>'+
 '<label>Fragetyp</label><select data-qtype="'+i+'">'+[['single','Eine richtige Antwort'],['multi','Mehrere richtige Antworten'],['tf','Richtig/Falsch'],['match','Begriffe zuordnen']].map(a=>'<option value="'+a[0]+'" '+(a[0]===q.typ?'selected':'')+'>'+a[1]+'</option>').join('')+'</select>'+
 '<label>Frage</label><input name="qtext" maxlength="450" required value="'+h(q.text||'')+'">'+
 (q.typ==='match'?'<label>Zuordnungspaare, pro Zeile: Begriff | Zuordnung</label><textarea rows="4" name="qpairs">'+h((q.pairs||[]).map(p=>p.join(' | ')).join('\n'))+'</textarea>':
 q.typ==='tf'?'<label>Richtige Lösung</label><select name="qtf"><option value="0" '+(q.correct?.[0]===0?'selected':'')+'>Richtig</option><option value="1" '+(q.correct?.[0]===1?'selected':'')+'>Falsch</option></select>':
 '<label>Vier Antwortmöglichkeiten (alle erforderlich, eine je Zeile)</label><textarea name="qoptions" rows="4" placeholder="Antwort 1&#10;Antwort 2&#10;Antwort 3&#10;Antwort 4">'+h((q.options||[]).join('\n'))+'</textarea>'+
 '<label>Richtige Antwortnummern (1–4'+(q.typ==='multi'?', z. B. 1,3':'')+')</label><input name="qcorrect" value="'+h((q.correct||[0]).map(n=>Number(n)+1).join(','))+'">')+
 '</div>').join('');
}
function qCapture(){
 const root=document.getElementById('q-editor-rows');if(!root)return;
 Q_ITEMS=Array.from(root.querySelectorAll('[data-qitem]')).map(el=>{
  const typ=Q_ITEMS[Number(el.dataset.qitem)]?.typ||el.querySelector('[data-qtype]').value,text=el.querySelector('[name=qtext]').value;
  if(typ==='match')return {typ,text,pairs:el.querySelector('[name=qpairs]').value.split('\n').map(s=>s.trim()).filter(Boolean).map(s=>{let i=s.indexOf('|');return i<0?[s,'']:[s.slice(0,i).trim(),s.slice(i+1).trim()]})};
  if(typ==='tf')return {typ,text,correct:[Number(el.querySelector('[name=qtf]').value)]};
  return {typ,text,options:el.querySelector('[name=qoptions]').value.split('\n').map(x=>x.trim()),
    correct:el.querySelector('[name=qcorrect]').value.split(',').map(n=>Number(n.trim())-1)};
 });
}

/** Clear inline validation: server requires exactly four filled options for selection questions. */
function qValidateBeforeSave(){
 if(!Q_ITEMS.length)throw new Error('Bitte mindestens eine Quizfrage anlegen.');
 const focus=(i,field)=>{
  const el=document.querySelector('[data-qitem="'+i+'"] [name="'+field+'"]');
  if(el){el.focus();el.scrollIntoView({block:'center',behavior:'smooth'});}
 };
 for(let i=0;i<Q_ITEMS.length;i++){
  const q=Q_ITEMS[i],number=i+1;
  if(!String(q.text||'').trim()){focus(i,'qtext');throw new Error('Frage '+number+': Bitte eine Fragestellung eintragen.');}
  if(q.typ==='match'){
   const pairs=q.pairs||[];
   if(pairs.length<2||pairs.length>6||pairs.some(p=>!p[0]||!p[1])){
    focus(i,'qpairs');throw new Error('Frage '+number+': Bitte 2 bis 6 vollständige Zuordnungspaare im Format „Begriff | Antwort“ eintragen.');
   }
  }else if(q.typ==='single'||q.typ==='multi'){
   const options=q.options||[];
   if(options.length!==4){focus(i,'qoptions');throw new Error('Frage '+number+': Es sind genau vier Antwortmöglichkeiten erforderlich, jeweils eine pro Zeile. Derzeit: '+options.length+'.');}
   const missing=options.findIndex(o=>!String(o).trim());
   if(missing!==-1){focus(i,'qoptions');throw new Error('Frage '+number+': Antwortmöglichkeit '+(missing+1)+' ist leer. Bitte alle vier Antworten ausfüllen.');}
   if(new Set(options.map(o=>o.toLowerCase())).size!==4){focus(i,'qoptions');throw new Error('Frage '+number+': Alle vier Antwortmöglichkeiten müssen unterschiedlich sein.');}
   const answers=q.correct||[];
   if(!answers.length||answers.some(n=>!Number.isInteger(n)||n<0||n>3)||new Set(answers).size!==answers.length){
    focus(i,'qcorrect');throw new Error('Frage '+number+': Bitte die Nummer der richtigen Antwort angeben (1–4).');
   }
   if(q.typ==='single'&&answers.length!==1){focus(i,'qcorrect');throw new Error('Frage '+number+': Genau eine Antwortnummer ist richtig.');}
   if(q.typ==='multi'&&answers.length<2){focus(i,'qcorrect');throw new Error('Frage '+number+': Bei Mehrfachauswahl bitte mindestens zwei richtige Antwortnummern angeben, z. B. 1,3.');}
  }
 }
}

function qRepaint(){const el=document.getElementById('q-editor-rows');if(el)el.innerHTML=qEditorRows();}
function qEditPage(){
 const course=by(STATE.kurse,Q_EDIT),c=Q_META||qCfg(Q_EDIT)||{};
 return '<section class="panel"><div class="row between"><div><p class="ga-eyebrow">KURSQUIZ</p><h2>'+h(course?.Titel||'Quiz')+'</h2></div>'+
 '<button type="button" class="secondary" data-qback="1">Zurück</button></div>'+
 '<p class="muted">Für diesen Kurs einen Wissenstest erstellen. Bei Pflichtquiz wird der Kurs erst mit bestätigter Teilnahme und bestandenem Quiz abgeschlossen.</p>'+
 '<form data-form="quizSave" data-course="'+h(Q_EDIT)+'">'+
 '<div class="ga-quiz-config"><label class="inline-check"><input type="checkbox" name="Aktiv" value="JA" '+(c.Aktiv==='JA'?'checked':'')+'> Quiz aktivieren</label>'+
 '<label class="inline-check"><input type="checkbox" name="Pflicht" value="JA" '+(c.Pflicht==='JA'?'checked':'')+'> Für Kursabschluss verpflichtend</label>'+
 '<div class="grid"><div><label>Bestehensgrenze (%)</label><input type="number" name="Bestehensgrenze" min="50" max="100" required value="'+h(c.Bestehensgrenze??80)+'"></div>'+
 '<div><label>Maximale Versuche</label><input type="number" name="MaxVersuche" min="1" max="10" required value="'+h(c.MaxVersuche??3)+'"></div>'+
 '<div><label>Zeitlimit in Minuten (0 = ohne)</label><input type="number" name="ZeitlimitMinuten" min="0" max="120" required value="'+h(c.ZeitlimitMinuten??0)+'"></div></div></div>'+
 '<div class="row between"><h3>Fragenkatalog</h3><button type="button" class="secondary" data-qadd="1">+ Neue Frage</button></div>'+
 '<div id="q-editor-rows">'+qEditorRows()+'</div>'+
 '<p class="small muted">Jede vollständig richtige Frage zählt 1 Punkt. Maximal 20 Fragen. Neue Quizversionen können bei Pflichtmodulen einen erneuten Abschluss erfordern.</p>'+
 '<div class="btnline"><button class="primary" type="submit">Quiz speichern</button><button type="button" class="secondary" data-qback="1">Abbrechen</button></div></form></section>';
}
function qAdmin(){
 if(Q_EDIT)return qEditPage();
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
  return '<article class="ga-project-card"><div class="row between"><div><b>'+h(course?.Titel||'Kurs')+'</b>'+
   '<div class="detail">'+h(q.FrageAnzahl)+' Fragen · Bestehensgrenze '+h(q.Bestehensgrenze)+' %</div></div>'+
   '<span class="tag '+(passed?'ok':eligible?'warn':'blue')+'">'+(passed?'Bestanden':!eligible?'Gesperrt':q.Pflicht==='JA'?'Pflichtquiz':'Freiwillig')+'</span></div>'+
   (last?'<p>Letztes Ergebnis: <b>'+h(last.Prozent)+' %</b></p>':'')+
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
async function qOpenEditor(id){
 const c=by(STATE.kurse,id);if(!c)return tip('Kurs nicht gefunden.',true);
 Q_EDIT=id;Q_META=null;Q_ITEMS=[qNew()];VIEW='quizzes';render();
 try{const old=await api('getQuizEdit',{KursID:id});
  if(Q_EDIT!==id)return;
  if(old){Q_META=old;Q_ITEMS=Array.isArray(old.Fragen)?old.Fragen:[qNew()];}
  render();
 }catch(err){Q_EDIT='';tip(err.message,true);render();}
}
async function qSave(form,fd){
 qCapture();
 qValidateBeforeSave();
 const d={KursID:form.dataset.course,Aktiv:fd.has('Aktiv')?'JA':'NEIN',Pflicht:fd.has('Pflicht')?'JA':'NEIN',
 Bestehensgrenze:fd.get('Bestehensgrenze'),MaxVersuche:fd.get('MaxVersuche'),ZeitlimitMinuten:fd.get('ZeitlimitMinuten'),Fragen:Q_ITEMS};
 const result=await api('saveQuiz',d);
 Q_EDIT='';Q_META=null;Q_ITEMS=[];tip(result.message);await reload();
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
document.getElementById('app')?.addEventListener('click',async e=>{
 const x=e.target.closest('[data-qedit],[data-qback],[data-qadd],[data-qdel],[data-qstart],[data-qresult-close],[data-course-quiz],[data-qunlock]');
 if(!x)return;
 if(x.dataset.qadd!==undefined){qCapture();if(Q_ITEMS.length>=20)return tip('Maximal 20 Fragen möglich.',true);Q_ITEMS.push(qNew());qRepaint();return;}
 if(x.dataset.qdel!==undefined){qCapture();Q_ITEMS.splice(Number(x.dataset.qdel),1);qRepaint();return;}
 if(x.dataset.qback!==undefined){Q_EDIT='';Q_META=null;Q_ITEMS=[];render();return;}
 if(x.dataset.qresultClose!==undefined){Q_RESULT=null;render();return;}
 if(x.dataset.qedit||x.dataset.courseQuiz){await qOpenEditor(x.dataset.qedit||x.dataset.courseQuiz);return;}
 if(x.dataset.qunlock){const [KursID,MitgliedID]=x.dataset.qunlock.split('|');if(!confirm('Für dieses Mitglied einen zusätzlichen Quizversuch freigeben?'))return;
 x.disabled=true;try{const result=await api('unlockQuiz',{KursID,MitgliedID});tip(result.message);await reload();}catch(err){tip(err.message,true);}finally{x.disabled=false;}return;}
 if(x.dataset.qstart){x.disabled=true;try{await qStart(x.dataset.qstart);}catch(err){tip(err.message,true);x.disabled=false;}}
});
document.getElementById('app')?.addEventListener('change',e=>{
 const x=e.target.closest('[data-qtype]');if(!x)return;
 const i=Number(x.dataset.qtype);
 qCapture();const text=Q_ITEMS[i]?.text||'';Q_ITEMS[i]={...qNew(x.value),text};qRepaint();
});
