# 8168 Tools — AI Handover Document

> **Claude Code sessions: start with `CLAUDE.md`** (rules, code map, verification workflow, current status and next steps). This file has the detailed module descriptions and history.

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
| | 05 | Holding | `tab-holdb` |
| | 06 | Tolerance, VEB & PBN | `tab-tol` |
| | 09 | Path Terminators | `tab-pt` |
| Approach & Vertical | 07 | Departure & Missed App | `tab-desc` |
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

**Reversal & Racetrack Template (02-C)**
- Procedure: base turn, 45°/180°, 80°/260°, racetrack (Table I-4-3-App C-5, non-SI equations)
- Inputs: max IAS, altitude, outbound time, wind (default ICAO 2h+47), facility (VOR 50° / NDB 40° cone) + elevation
- TAS = IAS at **ISA+15** (I-4-3-App C line 1). Outputs xmax/ymax/ymin (+xmin racetrack), fix error, template plotting values; warns outside validity (TAS 90–290 kt, w ≤ 65 kt, t 1–3 min)
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

### Tab 5: Holding (`tab-holdb`)

**05-A Holding Template & Area** (`calcHoldArea`, `drawHoldViz`)
- Speeds Table II-4-1-2 (`PANS.holdingIas`), timing 1 / 1.5 min (`PANS.holdingTime`), ISA+15, ICAO wind, 25° bank
- Template = Table I-4-3-App C-4, all 33 lines (`PANS.holdingTemplate`), shown in a collapsible table
- Geometry: template points a…n4 with wind circles → template = convex envelope of circles; basic area = template swept around the fix tolerance area (VOR 50° / NDB 40° cone or custom ATT×XTT); 5 NM buffer = (basic + entry area) + 5 NM (II-4-1 §1.3.12.1). Points i1/i2 are on the holding side of the outbound leg, i3/i4 on the axis side (fixed 2 Nov 2026; template extents checked against Diagram I-4-3-App C-6)
- Entry sector from aircraft heading (`PANS.holdingEntry`, Fig. II-4-1-2), XE/YE entry allowances, minimum holding level from area MOC 984 ft and buffer MOC Table II-4-1-1 (`PANS.bufferMoc`)
- Omnidirectional entry area §3.3.3.2.1 (`holdingEntryArea`, selector `#hold-entry-area`): curve 5 = template with point E (XE/YE) moved round the circle through A1/A3; curves 6–7 = forward part of the template (circles a, c–g) on the 70° sector 1/3 line at the entry fix area, curve 8 = mirror; arc about A to curve 1; outline = convex envelope (approximation). Radial-intersection entry (§3.3.3.2.2) and VOR/DME (§3.3.4) are not built

**05-B Holding Point B · ATC delay on ARC** (original calculator)

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

**PBN Area Semi-width (06-A)**
- Inputs: XTT (RNP value), phase of flight → buffer value (Table III-1-1-3), CAT A–E / H, segment MOC
- Outputs: XTT, ATT = 0.8·XTT, BV, ½A/W = 1.5·XTT + BV (III-1-1 §1.5.1), primary semi-width, MOC
- Function: `calcPBN()`

**Fix Tolerance (Doc 8168)**
- DME: `±(0.25 NM + 1.25 % × D)` (I-2-2 §2.4.4)
- VOR / NDB overhead: cone radius `z = 0.164 × h(thousands ft) × tan α`, α = 50° VOR / 40° NDB (I-2-2 §2.5); entry ±5° VOR / ±15° NDB, tracking ±5°
- System use accuracy (Table I-2-2-1) shown as reference: VOR ±5.2°/±4.5°, NDB ±6.9°/±6.2°, ILS ±2.4°/±1.4°
- Function: `calcTolerance()`

**Intersection Fix Tolerance (06-D)** (`calcIfix`, `ifixGeometry`, `drawIfixViz`)
- Tracking aid VOR/NDB/LOC (Table I-2-2-1 track accuracy ±5.2/6.9/2.4°) flying from/to the aid; fix defined by an intersecting VOR/NDB/LOC radial (±4.5/6.2/1.4°) or DME (collocated or not, ±(0.25 + 1.25 % D))
- Outputs earliest/latest fix position along the nominal track (fix tolerance, §2.3.2), cross-track, area corners; acceptance IAF/IF ±2 NM or ±25 % of segment, FAF ±1 NM (§2.6.2–2.6.3); warnings for θ < 45°, DME divergence > 23°, DME below minimum usable distance
- "→ Holding" sends ATT/XTT to 05-A as a custom fix tolerance area

