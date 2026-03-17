# AanmeldPUNT - PRD

## Oorspronkelijke Opdracht
Webapp voor scholen waarmee leerkrachten leerlingen kunnen aanmelden voor studies en begeleidingsmomenten.

## Rollen
- **Leerkracht:** Aanmelden, studies bekijken, meldingen
- **Admin:** Alles beheren
- **Opvoeder:** Aanwezigheden + manueel toevoegen + berichten naar leerkracht
- **Superadmin:** Rollenbeheer, import, gebruikers verwijderen

## Gerealiseerde Features

### V1.0-1.2 (Eerder voltooid)
- JWT auth, CRUD klassen/studies/regels/momenten
- Registratieflow met autocomplete, aanwezigheidsmodule
- Excel + Smartschool import, rolgebaseerde dashboards
- Delete vs deactivate, uitsluitingsdata per studietype
- Rapportage (percentages, CSV), standaardtijden 16:00-17:00
- Auto-generatie momenten, AanmeldPUNT branding
- Meldingen pagina + sidebar, ingeschreven leerlingen bekijken

### V1.3 - UX (Feb 2026)
- Opmerkingen bij aanwezigheid, standaard aanwezig, zoekfunctie
- Sortering nieuwste eerst

### V1.4 - Aanwezigheidsmodule Uitgebreid (Feb 2026)
- **3 statussen**: Aanwezig / Afwezig / Ziek (knoppen per leerling)
- **Reden afwezigheid**: Vrij tekstveld bij afwezig/ziek
- **Bericht naar leerkracht**: Opvoeder kan info doorgeven aan de leerkracht
- **Manueel leerlingen toevoegen**: Opvoeder voegt walk-ins toe met autocomplete
- **Meldingen verrijkt**: Ziek (thermometer) vs afwezig (X), reden + opvoederbericht zichtbaar
- **Dashboard**: Ongelezen meldingen met educator notes in blauw

## Backlog
### P0
- Automatische afwezigheidsmails (cron job)
### P1
- E-mailverzending activeren (GEMOCKT)
### P2
- Audit Logging, externe koppelingen

## Credentials
- Superadmin: joachim.vaneckenrode@rhizo.be / superadmin123
