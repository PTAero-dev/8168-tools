# 8168 Tools — AI Handover Document

**Project:** 8168 Tools  
**File:** `index.html` (deployed to Cloudflare Pages: https://8168-tools.pages.dev)  
**Location:** `d:\Antigravity.Projects\8168 Tools\` *(folder renamed from "FVP Tools" on 2026-05-08)*  
**Author / Owner:** AEROTHAI – Capt. Prach  
**Last Updated:** 2026-11-01  

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

### Theme — "Blueprint" (default) / "Whiteprint" (light)

Technical-drawing look: deep blueprint-blue background with a 20 px / 100 px drafting grid, thin line work, square corners with registration corner marks, monospace labels.

```css
--bg-body: #0b2e59;          /* blueprint blue */
--line: rgba(173,214,255,.40);   /* drawing line */
--text-main: #eaf4ff;  --text-muted: #93b4da;
--accent-primary: #7cc8ff;  --accent-cyan: #a3ecff;
--accent-success: #7fe0b0;  --accent-warning: #ffc66d;
--accent-danger:  #ff7a85;  --accent-violet: #c9adff;
```

- Light theme: class `light-theme` on `<body>` (toggle button bottom-right, saved in `localStorage.theme`). Same variable names, navy-on-paper values.
- Fonts: IBM Plex Sans (UI), IBM Plex Sans Condensed (titles), IBM Plex Mono (labels, numbers).
- **Canvas/SVG drawings never hard-code colours.** They call `bpColors()`, which reads the CSS variables at draw time, so drawings follow the theme. `toggleTheme()` redraws all of them.

### Layout building blocks
| Class | Use |
|---|---|
| `.page-header` | Title block: crumb, title, subtitle + `.ph-block` (sheet no., reference) |
| `.card` / `.card-header` / `.card-body` | Drawing sheet. Header has `.card-tag` (e.g. `02-B`), `.card-title`, `.card-actions` |
| `.card-header.minimizable` | Click to collapse (uses `toggleCard`); every card has a `.card-body` |
| `.split` | Two columns inside a card (inputs \| results or viz); stacks below 1100 px |
| `.grid-container` / `.stack` / `.span-all` | Card grids |
| `.results-panel` + `.result-row` (`.key`, `.sub`) | Results with dotted leaders. `.flush` removes top margin |
| `.stat`, `.readout` | Boxed numeric readouts |
| `.viz` | Grid-paper frame for canvas/SVG, `.viz-label` caption |
| `.note` (`.ok`, `.bad`, `.warn`) | Callouts |
| `.toggle-switch` (radio) / `.segmented-control` (buttons) | Segmented selectors |
| `.btn-reset`, `.btn-mini` (`.primary`, `.danger`), `.btn`, `.btn-add` | Buttons |
| `.c-primary`, `.c-cyan`, `.c-success`, `.c-warning`, `.c-danger`, `.c-violet`, `.c-muted` | Value colours |

- **Desktop:** fixed 268 px sidebar ("sheet index") + scrollable main.
- **Mobile (≤768 px):** sidebar becomes a sticky horizontal nav; group titles hidden.

### RESET buttons
Every card has a `.btn-reset` in its header (uses `event.stopPropagation()` so it doesn't collapse the card).

---

## 4. Navigation / Tab System

`switchTab(tabId, el)` shows one `<section class="tab-content">` and updates the URL hash (e.g. `#vnav-papi`), so each sheet can be linked/bookmarked. On load the hash opens the matching sheet. Nav items carry `data-tab`.

| Group | No. | Nav Label | Tab ID |
|---|---|---|---|
| Aircraft Performance | 01 | Speed & Temp Correction | `tab-tas` |
| | 02 | Turn Calculator | `tab-turn` |
| | 03 | Turn Anticipation | `tab-turnviz` |
| Procedure Construction | 04 | IFP Gradient | `tab-gradient` |
| | 05 | Holding for ARC | `tab-holdb` |
| | 06 | Tolerance, VEB & PBN | `tab-tol` |
| Approach & Vertical | 07 | Descent & Missed App | `tab-desc` |
| | 08 | VNAV vs PAPI | `tab-vnav-papi` |

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
| 2026-11-01 | Full redesign to Blueprint theme; nav regrouped into 3 sections with sheet numbers; inputs/results side by side; hash deep links; drawings use theme palette (`bpColors`). Fixed: missing `base-ymax` output (Base Turn crashed), unstyled radio toggles, invalid CSS-variable colours in canvases, Airspeed results outside its card. |

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
