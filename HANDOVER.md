# 8168 Tools — AI Handover Document

**Project:** 8168 Tools  
**File:** `8168 TOOLS.html`  
**Location:** `d:\Antigravity.Projects\8168 Tools\` *(folder renamed from "FVP Tools" on 2026-05-08)*  
**Author / Owner:** AEROTHAI – Capt. Prach  
**Last Updated:** 2026-05-08  

---

## 1. What Is This App?

**8168 Tools** is a single-file, self-contained HTML/CSS/JS web application for **Instrument Flight Procedure (IFP) design and analysis**, based on ICAO Doc 8168 (PANS-OPS) and related documents.

It is designed for aviation professionals (particularly IFP designers at AEROTHAI) to quickly perform calculations that are otherwise done manually from tables or spreadsheets. The app works entirely offline — no server, no frameworks, no npm. It is deployed simply by opening `8168 TOOLS.html` in a browser.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Structure | Vanilla HTML5 |
| Styling | Vanilla CSS (CSS custom properties / variables) |
| Logic | Vanilla JavaScript (ES6+, no dependencies) |
| Fonts | Google Fonts — `Inter` (UI) + `JetBrains Mono` (numeric outputs) |
| Charting | HTML5 `<canvas>` (native, drawn by JS) |
| Deployment | Single `.html` file, open in browser |

**No build step. No package.json. No bundler. No external libraries.**

---

## 3. Design System

### Theme — "Sunset Gold" (Dark Default)

```css
--bg-body: #0d0906;           /* Near-black warm */
--bg-sidebar: #1a130f;
--bg-card: rgba(35, 25, 20, 0.7);  /* Glassmorphism */
--accent-primary: #f59e0b;    /* Sunset Amber */
--accent-success: #10b981;    /* Green */
--accent-warning: #f87171;    /* Coral Red */
--accent-danger: #ef4444;
--accent-cyan: #fbbf24;       /* Gold */
--text-main: #eef1f5;
--text-muted: #8b9bb4;
```

### Light Theme
Toggled via a Floating Action Button (FAB) at bottom-right. Adds class `light-theme` to `<body>`. Light theme uses a white/slate palette with blue accent (`#1d4ed8`).

### Layout
- **Desktop:** Fixed sidebar (260px wide) + scrollable main content area.
- **Mobile:** Sidebar collapses to a horizontal scrollable nav bar at top.
- **Cards:** `backdrop-filter: blur(12px)` glassmorphism. Rounded corners (`--radius-lg: 20px`).
- **Grid:** `repeat(auto-fit, minmax(400px, 1fr))` responsive grid for cards.

### Minimizable Cards
Cards with class `.card-header.minimizable` can be collapsed/expanded by clicking the header. A CSS triangle arrow indicates state.

### RESET buttons
Every card has a small red RESET button that clears its inputs and re-runs the calculation to restore default state.

---

## 4. Navigation / Tab System

Navigation is handled by `switchTab(tabId, element)` JS function. Each tab is a `<section id="tab-xxx" class="tab-content">`. Only the active tab is shown (`display: block`), others are `display: none`.

### Sidebar Nav Items → Tab IDs

| Nav Label | Tab ID | Purpose |
|---|---|---|
| SPD, TEMP Correction | `tab-tas` | IAS→TAS, Cold Temperature Altitude Correction |
| Turn Calculator | `tab-turn` | Rate of Turn, Radius, Wind Spiral, Procedure Turn, Base Turn |
| Turn Anticipation | `tab-turnviz` | Visual geometry for course intercept |
| IFP Gradient | `tab-gradient` | Multi-leg climb/descent gradient calculator |
| Holding for ARC | `tab-holdb` | Holding point B calculation for DME arc |
| Tolerance, VEB & PBN | `tab-tol` | Fix tolerances, VEB (Doc 9905), RNP containment |
| Descent & Missed App | `tab-desc` | Required ROD, Equiv. Obstacle Height, Reaction Distance |
| VNAV vs PAPI | `tab-vnav-papi` | Barometric VNAV path vs PAPI corridor simulation |

---

## 5. Detailed Module Descriptions

### Tab 1: SPD, TEMP Correction (`tab-tas`)

**Airspeed Conversion Card**
- Inputs: IAS (kt), Altitude (ft), OAT (°C) or ISA Dev (°C), Wind speed (± for HW/TW)
- OAT ↔ ISA Dev are **synced** via `syncTemp()` — changing one auto-updates the other
- Outputs: TAS (kt), Ground Speed (kt), Mach Number
- Function: `calcTAS()`

