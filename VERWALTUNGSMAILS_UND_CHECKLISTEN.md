# Verwaltungs-Mails, Tätigkeitsberichte und Checklisten – 1.13.14

## Bestehendes System aktualisieren

Die vollständige Code.gs 1.13.14 enthält den bisherigen Stand einschließlich Ausbilder-Bereichsauswahl, Quiz-Anrechnung, Gültigkeitsdaten, E-Mail-Änderung, GAB- und erweiterten Abschlussnachrichten. Keine neue Datenbank, keine geänderten Mitgliedsnummern und keine neue Web-App-Adresse verwenden.

1. Code.gs im bestehenden Apps-Script-Projekt vollständig ersetzen und speichern.
2. Einmal **gaVerwaltungsMailEinrichten** ausführen und die erforderlichen Berechtigungen zulassen. Alternativ das bestehende Google Sheet neu öffnen und **Grundausbildung → 9 · Verwaltungs-Mail-Trigger einrichten** wählen. Das richtet ausschließlich die Versandprüfung ein; es verschickt selbst keine Nachricht und legt keine neuen Datenbanktabellen oder Prüfdaten an.
3. **Bereitstellen → Bereitstellungen verwalten → bestehende Web-App bearbeiten → Neue Version → Bereitstellen**. Die vorhandene `/exec`-Adresse beibehalten.
4. App neu laden beziehungsweise die installierte PWA schließen und erneut öffnen. Die Oberfläche zeigt V1.13.14, der statische Cache heißt ga-shell-v2.51.
5. Als Administrator unter **Verwaltungs-Mails** die Empfänger für die Kategorien hinterlegen und speichern. Jede Kategorie kann eine oder mehrere Adressen haben. Mehrere Adressen mit Komma trennen, beispielsweise `ausbildung@example.test, verwaltung@example.test`. Pro Kategorie sind bis zu 20 Adressen möglich; doppelte Adressen werden innerhalb der Liste entfernt. Bereits gespeicherte Einzeladressen bleiben unverändert gültig. Ein leeres Feld deaktiviert diese Kategorie. Beim Speichern wird ein fehlender Versandtrigger ebenfalls eingerichtet; vorherige Autorisierung über Schritt 2 vermeidet Berechtigungsfehler.

GitHub Pages aktualisiert nur die Oberfläche und die veröffentlichte Backend-Quelldatei, nicht die laufende Apps-Script-Bereitstellung.

## Transponder für Zugang

Unter **Mitglieder → Mitglied aufnehmen** lässt sich für einen GAB-Teilnehmer **Transponder für Zugang erforderlich** anhaken. Für eine vollständige Anforderung müssen Standesbuchnummer und Telefonnummer hinterlegt sein. Dafür wird ein optionaler Checklistenpunkt erstellt und nur diesem Mitglied als offen zugeordnet. Mitglieder ohne Häkchen bekommen diesen Punkt nicht automatisch.

Die Mail enthält den Text „Dieses Mitglied wurde in die Grundausbildung aufgenommen und benötigt noch einen Transponder“, Name, Standesbuchnummer, Telefonnummer, E-Mail und Turnus. Ein späteres Speichern oder erneutes Anhaken nach bereits bestätigtem Versand erzeugt keine weitere Anforderungsmail. Die tatsächliche Ausgabe des Transponders wird unter Checklisten als erledigt bestätigt; dieser Nachweis wird beim Bearbeiten des Mitglieds nicht zurückgesetzt.

## Blaulicht SMS/Lea

Unter **Verwaltungs-Mails** die eigene Empfängergruppe **Blaulicht SMS/Lea – Registrierung und Zuordnung** hinterlegen (mehrere Adressen mit Komma möglich). Beim neuen oder bereits vorhandenen GAB-Mitglied **Blaulicht SMS/Lea: Registrierung und Zuordnung erforderlich** anhaken und speichern. Standesbuchnummer und Telefonnummer sind erforderlich.

