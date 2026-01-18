# Plan: Grid/Table View Toggle for Collection Page

## Overview

Add a toggle button next to the Filters button on the collection page to switch between grid view (existing) and a new table view. The preference will be persisted in localStorage. The implementation will be reusable for the wantlist page.

## Files to Modify/Create

### New Files

- `src/hooks/use-view-preference.ts` - Hook for view mode preference with localStorage
- `src/components/collection/view-toggle.tsx` - Toggle button component
- `src/components/collection/vinyl-table.tsx` - Table view component
- `src/components/collection/vinyl-table-skeleton.tsx` - Loading skeleton for table

### Modified Files

- `src/lib/constants.ts` - Add `VIEW_MODE` storage key
- `src/lib/storage.ts` - Add view mode get/set functions
- `src/components/collection/collection-toolbar.tsx` - Add ViewToggle button
- `src/routes/_authenticated/collection.tsx` - Integrate view toggle and table
- `src/locales/en/translation.json` - Add English translations
- `src/locales/no/translation.json` - Add Norwegian translations
- `src/index.css` - Add view switch animation

## Implementation Steps

### Step 1: Install shadcn Table Component

```bash
bunx shadcn add table
```

### Step 2: Add Storage Key and Functions

**constants.ts** - Add to `STORAGE_KEYS`:

```typescript
VIEW_MODE: 'vinyldeck_view_mode'
```

**storage.ts** - Add functions:

```typescript
export type ViewMode = 'grid' | 'table'

export function getViewMode(): ViewMode {
  const stored = localStorage.getItem(STORAGE_KEYS.VIEW_MODE)
  return stored === 'table' ? 'table' : 'grid'
}

export function setViewMode(mode: ViewMode): void {
  localStorage.setItem(STORAGE_KEYS.VIEW_MODE, mode)
}
```

### Step 3: Create useViewPreference Hook

- State initialized from localStorage
- `toggleView()` function to switch modes
- Returns `{ viewMode, toggleView, isGrid, isTable }`

### Step 4: Create ViewToggle Component

- Button with `variant="outline" size="icon-sm"` (matches existing sort order button)
- Icons: `LayoutGrid` for grid mode, `TableProperties` for table mode
- Tooltip showing which view will be activated on click
- Placed before the Filters button in toolbar

### Step 5: Create VinylTable Component

**Columns (responsive):**
| Column | Mobile | Tablet | Desktop |
|--------|--------|--------|---------|
| Cover (40x40) | ✓ | ✓ | ✓ |
| Title/Artist | ✓ | ✓ | ✓ |
| Year | ✓ | ✓ | ✓ |
| Genre | ✓ | ✓ | ✓ |
| Label (catno) | - | ✓ | ✓ |
| Format | - | - | ✓ |
| Country | - | - | ✓ |

**Features:**

- Horizontal scroll on mobile with sticky cover/title columns
- Row hover effects
- Staggered fade-in animation (matches grid card pattern)
- Empty state (same as grid)
- Loading skeleton

### Step 6: Update CollectionToolbar

- Add `viewMode` and `onViewToggle` props
- Insert `<ViewToggle />` before `<CollectionFilters />`

### Step 7: Update Collection Page

- Import and use `useViewPreference` hook
- Conditional render: `VinylGrid` when grid mode, `VinylTable` when table mode
- Pass animation control to both components

### Step 8: Add Animation

**CSS keyframe in index.css:**

```css
@keyframes view-switch-in {
  0% {
    opacity: 0;
    transform: translateY(8px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
```

Both grid and table use staggered item animations when switching views.

### Step 9: Add Translations

**English:**

- `collection.view.switchToGrid`: "Switch to grid view"
- `collection.view.switchToTable`: "Switch to table view"
- `collection.table.titleArtist`: "Title / Artist"
- `collection.table.year`: "Year"
- `collection.table.genre`: "Genre"
- `collection.table.label`: "Label"
- `collection.table.format`: "Format"
- `collection.table.country`: "Country"

**Norwegian:** (equivalent translations)

## Design Decisions

1. **Toggle button placement**: Before Filters button, using same `icon-sm` size
2. **Icons**: `LayoutGrid` / `TableProperties` from lucide-react
3. **Responsive table**: Horizontal scroll with sticky first two columns; hide less important columns on smaller screens
4. **Animation**: CSS-based with staggered delays (matches existing `animate-card-pop` pattern)
5. **Storage**: Simple get/set functions following existing patterns (not a full provider)

## Reusability for Wantlist

- `VinylTable` accepts releases via props (same `basic_information` structure)
- `ViewToggle` is fully generic
- `useViewPreference` hook can be extended with page key if needed:
  ```typescript
  useViewPreference('collection' | 'wantlist')
  ```

## Verification

1. Run `bun dev` and navigate to `/collection`
2. Verify toggle button appears next to Filters
3. Click toggle - view should switch with animation
4. Refresh page - preference should persist
5. Test on mobile viewport - table should scroll horizontally
6. Test both English and Norwegian languages
7. Run `bun run build` to verify no TypeScript errors
