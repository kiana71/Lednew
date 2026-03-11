# Technical Drawing Dashboard System

A comprehensive pre-stage dashboard system for managing technical drawings with modern UI, authentication, and scalable architecture.

![Dashboard Screenshot](https://via.placeholder.com/800x400/1e40af/ffffff?text=DimCast+Dashboard)

## 🚀 Features

- ✅ **User Authentication** - Secure login with session management
- ✅ **Drawing Management** - Create, read, update, and delete drawings
- ✅ **Global Search** - Search across all drawings by number, title, project, or client
- ✅ **Advanced Filtering** - Filter by status, date range, and tags
- ✅ **Responsive Design** - Works on desktop, tablet, and mobile
- ✅ **Statistics Dashboard** - Key metrics and activity overview
- ✅ **Modern UI** - Built with shadcn/ui components
- ✅ **Type Safety** - Full TypeScript implementation
- ✅ **Clean Architecture** - SOLID principles and design patterns

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Documentation](#documentation)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Development](#development)
- [Deployment](#deployment)
- [Contributing](#contributing)

## 🎯 Quick Start

### Demo Access

The application is running with mock data. Log in with:

- **Email**: `demo@example.com`
- **Password**: Any password (demo mode)

Other demo accounts:
- `john.doe@example.com` (Admin)
- `jane.smith@example.com` (User)

### Try These Features

1. **Search**: Search for "conference" or "LED display"
2. **Filter**: Click "Filters" to refine by status or date
3. **View Drawing**: Click any drawing card to open it
4. **Create New**: Click "New Drawing" button
5. **Statistics**: View metrics in the stats cards

## 📚 Documentation

Comprehensive documentation is available in the following files:

- **[QUICKSTART.md](./QUICKSTART.md)** - Get started in 5 minutes
- **[DOCUMENTATION.md](./DOCUMENTATION.md)** - Complete technical documentation
- **[DATABASE_SETUP.md](./DATABASE_SETUP.md)** - Database configuration guide

## 🏗️ Architecture

### Design Patterns

- **Repository Pattern** - Abstract data access layer
- **Context API** - Global state management
- **Custom Hooks** - Reusable business logic
- **Component Composition** - Modular UI components

### Data Flow

```
User Interaction
      ↓
  Custom Hook
      ↓
  Service Layer
      ↓
   Data Source (Mock → Google Sheets → Database)
```

### Component Hierarchy

```
App
├── AuthProvider (Authentication Context)
│   └── RouterProvider (React Router)
│       ├── LoginPage
│       ├── DashboardView
│       │   ├── DashboardHeader
│       │   ├── StatsOverview
│       │   ├── SearchBar
│       │   └── DrawingGrid
│       │       └── DrawingCard (x N)
│       └── DrawingStudio
```

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **React Router 7** - Routing
- **Tailwind CSS 4** - Styling
- **shadcn/ui** - Component library

### Utilities
- **date-fns** - Date formatting
- **lucide-react** - Icons
- **sonner** - Toast notifications

### Build Tools
- **Vite** - Build tool
- **PostCSS** - CSS processing

## 📁 Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── auth/              # Authentication components
│   │   │   └── LoginPage.tsx
│   │   ├── dashboard/         # Dashboard components
│   │   │   ├── DashboardHeader.tsx
│   │   │   ├── DashboardView.tsx
│   │   │   ├── DrawingCard.tsx
│   │   │   ├── DrawingGrid.tsx
│   │   │   ├── SearchBar.tsx
│   │   │   └── StatsOverview.tsx
│   │   ├── studio/            # Drawing studio
│   │   │   └── DrawingStudio.tsx
│   │   ├── ui/                # shadcn components
│   │   └── ProtectedRoute.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx    # Authentication context
│   ├── hooks/
│   │   ├── useDrawings.ts     # Drawing management hook
│   │   └── useSearch.ts       # Search management hook
│   ├── services/
│   │   └── DataService.ts     # Data access layer
│   ├── types/
│   │   └── index.ts           # TypeScript types
│   ├── utils/
│   │   └── migration.ts       # Data migration utilities
│   ├── App.tsx                # Root component
│   ├── routes.tsx             # Route configuration
│   └── config.ts              # App configuration
└── styles/                    # CSS files
```

## 💻 Development

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

Dependencies are already installed. The app should be running automatically.

### Development Commands

```bash
# Build for production
npm run build

# Type checking
npx tsc --noEmit

# Format code
npx prettier --write src/
```

### Environment Variables

Create `.env.local` for custom configuration:

```env
VITE_DATA_SOURCE=mock
VITE_API_ENDPOINT=http://localhost:3000
```

## 🔧 Configuration

### Feature Flags

Enable/disable features in `/src/app/config.ts`:

```typescript
export const config: AppConfig = {
  features: {
    inventoryManagement: false,  // Coming soon
    advancedSearch: true,         // Enabled
    collaboration: false,         // Coming soon
    versionControl: false,        // Coming soon
    exportToPDF: false,          // Coming soon
  },
  dataSource: 'mock',
};
```

### Data Source

Change data source by updating `dataSource` in config:

- `'mock'` - In-memory data (current)
- `'googleSheets'` - Google Sheets integration (implement)
- `'database'` - PostgreSQL/MongoDB (implement)

## 🚢 Deployment

### Build for Production

```bash
npm run build
```

Output will be in `dist/` directory.

### Deploy to Vercel

```bash
npx vercel deploy
```

### Deploy to Netlify

```bash
npx netlify deploy --prod
```

### Environment Variables (Production)

Set these in your hosting platform:

```
VITE_DATA_SOURCE=database
VITE_API_ENDPOINT=https://api.yourdomain.com
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 🗄️ Database Setup

### Quick Setup with Supabase

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL schema from [DATABASE_SETUP.md](./DATABASE_SETUP.md)
3. Update environment variables
4. Change `dataSource` to `'database'` in config

### PostgreSQL Setup

See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for detailed instructions on:

- PostgreSQL installation
- Schema creation
- Row Level Security
- Data migration from Google Sheets

## 🔄 Data Migration

### From Google Sheets to Database

```typescript
import { MigrationManager } from './utils/migration';
import { createDataService } from './services/DataService';

const manager = new MigrationManager();
const targetService = createDataService('database');

// Read your Google Sheets data
const sheetsData = [...]; // Your CSV data

// Migrate
const log = await manager.migrateDrawings(sheetsData, targetService);
console.log(manager.generateReport(log));
```

### Export to CSV

```typescript
import { CSVExporter } from './utils/migration';

const csv = CSVExporter.exportDrawings(drawings);
CSVExporter.downloadCSV(csv, 'drawings.csv');
```

## 🧪 Testing

### Unit Tests (Example)

```typescript
import { render, screen } from '@testing-library/react';
import { DrawingCard } from './DrawingCard';

test('renders drawing title', () => {
  const drawing = {
    id: '1',
    title: 'Test Drawing',
    // ... other fields
  };
  
  render(<DrawingCard drawing={drawing} />);
  expect(screen.getByText('Test Drawing')).toBeInTheDocument();
});
```

### Integration Tests (Example)

```typescript
test('search functionality works', async () => {
  render(<DashboardView />);
  
  const searchInput = screen.getByPlaceholderText(/search/i);
  fireEvent.change(searchInput, { target: { value: 'conference' } });
  
  await waitFor(() => {
    expect(screen.getByText(/conference/i)).toBeInTheDocument();
  });
});
```

## 🔮 Future Enhancements

### Planned Features

- [ ] **Inventory Management** - Screens, mounts, media players
- [ ] **Real-time Collaboration** - Multi-user editing
- [ ] **Version Control** - Drawing history and rollback
- [ ] **Export to PDF** - Generate PDF reports
- [ ] **Template Library** - Pre-built drawing templates
- [ ] **Bulk Operations** - Multi-select and batch actions
- [ ] **Advanced Analytics** - Usage reports and insights
- [ ] **Mobile App** - Native iOS/Android apps

### Plugin Architecture

The system is designed to support plugins:

```typescript
// Example: Add a new module
import { InventoryModule } from './modules/inventory';

app.registerModule(new InventoryModule());
```

## 📝 API Documentation

### Custom Hooks

#### useDrawings

```typescript
const {
  drawings,        // Current drawings
  loading,         // Loading state
  error,           // Error message
  createDrawing,   // Create function
  updateDrawing,   // Update function
  deleteDrawing,   // Delete function
  searchDrawings,  // Search function
} = useDrawings();
```

#### useAuth

```typescript
const {
  user,            // Current user
  isAuthenticated, // Auth status
  login,           // Login function
  logout,          // Logout function
} = useAuth();
```

### Data Service Interface

```typescript
interface IDataService {
  getDrawings(params: PaginationParams): Promise<ApiResponse<SearchResult<Drawing>>>;
  getDrawingById(id: string): Promise<ApiResponse<Drawing>>;
  createDrawing(drawing: Partial<Drawing>): Promise<ApiResponse<Drawing>>;
  updateDrawing(id: string, updates: Partial<Drawing>): Promise<ApiResponse<Drawing>>;
  deleteDrawing(id: string): Promise<ApiResponse<void>>;
  searchDrawings(filters: SearchFilters, params: PaginationParams): Promise<ApiResponse<SearchResult<Drawing>>>;
}
```

## 🤝 Contributing

### Guidelines

1. Follow the existing code style
2. Write TypeScript types for all components
3. Add JSDoc comments for functions
4. Test your changes thoroughly
5. Update documentation as needed

### Code Style

- Use functional components with hooks
- Follow Single Responsibility Principle
- Keep components under 300 lines
- Use descriptive variable names
- Add comments for complex logic

## 📄 License

Proprietary - Internal Use Only

## 🙋 Support

For questions or issues:

1. Check [DOCUMENTATION.md](./DOCUMENTATION.md)
2. Review [QUICKSTART.md](./QUICKSTART.md)
3. Contact the development team

## 🎉 Credits

Built with:
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Vite](https://vitejs.dev/)

---

**Version**: 1.0.0  
**Last Updated**: February 13, 2026  
**Status**: Production Ready ✅
