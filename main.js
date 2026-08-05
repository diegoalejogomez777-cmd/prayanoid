(function () {
  "use strict";

  var data = window.__BRAND__ || {};
  var $ = function (sel, scope) { return (scope || document).querySelector(sel); };
  var $$ = function (sel, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(sel)); };
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  function safe(fn, name) {
    try { fn(); } catch (e) { console.warn("[" + name + "]", e); }
  }

  function money(n) {
    return "$" + Math.round(n).toLocaleString("es-CO");
  }

  function escHTML(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ---------------------------------------------------------
     Curtain intro
  --------------------------------------------------------- */
  function initCurtain() {
    var curtain = $("[data-curtain]");
    if (!curtain) return;

    var seen = false;
    try { seen = sessionStorage.getItem("prayanoid-curtain-seen") === "1"; } catch (e) {}

    if (seen) {
      curtain.classList.add("is-skipping");
    } else {
      try { sessionStorage.setItem("prayanoid-curtain-seen", "1"); } catch (e) {}
    }

    function skip() { curtain.classList.add("is-skipping"); }
    curtain.addEventListener("click", skip);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" || e.key === "Enter") skip();
    });

    var removed = false;
    function remove() {
      if (removed || !curtain.isConnected) return;
      removed = true;
      curtain.remove();
    }
    curtain.addEventListener("animationend", function (e) {
      if (e.target === curtain) remove();
    });
    setTimeout(remove, seen ? 900 : 4200);
  }

  /* ---------------------------------------------------------
     Nav
  --------------------------------------------------------- */
  function initNav() {
    var header = $("[data-header]");
    var burger = $("[data-hamburger]");
    var mobileNav = $("[data-mobile-nav]");
    if (!burger || !mobileNav) return;

    burger.addEventListener("click", function () {
      var open = mobileNav.classList.toggle("is-open");
      burger.classList.toggle("is-open", open);
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });

    $$("a[href^='#']", mobileNav).forEach(function (a) {
      a.addEventListener("click", function () {
        mobileNav.classList.remove("is-open");
        burger.classList.remove("is-open");
      });
    });

    if (header) {
      var lastY = 0;
      window.addEventListener("scroll", function () {
        header.style.boxShadow = window.scrollY > 12 ? "0 12px 30px -18px rgba(0,0,0,.7)" : "none";
        lastY = window.scrollY;
      }, { passive: true });
    }
  }

  /* ---------------------------------------------------------
     Smooth anchor scroll (native)
  --------------------------------------------------------- */
  function setupSmoothScroll() {
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute("href");
      if (!id || id === "#") return;
      var el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      var navOffset = 76;
      window.scrollTo({
        top: el.getBoundingClientRect().top + window.scrollY - navOffset,
        behavior: reduced ? "auto" : "smooth"
      });
    });
  }

  /* ---------------------------------------------------------
     Scroll reveals
  --------------------------------------------------------- */
  function initReveals() {
    var targets = $$(".reveal");
    if (!targets.length) return;
    if (typeof IntersectionObserver === "undefined") {
      targets.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.01, rootMargin: "0px 0px -2% 0px" });
    targets.forEach(function (el) { io.observe(el); });

    setTimeout(function () {
      targets.forEach(function (el) {
        if (!el.classList.contains("is-visible") && el.getBoundingClientRect().top < window.innerHeight) {
          el.classList.add("is-visible");
        }
      });
    }, 6000);
  }

  /* ---------------------------------------------------------
     Qty steppers
  --------------------------------------------------------- */
  function initQtySteppers() {
    var min = 1, max = 10;
    document.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-qty] button");
      if (!btn) return;
      var stepper = btn.closest("[data-qty]");
      var value = stepper && $(".qty-value", stepper);
      if (!value) return;
      var current = parseInt(value.textContent, 10) || 1;
      if (btn.dataset.action === "inc" && current < max) current++;
      if (btn.dataset.action === "dec" && current > min) current--;
      value.textContent = current;
    });
  }

  function initProductFlip() {
    document.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-flip-btn]");
      if (!btn) return;
      var visual = btn.closest(".product-visual");
      if (visual) visual.classList.toggle("is-flipped");
    });
  }

  /* ---------------------------------------------------------
     Shop products (rendered from content/products.json so the
     Decap CMS panel can edit them; falls back to the markup
     already hardcoded in index.html if the fetch fails).
  --------------------------------------------------------- */
  function renderProductVisual(p) {
    if (!p.imageBack) {
      return (
        '<div class="product-visual photo">' +
          '<img class="mockup" src="' + escHTML(p.image) + '" alt="Camiseta negra Prayanoid — ' + escHTML(p.name) + '">' +
        "</div>"
      );
    }
    return (
      '<div class="product-visual photo has-back">' +
        '<span class="side-badge front-label">Adelante</span>' +
        '<span class="side-badge back-label">Atrás</span>' +
        '<img class="mockup front" src="' + escHTML(p.image) + '" alt="Camiseta negra Prayanoid — ' + escHTML(p.name) + ' (frente)">' +
        '<img class="mockup back" src="' + escHTML(p.imageBack) + '" alt="Camiseta negra Prayanoid — ' + escHTML(p.name) + ' (espalda)">' +
        '<button type="button" class="flip-btn" data-flip-btn aria-label="Ver la otra cara de la camiseta">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17 2l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>' +
        "</button>" +
      "</div>"
    );
  }

  function renderProductCard(p) {
    var customize = p.customizable === false ? "" : (
      '<div class="customize-row">' +
        "<label>Tu diseño, nombre o frase</label>" +
        '<input type="text" class="customize-input" data-custom-input maxlength="60" placeholder="Ej: escribe aquí lo que quieres en tu camiseta">' +
      "</div>"
    );
    return (
      '<article class="product-card reveal is-visible">' +
        renderProductVisual(p) +
        '<div class="product-info">' +
          "<h3>" + escHTML(p.name) + "</h3>" +
          '<p class="desc">' + escHTML(p.desc) + "</p>" +
          '<div class="product-meta">' +
            '<div class="product-price"><small>Precio</small>' + money(p.price) + "</div>" +
            '<span class="size-pill">Talla ' + escHTML(p.size || "S") + "</span>" +
          "</div>" +
          customize +
          '<div class="qty-row">' +
            '<div class="qty-stepper" data-qty>' +
              '<button type="button" data-action="dec" aria-label="Restar">−</button>' +
              '<span class="qty-value">1</span>' +
              '<button type="button" data-action="inc" aria-label="Sumar">+</button>' +
            "</div>" +
            '<button type="button" class="btn btn-primary add-to-cart" data-add-to-cart data-id="' + escHTML(p.id) +
              '" data-name="' + escHTML(p.name) + '" data-price="' + (parseInt(p.price, 10) || 0) + '">Agregar</button>' +
          "</div>" +
        "</div>" +
      "</article>"
    );
  }

  function mountProducts() {
    var target = $("[data-products]");
    if (!target || typeof fetch === "undefined") return Promise.resolve();
    return fetch("content/products.json", { cache: "no-cache" })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (json) {
        var products = (json && json.products) || [];
        if (!products.length) return;
        target.innerHTML = products.map(renderProductCard).join("");
      })
      .catch(function (e) {
        console.warn("[mountProducts] using fallback markup:", e.message);
      });
  }

  /* ---------------------------------------------------------
     Comic grid (rendered from content/comics.json; same
     fallback-on-failure pattern as mountProducts)
  --------------------------------------------------------- */
  function renderComicCard(c) {
    var stamp = c.live ? '<span class="stamp">Nuevo</span>' : "";
    var coverStyle = c.cover ? (
      ' style="background-image: linear-gradient(180deg, rgba(11,6,5,.35), rgba(11,6,5,.92)), url(\'' + escHTML(c.cover) + '\'); background-size: cover; background-position: center;"'
    ) : "";
    return (
      '<a class="comic-card' + (c.live ? " is-live" : "") + ' reveal is-visible" href="comic-' + escHTML(c.id) + '.html" target="_blank" rel="noopener"' + coverStyle + '>' +
        '<span class="episode-num" aria-hidden="true">' + escHTML(c.id) + "</span>" +
        stamp +
        "<h3>" + escHTML(c.title) + "</h3>" +
        '<span class="status">' + escHTML(c.status) + "</span>" +
      "</a>"
    );
  }

  function mountComics() {
    var target = $("[data-comics]");
    if (!target || typeof fetch === "undefined") return Promise.resolve();
    return fetch("content/comics.json", { cache: "no-cache" })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (json) {
        var comics = (json && json.comics) || [];
        if (!comics.length) return;
        target.innerHTML = comics.map(renderComicCard).join("");
      })
      .catch(function (e) {
        console.warn("[mountComics] using fallback markup:", e.message);
      });
  }

  /* ---------------------------------------------------------
     Collections gallery (content/collections.json)
  --------------------------------------------------------- */
  function renderCollectionCard(c) {
    var images = (c.images || []).map(function (src, i) {
      return '<img src="' + escHTML(src) + '" alt="' + escHTML(c.title) + " — foto " + (i + 1) + '" loading="lazy" decoding="async">';
    }).join("");
    return (
      '<article class="collection-card reveal is-visible">' +
        '<div class="collection-media">' + images + "</div>" +
        '<div class="collection-info">' +
          "<h3>" + escHTML(c.title) + "</h3>" +
          (c.description ? "<p>" + escHTML(c.description) + "</p>" : "") +
        "</div>" +
      "</article>"
    );
  }

  function mountCollections() {
    var target = $("[data-collections]");
    if (!target || typeof fetch === "undefined") return Promise.resolve();
    return fetch("content/collections.json", { cache: "no-cache" })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (json) {
        var items = (json && json.collections) || [];
        if (!items.length) return;
        target.innerHTML = items.map(renderCollectionCard).join("");
      })
      .catch(function (e) {
        console.warn("[mountCollections] using fallback markup:", e.message);
      });
  }

  /* ---------------------------------------------------------
     Comic comment form (mailto)
  --------------------------------------------------------- */
  function initCommentForm() {
    var form = $("[data-comment-form]");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = ($("#comment-name", form) || {}).value || "";
      var text = ($("#comment-text", form) || {}).value || "";
      name = name.trim();
      text = text.trim();
      if (!text) return;
      var subject = "Comentario en The Crimson Jester";
      var body = "Nombre: " + (name || "Anónimo") + "\n\nComentario:\n" + text;
      var url = "mailto:prayanoid@gmail.com?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
      window.location.href = url;
      form.reset();
    });
  }

  /* ---------------------------------------------------------
     Cart
  --------------------------------------------------------- */
  var cart = [];

  function renderCart() {
    var itemsEl = $("[data-cart-items]");
    var totalEl = $("[data-cart-total]");
    var countEl = $("[data-cart-count]");
    var checkoutBtn = $("[data-cart-checkout]");
    if (!itemsEl) return;

    var count = cart.reduce(function (n, it) { return n + it.qty; }, 0);
    if (countEl) {
      countEl.textContent = count;
      countEl.classList.toggle("is-active", count > 0);
    }
    if (checkoutBtn) checkoutBtn.disabled = cart.length === 0;

    if (!cart.length) {
      itemsEl.innerHTML =
        '<div class="cart-empty">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.5 3h2l2.7 12.4a2 2 0 0 0 2 1.6h8.6a2 2 0 0 0 2-1.6L21.5 8H6"/></svg>' +
        '<p>Tu carrito está vacío. El circo espera.</p>' +
        "</div>";
      if (totalEl) totalEl.textContent = money(0);
      return;
    }

    itemsEl.innerHTML = cart.map(function (it, i) {
      var lineTotal = it.price * it.qty;
      return (
        '<div class="cart-item" data-index="' + i + '">' +
          '<div class="tee-thumb"><img src="assets/img/tshirt-icon.svg" alt="" aria-hidden="true"></div>' +
          '<div class="cart-item-body">' +
            "<h4>" + it.name + "</h4>" +
            '<div class="meta">Talla S' + (it.custom ? " · “" + it.custom + "”" : "") + "</div>" +
            '<div class="cart-item-row">' +
              "<span>" + it.qty + " × " + money(it.price) + "</span>" +
              '<button type="button" class="cart-item-remove" data-remove="' + i + '">Quitar</button>' +
            "</div>" +
          "</div>" +
        "</div>"
      );
    }).join("");

    var total = cart.reduce(function (sum, it) { return sum + it.price * it.qty; }, 0);
    if (totalEl) totalEl.textContent = money(total);
  }

  function openCart() {
    var overlay = $("[data-cart-overlay]");
    var drawer = $("[data-cart-drawer]");
    if (overlay) overlay.classList.add("is-open");
    if (drawer) drawer.classList.add("is-open");
    document.documentElement.style.overflow = "hidden";
  }
  function closeCart() {
    var overlay = $("[data-cart-overlay]");
    var drawer = $("[data-cart-drawer]");
    if (overlay) overlay.classList.remove("is-open");
    if (drawer) drawer.classList.remove("is-open");
    document.documentElement.style.overflow = "";
  }

  function buildWhatsAppMessage() {
    var lines = ["Hola " + (data.name || "Prayanoid") + "! Quiero hacer este pedido:", ""];
    var total = 0;
    cart.forEach(function (it) {
      var lineTotal = it.price * it.qty;
      total += lineTotal;
      lines.push(
        "• " + it.name + " (Talla S) x" + it.qty +
        (it.custom ? " — \"" + it.custom + "\"" : "") +
        " — " + money(lineTotal)
      );
    });
    lines.push("", "Total: " + money(total), "", "Quedo atento/a para coordinar pago y envío. ¡Gracias!");
    return lines.join("\n");
  }

  function initCart() {
    var overlay = $("[data-cart-overlay]");
    var openBtns = $$("[data-cart-open]");
    var closeBtns = $$("[data-cart-close]");
    var checkoutBtn = $("[data-cart-checkout]");

    openBtns.forEach(function (b) { b.addEventListener("click", openCart); });
    closeBtns.forEach(function (b) { b.addEventListener("click", closeCart); });
    if (overlay) overlay.addEventListener("click", closeCart);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeCart(); });

    document.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-add-to-cart]");
      if (!btn) return;
      var card = btn.closest(".product-card");
      var qtyEl = card && $(".qty-value", card);
      var inputEl = card && $("[data-custom-input]", card);

      var item = {
        id: btn.dataset.id,
        name: btn.dataset.name,
        price: parseInt(btn.dataset.price, 10) || 0,
        qty: qtyEl ? parseInt(qtyEl.textContent, 10) || 1 : 1,
        custom: (inputEl && inputEl.value.trim()) ? inputEl.value.trim().slice(0, 60) : ""
      };

      var existing = cart.find(function (it) {
        return it.id === item.id && it.custom === item.custom;
      });
      if (existing) { existing.qty += item.qty; }
      else { cart.push(item); }

      renderCart();
      openCart();

      if (qtyEl) qtyEl.textContent = "1";
      if (inputEl) { inputEl.value = ""; }
    });

    var itemsEl = $("[data-cart-items]");
    if (itemsEl) {
      itemsEl.addEventListener("click", function (e) {
        var rm = e.target.closest("[data-remove]");
        if (!rm) return;
        var idx = parseInt(rm.dataset.remove, 10);
        cart.splice(idx, 1);
        renderCart();
      });
    }

    if (checkoutBtn) {
      checkoutBtn.addEventListener("click", function () {
        if (!cart.length) return;
        var phone = (data.whatsapp || "573204738410").replace(/\D/g, "");
        var url = "https://wa.me/" + phone + "?text=" + encodeURIComponent(buildWhatsAppMessage());
        window.open(url, "_blank", "noopener");
      });
    }

    renderCart();
  }

  /* ---------------------------------------------------------
     GSAP enrichment (optional, feature-detected)
  --------------------------------------------------------- */
  function initGsapPolish() {
    if (!window.gsap) return;
    var fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!fine) return;

    $$(".product-card").forEach(function (card) {
      gsap.set(card, { transformPerspective: 900 });
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        gsap.to(card, { rotateY: px * 6, rotateX: -py * 6, duration: 0.5, ease: "power3.out" });
      });
      card.addEventListener("mouseout", function (e) {
        if (card.contains(e.relatedTarget)) return;
        gsap.to(card, { rotateY: 0, rotateX: 0, duration: 0.6, ease: "power3.out" });
      });
    });
  }

  /* ---------------------------------------------------------
     Boot
  --------------------------------------------------------- */
  function boot() {
    safe(initCurtain, "initCurtain");
    safe(initNav, "initNav");
    safe(setupSmoothScroll, "setupSmoothScroll");
    safe(initReveals, "initReveals");
    safe(initQtySteppers, "initQtySteppers");
    safe(initProductFlip, "initProductFlip");
    safe(initCommentForm, "initCommentForm");
    safe(initCart, "initCart");

    mountProducts().then(function () {
      safe(initGsapPolish, "initGsapPolish");
    });
    safe(mountComics, "mountComics");
    safe(mountCollections, "mountCollections");

    document.documentElement.classList.add("is-ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
