# Logo Replacement Design

## Overview

Replace the temporary Disc3 Lucide icon with the actual VinylDeck logo in the brand mark component.

## Scope

**In scope:**

- Replace logo in `brand-mark.tsx` (used in login page, sidebar header, loading states)

**Out of scope:**

- Album art placeholders (keep Disc3 icon)
- Favicon and PWA icons
- Social media assets

## Design

### File Location

```
public/logo.png
```

To swap logos for testing: replace this file. Works for both PNG and SVG formats.

### Changes to `brand-mark.tsx`

1. Remove the circular container styling (background, ring, shadow) - the logo has its own design
2. Replace `<Disc3>` icon with `<img src="/logo.png">`
3. Preserve size variants with adjusted dimensions
4. Preserve spinning animation option

### Size Variants

| Size | Dimensions | Usage                      |
| ---- | ---------- | -------------------------- |
| sm   | ~40×40px   | Sidebar header             |
| md   | ~56×56px   | Default                    |
| lg   | ~96×96px   | Login page, loading states |

Sizes are slightly larger than current to accommodate lightning effects extending beyond the circular vinyl disc.

### Logo Characteristics

- Circular vinyl disc as the main shape
- Lightning bolt effects extending on sides (teal left, orange right)
- "VinylDeck" wordmark in orange script
- Transparent PNG background (preserved on render)

## Implementation

1. Copy logo PNG to `public/logo.png`
2. Update `brand-mark.tsx`:
   - Remove circular container div and its styling
   - Replace Disc3 with img element
   - Update size classes for img dimensions
   - Keep spinning animation via CSS transform
3. Test at all three sizes (sm, md, lg)
4. Adjust sizes as needed based on visual review
