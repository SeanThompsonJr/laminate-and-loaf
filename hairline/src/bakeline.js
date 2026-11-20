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
