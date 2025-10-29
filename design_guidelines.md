# APP RETROPATIO - Design Guidelines

## Design Approach

**Selected System**: Material Design + Linear-inspired minimalism for operational dashboards
**Rationale**: Logistics operations require clear information hierarchy, quick data scanning, and reliable interaction patterns. Material Design provides robust components for data-heavy interfaces, while Linear's clean aesthetic ensures the UI doesn't overwhelm operators during long shifts.

**Core Principles**:
- Operational Clarity: Every element serves a functional purpose
- Scannable Information: Data tables and status indicators must be immediately readable
- Consistent Patterns: Reduce cognitive load with predictable interactions
- Real-time Awareness: Clear visual feedback for live updates

---

## Typography System

**Font Family**: Inter (via Google Fonts CDN) - excellent legibility for data-dense interfaces

**Hierarchy**:
- Page Titles: text-3xl, font-bold (e.g., "Controle de Portaria")
- Section Headers: text-xl, font-semibold (e.g., "Veículos no Pátio")
- Card/Panel Titles: text-lg, font-medium
- Body Text: text-base, font-normal (forms, descriptions)
- Data Labels: text-sm, font-medium, uppercase, tracking-wide
- Table Data: text-sm, font-normal
- Metadata/Timestamps: text-xs, font-normal

---

## Layout System

**Spacing Primitives**: Consistent use of Tailwind units: 2, 4, 6, 8, 12, 16, 24
- Component padding: p-4 or p-6
- Section gaps: gap-6 or gap-8
- Page margins: px-6 lg:px-8
- Card spacing: space-y-4

**Grid Structure**:
- Dashboard Layout: Sidebar (w-64) + Main Content (flex-1)
- Responsive: Collapsible sidebar on mobile (hamburger menu)
- Max-width containers: max-w-7xl mx-auto for content areas

---

## Navigation & Layout Structure

**Top Navigation Bar** (h-16, fixed):
- Logo/Brand (left)
- Current Branch indicator with dropdown (center-left)
- User profile menu with role badge (right)
- Notification bell icon with unread count badge (right)

**Sidebar Navigation** (persistent on desktop, collapsible on mobile):
- Grouped by user role
- Active state: subtle highlight, border-l-4 accent
- Icon + label pattern using Heroicons
- Bottom section: Settings, Help, Logout

**Main Content Area**:
- Page header with breadcrumbs
- Action toolbar (filters, export, primary actions)
- Content grid or table

---

## Component Library

### Dashboard Cards
- Rounded corners: rounded-lg
- Elevation: shadow-sm with hover:shadow-md transition
- Padding: p-6
- Structure: Header with title + action menu, body content, optional footer

### Status Badges
- Pill shape: rounded-full, px-3, py-1, text-xs font-medium
- States: "Livre" (success), "Ocupado" (warning), "Aguardando" (neutral), "Aprovado" (info)
- Use semantic meaning without color references

### Data Tables
- Zebra striping for rows
- Sticky header: sticky top-0 with backdrop blur
- Row hover state for interactivity
- Compact mode: py-2 for dense data
- Action column (right-aligned) with icon buttons

### Forms
- Grouped in sections with subtle dividers
- Label above input: text-sm font-medium mb-1
- Input fields: rounded-md border, px-3 py-2, focus:ring-2 transition
- Required fields: asterisk indicator
- Inline validation messages below fields
- Form actions: Right-aligned button group (Cancel + Submit)

### Mapa de Vagas (Vacancy Map)
- Grid layout representing dock positions
- Each slot: Aspect square card with large slot number
- Visual states: Empty (outline), Occupied (filled), Selected (highlight)
- Click interaction for slot selection
- Real-time pulse animation on status change (subtle)

### Modal Dialogs
- Overlay: backdrop-blur-sm
- Modal: max-w-2xl, rounded-xl, p-6
- Header: text-lg font-semibold with close button
- Footer: Button group (right-aligned)

### Notification Toast
- Fixed position: top-4 right-4
- Auto-dismiss after 5s
- Icon + message + dismiss button
- Slide-in animation from right

### Real-time Indicators
- Pulsing dot icon for live updates
- "Atualizado há X minutos" timestamp in metadata style
- Subtle flash animation on new data arrival

---

## Page-Specific Layouts

### Login Page
- Centered card: max-w-md mx-auto, mt-32
- Logo above form
- Email and password fields stacked
- "Esqueci minha senha" link below
- Full-width submit button
- Error messages inline above button

### Seleção de Filial
- Grid of branch cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3, gap-6
- Each card: Branch name, address, status indicator
- Search/filter bar above grid
- Selected state: ring-2 highlight

### Portaria (Gate Control)
- Two-column layout: Form (left, w-1/3) + Mapa de Vagas (right, w-2/3)
- Tabbed interface: "Nova Entrada" | "Saída" | "Histórico Hoje"
- Sticky action bar at bottom of form
- Live activity feed in sidebar showing recent entries/exits

### Cliente Dashboard
- Summary cards row: grid-cols-4 showing key metrics (Veículos Ativos, Pendentes, etc.)
- Main content: Tabbed view (Movimentações | Relatórios | Chamadas)
- Filtros panel: Collapsible sidebar with filter options

### Gestor/Admin
- Tab navigation: "Usuários" | "Filiais" | "Permissões" | "Auditoria"
- Data table as primary content
- Floating action button (+) for new entries
- Bulk actions toolbar appears on row selection

### Relatórios
- Filter panel (top): Inline form fields in row
- Export buttons: CSV, PDF icons with labels
- Results table with pagination
- Empty state: Centered illustration + helpful text

---

## Responsive Behavior

**Breakpoints**:
- Mobile: < 768px (single column, hamburger menu, stacked forms)
- Tablet: 768px-1024px (sidebar collapsible, 2-column grids)
- Desktop: > 1024px (full sidebar, multi-column layouts)

**Mobile Optimizations**:
- Bottom navigation bar for primary actions
- Swipeable cards for vacancy map
- Simplified table views (cards instead of tables)
- Floating action button for primary actions

---

## Icons
**Library**: Heroicons (via CDN)
- Outline style for navigation and secondary actions
- Solid style for status indicators and primary buttons

---

## Accessibility
- All form inputs include visible labels
- Focus states: ring-2 with offset
- Keyboard navigation fully supported
- ARIA labels for icon-only buttons
- Skip to main content link
- Sufficient contrast ratios throughout

---

## Images
No hero images required for this operational dashboard. Focus on data visualization and functional UI elements. Avatars for user profiles should use initials or placeholder icons from Heroicons.