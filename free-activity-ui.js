/* Feuerwehr freie Tätigkeiten – unabhängige FDISK-Erfassung ohne Kurs */
'use strict';
let GA_FREE_EDIT='';
function gaFreeActivityPage(){
 if(!['Administrator','Ausbilder','Organisator Erweiterte Ausbildung'].includes(role()))return '<section class="panel">Keine Berechtigung.</section>';
 const items=STATE.freieTaetigkeiten;
 if(!Array.isArray(items))return '<section class="panel"><h2>Freie Tätigkeiten</h2><p class="ga-alert">Das Apps-Script-Backend ist noch nicht auf Version 1.10 aktualisiert. Bitte die neue Code.gs als Version bereitstellen.</p></section>';
 const chosen=items.find(x=>x.ID===GA_FREE_EDIT);
 const list=items.slice().sort((a,b)=>String(b.BeginnIst||'').localeCompare(String(a.BeginnIst||''))).map(x=>{
  const valid=Number(x.DauerMinuten)>0;
  return '<div class="ga-training-list-item"><div><strong>'+h(x.Titel)+'</strong><p class="small muted">'+
   dt(x.BeginnIst)+' · '+h(x.Kategorie||'Sonstige')+' · '+gaTrainingHours(x.DauerMinuten)+' h'+
   ' · '+gaTrainingKm(gaReportVehicles(x).reduce((a,v)=>a+Number(v.Kilometer||0),0))+' km</p></div>'+
   '<button class="secondary" type="button" data-free-open="'+h(x.ID)+'">Bearbeiten</button>'+
   '<button class="secondary" type="button" data-free-pdf="'+h(x.ID)+'" '+(!valid?'disabled':'')+'>PDF</button></div>';
 }).join('');
 const heading='<div class="ga-page-heading"><div><h2>Freie Tätigkeiten</h2>'+
 '<p>Übungen und Diensttätigkeiten ohne vorher angelegten Ausbildungskurs für FDISK dokumentieren.</p></div>'+
 '<button class="primary" type="button" data-free-new>+ Tätigkeit erfassen</button></div>';
 if(!GA_FREE_EDIT)return heading+'<section class="panel"><h3>Erfasste Tätigkeiten</h3>'+
 (list||'<p class="muted">Noch keine Tätigkeiten erfasst.</p>')+'</section>';
 const item=chosen||{};
 const members=(STATE.mitglieder||[]).filter(x=>x.Aktiv==='JA');
 const trainers=(STATE.benutzer||[]).filter(x=>['Administrator','Ausbilder','Organisator Erweiterte Ausbildung'].includes(x.Rolle));
 if(!trainers.some(x=>x.ID===STATE.user.ID))trainers.unshift({...STATE.user,Aktiv:'JA'});
 const pIds=String(item.TeilnehmerIDs||'').split(','),tIds=item.AusbilderIDs?String(item.AusbilderIDs).split(','):[STATE.user.ID];
 const v=gaReportVehicles(item),used=v.length>0;
 return heading+'<section class="panel ga-free-editor"><div class="row between"><h3>'+ (chosen?'Tätigkeit bearbeiten':'Neue Tätigkeit')+'</h3>'+
 '<button type="button" class="secondary" data-free-close>Zur Liste</button></div>'+
 '<form data-form="freeActivity"><input type="hidden" name="ID" value="'+h(chosen?.ID||'')+'">'+
 '<div class="ga-training-time-grid"><label>Bezeichnung<input required maxlength="160" name="Titel" placeholder="z. B. Gerätewartung, Übungsdienst" value="'+h(item.Titel||'')+'"></label>'+
 '<label>Art der Tätigkeit<select name="Kategorie">'+['Ausbildung','Übung','Diensttätigkeit','Sonstige'].map(k=>'<option value="'+k+'" '+((item.Kategorie||'Übung')===k?'selected':'')+'>'+k+'</option>').join('')+'</select></label></div>'+
 '<label>Ort<input name="Ort" maxlength="160" value="'+h(item.Ort||'')+'" placeholder="z. B. Feuerwehrhaus"></label>'+
 '<div class="ga-training-time-grid">'+
 '<label>Beginn (tatsächlich)<div class="ga-training-time-entry"><input type="datetime-local" name="BeginnIst" required value="'+h(String(item.BeginnIst||'').slice(0,16))+'"><button type="button" class="secondary" data-training-now="begin">Jetzt</button></div></label>'+
 '<label>Ende (tatsächlich)<div class="ga-training-time-entry"><input type="datetime-local" name="EndeIst" required value="'+h(String(item.EndeIst||'').slice(0,16))+'"><button type="button" class="secondary" data-training-now="end">Jetzt</button></div></label></div>'+
 '<p class="ga-training-duration" data-training-duration>Dauer wird aus Beginn und Ende berechnet.</p>'+
 '<details class="ga-subsection"><summary>Beteiligte Mitglieder <span class="ga-inline-count" data-training-present-count>'+pIds.filter(Boolean).length+'</span></summary>'+
 '<div class="ga-attendance-list">'+members.map(m=>'<label class="ga-attendance-choice"><input type="checkbox" name="participant" value="'+h(m.ID)+'" '+(pIds.includes(m.ID)?'checked':'')+'><span>'+h(name(m))+'</span></label>').join('')+'</div></details>'+
 '<details class="ga-subsection"><summary>Mitwirkende Ausbilder / Verantwortliche</summary><div class="ga-attendance-list">'+
 trainers.map(u=>'<label class="ga-attendance-choice"><input type="checkbox" name="trainer" value="'+h(u.ID)+'" '+(tIds.includes(u.ID)?'checked':'')+'><span>'+h(u.Name)+
 (u.Aktiv!=='JA'?' · Einladung offen':'')+'</span></label>').join('')+'</div></details>'+
 '<section class="ga-training-fieldset"><h3>Fahrzeuge verwendet?</h3><div class="ga-training-vehicle-choice">'+
 '<label><input type="radio" name="FahrzeugeVerwendet" value="NEIN" '+(!used?'checked':'')+'> Nein</label>'+
 '<label><input type="radio" name="FahrzeugeVerwendet" value="JA" '+(used?'checked':'')+'> Ja</label></div>'+
 '<div id="gaTrainingVehicleArea" '+(!used?'hidden':'')+'><datalist id="gaVehicleNames">'+gaVehicleSuggestions().map(x=>'<option value="'+h(x)+'"></option>').join('')+'</datalist>'+
 '<div id="gaTrainingVehicleRows">'+(v.length?v:[{}]).map(gaVehicleRow).join('')+'</div>'+
 '<button class="secondary" type="button" data-training-vehicle-add>+ Fahrzeug</button>'+
 '<p>Fahrzeugkilometer: <strong data-training-km-total>0,0</strong> km</p></div></section>'+
 '<label>Bemerkungen<textarea name="Notiz" rows="3" maxlength="1500">'+h(item.Notiz||'')+'</textarea></label>'+
 '<div class="ga-training-summary" data-training-summary></div>'+
 '<div class="ga-training-finish-buttons"><button class="primary" type="submit">Tätigkeit speichern</button>'+
 (chosen?'<button type="button" class="secondary" data-free-pdf="'+h(chosen.ID)+'">PDF herunterladen</button>':'')+'</div>'+
 '</form></section>';
}
async function gaSubmitFreeActivity(form,fd){
 const data={ID:String(fd.get('ID')||''),Titel:fd.get('Titel'),Kategorie:fd.get('Kategorie'),Ort:fd.get('Ort'),
 BeginnIst:fd.get('BeginnIst'),EndeIst:fd.get('EndeIst'),Notiz:fd.get('Notiz'),
 TeilnehmerIDs:fd.getAll('participant'),AusbilderIDs:fd.getAll('trainer'),
 Fahrzeuge:fd.get('FahrzeugeVerwendet')==='JA'?gaTrainingVehiclesFromForm(form):[]};
 if(!gaTrainingMin(data.BeginnIst,data.EndeIst))throw new Error('Bitte gültigen Beginn und ein späteres Ende eingeben.');
 if(fd.get('FahrzeugeVerwendet')==='JA'&&!data.Fahrzeuge.length)throw new Error('Bitte ein Fahrzeug erfassen.');
 if(!data.AusbilderIDs.length)throw new Error('Bitte mindestens einen Verantwortlichen auswählen.');
 if(['Ausbilder','Organisator Erweiterte Ausbildung'].includes(STATE.user.Rolle)&&!data.AusbilderIDs.includes(STATE.user.ID))
  throw new Error('Der erfassende Ausbilder muss sich selbst anhaken.');
 if(!confirm('Tätigkeit und FDISK-Daten speichern?'))return;
 const result=await api('saveFreeActivity',data);
 GA_FREE_EDIT='';tip(result.message||'Tätigkeit gespeichert.');
 await reload();
}
document.getElementById('app')?.addEventListener('click',e=>{
 const x=e.target.closest('[data-free-open],[data-free-new],[data-free-close],[data-free-pdf]');
 if(!x)return;
 if(x.dataset.freeOpen){GA_FREE_EDIT=x.dataset.freeOpen;render();return;}
 if(x.dataset.freeNew!==undefined){GA_FREE_EDIT='new';render();return;}
 if(x.dataset.freeClose!==undefined){GA_FREE_EDIT='';render();return;}
 if(x.dataset.freePdf){gaDownloadTrainingPdf({FreieTaetigkeitID:x.dataset.freePdf},x);}
});
