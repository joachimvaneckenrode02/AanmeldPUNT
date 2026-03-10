# AanmeldPUNT - PRD (Product Requirements Document)

## Oorspronkelijke Opdracht
Webapp voor scholen waarmee leerkrachten leerlingen kunnen aanmelden voor studies en begeleidingsmomenten op school. Voorheen "StudieReg", nu hernoemd naar **AanmeldPUNT**.

## Gebruikers & Rollen
- **Leerkracht:** Aanmelden, studies bekijken, capaciteit zien, afwezigheidsmeldingen
- **Admin:** Alles beheren (klassen, studies, regels, momenten, e-mailtemplates, rapporten)
- **Opvoeder:** Aanwezigheden registreren, rapportage bekijken
- **Superadmin:** Beheert admins, kan leerlingenlijsten uploaden, gebruikers verwijderen

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
- Visuele markering afwezige leerlingen

### V1.1 - Verbeteringen (Feb 2026)
- Standaardtijden 16:00-17:00
- Verwijderen vs. Deactiveren (vuilnisbak = hard delete, oog = toggle actief)
- Uitsluitingsdata met specifieke studies
- Rapportagemodule (3 tabs, aanwezigheidspercentages, CSV export)

### V1.2 - Updates (Feb 2026)
- **App hernoemd naar AanmeldPUNT**
- **Auto-generatie studiemomenten**: Bij aanmaken/bewerken van terugkerende regels worden automatisch ALLE momenten gegenereerd voor de volledige geldigheidsperiode
- **Genereer-knop zonder datums**: Datums zijn nu optioneel, standaard wordt de volledige geldigheidsperiode van elke regel gebruikt
- **Afwezigheidsmeldingen (Inbox)**: Leerkrachten zien op hun dashboard een nieuwsfeed/inbox met meldingen wanneer hun aangemelde leerlingen afwezig waren. Meldingen zijn markeerbaar als gelezen
- **Ingeschreven leerlingen bekijken**: Bij beschikbare studies kan je nu de lijst van ingeschreven leerlingen uitklappen per moment
- **Superadmin kan gebruikers verwijderen**: Hard delete van gebruikers (met bevestigingsdialoog)
- **Volzette momenten zichtbaar**: Volle momenten worden niet meer gefilterd uit de beschikbare lijst

## Backlog

### P0
- Automatische afwezigheidsmails (cron job) - dagelijks leerkrachten mailen over afwezige leerlingen

### P1
- E-mailverzending activeren (momenteel GEMOCKT) - echte service (Resend/SendGrid)

### P2
- Audit Logging implementeren (model bestaat, schrijflogica ontbreekt)
- Koppelingen met externe systemen (Smartschool API, Google Workspace)

## Architectuur
```
/app/backend/server.py    - Alle API endpoints + auto_generate_moments_for_rule helper
/app/frontend/src/
  hooks/useApi.js          - API hooks (incl. notifications, deleteUser)
  pages/admin/*.js         - Admin pagina's
  pages/Dashboard.js       - Met afwezigheidsfeed/inbox
  pages/AvailableStudies.js - Met expandable registraties
  components/layout/*.js   - Sidebar (AanmeldPUNT), Layout
  context/AuthContext.js   - Auth context
```

## Credentials
- Superadmin: joachim.vaneckenrode@rhizo.be / superadmin123
