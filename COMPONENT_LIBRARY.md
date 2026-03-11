# Component Library Documentation

Complete reference for all custom components in the Technical Drawing Dashboard.

## Table of Contents

- [Authentication Components](#authentication-components)
- [Dashboard Components](#dashboard-components)
- [Studio Components](#studio-components)
- [Utility Components](#utility-components)
- [Usage Examples](#usage-examples)

---

## Authentication Components

### LoginPage

**Path**: `/src/app/components/auth/LoginPage.tsx`

Full-featured login page with form validation and demo account quick access.

**Features**:
- Email/password authentication
- Form validation
- Loading states
- Error handling
- Demo account buttons

**Dependencies**:
- useAuth hook
- shadcn Button, Input, Label, Card, Alert components

**Usage**:
```tsx
import { LoginPage } from './components/auth/LoginPage';

function App() {
  return <LoginPage />;
}
```

**Props**: None (uses AuthContext)

**Styling**: 
- Full-height centered layout
- Gradient background
- Responsive card design

---

## Dashboard Components

### DashboardHeader

**Path**: `/src/app/components/dashboard/DashboardHeader.tsx`

Navigation header with branding, user information, and dropdown menu.

**Features**:
- Branding/logo display
- User avatar with initials
- Dropdown menu (Profile, Settings, Sign Out)
- User role display

**Props**: None (uses AuthContext)

**Usage**:
```tsx
import { DashboardHeader } from './components/dashboard/DashboardHeader';

<DashboardHeader />
```

**Customization**:
```tsx
// Change logo in the component
<div className="size-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
  D
</div>
```

---

### StatsOverview

**Path**: `/src/app/components/dashboard/StatsOverview.tsx`

Statistics cards showing key metrics about drawings.

**Features**:
- Total drawings count
- Status breakdown (Draft, In Review, Approved)
- Recent activity (last 7 days)
- Color-coded icons

**Props**:
```typescript
interface StatsOverviewProps {
  drawings: Drawing[];  // Array of drawings to analyze
}
```

**Usage**:
```tsx
import { StatsOverview } from './components/dashboard/StatsOverview';

<StatsOverview drawings={drawings} />
```

**Customization**:
```tsx
// Add new stat card
const cards = [
  ...existingCards,
  {
    title: 'Custom Metric',
    value: customValue,
    icon: CustomIcon,
    color: 'text-custom-600',
    bgColor: 'bg-custom-100',
  },
];
```

---

### SearchBar

**Path**: `/src/app/components/dashboard/SearchBar.tsx`

Advanced search bar with filtering capabilities.

**Features**:
- Text search with Enter key support
- Advanced filters (Status, Date Range)
- Active filter badges
- Clear all filters
- Loading state

**Props**:
```typescript
interface SearchBarProps {
  onSearch: (filters: SearchFilters) => void;
  isSearching?: boolean;
}
```

**Usage**:
```tsx
import { SearchBar } from './components/dashboard/SearchBar';

<SearchBar
  onSearch={(filters) => handleSearch(filters)}
  isSearching={loading}
/>
```

**Filters Supported**:
```typescript
interface SearchFilters {
  query?: string;
  status?: ('draft' | 'in-review' | 'approved' | 'archived')[];
  dateRange?: { start: Date; end: Date };
  tags?: string[];
}
```

**Customization Examples**:

Add a new filter type:
```tsx
// 1. Add state
const [priority, setPriority] = useState<string[]>([]);

// 2. Add UI in PopoverContent
<div className="space-y-2">
  <label className="text-sm font-medium">Priority</label>
  <div className="flex gap-2">
    {['high', 'medium', 'low'].map((p) => (
      <Badge
        key={p}
        variant={priority.includes(p) ? 'default' : 'outline'}
        onClick={() => togglePriority(p)}
      >
        {p}
      </Badge>
    ))}
  </div>
</div>

// 3. Include in filters
const filters: SearchFilters = {
  ...existingFilters,
  priority: priority.length > 0 ? priority : undefined,
};
```

---

### DrawingCard

**Path**: `/src/app/components/dashboard/DrawingCard.tsx`

Individual drawing card with preview, metadata, and action menu.

**Features**:
- Thumbnail preview with fallback
- Hover overlay with "Open" button
- Status badge with color coding
- Tags display (max 2 + count)
- Dropdown menu (Open, Edit, Duplicate, Export, Delete)
- Project/client information
- Created by and updated date

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

**Usage**:
```tsx
import { DrawingCard } from './components/dashboard/DrawingCard';

<DrawingCard
  drawing={drawing}
  onOpen={handleOpen}
  onEdit={handleEdit}
  onDelete={handleDelete}
  onDuplicate={handleDuplicate}
/>
```

**Customization Examples**:

Change status colors:
```tsx
const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  'in-review': 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  archived: 'bg-slate-100 text-slate-800',
  // Add custom statuses
  urgent: 'bg-red-100 text-red-800',
};
```

Add custom metadata field:
```tsx
<CardContent className="p-4 space-y-3">
  {/* Existing fields */}
  
  {drawing.metadata.customField && (
    <div className="text-xs text-muted-foreground">
      <span className="font-medium">Custom:</span> {drawing.metadata.customField}
    </div>
  )}
</CardContent>
```

Add menu item:
```tsx
<DropdownMenuContent align="end">
  {/* Existing items */}
  
  <DropdownMenuItem onClick={() => onCustomAction?.(drawing)}>
    <CustomIcon className="mr-2 size-4" />
    Custom Action
  </DropdownMenuItem>
</DropdownMenuContent>
```

---

### DrawingGrid

**Path**: `/src/app/components/dashboard/DrawingGrid.tsx`

Responsive grid layout for displaying multiple drawing cards.

**Features**:
- Responsive columns (1-4 based on screen size)
- Loading state with skeletons
- Empty state with call-to-action
- Passes through card actions

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

**Usage**:
```tsx
import { DrawingGrid } from './components/dashboard/DrawingGrid';

<DrawingGrid
  drawings={drawings}
  loading={isLoading}
  onOpen={handleOpen}
  onEdit={handleEdit}
  onDelete={handleDelete}
  onNewDrawing={handleNewDrawing}
/>
```

**Customization**:

Change grid columns:
```tsx
// Default: 1 / 2 / 3 / 4 columns
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

// Custom: 1 / 2 / 3 / 3 columns
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
```

Change empty state message:
```tsx
<p className="text-muted-foreground text-center mb-6 max-w-md">
  Your custom empty state message here.
</p>
```

---

### DashboardView

**Path**: `/src/app/components/dashboard/DashboardView.tsx`

Main dashboard container that orchestrates all dashboard components.

**Features**:
- Header with navigation
- Statistics overview
- Search and filtering
- Drawing grid with actions
- Delete confirmation dialog
- View mode switching (Grid/List)
- Toast notifications

**Props**: None (uses hooks internally)

**Usage**:
```tsx
import { DashboardView } from './components/dashboard/DashboardView';

<Route path="/dashboard" element={<DashboardView />} />
```

**State Management**:
```typescript
const {
  drawings,        // Current drawings
  loading,         // Loading state
  error,          // Error message
  searchDrawings, // Search function
  deleteDrawing,  // Delete function
  pagination,     // Pagination info
  total,          // Total count
} = useDrawings();
```

**Customization Examples**:

Add a toolbar button:
```tsx
<div className="flex items-center gap-2">
  {/* Existing buttons */}
  
  <Button variant="outline" onClick={handleCustomAction}>
    <CustomIcon className="mr-2 size-4" />
    Custom Action
  </Button>
</div>
```

Change initial view mode:
```tsx
const [viewMode, setViewMode] = useState<'grid' | 'list'>('list'); // Changed from 'grid'
```

---

## Studio Components

### DrawingStudio

**Path**: `/src/app/components/studio/DrawingStudio.tsx`

Canvas-based drawing editor (integration point for your drawing tool).

**Features**:
- Header with navigation and actions
- Back to dashboard button
- Save, Export, Settings buttons
- Canvas area for drawing integration
- Drawing data loading
- URL parameter support (drawing ID)

**Props**: None (uses URL params and hooks)

**Usage**:
```tsx
import { DrawingStudio } from './components/studio/DrawingStudio';

<Route path="/studio/:id?" element={<DrawingStudio />} />
```

**Integration Example**:

Replace placeholder with your drawing tool:
```tsx
import { YourDrawingCanvas } from './your-drawing-tool';

export function DrawingStudio() {
  const { id } = useParams();
  const { drawing } = useDrawing(id || null);
  const { updateDrawing } = useDrawings({ autoLoad: false });

  const handleSave = async (canvasData) => {
    if (!id) return;
    
    await updateDrawing(id, {
      canvasData,
      updatedAt: new Date(),
    });
    
    toast.success('Drawing saved successfully');
  };

  return (
    <div className="h-screen flex flex-col">
      <header>{/* Header content */}</header>
      
      <main className="flex-1 overflow-hidden">
        <YourDrawingCanvas
          initialData={drawing?.canvasData}
          onSave={handleSave}
          onExport={handleExport}
        />
      </main>
    </div>
  );
}
```

---

## Utility Components

### ProtectedRoute

**Path**: `/src/app/components/ProtectedRoute.tsx`

HOC for protecting routes that require authentication.

**Features**:
- Redirects to login if not authenticated
- Shows loading spinner during auth check
- Passes through children when authenticated

**Props**:
```typescript
interface ProtectedRouteProps {
  children: React.ReactNode;
}
```

**Usage**:
```tsx
import { ProtectedRoute } from './components/ProtectedRoute';

<Route path="/dashboard" element={
  <ProtectedRoute>
    <DashboardView />
  </ProtectedRoute>
} />
```

**Customization**:

Add role-based access:
```tsx
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'user' | 'viewer';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/unauthorized" />;
  }

  return <>{children}</>;
}
```

---

## Usage Examples

### Complete Dashboard Setup

```tsx
import { AuthProvider } from './contexts/AuthContext';
import { RouterProvider } from 'react-router';
import { router } from './routes';
import { Toaster } from './components/ui/sonner';

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster position="top-right" />
    </AuthProvider>
  );
}
```

### Search with Custom Filters

```tsx
function CustomDashboard() {
  const { searchDrawings } = useDrawings();
  const [customFilter, setCustomFilter] = useState('');

  const handleSearch = (baseFilters: SearchFilters) => {
    const filters = {
      ...baseFilters,
      customField: customFilter || undefined,
    };
    
    searchDrawings(filters);
  };

  return (
    <div>
      <input
        value={customFilter}
        onChange={(e) => setCustomFilter(e.target.value)}
        placeholder="Custom filter..."
      />
      <SearchBar onSearch={handleSearch} />
    </div>
  );
}
```

### Create Drawing with Custom Data

```tsx
function CreateDrawingButton() {
  const { createDrawing } = useDrawings({ autoLoad: false });
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCreate = async () => {
    const drawing = await createDrawing({
      drawingNumber: `DRW-${Date.now()}`,
      title: 'New Drawing',
      description: 'Created from dashboard',
      createdBy: user!.id,
      createdByName: user!.name,
      status: 'draft',
      metadata: {
        version: '1.0',
        projectName: 'Default Project',
      },
      canvasData: {
        elements: [],
        settings: {
          backgroundColor: '#ffffff',
          gridEnabled: true,
          gridSize: 20,
          snapToGrid: true,
          zoom: 1.0,
        },
      },
      tags: ['new'],
    });

    if (drawing) {
      navigate(`/studio/${drawing.id}`);
    }
  };

  return <Button onClick={handleCreate}>Create Drawing</Button>;
}
```

### Custom Stats Card

```tsx
function CustomStatsOverview({ drawings }: { drawings: Drawing[] }) {
  // Calculate custom metrics
  const avgDrawingsPerUser = React.useMemo(() => {
    const userCounts = drawings.reduce((acc, d) => {
      acc[d.createdBy] = (acc[d.createdBy] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const userCount = Object.keys(userCounts).length;
    return userCount > 0 ? Math.round(drawings.length / userCount) : 0;
  }, [drawings]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <StatsOverview drawings={drawings} />
      
      {/* Custom stat card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Avg per User
          </CardTitle>
          <Users className="size-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{avgDrawingsPerUser}</div>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Drawing Card with Custom Actions

```tsx
function EnhancedDrawingCard({ drawing }: { drawing: Drawing }) {
  const handleShare = () => {
    // Copy link to clipboard
    navigator.clipboard.writeText(
      `${window.location.origin}/studio/${drawing.id}`
    );
    toast.success('Link copied to clipboard');
  };

  const handlePrint = () => {
    // Open print dialog
    window.print();
  };

  return (
    <DrawingCard
      drawing={drawing}
      onOpen={handleOpen}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );
}
```

---

## Best Practices

### Component Organization

```tsx
// ✅ Good: Single Responsibility
function DrawingCard({ drawing, onOpen }) {
  return (
    <Card>
      <DrawingThumbnail src={drawing.thumbnailUrl} />
      <DrawingMetadata drawing={drawing} />
      <DrawingActions onOpen={onOpen} />
    </Card>
  );
}

// ❌ Bad: Too many responsibilities
function DrawingCard({ drawing, onOpen, onEdit, onDelete, onShare, onPrint, onExport }) {
  // Too many props and concerns
}
```

### Props Handling

```tsx
// ✅ Good: Optional callbacks with defaults
interface DrawingCardProps {
  drawing: Drawing;
  onOpen?: (drawing: Drawing) => void;
  onEdit?: (drawing: Drawing) => void;
}

// ❌ Bad: Required callbacks
interface DrawingCardProps {
  drawing: Drawing;
  onOpen: (drawing: Drawing) => void;  // Not all parents need this
}
```

### State Management

```tsx
// ✅ Good: Use hooks for data fetching
function DashboardView() {
  const { drawings, loading } = useDrawings();
  
  if (loading) return <LoadingState />;
  return <DrawingGrid drawings={drawings} />;
}

// ❌ Bad: Fetch data in component
function DashboardView() {
  const [drawings, setDrawings] = useState([]);
  
  useEffect(() => {
    fetch('/api/drawings').then(/* ... */);  // Violates separation of concerns
  }, []);
}
```

### Error Handling

```tsx
// ✅ Good: Graceful error handling
function DrawingGrid({ drawings, loading, error }) {
  if (error) return <ErrorState message={error} />;
  if (loading) return <LoadingState />;
  if (drawings.length === 0) return <EmptyState />;
  return <Grid>{/* ... */}</Grid>;
}

// ❌ Bad: No error handling
function DrawingGrid({ drawings }) {
  return <Grid>{drawings.map(/* ... */)}</Grid>;  // Crashes if drawings is undefined
}
```

---

## Performance Tips

1. **Use React.memo for expensive components**
```tsx
export const DrawingCard = React.memo(({ drawing, onOpen }) => {
  // Component implementation
});
```

2. **Memoize calculations**
```tsx
const filteredDrawings = React.useMemo(
  () => drawings.filter(/* ... */),
  [drawings, filters]
);
```

3. **Debounce search inputs**
```tsx
const debouncedQuery = useDebounce(query, 300);
```

4. **Lazy load images**
```tsx
<img loading="lazy" src={drawing.thumbnailUrl} alt={drawing.title} />
```

---

## Accessibility

All components follow accessibility best practices:

- ✅ Semantic HTML
- ✅ Keyboard navigation
- ✅ ARIA labels
- ✅ Focus management
- ✅ Screen reader support

Example:
```tsx
<Button
  onClick={handleAction}
  aria-label="Open drawing"
  aria-describedby="drawing-title"
>
  <Icon className="size-4" />
  <span className="sr-only">Open</span>
</Button>
```

---

For more information, see the main [DOCUMENTATION.md](./DOCUMENTATION.md) file.
