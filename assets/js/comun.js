/* =========================================================
   Comportamiento común a todas las prácticas:
   scroll suave (Lenis), barra de progreso, cursor de medición,
   pantalla de carga y telón de transición entre páginas.
   Expone window.Comun para que cada práctica lo use.
   ========================================================= */
(() => {
  const html = document.documentElement;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fino = window.matchMedia("(pointer: fine)").matches;
  const hasGsap = !!(window.gsap && window.ScrollTrigger);

  const guardar = {
    leer(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    escribir(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* sin almacenamiento */ } },
    borrar(k) { try { sessionStorage.removeItem(k); } catch (e) { /* sin almacenamiento */ } },
  };

  // Sin GSAP o con movimiento reducido: se muestra todo sin animaciones.
  if (!hasGsap || reduce) html.classList.remove("js");
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  /* ---------- Listo (cola de funciones) ---------- */
  let listo = false;
  const cola = [];
  const alListo = (fn) => (listo ? fn() : cola.push(fn));
  const marcarListo = () => {
    if (listo) return;
    listo = true;
    html.classList.add("listo");
    cola.splice(0).forEach((fn) => fn());
  };

  /* ---------- Scroll suave ---------- */
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    if (hasGsap) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }

  const irA = (destino, opciones = {}) => {
    if (lenis) lenis.scrollTo(destino, { duration: 1.6, ...opciones });
    else {
      const el = typeof destino === "string" ? document.querySelector(destino) : destino;
      if (el && el.scrollIntoView) el.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
    }
  };

  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id.length < 2) return;
      const el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      irA(el);
    });
  });

  /* ---------- Barra de progreso ---------- */
  const progreso = document.querySelector(".progreso span");
  const actualizarProgreso = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
    if (progreso) progreso.style.transform = `scaleX(${p})`;
  };
  window.addEventListener("scroll", actualizarProgreso, { passive: true });
  window.addEventListener("resize", actualizarProgreso);
  actualizarProgreso();

  /* ---------- Cursor de medición (sólo con ratón) ---------- */
  const cursor = document.querySelector(".cursor");
  if (cursor && fino && !reduce) {
    const coord = cursor.querySelector(".cursor__coord");
    let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
    window.addEventListener("pointermove", (e) => {
      x = e.clientX; y = e.clientY;
      cursor.classList.add("visible");
    }, { passive: true });
    document.addEventListener("pointerleave", () => cursor.classList.remove("visible"));
    document.addEventListener("pointerover", (e) => {
      const sobre = e.target.closest("a, button, [data-cursor]");
      cursor.classList.toggle("sobre", !!sobre);
    });
    const mover = () => {
      cx += (x - cx) * 0.35;
      cy += (y - cy) * 0.35;
      cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      if (coord) coord.textContent = `x ${Math.round(x)} ± 1   y ${Math.round(y + window.scrollY)} ± 1`;
      requestAnimationFrame(mover);
    };
    mover();
  } else if (cursor) {
    cursor.remove();
  }

  /* ---------- Telón de transición entre páginas ---------- */
  const telon = document.querySelector(".telon");
  const vieneDeTransicion = guardar.leer("telon") === "1";
  guardar.borrar("telon");

  const esEnlaceInterno = (a) => {
    if (!a || a.target === "_blank" || a.hasAttribute("download")) return false;
    const href = a.getAttribute("href");
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return false;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return false;
    return !(url.pathname === location.pathname && url.hash);
  };

  if (telon && hasGsap && !reduce) {
    document.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (!esEnlaceInterno(a) || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      guardar.escribir("telon", "1");
      gsap.fromTo(telon, { yPercent: 100 }, {
        yPercent: 0, duration: 0.7, ease: "power4.inOut",
        onComplete: () => { location.href = a.href; },
      });
    });
    // Al volver con el botón "atrás" (bfcache) el telón debe quedar fuera.
    window.addEventListener("pageshow", (e) => {
      if (e.persisted) gsap.set(telon, { yPercent: 100 });
    });
  }

  /* ---------- Pantalla de carga ---------- */
  const carga = document.querySelector(".carga");
  const animar = hasGsap && !reduce;

  if (animar && vieneDeTransicion && telon) {
    // Llegamos desde otra página: se recoge el telón en lugar de la carga.
    if (carga) carga.remove();
    html.classList.remove("telon-entrada");
    gsap.fromTo(telon, { yPercent: 0 }, {
      yPercent: -100, duration: 0.8, ease: "power4.inOut", delay: 0.1,
      onStart: () => setTimeout(marcarListo, 250),
    });
  } else if (animar && carga && guardar.leer("visto") !== "1") {
    guardar.escribir("visto", "1");
    const num = carga.querySelector(".carga__num b");
    const barra = carga.querySelector(".carga__barra span");
    const estado = { v: 0 };
    gsap.timeline()
      .to(estado, {
        v: 100, duration: 1.5, ease: "power2.inOut",
        onUpdate: () => {
          if (num) num.textContent = String(Math.round(estado.v)).padStart(3, "0");
          if (barra) barra.style.transform = `scaleX(${estado.v / 100})`;
        },
      })
      .to(carga, {
        yPercent: -100, duration: 0.9, ease: "power4.inOut",
        onStart: () => setTimeout(marcarListo, 300),
        onComplete: () => carga.remove(),
      }, "+=0.15");
  } else {
    if (carga) carga.remove();
    marcarListo();
  }

  window.Comun = { reduce, fino, hasGsap, animar, lenis, irA, alListo };
})();
