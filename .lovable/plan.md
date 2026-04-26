## Add "Projects Near Me" button next to "الطلبات المتاحة" in the office navbar

**Scope:** Only edit `src/components/Navbar.tsx`. Nothing else changes.

### Change 1 — Desktop office nav (around line 156)
Insert a new `<Link to="/office/nearby">` **before** the existing `/office/browse-requests` link (so it appears on the left side of "الطلبات المتاحة" in LTR; in RTL flex order, "left side" = the item placed before it in DOM).

```tsx
<Link to="/office/nearby" onClick={() => setMegaOpen(false)}>
  <Button variant="ghost" size="sm">
    <MapPin className="h-4 w-4 me-1" />
    {isRTL ? 'مشاريع حولي' : 'Projects Near Me'}
  </Button>
</Link>
<Link to="/office/browse-requests" onClick={() => setMegaOpen(false)}>
  <Button variant="ghost" size="sm"><FolderOpen className="h-4 w-4 me-1" />{isRTL ? 'الطلبات المتاحة' : 'Requests'}</Button>
</Link>
```

### Change 2 — Mobile office nav (around line 282)
Insert the same link directly **before** the mobile `/office/browse-requests` link, matching the existing mobile button styling.

### Change 3 — Imports
Add `MapPin` to the existing `lucide-react` import in `Navbar.tsx` (only if not already imported).

### Not changing
- No edits to `office/home.tsx`, `office/dashboard.tsx`, `office/nearby.tsx`, locales, or any other file.
- No layout, color, spacing, or styling changes.
- The existing "Projects Near Me" quick-action card on the dashboard stays as-is.