**Cold Temperature Correction Card** (ICAO Doc 8168 Vol.2 method)
- Inputs: AD Temperature (°C), AD Elevation (ft), Target Altitude (ft MSL)
- Outputs: Height above AD, ISA Deviation, Required Correction (ft), Indicated Alt to Fly
- Function: `calcTempCorr()`
- Formula: Correction = H × (ISA_Dev / (273 + ISA_temp)); where H = height above AD

---

### Tab 2: Turn Calculator (`tab-turn`)

Contains 3 collapsible sub-sections:

**Turn Parameters**
- Inputs: IAS, Bank angle (default 25°), Turn angle θ, Altitude, Wind speed
- Wind is auto-calculated from ICAO formula if altitude given: `w = min(12% × TAS, 56 kt)`
- Outputs: Rate of Turn (°/s), Radius (NM), Lead distance, Post-turn distance, Wind spiral Eθ
- Formula: `r = TAS² / (g × tan(bank))`, `R = TAS / (2π × r)`
- Function: `calcTurn()`

**Procedure Turn (Course Reversal)**
- Inputs: Aircraft category (A/B/C/D/E — sets max IAS), IAS, Altitude, Procedure type (45°/180° or 80°/260°), Outbound time (1m/1.5m/2m)
- Canvas visualization (`ptVizCanvas`) drawn by JS
- Function: `calcPT()`

**Base Turn (Protected Area)**
- Inputs: IAS, Wind, Altitude, Turn time
- Outputs: xmax (NM), ymin, ymax (protected area extents)
- Canvas visualization (`baseVizCanvas`)
- Function: `calcBaseTurn()`

**Base Turn Divergence (φ) — Doc 8168**
- Inputs: Aircraft category, IAS, Altitude, Bank, Outbound limit (time or distance), Inbound track, Turn direction, Published outbound (optional)
- Outputs: TAS, Divergence angle φ, Required outbound track, Inbound track
- Includes SVG visualizer (injected dynamically into `#btp-svg-container`)
- Overshoot analysis panel with warning if charted divergence < required
- Function: `calcBaseTurnPhi()`

---

### Tab 3: Turn Anticipation (`tab-turnviz`)

- Inputs: Current track, Next (final) track, Turn direction (Auto/Right/Left), IAS, Altitude, Bank
- Outputs: Intercept angle θ, Turn radius, Lead distance (TA), Offset distance (for 180° turns)
- Canvas display (`turnCanvas`, 400×400px, North-up)
- Auto-detects turn direction if set to "Auto"
- Function: `drawTurnViz()`

---

### Tab 4: IFP Gradient (`tab-gradient`)

**Multi-leg gradient chaining system**

- **Initial Parameters card:** RWY Elevation (ft), TCH (ft). Clicking "SET LEG 1" seeds Leg 1's start altitude.
- **Leg cards:** Dynamically added via `addGradientLeg()`. Each leg has:
  - Start Alt, End Alt, Gradient (%), Angle (°), Leg Dist (NM), Start Dist, End Dist
  - Inputs are bi-directional: enter any two and the rest calculate
  - Canvas mini-profile chart (`gradCanvas`)
- Legs are chained: end of Leg N seeds start of Leg N+1
- Function: `calculateGradient(legId, mode)`, `calcGradStart()`

---

### Tab 5: Holding for ARC (`tab-holdb`)

Used for ATC: Calculate the holding fix (Point B) from a DME arc start point (Point A) to create a delay circuit.

- **Point A coordinate input:** Full DMS + DDM dual-format input boxes (auto-tab between fields)
  - `pta1-lat-d/m/s` (DMS) synced with `pta1-lat-dd/dm` (DDM)
- Inputs: Bearing from A, Distance from A (NM), Ground Speed, Target delay time, Inbound course, Leg length (min)
- Outputs: Point B coordinates, Track B→A, Time B→A, Hold circuit time, Wait time, Lead/post turn distances
- Warning flag if B is too close to A
- Function: `calcHoldB()`

---

### Tab 6: Tolerance, VEB & PBN (`tab-tol`)

Three cards:

**PBN / RNP Parameters**
- Select RNP value (0.3 to 10 NM) and phase of flight
- Outputs: Lateral accuracy (95%), Containment limit (1×RNP), Protection area (2×RNP), MOC
- Function: `calcPBN()`

