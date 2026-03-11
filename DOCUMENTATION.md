# Technical Drawing Dashboard System Documentation

## Overview

This is a comprehensive pre-stage dashboard system for managing technical drawings. Built with React, TypeScript, and shadcn/ui components, it provides a modern, scalable solution that can transition from mock data to a production database.

## Table of Contents

1. [Architecture](#architecture)
2. [Getting Started](#getting-started)
3. [Component Library](#component-library)
4. [Data Layer](#data-layer)
5. [Authentication](#authentication)
6. [Search & Filtering](#search--filtering)
7. [Database Migration](#database-migration)
8. [API Documentation](#api-documentation)
9. [Future Enhancements](#future-enhancements)

---

## Architecture

### Design Patterns

The application follows industry-standard design patterns:

- **Repository Pattern**: Abstract data access layer for easy migration
- **Context API**: Global state management for authentication
- **Custom Hooks**: Reusable business logic
- **Component Composition**: Modular, maintainable UI components

### Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── auth/
│   │   │   └── LoginPage.tsx
│   │   ├── dashboard/
│   │   │   ├── DashboardHeader.tsx
│   │   │   ├── DashboardView.tsx
│   │   │   ├── DrawingCard.tsx
│   │   │   ├── DrawingGrid.tsx
│   │   │   └── SearchBar.tsx
│   │   ├── studio/
│   │   │   └── DrawingStudio.tsx
│   │   ├── ui/
│   │   │   └── [shadcn components]
│   │   └── ProtectedRoute.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── hooks/
│   │   ├── useDrawings.ts
│   │   └── useSearch.ts
│   ├── services/
│   │   └── DataService.ts
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   └── migration.ts
│   ├── App.tsx
│   └── routes.tsx
└── styles/
    └── [CSS files]
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

All dependencies are already installed. The application is ready to run.

### Running the Application

The application should be running automatically in development mode. If not:

```bash
npm run build
```

### Demo Accounts

Use these credentials to log in (any password works):

- john.doe@example.com (Admin)
- jane.smith@example.com (User)
- demo@example.com (User)

---

## Component Library

### Authentication Components

#### LoginPage

Handles user authentication with form validation.

**Location**: `/src/app/components/auth/LoginPage.tsx`

**Props**: None (uses AuthContext)

**Usage**:
```tsx
import { LoginPage } from './components/auth/LoginPage';

<LoginPage />
```

### Dashboard Components

#### DashboardHeader

Navigation header with user menu and branding.

**Location**: `/src/app/components/dashboard/DashboardHeader.tsx`

**Props**: None (uses AuthContext)

#### SearchBar

Advanced search with filtering capabilities.

**Location**: `/src/app/components/dashboard/SearchBar.tsx`

**Props**:
```typescript
interface SearchBarProps {
  onSearch: (filters: SearchFilters) => void;
  isSearching?: boolean;
}
```

**Features**:
- Text search
- Status filtering
- Date range selection
- Real-time filter display
- Clear filters functionality

#### DrawingCard

Individual drawing card with preview and actions.

**Location**: `/src/app/components/dashboard/DrawingCard.tsx`

**Props**:
```typescript
interface DrawingCardProps {
  drawing: Drawing;
  onOpen?: (drawing: Drawing) => void;
  onEdit?: (drawing: Drawing) => void;
  onDelete?: (drawing: Drawing) => void;
  onDuplicate?: (drawing: Drawing) => void;
}
```

#### DrawingGrid

Responsive grid layout for drawings.

**Location**: `/src/app/components/dashboard/DrawingGrid.tsx`

**Props**:
```typescript
interface DrawingGridProps {
  drawings: Drawing[];
  loading?: boolean;
  onOpen?: (drawing: Drawing) => void;
  onEdit?: (drawing: Drawing) => void;
  onDelete?: (drawing: Drawing) => void;
  onDuplicate?: (drawing: Drawing) => void;
  onNewDrawing?: () => void;
}
```

**Features**:
- Loading states with skeletons
- Empty state with call-to-action
- Responsive grid (1-4 columns)

#### DashboardView

Main dashboard container.

**Location**: `/src/app/components/dashboard/DashboardView.tsx`

**Features**:
- Drawing management
- Search integration
- View mode switching (grid/list)
- Delete confirmation dialog

### Studio Components

#### DrawingStudio

Canvas-based drawing editor (integration point).

**Location**: `/src/app/components/studio/DrawingStudio.tsx`

**Features**:
- Header with navigation and actions
- Canvas area for drawing integration
- Drawing data loading

---

## Data Layer

### DataService Interface

Abstract interface for data operations, allowing seamless migration between data sources.

**Location**: `/src/app/services/DataService.ts`

**Interface**:
```typescript
interface IDataService {
  // Drawings
  getDrawings(params: PaginationParams): Promise<ApiResponse<SearchResult<Drawing>>>;
  getDrawingById(id: string): Promise<ApiResponse<Drawing>>;
  createDrawing(drawing: Omit<Drawing, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Drawing>>;
  updateDrawing(id: string, updates: Partial<Drawing>): Promise<ApiResponse<Drawing>>;
  deleteDrawing(id: string): Promise<ApiResponse<void>>;
  searchDrawings(filters: SearchFilters, params: PaginationParams): Promise<ApiResponse<SearchResult<Drawing>>>;
  
  // Users
  getUserById(id: string): Promise<ApiResponse<User>>;
  getUserByEmail(email: string): Promise<ApiResponse<User>>;
  
  // Auth
  authenticate(email: string, password: string): Promise<ApiResponse<User>>;
  validateToken(token: string): Promise<ApiResponse<User>>;
}
```

### Creating a New Data Source

To implement a new data source (e.g., PostgreSQL):

1. Create a new class implementing `IDataService`
2. Add it to the factory function in `DataService.ts`
3. Update the configuration

Example:

```typescript
class PostgreSQLDataService implements IDataService {
  // Implement all methods
}

export function createDataService(source: 'mock' | 'googleSheets' | 'database') {
  switch (source) {
    case 'database':
      return new PostgreSQLDataService();
    // ...
  }
}
```

---

## Authentication

### AuthContext

Provides authentication state and methods throughout the application.

**Location**: `/src/app/contexts/AuthContext.tsx`

**API**:
```typescript
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}
```

**Usage**:
```tsx
import { useAuth } from './contexts/AuthContext';

function Component() {
  const { user, login, logout } = useAuth();
  
  // Use auth state and methods
}
```

### Protected Routes

Use `ProtectedRoute` to secure routes:

```tsx
import { ProtectedRoute } from './components/ProtectedRoute';

<Route path="/dashboard" element={
  <ProtectedRoute>
    <DashboardView />
  </ProtectedRoute>
} />
```

---

## Search & Filtering

### useSearch Hook

Custom hook for managing search state with debouncing.

**Location**: `/src/app/hooks/useSearch.ts`

**API**:
```typescript
const {
  filters,
  debouncedFilters,
  isSearching,
  setQuery,
  setDateRange,
  setCreatedBy,
  setStatus,
  setTags,
  clearFilters,
  hasActiveFilters,
} = useSearch({
  debounceMs: 300,
  onSearch: (filters) => {
    // Handle search
  },
});
```

### Search Filters

Available filter options:

```typescript
interface SearchFilters {
  query?: string;                    // Text search
  dateRange?: { start: Date; end: Date; };  // Date range
  createdBy?: string[];              // User IDs
  status?: ('draft' | 'in-review' | 'approved' | 'archived')[];
  tags?: string[];
}
```

---

## Database Migration

### Database Schema

Recommended PostgreSQL schema:

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

-- Drawings table
CREATE TABLE drawings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drawing_number VARCHAR(100) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) NOT NULL,
  metadata JSONB,
  canvas_data JSONB,
  tags TEXT[]
);

-- Inventory items (future)
CREATE TABLE inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL,
  alias VARCHAR(255) NOT NULL,
  model VARCHAR(255) NOT NULL,
  manufacturer VARCHAR(255),
  dimensions JSONB,
  size_in_inch DECIMAL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Migration Utilities

**Location**: `/src/app/utils/migration.ts`

#### GoogleSheetsMapper

Maps between Google Sheets rows and application objects:

```typescript
// Import from Google Sheets
const drawing = GoogleSheetsMapper.mapToDrawing(row);

// Export to Google Sheets
const row = GoogleSheetsMapper.mapFromDrawing(drawing);
```

#### MigrationManager

Handles bulk migration:

```typescript
const manager = new MigrationManager();

// Migrate from Google Sheets
const log = await manager.migrateDrawings(sheetsData, databaseService);

// Generate report
const report = manager.generateReport(log);
```

#### CSVExporter

Export drawings to CSV:

```typescript
const csv = CSVExporter.exportDrawings(drawings);
CSVExporter.downloadCSV(csv, 'drawings.csv');
```

---

## API Documentation

### Custom Hooks

#### useDrawings

Manages drawing data and operations.

**Location**: `/src/app/hooks/useDrawings.ts`

**API**:
```typescript
const {
  drawings,              // Current drawings
  total,                 // Total count
  loading,              // Loading state
  error,                // Error message
  pagination,           // Pagination params
  loadDrawings,         // Load/refresh
  createDrawing,        // Create new
  updateDrawing,        // Update existing
  deleteDrawing,        // Delete
  searchDrawings,       // Search with filters
  changePage,           // Change page
  changePageSize,       // Change page size
  changeSort,           // Change sorting
  refresh,              // Refresh current view
} = useDrawings({
  autoLoad: true,
  initialPageSize: 12,
});
```

#### useDrawing

Fetches a single drawing by ID.

**Location**: `/src/app/hooks/useDrawings.ts`

**API**:
```typescript
const { drawing, loading, error } = useDrawing(drawingId);
```

---

## Future Enhancements

### Inventory Management Module

Prepared schema and types for inventory items:

- Screens
- Mounts
- Media Players
- Receptacle Boxes

**Implementation Steps**:

1. Create inventory service extending `IDataService`
2. Build inventory components (similar to drawings)
3. Add inventory routes to router
4. Integrate with drawing studio for drag-and-drop

### Collaboration Features

- Real-time editing
- Comments and annotations
- Version history
- User presence indicators

### Advanced Features

- Export to PDF
- Template library
- Bulk operations
- Advanced reporting
- Activity logs

---

## Configuration

### Feature Flags

Enable/disable features using configuration:

```typescript
const config: AppConfig = {
  features: {
    inventoryManagement: false,
    advancedSearch: true,
    collaboration: false,
    versionControl: false,
    exportToPDF: false,
  },
  dataSource: 'mock', // 'mock' | 'googleSheets' | 'database'
  apiEndpoint: 'https://api.example.com',
};
```

---

## Testing

### Unit Tests

Test individual components and hooks:

```typescript
import { render, screen } from '@testing-library/react';
import { DrawingCard } from './DrawingCard';

test('renders drawing card with title', () => {
  const drawing = { /* mock drawing */ };
  render(<DrawingCard drawing={drawing} />);
  expect(screen.getByText(drawing.title)).toBeInTheDocument();
});
```

### Integration Tests

Test complete workflows:

```typescript
test('user can search and filter drawings', async () => {
  // 1. Render dashboard
  // 2. Enter search query
  // 3. Apply filters
  // 4. Verify results
});
```

---

## Deployment

### Environment Variables

Required for production:

```env
VITE_API_ENDPOINT=https://api.production.com
VITE_DATA_SOURCE=database
VITE_AUTH_ENABLED=true
```

### Build for Production

```bash
npm run build
```

Output will be in `dist/` directory.

---

## Support & Maintenance

### Key Files to Monitor

- `/src/app/services/DataService.ts` - Data layer
- `/src/app/types/index.ts` - Type definitions
- `/src/app/routes.tsx` - Routing configuration

### Common Tasks

**Add a new drawing field**:
1. Update `Drawing` type in `/src/app/types/index.ts`
2. Update mock data generator in `DataService.ts`
3. Update `DrawingCard` component to display field
4. Update search filters if needed

**Add a new route**:
1. Create component
2. Add route to `/src/app/routes.tsx`
3. Add navigation link if needed

**Change data source**:
1. Implement new service class
2. Update factory function
3. Update configuration

---

## License

Proprietary - Internal Use Only

---

## Contact

For questions or support, contact the development team.
