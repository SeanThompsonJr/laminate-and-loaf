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
