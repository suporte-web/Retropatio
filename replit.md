# APP PIZZATTIO LOG - Sistema de Controle de Pátio e Portaria

## Overview

A comprehensive web-based system designed for managing vehicle and visitor entry/exit in logistics yards. Rebranded as PIZZATTIO LOG with signature red/orange/yellow branding. Features RBAC user profiles, multi-branch operations, real-time tracking, detailed reporting with time-in-vaga calculations, TV display for driver calls, and enhanced analytics. The system aims to enhance operational efficiency and security in logistics environments.

## User Preferences

- I prefer simple language and clear explanations.
- I like functional programming paradigms where appropriate.
- I want an iterative development approach, with frequent updates and feedback loops.
- Please ask for my approval before implementing major architectural changes or refactoring large portions of the codebase.
- I prefer detailed explanations for complex features or decisions.
- Do not make changes to the `shared/schema.ts` file without explicit instruction.
- Ensure all new features include `data-testids` for E2E testing.

## System Architecture

The system is built on a modern full-stack architecture.

- **Frontend**: React, TypeScript, Tailwind CSS, Shadcn UI for a consistent and responsive design supporting dark mode.
- **Backend**: Express.js, TypeScript.
- **Database**: PostgreSQL (Neon) with Drizzle ORM.
- **Real-time Communication**: WebSockets (`ws`) for instant updates on vehicle movements, visitor status, and calls.
- **Authentication**: Session-based authentication using Passport.js, JWTs with access and refresh tokens, scrypt for password hashing, and brute-force protection.
- **Authorization**: Role-Based Access Control (RBAC) with "Porteiro" (Gatekeeper), "Cliente" (Client), and "Gestor/Admin" (Manager/Admin) roles. Multi-tenant architecture with logical data isolation per branch using a `filialId` field.
- **UI/UX**: Emphasis on readability with the Inter font, clear hierarchy, and PIZZATTIO branding color scheme (Primary: Red #EF4444, Secondary: Orange #F97316, Accent: Yellow #FDE047, Success: Green, Warning: Yellow/Orange, Danger: Red).
- **Core Features**:
    - **Portaria Control**: Vehicle entry/exit registration with various categories (Carro, Moto, Cavalo, Cavalo + Carreta), owner types (Terceiro, Agregado, Frota), and load statuses (Carregado, Descarregado, Pernoite, Manutenção). Conditional fields and mobile-responsive forms for self-registration.
    - **Vaga Map**: Real-time visualization of 20 parking spots per branch, showing Free/Occupied status.
    - **Visitor Management**: Registration, approval workflow, and entry/exit tracking for visitors and service providers.
    - **Call System**: Driver notification and status tracking (Pendente, Atendida, Cancelada).
    - **TV Display**: Public display page for driver calls with black background and PIZZATTIO gradient colors, designed for warehouse TV monitors with auto-refresh.
    - **Reporting**: Comprehensive movimentation reports with 10+ filters (transportadora, motorista, placa, vaga, status carga, tipo proprietário, observações), time-in-vaga calculation, CSV and PDF export with PIZZATTIO branding, and full audit history.
    - **Audit System**: Comprehensive logging of all critical actions, including user, timestamp, branch, action type, affected entity, before/after data (JSON), IP, and User Agent.
    - **Notification System**: Real-time notifications for managers via polling, with unread counts, status management (read/unread), and branch-specific isolation.
    - **Administrative Modules**: CRUD functionalities for Drivers, Registered Vehicles, Suppliers, Custom Truck Statuses, and Vagas (Parking Spots), all with multi-tenant isolation, Zod validation, and automatic audit logging.
    - **Vagas Administration**: Dedicated administrative interface for gestores to create, edit, and delete parking spots across all authorized filials. Features include statistics dashboard, filtering by search and filial, prevention of deletion for occupied spots, and cross-filial management using custom X-Filial headers.
    - **Analytical Dashboard**: Bar charts for daily movements, pie charts for status distribution, average stay time metrics with real-time updates, and individual vehicle duration tracking.
    - **Digital Checklist System**: Database schema created for managing checklists per vehicle and individual items, supporting various types and photo uploads (under development).

## External Dependencies

- **PostgreSQL (Neon)**: Primary database for all application data.
- **WebSockets (`ws`)**: Used for real-time communication and updates across the application.
- **Passport.js**: Authentication middleware.
- **Drizzle ORM**: Object-Relational Mapper for database interactions.
- **React Query**: Used for data fetching, caching, and synchronization in the frontend.
- **Zod**: Schema validation library for both frontend and backend.
- **date-fns**: Library for date formatting (specifically PT-BR locale).
- **Recharts**: Charting library used for analytical dashboard visualizations.

## Multi-Tenant Security Architecture (Updated October 2025)

The system implements comprehensive multi-tenant data isolation across all routes:

### Security Layers
1. **Authentication**: JWT-based session authentication (requireAuth middleware)
2. **Authorization**: Role-based access control (requireRole middleware)
3. **Filial Permission Validation**: requireFilial middleware validates X-Filial header against user's authorized filials
4. **Header-Based Multi-Tenancy**: All GET routes use validated X-Filial header instead of URL parameters
5. **Entity-Level Verification**: All PATCH/DELETE routes verify entity.filialId matches req.filialId before allowing modifications
6. **Filial Reassignment Prevention**: All PATCH routes strip filialId from req.body to prevent cross-tenant data manipulation

### API Security Pattern
All tenant-scoped routes follow this pattern:
```typescript
app.get("/api/entity", requireAuth, requireRole("role"), requireFilial, async (req, res) => {
  const filialId = (req as any).filialId; // Validated by middleware
  const data = await storage.getByFilial(filialId);
  res.json(data);
});

app.patch("/api/entity/:id", requireAuth, requireRole("role"), requireFilial, async (req, res) => {
  const filialId = (req as any).filialId;
  const entity = await storage.get(req.params.id);
  
  if (!entity) return res.status(404).json({ error: "Not found" });
  if (entity.filialId !== filialId) return res.status(403).json({ error: "Access denied" });
  
  const { filialId: _, ...updateData } = req.body; // Strip filialId
  const updated = await storage.update(req.params.id, updateData);
  res.json(updated);
});
```

### Recent Security & Feature Updates (October-November 2025)

✅ **PIZZATTIO Rebranding** (November 3, 2025):
   - Complete visual rebrand from blue to PIZZATTIO signature colors
   - Primary: Red #EF4444 (HSL: 0 91% 57%)
   - Secondary: Orange #F97316, Accent: Yellow #FDE047
   - Updated all pages including login, reports, TV display
   - Logo integrated into login page with black background and gradient
   - PDF exports now use red headers matching brand identity
   - Dark mode support maintained with new color palette

✅ **TV Display for Driver Calls** (November 3, 2025):
   - New public display page at `/tv-display` for warehouse monitors
   - Black background with PIZZATTIO red/orange/yellow gradient
   - Shows pending driver calls with placa, motorista, and motivo
   - Auto-refresh every 30 seconds + WebSocket real-time updates
   - Large, high-contrast text designed for TV visibility
   - Animated pulse effects on call cards

✅ **Enhanced Reporting System** (November 3, 2025):
   - Added 10+ comprehensive filters: transportadora, motorista, placa, vaga, status carga, tipo proprietário, observações, data range
   - Tempo na vaga calculation (days, hours, minutes) for all vehicles
   - Fixed vaga filter to correctly compare vagaId
   - Time display in cards, CSV exports, and PDF reports
   - PDF export header color updated to PIZZATTIO red
   - Improved UX with clear filter sections

✅ **Dashboard Analytics Improvements** (November 3, 2025):
   - Enhanced "Tempo Médio na Vaga" card with better formatting (shows days if >= 24h)
   - Added count of finalized vehicles used in average calculation
   - Real-time duration updates every 60 seconds for active vehicles
   - Individual vehicle duration display with Timer icon in recent activity
   - Accurate Math.floor formatting (no rounding errors)

✅ **WebSocket Filial Filtering**: WebSocket connections now track filialId per client and broadcasts are filtered by target filial
   - filialId extracted from WebSocket URL query parameter during connection
   - All 9 broadcast calls updated to include targetFilialId parameter
   - Query invalidations include filialId for proper cache updates
   - Resolves cross-tenant data exposure in real-time events

✅ **Portaria UX Enhancements**:
   - Quick-selection cards for Vehicle/Visitor operations with real-time statistics
   - Visitor approval toast notifications (5-second duration)
   - **Simplified Vehicle Entry Forms** (October 31, 2025):
     - **Carro/Moto**: Only 7 fields shown (tipo veículo, tipo motorista visitante/funcionário, placa, motorista, CPF opcional, vaga, observações)
     - **Cavalo/Cavalo+Carreta**: All 14+ fields maintained (tipo proprietário, status carga, transportadora, cliente, doca, valor, multi, etc)
     - Automatic field cleanup when switching between light and heavy vehicles to prevent data leakage
     - CPF validation: Optional for carro/moto, required for cavalo/cavalo+carreta
     - tipoMotorista (visitante/funcionário) stored in observações field for light vehicles
   - **Timestamp and Document Fields** (November 3, 2025):
     - **Data/Hora de Entrada**: Fixed readonly field showing current timestamp in entrada form (format: dd/MM/yyyy HH:mm)
     - **Data/Hora de Saída**: Fixed readonly field showing current timestamp in saída dialog
     - **Saída Dialog**: Comprehensive exit dialog with vehicle info display, editable CTE/NF/LACRE fields
     - **Document Pre-fill**: CTE/NF/LACRE from entrada are pre-filled in saída dialog for easy updates
     - **Backend Update**: registrarSaida method accepts optional dadosAdicionais {cte, nf, lacre} parameter
     - **Controlled State**: All saída inputs use controlled state with onChange handlers
     - All timestamp fields have bg-muted class and are non-editable for record integrity

✅ **User Permissions Management**:
   - New administrative interface for managing user-filial permissions
   - Gestores can assign/remove filial access for any user
   - Dialog-based interface showing current permissions and available filials
   - Routes: GET/POST `/api/users/:userId/permissions`, DELETE `/api/user-permissions/:id`
   - Storage method `getUserPermissions()` returns permissions with filial details via join

✅ **Vagas Administration System** (November 3, 2025):
   - **Full CRUD Interface**: Dedicated administrative page at `/vagas-admin` for gestores
   - **Statistics Dashboard**: Real-time cards showing Total Vagas, Vagas Livres, Vagas Ocupadas, and Filiais count
   - **Cross-Filial Management**: Gestores can create, edit, and delete vagas for all their authorized filiais
   - **Smart Filtering**: Search by número/descrição and filter by specific filial
   - **Multi-Tenant Security**: 
     - GET `/api/vagas/all` filters results by getUserFilialIds (shows only authorized filiais)
     - POST/PATCH/DELETE use X-Filial custom headers for cross-filial operations
     - Backend validates filial ownership and permissions on all operations
     - Prevents deletion of occupied vagas (status !== "Livre")
   - **Enhanced apiRequest**: Modified queryClient to accept customHeaders (4th parameter) for X-Filial overrides
   - **Real-time Updates**: WebSocket broadcasts on create/update/delete with automatic query invalidation
   - **Comprehensive Audit**: All CRUD operations logged with user, filial, timestamp, and change details
   - **Data Testids**: Full coverage for E2E testing (buttons, inputs, dialogs, table rows)

✅ **Previous Security Fixes**:
   - Fixed all parameterized GET routes to use header-based filialId
   - Added entity ownership verification to all PATCH/DELETE routes
   - Implemented filialId stripping in all PATCH handlers
   - Added requireFilial middleware to all tenant-scoped routes
   - Fixed /api/veiculos/all to respect filial isolation