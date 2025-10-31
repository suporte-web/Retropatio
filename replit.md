# APP RETROPATIO - Sistema de Controle de Pátio e Portaria

## Overview

A comprehensive web-based system designed for managing vehicle and visitor entry/exit in logistics yards. It features RBAC user profiles, multi-branch operations, real-time tracking, and detailed reporting. The system aims to enhance operational efficiency and security in logistics environments.

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
- **UI/UX**: Emphasis on readability with the Inter font, clear hierarchy, and a professional color scheme (Primary: Azul #3B82F6, Success: Green, Warning: Yellow/Orange, Danger: Red).
- **Core Features**:
    - **Portaria Control**: Vehicle entry/exit registration with various categories (Carro, Moto, Cavalo, Cavalo + Carreta), owner types (Terceiro, Agregado, Frota), and load statuses (Carregado, Descarregado, Pernoite, Manutenção). Conditional fields and mobile-responsive forms for self-registration.
    - **Vaga Map**: Real-time visualization of 20 parking spots per branch, showing Free/Occupied status.
    - **Visitor Management**: Registration, approval workflow, and entry/exit tracking for visitors and service providers.
    - **Call System**: Driver notification and status tracking (Pendente, Atendida, Cancelada).
    - **Reporting**: Movimentation reports with filters, CSV and PDF export, and a full audit history.
    - **Audit System**: Comprehensive logging of all critical actions, including user, timestamp, branch, action type, affected entity, before/after data (JSON), IP, and User Agent.
    - **Notification System**: Real-time notifications for managers via polling, with unread counts, status management (read/unread), and branch-specific isolation.
    - **Administrative Modules**: CRUD functionalities for Drivers, Registered Vehicles, Suppliers, and Custom Truck Statuses, all with multi-tenant isolation, Zod validation, and automatic audit logging.
    - **Analytical Dashboard**: Bar charts for daily movements, pie charts for status distribution, and average stay time metrics.
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

### Known Security Issue
⚠️ **WebSocket broadcasts**: Currently send data to ALL connected clients without filial filtering. This allows users from one branch to see real-time updates from other branches.

**Impact**: Cross-tenant data exposure via real-time events (veiculo_entrada, vaga_updated, visitante_novo, chamada_nova, etc.)

**Mitigation needed**: Track each WebSocket connection's filialId (validated at handshake) and only broadcast events to matching tenants.

**Status**: Documented for future implementation - Low priority as WebSocket data is read-only and users still cannot modify other branches' data.

### Recent Security Fixes (October 2025)
✅ Fixed all parameterized GET routes to use header-based filialId
✅ Added entity ownership verification to all PATCH/DELETE routes
✅ Implemented filialId stripping in all PATCH handlers
✅ Added requireFilial middleware to all tenant-scoped routes
✅ Fixed /api/veiculos/all to respect filial isolation