Das erstellt beziehungsweise verwendet den optionalen Checklistenpunkt **Blaulicht SMS/Lea** mit Zuständigkeit **IT**, ausschließlich für ausgewählte Mitglieder. Ein vorhandener Punkt mit genau diesem Namen wird wiederverwendet. Mitglieder ohne Auswahl erhalten keine zusätzliche offene Aufgabe und keine Mail. Bereits erledigte Einträge, Notizen und ursprüngliche Turnuszuordnungen bleiben erhalten.

Die Anforderung enthält Name, Standesbuchnummer, Telefonnummer, E-Mail, Turnus und den Button **In Blaulicht SMS/Lea registriert und zugeordnet bestätigen**. Der Empfänger führt die Registrierung und Zuordnung in Blaulicht SMS/Lea selbst durch und bestätigt anschließend auf der verlinkten Seite ohne App-Konto. Dann erscheint der zugehörige Punkt unter **Checklisten → Mitglied** als erledigt. Das ist eine Bestätigung der manuellen Erfassung, keine automatische Schnittstelle zu Blaulicht SMS/Lea.

Gewöhnliches erneutes Speichern löst keinen weiteren Versand aus. Bei abgelaufenen Links unter **Verwaltungs-Mails → Versandverlauf → Offene Bestätigungslinks neu senden** gezielt eine neue Mail auslösen. Die gleichen Schutzregeln und 30 Tage Gültigkeit wie beim Transponder gelten.

## Sammelmail nach Block B

Unter **Abschnittsmodule A & B** werden die Ausbildung Block B und der bestandene Abschluss Truppmann mit ihren tatsächlichen Daten dokumentiert. Der Versand benötigt keine zusätzliche GAB-Gesamtfreigabe: Maßgeblich ist der bestätigte positive Block-B-/ASMTRM-Nachweis.

Neue positive Nachweise werden nach Turnus und Datum der bestandenen Abschlussprüfung gebündelt. Der Versand wird frühestens fünf Minuten nach dem letzten neu bestätigten Abschluss fällig. Der Trigger prüft alle fünf Minuten; üblich ist deshalb ein Versand nach etwa fünf bis zehn Minuten ohne weitere neue Bestätigungen.

Die Mail lautet „Folgende Teilnehmer haben den Truppmann-Abschluss Block B im Bezirk absolviert“ und enthält Turnus, Abschlussdatum sowie Namen, Standesbuchnummern und Ausbildungsdatum Block B. Es werden nur tatsächlich positiv bestätigte Teilnehmer gemeldet. Noch offene oder nicht bestandene Prüfungen werden nicht fälschlich als abgeschlossen ausgegeben. Später positiv bestätigte Teilnehmer werden ergänzend gemeldet, bereits gemeldete Personen nicht erneut.

Korrekturen vor dem Versand werden neu geprüft. Eine spätere bloße Notizänderung, erneutes Speichern oder eine erneute positive Markierung bereits gemeldeter Personen löst keinen zweiten Versand aus. Fehlt eine Standesbuchnummer, bleibt der Nachweis gespeichert; die Mail wird als Fehler angezeigt und kann nach Ergänzen der Nummer erneut angestoßen werden. Das bloße Einrichten einer Adresse verschickt keine historischen Abschlüsse nachträglich.

## Fertige Tätigkeitsberichte als PDF per E-Mail

In den PDF-Berichten für Ausbildungstermine, Modulübersichten und freie Tätigkeiten steht die Standesbuchnummer unmittelbar beim Teilnehmernamen. Bei fehlender Stammdatennummer steht ausdrücklich „nicht hinterlegt“.

Beim ersten vollständigen Abschluss eines Ausbildungstermins mit Anwesenheiten, Ausbildern und Ist-Zeiten wird eine PDF-Mail vorgemerkt. Dasselbe gilt beim erstmaligen Speichern einer vollständigen freien Tätigkeit. Sie wird bei der nächsten Versandprüfung als PDF-Anhang an die Berichtsadresse geschickt. Der Text erklärt den Bericht und enthält Bezeichnung, Ort, Zeiten, Dauer und Personenzahlen. Der Anhang enthält die vorhandenen FDISK-Angaben samt Teilnehmernamen und Standesbuchnummern.