**Fix Tolerance (Doc 8168)**
- NavAid types: DME, VOR (intersecting/overhead), NDB
- For DME: input distance → Along Track Tolerance (ATT)
- For VOR/NDB: input distance → ATT + tracking tolerance (°)
- Formula per Doc 8168 Vol.2:
  - DME: `ATT = ±(0.085 × D + 0.25)` NM
  - VOR: `ATT = D × tan(tracking_tolerance)` where tracking_tol varies
  - NDB: `ATT = D × tan(tracking_tolerance)` (larger angles)
- Function: `calcTolerance()`

**Vertical Error Budget (Doc 9905)**
- Inputs: RNP value (0.1 or 0.3), LNE (ft), ASE (ft), FTE (ft)
- Outputs: Lateral protection (semi-width NM), VEB MOC (ft)
- Formula: `VEB_MOC = sqrt(ASE² + FTE² + LNE²) × tan(glide_slope) × lateral_factor`
- Function: `calcVEB()`

---

### Tab 7: Descent & Missed App (`tab-desc`)

**Required Rate of Descent**
- Inputs: Ground speed (kt), Target gradient (%, default 5.2%)
- Outputs: Approx flow angle (°), Required ROD (ft/min)
- Formula: `ROD = GS × gradient_decimal × 6076.12` ft/min
- Function: `calcDescent()`

**Equivalent Obstacle Height (ha/hma)**
- Converts between approach obstacle height (ha) and missed approach equivalent height (hma)
- Inputs: Obstacle dist from SOC (NM), Approach gradient Z%, Missed App gradient Z%, Input height, Direction
- Function: `calcEqObs()`

**Dynamic Reaction Distance (Doc 8168 parameters)**
- Inputs: Speed (kt), Pilot reaction time (sec, default 3s), Bank establishment (sec, default 3s), Engine spool-up (sec, default 0s for jets)
- Outputs: Individual component distances + total distance consumed
- Function: `calcReaction()`

---

### Tab 8: VNAV vs PAPI (`tab-vnav-papi`)

The most complex tab — simulates how barometric VNAV deviates from geometric PAPI in non-ISA temperatures.

**Inputs:**
- Design VPA (°) — slider + number input, 2.5°–4.0°
- Temperature (°C) — slider + number input, -10°C to 50°C
- Aerodrome Elevation (ft), DA (ft AMSL), FAF (ft AMSL)
- ILS Equipped toggle (changes PAPI siting distance from threshold)
- PAPI Nominal angle (°) — slider

**Outputs:**
- VNAV barometric path height at various distances from threshold
- PAPI high/low sector boundaries
- Summary: whether VNAV path is above/below/within PAPI corridor at DA
- Canvas chart visualizing both paths from FAF to threshold

**Key formula:** Cold temp causes baro altimeters to over-read, so aircraft on VNAV fly lower than intended. Hot temp causes under-reading, so aircraft fly higher.

Function: `calcVnavPapi()`

---

## 6. Shared Utility Functions

| Function | Purpose |
|---|---|
| `switchTab(tabId, el)` | Show tab, update active nav item |
| `toggleCard(headerEl)` | Collapse/expand minimizable card |
| `resetCard(cardId, ids[], calcFn)` | Clear inputs, re-run calc |
| `calcTAS()` | TAS conversion (shared across tabs) |
| `syncTemp(source)` | Sync OAT ↔ ISA Dev fields |
| `setToggle(id, val, el)` | Segmented control selection |
| `calcProjDMS(prefix, isLat)` | DMS → decimal projection |
| `calcProjDMM(prefix, isLat)` | DDM → decimal projection |
| `checkCoordLimit(el, max, allowNeg)` | Validates coordinate input |
| `autoTab(el, maxLen, nextId)` | Auto-advance focus in coordinate boxes |
| `addGradientLeg()` | Dynamically clone and add a new IFP Gradient leg |
| `resetGradientLeg(legId)` | Reset a single gradient leg |
| `updatePTCat()` | Update max IAS for procedure turn based on category |
| `setBtpCat(val)` | Set Base Turn Phi category defaults |
| `toggleBtpLimit()` | Switch outbound limit between time and distance |
| `toggleVnpIls()` | Show/hide ILS-specific PAPI inputs |
| `resetVnavPapi()` | Full reset of VNAV vs PAPI tab |

---

## 7. Canvas Elements

