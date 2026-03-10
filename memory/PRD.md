# StudieReg - School Study Registration System

## Original Problem Statement
Build a complete, production-ready web application for Flemish schools where teachers can register students for study sessions (Inhaalstudie, Werkstudie, Strafstudie, Leerlabo with subtypes, Begeleide studie). Three user roles with role-based access control.

## Architecture
- **Frontend**: React with Shadcn/UI components, TailwindCSS
- **Backend**: FastAPI with MongoDB
- **Authentication**: JWT-based with bcrypt password hashing
- **Design**: "Academic Clarity" theme - Academic Slate (#2E5C5A), Warm Paper, Burnt Clay accent

## User Personas
1. **Leerkracht (Teacher)**: Registers students for study sessions, views own registrations
2. **Admin**: Full access - manages classes, study types, availability rules, users, reports
3. **Opvoeder (Educator)**: Tracks attendance for study sessions

## Core Requirements (Static)
- Dutch language interface
- Mobile-responsive design
- Role-based access control
- Study registration with capacity validation
- Duplicate registration prevention
- Attendance tracking per study moment
- Email templates prepared (mocked)
- Excel import for classes
- Reporting and CSV export

## What's Been Implemented
**2026-03-10: MVP Complete**
- Full authentication system (register/login)
- Dashboard with stats
- Student registration form with validations
- Available studies overview with capacity
- My registrations with cancel option
- Attendance module with present/absent buttons
- Admin modules: Classes, Study Types, Availability Rules, Exclusion Dates, Email Templates, Registrations, Reports, Users
- Seed data functionality
- Study moments generation from rules

## Prioritized Backlog
### P0 (Critical)
- ✅ Authentication & roles
- ✅ Registration flow
- ✅ Availability/capacity logic
- ✅ Admin module

### P1 (Important)
- ✅ Attendance module
- ✅ Reporting
- ⬜ Email service integration (prepared, needs provider)

### P2 (Nice to have)
- ⬜ Scheduled absence email job (cron)
- ⬜ Smartschool API integration
- ⬜ Multi-tenant support
- ⬜ Parent communication module

## Next Tasks
1. Configure email provider (SendGrid/Resend) when ready
2. Implement scheduled job for absence notifications
3. Add Smartschool integration
4. Implement advanced reporting with charts