Ein bloßer PDF-Download oder das spätere Bearbeiten eines schon abgeschlossenen Berichts erzeugt keinen weiteren automatischen Versand. Bei einem PDF- oder Mailfehler bleiben Bericht, Anwesenheiten und Kilometer gespeichert. Der Fehler erscheint unter Verwaltungs-Mails und kann nach Beheben der Ursache ausdrücklich erneut versucht werden. Der automatische Versand verwendet dieselbe bestehende PDF-Erstellung wie der Download; keine Drive-Freigaben werden verändert.

## Checklistenpunkte bearbeiten und entfernen

Unter **Checklisten → Checklistenpunkte verwalten** stehen bei vorhandenen Punkten **Bearbeiten** und **Entfernen** zur Verfügung. Bezeichnung, Ausbildungsbereich und zuständige Stelle können geändert werden. Die vorhandenen Mitgliedsstatus und Notizen bleiben erhalten. Bei erweiterten Geltungsbereichen werden nur bisher fehlende passende Einträge ergänzt; bestehende Erledigungen werden nicht zurückgesetzt.

**Entfernen archiviert den Punkt.** Er verschwindet aus den aktiven Checklisten und zählt nicht mehr als offene Aufgabe. **Archivierte Punkte** zeigt die erhaltenen Status und Notizen; **Wiederherstellen** aktiviert sie mit dem bisherigen Stand. Historische Nachweise werden nicht physisch gelöscht. Veraltete offene Formulare dürfen archivierte oder nicht mehr passende Nachweise nicht nachträglich überschreiben.

Die automatisch verknüpften Transponder- und Erste-Hilfe-Punkte behalten auch nach einer Umbenennung ihre Zuordnung. Ein archivierter Transponder-Punkt muss vor neuen Anforderungen wiederhergestellt werden.

## Versandstatus und Schutz vor Wiederholungen

Alle Texte enthalten den Hinweis auf eine automatische Nachricht mit der Bitte, nicht zu antworten. Wo das sendende Google-Konto es unterstützt, wird zusätzlich die No-Reply-Option verwendet.

**Verwaltungs-Mails → Versandstatus** zeigt vorgemerkte, gesendete und fehlerhafte Meldungen. Fehler oder ein unklarer Versandstatus werden nicht blind automatisch erneut versendet. Vor **Versand erneut versuchen** muss kontrolliert werden, ob die Mail möglicherweise bereits angekommen ist. MailApp bietet keine transaktionale Zustellgarantie; bei einem Ausfall genau zwischen Versand und Statusspeicherung kann die tatsächliche Zustellung unklar sein. Normales Bearbeiten und die regelmäßige Versandprüfung lösen dabei keinen automatischen zweiten Versand aus.

Empfänger und Versanddaten sind nur für die Administration sichtbar. Ausbilder, Teilnehmer und der Organisator können weder diese Adressen ändern noch fremde Verwaltungs-Mails erneut verschicken. Die vorhandenen Prüfungen für Ausbildungsbereiche gelten weiterhin. Es wurden keine echten Teilnehmerdaten verändert und keine produktiven Mails zum Prüfen verschickt.


## Mail-Buttons für Zeugkammer, Transponder und Erste Hilfe

Unter **Verwaltungs-Mails** gibt es zusätzlich die **Zeugkammer-Empfänger** (auch mehrere Adressen mit Komma). Beim neuen oder bestehenden Mitglied **Zeugkammer-Ausstattung anfordern (E-Mail)** anhaken und speichern, um eine Mail pro Mitglied mit offenen, aktuell gültigen Zeugkammer-Punkten anzufordern. Ohne Häkchen wird beim Speichern keine Zeugkammer-Mail verschickt. Sie enthält getrennte Buttons beispielsweise für **Dienstbekleidung erhalten** und **Einsatzbekleidung erhalten**. Jeder Button bestätigt nur den konkreten Punkt dieser Person.

