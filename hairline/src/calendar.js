/**
 * Calendar: a December desk calendar standing upright on its base and facing
 * you, a blue header across the top held by two binder rings, and the days as
 * square tiles set into the page, seven columns from Monday. Open days stand
 * out from the page, booked-up days sit nearly flush with a cross on them, and
 * closed days (Mondays, the day before orders open, Christmas) lie flat. Under
 * the pointer the open days pull out toward you, falling off with distance; the
 * read-out names the day and whether it is open. At rest Dec 2, the first open
 * day, carries the mark. The slider is the radius, in tiles. Sample availability.
 *
 * The pattern: a field (Terrain), turned to face the reader. Springs, a falloff
 * by distance, and a hit test on the page's plane, which never moves. Each solid
 * carries a kind class and a top face for the page to colour; no colour is set here.
 */
const {
  Cam, clamp, facing, fit, poly, prism, proj, rings, ringAt, seg, spring, stepS,
  mk, place, pointer, put, register, disposer, solid,
} = HL;

const COLS = 7, ROWS = 4, CELL = 15, FOOT = 12, T = 4, OUT = 18;     // grid; page thickness; how far a tile can pull out
const W = COLS * CELL, BOT = 7, ZTOP = BOT + ROWS * CELL, HEAD = 18, H = ZTOP + 6 + HEAD;
const BOOKED = [5, 12, 19, 20, 23], CLOSED = [1, 7, 14, 21, 25, 26, 27];
const DEPTH = { open: 4.5, booked: 1.6, closed: 0.5, out: 0.3 };
const falloff = (u) => (u <= 0 ? 1 : u <= 0.417 ? 1 - (u / 0.417) * 0.6875 : u <= 1 ? 0.3125 - ((u - 0.417) / 0.583) * 0.2185 : 0.094);

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  const C = Cam(16, 0.32, 2.05);
  fit(C, [[-8, -12, -6], [W + 8, T + 14, -6], [W + 8, T + OUT, ZTOP], [-8, T, H + 6], [W + 8, -12, H + 6]], 200, 166);
  const P = proj(C), front = facing(C);
  let R = value * CELL, over = null;
  const g = mk("g", {}, svg);
  const face = (s, kind) => { s.g.classList.add("k-" + kind); const f = mk("path", { class: "fo face" }, s.g); s.sil.after(f); return f; };
  const block = (kind, x0, y0, x1, y1, r, b, z0, z1) => { const s = solid(g), [o, n] = rings(x0, y0, x1, y1, r, b); put(s, prism(P, front, o, n, z0, z1)); face(s, kind).setAttribute("d", poly(ringAt(P, o, z1))); return s; };

  // the base on the desk, the upright page, its header, and the two rings over its top edge
  block("calhead", -8, -12, W + 8, T + 14, 5, 1.6, -6, 0);
  block("calbase", -4, 0, W + 4, T, 2, 0.8, 0, H);
  const head = block("calhead", -2, T - 0.5, W + 2, T + 2, 1.2, 0.5, ZTOP + 6, H - 3);
  [W * 0.25, W * 0.75].forEach((x) => block("ring", x - 3, -2.5, x + 3, T + 3.5, 2.5, 0.8, H - 6, H + 6));
  // seven little marks under the header, one per weekday column
  mk("path", { class: "nf lo", d: Array.from({ length: 7 }, (_, i) => seg(P((i + 0.5) * CELL - 3, T + 2, ZTOP + 10), P((i + 0.5) * CELL + 3, T + 2, ZTOP + 10))).join("") }, head.g);

  // the tiles, painted from the bottom row up and left to right, so nearer ones cover farther ones
  const tiles = [];
  for (let j = ROWS - 1; j >= 0; j--) for (let i = 0; i < COLS; i++) {
    const day = j * COLS + i;                                     // 0 is Nov 30 (a Monday); 1 is Dec 1, a Tuesday
    const state = day === 0 ? "out" : CLOSED.includes(day) ? "closed" : BOOKED.includes(day) ? "booked" : "open";
    const x0 = i * CELL + (CELL - FOOT) / 2, z1 = ZTOP - j * CELL - (CELL - FOOT) / 2, z0 = z1 - FOOT;
    const el = solid(g), top = face(el, "day-" + state), cross = state === "booked" ? mk("path", { class: "nf cross" }, el.g) : null;
    if (state === "closed" || state === "out") el.sil.classList.add("lo");
    tiles.push({ i, j, day, state, x0, z0, z1, d0: DEPTH[state], sp: spring(DEPTH[state], { eps: 0.03 }), el, top, cross, drawn: NaN });
  }
  const byDay = new Map(tiles.map((t) => [t.day, t]));

  // the mark: three dots on the face of the chosen day, moved in the paint order to just after its tile
  const mark = mk("g", {}, g), md = [0, 1, 2].map((k) => mk("circle", { r: 1.1, class: k === 1 ? "dot" : "dot m" }, mark));
  let want = byDay.get(2), mc = null;
  function drawMark() {
    if (want !== mc) { mc = want; mc.el.g.after(mark); }
    const y = T + Math.max(0.3, mc.sp.x) + 0.05, zc = (mc.z0 + mc.z1) / 2;
    md.forEach((el, k) => place(el, P(mc.x0 + FOOT / 2 + (k - 1) * 3, y, zc)));
  }
  function drawTile(t) {
    const d = Math.max(0.3, t.sp.x);
    if (d === t.drawn) return;
    t.drawn = d;
    const [o, n] = rings(t.x0, T, t.x0 + FOOT, T + d, Math.min(2.4, d / 2), Math.min(0.9, d / 4));
    put(t.el, prism(P, front, o, n, t.z0, t.z1));
    t.top.setAttribute("d", poly(ringAt(P, o, t.z1)));
    if (t.cross) { const y = T + d, a = 3.5; t.cross.setAttribute("d", seg(P(t.x0 + a, y, t.z0 + a), P(t.x0 + FOOT - a, y, t.z1 - a)) + seg(P(t.x0 + a, y, t.z1 - a), P(t.x0 + FOOT - a, y, t.z0 + a))); }
  }
  function bright(t) { tiles.forEach((q) => q.el.sil.classList.toggle("hi", q === t)); }

  const B = register(stage, (dt) => {
    let m = false;
    for (const t of tiles) { if (stepS(t.sp, dt)) m = true; drawTile(t); }
    drawMark();
    return m;
  });
  bag.add(B.unregister);

  // the page's plane, y = T, never moves: the pointer is read on it as (x, z)
  const o0 = P(0, T, 0), ex = P(1, T, 0), ez = P(0, T, 1);
  const ax = [ex[0] - o0[0], ex[1] - o0[1]], az = [ez[0] - o0[0], ez[1] - o0[1]], det = ax[0] * az[1] - ax[1] * az[0];
  const onPage = ([sx, sy]) => { const qx = sx - o0[0], qy = sy - o0[1]; return [(qx * az[1] - qy * az[0]) / det, (ax[0] * qy - ax[1] * qx) / det]; };

  const label = (t) => (t.day === 0 ? "nov 30" : "dec " + t.day) + " " + (t.state === "out" ? "closed" : t.state);
  function retarget() {
    for (const t of tiles) {
      if (!over || t.state !== "open") { t.sp.t = t.d0; continue; }
      const dx = t.x0 + FOOT / 2 - over[0], dz = (t.z0 + t.z1) / 2 - over[1];
      t.sp.t = Math.max(t.d0, OUT * falloff(Math.hypot(dx, dz) / R));
    }
    if (over) {
      const t = byDay.get(clamp(Math.floor((ZTOP - over[1]) / CELL), 0, ROWS - 1) * COLS + clamp(Math.floor(over[0] / CELL), 0, COLS - 1));
      want = t; bright(t.state === "open" ? t : null);
      read.textContent = label(t);
    } else { want = byDay.get(2); bright(want); read.textContent = "rest"; }
    B.wake();
  }

  bright(want);
  bag.add(pointer(stage, {
    move: (p) => { const [x, z] = onPage(p); over = x > -3 && x < W + 3 && z > BOT - 3 && z < ZTOP + 3 ? [x, z] : null; retarget(); },
    leave: () => { over = null; retarget(); },
  }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { R = v * CELL; if (over) retarget(); }, destroy: bag.dispose };
}

hairline({
  name: "calendar",
  means: "A December desk calendar facing you: open days stand out and pull toward the pointer, booked days sit flush, closed days lie flat.",
  rules: [1, 3, 5, 9],
  range: [1, 1.8, 3],
  tour: [[150, 170], [220, 190], [260, 230], null],
  mount,
});