| Canvas ID | Tab | Purpose |
|---|---|---|
| `ptVizCanvas` | Turn Calculator | Procedure turn geometry |
| `baseVizCanvas` | Turn Calculator | Base turn protected area |
| `turnCanvas` | Turn Anticipation | Course intercept geometry (North-up) |
| `gradCanvas` | IFP Gradient | Gradient profile per leg |
| VNAV canvas | VNAV vs PAPI | Glide path comparison (created dynamically) |

---

## 8. Key Design Decisions & Gotchas

1. **Single HTML file:** All CSS, JS, and HTML are in one file. This is intentional — the app is deployed by copying one file. Do not split it.

2. **No localStorage used:** State is in-memory only. Refreshing the page resets all inputs.

3. **ISA temperature sync:** The TAS tab has two temperature inputs (OAT and ISA Dev) that are kept in sync via `syncTemp()`. When resetting, both need to be cleared or one will immediately recalculate the other.

4. **RESET button propagation:** All reset buttons use `event.stopPropagation()` to prevent the click from also triggering the card's minimize/expand toggle.

5. **Fix Tolerance logic (VOR vs NDB):** VOR has a tracking tolerance of ~5.2°, NDB has ~6.9°. This means VOR can have **higher** ATT than NDB at the same distance. This is intentional and correct per Doc 8168 — it surprised users at first but was verified against ICAO standards.

6. **Base Turn Divergence SVG:** The SVG in `#btp-svg-container` is fully replaced on every `calcBaseTurnPhi()` call (not updated in-place). The SVG is built as a string and `innerHTML` is set.

7. **IFP Gradient leg chaining:** `calculateGradient('grad', mode)` handles Leg 1. Subsequent legs use IDs like `grad2`, `grad3`, etc. The `addGradientLeg()` function clones the DOM structure and renumbers IDs.

8. **Coordinate input auto-tab:** The `autoTab()` function moves focus automatically from Degrees → Minutes → Seconds when the max character count is reached.

---

## 9. Branding & Copyright

- **App name:** `8168 Tools` (previously was shown as `8168 TOOLS` — corrected to title case)
- **File name:** `8168 TOOLS.html` (filename kept as-is)
- **Copyright line:** `© AEROTHAI–Capt.Prach` (bottom of sidebar)
- **Satellite SVG icon** in sidebar brand area (represents PBN/GNSS theme)

---

## 10. Conversation History Summary

Key development milestones from previous sessions:

| Date (approx) | Work Done |
|---|---|
| 2026-03-01 | Reset button bugs fixed; Branding corrected from "8168 TOOLS" to "8168 Tools" throughout. Fix Tolerance (ATT) logic verified against ICAO Doc 8168 (VOR > NDB behavior confirmed correct). Light mode refinements. |
| 2026-05-01 | Coordinate Converter mobile UI redesigned (within FISB Tools project, separate app). Nested card-in-card layout replaced with fluid full-page scroll. |
| 2026-05-02 | Context imported from Claude session. Session context continuity maintained. |
| 2026-05-08 | Folder rename from `FVP Tools` → `8168 Tools` initiated. Handover document created. |

---

## 11. How to Continue Development

1. **Open** `d:\Antigravity.Projects\8168 Tools\8168 TOOLS.html` in VS Code (or any editor).
2. **Preview** by opening the file in a browser (no server needed).
3. **Edit** CSS in the `<style>` block (lines ~13–464), HTML in `<body>`, JS in `<script>` at the bottom.
4. **Test** directly in browser — all calculations are live on `oninput` events.

### Common Tasks

- **Add a new tab:** Add a `<div class="nav-item" onclick="switchTab('tab-newname', this)">Label</div>` in the sidebar nav, then a `<section id="tab-newname" class="tab-content" style="display:none;">` in main.
- **Add a reset button to a card:** Use the standard pattern — red mini button with `event.stopPropagation()` calling `resetCard(cardId, [inputIds], calcFunction)`.
- **Add a new canvas:** Create `<canvas id="myCanvas">`, then draw in a JS function using `const ctx = document.getElementById('myCanvas').getContext('2d')`.

---

## 12. Related Projects (same workspace)

| Folder | Description |
|---|---|
| `AeroChronos` | Pilot logbook application |
| `Aerodrome Design` | Aerodrome planning tools |
| `ChronoMatrix` | Time/schedule matrix app |
| `FISB Tools` | Fixes/waypoints, coordinate converter for FISB data |
| `KingAir_Performance` | King Air 350 performance app (React/Vite, separate stack) |
| `pvd-monitor` | PVD monitoring tool |

---

*This document was generated by Antigravity AI on 2026-05-08 for handover continuity.*
