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
   The QA sheet must stay 100 % passing (currently **97/97**).
5. **Verify against the PDFs**, not memory. If something can't be verified, say so in the UI and the QA audit card.
6. The user tests on an **Android phone** and sends screenshots. Every change must work at ~360 px width with no horizontal overflow.
7. Keep the **Blueprint theme** (CSS variables; drawings use `bpColors()` — never hard-code colours) and the light "Whiteprint" theme.
8. Communicate plainly; the user is a pilot/procedure designer, not a developer.

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
| 02 | Turn Calculator | `turn` | 02-A turn, 02-B procedure turn (to-scale), 02-C reversal/racetrack template (Table I-4-3-App C-5), 02-D base turn φ + overshoot analysis |
| 03 | Turn Anticipation | `turnviz` | 03-A intercept geometry |
| 04 | IFP Gradient | `gradient` | legs (dynamic, ids `grad`, `grad2`…) |
| 05 | Holding | `holdb` | 05-A holding template & area (Table I-4-3-App C-4), 05-B ATC point B on ARC |
| 06 | Tolerance, VEB & PBN | `tol` | 06-A PBN ½A/W, 06-B DME/overhead, 06-C RNP AR VEB (Doc 9905), 06-D intersection fix |
| 07 | Descent & Missed App | `desc` | 07-A ROD, 07-B equivalent obstacle ha/hma, 07-C reaction distance |
| 08 | VNAV vs PAPI | `vnav-papi` | 08-A params, 08-B chart (PAPI-lights / profile toggle), 08-C analysis, 08-D true altitude |
| 09 | Path Terminators | `pt` | 09-A sequence builder/validator, 09-B matrix, 09-C reference, 09-D MSD |
| QA | Doc 8168 Self-test | `selftest` | QA-1 reference checks, QA-2 formula audit list |

URL hash deep links: `#turn`, `#holdb`, `#pt`, …

## Code map (search these markers in `index.html`)
- `PANS-OPS CORE FORMULAS` — `const PANS = {…}`: all Doc formulas (pure functions, refs in comments).
- `SELF-TEST` — `PANS_TESTS` array + `runPansTests()` / `renderSelfTest()`; badge in the sidebar.
- `DIAGRAMS — HiDPI canvas` — drawing engine: `setupCanvas`, `vizView`, `makeTurtle`, `cv*` primitives, `svgPill`, `exportViz` (PNG 4×), `redrawDiagrams`.
- `SAVE / SCENARIOS / PRINT` — autosave (`localStorage['8168tools:autosave']`), `collectState/applyState/recalcAll`, scenarios, `printSheet/preparePrint`.
- `CARD TOOLS` — `decorateCards()`: "⌫ Clear" (inputs only) on cards with drawings; Reset also restores result placeholders (`data-init`) and clears drawings.
- Dynamic lists are mirrored to hidden inputs so autosave captures them: `#pt-legs-json`, `#msd-json` (and `#dep-json` for the WIP departure card).
- Install/PWA script is a second `<script>` block at the end of `<body>`.

## Adding a feature — checklist
1. Read the Doc section; note paragraph/table refs.
2. Add pure function(s) to `PANS` (insert before the `// ROD (ft/min)` line) and test cases to `PANS_TESTS` (insert before the `'Missed app.', n: 'ha ↔ hma round trip` entry).
3. Write `calcX()` (+ `drawX()` using the engine). Inputs need `id`s (autosave). Use `oninput="calcX()"`.
4. Card markup: `.card > .card-header(.minimizable) + .card-body`, tag like `07-D`, `.results-panel`, `.viz` + `⤓ PNG` button, `.note` with the Doc reference.
5. Hooks: add `'calcX'` to the `recalcAll` list; add to the `switchTab` wrapper (`if (id === 'tab-…') calcX();`), `toggleTheme` and `redrawDiagrams` if it draws.
6. Add a line to the QA-2 audit list and update `HANDOVER.md`.
7. Verify (below), then commit + push.

## Verification workflow (what worked in previous sessions)
- **Edit with Python patch scripts** using exact-match `replace` with `assert count == 1`. Long Python inside a Bash heredoc sometimes fails to parse —
  write the script with the Write tool into the session scratchpad and run it.
- **Syntax check all scripts:**
  `node -e "const s=require('fs').readFileSync('index.html','utf8');const re=/<script>([\s\S]*?)<\/script>/g;let m;while((m=re.exec(s)))new Function(m[1]);console.log('ok')"`
- **Run the self-test in Node:** slice from `const PANS = {` to `function renderSelfTest`, `eval` with `const`→`var`, call `runPansTests()`.
- **ID check:** every `getElementById('x')` and every id in `resetCard([...])` lists must exist in the markup.
- **Browser tests:** headless Edge `"/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" --headless=new --dump-dom` / `--screenshot`.
  Make a copy of `index.html` in the scratchpad with an injected test `<script>` (set inputs, dispatch `input` events, write results to `document.title`),
  replace `navigator.serviceWorker.register('sw.js')` with `Promise.resolve()`, serve with `python -m http.server 8766`.
  Headless Edge has a **496 px minimum width** → test phones by loading the page inside a 360 px `<iframe>`.
  Screenshots taken too early catch the fade-in animation (faint image) — use `--virtual-time-budget=10000+`.
