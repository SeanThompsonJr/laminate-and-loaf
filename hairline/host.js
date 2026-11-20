/* Hosts Hairline figures on the Laminate & Loaf pages, the way the skill's bench does:
   it makes the stage and the svg, hands them to the figure, and owns the read-out.
   Load order: kernel.js, host.js, figures.js, then call LLHairline.mountAll(). */
(function () {
  var figures = {};
  window.hairline = function (figure) { figures[figure.name] = figure; };
  window.LLHairline = {
    mountAll: function () {
      if (!window.HL) return;
      HL.inject(document);
      document.querySelectorAll("[data-figure]").forEach(function (box) {
        var figure = figures[box.getAttribute("data-figure")];
        if (!figure || box.getAttribute("data-mounted")) return;
        box.setAttribute("data-mounted", "1");
        var stage = document.createElement("div");
        stage.setAttribute("data-hairline", figure.name);
        stage.setAttribute("role", "img");
        stage.setAttribute("aria-label", box.getAttribute("data-label") || figure.means);
        box.prepend(stage);
        var svg = HL.mk("svg", { viewBox: "0 0 400 320", "aria-hidden": "true" }, stage);
        var out = box.querySelector(".hl-read");
        /* "rest" is the figure's word for nobody pointing; the page shows its own hint instead */
        var hint = box.getAttribute("data-hint") || "", last = "rest";
        var read = { set textContent(v) { last = v == null ? "" : String(v); if (out) out.textContent = last === "rest" ? hint : last; }, get textContent() { return last; } };
        try { figure.mount({ stage: stage, svg: svg, read: read }, figure.range[1]); if (out && !out.textContent) out.textContent = hint; }
        catch (e) { stage.remove(); box.removeAttribute("data-mounted"); console.error(e); }
      });
    }
  };
})();
