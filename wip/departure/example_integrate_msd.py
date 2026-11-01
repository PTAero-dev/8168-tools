import sys, os
S = os.path.dirname(os.path.abspath(__file__))
p = sys.argv[1]
s = open(p, encoding='utf-8').read()
rd = lambda f: open(os.path.join(S, f), encoding='utf-8').read()


def rep(a, b, n=1):
    global s
    c = s.count(a)
    assert c == n, (a[:80], c)
    s = s.replace(a, b)


rep("            // ROD (ft/min) = GS (kt) × 6076.12/60 × gradient\n", rd('msd_pans.js') + "            // ROD (ft/min) = GS (kt) × 6076.12/60 × gradient\n")

R1 = "(round to 0.1 NM)"
rep("""            { g: 'Missed app.', n: 'ha ↔ hma round trip""", f"""            {{ g: 'MSD', n: 'Fly-by 90°, 200 kt, 15° bank {R1}', ref: 'Table III-2-1-7', exp: 2.5, tol: 0.05, f: () => PANS.msdFlyBy(200, 90, 15) }},
            {{ g: 'MSD', n: 'Fly-by 70°, 240 kt, 20° / 3°/s', ref: 'Table III-2-1-8', exp: 1.9, tol: 0.05, f: () => PANS.msdFlyBy(240, 70, 20) }},
            {{ g: 'MSD', n: 'Fly-by 50°, 200 kt, 25° / 3°/s', ref: 'Table III-2-1-9', exp: 0.9, tol: 0.05, f: () => PANS.msdFlyBy(200, 50, 25) }},
            {{ g: 'MSD', n: 'Fly-by 120°, 340 kt, 25° / 3°/s', ref: 'Table III-2-1-9', exp: 6.7, tol: 0.05, f: () => PANS.msdFlyBy(340, 120, 25) }},
            {{ g: 'MSD', n: 'Fly-over 90°, 220 kt, 15° bank', ref: 'Table III-2-1-10', exp: 9.2, tol: 0.05, f: () => PANS.msdFlyOver(220, 90, 15) }},
            {{ g: 'MSD', n: 'Fly-over 70°, 200 kt, 20° / 3°/s', ref: 'Table III-2-1-11', exp: 4.9, tol: 0.05, f: () => PANS.msdFlyOver(200, 70, 20) }},
            {{ g: 'MSD', n: 'Fly-over 80°, 300 kt, 25° / 3°/s', ref: 'Table III-2-1-12', exp: 9.7, tol: 0.05, f: () => PANS.msdFlyOver(300, 80, 25) }},
            {{ g: 'MSD', n: 'Course change < 50° uses the 50° value', ref: 'III-2-1 §1.4.2.2', exp: 1, tol: 0, f: () => +(PANS.msdFlyBy(200, 30, 25) === PANS.msdFlyBy(200, 50, 25)) }},
            {{ g: 'MSD', n: 'Two fly-by WPs: A1 + A2', ref: 'III-2-1 §1.2.5.1', exp: 2 * PANS_MSD_A, tol: 1e-9, f: () => PANS.msdLeg({{ ty: 'flyby', cc: 90 }}, {{ ty: 'flyby', cc: 90 }}, 200, 15, false, 3).req }},
            {{ g: 'MSD', n: 'Fly-by then fly-over: A1 + 0', ref: 'III-2-1 §1.2.5.2', exp: PANS_MSD_A, tol: 1e-9, f: () => PANS.msdLeg({{ ty: 'flyby', cc: 90 }}, {{ ty: 'flyover', cc: 90 }}, 200, 15, false, 0).req }},
            {{ g: 'MSD', n: 'Segment ending at a non-turning WP: at least D (1.5 NM final)', ref: 'Table III-2-1-21', exp: 1.5, tol: 1e-9, f: () => PANS.msdLeg({{ ty: 'none', cc: 0 }}, {{ ty: 'flyby', cc: 0 }}, 140, 25, false, 1.5).req }},
            {{ g: 'Missed app.', n: 'ha ↔ hma round trip""")
rep("        const PANS_TESTS = [", "        const PANS_MSD_A = (200 / (20 * Math.PI * Math.min(3, 3431 * Math.tan(15 * Math.PI / 180) / (Math.PI * 200)))) * Math.tan(45 * Math.PI / 180) + 5 * 200 / 3600;\n\n        const PANS_TESTS = [")

rep("        // Setup init drawing event hook\n", rd('msd.js') + "        // Setup init drawing event hook\n")

