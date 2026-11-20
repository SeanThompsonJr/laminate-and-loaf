/**
 * Hatch: a pastry box on a long counter. At one end, the pickup hatch, a
 * window frame; past the other, a delivery cart on two wheels. The side of
 * the counter the pointer is on decides where the box goes, and it slides there
 * on a 700ms ease with a small hop; the end it goes to takes the bright edge.
 * The read-out says pickup or delivery. The slider is the hop's height.
 *
 * The pattern: one of two. A tween for the choice, a hit test on the ground.
 */
const {
  Cam, facing, fit, lerp, open, prism, proj, rings, seg, unproj,
  tdone, tset, tval, tween, disposer, mk, pointer, put, register, solid,
} = HL;

const L = 150, D = 40, ZC = 22, BW = 22, K0 = L + 8, K1 = L + 58; // counter length, depth, height; box size; the cart
const SPOT = { pickup: 22, delivery: K0 + 12, rest: L / 2 - BW / 2 + 8 };

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let hop = value;
  const C = Cam(45, 0.5, 1.5);
  fit(C, [[-4, -4, 0], [K1 + 2, D + 4, 0], [K1, -4, ZC + 34], [0, D, ZC + 56], [-4, D + 4, 0], [K0, D + 2, 0]], 200, 166);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);
  const block = (parent, x0, y0, x1, y1, r, b, z0, z1) => { const s = solid(parent), [o, n] = rings(x0, y0, x1, y1, r, b); put(s, prism(P, front, o, n, z0, z1)); return s; };

  // far parts first: the hatch's back post, then the counter
  const postB = block(g, 4, -2, 12, 6, 2.5, 1, ZC, ZC + 52);
  const counter = block(g, -4, -4, L + 4, D + 4, 5, 1.8, 0, ZC);
  mk("path", { d: seg(P(2, D + 4, 8), P(L - 2, D + 4, 8)), class: "nf lo" }, counter.g);
  // the delivery cart, standing past the counter's end: a push bar at its far end, a deck level with the counter, two wheels
  const deck = block(g, K0, 2, K1, D - 2, 4, 1.4, ZC - 7, ZC);
  const wheel = (cx) => mk("path", { class: "sil", d: "M" + Array.from({ length: 20 }, (_, k) => P(cx + 7 * Math.cos(k / 20 * 2 * Math.PI), D - 1, 8 + 7 * Math.sin(k / 20 * 2 * Math.PI)).join(",")).join("L") + "Z" }, deck.g);
  const wheels = [wheel(K0 + 10), wheel(K1 - 10)];

  const box = solid(g), tie = mk("path", { class: "nf" }, box.g);
  const bar = block(g, K1 - 6, 4, K1, D - 4, 2.5, 1, ZC - 4, ZC + 30);   // nearer than the box on the deck, so painted after it
  const postF = block(g, 4, D - 6, 12, D + 2, 2.5, 1, ZC, ZC + 52);
  const lintel = block(g, 2, -4, 14, D + 4, 3, 1.2, ZC + 46, ZC + 54);
  const ends = { pickup: [postB, postF, lintel], delivery: [bar, deck, ...wheels.map((sil) => ({ sil }))] };

  const tx = tween(SPOT.rest);
  let target = "rest", from = SPOT.rest;
  function draw(now) {
    const x = tval(tx, now), to = SPOT[target], span = Math.abs(to - from) || 1;
    const t = Math.min(1, Math.abs(x - from) / span), z = ZC + hop * Math.sin(Math.PI * t) * (target === "rest" ? 0.4 : 1);
    const inCrate = 0;
    const [o, n] = rings(x, D / 2 - BW / 2, x + BW, D / 2 + BW / 2, 2.4, 1.2);
    put(box, prism(P, front, o, n, z + inCrate, z + inCrate + 15));
    const cx = x + BW / 2, cy = D / 2, top = z + inCrate + 15;
    tie.setAttribute("d", seg(P(cx, cy - BW / 2 + 1, top), P(cx, cy + BW / 2 - 1, top)) + seg(P(x + 1, cy, top), P(x + BW - 1, cy, top)));
  }

  const B = register(stage, (_dt, now) => { draw(now); return !tdone(tx, now); });
  bag.add(B.unregister);

  function choose(name) {
    if (name === target) return;
    const now = performance.now();
    from = tval(tx, now); target = name;
    tset(tx, SPOT[name], now, 0);
    for (const [k, list] of Object.entries(ends)) list.forEach((s) => s.sil.classList.toggle("hi", k === name));
    box.sil.classList.toggle("hi", name === "rest");
    read.textContent = name;
    B.wake();
  }

  target = "x"; choose("rest");
  bag.add(pointer(stage, {
    move: (p) => {
      const [x, y] = unproj(C, p[0], p[1], ZC);
      choose(y < -30 || y > D + 30 || x < -20 || x > L + 20 ? "rest" : x < L / 2 ? "pickup" : "delivery");
    },
    leave: () => choose("rest"),
  }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { hop = v; B.wake(); }, destroy: bag.dispose };
}

hairline({
  name: "hatch",
  means: "A pastry box on a counter slides to the pickup hatch or into the delivery crate, whichever side you point to.",
  rules: [1, 4, 5, 8],
  range: [0, 12, 26],
  tour: [[140, 150], [270, 200], null],
  mount,
});
