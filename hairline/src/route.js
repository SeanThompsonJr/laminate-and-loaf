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
