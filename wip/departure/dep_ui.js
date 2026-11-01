        // =========================================================
        // 07-D DEPARTURE CLIMB GRADIENT (I-3-2 §2.5–2.7, II-3 §5)
        // =========================================================
        let DEP_ROWS = null;
        const DEP_DEFAULT = [
            { n: 'Light pole', d: 0.3, e: '' },
            { n: 'Mast', d: 2.0, e: '' },
            { n: 'Ridge', d: 6.0, e: '' }
        ];

        function depLoad() {
            if (DEP_ROWS) return;
            try { DEP_ROWS = JSON.parse(document.getElementById('dep-json').value || 'null'); } catch (e) { DEP_ROWS = null; }
            if (!Array.isArray(DEP_ROWS)) DEP_ROWS = DEP_DEFAULT.map((r) => Object.assign({}, r));
        }

        function depSave() {
            const el = document.getElementById('dep-json');
            el.value = JSON.stringify(DEP_ROWS);
            el.dispatchEvent(new Event('input', { bubbles: true }));
        }

        function depEdit(i, field, value) {
            if (field === 'del') DEP_ROWS.splice(i, 1);
            else DEP_ROWS[i][field] = field === 'n' ? value : (value === '' ? '' : parseFloat(value));
            depSave();
            calcDeparture();
        }

        function depAdd() {
            DEP_ROWS.push({ n: 'Obstacle ' + (DEP_ROWS.length + 1), d: '', e: '' });
            depSave();
            calcDeparture();
        }

        function calcDeparture() {
            if (!document.getElementById('dep-json')) return;
            depLoad();
            const g = (id) => parseFloat(document.getElementById(id).value);
            const set = (id, t) => { const el = document.getElementById(id); if (el) el.textContent = t; };
            const der = g('dep-der');
            const catH = document.getElementById('dep-cat').value === 'H';
            const gs = g('dep-gs');
            const obs = DEP_ROWS.map((r) => ({ n: r.n, d: parseFloat(r.d), h: isNaN(der) ? NaN : parseFloat(r.e) - der, e: parseFloat(r.e) }));
            const A = PANS.depAnalyse(obs.filter((o) => !isNaN(o.d) && !isNaN(o.h)), catH);
            const S = A.std;
            const pct = (x) => (x * 100).toFixed(1) + ' %';
            const ft = (x) => Math.round(x).toLocaleString();

            // obstacle table
            const byName = new Map(A.rows.map((r) => [r.n + '|' + r.d, r]));
            document.getElementById('dep-rows').innerHTML = DEP_ROWS.map((r, i) => {
                const a = byName.get(r.n + '|' + parseFloat(r.d));
                const cls = a ? a.cls : '';
                const verdict = !a ? '—' : cls === 'clear' ? '✓ below OIS' : cls === 'close-in' ? '⚠ close-in · publish obstacle' : '✕ penetrates · PDG ' + pct(a.P);
                return '<tr class="' + cls + '"><td><input type="text" value="' + escHtml(r.n) + '" onchange="depEdit(' + i + ', \'n\', this.value)"></td>' +
                    '<td><input type="number" step="0.01" value="' + (r.d === '' ? '' : r.d) + '" placeholder="NM" onchange="depEdit(' + i + ', \'d\', this.value)"></td>' +
                    '<td><input type="number" value="' + (r.e === '' ? '' : r.e) + '" placeholder="ft AMSL" onchange="depEdit(' + i + ', \'e\', this.value)"></td>' +
                    '<td class="num">' + (a ? ft(a.h) : '—') + '</td>' +
                    '<td class="num">' + (a ? ft(a.oisH) : '—') + '</td>' +
                    '<td class="num">' + (a ? (a.pen > 0 ? '+' : '') + ft(a.pen) : '—') + '</td>' +
                    '<td class="' + (cls === 'clear' ? 'c-success' : cls === 'close-in' ? 'c-warning' : cls === 'pdg' ? 'c-danger' : '') + '">' + verdict + '</td>' +
                    '<td><button class="btn-mini danger" onclick="depEdit(' + i + ', \'del\')" title="Remove obstacle">✕</button></td></tr>';
            }).join('');

            // results
            const raised = A.P > S.pdg + 1e-12;
            set('dep-res-pdg', pct(A.P) + (raised ? ' (increased)' : ' (standard)'));
            set('dep-res-to', raised ? ft(A.endH + (isNaN(der) ? 0 : der)) + ' ft AMSL (' + ft(A.endH) + ' ft above DER, ' + (A.endX / 6076.12).toFixed(2) + ' NM)' : '—');
            set('dep-res-ftnm', ft(A.P * 6076.12) + ' ft/NM');
            set('dep-res-roc', isNaN(gs) ? '—' : ft(PANS.rocFor(A.P, gs)) + ' ft/min at ' + gs + ' kt GS');
            const turnH = catH ? 295 : 394;
            set('dep-res-turn', (((turnH - PANS.DEP_ORIGIN_FT) / A.P) / 6076.12).toFixed(2) + ' NM to ' + turnH + ' ft (' + (catH ? 90 : 120) + ' m)');
            set('dep-res-std', 'OIS ' + pct(S.ois) + ' + MOC 0.8 % = ' + pct(S.pdg));
            const tbl = [100, 150, 200, 250, 300].map((v) => v + ' kt ' + ft(PANS.rocFor(A.P, v))).join(' · ');
            set('dep-res-table', tbl + ' ft/min');

            const notes = [];
            if (raised) notes.push('PDG ' + pct(A.P) + ' up to ' + ft(A.endH + (isNaN(der) ? 0 : der)) + ' ft');
            if (A.closeIn.length) notes.push('Close-in obstacles: ' + A.closeIn.map((r) => r.n + ' ' + ft(r.e) + ' ft, ' + r.d.toFixed(2) + ' NM from DER').join('; '));
            const box = document.getElementById('dep-note');
            box.className = 'note ' + (raised ? 'warn' : 'ok');
            box.innerHTML = '<div class="note-title">Suggested chart notes</div>' + (notes.length ? notes.map(escHtml).join('<br>') : 'Standard 3.3 % PDG; no OIS penetrations.') +
                (raised ? '<br><span class="c-muted">Consider an alternative VMC-only procedure with a lower PDG (II-3 §5.1 e).</span>' : '');

            drawDepViz(A, der, catH);
        }

        function drawDepViz(A, der, catH) {
            const canvas = document.getElementById('depVizCanvas');
            if (!canvas) return;
            const { ctx, w, h } = setupCanvas(canvas, 0.45, 380, 230);
            const C = bpColors();
            const S = A.std, O = PANS.DEP_ORIGIN_FT;
            const maxD = Math.max(3, ...A.rows.map((r) => r.d * 1.15 || 0), A.endX / 6076.12 * 1.2 || 0);
            const pdgEnd = maxD * 6076.12;
            const pathH = (x) => (A.P > S.pdg && x <= A.endX) ? O + A.P * x : O + A.P * A.endX + S.pdg * (x - A.endX);
            const maxH = Math.max(450, pathH(pdgEnd) * 1.05, ...A.rows.map((r) => r.h * 1.15 || 0));
            const pad = { l: 58, r: 20, t: 30, b: 34 };
            const X = (nm) => pad.l + (nm / maxD) * (w - pad.l - pad.r);
            const Y = (hf) => h - pad.b - (hf / maxH) * (h - pad.t - pad.b);

            // grid + axes
            ctx.save(); ctx.strokeStyle = C.soft; ctx.lineWidth = 1;
            const xs = maxD > 8 ? 2 : 1;
            for (let n = 0; n <= maxD + 1e-9; n += xs) { ctx.beginPath(); ctx.moveTo(X(n), pad.t); ctx.lineTo(X(n), h - pad.b); ctx.stroke(); cvLabel(ctx, C, String(n), X(n), h - pad.b + 13, { size: 9, box: false, color: C.muted }); }
            const ys = maxH > 3000 ? 1000 : maxH > 1200 ? 500 : 200;
            for (let v = 0; v <= maxH; v += ys) { ctx.beginPath(); ctx.moveTo(pad.l, Y(v)); ctx.lineTo(w - pad.r, Y(v)); ctx.stroke(); cvLabel(ctx, C, String(v), pad.l - 6, Y(v), { size: 9, box: false, color: C.muted, align: 'right' }); }
            ctx.restore();
            // reference heights
            [[200, '60 m / 200 ft · close-in limit'], [catH ? 295 : 394, (catH ? '90 m' : '120 m') + ' · min turn height']].forEach(([v, t]) => {
                if (v > maxH) return;
                ctx.save(); ctx.setLineDash([2, 4]); ctx.strokeStyle = C.muted; ctx.beginPath(); ctx.moveTo(pad.l, Y(v)); ctx.lineTo(w - pad.r, Y(v)); ctx.stroke(); ctx.restore();
                cvLabel(ctx, C, t, w - pad.r - 4, Y(v) - 7, { size: 8.5, box: false, color: C.muted, align: 'right' });
            });
            // OIS and MOC band
            ctx.save();
            ctx.beginPath(); ctx.moveTo(X(0), Y(O)); ctx.lineTo(X(maxD), Y(O + S.ois * pdgEnd)); ctx.lineTo(X(maxD), Y(pathH(pdgEnd))); ctx.lineTo(X(0), Y(O)); ctx.closePath();
            ctx.fillStyle = C.fill; ctx.fill();
            ctx.setLineDash([6, 4]); ctx.strokeStyle = C.violet; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(X(0), Y(O)); ctx.lineTo(X(maxD), Y(O + S.ois * pdgEnd)); ctx.stroke();
            ctx.setLineDash([3, 4]); ctx.strokeStyle = C.muted; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(X(0), Y(O)); ctx.lineTo(X(maxD), Y(O + S.pdg * pdgEnd)); ctx.stroke();
            ctx.restore();
            // flight path
            const pts = [];
            for (let i = 0; i <= 80; i++) { const x = pdgEnd * i / 80; pts.push([x, pathH(x)]); }
            if (A.endX > 0) { pts.push([A.endX, pathH(A.endX)]); pts.sort((a, b) => a[0] - b[0]); }
            const Vv = { X: (x) => X(x / 6076.12), Y: (y) => Y(y), k: 1 };
            cvStroke(ctx, C, Vv, pts, A.P > S.pdg ? C.warning : C.success, 2.6);
            if (A.endX > 0) {
                cvDot(ctx, C, X(A.endX / 6076.12), Y(A.endH), C.warning, 4);
                cvLabel(ctx, C, 'PDG ' + (A.P * 100).toFixed(1) + '% → ' + Math.round(A.endH + (isNaN(der) ? 0 : der)) + ' ft', X(A.endX / 6076.12), Y(A.endH) - 14, { size: 10, bold: true, color: C.warning, border: C.soft });
            }
            // obstacles
            A.rows.forEach((r) => {
                if (r.cls === 'invalid') return;
                const col = r.cls === 'clear' ? C.success : r.cls === 'close-in' ? C.warning : C.danger;
                const x = X(r.d), y = Y(r.h);
                ctx.save(); ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 5, Y(0)); ctx.lineTo(x - 5, Y(0)); ctx.closePath(); ctx.globalAlpha = 0.85; ctx.fill(); ctx.restore();
                cvLabel(ctx, C, r.n, x, y - 9, { size: 9, color: col, box: false });
            });
            cvLabel(ctx, C, '- - OIS ' + (S.ois * 100).toFixed(1) + '%  · · ' + (S.pdg * 100).toFixed(1) + '% std  — flight path', pad.l + 4, pad.t - 14, { size: 9, align: 'left', box: false, color: C.muted });
            cvLabel(ctx, C, 'ft above DER · NM from DER · vertical exaggerated', w - pad.r, pad.t - 14, { size: 8.5, align: 'right', box: false, color: C.muted });
        }

