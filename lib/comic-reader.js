(function () {
  "use strict";

  function escHTML(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function run() {
    var epId = document.body.getAttribute("data-episode");
    if (!epId || typeof fetch === "undefined") return;

    fetch("content/comics.json", { cache: "no-cache" })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (json) {
        var list = (json && json.comics) || [];
        var c = null;
        for (var i = 0; i < list.length; i++) {
          if (String(list[i].id) === epId) { c = list[i]; break; }
        }
        if (!c) return;

        var kicker = document.querySelector(".comic-reader-head .kicker");
        var h1 = document.querySelector(".comic-reader-head h1");
        var badge = document.querySelector(".comic-reader-head .badge");
        var msg = document.querySelector(".comic-reader-panel p");

        document.title = "Episodio " + escHTML(c.id) + " · " + escHTML(c.title) + " — The Crimson Jester";
        if (kicker) kicker.textContent = "The Crimson Jester · Episodio " + c.id;
        if (h1) h1.textContent = c.title;
        if (badge) {
          badge.textContent = c.status;
          badge.className = "badge" + (c.live ? "" : " badge-gold");
        }
        if (msg && c.message) msg.textContent = c.message;
      })
      .catch(function (e) {
        console.warn("[comic-reader] using fallback markup:", e.message);
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
