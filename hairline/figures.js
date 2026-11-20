/* Hairline figures for Laminate & Loaf, bundled from src/ by bundle.mjs. Edit src/, not this file. */
/* ---- bakeline.js ---- */
(() => {
/**
 * Bake line: a bakery counter belt that never stops. Dough is laid at the
 * laminating slab, rides through the oven and comes out risen, is boxed at the
 * box stack, and leaves under the pickup frame. Hovering slows the belt on a
 * spring so one piece can be followed; the station under the pointer takes the
 * bright edge and the read-out names it. The slider is the belt's speed.
 *
 * The pattern: dilate time (Slow). An ambient loop, a spring on the rate, a hit
 * test on the ground plane, and paint order kept by moving groups, not redrawing.
 */
const {
  Cam, clamp, facing, fit, lerp, open, poly, prism, proj, rings, ringAt, rrect, seg, unproj,
  spring, stepS, disposer, mk, pointer, put, register, solid,
} = HL;

const BX0 = 0, BX1 = 236, BY0 = 0, BY1 = 34, CY = 17;            // the belt
const OV = [88, -6, 140, 42, 40];                                 // oven x0, y0, x1, y1, height
const PK = 222;                                                   // pickup frame's x
const N = 6, GAP = 46, LOOP = N * GAP;
const ZONES = [[-40, 78, "slab"], [78, 148, "oven"], [148, 206, "box"], [206, 280, "pickup"]];
const ss = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

/** One piece of the belt at x: footprint half-sizes, corner radius, height, and whether it is boxed. */
function form(x) {
  const bake = ss(132, 148, x), box = ss(166, 178, x);
  const grow = ss(4, 20, x) * (1 - ss(PK - 10, PK + 4, x));
  const hx = lerp(lerp(9.5, 11, bake), 11.5, box), hy = lerp(lerp(6.5, 8.5, bake), 11.5, box);
  const r = lerp(lerp(5.5, 7.5, bake), 2.4, box), h = lerp(lerp(3.6, 9.5, bake), 14, box);
  return { hx: hx * (0.55 + 0.45 * grow), hy: hy * (0.55 + 0.45 * grow), r, h: h * grow, boxed: box > 0.5, on: grow > 0.02 };
}

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  const C = Cam(45, 0.5, 1.5);
  fit(C, [[-6, -36, -8], [BX1 + 6, BY1 + 32, -8], [BX1, -10, 54], [OV[2], OV[3], OV[4] + 12], [0, BY1, 0], [BX1 + 6, -36, 0], [150, 66, 0]], 200, 166);
  const P = proj(C), front = facing(C);
  let base = value;
  const rate = spring(value), g = mk("g", {}, svg);
  const face = (s, kind) => { s.g.classList.add("k-" + kind); const f = mk("path", { class: "fo face" }, s.g); s.sil.after(f); return f; };
  const st = (parent, x0, y0, x1, y1, r, b, z0, z1, kind) => { const s = solid(parent), [o, i] = rings(x0, y0, x1, y1, r, b); put(s, prism(P, front, o, i, z0, z1)); if (kind) face(s, kind).setAttribute("d", poly(ringAt(P, o, z1))); return s; };

  // Laminate & Loaf's gift box: a ribbon down the two near sides and across the lid, a lid seam, a bow on top,
  // and, on the larger boxes, a small gift tag on the lid with the L&L monogram.
  const AMP = [[3.6, 0], [1, 3.4], [1, 4.8], [1.8, 5.6], [2.6, 5], [2.4, 4], [0.6, 2.4], [0.6, 0.8], [1.6, 0], [2.8, 0.4], [3.8, 1.8]];
  function brand(x0, y0, x1, y1, z0, z1, mono) {
    const s = (x1 - x0) / 23, w = 2.8 * s, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, zl = z1 - 3 * s;
    const quad = (pts) => poly(pts.map((q) => P(q[0], q[1], q[2])));
    const ribbon = quad([[cx - w / 2, y1, z0 + 0.4], [cx + w / 2, y1, z0 + 0.4], [cx + w / 2, y1, z1], [cx - w / 2, y1, z1]]) +
      quad([[x1, cy - w / 2, z0 + 0.4], [x1, cy + w / 2, z0 + 0.4], [x1, cy + w / 2, z1], [x1, cy - w / 2, z1]]) +
      quad([[x0 + 0.6, cy - w / 2, z1], [x1, cy - w / 2, z1], [x1, cy + w / 2, z1], [x0 + 0.6, cy + w / 2, z1]]) +
      quad([[cx - w / 2, y0 + 0.6, z1], [cx + w / 2, y0 + 0.6, z1], [cx + w / 2, y1, z1], [cx - w / 2, y1, z1]]);
    const lid = open([P(x0 + 2 * s, y1, zl), P(x1, y1, zl), P(x1, y0 + 2 * s, zl)]);
    const loop = (dx) => poly(Array.from({ length: 16 }, (_, i) => { const t = i / 16 * 2 * Math.PI; return P(cx + dx + 3.6 * s * Math.cos(t), cy, z1 + 3.2 * s + 3.2 * s * Math.sin(t)); }));
    const knot = poly(Array.from({ length: 12 }, (_, i) => { const t = i / 12 * 2 * Math.PI; return P(cx + 1.8 * s * Math.cos(t), cy + 1.8 * s * Math.sin(t), z1 + 1.2 * s); }));
    const bow = loop(-3.6 * s) + loop(3.6 * s) + knot;
    let tag = "", m = "";
    if (mono) {
      const tx0 = x1 - 9.5 * s, tx1 = x1 - 2 * s, ty0 = y1 - 6.4 * s, ty1 = y1 - 1.6 * s;
      tag = quad([[tx0, ty0, z1 + 0.1], [tx1, ty0, z1 + 0.1], [tx1, ty1, z1 + 0.1], [tx0, ty1, z1 + 0.1]]);
      const k = (tx1 - tx0 - 1.6 * s) / 12.4, mx = (tx0 + tx1) / 2, my = (ty0 + ty1) / 2, at = (gx, gy) => P(mx + (gx - 6.2) * k, my - (gy - 3) * k, z1 + 0.1);
      m = open([at(0, 6), at(0, 0), at(3, 0)]) + open(AMP.map(([u, v]) => at(4.4 + u, v))) + open([at(9.4, 6), at(9.4, 0), at(12.4, 0)]);
    }
    return { ribbon, lid, tag, mono: m, bow };
  }
  const brandEls = (parent) => ({ ribbon: mk("path", { class: "fo ribbon" }, parent), lid: mk("path", { class: "nf lidline" }, parent), tag: mk("path", { class: "tag" }, parent), mono: mk("path", { class: "nf mono" }, parent), bow: mk("path", { class: "bow" }, parent) });
  const NOBRAND = { ribbon: "", lid: "", tag: "", mono: "", bow: "" };
  const setBrand = (els, b) => { for (const k in els) els[k].setAttribute("d", b[k]); };

  // back row: the laminating slab (its layers on the near face), the box stack, the pickup frame's far post
  const slab = st(g, -4, -34, 38, -10, 4, 1.4, 0, 12, "slab");
  mk("path", { d: [3, 6, 9].map((z) => seg(P(-1, -10, z), P(35, -10, z))).join(""), class: "nf lo" }, slab.g);
  const postB = st(g, PK, -12, PK + 9, -4, 2.5, 1, 0, 52, "wood");

  // the belt, and its slats, which ride with it
  const belt = st(g, BX0, BY0, BX1, BY1, 10, 1.6, -9, 0, "belt");
  const slats = mk("path", { class: "nf lo" }, g);

  // pieces before the oven are painted behind it, pieces past it in front
  const before = mk("g", {}, g);
  const oven = st(g, OV[0], OV[1], OV[2], OV[3], 6, 1.8, 0, OV[4], "oven");
  mk("path", { d: poly(rrect(2, 2, 32, 22, 6, 4).map((q) => P(OV[2], q.u, q.v))), class: "mouth" }, oven.g);
  mk("path", { d: poly(rrect(4, 4, 32, 18, 3, 3).map((q) => P(OV[0] + q.u + 6, OV[3], q.v))), class: "win" }, oven.g);
  [0, 1, 2].forEach((k) => HL.place(mk("circle", { r: 1.6, class: "dot off" }, oven.g), P(OV[0] + 12 + k * 7, OV[3], OV[4] - 6)));
  mk("path", { d: seg(P(OV[0] + 12, OV[3], 22), P(OV[0] + 34, OV[3], 22)), class: "nf" }, oven.g);
  const flue = st(oven.g, OV[0] + 8, OV[1] + 6, OV[0] + 20, OV[1] + 18, 4, 1, OV[4], OV[4] + 12, "flue");
  const after = mk("g", {}, g);
  const postF = st(g, PK, BY1 + 4, PK + 9, BY1 + 12, 2.5, 1, 0, 52, "wood");
  const lintel = st(g, PK - 1, -12, PK + 10, BY1 + 12, 3, 1.2, 46, 54, "wood");
  // the box station: spare branded boxes, two on the floor and one on top
  const stack = mk("g", {}, g), boxes = [];
  [[144, 44, 0], [164, 46, 0], [153, 45, 14]].forEach(([x, y, z]) => { const s = st(stack, x, y, x + 18, y + 18, 2, 1, z, z + 14, "pbox"); setBrand(brandEls(s.g), brand(x, y, x + 18, y + 18, z, z + 14, true)); boxes.push(s); });
  const stations = { slab: [slab], oven: [oven, flue], box: boxes, pickup: [postB, postF, lintel] };

  const items = [];
  for (let i = 0; i < N; i++) {
    const s = solid(before), top = face(s, "dough"), tie = mk("path", { class: "nf tie" }, s.g);
    items.push({ s, top, tie, kind: "dough", br: brandEls(s.g) });
  }
  let off = 0, act = "", over = false;

  function light(name) {
    if (name === act) return;
    act = name;
    for (const [k, list] of Object.entries(stations)) list.forEach((s) => s.sil.classList.toggle("hi", k === (name || "oven")));
    read.textContent = name || "rest";
  }

  function draw() {
    let sl = "";
    for (let x = ((off % 16) + 16) % 16 + 6; x < BX1 - 6; x += 16) sl += seg(P(x, 3, 0), P(x, BY1 - 3, 0));
    slats.setAttribute("d", sl);
    const xs = items.map((_, i) => ((off + i * GAP) % LOOP + LOOP) % LOOP - 30);
    const order = items.map((it, i) => [it, xs[i]]).sort((a, b) => a[1] - b[1]);
    for (const [it, x] of order) {
      const f = form(x), side = x < OV[2] ? 0 : 1;
      (side ? after : before).append(it.s.g);
      if (!f.on || (x > OV[0] + 4 && x < OV[2] - 4)) { it.s.sil.setAttribute("d", ""); it.s.cr.setAttribute("d", ""); it.top.setAttribute("d", ""); it.tie.setAttribute("d", ""); setBrand(it.br, NOBRAND); continue; }
      const kind = f.boxed ? "pbox" : x > OV[2] - 6 ? "baked" : "dough";
      if (kind !== it.kind) { it.s.g.classList.replace("k-" + it.kind, "k-" + kind); it.kind = kind; }
      const [o, inn] = rings(x - f.hx, CY - f.hy, x + f.hx, CY + f.hy, f.r, Math.min(1.2, f.hy * 0.3));
      put(it.s, prism(P, front, o, inn, 0, Math.max(0.6, f.h)));
      it.top.setAttribute("d", poly(ringAt(P, o, Math.max(0.6, f.h))));
      setBrand(it.br, f.boxed ? brand(x - f.hx, CY - f.hy, x + f.hx, CY + f.hy, 0, f.h, true) : NOBRAND);
    }
  }

  const B = register(stage, (dt) => {
    stepS(rate, dt);
    off += rate.x * dt;
    draw();
    return true;
  });
  bag.add(B.unregister);

  bag.add(pointer(stage, {
    move: (p) => {
      const [x, y] = unproj(C, p[0], p[1], 0);
      over = y > -44 && y < BY1 + 20 && x > -30 && x < BX1 + 20;
      rate.t = over ? base * 0.22 : base;
      light(over ? (ZONES.find((z) => x >= z[0] && x < z[1]) || [0, 0, ""])[2] : "");
      B.wake();
    },
    leave: () => { over = false; rate.t = base; light(""); B.wake(); },
  }));
  light(null); light("");
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { base = v; rate.t = over ? v * 0.22 : v; B.wake(); },
    destroy: bag.dispose,
  };
}

