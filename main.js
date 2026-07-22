/* ============================================================
   Introdução ao Mercado Imobiliário de Luxo — LP (v3)
   ------------------------------------------------------------
   >>> PONTO ÚNICO DE CONFIGURAÇÃO <<<
   ============================================================ */
const CONFIG = {
  checkoutUrl: "https://kiwify.com.br/PLACEHOLDER", // TODO: URL real do checkout Kiwify
  price:       "R$ 87,90",
  priceAnchor: "R$ 137,90",                          // null oculta a âncora
  // Ponto de "descanso" do iPad sobre a superfície no fim do vídeo (% do stage + escala).
  // Ajuste com ?calibrar até o iPad encaixar na bancada. A escala fica FIXA
  // do descanso até o foco central — só a posição e o blur de fundo mudam.
  ipadRest: { x: 47, y: 50, scale: 1.5 },
};

(function () {
  "use strict";
  var clamp01 = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
  var smooth = function (x, a, b) { return clamp01((x - a) / (b - a)); };
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Configuração (checkout + preço) ---- */
  document.querySelectorAll("[data-checkout]").forEach(function (el) { el.setAttribute("href", CONFIG.checkoutUrl); });
  document.querySelectorAll("[data-price]").forEach(function (el) { el.textContent = CONFIG.price; });
  var anchorEl = document.querySelector("[data-anchor]");
  if (anchorEl) {
    if (CONFIG.priceAnchor) { anchorEl.textContent = "de " + CONFIG.priceAnchor + " por"; anchorEl.hidden = false; }
    else { anchorEl.hidden = true; }
  }

  /* ---- Header: overlay transparente sobre o hero + menu mobile ---- */
  var header = document.querySelector(".site-header");
  var heroEl = document.getElementById("hero");
  if (header) {
    var toggle = header.querySelector(".nav__toggle");
    if (toggle) {
      toggle.addEventListener("click", function () {
        var open = header.getAttribute("data-nav") === "open";
        header.setAttribute("data-nav", open ? "closed" : "open");
        toggle.setAttribute("aria-expanded", String(!open));
      });
      header.querySelectorAll(".nav__links a").forEach(function (a) {
        a.addEventListener("click", function () { header.setAttribute("data-nav", "closed"); toggle.setAttribute("aria-expanded", "false"); });
      });
    }
    if (heroEl) {
      var updateHeaderTheme = function () {
        var rect = heroEl.getBoundingClientRect();
        var overHero = rect.bottom > header.offsetHeight * 0.6;
        header.classList.toggle("on-hero", overHero);
      };
      updateHeaderTheme();
      window.addEventListener("scroll", updateHeaderTheme, { passive: true });
      window.addEventListener("resize", updateHeaderTheme);
    }
  }

  /* ---- iPad: espiar sumário (toque/teclado; hover é CSS) ---- */
  var device = document.getElementById("device");
  if (device) {
    var flipDevice = function () { device.classList.toggle("is-flipped"); };
    device.addEventListener("click", flipDevice);
    device.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); flipDevice(); } });
  }

  /* ---- Flip cards (toque/teclado; hover é CSS) ---- */
  document.querySelectorAll(".flip").forEach(function (card) {
    card.addEventListener("click", function () { card.classList.toggle("is-flipped"); });
  });

  /* ---- Hero cinematográfico (scroll-scrub) ---- */
  var hero = heroEl;
  var stage = hero && hero.querySelector(".hero__stage");
  var video = hero && hero.querySelector(".hero__video");
  var hint = document.getElementById("device-hint");

  if (hero && stage && !reduced && "IntersectionObserver" in window) {
    hero.classList.add("is-cine");
    var pm = location.search.match(/[?&]preview=([0-9.]+|end)/);
    var previewP = pm ? (pm[1] === "end" ? 1 : parseFloat(pm[1])) : null;
    var calibrar = /[?&]calibrar\b/.test(location.search);
    var R = CONFIG.ipadRest;
    var dev = device ? device.parentNode : null; // wrapper .hero__device

    /* Tenta carregar o vídeo; sem ele, usa o fallback (imagem borrada + iPad CSS). */
    var videoReady = false, videoDur = 0;
    if (video && video.dataset.src) {
      video.addEventListener("loadeddata", function () {
        videoReady = true; videoDur = video.duration || 0;
        hero.classList.add("has-video");
        var pr = video.play(); // "escorva" a decodificação; depois pausa (scrub manual)
        if (pr && pr.then) pr.then(function () { video.pause(); }).catch(function () {});
        else { try { video.pause(); } catch (e) {} }
        if (calibrar) calibrateRender();
        else if (previewP != null) apply(previewP);
        else if (typeof onCine === "function") onCine();
      });
      video.addEventListener("error", function () { /* mantém fallback */ });
      try { video.src = video.dataset.src; video.load(); } catch (e) {}
    }

    var targetTime = 0, seeking = false;

    /* Scrub robusto: só busca o próximo frame quando a busca anterior termina
       (evita a pilha de seeks que faz o Chrome "travar" no primeiro frame). */
    function updateVideo() {
      if (!videoReady || videoDur <= 0 || seeking) return;
      if (Math.abs(video.currentTime - targetTime) < 0.02) return;
      seeking = true;
      try { video.currentTime = targetTime; } catch (e) { seeking = false; }
    }
    if (video) video.addEventListener("seeked", function () { seeking = false; updateVideo(); });

    /* p: 0→1 no scroll do hero.
       1) dolly (vídeo) até dollyEnd;
       2) iPad "pousa" na superfície (posição de descanso R, escala fixa) — place;
       3) foco: iPad viaja de R até o centro (MESMA escala) enquanto o fundo borra/escurece. */
    var apply = function (p) {
      var hasVid = hero.classList.contains("has-video");
      var dollyEnd   = 0.55;
      var placeStart = hasVid ? 0.46 : 0.24;
      var placeMid   = hasVid ? 0.60 : 0.42;
      var focusStart = hasVid ? 0.62 : 0.46;
      var focusEnd   = hasVid ? 0.90 : 0.72;
      var deviceO = smooth(p, placeStart, placeMid);
      var focusP  = smooth(p, focusStart, focusEnd);
      var curX = R.x + (50 - R.x) * focusP;
      var curY = R.y + (50 - R.y) * focusP;
      stage.style.setProperty("--end", focusP.toFixed(3));
      stage.style.setProperty("--intro-o", (1 - smooth(p, 0.04, 0.20)).toFixed(3));
      stage.style.setProperty("--cue-o", (1 - smooth(p, 0.02, 0.12)).toFixed(3));
      if (dev) {
        dev.style.opacity = deviceO.toFixed(3);
        dev.style.left = curX.toFixed(2) + "%";
        dev.style.top = curY.toFixed(2) + "%";
        dev.style.transform = "translate(-50%,-50%) scale(" + R.scale + ")";
        dev.classList.toggle("is-active", focusP > 0.55);
      }
      if (hint) hint.classList.toggle("is-on", focusP > 0.55);
      if (videoReady && videoDur) { targetTime = clamp01(p / dollyEnd) * (videoDur - 0.05); updateVideo(); }
    };

    /* Calibração: mostra o iPad parado na superfície (último frame do vídeo). */
    var calibrateRender = function () {
      if (dev) {
        dev.style.opacity = 1;
        dev.style.left = R.x + "%";
        dev.style.top = R.y + "%";
        dev.style.transform = "translate(-50%,-50%) scale(" + R.scale + ")";
        dev.classList.add("is-active");
      }
      stage.style.setProperty("--end", "0");
      stage.style.setProperty("--intro-o", "0");
      stage.style.setProperty("--cue-o", "0");
      if (videoReady && videoDur) { targetTime = videoDur - 0.05; updateVideo(); }
    };

    var ticking = false;
    var onCine = function () {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        var rect = hero.getBoundingClientRect();
        var total = hero.offsetHeight - window.innerHeight;
        var p = total > 0 ? clamp01(-rect.top / total) : 0;
        apply(p);
      });
    };
    if (calibrar) {
      /* QA: posicionar o iPad na superfície (?calibrar) — ajuste CONFIG.ipadRest */
      hero.classList.add("has-video", "calibrate");
      calibrateRender();
    } else if (previewP != null) {
      /* QA: força um ponto do scroll (?preview=0.45 dolly, ?preview=end estado final) */
      hero.classList.add("has-video");
      apply(previewP);
    } else {
      window.addEventListener("scroll", onCine, { passive: true });
      window.addEventListener("resize", onCine);
      onCine();
    }
  }

  /* ---- Navegação lateral de progresso (scrolldots) ---- */
  var dots = Array.prototype.slice.call(document.querySelectorAll(".scrolldots__item"));
  if (dots.length) {
    var dotTargets = dots.map(function (btn) {
      return { btn: btn, el: document.querySelector(btn.getAttribute("data-target")) };
    }).filter(function (d) { return d.el; });

    dotTargets.forEach(function (d) {
      d.btn.addEventListener("click", function () {
        d.el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
      });
    });

    var updateDots = function () {
      var line = window.scrollY + window.innerHeight * 0.4;
      var current = dotTargets[0];
      dotTargets.forEach(function (d) {
        if (d.el.offsetTop <= line) current = d;
      });
      dotTargets.forEach(function (d) { d.btn.classList.toggle("is-active", d === current); });
    };
    updateDots();
    window.addEventListener("scroll", updateDots, { passive: true });
    window.addEventListener("resize", updateDots);
  }

  /* ---- Voltar ao topo ---- */
  var backtotop = document.getElementById("backtotop");
  if (backtotop) {
    var updateBackToTop = function () { backtotop.classList.toggle("is-visible", window.scrollY > window.innerHeight * 0.8); };
    updateBackToTop();
    window.addEventListener("scroll", updateBackToTop, { passive: true });
    backtotop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
    });
  }

  /* ---- Reveal on scroll ---- */
  var reveals = document.querySelectorAll(".reveal");
  if (!reduced && "IntersectionObserver" in window && reveals.length) {
    document.documentElement.setAttribute("data-anim", "on");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add("is-visible"); io.unobserve(entry.target); }
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
    window.setTimeout(function () { reveals.forEach(function (el) { el.classList.add("is-visible"); }); }, 1400);
  }
})();