Für bereits vorhandene Mitglieder kann die Administration unter **Verwaltungs-Mails → Zeugkammer-Mail für vorhandene Mitglieder** eine noch nicht versendete Anforderung gezielt starten. Bei bereits versendeten Anforderungen steht im Verlauf **Offene Bestätigungslinks neu senden** zur Verfügung. Das ersetzt die bisherigen Links und setzt keine bereits erledigten Punkte zurück. Normales Bearbeiten eines Mitglieds versendet keine zusätzliche Zeugkammer-Mail.

Die Transponder-Mail enthält **Transponder / Schlüssel ausgegeben bestätigen**. Nach erfolgreicher Bestätigung steht der vorhandene optionale Checklistenpunkt auf **Erledigt**; bisherige Notizen bleiben erhalten.

Die weitergeleitete **Erste-Hilfe-Mail mit PDF** enthält zwei getrennte Buttons:

- **Erste-Hilfe-Zertifikat abgelegt bestätigen** speichert die Ablagebestätigung für genau diesen Nachweis.
- **In FDISK eingetragen – Datum bestätigen** lässt das tatsächliche Eintragsdatum erfassen. Dieses wird im bestehenden Feld FDISK-Eintragungsdatum dokumentiert; ein bloßer Platzhalter wird aufgehoben. Der Kursnachweis bleibt fachlich ungeprüft, bis die Administration ihn wie bisher prüft. GAB-Freigaben, Kursabschlüsse, Quizversuche und bestehende Prüfnotizen werden durch diese Mail-Aktionen nicht verändert.

Ablage und FDISK-Eintrag erscheinen beim zugehörigen Erste-Hilfe-PDF getrennt grün. Der Teilnehmer sieht diese Angaben nur bei seinem eigenen Nachweis. Der Vorgang bestätigt eine bereits außerhalb der App durchgeführte Ablage oder FDISK-Eintragung; die App schreibt nichts direkt in das externe FDISK-System.

### Ablauf beim Empfänger

Der Mail-Button öffnet eine persönliche Bestätigungsseite. Sie zeigt nur die betreffende Person und Aufgabe. Mit **Als erledigt bestätigen** wird genau diese Aufgabe abgeschlossen; beim FDISK-Button muss vorher das tatsächliche Datum angegeben werden. Ein App-Konto ist dafür nicht erforderlich. Ein reines Öffnen des Mail-Links oder der Seite ändert keine Daten. Dadurch können automatische Mail-Linkprüfungen keine Ausgaben als erledigt markieren.

Die Links sind 30 Tage gültig, eng auf die jeweilige Aufgabe begrenzt und nach Verwendung nicht für eine später erneut geöffnete Aufgabe wiederverwendbar. Änderungen an der Empfängergruppe oder ein erneuter Versand mit neuen Links machen bisherige Links ungültig. Archivierte bzw. nicht mehr erforderliche Punkte und ersetzte oder abgelehnte Erste-Hilfe-Nachweise können nicht über alte Links bestätigt werden. Links sollten nur den vorgesehenen Empfängern zugänglich sein.

Alte, bereits vor dieser Version versendete Mails erhalten keine Buttons nachträglich. Bei Bedarf eine neue Ausgabe-Mail über den Verlauf anstoßen oder beim Erste-Hilfe-PDF **E-Mail erneut senden** verwenden. Dafür muss die neue Code.gs in der bestehenden Bereitstellung laufen; die neue Bestätigungsseite wird mit GitHub Pages veröffentlicht. Am Cloudflare Worker ist keine Änderung nötig, da die Aktionen über die vorhandene API-Weiterleitung laufen.

Die Link-Prüfung ist lesend. Erst die ausdrückliche Bestätigung verwendet einen einmaligen, serverseitig gehashten Berechtigungsnachweis. Der Prüf- und Bestätigungsaufruf liefert keinen allgemeinen Mitglieder-, Konto- oder Dokumentenzugriff. Abgelaufene Link-Berechtigungen werden bereinigt; vorhandene Ausbildungs- und Checklistennachweise bleiben erhalten. Bestätigungen werden als E-Mail-Link-Aktion mit Zeitpunkt protokolliert, ohne eine Anmeldung einer bestimmten Person vorzutäuschen.

