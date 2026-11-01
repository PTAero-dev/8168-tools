            // ---------- Departures (Part I, Section 3, Chapter 2) ----------
            // OIS 2.5 % (Cat H 4.2 %) from 5 m (16 ft) above DER; MOC 0.8 % of distance; standard PDG 3.3 % (Cat H 5.0 %)
            depStd(catH) { return catH ? { ois: 0.042, pdg: 0.050 } : { ois: 0.025, pdg: 0.033 }; },
            DEP_ORIGIN_FT: 16,
            DEP_MOC: 0.008,
            // Required PDG for one obstacle: clearance of 0.8 % of its distance above it (§2.7.2). d in ft, h = height above DER (ft)
            depPdgFor(dFt, hFt) { return (hFt - PANS.DEP_ORIGIN_FT) / dFt + PANS.DEP_MOC; },
            // Analyse an obstacle list: [{ n, d (NM), h (ft above DER) }]
            depAnalyse(obs, catH) {
                const S = PANS.depStd(catH), O = PANS.DEP_ORIGIN_FT;
                const rows = obs.map((o) => {
                    const dFt = o.d * 6076.12, oisH = O + S.ois * dFt, pen = o.h - oisH;
                    if (!(dFt > 0) || isNaN(o.h)) return Object.assign({}, o, { dFt, oisH, pen: NaN, P: NaN, endH: NaN, cls: 'invalid' });
                    if (pen <= 0) return Object.assign({}, o, { dFt, oisH, pen, P: S.pdg, endH: NaN, cls: 'clear' });
                    const P = Math.max(S.pdg, PANS.depPdgFor(dFt, o.h));
                    const endH = O + P * dFt;                                   // height where this obstacle alone lets the PDG return to standard
                    return Object.assign({}, o, { dFt, oisH, pen, P, endH, cls: endH <= 200 ? 'close-in' : 'pdg' });  // §2.7.5: ≤ 60 m (200 ft) not promulgated
                });
                const governing = rows.filter((r) => r.cls === 'pdg');
                const P = Math.max(S.pdg, ...governing.map((r) => r.P));
                // §2.7.4 / II-3 §5.2 e): increased PDG ends where a standard gradient clears every governing obstacle with 0.8 % MOC
                let endX = 0;
                if (P > S.pdg + 1e-12) governing.forEach((r) => { endX = Math.max(endX, (r.h - O - S.ois * r.dFt) / (P - S.pdg)); });
                return { rows, P, std: S, endX, endH: P > S.pdg + 1e-12 ? O + P * endX : NaN, closeIn: rows.filter((r) => r.cls === 'close-in') };
            },
            // climb rate (ft/min) for a gradient at a ground speed (kt)
            rocFor(grad, gs) { return grad * gs * 101.2685; },