hairline({
  name: "bakeline",
  means: "A bakery belt carries dough through the oven, into a box and out to pickup; hovering slows it so you can follow one.",
  rules: [1, 4, 5, 7],
  range: [10, 22, 40],
  tour: [[110, 150], [200, 140], [270, 170], [330, 210], null],
  mount,
});

})();

/* ---- case.js ---- */
(() => {
/**
 * Case: a bakery's glass display case with three trays on its counter: pies,
 * pastries and a cake. The tray under the pointer lifts and slides toward you;
 * its neighbours rise a little, staggered outwards. The read-out names the tray.
 * The slider is the stagger, in ms.
 *
 * The pattern: one of many (Riffle). Tweens, a stagger by distance, and a hit
 * test on the trays' resting tops, which never move.
 */
const {
  Cam, circ, facing, fit, open, poly, prism, proj, rings, ringAt, seg, unproj,
  tdone, tset, tval, tween, disposer, mk, pointer, put, register, solid,
} = HL;

const TW = 46, GAP = 8, TD = 38, X0 = 6, Y0 = 10, ZT = 34;       // trays: width, gap, depth, first x, back y, counter top
const CX1 = X0 + 3 * TW + 2 * GAP + 6;                           // the counter's far end
const NAMES = ["pies", "pastries", "cake"];
const REST = [[2, 0], [7, 4], [3, 0]];                           // rest lift and slide per tray
const UP = 16, OUT = 14, NEAR = 5;

/** Items on tray i, at offset (dx, dy, dz): each [ring, inner, z0, z1]. */
function items(i) {
  const at = (ring, x, y) => ring.map((q) => ({ ...q, u: q.u + x, v: q.v + y }));
  const cyl = (x, y, r, b, h) => [at(circ(r, 16), x, y), at(circ(r - b, 16), x, y), 0, h];
  if (i === 0) return [cyl(13, 12, 10, 1.6, 3.2), cyl(32, 25, 10, 1.6, 3.2), cyl(33, 9, 7, 1.2, 2.6)];
  if (i === 1) return [[7, 7], [24, 6], [8, 21], [25, 20], [16, 30]].map(([x, y]) => { const [o, n] = rings(x, y, x + 13, y + 8, 4, 1); return [o, n, 0, 5]; });
  return [cyl(23, 18, 13, 1.6, 17)];
}

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let stag = value;
  const C = Cam(45, 0.5, 1.62);
  fit(C, [[0, -4, 0], [CX1 + 4, Y0 + TD + OUT + 18, 0], [CX1, -4, 78], [0, Y0 + TD + 20, 0], [X0, Y0, ZT + UP + 20]], 200, 166);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);
  const face = (s, kind) => { s.g.classList.add("k-" + kind); const f = mk("path", { class: "fo face" }, s.g); s.sil.after(f); return f; };
  const block = (parent, x0, y0, x1, y1, r, b, z0, z1, kind) => { const s = solid(parent), [o, n] = rings(x0, y0, x1, y1, r, b); put(s, prism(P, front, o, n, z0, z1)); face(s, kind).setAttribute("d", poly(ringAt(P, o, z1))); return s; };

  // the case: a back panel, the counter it stands on, and the glass's top rail
  block(g, 0, -4, CX1, 4, 3, 1, ZT, 76, "panel");
  const counter = block(g, 0, -4, CX1, Y0 + TD + 20, 6, 2, 0, ZT, "counter");
  mk("path", { d: seg(P(4, Y0 + TD + 20, 12), P(CX1 - 4, Y0 + TD + 20, 12)), class: "nf lo" }, counter.g);

  const trays = [0, 1, 2].map((i) => {
    const grp = mk("g", {}, g), body = solid(grp), bodyTop = face(body, "tray"), stuff = items(i).map(() => solid(grp));
    const tops = stuff.map((s) => face(s, ["pie", "pastry", "cake"][i]));
    return { i, x: X0 + i * (TW + GAP), body, bodyTop, stuff, tops, up: tween(REST[i][0]), out: tween(REST[i][1]) };
  });
  // the glass, painted last: two rails and the slant of the front pane
  mk("path", { d: seg(P(0, 2, 76), P(CX1, 2, 76)) + seg(P(0, Y0 + TD + 16, ZT + 4), P(CX1, Y0 + TD + 16, ZT + 4)) +
    seg(P(0, 2, 76), P(0, Y0 + TD + 16, ZT + 4)) + seg(P(CX1, 2, 76), P(CX1, Y0 + TD + 16, ZT + 4)), class: "nf lo" }, g);

  function draw(t, now) {
    const up = tval(t.up, now), out = tval(t.out, now), z = ZT + up, y = Y0 + out;
    const [o, n] = rings(t.x, y, t.x + TW, y + TD, 4, 1.4);
    put(t.body, prism(P, front, o, n, z, z + 3)); t.bodyTop.setAttribute("d", poly(ringAt(P, o, z + 3)));
    items(t.i).forEach(([ring, inner, z0, z1], k) => {
      const sh = (r) => r.map((q) => ({ ...q, u: q.u + t.x, v: q.v + y }));
      put(t.stuff[k], prism(P, front, sh(ring), sh(inner), z + 3 + z0, z + 3 + z1)); t.tops[k].setAttribute("d", poly(ringAt(P, sh(ring), z + 3 + z1)));
    });
  }

  const B = register(stage, (_dt, now) => {
    let moving = false;
    trays.forEach((t) => { draw(t, now); if (!tdone(t.up, now) || !tdone(t.out, now)) moving = true; });
    return moving;
  });
  bag.add(B.unregister);

  let act = -2;
  function setActive(a) {
    if (a === act) return;
    const now = performance.now(), from = a >= 0 ? a : Math.max(act, 1);
    act = a;
    trays.forEach((t) => {
      const d = Math.abs(t.i - from) * stag;
      const [u, o] = a < 0 ? REST[t.i] : t.i === a ? [UP, OUT] : [NEAR, 0];
      tset(t.up, u, now, d); tset(t.out, o, now, d);
      const lit = a < 0 ? t.i === 1 : t.i === a;
      t.body.sil.classList.toggle("hi", lit); t.stuff.forEach((s) => s.sil.classList.toggle("hi", lit));
    });
    read.textContent = a < 0 ? "rest" : NAMES[a];
    B.wake();
  }

  /** The tray whose RESTING top holds the point; -1 off the case. */
  function hit(p) {
    const [x, y] = unproj(C, p[0], p[1], ZT + 3);
    if (y < Y0 - 6 || y > Y0 + TD + 10) return -1;
    for (const t of trays) if (x >= t.x - GAP / 2 && x < t.x + TW + GAP / 2) return t.i;
    return -1;
  }

  setActive(-1);
  bag.add(pointer(stage, { move: (p) => setActive(hit(p)), leave: () => setActive(-1) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { stag = v; }, destroy: bag.dispose };
}

hairline({
  name: "case",
  means: "A bakery display case: the tray under the pointer lifts and slides toward you.",
  rules: [1, 2, 5, 8],
  range: [0, 50, 110],
  tour: [[150, 150], [205, 170], [260, 195], null],
  mount,
});

})();