## Zeugkammer-Auswahl beim Mitglied (1.13.14)

Unter **Mitglieder → Mitglied aufnehmen/bearbeiten** befindet sich neben den optionalen Transponder- und Blaulicht-Anforderungen das Häkchen **Zeugkammer-Ausstattung anfordern (E-Mail)**. Es löst beim Speichern gezielt die Anforderungsmail aus. Die bestehenden Punkte für Dienstbekleidung, Einsatzbekleidung und andere Aufgaben mit Zuständigkeit Zeugkammer werden wiederverwendet. Bereits erledigte Punkte und Notizen bleiben erhalten; nur offene Punkte erhalten Mailbuttons.

Das Häkchen ist ein Versandauftrag für diesen Speichervorgang und beim erneuten Öffnen wieder leer. Es steuert weder den Ausbildungsstand noch die Gültigkeit bestehender Bekleidungs-Checklisten. Ohne Häkchen entsteht keine neue Anforderungsmail; offene Aufgaben bleiben offen. Bereits versendete Mails werden auch bei erneutem Anhaken nicht automatisch wiederholt. Versandstatus und gezieltes Erneuern abgelaufener Links stehen weiterhin unter **Verwaltungs-Mails** zur Verfügung.

Empfänger sowie aktive Zeugkammer-Punkte müssen vor der Anforderung vorhanden sein. Das gilt für neue und bestehende Mitglieder beider Ausbildungsbereiche. Die Auswahl steht ausschließlich der Administration zur Verfügung. Ältere Oberflächen ohne Auswahl lösen beim Speichern ebenfalls keine automatische Zeugkammer-Mail mehr aus. Bisher vorgemerkte und bereits versendete Anforderungen sowie ihre gültigen Bestätigungslinks bleiben erhalten.

## Pager und Transponder: ausgegeben oder nicht erforderlich (1.13.14)

Unter **Verwaltungs-Mails** gibt es eine eigene Empfängergruppe **Pager – Ausgabe** mit bis zu 20 kommagetrennten Adressen. Unter **Mitglieder → Mitglied aufnehmen/bearbeiten** kann die Administration für einen GAB-Teilnehmer **Pager erforderlich** anhaken. Standesbuchnummer und Telefonnummer sind erforderlich. Der optionale Checklistenpunkt **Pager** wird nur den ausgewählten Mitgliedern zugeordnet; ein vorhandener Punkt mit diesem Namen wird wiederverwendet. Ursprünglicher Turnus, Ausbildungsnachweise, bestehende Erledigungen und Notizen bleiben erhalten.

Neue Pager-Mails enthalten pro Mitglied zwei Buttons: **Pager ausgegeben bestätigen** und **Pager nicht erforderlich bestätigen**. Auch neu versendete Transponder-Mails haben beide Möglichkeiten. Der jeweilige Mailbutton öffnet die persönliche Seite, auf der die Entscheidung nochmals ausdrücklich gespeichert wird. Bloßes Öffnen ändert keine Daten.

Die erste Bestätigung setzt nur den passenden Punkt dieses Mitglieds auf **Erledigt** beziehungsweise **Nicht erforderlich**. Nicht erforderlich dokumentiert keine erfolgte Ausgabe und zählt nicht als offene Aufgabe. Der andere Button zeigt anschließend das tatsächliche Ergebnis, ohne die Entscheidung zu überschreiben oder eine zweite Benachrichtigung auszulösen. Wird der Punkt durch die Administration später wieder geöffnet, können beide alten Links keine neue Entscheidung treffen; über **Offene Bestätigungslinks neu senden** wird eine neue Mail benötigt.