- **Stop test servers** with PowerShell (`pkill` is not available):
  `Get-CimInstance Win32_Process | ? { $_.CommandLine -like '*-m http.server 876*' } | % { Stop-Process -Id $_.ProcessId -Force }`
- Tools available: Python 3.14 (+ Pillow, PyMuPDF), Node, pdftotext, Git Bash, PowerShell.

## Current status (1 Nov 2026)
Last commit: 07-D departure PDG card integrated (browser/360 px check still to do).

### In progress — 07-D Departure Climb Gradient (PDG)  ← **resume here**
Work-in-progress code is in `wip/departure/` (not yet in `index.html`):
- `dep_pans.js` — `PANS` additions: `depStd`, `DEP_ORIGIN_FT` (16 ft = 5 m), `DEP_MOC` (0.008), `depPdgFor`, `depAnalyse`, `rocFor`. Paste inside `PANS`.
- `dep_ui.js` — `DEP_ROWS` obstacle list (hidden `#dep-json`), `depLoad/depSave/depEdit/depAdd`, `calcDeparture()`, `drawDepViz()`.
- `example_integrate_msd.py` — the integration script used for the MSD card; copy its pattern.

Criteria used (Doc 8168 Vol II I-3-2 §2.2–2.7, II-3 §5.1–5.2):
- OIS 2.5 % (Cat H 4.2 %) and PDG from 5 m (16 ft) above DER; MOC 0.8 % of distance; standard PDG 3.3 % (Cat H 5.0 %).
- Obstacle penetrates if `h > 16 + OIS·d`. Required PDG `P = (h − 16)/d + 0.008` (h ft above DER, d ft).
- Close-in: if the increased gradient is needed only to ≤ 60 m (200 ft) (`16 + P·d ≤ 200`), it is **not** promulgated; publish the obstacle (§2.7.5).
- Published PDG = max of non-close-in requirements; it ends where a standard gradient keeps 0.8 % MOC over all governing obstacles:
  `x_end = max((h − 16 − OIS·d)/(P − PDGstd))` (single obstacle → at the obstacle, §2.7.4); promulgate the altitude (§2.7.3, II-3 §5.2 e).
- Turn height 120 m (394 ft) (Cat H 90 m); at 3.3 % reached at ≈ 1.9 NM (Doc: nominal 3.5 km / 1.9 NM).

Remaining steps:
1. Card markup **07-D "Departure Climb Gradient (PDG)"** in `tab-desc` (span-all): inputs `dep-der` (DER elev ft), `dep-cat` (AE/H),
   `dep-gs` (kt), hidden `dep-json`; obstacle table `tbody#dep-rows` (+ "Add obstacle" → `depAdd()`); results ids
   `dep-res-pdg`, `dep-res-to`, `dep-res-ftnm`, `dep-res-roc`, `dep-res-turn`, `dep-res-std`, `dep-res-table`; note box `#dep-note`;
   `.viz` with `canvas#depVizCanvas` + PNG button; reference note.
2. Rename sheet 07 to "Departure & Missed Approach" (nav label, page title, subtitle).
3. Hooks: `recalcAll` ('calcDeparture'), `switchTab` (`tab-desc`), `toggleTheme`, `redrawDiagrams`. CSS for the table rows (`tr.pdg`, `tr.close-in`) like `.msd-table`.
4. Self-tests (hand-checked values):
   - standard PDG = 0.025 + 0.008 = 0.033; Cat H 0.050
   - distance to 394 ft at 3.3 %: `(394 − 16)/0.033/6076.12 ≈ 1.885 NM` (Doc ≈ 1.9 NM)
   - obstacle 2.0 NM, 500 ft above DER → `P = 484/12152.24 + 0.008 ≈ 4.78 %`, end height = `500 + 0.008·12152 ≈ 597 ft`
   - close-in: 0.3 NM, 80 ft → P ≈ 4.31 % but end ≈ 95 ft ≤ 200 → class `close-in`, published PDG stays 3.3 %
   - ROC 3.3 % at 150 kt GS ≈ 501 ft/min
5. QA-2 audit line, `HANDOVER.md`, browser + 360 px checks, commit + push, then **delete `wip/`**.

### Backlog (agreed with the user, in rough priority)
- Limit warnings on all sheets (IAS > category max, outbound time outside 1–3 min, VPA/gradient limits, fix tolerance limits) with Doc refs.
- Holding: draw the omnidirectional entry area (I-4-3-App C §3.3.3.2); currently only XE/YE are given.
- VNAV vs PAPI: compute true VPA with the Vol II III-3-4 App A method (currently temperature-ratio approximation).
- Polish: ⓘ per result showing formula + Doc paragraph; ft/NM ↔ m/km toggle; "using TAS from Sheet 01" labels.
- Real-device testing by the user (install, offline, print to PDF on phone).

### Known approximations (documented in UI)
- Holding basic area = convex envelope of the template wind circles swept around a quadrilateral fix area (approximation of the TTT construction).
- Fix tolerance area for VOR/NDB overhead is an approximation of the I-2-2 §2.5 construction.
- MSD tables: the 25° fly-by table's 130 kt column in the Doc appears computed without the 3°/s limit; the app applies the footnote rule.
- PAPI units modelled at nominal ±10′/±30′; PAPI 1 000 ft past THR, TCH 50 ft fixed on sheet 08.