CARD = '''
                <div class="card">
                    <div class="card-header minimizable" onclick="toggleCard(this)">
                        <div class="card-heading"><span class="card-tag">09-D</span>
                            <div class="card-title">Minimum Leg Length · MSD</div>
                        </div>
                        <div class="card-actions">
                            <button class="btn-mini primary" onclick="event.stopPropagation(); msdFromLegs();" title="Copy waypoint names and fly-over flags from the 09-A sequence">⇩ From 09-A</button>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="vp-row">
                            <div class="vp-input-group">
                                <label>Bank Angle</label>
                                <select id="msd-bank" onchange="calcMsd()">
                                    <option value="25">25° or 3°/s · approach</option>
                                    <option value="15">15° · missed approach / departure</option>
                                    <option value="20">20° or 3°/s · departure (distance from DER)</option>
                                </select>
                            </div>
                            <div class="vp-input-group">
                                <label>Category</label>
                                <select id="msd-cat" onchange="calcMsd()">
                                    <option value="AE">Aeroplane (A–E)</option>
                                    <option value="H">Helicopter (H)</option>
                                </select>
                            </div>
                            <div class="vp-input-group">
                                <label>Non-turning WP · D</label>
                                <select id="msd-dphase" onchange="calcMsd()">
                                    <option value="1.5">1.5 NM · SID &lt; 15 NM DER, intermediate, final</option>
                                    <option value="3">3.0 NM · STAR, initial &lt; 30 NM ARP</option>
                                    <option value="3">3.0 NM · missed approach, SID &lt; 30 NM ARP</option>
                                    <option value="5">5.0 NM · en-route &gt; 30 NM ARP</option>
                                </select>
                            </div>
                        </div>
                        <div class="vp-row" style="margin-top: 12px;">
                            <div class="vp-input-group">
                                <label>IAS (kt)</label>
                                <input type="number" id="msd-ias" placeholder="e.g. 210" oninput="calcMsd()">
                            </div>
                            <div class="vp-input-group">
                                <label>Altitude (ft)</label>
                                <input type="number" id="msd-alt" placeholder="protected altitude" oninput="calcMsd()">
                            </div>
                            <div class="vp-input-group">
                                <label>Temp (ISA +°C)</label>
                                <input type="number" id="msd-isa" value="15" oninput="calcMsd()">
                            </div>
                        </div>
                        <input type="hidden" id="msd-json" value="">

                        <div class="results-panel">
                            <div class="result-row key">
                                <span class="result-label">TAS · turn radius</span>
                                <span id="msd-res-tas" class="result-value c-cyan">---</span>
                            </div>
                        </div>

                        <div class="table-wrap" style="margin-top: 12px;">
                            <table class="qa-table msd-table">
                                <thead><tr><th>Waypoint</th><th>Type</th><th>Course chg</th><th>Track out</th><th>Dist to next</th><th>MSD a + b</th><th>Min length</th><th>Check</th><th></th></tr></thead>
                                <tbody id="msd-rows"></tbody>
                            </table>
                        </div>
                        <button class="btn btn-add" style="margin-top: 8px;" onclick="msdAdd()">＋ Add Waypoint</button>

                        <div id="msd-summary" class="note" style="margin-top: 12px;">—</div>

                        <div class="viz" style="margin-top: 12px;">
                            <span class="viz-label">Route plan · to scale</span>
                            <button class="viz-dl" onclick="exportViz(this)" data-name="rnav-msd" title="Download high-resolution PNG">⤓ PNG</button>
                            <canvas id="msdVizCanvas" width="600" height="300"></canvas>
                        </div>
                        <div class="note" style="margin-top: 12px;">
                            <div class="note-title">Reference</div>
                            Doc 8168 Vol II III-2-1 §1.2–1.5: fly-by MSD = r·tan(θ/2) + 5 s (Cat H 3 s); fly-over MSD = L1…L5 with a 30° intercept, 15° roll-out and 10 s (Cat H 5 s);
                            θ &lt; 50° (Cat H 30°) uses the 50° value; Table III-2-1-21 for non-turning waypoints. TAS from IAS at the protected altitude.
                            Checked against Tables III-2-1-7 to III-2-1-12 (1 337 of 1 350 cells within ±0.05 NM; the 25° fly-by table's 130 kt column appears to omit the 3°/s limit).
                        </div>
                    </div>
                </div>
'''
i = s.index('<span class="card-tag">09-C</span>')
j = s.rfind('\n                <div class="card">', 0, i)
s = s[:j] + CARD + s[j:]

rep("'calcIfix', 'calcPathTerm'].forEach((f) => run(f));", "'calcIfix', 'calcPathTerm', 'calcMsd'].forEach((f) => run(f));")
rep("                if (id === 'tab-pt') { ptRenderReference(); calcPathTerm(); }", "                if (id === 'tab-pt') { ptRenderReference(); calcPathTerm(); calcMsd(); }")
rep("            if (typeof calcPathTerm === 'function') calcPathTerm();\n            redrawGradients();", "            if (typeof calcPathTerm === 'function') calcPathTerm();\n            if (typeof calcMsd === 'function') calcMsd();\n            redrawGradients();")
rep("""                                <li><b>09 Path terminators</b> (new)""", """                                <li><b>09-D MSD</b> (new): fly-by / fly-over minimum stabilization distance (III-2-1 §1.4), leg checks §1.2.5 and Table III-2-1-21.</li>
                                <li><b>09 Path terminators</b> (new)""")
rep("        .pt-presets { display: flex;", """        .msd-table input, .msd-table select { height: 30px; font-size: 0.78rem; min-width: 70px; }
        .msd-table tr.short td { background: rgba(255, 122, 133, 0.08); }
        .msd-table td.num { font-family: var(--font-mono); white-space: nowrap; }
        .pt-presets { display: flex;""")
open(p, 'w', encoding='utf-8').write(s)
print('ok')
