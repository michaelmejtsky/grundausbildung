/* Erste-Hilfe-Bescheinigungen – zusätzliche, rollenbasierte Ansichten. */
function aidPanel(admin){
 const cfg=STATE.ersteHilfeMail||{}, member=STATE.meMember;
 const settings=admin?'<section class="panel"><h2>Erste-Hilfe-Nachweise · E-Mail-Weiterleitung</h2>'+
 '<p class="muted">Lege eine Empfängeradresse fest. Nur wenn du die Weiterleitung aktivierst, werden neue Nachweise automatisch mit Mitgliedsdaten und PDF-Anhang weitergeleitet.</p>'+
 '<form data-form="aidSettings"><label>Empfänger-E-Mail-Adresse</label>'+
 '<input type="email" name="Empfaenger" value="'+h(cfg.Empfaenger||'')+'" placeholder="Empfängeradresse eingeben">'+
 '<label class="inline-check"><input type="checkbox" name="Aktiv" value="JA" '+(cfg.Aktiv?'checked':'')+
 '> Neue Bescheinigungen automatisch per E-Mail mit PDF weiterleiten</label>'+
 '<button class="primary" type="submit">Versandeinstellungen speichern</button></form></section>':'';
 const field=admin?'<div><label>Mitglied auswählen</label><select name="MitgliedID" required>'+
 option(STATE.mitglieder.filter(m=>m.Aktiv==='JA'),m=>name(m)+' · '+(by(STATE.turnusse,m.TurnusID)?.Bezeichnung||'Turnus'))+
 '</select></div>':'<input type="hidden" name="MitgliedID" value="'+h(member?.ID||'')+'">';
 const checkbox=admin&&cfg.Aktiv?'<label class="inline-check"><input type="checkbox" name="Versenden" value="JA" checked> Diese Einreichung per E-Mail weiterleiten</label>':'';
 const upload='<section class="panel"><h2>Erste-Hilfe-Nachweis '+(admin?'für ein Mitglied hochladen':'selbst einreichen')+'</h2>'+
 '<p class="muted">Das PDF wird in einem privaten Google-Drive-Ordner gespeichert. Der Status „eingereicht“ zählt noch nicht als geprüfter Nachweis.</p>'+
 '<form data-form="aidUpload"><div class="grid">'+field+
 '<div><label>Datum des Erste-Hilfe-Kurses</label><input name="Kursdatum" type="date" required></div>'+
 '<div><label>Stundenausmaß</label><input name="Stunden" type="number" step="0.5" min="0.5" max="80" placeholder="z. B. 16" required></div>'+
 '<div class="wide"><label>Bescheinigung als PDF (max. 4 MB)</label><input name="pdf" type="file" accept=".pdf,application/pdf" required></div></div>'+
 checkbox+'<button type="submit" class="primary">PDF sicher einreichen</button></form></section>';
 const rows=(STATE.ersteHilfeNachweise||[]).slice().reverse();
 const history=rows.length?rows.map(p=>{
   const member=by(STATE.mitglieder,p.MitgliedID);
   const label=admin?h(name(member))+' · ':'';
   const tone=p.Status==='Bestätigt'?'ok':p.Status==='Abgelehnt'?'bad':'warn';
   const latest=rows.find(x=>x.MitgliedID===p.MitgliedID)?.ID===p.ID;
   const verify=admin&&latest?'<form class="item" data-form="aidReview" data-id="'+h(p.ID)+'">'+
     '<div class="grid"><div><label>Prüfung</label><select name="Entscheidung">'+
     '<option value="Bestätigt" '+(p.Status==='Bestätigt'?'selected':'')+'>Bestätigen</option>'+
     '<option value="Abgelehnt" '+(p.Status==='Abgelehnt'?'selected':'')+'>Ablehnen</option></select></div>'+
     '<div><label>Prüfnotiz / Ablehnungsgrund</label><input name="Pruefnotiz" maxlength="500" value="'+h(p.Pruefnotiz||'')+'"></div></div>'+
     '<button class="smallbtn" type="submit">Prüfung speichern</button></form>':'';
   const mail=admin?'<p class="small muted">E-Mail: '+h(p.EmailStatus||'Nicht gesendet')+(p.EmailGesendetAm?' · '+dt(p.EmailGesendetAm):'')+'</p>':'';
   const resend=admin&&cfg.Aktiv?'<button type="button" class="smallbtn" data-aid-resend="'+h(p.ID)+'">E-Mail erneut senden</button>':'';
   return '<div class="item"><b>'+label+'Erste Hilfe · '+h(p.Kursdatum)+'</b>'+
    '<div class="detail">'+h(p.Stunden)+' Stunden · '+h(p.Dateiname)+' · Hochgeladen: '+dt(p.EingereichtAm)+'</div>'+
    '<p><span class="tag '+tone+'">'+h(p.Status)+'</span></p>'+
    (p.Pruefnotiz?'<p class="small muted">Prüfnotiz: '+h(p.Pruefnotiz)+'</p>':'')+mail+
    '<div class="btnline"><button type="button" class="smallbtn" data-aid-pdf="'+h(p.ID)+'">PDF öffnen</button>'+resend+'</div>'+
    verify+'</div>';
 }).join(''):'<div class="notice">Noch keine Erste-Hilfe-Bescheinigung hinterlegt.</div>';
 return settings+upload+'<section class="panel"><h2>'+(admin?'Alle eingereichten Erste-Hilfe-Nachweise':'Meine Erste-Hilfe-Nachweise')+
 '</h2><div class="items">'+history+'</div></section>';
}