Gewöhnliches Speichern verschickt keine zweite Anforderung, und bereits dokumentierte Ausgaben werden durch die optionale Mitgliedsauswahl nicht zurückgesetzt. Alte empfangene Mails erhalten keine zusätzlichen Buttons: Für noch offene Transponder-Anforderungen nach dem GS-Update gezielt neue Bestätigungslinks senden. Die 30 Tage Gültigkeit, Empfängerbindung und Rollenbegrenzung bleiben bestehen. Für diese Änderungen ist kein neuer Cloudflare-Worker und keine neue Web-App-Adresse erforderlich.

## Aufnahme in die erweiterte Ausbildung und PDF-Mail-Auswahl (1.13.14)

Die vier Aufnahme-Häkchen **Transponder für Zugang**, **Pager**, **Blaulicht SMS/Lea** und **Zeugkammer-Ausstattung anfordern** stehen jetzt auch für Mitglieder mit ursprünglichem Turnus in der erweiterten Ausbildung zur Verfügung: in der normalen administrativen Mitgliedsverwaltung und unter **Erweiterte Ausbildung → Teilnehmer & Gäste → Neues Mitglied nur für die erweiterte Ausbildung anlegen**. Der Organisator darf diese Anforderungen für direkt angelegte erweiterte Mitglieder auslösen; bestehende persönliche GAB-Mitgliedsdaten von Gästen bleiben geschützt.

Die Empfänger werden weiterhin zentral durch die Administration unter **Verwaltungs-Mails** festgelegt. Der Organisator sieht nur, ob die jeweilige Empfängergruppe eingerichtet ist, sowie die eigenen erweiterten Aufnahme-Checklisten und deren Status. Er erhält weder die Empfängeradressen noch den GAB-Versandverlauf oder persönliche GAB-Checklisten von Gästen. Die Eingaben für Telefon und Standesbuchnummer sind erforderlich, sobald Transponder, Pager oder Blaulicht SMS/Lea angefordert werden.

Bereits vorhandene optionale Systempunkte werden unter unveränderter ID für beide Ausbildungsbereiche nutzbar gemacht, sobald eine entsprechende Anforderung gespeichert wird. Dafür wird lediglich ihr Bereich auf **Alle** erweitert; es werden keine anderen Mitglieder automatisch zugeordnet und keine bestehenden Erledigungen, Notizen, Turnusse oder Ausbildungsnachweise verändert. Die Zeugkammer verwendet weiterhin die vorhandenen Bekleidungs-Punkte, deren Zuständigkeit **Zeugkammer** und deren Bereich **Alle** oder **Erweiterte Ausbildung** sein muss. Die Mailtexte nennen den tatsächlichen Ausbildungsbereich.

**Tätigkeitsberichte:** Vor dem ersten Abschluss einer Ausbildung oder einer freien Tätigkeit gibt es das Häkchen **Fertiges PDF beim Abschluss per E-Mail versenden**, in beiden Ausbildungsbereichen für Administration, Ausbilder und Organisator. Bei konfigurierter Berichtsadresse ist es wie beim bisherigen automatischen Ablauf vorausgewählt und kann abgewählt werden. Ohne Häkchen wird der Bericht vollständig gespeichert, aber keine PDF-Mail vorgemerkt. Ohne konfigurierte Adresse ist die Auswahl deaktiviert. Spätere Korrekturen lösen keine zweite automatische Mail aus. Ältere Oberflächen ohne das neue Feld behalten den bisherigen automatischen Erstversand bei.

Alle früheren Funktionen einschließlich der zwei Mailentscheidungen für Pager/Transponder, Erste-Hilfe-/FDISK-Bestätigungen und der GAB-Ausbildungslogik bleiben enthalten. Code.gs vollständig ersetzen und die bestehende Web-App-Bereitstellung auf eine neue Version aktualisieren. Weder eine neue Datenbank noch eine neue Web-App-Adresse oder ein neuer Cloudflare-Worker sind erforderlich. Die GitHub-Seitenveröffentlichung muss erfolgreich abgeschlossen sein, damit die neuen Häkchen sichtbar werden.