**Vertical Error Budget (Doc 9905)**
- Inputs: RNP value (0.1 or 0.3), LNE (ft), ASE (ft), FTE (ft)
- Outputs: Lateral protection (semi-width NM), VEB MOC (ft)
- **RNP AR VEB per Doc 9905 Appendix B (non-SI):** `MOC = bg − isad + 4/3·√(anpe² + wpr² + fte² + ase² + vae² + atis²)`, fte 75 ft, atis 20 ft, bg 25 ft straight or 132·sin(bank) RF; ISA deviation from min aerodrome temperature. Outputs MOC at 250 ft and FAP, OAS gradient and origin, ½AW = 2 × RNP. Function `PANS.veb()`.
- Function: `calcVEB()`

---

### Tab 7: Departure & Missed Approach (`tab-desc`)

**Required Rate of Descent**
- Inputs: Ground speed (kt), Target gradient (%, default 5.2%)
- Outputs: Approx flow angle (°), Required ROD (ft/min)
- Formula: `ROD = GS × gradient_decimal × 6076.12` ft/min
- Function: `calcDescent()`

**Equivalent Approach Obstacle (07-B)**
- `ha = [hma·cot Z + (xz + x)] / (cot Z + cot θ)` (II-1-1 §1.4.8.8.2.1; III-3-4 §4.4.3), and its inverse
- Inputs: GP/VPA θ, MA gradient Z %, xz (900 m, 700 m Cat H), obstacle x from THR (m, + before / − after), height (ft)
- Function: `calcEqObs()`

**Dynamic Reaction Distance (Doc 8168 parameters)**
- Inputs: Speed (kt), Pilot reaction time (sec, default 3s), Bank establishment (sec, default 3s), Engine spool-up (sec, default 0s for jets)
- Outputs: Individual component distances + total distance consumed
- Function: `calcReaction()`

**Departure Climb Gradient (07-D)**
- Doc 8168 Vol II I-3-2 §2.2–2.7, II-3 §5.1–5.2. OIS 2.5 % (Cat H 4.2 %) and PDG both start 5 m (16 ft) above DER; MOC 0.8 % of distance; standard PDG 3.3 % (Cat H 5.0 %).
- Inputs: DER elevation (ft), category (Aeroplane / Helicopter), GS (kt); obstacle list (name, distance from DER NM, elevation ft AMSL) kept in `DEP_ROWS`, mirrored to hidden `#dep-json`.
- Penetration if `h > 16 + OIS·d`; required `PDG = (h − 16)/d + 0.008`. Close-in (increased PDG needed only to ≤ 60 m / 200 ft) → not promulgated, publish the obstacle (§2.7.5).
- Published PDG = max of non-close-in requirements; it ends at `x_end = max((h − 16 − OIS·d)/(P − PDGstd))` (§2.7.4) and the altitude is promulgated (§2.7.3).
- Outputs: published PDG, end altitude/distance, ft/NM, ROC + table, earliest-turn distance to 120 m (Cat H 90 m), suggested chart notes, profile drawing.
- Functions: `PANS.depStd/depPdgFor/depAnalyse/rocFor`, `calcDeparture()`, `drawDepViz()`, `depAdd/depEdit`.

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

## 5a. Reference documents

ICAO PDFs are kept in the repo folder for verification but are **git-ignored** (`*.pdf`, ICAO copyright): Doc 8168 Vol II, Doc 8168 Vol III, Doc 9905.
Cold temperature correction (01-B, 08 true altitude) = Vol III 2-4 §4.3.3 via `PANS.coldTempCorr()`.

## 5b. PANS core formulas & self-test

All Doc 8168 formulas live in one object, `PANS` (search `PANS-OPS CORE FORMULAS`), each with its paragraph reference.
Calculators call `PANS.*`; the **QA · Doc 8168 Self-test** sheet (`#selftest`) runs `PANS_TESTS` — 97 reference values from Doc 8168 Vol II
(incl. holding Table I-4-3-App C-4, fix accuracies, path terminator tables, MSD tables, departure PDG), Vol III (Table 2-4-1 b) and Doc 9905 (Appendix B sample) — and shows the pass count in the sidebar badge. **Add a test whenever a formula is added or changed.**

## 5c. Save, scenarios and print

