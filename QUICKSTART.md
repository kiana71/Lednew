# Quick Start Guide

Get up and running with the Technical Drawing Dashboard in minutes.

## Demo Access

The application is running with mock data. You can immediately:

### 1. Log In

Use any of these demo accounts (any password works):

- **john.doe@example.com** - Admin user
- **jane.smith@example.com** - Standard user  
- **demo@example.com** - Demo user

### 2. Explore the Dashboard

After logging in, you'll see:

- **6 sample drawings** with various statuses (draft, in-review, approved)
- **Search functionality** - Try searching for "conference" or "LED"
- **Filters** - Filter by status, date range, or tags
- **Drawing cards** - Hover over cards to see actions

### 3. Try Key Features

#### Search & Filter
1. Use the search bar to find drawings by title, number, or project name
2. Click "Filters" to refine by status or date range
3. Active filters appear as badges below the search bar

#### View a Drawing
1. Click on any drawing card
2. Or click the "..." menu and select "Open"
3. You'll see the Drawing Studio (integration point for your drawing tool)

#### Create New Drawing
1. Click "New Drawing" button
2. This opens a blank canvas in the studio
3. Your existing drawing application can be integrated here

#### Manage Drawings
- **Edit**: Update drawing details
- **Delete**: Remove a drawing (with confirmation)
- **Duplicate**: Create a copy (coming soon)
- **Export**: Download drawing (coming soon)

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│              Login Page                          │
│         (Email + Password)                       │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│           Main Dashboard                         │
│  ┌──────────────────────────────────────────┐  │
│  │  Header (User Menu, Navigation)          │  │
│  ├──────────────────────────────────────────┤  │
│  │  Search Bar (with Advanced Filters)      │  │
│  ├──────────────────────────────────────────┤  │
│  │  Drawing Grid                            │  │
│  │  ┌────────┐ ┌────────┐ ┌────────┐       │  │
│  │  │ Card 1 │ │ Card 2 │ │ Card 3 │  ...  │  │
│  │  └────────┘ └────────┘ └────────┘       │  │
│  └──────────────────────────────────────────┘  │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│           Drawing Studio                         │
│  ┌──────────────────────────────────────────┐  │
│  │  Studio Header (Save, Export, Settings)  │  │
│  ├──────────────────────────────────────────┤  │
│  │                                          │  │
│  │     Canvas Area (Your Drawing Tool)      │  │
│  │                                          │  │
│  │    [Integration Point - See Image]       │  │
│  │                                          │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

## Key Components

### Data Flow

```
User Action → Hook → Service Layer → Data Source
                                      ↓
                                  Mock Data
                                  Google Sheets (future)
                                  Database (future)
```

### Component Hierarchy

```
App
├── AuthProvider (Context)
│   └── RouterProvider
│       ├── LoginPage
│       ├── DashboardView
│       │   ├── DashboardHeader
│       │   ├── SearchBar
│       │   └── DrawingGrid
│       │       └── DrawingCard (multiple)
│       └── DrawingStudio
```

## File Structure

```
src/app/
├── components/
│   ├── auth/
│   │   └── LoginPage.tsx          # Authentication interface
│   ├── dashboard/
│   │   ├── DashboardHeader.tsx    # Navigation & user menu
│   │   ├── DashboardView.tsx      # Main dashboard container
│   │   ├── DrawingCard.tsx        # Individual drawing display
│   │   ├── DrawingGrid.tsx        # Responsive grid layout
│   │   └── SearchBar.tsx          # Search & filter UI
│   ├── studio/
│   │   └── DrawingStudio.tsx      # Drawing editor (integration point)
│   └── ui/                        # shadcn components
├── contexts/
│   └── AuthContext.tsx            # Authentication state
├── hooks/
│   ├── useDrawings.ts             # Drawing data management
│   └── useSearch.ts               # Search state & debouncing
├── services/
│   └── DataService.ts             # Abstract data layer
├── types/
│   └── index.ts                   # TypeScript definitions
├── utils/
│   └── migration.ts               # Data migration utilities
├── App.tsx                        # Root component
├── routes.tsx                     # Route configuration
└── config.ts                      # App configuration
```

## Common Tasks

### Add a New User

Currently using mock data. To add a user:

1. Open `/src/app/services/DataService.ts`
2. Find `generateMockUsers()` method
3. Add a new user object:

```typescript
{
  id: 'user-4',
  email: 'newuser@example.com',
  name: 'New User',
  role: 'user',
  createdAt: new Date('2024-04-01'),
  lastLogin: new Date(),
}
```