## Verwaltungsübergabe und Bereichsrechte (1.13.14)

**Oberadmin:** Die bestehende Rolle Administrator behält Vollzugriff, Rollenverwaltung und Rollenvorschau. Nur der Oberadmin darf nach dem offiziellen GAB-Abschluss ein Mitglied zur vollständigen Verwaltung an die erweiterte Ausbildung überstellen. In **Qualifikationen → Mitglied** befindet sich dazu **In die erweiterte Verwaltung überstellen** mit Auswahl eines aktiven erweiterten Turnus. Der GAB-Abschluss muss vorab offiziell bestätigt und dokumentiert sein; die Überstellung ersetzt keine GAB-Abschlussprüfung.

**GAB-Teilnehmer als Gast:** Der erweiterte Organisator kann Namen auswählen und eine zusätzliche erweiterte Turnuszuordnung erfassen. Er sieht weiterhin nur Namen und die Daten der eigenen erweiterten Kurse, Anwesenheiten und Quiz. Telefonnummer, E-Mail, Geburtsdatum, persönliche GAB-Checklisten, GAB-Ergebnisse und GAB-Qualifikationsvermerke bleiben verborgen. Eine Gastzuordnung oder ein bestätigter GAB-Abschluss allein erteilt keine Stammdatenrechte.

**Eigene erweiterte Mitglieder:** Direkt für die erweiterte Ausbildung angelegte und ausdrücklich vom Oberadmin überstellte Mitglieder erscheinen unter **Teilnehmer & Gäste** mit **Bearbeiten**, **Einladungslink senden** beziehungsweise **Passwort-Reset senden**. Die erweiterte Leitung kann Namen, Kontaktdaten, Geburtsdatum, Standesbuchnummer und aktuellen erweiterten Turnus verwalten und die Aufnahme-Mails anfordern. E-Mail-Änderungen aktualisieren wie bisher den verknüpften Teilnehmerzugang; das vorhandene Passwort und die Nachweise bleiben erhalten. Passwort-Reset ist ausschließlich für die eigenen freigegebenen Teilnehmerkonten möglich, niemals für andere Rollen oder noch gesperrte GAB-Gäste.

Unter **Erweiterte Checklisten** kann der Organisator Punkte seines Bereichs anlegen, bearbeiten, archivieren und deren Erledigungen für eigene verwaltete Mitglieder pflegen. Globale Systempunkte und GAB-Checklisten können nicht durch ihn umdefiniert oder archiviert werden. Die bisher vorhandenen Funktionen für erweiterte Kurse, Kursprojekte, Quiz, Anwesenheiten, Qualifikationsübersicht, Abschlussbestätigung, Berichte, Nachrichten und Einladungen bleiben innerhalb seines Bereichs bestehen. Rollenverwaltung und fremde Profilvorschauen bleiben beim Oberadmin.

**Datenerhalt:** Die Überstellung überschreibt niemals Mitglieds-ID, ursprünglichen GAB-Turnus oder den damaligen Ausbildungsweg. Die aktuelle erweiterte Verwaltungszuordnung wird getrennt als protokollierte Freigabe in Script Properties gespeichert (`GA_ADV_TRANSFER_V1_`). Bestehende erweiterte Gastzuordnungen werden wiederverwendet. Bei späterem Wechsel des erweiterten Turnus bleiben ältere Zuordnungen bestehen, damit absolvierte Kurse, Anwesenheiten und bestandene Quiz im eigenen Ausbildungspass sichtbar und angerechnet bleiben. Es werden keine Quizversuche, Kurse, Nachweise oder Konten gelöscht oder zurückgesetzt.

**Freigabe zurückholen:** Der Oberadmin kann unter der Mitgliedsqualifikation **Verwaltung zurückholen** wählen. Das beendet ausschließlich die erweiterten Stammdatenrechte. Die Person bleibt als Kursgast zugeordnet; alle Nachweise und bisherigen Einträge bleiben erhalten. Beide Vorgänge werden mit verantwortlichem Benutzer und Zeitpunkt protokolliert. Die erweiterte Leitung erhält bei erstmaliger Überstellung eine Mitteilung; erneutes Speichern derselben Freigabe erzeugt keine weitere.

