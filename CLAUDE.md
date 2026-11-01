# CLAUDE.md — 8168 Tools

Guide for Claude Code sessions working on this repo. Read this first; details are in `HANDOVER.md`.

## What this is
**8168 Tools** — an offline-capable web app (PWA) of IFP-design calculators for ICAO Doc 8168 (PANS-OPS), built for an AEROTHAI procedure designer (Capt. Prach).
- Live: https://8168-tools.pages.dev (Cloudflare Pages, auto-deploys on every push to `main`)
- Repo: https://github.com/PTAero-dev/8168-tools
- Stack: one `index.html` (~7 200 lines: CSS + HTML + JS, no build, no dependencies) + PWA files (`manifest.webmanifest`, `sw.js`, `icons/`, `_headers`).

## Rules (user preferences — follow every time)
1. **After any change: write the commit message yourself, commit, and push to `main`.** Don't ask for a message. End commits with
   `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` (or the attribution line your session specifies).
2. **Keep the app a single `index.html`.** No frameworks, no build step.
3. **Never commit the ICAO PDFs** (`*.pdf` is git-ignored; they are ICAO copyright). Don't delete them either.
4. **Every formula must trace to a Doc paragraph** and live in the `PANS` object with a comment reference.
   Add a self-test case to `PANS_TESTS` for every new or changed formula, using Doc tables / worked examples where possible.
   The QA sheet must stay 100 % passing (currently **109/109**).
5. **Verify against the PDFs**, not memory. If something can't be verified, say so in the UI and the QA audit card.
6. The user tests on an **Android phone** and sends screenshots. Every change must work at ~360 px width with no horizontal overflow.
7. Keep the **Blueprint theme** (CSS variables; drawings use `bpColors()` — never hard-code colours) and the light "Whiteprint" theme.
8. Communicate plainly; the user is a pilot/procedure designer, not a developer.
9. **Drawing quality:** labels must never overlap each other, lines that matter, or the scale bar/footer — place labels with collision checks and leader lines.
   Every drawing gets a **labels show/hide** toggle. Render HiDPI (crisp at phone DPR 3) and export high-resolution PNG. Use 3D only where it explains something 2D cannot (e.g. surfaces/OAS, VNAV vs terrain), with a 2D fallback.
10. **When the user just says "continue"**, finish any work in progress; if none, start the top item of the Backlog (below) right away without asking which one. Remove it from the Backlog when done.

## Reference documents (in this folder, git-ignored)
- `Doc_8168_Vol_2_Construction_of_Visual_and_Instrument_Flight_Procedures.pdf` — 7th ed., Amdt 10 (main authority)
- `Doc_8168_Vol_3_Aircraft_Operating_Procedures.pdf` — cold temperature correction 2-4 §4.3.3
- `Doc_9905_RNP_AR_Procedure_Design_Manual.pdf` — VEB Appendix A/B
- Extract text: `pdftotext -layout <pdf> out.txt` (Git Bash). Tables that use **shading** (e.g. Table III-2-5-App-2) lose it in text —
  render the page with PyMuPDF (`fitz`) to PNG and read the image.

## Sheets (tab ids) and cards
| No. | Sheet | `tab-…` | Cards |
|---|---|---|---|
| 01 | Speed & Temp Correction | `tas` | 01-A TAS, 01-B cold temp (Vol III) |
| 02 | Turn Calculator | `turn` | 02-A turn |
| 02R | Reversal & Racetrack | `reversal` | 02-B procedure turn (to-scale), 02-C reversal/racetrack template (Table I-4-3-App C-5), 02-D base turn φ + overshoot analysis |
| 03 | Turn Anticipation | `turnviz` | 03-A intercept geometry |
| 04 | IFP Gradient | `gradient` | legs (dynamic, ids `grad`, `grad2`…) |
| 05 | Holding | `holdb` | 05-A holding template & area (Table I-4-3-App C-4), 05-B ATC point B on ARC |
| 06 | Tolerance, VEB & PBN | `tol` | 06-A PBN ½A/W, 06-B DME/overhead, 06-C RNP AR VEB (Doc 9905), 06-D intersection fix |
| 07 | Descent & Missed App | `desc` | 07-A ROD, 07-B equivalent obstacle ha/hma, 07-C reaction distance |
| 08 | VNAV vs PAPI | `vnav-papi` | 08-A params, 08-B chart (PAPI-lights / profile toggle), 08-C analysis, 08-D true altitude |
| 09 | Path Terminators | `pt` | 09-A sequence builder/validator, 09-B matrix, 09-C reference, 09-D MSD |
| QA | Doc 8168 Self-test | `selftest` | QA-1 reference checks, QA-2 formula audit list |

URL hash deep links: `#turn`, `#holdb`, `#pt`, …

