# Verwaltungs-Mails, Tätigkeitsberichte und Checklisten – 1.13.7

## Bestehendes System aktualisieren

Die vollständige Code.gs 1.13.7 enthält den bisherigen Stand einschließlich Ausbilder-Bereichsauswahl, Quiz-Anrechnung, Gültigkeitsdaten, E-Mail-Änderung, GAB- und erweiterten Abschlussnachrichten. Keine neue Datenbank, keine geänderten Mitgliedsnummern und keine neue Web-App-Adresse verwenden.

1. Code.gs im bestehenden Apps-Script-Projekt vollständig ersetzen und speichern.
2. Einmal **gaVerwaltungsMailEinrichten** ausführen und die erforderlichen Berechtigungen zulassen. Alternativ das bestehende Google Sheet neu öffnen und **Grundausbildung → 9 · Verwaltungs-Mail-Trigger einrichten** wählen. Das richtet ausschließlich die Versandprüfung ein; es verschickt selbst keine Nachricht und legt keine neuen Datenbanktabellen oder Prüfdaten an.
3. **Bereitstellen → Bereitstellungen verwalten → bestehende Web-App bearbeiten → Neue Version → Bereitstellen**. Die vorhandene `/exec`-Adresse beibehalten.
4. App neu laden beziehungsweise die installierte PWA schließen und erneut öffnen. Die Oberfläche zeigt V1.13.7, der statische Cache heißt ga-shell-v2.44.
5. Als Administrator unter **Verwaltungs-Mails** die Empfänger für die drei Kategorien hinterlegen und speichern. Jede Kategorie kann eine oder mehrere Adressen haben. Mehrere Adressen mit Komma trennen, beispielsweise `ausbildung@example.test, verwaltung@example.test`. Pro Kategorie sind bis zu 20 Adressen möglich; doppelte Adressen werden innerhalb der Liste entfernt. Bereits gespeicherte Einzeladressen bleiben unverändert gültig. Ein leeres Feld deaktiviert diese Kategorie. Beim Speichern wird ein fehlender Versandtrigger ebenfalls eingerichtet; vorherige Autorisierung über Schritt 2 vermeidet Berechtigungsfehler.

GitHub Pages aktualisiert nur die Oberfläche und die veröffentlichte Backend-Quelldatei, nicht die laufende Apps-Script-Bereitstellung.

## Transponder für Zugang

Unter **Mitglieder → Mitglied aufnehmen** lässt sich für einen GAB-Teilnehmer **Transponder für Zugang erforderlich** anhaken. Für eine vollständige Anforderung müssen Standesbuchnummer und Telefonnummer hinterlegt sein. Dafür wird ein optionaler Checklistenpunkt erstellt und nur diesem Mitglied als offen zugeordnet. Mitglieder ohne Häkchen bekommen diesen Punkt nicht automatisch.

Die Mail enthält den Text „Dieses Mitglied wurde in die Grundausbildung aufgenommen und benötigt noch einen Transponder“, Name, Standesbuchnummer, Telefonnummer, E-Mail und Turnus. Ein späteres Speichern oder erneutes Anhaken nach bereits bestätigtem Versand erzeugt keine weitere Anforderungsmail. Die tatsächliche Ausgabe des Transponders wird unter Checklisten als erledigt bestätigt; dieser Nachweis wird beim Bearbeiten des Mitglieds nicht zurückgesetzt.

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