**Bereitstellung:** Die vollständige Code.gs 1.13.14 enthält sämtliche vorherigen Änderungen. Im bestehenden Projekt ersetzen und die bestehende Web-App-Bereitstellung auf eine neue Version aktualisieren. Dieselbe Datenbank und `/exec`-Adresse behalten. Die Oberfläche muss nach erfolgreicher GitHub-Pages-Veröffentlichung V1.13.14 anzeigen.

## Örtlichkeit, Ausbildernummern und kompakte PDFs (1.13.14)

Beim Ausbildungsabschluss befindet sich vor den Ist-Zeiten das Feld **Örtlichkeit der Schulung**. Der geplante Terminort ist vorausgefüllt, kann aber für den tatsächlichen Bericht geändert oder geleert werden. Die tatsächliche Örtlichkeit wird separat pro Bericht gespeichert; der geplante Terminort bleibt unverändert. Ältere Berichte ohne gespeicherte tatsächliche Örtlichkeit verwenden weiterhin ihren vorhandenen Terminort. Freie Tätigkeiten behalten ihr eigenes Ortsfeld, nun mit der Beschriftung **Örtlichkeit der Tätigkeit**.

Neben jedem Ausbilder steht bei der Berichtserfassung ein Feld **Stb.-Nr.**. Bei einer eindeutigen E-Mail-Zuordnung zum Mitgliederverzeichnis wird die vorhandene Nummer automatisch vorgeschlagen. Fehlende Nummern lassen sich direkt ergänzen. Die ausgewählten Ausbildernummern werden als Angaben dieses Berichts gespeichert; Mitglieder- und Benutzerkonten werden dadurch nicht verändert. Kursberichte, Modulübersichten, freie Tätigkeitsberichte und deren Mail-PDFs zeigen die Standesbuchnummer neben dem jeweiligen Ausbildernamen. Fehlt eine Nummer, wird dies ausdrücklich kenntlich gemacht statt eine Zuordnung anhand des Namens zu raten.

Nicht verwendete Fahrzeuge erzeugen im fertigen PDF keinen Fahrzeugabschnitt. Ohne positive Kilometer entfallen die Kilometer-Kennzahl und die Kilometer-Spalten. Wurden Fahrzeuge verwendet, aber nicht bewegt, werden die Fahrzeugnamen weiterhin dokumentiert; Kilometer können leer bleiben. Bei gemischten Fahrzeugen stehen tatsächliche Kilometer weiterhin korrekt im Bericht, während Nullwerte leer bleiben. Summen und Stunden bleiben unverändert. Die kompakte Darstellung gilt sowohl für einzelne Ausbildungsberichte als auch für Modulberichte und freie Tätigkeiten in beiden Ausbildungsbereichen.

Die Zusatzangaben liegen pro Bericht in privaten Script Properties (`GA_REPORT_META_V1_`), bleiben beim Bearbeiten erhalten und benötigen keine neue Datenbank, kein neues Tabellenblatt und keine Spaltenänderung. Alte Oberflächen ohne diese Zusatzfelder überschreiben bereits gespeicherte Angaben nicht. Die Daten sind ausschließlich für berechtigte Berichtsersteller sichtbar und bleiben aus Teilnehmeransichten ausgeschlossen. Bestehende Berichte können nach dem Update erneut geöffnet, ergänzt und neu als PDF heruntergeladen werden. Das Bearbeiten verschickt keine zweite automatische Mail.

Zur Aktivierung die vollständige Code.gs 1.13.14 im bestehenden Apps-Script-Projekt ersetzen und die bestehende Web-App-Bereitstellung auf **Neue Version** aktualisieren. App neu laden und das PDF neu erstellen. Bereits versendete PDF-Anhänge ändern sich dadurch nicht rückwirkend. Die Kennung des bestehenden Designs bleibt **FDISK-DESIGN-2**.
