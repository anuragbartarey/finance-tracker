# fin-track - Project Context

## Overview

A personal financial tracker with a terminal-style UI inspired by Claude Code CLI. Built with pure HTML/CSS/JS, no external dependencies. Tracks investments and savings across 8 categories with snapshot comparison for delta tracking.

**Repository**: https://github.com/anuragbartarey/finance-tracker

---

## Tech Stack

```
fin-track/
├── index.html          # Single page application
├── style.css           # Terminal-style dark/light theme
├── app.js              # All application logic
├── sample-data.json    # Test data for all categories
└── CONTEXT.md          # This file
```

- **No frameworks** - Vanilla HTML/CSS/JS
- **No build step** - Open index.html directly in browser
- **No external dependencies** - Works offline
- **LocalStorage** - Data persistence

---

## Investment Categories

| # | Category | Data Model Key | Features |
|---|----------|----------------|----------|
| 1 | Savings Accounts | `savings_accounts[]` | Bank, balance, as-of date |
| 2 | Fixed Deposits | `fixed_deposits[]` | Principal, rate, maturity date/value |
| 3 | PPF | `ppf` (single object) | Balance, yearly contribution, maturity year |
| 4 | Equity | `equity[]` | Symbol, qty, avg price, LTP, P&L calculation |
| 5 | Mutual Funds | `mutual_funds[]` | Units, NAV, invested vs current value |
| 6 | Gold Bonds (SGB) | `gold_bonds[]` | Series, units, issue vs current gold price |
| 7 | Provident Fund | `provident_fund` (single) | Balance, employee/employer split |
| 8 | Physical Assets | `physical_assets[]` | Property/vehicle, purchase vs current, loans |

---

## Data Model

```javascript
{
  "version": "1.0",
  "currency": "INR",

  // Snapshot comparison
  "current": {
    "date": "2024-06-18",
    "total_value": 18545000
  },
  "previous": {
    "date": "2024-04-15",
    "total_value": 18000000,
    "savings_total": 1480000,
    "fd_total": 1020000,
    // ... totals for each category
  },

  // Category arrays/objects
  "savings_accounts": [...],
  "fixed_deposits": [...],
  "ppf": {...},
  "equity": [...],
  "mutual_funds": [...],
  "gold_bonds": [...],
  "provident_fund": {...},
  "physical_assets": [...]
}
```

**Storage Keys**:
- `fintrack_data` - All financial data
- `fintrack_theme` - Theme preference (dark/light)

---

## UI Design

### Theme System

Two themes with CSS variables:

| Variable | Dark Mode | Light Mode |
|----------|-----------|------------|
| `--bg-primary` | #0d0d0d | #ffffff |
| `--bg-secondary` | #1a1a1a | #f8f9fa |
| `--bg-tertiary` | #2a2a2a | #e9ecef |
| `--text-primary` | #e5e5e5 | #1a1a1a |
| `--text-secondary` | #888888 | #6c757d |
| `--accent-cta` | #f97316 | #ea580c |
| `--accent-green` | #22c55e | #16a34a |
| `--accent-red` | #ef4444 | #dc2626 |

### Styling Decisions