/* ---- calendar.js ---- */
(() => {
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

})();

/* ---- route.js ---- */
(() => {
/**
 * Route: one street corner. The bakery, with its striped awning, stands on the
 * left of the road; a customer's house on the right; a delivery scooter is
 * parked at the bakery with a pastry box on its rack. Point at the bakery side
 * and the box hops down to the bakery's door: pickup. Point at the house side
 * and the scooter rides the box down the road to the house: delivery. The end
 * chosen takes the bright edge; the read-out names it. The slider is the hop.
 *
 * The pattern: one of two. Tweens for the choice, a hit test on the ground.
 * Each solid carries a kind class (k-*) and a top face (fo face), so a page may
 * colour them; the figure itself sets no colour.
 */
const {
  Cam, fit, facing, hull, open, poly, prism, proj, rings, ringAt, rrect, run, seg, unproj,
  tdone, tset, tval, tween, disposer, mk, pointer, put, register, solid,
} = HL;

const GW = 210, GD = 124, RY0 = 52, RY1 = 76;                    // ground, and the road's two edges
const SHOP = [8, 8, 66, 46, 40], HOUSE = [138, 12, 190, 44, 24]; // x0, y0, x1, y1, wall height
const PARK = 76, DROP = 152, BOXZ = 13;                           // scooter x at the bakery, at the house; rack height

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let hop = value;
  const C = Cam(45, 0.5, 1.58);
  fit(C, [[0, 0, -7], [GW, GD, -7], [GW, 0, 0], [0, GD, 0], [SHOP[0], SHOP[1], SHOP[4] + 4], [164, 28, HOUSE[4] + 20]], 200, 166);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);
  const face = (s, kind) => { s.g.classList.add("k-" + kind); const f = mk("path", { class: "fo face" }, s.g); s.sil.after(f); return f; };
  const block = (parent, kind, x0, y0, x1, y1, r, b, z0, z1) => {
    const s = solid(parent), [o, n] = rings(x0, y0, x1, y1, r, b);
    put(s, prism(P, front, o, n, z0, z1)); face(s, kind).setAttribute("d", poly(ringAt(P, o, z1)));
    return s;
  };
  const onFace = (y, x0, x1, z0, z1, cls, parent) => mk("path", { class: cls, d: poly(rrect(x0, z0, x1, z1, 1.2, 3).map((q) => P(q.u, y, q.v))) }, parent);

  // Laminate & Loaf's gift box: a ribbon down the two near sides and across the lid, a lid seam, a bow on top,
  // and, on the larger boxes, a small gift tag on the lid with the L&L monogram.
  const AMP = [[3.6, 0], [1, 3.4], [1, 4.8], [1.8, 5.6], [2.6, 5], [2.4, 4], [0.6, 2.4], [0.6, 0.8], [1.6, 0], [2.8, 0.4], [3.8, 1.8]];
  function brand(x0, y0, x1, y1, z0, z1, mono) {
    const s = (x1 - x0) / 23, w = 2.8 * s, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, zl = z1 - 3 * s;
    const quad = (pts) => poly(pts.map((q) => P(q[0], q[1], q[2])));
    const ribbon = quad([[cx - w / 2, y1, z0 + 0.4], [cx + w / 2, y1, z0 + 0.4], [cx + w / 2, y1, z1], [cx - w / 2, y1, z1]]) +
      quad([[x1, cy - w / 2, z0 + 0.4], [x1, cy + w / 2, z0 + 0.4], [x1, cy + w / 2, z1], [x1, cy - w / 2, z1]]) +
      quad([[x0 + 0.6, cy - w / 2, z1], [x1, cy - w / 2, z1], [x1, cy + w / 2, z1], [x0 + 0.6, cy + w / 2, z1]]) +
      quad([[cx - w / 2, y0 + 0.6, z1], [cx + w / 2, y0 + 0.6, z1], [cx + w / 2, y1, z1], [cx - w / 2, y1, z1]]);
    const lid = open([P(x0 + 2 * s, y1, zl), P(x1, y1, zl), P(x1, y0 + 2 * s, zl)]);
    const loop = (dx) => poly(Array.from({ length: 16 }, (_, i) => { const t = i / 16 * 2 * Math.PI; return P(cx + dx + 3.6 * s * Math.cos(t), cy, z1 + 3.2 * s + 3.2 * s * Math.sin(t)); }));
    const knot = poly(Array.from({ length: 12 }, (_, i) => { const t = i / 12 * 2 * Math.PI; return P(cx + 1.8 * s * Math.cos(t), cy + 1.8 * s * Math.sin(t), z1 + 1.2 * s); }));
    const bow = loop(-3.6 * s) + loop(3.6 * s) + knot;
    let tag = "", m = "";
    if (mono) {
      const tx0 = x1 - 9.5 * s, tx1 = x1 - 2 * s, ty0 = y1 - 6.4 * s, ty1 = y1 - 1.6 * s;
      tag = quad([[tx0, ty0, z1 + 0.1], [tx1, ty0, z1 + 0.1], [tx1, ty1, z1 + 0.1], [tx0, ty1, z1 + 0.1]]);
      const k = (tx1 - tx0 - 1.6 * s) / 12.4, mx = (tx0 + tx1) / 2, my = (ty0 + ty1) / 2, at = (gx, gy) => P(mx + (gx - 6.2) * k, my - (gy - 3) * k, z1 + 0.1);
      m = open([at(0, 6), at(0, 0), at(3, 0)]) + open(AMP.map(([u, v]) => at(4.4 + u, v))) + open([at(9.4, 6), at(9.4, 0), at(12.4, 0)]);
    }
    return { ribbon, lid, tag, mono: m, bow };
  }
  const brandEls = (parent) => ({ ribbon: mk("path", { class: "fo ribbon" }, parent), lid: mk("path", { class: "nf lidline" }, parent), tag: mk("path", { class: "tag" }, parent), mono: mk("path", { class: "nf mono" }, parent), bow: mk("path", { class: "bow" }, parent) });
  const NOBRAND = { ribbon: "", lid: "", tag: "", mono: "", bow: "" };
  const setBrand = (els, b) => { for (const k in els) els[k].setAttribute("d", b[k]); };

  // ground and the two buildings behind the road, far to near
  block(g, "grass", 0, 0, GW, GD, 10, 2, -7, 0);
  const shop = block(g, "shop", SHOP[0], SHOP[1], SHOP[2], SHOP[3], 3, 1.2, 0, SHOP[4]);
  onFace(SHOP[3], 18, 32, 0, 20, "door", shop.g); onFace(SHOP[3], 40, 58, 9, 22, "win", shop.g);
  const house = block(g, "house", HOUSE[0], HOUSE[1], HOUSE[2], HOUSE[3], 2.5, 1, 0, HOUSE[4]);
  onFace(HOUSE[3], 158, 168, 0, 16, "door", house.g); onFace(HOUSE[3], 144, 152, 8, 16, "win", house.g); onFace(HOUSE[3], 174, 182, 8, 16, "win", house.g);
  // the roof: a gable, its eaves a little wider than the walls, its ridge running along x
  const roof = solid(g), foot = rrect(HOUSE[0] - 3, HOUSE[1] - 3, HOUSE[2] + 3, HOUSE[3] + 3, 2, 4), ridge = rrect(HOUSE[0], 26, HOUSE[2], 30, 1.5, 4);
  put(roof, { sil: poly(hull(ringAt(P, foot, HOUSE[4]).concat(ringAt(P, ridge, HOUSE[4] + 18)))), crease: open(ringAt(P, run(ridge, front), HOUSE[4] + 18)) });
  roof.g.classList.add("k-roof");

  // the road, its centre line, then the awning, which reaches out over the pavement
  block(g, "road", 0, RY0, GW, RY1, 2, 1, 0, 0.6);
  mk("path", { class: "nf dash", d: seg(P(4, (RY0 + RY1) / 2, 0.6), P(GW - 4, (RY0 + RY1) / 2, 0.6)) }, g);
  const awning = block(g, "awning", SHOP[0] + 2, SHOP[3] - 2, SHOP[2] - 2, SHOP[3] + 9, 1.5, 0.8, 27, 31);
  mk("path", { class: "nf stripe", d: [16, 26, 36, 46, 56].map((x) => seg(P(x, SHOP[3] - 1, 31), P(x, SHOP[3] + 8, 31))).join("") }, awning.g);

  // the scooter and the box, redrawn as they move
  const sc = { deck: solid(g), seat: solid(g), mast: solid(g) };
  const scFaces = { deck: face(sc.deck, "scooter"), seat: face(sc.seat, "seat"), mast: face(sc.mast, "scooter") };
  const wheels = [0, 1].map(() => mk("path", { class: "wheel" }, g));
  const box = solid(g), boxFace = face(box, "pbox"), boxBrand = brandEls(box.g);

  // two trees on the near verge, for the corner's composition
  [[104, 106], [186, 100]].forEach(([x, y]) => {
    block(g, "trunk", x - 2, y - 2, x + 2, y + 2, 2, 0.6, 0, 9);
    block(g, "tree", x - 10, y - 10, x + 10, y + 10, 10, 2, 9, 24);
  });

  const sx = tween(PARK), bx = tween(0);                          // scooter x; box: 0 on the rack, 1 at the bakery's door
  let choice = "rest";
  function drawScooter(x) {
    const y0 = RY0 + 8, y1 = RY1 - 8;
    const part = (s, f, a, b2, z0, z1, x0, x1) => { const [o, n] = rings(x0, a, x1, b2, 2, 0.8); put(s, prism(P, front, o, n, z0, z1)); f.setAttribute("d", poly(ringAt(P, o, z1))); };
    part(sc.deck, scFaces.deck, y0, y1, 5, 9, x, x + 26);
    part(sc.seat, scFaces.seat, y0 + 1, y1 - 1, 9, 12, x + 2, x + 12);
    part(sc.mast, scFaces.mast, y0 + 3, y1 - 3, 9, 24, x + 22, x + 25);
    [x + 5, x + 21].forEach((cx, k) => wheels[k].setAttribute("d", poly(Array.from({ length: 18 }, (_, i) => P(cx + 4.5 * Math.cos(i / 18 * 2 * Math.PI), y1 + 0.5, 4.5 + 4.5 * Math.sin(i / 18 * 2 * Math.PI))))));
  }
  function drawBox(now, x) {
    const t = tval(bx, now), rack = [x + 2, RY0 + 9, BOXZ], door = [SHOP[0] + 9, SHOP[3] + 3, 0];
    const bx0 = rack[0] + (door[0] - rack[0]) * t, by0 = rack[1] + (door[1] - rack[1]) * t;
    const lift = hop * Math.sin(Math.PI * Math.min(1, Math.max(0, t))), bz = rack[2] + (door[2] - rack[2]) * t + lift;
    const [o, n] = rings(bx0, by0, bx0 + 13, by0 + 13, 1.6, 0.8);
    put(box, prism(P, front, o, n, bz, bz + 10)); boxFace.setAttribute("d", poly(ringAt(P, o, bz + 10)));
    setBrand(boxBrand, brand(bx0, by0, bx0 + 13, by0 + 13, bz, bz + 10, false));
  }
  const B = register(stage, (_dt, now) => {
    const x = tval(sx, now);
    drawScooter(x); drawBox(now, x);
    return !tdone(sx, now) || !tdone(bx, now);
  });
  bag.add(B.unregister);

  function choose(name) {
    if (name === choice) return;
    const now = performance.now();
    choice = name;
    tset(sx, name === "delivery" ? DROP : PARK, now, name === "delivery" && tval(bx, now) > 0.05 ? 350 : 0);
    tset(bx, name === "pickup" ? 1 : 0, now, name === "pickup" && tval(sx, now) > PARK + 2 ? 600 : 0);
    [shop, awning].forEach((s) => s.sil.classList.toggle("hi", name === "pickup"));
    [house, roof].forEach((s) => s.sil.classList.toggle("hi", name === "delivery"));
    box.sil.classList.toggle("hi", name === "rest");
    read.textContent = name;
    B.wake();
  }

  choice = ""; choose("rest");
  bag.add(pointer(stage, {
    move: (p) => {
      const [x, y] = unproj(C, p[0], p[1], 0);
      choose(x < -10 || x > GW + 10 || y < -10 || y > GD + 10 ? "rest" : x < GW / 2 - 10 ? "pickup" : "delivery");
    },
    leave: () => choose("rest"),
  }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { hop = v; B.wake(); }, destroy: bag.dispose };
}

hairline({
  name: "route",
  means: "A street corner: point at the bakery and the box waits at its door, point at the house and the scooter delivers it.",
  rules: [1, 5, 8, 9],
  range: [0, 10, 20],
  tour: [[120, 150], [300, 170], null],
  mount,
});

})();