### Customize Search Filters

Edit `/src/app/components/dashboard/SearchBar.tsx`:

```typescript
// Add new filter option
const [customFilter, setCustomFilter] = useState('');

// Include in search filters
const filters: SearchFilters = {
  query,
  status,
  dateRange,
  customField: customFilter || undefined,
};
```

### Change Page Size

Edit `/src/app/hooks/useDrawings.ts`:

```typescript
const { drawings } = useDrawings({
  initialPageSize: 24, // Change from 12 to 24
});
```

### Modify Drawing Card Display

Edit `/src/app/components/dashboard/DrawingCard.tsx` to show/hide fields:

```typescript
// Add a new field display
{drawing.metadata.customField && (
  <div className="text-xs text-muted-foreground">
    <span className="font-medium">Custom:</span> {drawing.metadata.customField}
  </div>
)}
```

## Integration with Existing Drawing Tool

Your existing DimCast drawing application can be integrated into the `DrawingStudio` component:

### Step 1: Import Your Drawing Component

```typescript
import { YourDrawingCanvas } from './path-to-your-component';
```

### Step 2: Replace Placeholder

In `/src/app/components/studio/DrawingStudio.tsx`:

```typescript
<main className="flex-1 overflow-hidden">
  <YourDrawingCanvas
    drawingData={drawing}
    onSave={(data) => {
      // Save using updateDrawing from useDrawings
    }}
  />
</main>
```

### Step 3: Connect Save Functionality

```typescript
import { useDrawings } from '../../hooks/useDrawings';

function DrawingStudio() {
  const { id } = useParams();
  const { drawing } = useDrawing(id);
  const { updateDrawing } = useDrawings({ autoLoad: false });

  const handleSave = async (canvasData) => {
    await updateDrawing(id, {
      canvasData,
      updatedAt: new Date(),
    });
  };

  return (
    <YourDrawingCanvas
      initialData={drawing?.canvasData}
      onSave={handleSave}
    />
  );
}
```

## Next Steps

### Immediate (No Code Required)

1. **Try all features** - Explore search, filters, and drawing cards
2. **Test authentication** - Try logging in/out with different users
3. **Review code structure** - Familiarize yourself with the architecture

### Short Term (Minimal Code)

1. **Customize branding** - Update colors, logo, and app name
2. **Add custom fields** - Extend Drawing type with your fields
3. **Integrate drawing tool** - Connect your existing canvas application

### Medium Term (Backend Setup)

1. **Set up database** - Follow [DATABASE_SETUP.md](./DATABASE_SETUP.md)
2. **Implement authentication** - Add real auth with JWT or OAuth
3. **Deploy to production** - Host on Vercel, Netlify, or your server

### Long Term (Feature Development)

1. **Add inventory management** - Screens, mounts, media players
2. **Enable collaboration** - Real-time editing, comments
3. **Build reporting** - Analytics, usage stats, export options

## Troubleshooting

### Issue: White screen after login

**Solution**: Check browser console for errors. Likely a routing issue.

```typescript
// Verify routes.tsx has all paths defined
export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/dashboard" /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/dashboard', element: <ProtectedRoute><DashboardView /></ProtectedRoute> },
]);
```

### Issue: Search not working

**Solution**: Check if `searchDrawings` is being called:

```typescript
// In DashboardView.tsx
const { searchDrawings } = useDrawings();

<SearchBar onSearch={searchDrawings} />
```

### Issue: Drawings not loading

**Solution**: Verify DataService is initialized:

```typescript
// In DataService.ts
export const dataService = createDataService('mock');
```

## Support

For detailed documentation, see:

- **[DOCUMENTATION.md](./DOCUMENTATION.md)** - Complete technical documentation
- **[DATABASE_SETUP.md](./DATABASE_SETUP.md)** - Database configuration guide

## Tips & Best Practices

### Performance

- Use pagination for large datasets
- Implement debouncing for search (already included)
- Add loading states for better UX (already included)

### Security

- Never store passwords in plain text
- Use environment variables for sensitive data
- Implement proper authentication before production

### Code Quality

- Follow TypeScript types strictly
- Write tests for critical functionality
- Keep components small and focused (Single Responsibility)

### User Experience

- Always show loading states
- Provide clear error messages
- Confirm destructive actions (delete)

---

**Ready to start?** Log in with `demo@example.com` and explore the dashboard!

For questions or issues, refer to the main documentation or contact the development team.
