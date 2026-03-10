# StudieReg - PRD (Product Requirements Document)

## Oorspronkelijke Opdracht
Webapp voor scholen waarmee leerkrachten leerlingen kunnen aanmelden voor studies en begeleidingsmomenten op school.

## Gebruikers & Rollen
- **Leerkracht:** Aanmelden, studies bekijken, capaciteit zien
- **Admin:** Alles beheren (klassen, studies, regels, momenten, e-mailtemplates, rapporten)
- **Opvoeder:** Aanwezigheden registreren, rapportage bekijken
- **Superadmin:** Beheert admins, kan leerlingenlijsten uploaden

## Tech Stack
- Frontend: React + TailwindCSS + Shadcn/UI
- Backend: FastAPI (Python)
- Database: MongoDB
- Auth: JWT

## Gerealiseerde Features

### V1.0 - Kern (Voltooid)
- JWT authenticatie met 4 rollen
- CRUD voor klassen, studietypes, beschikbaarheidsregels, studiemomenten
- Registratieflow voor leerkrachten met student-autocomplete
- Aanwezigheidsmodule voor opvoeders
- Rolgebaseerde dashboards en navigatie
- Studentenbeheer met Excel-import + Smartschool-import
- Visuele markering afwezige leerlingen

### V1.1 - Verbeteringen (Feb 2026)
- **Standaardtijden 16:00-17:00:** Alle nieuwe studietypes en regels krijgen standaard 16:00-17:00
- **Verwijderen vs. Deactiveren:** Vuilnisbak = echt verwijderen (met waarschuwing), oog-icoon = zichtbaarheid toggle. Geldt voor klassen, leerlingen, studietypes, beschikbaarheidsregels, studiemomenten
- **Uitsluitingsdata met specifieke studies:** Per datum specifieke studietypes uitsluiten, of alle studies bij geen selectie
- **Rapportagemodule uitgebreid:** 3 tabs (Overzicht, Per leerling, Per klas) met aanwezigheidspercentages, progress bars, CSV export (aanmeldingen + aanwezigheid). Toegankelijk voor opvoeders en admins

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
/app/backend/server.py    - Alle API endpoints
/app/frontend/src/
  hooks/useApi.js          - API hooks
  pages/admin/*.js         - Admin pagina's
  components/layout/*.js   - Sidebar, Layout
  context/AuthContext.js   - Auth context
```

## Credentials
- Superadmin: joachim.vaneckenrode@rhizo.be / superadmin123
