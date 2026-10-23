# Grundausbildung – Feuerwehr St. Pölten Stadt

**Stand: V1.1 Pilot / 23.10.2026** · Eigenständige Anwendung · Frühere Apps unverändert

## Projektlinks

- **GitHub-Quellcode:** https://github.com/michaelmejtsky/grundausbildung
- **Google-Datenbank (bereits erstellt):** https://docs.google.com/spreadsheets/d/1DZPggVf8T2F-GFIT_57kbqWQcSCF1TA6s5GV01iQXJc/edit
- **Geplante Installations-/Einladungsadresse:** https://michaelmejtsky.github.io/grundausbildung/
- **GitHub Pages Einstellungen:** https://github.com/michaelmejtsky/grundausbildung/settings/pages

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
- Nach Bereitstellung die **/exec-URL** kopieren. Nicht den Editor-Link oder `/dev` verwenden.

### 4. Cloudflare Worker einrichten

- In Cloudflare → **Workers & Pages** → Worker anlegen, Inhalt aus `cloudflare-worker.js` einfügen und bereitstellen.
- Worker-Variable `GA_SCRIPT_URL` = die oben kopierte Apps-Script-/exec-URL.
- Worker-**Secret** `GA_WORKER_SECRET` = der in Schritt 2 einmalig erzeugte Schlüssel.
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