**Navigation (since 2 Nov 2026):** sheets are grouped in 5 sections in the sidebar markup (`.nav-group[data-group][data-short]`, items carry `data-short`):
Aircraft (01, 02, 03) · Segments & Fixes (04, 06, 09) · Holding & Reversal (02R, 05) · Departure & Approach (07, 08) · Quality (QA).
On phones (≤ 768 px) the sidebar list is hidden; `renderSectionNav()` builds the fixed bottom section bar `#mobile-bar` and the sheet strip `#mobile-sub` from that markup (a section remembers its last sheet).
The project bar is behind `☰ Project` (`toggleProjectBar`, `body.show-project`); the theme button sits in the header. `buildCardIndex()` adds jump chips (`.card-index`) under the header of sheets with 3+ cards.
To add a sheet: add a `.nav-item` to the right group — both navs pick it up.

## Code map (search these markers in `index.html`)
- `PANS-OPS CORE FORMULAS` — `const PANS = {…}`: all Doc formulas (pure functions, refs in comments).
- `SELF-TEST` — `PANS_TESTS` array + `runPansTests()` / `renderSelfTest()`; badge in the sidebar.
- `DIAGRAMS — HiDPI canvas` — drawing engine: `setupCanvas`, `vizView`, `makeTurtle`, `cv*` primitives, `svgPill`, `exportViz` (PNG 4×), `redrawDiagrams`.
- `SAVE / SCENARIOS / PRINT` — autosave (`localStorage['8168tools:autosave']`), `collectState/applyState/recalcAll`, scenarios, `printSheet/preparePrint`.
- `LIMIT WARNINGS` — `showLimits(anchor, [[level, text, ref]])` adds a `.limit-box` under the results panel containing `anchor` (levels `bad` = shall/max, `warn` = should/non-standard, `ok`); limit values live in `PANS` (`reversalMaxIas`, `outboundTimeOk`, `maxBank`, `descentLimits`, `vpaClass`). `resetCard` clears the boxes. Used on 02-A, 02-B, 02-C, 02-D, 04 legs, 05-A, 07-A, 08-C; 06-D has its own acceptance check.
- `CARD TOOLS` — `decorateCards()`: "⌫ Clear" (inputs only) on cards with drawings; Reset also restores result placeholders (`data-init`) and clears drawings.
- Dynamic lists are mirrored to hidden inputs so autosave captures them: `#pt-legs-json`, `#msd-json`, `#dep-json`.
- Install/PWA script is a second `<script>` block at the end of `<body>`.

## Adding a feature — checklist
1. Read the Doc section; note paragraph/table refs.
2. Add pure function(s) to `PANS` (insert before the `// ROD (ft/min)` line) and test cases to `PANS_TESTS` (insert before the `'Missed app.', n: 'ha ↔ hma round trip` entry).
3. Write `calcX()` (+ `drawX()` using the engine). Inputs need `id`s (autosave). Use `oninput="calcX()"`.
4. Card markup: `.card > .card-header(.minimizable) + .card-body`, tag like `07-D`, `.results-panel`, `.viz` + `⤓ PNG` button, `.note` with the Doc reference.
5. Hooks: add the sheet to a `.nav-group` (with `data-short`) if it is new; add `'calcX'` to the `recalcAll` list; add to the `switchTab` wrapper (`if (id === 'tab-…') calcX();`), `toggleTheme` and `redrawDiagrams` if it draws.
6. Add a line to the QA-2 audit list and update `HANDOVER.md`.
7. Verify (below), then commit + push.

## Verification workflow (what worked in previous sessions)
- **Edit with Python patch scripts** using exact-match `replace` with `assert count == 1`. Long Python inside a Bash heredoc sometimes fails to parse —
  write the script with the Write tool into the session scratchpad and run it.
- **Syntax check all scripts:**
  `node -e "const s=require('fs').readFileSync('index.html','utf8');const re=/<script>([\s\S]*?)<\/script>/g;let m;while((m=re.exec(s)))new Function(m[1]);console.log('ok')"`
- **Run the self-test in Node:** slice from `const PANS = {` to `function renderSelfTest`, `eval` with `const`→`var`; the holding geometry tests also need the slice from `// Convex hull (Andrew monotone chain)` to `function calcHoldArea()` (`function f(` → `var f = function(`); call `runPansTests()`.
- **ID check:** every `getElementById('x')` and every id in `resetCard([...])` lists must exist in the markup.
- **Browser tests:** headless Edge `"/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" --headless=new --dump-dom` / `--screenshot`.
  Make a copy of `index.html` in the scratchpad with an injected test `<script>` (set inputs, dispatch `input` events, write results to `document.title`),
  replace `navigator.serviceWorker.register('sw.js')` with `Promise.resolve()`, serve with `python -m http.server 8766`.
  Headless Edge has a **496 px minimum width** → test phones by loading the page inside a 360 px `<iframe>`.
  Screenshots taken too early catch the fade-in animation (faint image) — use `--virtual-time-budget=10000+`.
- **Stop test servers** with PowerShell (`pkill` is not available):
  `Get-CimInstance Win32_Process | ? { $_.CommandLine -like '*-m http.server 876*' } | % { Stop-Process -Id $_.ProcessId -Force }`