- **No rounded corners** - Sharp edges throughout (border-radius: 0)
- **Dashed/dotted borders** - Terminal aesthetic
- **Borderless buttons** - Clean, minimal with hover highlights
- **Tab selection** - Solid orange background (Claude Code style)
- **CTA color** - Terminal orange (#f97316)
- **Font** - SF Mono, JetBrains Mono, Fira Code, Consolas (monospace)

### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  $ fin-track                    [☽] [Import] [Export] [Update] │
├─────────────────────────────────────────────────────────────────┤
│  PORTFOLIO SUMMARY                                              │
│  Total Net Worth: ₹ X,XX,XX,XXX    +₹X,XX,XXX (+X.X%)          │
│                                                                 │
│  Category breakdown with current/previous/change columns        │
├─────────────────────────────────────────────────────────────────┤
│  [Savings] [FD] [PPF] [Equity] [MF] [Gold] [PF] [Assets]       │
├─────────────────────────────────────────────────────────────────┤
│  Category detail panel with data table                          │
│  > Add entry...                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Features

### Implemented

- [x] Dashboard with portfolio summary
- [x] Delta comparison (current vs previous snapshot)
- [x] Tab navigation for 8 categories
- [x] CRUD operations for all categories
- [x] LocalStorage persistence
- [x] JSON export/import for backup
- [x] Snapshot update functionality
- [x] Dark/Light theme toggle
- [x] System theme preference detection
- [x] Responsive design
- [x] Currency formatting (L = Lakh, Cr = Crore)

### Category-Specific Features

| Category | Calculations |
|----------|--------------|
| Equity | P&L = (current_price - avg_price) × quantity |
| Mutual Funds | Current value = units × NAV |
| Gold Bonds | Current value = units × current_gold_price |
| Physical Assets | Net value = current_value - loan_outstanding |

### Not Yet Implemented

- [ ] CSV/XLS import from brokers (Zerodha, Groww)
- [ ] PDF statement parsing via Claude CLI
- [ ] Live price updates via MCP
- [ ] Charts/visualizations
- [ ] Multiple currency support
- [ ] Data encryption

---

## Key Functions (app.js)

### Initialization
- `initTheme()` - Load theme preference, setup toggle
- `loadData()` - Load from localStorage
- `initTabs()` - Tab navigation handlers
- `initModals()` - Modal open/close handlers
- `initButtons()` - Import/export/snapshot handlers

### Data Operations
- `saveData()` - Persist to localStorage
- `addEntry(category, data)` - Add new entry
- `updateEntry(category, id, data)` - Update existing
- `deleteEntry(category, id)` - Remove entry
- `getEntryById(category, id)` - Fetch single entry

### Calculations
- `calculateCategoryTotal(category)` - Sum for a category
- `calculateGroupTotal(group)` - Sum for grouped categories
- `calculateTotalNetWorth()` - Grand total
- `formatCurrency(amount)` - ₹ with L/Cr formatting

### Rendering
- `renderAll()` - Refresh entire UI
- `renderSummary()` - Dashboard totals and deltas
- `renderSavings()`, `renderFD()`, etc. - Category tables

### Import/Export
- `exportData()` - Download JSON file
- `importData(file)` - Load from JSON file
- `handleSnapshotConfirm()` - Save current as previous

---

## Category Groupings (for summary)

| Group | Categories |
|-------|------------|
| Liquid | Savings |
| Fixed Income | FD + PPF + Gold Bonds |
| Equity | Equity + Mutual Funds |
| Retirement | Provident Fund |
| Physical Assets | Physical Assets |

---

## File Details

### index.html (structure)
- Header with logo, theme toggle, action buttons
- Summary section with net worth and category breakdown
- Tab navigation bar
- 8 tab panels with data tables
- 3 modals: Entry form, Delete confirm, Snapshot update

### style.css (sections)
- Theme variables (dark/light)
- Reset & base styles
- Header & buttons
- Tab navigation
- Panel boxes & data tables
- Forms & modals
- Responsive breakpoints (768px, 480px)

### app.js (sections)
- Theme handling
- Data store & initialization
- Tab navigation
- Modal handling
- Button handlers (import/export/snapshot)
- Form generation & collection
- Data operations (CRUD)
- Calculations
- Rendering functions

---

## Usage

1. Open `index.html` in browser
2. Add entries via "Add..." buttons
3. Data auto-saves to localStorage
4. Use Export to backup as JSON
5. Use Import to restore from JSON
6. Use "Update Snapshot" to save current state for comparison
7. Toggle theme with ☽/☀ button

---

## Future Enhancements

1. **Data Import**
   - CSV/XLS from Zerodha Console holdings
   - CAMS/KFintech CAS statements
   - PDF parsing via Claude CLI

2. **Live Data**
   - Equity prices via Zerodha MCP
   - Gold prices via API
   - Mutual fund NAV updates

3. **Visualization**
   - Asset allocation pie chart
   - Net worth trend line
   - Category breakdown bars

4. **Security**
   - Data encryption option
   - Password protection
   - Secure export format