- **Autosave:** every `input`/`select` with an id inside `<main>` is saved to `localStorage['8168tools:autosave']` (debounced 400 ms) and restored on load (`applyState` → `recalcAll`). Gradient legs are rebuilt with their original ids.
- **Project strip** (top of main): project, designer, date; named scenarios in `localStorage['8168tools:scenarios']`; Export/Import JSON; New clears autosave and reloads.
- **Print / PDF:** `printSheet()` (or Ctrl+P) → `preparePrint()` switches to the light palette, expands collapsed cards, fills the print title block (`#print-header`), redraws diagrams at 3×, then restores after printing. Print CSS is in the `PRINT / PDF` block.
- New sheets/inputs are saved automatically as long as inputs have an `id`; add any new calc function to `recalcAll()`.

## 5d. Path terminators (sheet 09) and card tools

- `PANS.ptForbidden` = shaded cells of Table III-2-5-App-2 (38 forbidden pairs), `PANS.ptInitFinal` = Table III-2-5-App-1, `PANS.ptValidate(type, legs, rnp)` applies the matrix, Notes 1–3, rules 5a–e, RNP subset and SID notes.
- UI: `calcPathTerm`, `ptDrawChain`, `ptDrawMatrix`, `ptRenderReference`; legs are kept in `PT_LEGS` and mirrored to the hidden input `#pt-legs-json` so autosave/scenarios include them.
- **09-D MSD** (`calcMsd`, `drawMsdViz`, `PANS.msdFlyBy/msdFlyOver/msdLeg`): III-2-1 §1.4 models (fly-by r·tan(θ/2)+5 s; fly-over L1–L5, 30° intercept, 10 s; θ<50° → 50°; Cat H 30°/3 s/5 s), bank or 3°/s, leg rule §1.2.5 and Table III-2-1-21 D. Route rows in hidden `#msd-json`. Verified against Tables III-2-1-7…12 (1 337/1 350 cells; the 25° fly-by 130 kt column appears computed without the 3°/s limit).
- **Card tools** (`decorateCards`): every card with a drawing gets **⌫ Clear** (empties typed inputs, keeps drawing/results). Every **↺ Reset** also restores result placeholders (saved in `data-init` at load) and clears drawings in its card.

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

## 7. Diagrams

All diagrams are drawn by one engine (search `DIAGRAMS — HiDPI canvas` in `index.html`).

| Element | Tab | Function | Notes |
|---|---|---|---|
| `ptVizCanvas` | Turn Calculator | `drawPTViz` | 45°/180° or 80°/260° nominal track, **to scale** in NM |
| `baseVizCanvas` | Turn Calculator | `drawBaseTurnViz` | Nominal track + x/y extents box, to scale |
| `#btp-svg-container` (SVG) | Turn Calculator | `drawBtpVisualizer` | Compass with φ wedge |
| `turnCanvas` | Turn Anticipation | `drawTurnViz` | Intercept geometry to scale, Lead dimension |
| `gradCanvas`, `gradNCanvas` | IFP Gradient | `drawGradientViz` | Profile (vertical exaggerated) |
| `#vnp-chart-container` (SVG) | VNAV vs PAPI | `drawVnavPapiChart` | Compact 1:1 layout when container < 640 px |
| `depVizCanvas` | Departure & Missed App | `drawDepViz` | OIS, 0.8 % MOC band, flight path, obstacles (vertical exaggerated) |

- `setupCanvas()` sizes each canvas to its frame × devicePixelRatio (sharp on phones/retina) and is re-run on window resize (`redrawDiagrams()`).
- `makeTurtle()` builds tracks from straight legs + constant-radius turns (x = east, y = north, NM).
- Every `.viz` frame has a `⤓ PNG` button → `exportViz()` saves a 4× resolution PNG.

## 7b. Installable app (PWA)

`manifest.webmanifest`, `sw.js`, `icons/`, `_headers`. The service worker is network-first for the page (new deploys appear when online) and cache-first for fonts/icons. Bump `CACHE` in `sw.js` if the list of shell files changes. The app is still one `index.html`; the extra files are only for install/offline.

---

## 8. Key Design Decisions & Gotchas

1. **Single HTML file:** All CSS, JS, and HTML are in one file. This is intentional — the app is deployed by copying one file. Do not split it.