- Tools available: Python 3.14 (+ Pillow, PyMuPDF), Node, pdftotext, Git Bash, PowerShell.

## Current status (2 Nov 2026)
Last commit: limit warnings with Doc refs on 8 cards (07-A got segment/category selectors). Before that: navigation restructured into 5 sections with a phone bottom bar, sheet strip and card jump chips; 02-B…02-D moved to new sheet 02R. Before that: holding omnidirectional entry area (05-A).

### Done — 07-D Departure Climb Gradient (PDG)
Card in `tab-desc` (sheet 07 renamed "Departure & Missed Approach"): `PANS.depStd/depPdgFor/depAnalyse/rocFor`, `calcDeparture()`, `drawDepViz()`, obstacle list in hidden `#dep-json`. Details in `HANDOVER.md`.

### Departure criteria used (Doc 8168 Vol II I-3-2 §2.2–2.7, II-3 §5.1–5.2)
- OIS 2.5 % (Cat H 4.2 %) and PDG from 5 m (16 ft) above DER; MOC 0.8 % of distance; standard PDG 3.3 % (Cat H 5.0 %).
- Obstacle penetrates if `h > 16 + OIS·d`. Required PDG `P = (h − 16)/d + 0.008` (h ft above DER, d ft).
- Close-in: if the increased gradient is needed only to ≤ 60 m (200 ft) (`16 + P·d ≤ 200`), it is **not** promulgated; publish the obstacle (§2.7.5).
- Published PDG = max of non-close-in requirements; it ends where a standard gradient keeps 0.8 % MOC over all governing obstacles:
  `x_end = max((h − 16 − OIS·d)/(P − PDGstd))` (single obstacle → at the obstacle, §2.7.4); promulgate the altitude (§2.7.3, II-3 §5.2 e).
- Turn height 120 m (394 ft) (Cat H 90 m); at 3.3 % reached at ≈ 1.9 NM (Doc: nominal 3.5 km / 1.9 NM).

### Backlog (agreed with the user, in rough priority)
- Drawing quality pass on all existing drawings (rule 9): label collision avoidance (e.g. holding footer overlaps the scale bar at 360 px), labels show/hide toggle, HiDPI check.
- VNAV vs PAPI: compute true VPA with the Vol II III-3-4 App A method (currently temperature-ratio approximation).
- Polish: ⓘ per result showing formula + Doc paragraph; ft/NM ↔ m/km toggle; "using TAS from Sheet 01" labels.
- Real-device testing by the user (install, offline, print to PDF on phone).
- Holding: VOR/DME holding area + along-radial entry (I-4-3-App C §3.3.4); entry area for radial-intersection fixes (§3.3.3.2.2); sector-1 area reduction (§3.3.3.3); RNAV holding.
- Racetrack protected area on sheet 02R from the same template (primary + 2.5 NM secondary, §3.3.1.3).
- Turn area construction for departure / missed approach turns (wind spiral, turn at altitude / at a TP).
- Circling area (radii by category, Table I-4-7-1) and visual segment surface check.
- OCA/H helper for non-precision approaches (MOC per segment + controlling obstacle).
- MSA / TAA sector tool.
- CDFA altitude/distance table from VPA + TCH, with chart rounding rules.
- Non-precision missed approach: SOC (MAPt tolerance + 15 s transitional), 2.5 % surface check, OCA/H gain from a higher climb gradient (Vol II I-4-6).
- Stepdown fix rules (final / intermediate) and obstacles ignored after a stepdown fix.
- APV Baro-VNAV: FAS origin/gradient at minimum temperature, promulgated minimum temperature check (links to sheet 08).
- RF leg calculator: minimum radius / bank for GS and wind (Doc 9905).
- Fly-over turn protection for RNAV turns.
- En-route obstacle clearance: MOCA, primary/buffer widths, en-route turn areas.
- DME arc segment: area widths and lead radial.
- Coordinate tool: WGS-84 distance/bearing, point from bearing/distance, magnetic ↔ true.
- Obstacle list import (CSV) checked in one go against PDG, holding and departure surfaces.
- Optional: renumber sheets/cards to the new section order (currently original numbers kept; 02R added).


### Known approximations (documented in UI)
- Holding basic area = convex envelope of the template wind circles swept around a quadrilateral fix area (approximation of the TTT construction).
- Holding entry area = convex envelope of basic area + curves 5–8 and the arc about A; curves 6–8 use only the template ahead of "a". Only the VOR/NDB overhead construction is built.
- Fix tolerance area for VOR/NDB overhead is an approximation of the I-2-2 §2.5 construction.
- MSD tables: the 25° fly-by table's 130 kt column in the Doc appears computed without the 3°/s limit; the app applies the footnote rule.
- PAPI units modelled at nominal ±10′/±30′; PAPI 1 000 ft past THR, TCH 50 ft fixed on sheet 08.
