# Database Setup Guide

This guide will help you set up a production database for the Technical Drawing Dashboard.

## Table of Contents

1. [PostgreSQL Setup](#postgresql-setup)
2. [Supabase Setup](#supabase-setup)
3. [MongoDB Setup](#mongodb-setup)
4. [Data Migration](#data-migration)

---

## PostgreSQL Setup

### 1. Install PostgreSQL

```bash
# macOS
brew install postgresql

# Ubuntu
sudo apt-get install postgresql

# Windows
# Download from https://www.postgresql.org/download/windows/
```

### 2. Create Database

```sql
CREATE DATABASE technical_drawings;
\c technical_drawings
```

### 3. Create Tables

Run the following SQL to create the schema:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'user', 'viewer')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Drawings table
CREATE TABLE drawings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  drawing_number VARCHAR(100) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) NOT NULL CHECK (status IN ('draft', 'in-review', 'approved', 'archived')),
  thumbnail_url TEXT,
  metadata JSONB DEFAULT '{}',
  canvas_data JSONB DEFAULT '{}',
  tags TEXT[]
);

-- Inventory items table (future feature)
CREATE TABLE inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(50) NOT NULL CHECK (type IN ('screen', 'mount', 'mediaPlayer', 'receptacleBox')),
  alias VARCHAR(255) NOT NULL,
  model VARCHAR(255) NOT NULL,
  manufacturer VARCHAR(255),
  dimensions JSONB,
  size_in_inch DECIMAL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_drawings_created_by ON drawings(created_by);
CREATE INDEX idx_drawings_status ON drawings(status);
CREATE INDEX idx_drawings_created_at ON drawings(created_at DESC);
CREATE INDEX idx_drawings_updated_at ON drawings(updated_at DESC);
CREATE INDEX idx_drawings_tags ON drawings USING GIN(tags);
CREATE INDEX idx_drawings_search ON drawings USING GIN(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_drawings_updated_at
  BEFORE UPDATE ON drawings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_items_updated_at
  BEFORE UPDATE ON inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 4. Create Sample Data

```sql
-- Insert sample user
INSERT INTO users (email, name, password_hash, role)
VALUES 
  ('john.doe@example.com', 'John Doe', 'hashed_password', 'admin'),
  ('jane.smith@example.com', 'Jane Smith', 'hashed_password', 'user');

-- Insert sample drawing
INSERT INTO drawings (
  drawing_number,
  title,
  description,
  created_by,
  status,
  metadata,
  canvas_data,
  tags
)
VALUES (
  'DRW-2024-001',
  'Conference Room A - LED Display Layout',
  'Main conference room display configuration',
  (SELECT id FROM users WHERE email = 'john.doe@example.com'),
  'approved',
  '{"version": "1.0", "projectName": "Corporate HQ", "clientName": "Acme Corp"}',
  '{"elements": [], "settings": {"backgroundColor": "#ffffff", "gridEnabled": true}}',
  ARRAY['led-display', 'technical-drawing']
);
```

---

## Supabase Setup

Supabase is a PostgreSQL-based platform with built-in authentication, real-time subscriptions, and APIs.

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Create a new organization
4. Create a new project
5. Save your project URL and anon key

### 2. Run SQL Migrations

In the Supabase dashboard:

1. Go to SQL Editor
2. Click "New Query"
3. Paste the schema from the PostgreSQL section above
4. Click "Run"

### 3. Set Up Authentication

Supabase provides built-in authentication. Enable email/password authentication:

1. Go to Authentication → Providers
2. Enable "Email"
3. Configure email templates (optional)

### 4. Set Up Row Level Security (RLS)

Secure your data with RLS policies:

```sql
-- Enable RLS
ALTER TABLE drawings ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read all drawings
CREATE POLICY "Users can read all drawings"
  ON drawings FOR SELECT
  USING (true);

-- Policy: Users can insert their own drawings
CREATE POLICY "Users can insert their own drawings"
  ON drawings FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Policy: Users can update their own drawings
CREATE POLICY "Users can update their own drawings"
  ON drawings FOR UPDATE
  USING (auth.uid() = created_by);

-- Policy: Users can delete their own drawings
CREATE POLICY "Users can delete their own drawings"
  ON drawings FOR DELETE
  USING (auth.uid() = created_by);

-- Admin users can do everything
CREATE POLICY "Admins can do everything"
  ON drawings
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );
```

### 5. Configure Environment Variables

Create a `.env.local` file:

```env
VITE_SUPABASE_URL=your-project-url.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_DATA_SOURCE=database
```

### 6. Install Supabase Client

```bash
npm install @supabase/supabase-js
```

### 7. Create Supabase Service

Create `/src/app/services/SupabaseDataService.ts`:

```typescript
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { IDataService } from './DataService';
import { Drawing, User, SearchFilters, PaginationParams, ApiResponse, SearchResult } from '../types';

export class SupabaseDataService implements IDataService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    );
  }

  async getDrawings(params: PaginationParams): Promise<ApiResponse<SearchResult<Drawing>>> {
    const { page, pageSize, sortBy = 'updated_at', sortOrder = 'desc' } = params;
    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;

    const { data, error, count } = await this.supabase
      .from('drawings')
      .select('*', { count: 'exact' })
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(start, end);

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: {
        items: data as Drawing[],
        total: count || 0,
        page,
        pageSize,
      },
    };
  }

  async getDrawingById(id: string): Promise<ApiResponse<Drawing>> {
    const { data, error } = await this.supabase
      .from('drawings')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as Drawing };
  }

  async createDrawing(drawing: Omit<Drawing, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Drawing>> {
    const { data, error } = await this.supabase
      .from('drawings')
      .insert([drawing])
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as Drawing };
  }

  async updateDrawing(id: string, updates: Partial<Drawing>): Promise<ApiResponse<Drawing>> {
    const { data, error } = await this.supabase
      .from('drawings')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as Drawing };
  }

  async deleteDrawing(id: string): Promise<ApiResponse<void>> {
    const { error } = await this.supabase
      .from('drawings')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  async searchDrawings(filters: SearchFilters, params: PaginationParams): Promise<ApiResponse<SearchResult<Drawing>>> {
    let query = this.supabase.from('drawings').select('*', { count: 'exact' });

    // Apply filters
    if (filters.query) {
      query = query.or(`title.ilike.%${filters.query}%,description.ilike.%${filters.query}%,drawing_number.ilike.%${filters.query}%`);
    }

    if (filters.status && filters.status.length > 0) {
      query = query.in('status', filters.status);
    }

    if (filters.createdBy && filters.createdBy.length > 0) {
      query = query.in('created_by', filters.createdBy);
    }

    if (filters.dateRange) {
      query = query
        .gte('created_at', filters.dateRange.start.toISOString())
        .lte('created_at', filters.dateRange.end.toISOString());
    }

    if (filters.tags && filters.tags.length > 0) {
      query = query.contains('tags', filters.tags);
    }

    // Apply pagination
    const { page, pageSize, sortBy = 'updated_at', sortOrder = 'desc' } = params;
    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;

    const { data, error, count } = await query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(start, end);

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: {
        items: data as Drawing[],
        total: count || 0,
        page,
        pageSize,
      },
    };
  }

  // Implement other methods...
  async getUserById(id: string): Promise<ApiResponse<User>> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as User };
  }

  async getUserByEmail(email: string): Promise<ApiResponse<User>> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as User };
  }

  async authenticate(email: string, password: string): Promise<ApiResponse<User>> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    // Get user data
    const userResponse = await this.getUserById(data.user.id);
    return userResponse;
  }

  async validateToken(token: string): Promise<ApiResponse<User>> {
    const { data: { user }, error } = await this.supabase.auth.getUser(token);

    if (error || !user) {
      return { success: false, error: 'Invalid token' };
    }

    return this.getUserById(user.id);
  }
}
```

### 8. Update DataService Factory

In `/src/app/services/DataService.ts`:

```typescript
import { SupabaseDataService } from './SupabaseDataService';

export function createDataService(source: 'mock' | 'googleSheets' | 'database' = 'mock'): IDataService {
  switch (source) {
    case 'database':
      return new SupabaseDataService();
    // ...
  }
}
```

---

## MongoDB Setup

### 1. Install MongoDB

```bash
# macOS
brew install mongodb-community

# Ubuntu
sudo apt-get install mongodb

# Windows
# Download from https://www.mongodb.com/try/download/community
```

### 2. Create Database and Collections

```javascript
use technical_drawings;

// Users collection
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["email", "name", "role"],
      properties: {
        email: { bsonType: "string" },
        name: { bsonType: "string" },
        role: { enum: ["admin", "user", "viewer"] },
        createdAt: { bsonType: "date" },
        lastLogin: { bsonType: "date" }
      }
    }
  }
});

// Drawings collection
db.createCollection("drawings", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["drawingNumber", "title", "createdBy", "status"],
      properties: {
        drawingNumber: { bsonType: "string" },
        title: { bsonType: "string" },
        description: { bsonType: "string" },
        createdBy: { bsonType: "string" },
        createdByName: { bsonType: "string" },
        status: { enum: ["draft", "in-review", "approved", "archived"] },
        metadata: { bsonType: "object" },
        canvasData: { bsonType: "object" },
        tags: { bsonType: "array" }
      }
    }
  }
});

// Create indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.drawings.createIndex({ drawingNumber: 1 }, { unique: true });
db.drawings.createIndex({ createdBy: 1 });
db.drawings.createIndex({ status: 1 });
db.drawings.createIndex({ createdAt: -1 });
db.drawings.createIndex({ title: "text", description: "text" });
```

---

## Data Migration

### From Google Sheets to Database

1. **Export Google Sheets to CSV**
   - File → Download → Comma-separated values (.csv)

2. **Prepare CSV Data**
   ```typescript
   import { MigrationManager } from './utils/migration';
   import { createDataService } from './services/DataService';

   const manager = new MigrationManager();
   const targetService = createDataService('database');

   // Read CSV and convert to array
   const sheetsData = parseCsvFile('drawings.csv');

   // Run migration
   const log = await manager.migrateDrawings(sheetsData, targetService);

   // Generate report
   console.log(manager.generateReport(log));
   ```

3. **Verify Migration**
   - Check record counts
   - Verify data integrity
   - Test application functionality

### Rollback Plan

1. Keep Google Sheets as backup
2. Export database to CSV before making changes
3. Document migration timestamp and record counts

---

## Performance Optimization

### Database Indexes

Ensure these indexes are created:

```sql
-- PostgreSQL
CREATE INDEX CONCURRENTLY idx_drawings_full_text_search 
  ON drawings USING GIN(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- MongoDB
db.drawings.createIndex({ "$**": "text" });
```

### Connection Pooling

For production, use connection pooling:

```typescript
// PostgreSQL with pg-pool
import { Pool } from 'pg';

const pool = new Pool({
  max: 20,
  connectionTimeoutMillis: 0,
  idleTimeoutMillis: 10000,
});
```

---

## Monitoring & Maintenance

### Health Checks

```sql
-- Check database size
SELECT pg_size_pretty(pg_database_size('technical_drawings'));

-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### Backup Strategy

```bash
# PostgreSQL backup
pg_dump technical_drawings > backup_$(date +%Y%m%d).sql

# Restore
psql technical_drawings < backup_20240213.sql

# MongoDB backup
mongodump --db=technical_drawings --out=backup_$(date +%Y%m%d)

# Restore
mongorestore backup_20240213/
```

---

## Troubleshooting

### Common Issues

1. **Connection Timeout**
   - Check firewall settings
   - Verify connection string
   - Increase timeout settings

2. **Slow Queries**
   - Add missing indexes
   - Optimize query structure
   - Consider caching

3. **Migration Errors**
   - Check data format
   - Verify required fields
   - Review error logs

---

## Security Best Practices

1. **Never commit credentials**
   - Use environment variables
   - Add `.env` to `.gitignore`

2. **Use parameterized queries**
   - Prevent SQL injection
   - Validate user input

3. **Enable SSL/TLS**
   ```typescript
   const pool = new Pool({
     ssl: {
       rejectUnauthorized: true,
     },
   });
   ```

4. **Regular backups**
   - Automated daily backups
   - Test restore procedures

5. **Monitor access**
   - Log all database operations
   - Set up alerts for suspicious activity

---

For additional support, refer to the main [DOCUMENTATION.md](./DOCUMENTATION.md) file.
