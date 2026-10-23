# Grundausbildung – Feuerwehr St. Pölten Stadt

**Stand: V1.2 Pilot / 23.10.2026** · Eigenständige Anwendung · Frühere Apps unverändert


## Neu in V1.2 – gezielte Nachrichten, Soforteinladung, Web-Push

**Live-Installation braucht zwei Updates und die VAPID-Konfiguration.** GitHub Pages veröffentlicht nur das Frontend automatisch. Der im Google-App-Script-Editor bereits installierte Code wird nicht durch den GitHub-Commit aktualisiert.

### 1. Google Apps Script aktualisieren (Pflicht)

1. Die Datei [Code.gs](https://github.com/michaelmejtsky/grundausbildung/blob/main/Code.gs) aus dem Repository vollständig in **Erweiterungen → Apps Script** der bestehenden Grundausbildung-Tabelle übernehmen und speichern. Bestehende Skripteigenschaften, Schlüssel und Tabellen nicht löschen.
2. Die verbundene Google-Tabelle neu laden und **Grundausbildung → 5 · Push-Speicher und Trigger einrichten** einmal ausführen. Dies erzeugt/prüft die privaten Tabellen `PushGeraete` und `PushRegeln` und richtet einen Trigger zur Verarbeitung wartender Push-Nachrichten alle 5 Minuten ein. Fehlende OAuth-Berechtigungen erlauben.
3. Im Apps-Script-Editor **Bereitstellen → Bereitstellungen verwalten → vorhandene Web-App bearbeiten → Version: Neue Version → Bereitstellen**. **Keine neue /exec-URL erzeugen**, sonst zeigt Cloudflare noch auf die alte Bereitstellung.

Die beiden Sheets `PushGeraete` und `PushRegeln` wurden außerdem bereits direkt in der privaten Google-Datenbasis vorbereitet. Sie dürfen nicht öffentlich freigegeben werden.

### 2. Cloudflare Worker bereitstellen und VAPID konfigurieren (für Hintergrund-Push)

1. Beim bestehenden Cloudflare Worker `grundausbildung` unter **Deployments** kontrollieren, ob der Commit mit dem neuen `cloudflare-worker.js` bereitgestellt wurde. Wenn nötig eine neue Bereitstellung aus dem verbundenen GitHub-Repository auslösen. `GA_WORKER_SECRET` unverändert lassen.
2. Öffne die GitHub-Pages-Seite [Push-Schlüssel lokal erzeugen](https://michaelmejtsky.github.io/grundausbildung/push-einrichten.html). Die Werte werden **lokal** im Browser erzeugt, nicht ins Repo hochgeladen.
3. Unter **Cloudflare → Worker grundausbildung → Settings → Variables and Secrets** diese drei Werte hinterlegen:
   - `VAPID_PRIVATE_JWK` — **Secret**, Inhalt aus Feld 2 der Generatorseite. Niemals in GitHub.
   - `VAPID_PUBLIC_KEY` — **Textvariable**, Inhalt aus Feld 1 der Generatorseite.
   - `VAPID_SUBJECT` — **Textvariable**, z. B. `mailto:DEINE_MAIL@DOMAIN.AT` mit der tatsächlichen E-Mail-Adresse.
4. Worker-Einstellungen speichern und bei Bedarf neu deployen. **Nicht** den privaten VAPID-Key im Chat verschicken. Nach einer Schlüsselrotation müssen sich registrierte Geräte neu für Push anmelden.

### 3. Verwenden

- **Administrator → Mitglieder:** optional das Kontrollkästchen `Teilnehmerzugang gleich per E-Mail einladen` nutzen. Bestehende Mitglieder können über `Zugang einladen` in der Mitgliederliste eingeladen werden. Die Person vergibt ihr Passwort selbst.
- **Administrator → Nachrichten:** entweder `Alle Teilnehmer`, `Gesamter Turnus` oder `Einzelnes Mitglied` auswählen. Persönliche Nachrichten sind nur für den jeweiligen Teilnehmer und Administrator sichtbar.
- **Administrator → Push-Steuerung:** für jeden aktiven Benutzer per Kontrollkästchen bestimmen, ob er **Nachrichten**, **Termine** und/oder **Aufgaben** als Hintergrund-Push bekommen darf. Das verändert nicht den In-App-Zugriff auf normale Mitteilungen.
- **Jeder Benutzer → Benachrichtigungen → Push aktivieren:** auf jedem gewünschten Gerät separat zustimmen. Auf **iPhone/iPad** erst als App zum Home-Bildschirm hinzufügen, von dort starten und danach Push erlauben. Ein Administrator kann die Systemfreigabe auf dem fremden Gerät nicht erzwingen. Danach `Push-Steuerung → Test-Push` nutzen.

**Technische Hinweise:** Die Push-Empfängerregeln sind serverseitig wirksam. Push-Endpunkte und Verschlüsselungsdaten bleiben nur in der privaten Google-Tabelle. Die Worker-Zustellung ist zeitgestempelt HMAC-signiert und auf bekannte Push-Service-Hosts beschränkt. End-to-End-Zustellung und Mobile-Berechtigungen müssen nach Konfiguration auf einem echten Gerät getestet werden. Bis dahin sind nur In-App-Benachrichtigungen sicher verfügbar.


## Projektlinks

- **GitHub-Quellcode:** https://github.com/michaelmejtsky/grundausbildung
- **Google-Datenbank (bereits erstellt):** https://docs.google.com/spreadsheets/d/1DZPggVf8T2F-GFIT_57kbqWQcSCF1TA6s5GV01iQXJc/edit
- **Geplante Installations-/Einladungsadresse:** https://michaelmejtsky.github.io/grundausbildung/
- **GitHub Pages Einstellungen:** https://github.com/michaelmejtsky/grundausbildung/settings/pages
- **Apps-Script-Web-App (/exec; Bereitstellung vorhanden):** https://script.google.com/macros/s/AKfycbw0t9edW1egW27B1dHhen2I73GZji3JfQ8aBSFAjghd5gZXSTu24r7E_iMvTqBe3hhT/exec

Die GitHub Pages-Adresse funktioniert erst nach erfolgreicher Pages-Veröffentlichung. In GitHub Free muss das Repository dafür ggf. öffentlich sein; bei bestimmten kostenpflichtigen Tarifen kann ein privates Repo GitHub Pages bereitstellen. **Eine Pages-Seite ist unabhängig von der Repo-Sichtbarkeit öffentlich erreichbar.** Keine Passwörter, Mitgliederlisten oder sonstigen vertraulichen Daten auf GitHub ablegen.

## Zielarchitektur

1. **GitHub Pages:** `index.html`, `manifest.webmanifest`, `service-worker.js`, PNG-Icons = installierbare Web-App (PWA).
2. **Cloudflare Worker:** `cloudflare-worker.js` = HTTPS-API und CORS; schützt die Verbindung zu Apps Script mit einem serverseitigen Secret.
3. **Google Apps Script:** `Code.gs` = Anmeldungen, Einladungen, Rollen und Verwaltungsfunktionen.
4. **Google Sheets:** private Datenspeicherung; nicht direkt an Teilnehmer weitergeben.

Eine einfache direkte `fetch()`-Anbindung von GitHub an Apps Script ist wegen CORS/Weiterleitungen nicht verlässlich. Die früher getestete iframe-Idee ist daher **nicht** die verwendete Architektur.

## Einrichtung – der Reihe nach

### 1. Apps Script an vorhandene Tabelle binden

- Die oben verlinkte Google-Tabelle öffnen.
- **Erweiterungen → Apps Script** und Projekt **Grundausbildung** nennen.
- In Apps Script die Datei `Code.gs` aus diesem Repository vollständig einfügen. **Die GitHub-Datei `index.html` gehört NICHT in Apps Script.**
- Speichern. `gaEinrichten` einmal ausführen, die gefragten Berechtigungen erteilen.
- Tabelle neu laden. Menü **Grundausbildung → 2 · Ersten Administrator einrichten** verwenden. Achtung: Das Standarddialogfeld zeigt Eingaben beim Tippen sichtbar an. Für den Pilottest ein einzigartiges Passwort eingeben und die Umgebung vor Blicken schützen.

### 2. Geheimes Verbindungstoken erzeugen

- Im Tabellenmenü **Grundausbildung → 4 · Worker-Schlüssel einrichten** auswählen. Falls das Menü nach dem Code-Einfügen fehlt: Tabelle neu laden.
- Den erzeugten langen Schlüssel einmal sicher kopieren. **Nicht in GitHub, README, E-Mail oder Chat veröffentlichen.**
- Apps Script speichert ihn als Projekteigenschaft `GA_WORKER_SECRET`.

### 3. Apps Script als Backend bereitstellen

- **Bereitstellen → Neue Bereitstellung → Web-App**.
- **Ausführen als:** Ich (Skripteigentümer).
- **Zugriff:** für die Verbindung über den Worker muss die Web-App ohne Google-Anmeldung erreichbar sein (je nach Workspace-Richtlinien `Jeder`). Das bedeutet ausdrücklich **nicht**, dass die Daten ohne Anmeldung gelesen werden können: `doPost` verlangt einen geheimen Worker-Schlüssel; die eigentlichen Funktionen verlangen außerdem eine passende Sitzung/Rolle. Vor Echtdaten durchprüfen.
- **Bereitstellung vom 23.10.2026 wurde gemeldet.** Die `/exec`-URL steht bereits oben und ist im Worker-Code eingetragen. **Wichtig:** Falls `doPost` bzw. die Einladungsfunktionen nach der Bereitstellung in `Code.gs` geändert wurden, unbedingt in Apps Script eine **neue Version derselben Bereitstellung** veröffentlichen; sonst läuft unter der `/exec`-Adresse noch der alte Code. 
- Die URL allein beweist noch nicht, dass der Zugriff oder der aktuelle Stand funktioniert.

### 4. Cloudflare Worker einrichten

- **Einfacherer GitHub-Weg (bereits vorbereitet):** In Cloudflare → **Workers & Pages** → Create → GitHub → Repository `michaelmejtsky/grundausbildung` auswählen. Projektname `grundausbildung-api`, **Build command leer**, **Deploy command `npx wrangler deploy`**, Preview builds für den ersten Test ausschalten, Cloudflare Access ausschalten und **Deploy** drücken. Die neue Datei `wrangler.jsonc` steuert dabei automatisch die Veröffentlichung von `cloudflare-worker.js` als Worker. Die Datei `index.html` bleibt für GitHub Pages gedacht.
- Die Apps-Script-URL ist in der Datei `cloudflare-worker.js` **bereits eingetragen**. Die optionale Worker-Variable `GA_SCRIPT_URL` ist nur nötig, wenn die Zieladresse später überschrieben werden soll. GitHub-Builds übernehmen Änderungen am Worker-Code automatisch.
- Worker-**Secret** `GA_WORKER_SECRET` = der in Schritt 2 einmalig erzeugte Schlüssel. Den Wert **nie im GitHub-Repository speichern**.
- Worker neu veröffentlichen und dessen HTTPS-Adresse kopieren, z. B. `https://grundausbildung-api.<account>.workers.dev`.
- Die Worker-Adresse ist **kein Geheimnis**; das Secret bleibt nur serverseitig.
- Der Worker akzeptiert Browseranfragen nur vom Ursprung `https://michaelmejtsky.github.io`; die Backend-Aktionen haben zusätzliche Rollen- und Tokenprüfungen.

### 5. GitHub-Oberfläche mit Worker verbinden

- In `config.js` im Repository die Zeile `window.GA_API_URL = '';` durch die **Worker-Adresse** ersetzen (ohne abschließenden Schrägstrich) und speichern.
- In **Settings → Pages**, `Deploy from a branch`, Branch `main`, Ordner `/ (root)` auswählen und speichern.
- Nach erfolgreicher Veröffentlichung `https://michaelmejtsky.github.io/grundausbildung/` öffnen.

**Wichtig:** GitHub und Apps Script synchronisieren sich nicht automatisch. Änderungen in `Code.gs` müssen in Apps Script übernommen und neu bereitgestellt werden. Änderungen an `index.html` werden nach Veröffentlichung automatisch über GitHub Pages aktualisiert.

### 6. Test ohne Echtdaten

1. Als erster Administrator anmelden.
2. Test-Turnus und Test-Mitglied mit E-Mail anlegen.
3. **Zugänge → Benutzer per E-Mail einladen**; für Teilnehmer muss zuvor der gleichnamige Mitgliedseintrag existieren.
4. E-Mail-Link öffnen, eigenes Passwort (mindestens 12 Zeichen) festlegen, anschließend anmelden.
5. Teilnehmerzugang und Fachverwaltung separat prüfen; Anwesenheiten und Protokoll testen.
6. Erst dann Einladung an tatsächliche Mitglieder freigeben.

## App installieren

- **Android (Chrome):** Die GitHub-Pages-Seite öffnen → `App installieren` oder Chrome-Menü → `Zum Startbildschirm hinzufügen`.
- **iPhone (Safari):** Link in Safari öffnen → Teilen → `Zum Home-Bildschirm`.
- **Desktop (Chrome/Edge):** über das Installationssymbol in der Adressleiste oder die Schaltfläche in der Anwendung.

Das ist eine **Progressive Web App (PWA)**, keine APK oder App-Store-App. Mit dem Service Worker wird nur die statische Oberfläche zwischengespeichert, **keine persönlichen Ausbildungsdaten**. Die Verbindung zum Backend benötigt Internet.

## Funktionen dieser Version

- Admin, Ausbilder, Teilnehmer und Fachverwaltung (Zeugkammer)
- Kurse mit Inhalt, Lernzielen und HTTPS-Links zu Google Drive/Google Slides
- Turnusse, Mitglieder, Kurstermine, Teilnehmer- und Ausbilderbestätigung
- Checklisten mit Status `Offen`, `Erledigt`, `Nicht erforderlich`
- Verantwortlichen-Aufgaben, Änderungen mit Zeitstempel, Nachrichten
- Einmalige E-Mail-Einladung für neue Benutzer (7 Tage gültig), Passwort selbst setzen
- Installierbare Benutzeroberfläche als PWA

## Grenzen und Sicherheit

- **Noch keine echten Hintergrund-Push-Nachrichten**, die bei geschlossener App ankommen. Die App besitzt nur In-App-Meldungen. Web Push benötigt noch einen gesonderten Push-Dienst und Einwilligung.
- Noch keine Passwort-zurücksetzen-Funktion und MFA. Der bestehende PBKDF2-Ansatz ist für einen Piloten gedacht; vor großflächiger produktiver Nutzung stärkere Identitäts- und Login-Schutzmaßnahmen einplanen.
- Die Google-Tabelle ist privat. **Nie** Mitarbeiterdaten oder geteilte Sitzungstokens im GitHub-Code veröffentlichen.
- Drive-Unterlagen sind nur für berechtigte Personen über deren Google-Freigaben einsehbar.
- Cloudflare-Worker-/Google-Apps-Script-Anbindung, Einladungsmailversand, GitHub-Pages-Veröffentlichung und Installation sind in dieser Umgebung noch **nicht Ende-zu-Ende getestet**. Deployment und Berechtigungen werden vom Eigentümer eingerichtet.
