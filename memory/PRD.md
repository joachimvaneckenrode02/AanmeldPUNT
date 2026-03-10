# AanmeldPUNT - PRD (Product Requirements Document)

## Oorspronkelijke Opdracht
Webapp voor scholen waarmee leerkrachten leerlingen kunnen aanmelden voor studies en begeleidingsmomenten op school.

## Gebruikers & Rollen
- **Leerkracht:** Aanmelden, studies bekijken, meldingen ontvangen bij afwezigheid
- **Admin:** Alles beheren (klassen, studies, regels, momenten, rapporten)
- **Opvoeder:** Aanwezigheden registreren, rapportage bekijken
- **Superadmin:** Beheert admins, leerlingenlijsten uploaden, gebruikers verwijderen

## Tech Stack
- Frontend: React + TailwindCSS + Shadcn/UI
- Backend: FastAPI (Python)
- Database: MongoDB
- Auth: JWT

## Gerealiseerde Features

### V1.0 - Kern
- JWT authenticatie met 4 rollen
- CRUD voor klassen, studietypes, beschikbaarheidsregels, studiemomenten
- Registratieflow voor leerkrachten met student-autocomplete
- Aanwezigheidsmodule voor opvoeders
- Rolgebaseerde dashboards en navigatie
- Studentenbeheer met Excel-import + Smartschool-import

### V1.1 - Verbeteringen (Feb 2026)
- Standaardtijden 16:00-17:00
- Verwijderen vs. Deactiveren
- Uitsluitingsdata met specifieke studies
- Rapportagemodule (3 tabs, percentages, CSV export)

### V1.2 - Updates (Feb 2026)
- App hernoemd naar AanmeldPUNT
- Auto-generatie studiemomenten bij terugkerende regels
- Afwezigheidsmeldingen (Inbox) op dashboard
- Ingeschreven leerlingen bekijken in beschikbare studies
- Superadmin kan gebruikers verwijderen

### V1.3 - UX Verbeteringen (Feb 2026)
- **Opmerkingen bij aanwezigheid**: Notes van registratie zichtbaar bij opvoeder
- **Standaard aanwezig**: Aanwezigheid wordt automatisch op aanwezig gezet bij laden
- **Zoekfunctie aanwezigheid**: Zoek op naam/klas in het aanwezigheidstabblad
- **Meldingen pagina**: Dedicated /meldingen met filter Alles/Ongelezen
- **Meldingen sidebar link**: Bell-icoon in navigatie
- **Dashboard meldingen**: Verdwijnen na gelezen markeren
- **Sortering aanmeldingen**: Nieuwste aangemaakt bovenaan (createdAt desc)

## Backlog

### P0
- Automatische afwezigheidsmails (cron job)

### P1
- E-mailverzending activeren (momenteel GEMOCKT)

### P2
- Audit Logging implementeren
- Koppelingen externe systemen (Smartschool API, Google Workspace)

## Credentials
- Superadmin: joachim.vaneckenrode@rhizo.be / superadmin123
