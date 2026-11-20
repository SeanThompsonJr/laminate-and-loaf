/**
 * Advent: a wooden tray of 24 pegs, one for each holiday pickup day, Dec 1 to
 * 24, in rows of six. The pegs rise under the pointer and fall off with
 * distance; the three Mondays, when the shop is closed, never rise and keep
 * the dim stroke. At rest the first open day, Dec 2, is bright. The read-out
 * names the day. The slider is the radius, in pegs.
 *
 * The pattern: a field (Terrain). Springs, a falloff by distance, a hit test on
 * the ground plane, and a rest that is a composition.
 */
const {
  Cam, clamp, facing, fit, poly, prism, proj, rings, ringAt, unproj, spring, stepS,
  flatDot, mk, place, pointer, put, register, disposer, solid,
} = HL;

const COLS = 6, ROWS = 4, CELL = 17, FOOT = 12.5, HMAX = 34, PB = 6;
const W = COLS * CELL, D = ROWS * CELL;
const MONDAYS = [7, 14, 21];                                      // Dec 2026: the 1st is a Tuesday
const falloff = (u) => (u <= 0 ? 1 : u <= 0.417 ? 1 - (u / 0.417) * 0.6875 : u <= 1 ? 0.3125 - ((u - 0.417) / 0.583) * 0.2185 : 0.094);

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  const C = Cam(45, 0.5, 2.0);
  fit(C, [[-7, -7, -PB], [W + 7, D + 7, -PB], [W + 7, -7, -PB], [-7, D + 7, -PB], [0, 0, HMAX + 4]], 200, 166);
  const P = proj(C), front = facing(C);
  let R = value * CELL, over = null;
  const g = mk("g", {}, svg), pegs = [];
  const face = (s, kind) => { s.g.classList.add("k-" + kind); const f = mk("path", { class: "fo face" }, s.g); s.sil.after(f); return f; };

  const [tr, ti] = rings(-7, -7, W + 7, D + 7, 8, 2);
  const trayS = solid(g); put(trayS, prism(P, front, tr, ti, -PB, 0)); face(trayS, "wood").setAttribute("d", poly(ringAt(P, tr, 0)));

  for (let s = 0; s <= COLS + ROWS - 2; s++) for (let i = 0; i < COLS; i++) {
    const j = s - i;
    if (j < 0 || j >= ROWS) continue;
    const day = j * COLS + i + 1, closed = MONDAYS.includes(day);
    const h0 = closed ? 2 : 4 + 9 * Math.exp(-(((i - 1) / 2.2) ** 2 + ((j - 0) / 1.6) ** 2)) + 5 * Math.exp(-(((i - 4.5) / 1.6) ** 2 + ((j - 3) / 1.3) ** 2));
    const x0 = i * CELL + (CELL - FOOT) / 2, y0 = j * CELL + (CELL - FOOT) / 2;
    const [ring, inner] = rings(x0, y0, x0 + FOOT, y0 + FOOT, 3.2, 1);
    const el = solid(g), top = face(el, closed ? "peg-off" : ["peg-red", "peg-cream", "peg-green"][day % 3]);
    if (closed) el.sil.classList.add("lo");
    pegs.push({ i, j, day, closed, h0, ring, inner, sp: spring(h0, { eps: 0.04 }), el, top, drawn: NaN });
  }
  const byDay = new Map(pegs.map((p) => [p.day, p]));

  // the mark: three dots on the lid of the chosen day, moved in the paint order to just after its peg
  const mark = mk("g", {}, g), md = [0, 1, 2].map((k) => flatDot(mark, C, 0.7, k === 1 ? "dot" : "dot m"));
  let want = byDay.get(2), mc = null;
  function drawMark() {
    if (want !== mc) { mc = want; mc.el.g.after(mark); }
    const cx = (mc.i + 0.5) * CELL, cy = (mc.j + 0.5) * CELL, h = Math.max(0.6, mc.sp.x);
    md.forEach((el, k) => place(el, P(cx + (k - 1) * 3, cy, h)));
  }
  function drawPeg(p) {
    const h = Math.max(0.6, p.sp.x);
    if (h === p.drawn) return;
    p.drawn = h;
    put(p.el, prism(P, front, p.ring, p.inner, 0, h)); p.top.setAttribute("d", poly(ringAt(P, p.ring, h)));
  }
  function bright(p) { pegs.forEach((q) => q.el.sil.classList.toggle("hi", q === p)); }

  const B = register(stage, (dt) => {
    let m = false;
    for (const p of pegs) { if (stepS(p.sp, dt)) m = true; drawPeg(p); }
    drawMark();
    return m;
  });
  bag.add(B.unregister);

  function retarget() {
    for (const p of pegs) {
      if (!over || p.closed) { p.sp.t = p.h0; continue; }
      const dx = (p.i + 0.5) * CELL - over[0], dy = (p.j + 0.5) * CELL - over[1];
      p.sp.t = Math.max(p.h0 * 0.6, HMAX * falloff(Math.hypot(dx, dy) / R));
    }
    if (over) {
      const p = byDay.get(clamp(Math.floor(over[1] / CELL), 0, ROWS - 1) * COLS + clamp(Math.floor(over[0] / CELL), 0, COLS - 1) + 1);
      want = p; bright(p.closed ? null : p);
      read.textContent = "dec " + p.day + (p.closed ? " closed" : "");
    } else { want = byDay.get(2); bright(want); read.textContent = "rest"; }
    B.wake();
  }

  bright(want);
  bag.add(pointer(stage, {
    move: (p) => { const q = unproj(C, p[0], p[1], 0); over = q[0] > -6 && q[0] < W + 6 && q[1] > -6 && q[1] < D + 6 ? q : null; retarget(); },
    leave: () => { over = null; retarget(); },
  }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { R = v * CELL; if (over) retarget(); }, destroy: bag.dispose };
}

hairline({
  name: "advent",
  means: "Twenty-four pegs, one per holiday pickup day: they rise under the pointer, and Mondays stay down.",
  rules: [1, 3, 5, 9],
  range: [1.2, 2, 3.2],
  tour: [[150, 140], [230, 150], [250, 200], null],
  mount,
});