2. **localStorage:** inputs autosave (`8168tools:autosave`), scenarios (`8168tools:scenarios`), theme (`theme`). "New" in the project strip clears the autosave.

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
| 2026-11-06 | 06-E RF leg: Doc 9905 Table 3-1 b) speeds, tailwind (ICAO 2h+47 or MA 10/20/30/40 kt), minimum radius at 25° (15° above FL190), bank for a given radius, arc length, DTA; 3 checks → 165. |
| 2026-11-02 | 08-E Baro-VNAV FAS: Δh (App A) at the minimum temperature, tan FAS and X_FAS (§4.3.4.2.5), FAS′/FAS″ for Hi 105/120 m joined at 5 000/10 000 ft, minimum VPA ≥ 2.5°, FAP ≤ 10 NM, obstacle check, profile; 2 checks → 162. |
| 2026-11-02 | 10-F stepdown fix: g1/g2 (to 50 ft, Cat H 35 ft) vs final limits, stabilized FAF→THR path vs SDF MOCA (I-4-5 §5.5.4), dual OCA/H reminder, close-to-fix 15 % plane (Cat H 2.5 × gradient) for up to 4 obstacles (I-2-2 §2.7.4); 2 checks → 160. |
| 2026-11-02 | 10-E NPA missed approach: d (3 s) / X (15 s, H 5 s) at TAS + 10 kt, Tables I-4-6-1/-2 for distance MAPt (Cat A–D), SOC, initial phase with final MOC, 2.5 % climb with MOC 98 ft (secondary linear), OCA table for 2.5/3/4/5 %, 5.2 % path limit for MAPt before THR; 4 checks → 158. |
| 2026-11-02 | 10-D CDFA table: H = RDH + 6 076·D·tanθ (+ 0.8833·D²), rows at whole DME / THR NM, FAF and OCA rows, rounding up/nearest 10 ft, ROD and FAF→THR time table, profile drawing; 2 checks vs Table II-1-1-App C-1b → 154. |
| 2026-11-02 | New sheet 11 MSA & TAA (`tab-msa`): sectors from boundary bearings (+ optional DME arc subsectors), TAA areas for T/Y layout, 5 NM buffer, +1 000 ft (+ mountainous) rounded up to 100 ft, single-altitude check, obstacle textarea (paste from a spreadsheet; textareas now autosaved); 3 checks → 152. Also: long notes fold to one line. |
| 2026-11-02 | 10-C NPA OCA/H: MOC 246/295 ft, mountainous %, secondary-area linear MOC (5 obstacle rows), OCH reference AD/THR (7 ft rule), remote altimeter +5 ft/NM, Table I-4-5-3 offset limits × gradient factor, circling lower limit from 10-A, missed approach OCA, 10-ft rounding; 5 checks → 149. |
| 2026-11-02 | New sheet 10 Circling & Visual Segment (`tab-circ`): circling radius R = 2r + segment (I-4-7 §7.2), OCA/H with Table I-4-7-3 MOC / lower limit / visibility, drawing for one runway with all categories; VSS (I-4-5 §5.4.6) slope, width, length to OCH, obstacle check with the 15 m rule; 6 checks vs Tables I-4-7-2/-3 → 144. |
| 2026-11-02 | 07-E follow-ups: bounding-circle method (§3.3.3), track guidance after the turn (VOR ±1.0 NM/7.8°, NDB ±1.25 NM/10.3°; §3.3.4.2 connections), secondary areas with guidance (§3.3.5, Fig. I-2-3-6: 30° lines to the primary edge), filled primary area; 2 checks → 138. |
| 2026-11-02 | 07-E turn area: wind spiral from A (I-2-3 §3.3.2.2), P + 15° splay, inner boundary §3.2.1/3.2.2, Table I-2-3-1 phase defaults (bank, wind, c); 6 checks vs Table I-2-3-3 → 136. |
| 2026-11-02 | 02-E racetrack protected area: §3.6.2 parameters (category IAS Table I-4-1-2, ISA+15, 2h+47, 25°/3°/s, 1–3 min), 05-A template engine + omni entry, 2.5 NM secondary, Table I-4-3-1 max/min descents, MOC 984 ft; `drawHoldViz` takes `canvasId` / `bufLabel`; 3 checks (Doc example §3.7.1) → 130. |
| 2026-11-02 | 05-A VOR/DME reciprocal direct entry (§3.3.4.1.3 / §3.3.4.2.3): entry radial RE (RE vs RP 8° for Doc example C-14 — self-test), curve RE towards the station; 1 check → 127. |
| 2026-11-02 | 05-A holding entries: VOR/DME sector 1 DME arc (curves 13, 15) and sector 2 (curve 11, 1/1.5 min); radial intersection along the reciprocal (5·6) and the intersecting radial (7, 8) with optional VOR bearing input; VOR/DME outbound limits now splayed per the Doc; 3 checks incl. Doc examples C-13 (DL 35) / C-15 (DL 26) → 126. |
| 2026-11-02 | 05-A VOR/DME holding: fix type "VOR/DME" with D, ds, towards/away; §3.3.4 Ds, DL (Doc rounding), DLs, d1/d2; basic area from A1–A4 and the C-points on DL1/DL2 with the template turned 180° (convex envelope; outbound limits parallel to the inbound track; limiting-radial reduction not applied); 4 checks → 123. |
| 2026-11-02 | 05-C RNP holding area (III-3-7-App B): d2, d4 (printed formula inconsistent with the figures — flagged), d3 / 1.414·d3 area, buffer; 05-A fix type renamed "RNAV waypoint / fix area ATT × XTT" (III-3-7 §7.5); 3 checks → 119. |
| 2026-11-02 | Polish: ⓘ formula + Doc reference on 54 key results; results unit switch ft·NM ↔ m·km in the project bar (display only, inputs unchanged); 02-A shows when the TAS is taken from sheet 01-A. |
| 2026-11-02 | Sheet 08: effective VPA by III-3-4-App A §1.3 / §4.3.4.2.5 (replaces temperature ratio), min temperature for 2.5° and temperature above which VPA > 3.5° (§4.7.3 c/d); 7 checks vs Tables III-3-4-App A-4/A-5 and III-3-4-1 → 116. |
| 2026-11-02 | Drawing quality pass: canvas labels avoid each other / the caption / buttons / north arrow and stay inside the frame (leader lines when moved), footer caption lifts above the scale bar, ≥ 2× rendering, Aa labels show/hide on every drawing, VNAV DA/FAF boxes and path labels avoid each other, quick VNAV sliders under the 08-B chart. Fixed: theme / redraw re-derived a descending gradient leg as a climb. |
| 2026-11-02 | Limit warnings (Table I-4-1-2 reversal IAS, outbound 1–3 min, bank 25°, descent gradients initial/intermediate/final, Baro-VNAV VPA 2.5–3.5°, holding speed/timing) on 02-A/B/C/D, 04 legs, 05-A, 07-A (new segment + category selectors), 08-C; 8 checks → 109. |
| 2026-11-02 | Navigation restructure: 5 sections (Aircraft · Segments & Fixes · Holding & Reversal · Departure & Approach · QA); phone bottom section bar + sheet strip, project bar behind ☰, theme button in header, card jump chips, compact sheet header; cards 02-B…02-D moved to new sheet 02R `tab-reversal`. |
| 2026-11-02 | Holding omnidirectional entry area drawn (§3.3.3.2.1), buffer now around basic + entry; template i1/i2 ↔ i3/i4 side fixed (D-side extent was ≈1 NM short); 4 new checks → 101. |
| 2026-11-01 | Departure PDG card 07-D (8 checks → 97); sheet 07 renamed Departure & Missed Approach; browser + 360 px verified. |
| 2026-11-01 | MSD card 09-D (11 checks → 89); base turn overshoot analysis fixed. |
| 2026-11-01 | Path Terminators sheet 09 (10 new checks → 74). Clear/Reset buttons on drawing cards. VNAV chart → PAPI lights view. |
| 2026-11-01 | Intersection fix tolerance 06-D (6 new checks → 64), linked to holding. |
| 2026-11-01 | Holding sheet 05-A (template, basic area, entries, MHL; 18 new checks → 58). VNAV chart deviation view. |
| 2026-11-01 | Added Vol III + Doc 9905: VEB card rebuilt to Doc 9905 App B, cold temperature confirmed vs Vol III Table 2-4-1 b); self-test now 40 checks. |
| 2026-11-01 | Formula audit vs Doc 8168 Vol II (7 corrections, VEB flagged), PANS core + 28-check self-test sheet. Autosave, named scenarios, JSON export/import, print/PDF calculation sheet with title block. |
| 2026-11-01 | Installable PWA (manifest, service worker, icons). Diagrams rebuilt: HiDPI, to-scale plan views, PNG export. Mobile overflow audit of all 8 pages at 360 px; VNAV chart compact layout. |
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
