---
name: add-feature
description: Add a new feature to the Etsy Order Manager app. Use when the user wants to add new functionality.
disable-model-invocation: true
---

# Add Feature to Etsy Order Manager

When adding a new feature to this React app:

## Project Structure
- Main app file: `src/App.jsx` (monolithic React component)
- Styles: `src/index.css` (enhanced with animations and effects)
- Database: Supabase (check `supabase-migration.sql` for schema)

## Key Patterns
1. State is managed with `useState` hooks at the App component level
2. Data is synced to Supabase via `useEffect` hooks
3. Components receive data and callbacks as props
4. Use inline styles or add to `index.css` for styling

## Data Flow
- Orders, filaments, models, etc. are loaded from Supabase on mount
- Changes are auto-saved via `useEffect` watchers
- Use existing helper functions like `showNotification()`, `saveOrders()`, etc.

## Adding New Features
1. First, understand the existing code structure
2. Add new state if needed at the App component level
3. Create new component functions following existing patterns
4. Add to Supabase schema if new data storage needed
5. Test locally with `npm run dev`
6. Build with `npm run build` to verify no errors

## Feature: $ARGUMENTS

Implement this feature following the patterns above.
