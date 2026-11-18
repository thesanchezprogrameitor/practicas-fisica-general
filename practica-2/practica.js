/* =========================================================
   Práctica 2 · Densidad y proporcionalidad
   Animaciones propias: olas entre capas, burbujas, letras que
   flotan, columna de densidad, carril horizontal y escenas que
   se mueven sin parar mientras están en pantalla.
   ========================================================= */
(() => {
  const C = window.Comun || { animar: false, reduce: true, alListo: (f) => f() };
  const animar = C.animar;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const NS = "http://www.w3.org/2000/svg";

  const nodoSvg = (tag, attrs, padre) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (padre) padre.appendChild(n);
    return n;
  };
  const azar = (a, b) => a + Math.random() * (b - a);

  // Ejecuta jugar() mientras el elemento esté en pantalla y parar() cuando salga.
  const enPantalla = (el, jugar, parar, umbral = 0) => {
    if (!el) return;
    if (!("IntersectionObserver" in window)) { jugar(); return; }
    new IntersectionObserver(([e]) => (e.isIntersecting ? jugar() : parar()), { threshold: umbral }).observe(el);
  };

  // Un solo bucle de cuadros para todas las escenas visibles.
  const motor = (() => {
    const tareas = new Set();
    let corriendo = false;
    const ciclo = (t) => {
      if (!tareas.size) { corriendo = false; return; }
      const s = t / 1000;
      tareas.forEach((f) => f(s));
      requestAnimationFrame(ciclo);
    };
    return {
      agregar(f) { tareas.add(f); if (!corriendo) { corriendo = true; requestAnimationFrame(ciclo); } },
      quitar(f) { tareas.delete(f); },
    };
  })();
  // Sin animación se pinta un solo cuadro fijo.
  const vivo = (el, f) => {
    if (!animar) { f(1.3); return; }
    enPantalla(el, () => motor.agregar(f), () => motor.quitar(f));
  };

  // Superficie ondulada cerrada hacia abajo.
  const onda = (x0, x1, paso, yFn, fondo) => {
    let d = `M${x0} ${fondo} L${x0} ${yFn(x0).toFixed(1)}`;
    for (let x = x0 + paso; x <= x1; x += paso) d += ` L${x} ${yFn(x).toFixed(1)}`;
    return `${d} L${x1} ${fondo} Z`;
  };

  /* -------------------------------------------------------
     Olas entre capas (se mueven solas con CSS)
     ------------------------------------------------------- */
  const crearOlas = () => {
    $$(".ola").forEach((ola, i) => {
      const fase = i * 0.9;
      const forma = (desfase, amp) => onda(0, 2880, 24,
        (x) => 24 + amp * Math.sin((x / 720) * 2 * Math.PI + desfase) + amp * 0.45 * Math.sin((x / 360) * 2 * Math.PI + desfase * 2), 48);
      ["ola__b", "ola__a"].forEach((cls, k) => {
        const svg = nodoSvg("svg", { viewBox: "0 0 2880 48", preserveAspectRatio: "none", class: cls }, ola);
        nodoSvg("path", { d: forma(fase + k * 1.7, k ? 9 : 12) }, svg);
      });
    });
  };

  /* -------------------------------------------------------
     Burbujas de fondo (canvas)
     ------------------------------------------------------- */
  const crearBurbujas = () => {
    $$("canvas.burbujas").forEach((cv) => {
      const ctx = cv.getContext("2d");
      const color = cv.dataset.color || "255,255,255";
      const cantidad = +cv.dataset.cantidad || 30;
      let w = 0, h = 0, dpr = 1;
      const nueva = (alAzar) => ({
        x: Math.random(),
        y: alAzar ? Math.random() : 1.05,
        r: azar(2, 10),
        v: azar(0.02, 0.07),
        f: azar(0, 6.28),
        a: azar(0.25, 0.7),
      });
      const burbujas = Array.from({ length: cantidad }, () => nueva(true));
      const medir = () => {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        w = cv.clientWidth; h = cv.clientHeight;
        cv.width = w * dpr; cv.height = h * dpr;
      };
      medir();
      if ("ResizeObserver" in window) new ResizeObserver(medir).observe(cv);
      let previo = 0;
      vivo(cv, (t) => {
        const dt = previo ? Math.min(0.05, t - previo) : 0.016;
        previo = t;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);
        burbujas.forEach((b, i) => {
          b.y -= b.v * dt * (1 + b.r / 8);
          if (b.y < -0.05) burbujas[i] = nueva(false);
          const x = b.x * w + Math.sin(t * 1.4 + b.f) * 8;
          const y = b.y * h;
          ctx.beginPath();
          ctx.arc(x, y, b.r, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${color},${b.a})`;
          ctx.lineWidth = 1.4;
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(x - b.r * 0.35, y - b.r * 0.35, b.r * 0.22, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${b.a * 0.8})`;
          ctx.fill();
        });
      });
    });
  };

  /* -------------------------------------------------------
     Portada: agua con un bloque de madera que flota
     ------------------------------------------------------- */
  const crearAguaPortada = () => {
    const atras = $("#agua-atras"), frente = $("#agua-frente"), flotador = $("#flotador");
    if (!frente) return;
    const sup = (x, t) => 74 + 10 * Math.sin(x / 170 + t * 1.1) + 5 * Math.sin(x / 90 - t * 1.6);
    // El SVG se estira a lo ancho; se compensa para que los objetos no se deformen.
    const caja = $(".portada__agua");
    const hundido = $("#hundido");
    let k = 1;
    const medir = () => {
      const sx = caja.clientWidth / 1440, sy = caja.clientHeight / 220;
      k = sx > 0 ? sy / sx : 1;
      hundido.setAttribute("transform", `translate(${Math.min(1150, 1440 - 40 * k)} 196) scale(${k.toFixed(3)} 1)`);
    };
    medir();
    if ("ResizeObserver" in window) new ResizeObserver(medir).observe(caja);
    vivo(caja, (t) => {
      atras.setAttribute("d", onda(0, 1440, 24, (x) => 60 + 12 * Math.sin(x / 210 - t * 0.8) + 4 * Math.sin(x / 70 + t), 222));
      frente.setAttribute("d", onda(0, 1440, 24, (x) => sup(x, t), 222));
      const x = 330, y = sup(x, t) - 6;
      const pendiente = (sup(x + 10, t) - sup(x - 10, t)) / 20;
      flotador.setAttribute("transform", `translate(${x} ${y.toFixed(1)}) rotate(${(Math.atan(pendiente) * 57.3 / k).toFixed(1)}) scale(${k.toFixed(3)} 1)`);
    });
  };

  /* -------------------------------------------------------
     Columna de densidad (título)
     ------------------------------------------------------- */
  const crearColumna = () => {
    const capas = [0, 1, 2, 3].map((i) => $(`#liq-${i}`));
    if (!capas[0]) return;
    const topes = [112, 206, 316, 424];
    const corcho = $("#obj-corcho"), uva = $("#obj-uva"), tuerca = $("#obj-tuerca");
    const grupo = $("#columna-burbujas");
    const burbujas = Array.from({ length: 9 }, () => ({ x: azar(110, 250), y: azar(130, 520), r: azar(2, 4.5), el: nodoSvg("circle", { r: 3 }, grupo) }));
    // Más denso, más lento: las burbujas frenan en la miel.
    const frenado = (y) => (y > topes[3] ? 0.18 : y > topes[2] ? 0.7 : y > topes[1] ? 0.5 : 1);
    let previo = 0;
    vivo($("#columna"), (t) => {
      const dt = previo ? Math.min(0.05, t - previo) : 0.016;
      previo = t;
      const sup = (i) => (x) => topes[i] + 3 * Math.sin(x / 26 + t * (1.6 - i * 0.3) + i) + 1.5 * Math.sin(x / 11 - t * 1.1);
      capas.forEach((p, i) => p.setAttribute("d", onda(90, 270, 6, sup(i), 560)));
      corcho.setAttribute("transform", `translate(150 ${(sup(0)(150) - 4).toFixed(1)}) rotate(${(Math.sin(t * 1.3) * 7).toFixed(1)})`);
      uva.setAttribute("transform", `translate(212 ${(topes[3] - 10 + Math.sin(t * 0.9) * 2.5).toFixed(1)})`);
      tuerca.setAttribute("transform", `translate(176 512) rotate(${(Math.sin(t * 0.4) * 4).toFixed(1)})`);
      burbujas.forEach((b) => {
        b.y -= 38 * dt * frenado(b.y);
        if (b.y < topes[0] + 4) { b.y = 525; b.x = azar(110, 250); }
        b.el.setAttribute("cx", (b.x + Math.sin(t * 2 + b.r) * 2).toFixed(1));
        b.el.setAttribute("cy", b.y.toFixed(1));
        b.el.setAttribute("r", b.r.toFixed(1));
      });
    });
  };

  /* -------------------------------------------------------
     Capa 1: un cubo que crece y se encoge
     ------------------------------------------------------- */
  const crearCubo = () => {
    const cubo = $("#cubo"), sombra = $("#cubo-sombra");
    if (!cubo) return;
    const bm = $("#barra-m"), bv = $("#barra-v"), brho = $("#barra-rho");
    const pintar = (s) => {
      cubo.setAttribute("transform", `translate(170 305) scale(${s.toFixed(3)}) translate(-52 -30)`);
      sombra.setAttribute("rx", (70 * s).toFixed(1));
      const vol = (s ** 3) / (1.25 ** 3);
      const ancho = (8 + 102 * vol).toFixed(1);
      bm.setAttribute("width", ancho);
      bv.setAttribute("width", ancho);
    };
    if (!animar) { pintar(1); return; }
    const estado = { s: 0.55 };
    const tl = gsap.timeline({ repeat: -1, yoyo: true, paused: true, onUpdate: () => pintar(estado.s) })
      .to(estado, { s: 1.25, duration: 2.6, ease: "sine.inOut" })
      .to({}, { duration: 0.5 });
    pintar(0.55);
    const brillo = gsap.to(brho, { opacity: 0.6, duration: 0.8, yoyo: true, repeat: -1, ease: "sine.inOut", paused: true });
    enPantalla(cubo.ownerSVGElement, () => { tl.play(); brillo.play(); }, () => { tl.pause(); brillo.pause(); });
  };

  /* -------------------------------------------------------
     Capa 2: gráfica masa contra volumen
     ------------------------------------------------------- */
  const crearGrafica = () => {
    const rej = $("#grafica-rejilla");
    if (!rej) return;
    for (let x = 120; x <= 440; x += 60) nodoSvg("path", { d: `M${x} 350 V40` }, rej);
    for (let y = 290; y >= 50; y -= 60) nodoSvg("path", { d: `M60 ${y} H440` }, rej);
    const rectas = [[230, 40], [440, 104], [440, 280]];
    const puntos = [0, 1, 2].map((i) => $(`#punto-${i}`));
    vivo($("#grafica"), (t) => {
      puntos.forEach((p, i) => {
        const k = 0.15 + 0.75 * (0.5 + 0.5 * Math.sin(t * (0.55 + i * 0.12) + i * 1.3));
        const [x2, y2] = rectas[i];
        p.setAttribute("cx", (60 + k * (x2 - 60)).toFixed(1));
        p.setAttribute("cy", (350 + k * (y2 - 350)).toFixed(1));
      });
    });
  };

  /* -------------------------------------------------------
     Capa 3: inmersión y picnómetro
     ------------------------------------------------------- */
  const crearMetodos = () => {
    const marcas = $("#probeta-marcas");
    if (marcas) for (let y = 60; y <= 290; y += 20) nodoSvg("path", { d: `M80 ${y} H${y % 40 === 20 ? 96 : 90}` }, marcas);

    const meridiano = $("#meridiano");
    const piedra = $("#piedra"), hilo = $("#piedra-hilo"), agua = $("#probeta-agua"), delta = $("#delta");
    const liq = $("#picno-liq"), tapon = $("#picno-tapon"), gota = $("#picno-gota"), m = $("#picno-m");
    if (!animar) {
      if (piedra) { piedra.setAttribute("transform", "translate(0 168)"); hilo.setAttribute("d", "M120 0 V220"); agua.setAttribute("y", 150); }
      if (liq) { liq.setAttribute("y", 92); m.textContent = "m₂"; }
      return;
    }
    gsap.to(meridiano, { attr: { rx: 3 }, duration: 1.6, ease: "sine.inOut", yoyo: true, repeat: -1 });

    const p = { y: 0 };
    const pintarPiedra = () => {
      piedra.setAttribute("transform", `translate(0 ${p.y.toFixed(1)})`);
      hilo.setAttribute("d", `M120 0 V${(52 + p.y).toFixed(1)}`);
    };
    gsap.set(delta, { opacity: 0 });
    const inmersion = gsap.timeline({ repeat: -1, repeatDelay: 0.4, paused: true })
      .to(p, { y: 110, duration: 1.1, ease: "power1.in", onUpdate: pintarPiedra })
      .to(p, { y: 168, duration: 1, ease: "power2.out", onUpdate: pintarPiedra })
      .to(agua, { attr: { y: 150 }, duration: 1, ease: "power2.out" }, "<")
      .to(delta, { opacity: 1, duration: 0.4 })
      .to({}, { duration: 1.6 })
      .to(delta, { opacity: 0, duration: 0.3 })
      .to(p, { y: 0, duration: 1.3, ease: "power2.inOut", onUpdate: pintarPiedra })
      .to(agua, { attr: { y: 180 }, duration: 0.8, ease: "power2.inOut" }, "<0.2");

    const picno = gsap.timeline({ repeat: -1, repeatDelay: 0.3, paused: true })
      .call(() => { m.textContent = "m₁"; })
      .to(tapon, { y: -40, opacity: 0.35, duration: 0.5, ease: "power2.out" })
      .to(liq, { attr: { y: 92 }, duration: 2.2, ease: "power1.inOut" })
      .to(tapon, { y: 0, opacity: 1, duration: 0.5, ease: "power2.in" })
      .fromTo(gota, { attr: { r: 0, cy: 30 }, opacity: 1 }, { attr: { r: 5 }, duration: 0.4 })
      .to(gota, { attr: { cy: 120 }, opacity: 0, duration: 0.7, ease: "power2.in" })
      .call(() => { m.textContent = "m₂"; })
      .to({}, { duration: 1.6 })
      .to(liq, { attr: { y: 272 }, duration: 1, ease: "power2.in" });

    enPantalla($("#carril"), () => { inmersion.play(); picno.play(); }, () => { inmersion.pause(); picno.pause(); });
  };

  /* -------------------------------------------------------
     Capa 4: poros de la madera y átomos del metal
     ------------------------------------------------------- */
  const crearLupas = () => {
    const poros = $("#poros"), atomos = $("#atomos");
    if (!poros) return;
    const burbujasAire = [];
    for (let fila = 0; fila < 8; fila++) {
      for (let col = 0; col < 7; col++) {
        const x = col * 40 + (fila % 2 ? 20 : 0) + 10;
        const y = fila * 34 + 10;
        nodoSvg("ellipse", { cx: x, cy: y, rx: 15, ry: 13, class: "poro" }, poros);
        if ((fila + col) % 3 === 0) burbujasAire.push(nodoSvg("circle", { cx: x, cy: y, r: 3.2, class: "aire" }, poros));
      }
    }
    const R = 11;
    const vibrar = [];
    for (let fila = 0; fila < 14; fila++) {
      for (let col = 0; col < 14; col++) {
        const x = col * 2 * R + (fila % 2 ? R : 0);
        const y = fila * R * 1.732;
        const g = nodoSvg("g", { transform: `translate(${x} ${y})` }, atomos);
        const atomo = nodoSvg("g", {}, g); // el grupo interno es el que vibra
        nodoSvg("circle", { r: R - 0.6, class: "atomo" }, atomo);
        nodoSvg("circle", { cx: -3.5, cy: -3.5, r: 3, class: "atomo__brillo" }, atomo);
        vibrar.push(atomo);
      }
    }
    if (!animar) return;
    // Agitación térmica: cada átomo vibra un poco alrededor de su lugar.
    const jugar = () => {
      gsap.to(vibrar, { x: () => azar(-1.4, 1.4), y: () => azar(-1.4, 1.4), duration: () => azar(0.12, 0.25), ease: "sine.inOut", repeat: -1, yoyo: true, repeatRefresh: true, overwrite: true });
      gsap.to(burbujasAire, { x: () => azar(-5, 5), y: () => azar(-5, 5), duration: () => azar(1.2, 2.2), ease: "sine.inOut", repeat: -1, yoyo: true, repeatRefresh: true, overwrite: true });
    };
    const parar = () => gsap.killTweensOf([...vibrar, ...burbujasAire]);
    enPantalla($(".lupas"), jugar, parar);
  };

  /* -------------------------------------------------------
     Capa 5: tanque de flotación
     ------------------------------------------------------- */
  const crearTanque = () => {
    const svg = $("#tanque");
    if (!svg) return;
    const aguaClip = svg.querySelector("g[clip-path]");
    const madera = $("#t-madera"), metal = $("#t-metal"), estado = $("#tanque-estado");
    svg.insertBefore(aguaClip, $(".tanque__vidrio", svg)); // el agua tiñe lo sumergido
    const agua = $("#tanque-agua");
    const SUP = 150;
    const sup = (x, t) => SUP + 4 * Math.sin(x / 40 + t * 1.6) + 2 * Math.sin(x / 17 - t * 2.1);
    const pos = { my: -60, ky: -60, flota: 0 };
    const pintar = (t) => {
      agua.setAttribute("d", onda(40, 480, 10, (x) => sup(x, t), 350));
      const balanceo = pos.flota ? Math.sin(t * 1.5) * 3 : 0;
      madera.setAttribute("transform", `translate(170 ${(pos.my + balanceo).toFixed(1)}) rotate(${(balanceo * 0.8).toFixed(1)})`);
      metal.setAttribute("transform", `translate(350 ${pos.ky.toFixed(1)})`);
    };
    const fuerzas = $$(".fuerza", svg);
    if (!animar) { pos.my = SUP + 4; pos.ky = 314; pos.flota = 1; pintar(1); return; }
    gsap.set(fuerzas, { opacity: 0 });
    const tl = gsap.timeline({ repeat: -1, paused: true })
      .call(() => { estado.textContent = "Dos cuerpos del mismo tamaño caen al agua…"; pos.flota = 0; })
      .set(pos, { my: -60, ky: -60 })
      .to([madera, metal], { opacity: 1, duration: 0.3 })
      .to(pos, { my: SUP - 30, duration: 0.7, ease: "power2.in" })
      .to(pos, { my: SUP + 4, duration: 1.4, ease: "elastic.out(1, 0.35)" })
      .to(pos, { ky: SUP - 30, duration: 0.7, ease: "power2.in" }, 0.5)
      .to(pos, { ky: 314, duration: 1.6, ease: "power2.out" }, 1.2)
      .call(() => { pos.flota = 1; estado.textContent = "La madera flota: empuje y peso se equilibran. El metal se hunde: su peso gana."; })
      .to(fuerzas, { opacity: 1, duration: 0.5, stagger: 0.1 })
      .to({}, { duration: 3.4 })
      .to([...fuerzas, madera, metal], { opacity: 0, duration: 0.5 });
    vivo(svg, pintar);
    enPantalla(svg, () => tl.play(), () => tl.pause());
  };

  /* -------------------------------------------------------
     Capa 6: evaporación, humedad y una lectura que se mueve
     ------------------------------------------------------- */
  const crearAmbiente = () => {
    const svg = $("#ambiente");
    if (!svg) return;
    const liq = $("#amb-liq"), vapor = $("#vapor"), humedad = $("#humedad"), aguja = $("#dial-aguja");
    const nivel = { y: 150 };
    vivo(svg, (t) => {
      liq.setAttribute("d", onda(116, 304, 6, (x) => nivel.y + 2.5 * Math.sin(x / 18 + t * 2) + 1.2 * Math.sin(x / 7 - t * 1.4), 330));
      aguja.setAttribute("transform", `rotate(${(Math.sin(t * 0.7) * 28 + Math.sin(t * 2.3) * 8).toFixed(1)})`);
    });
    if (!animar) return;
    const bajar = gsap.timeline({ repeat: -1, paused: true })
      .to(nivel, { y: 186, duration: 12, ease: "none" })
      .to(nivel, { y: 150, duration: 1.6, ease: "power2.inOut" });
    let reloj = null;
    const soltar = () => {
      const x = azar(140, 280);
      const v = nodoSvg("circle", { cx: x.toFixed(1), cy: nivel.y.toFixed(1), r: azar(2, 4).toFixed(1) }, vapor);
      gsap.fromTo(v, { opacity: 0.8 }, { attr: { cy: nivel.y - azar(90, 140), cx: x + azar(-18, 18) }, opacity: 0, duration: azar(1.8, 2.8), ease: "sine.out", onComplete: () => v.remove() });
      if (Math.random() < 0.5) {
        const h = nodoSvg("circle", { cx: azar(330, 410).toFixed(1), cy: azar(100, 140).toFixed(1), r: 3 }, humedad);
        gsap.fromTo(h, { opacity: 0 }, {
          keyframes: [{ opacity: 1, duration: 0.3 }, { attr: { cx: azar(230, 280), cy: nivel.y }, duration: 2.2, ease: "power1.in" }, { opacity: 0, duration: 0.3 }],
          onComplete: () => h.remove(),
        });
      }
    };
    enPantalla(svg, () => { bajar.play(); if (!reloj) reloj = setInterval(soltar, 240); },
      () => { bajar.pause(); clearInterval(reloj); reloj = null; });
  };

  /* -------------------------------------------------------
     Idea central: una ρ que se llena de miel
     ------------------------------------------------------- */
  const crearRho = () => {
    const liq = $("#rho-liq");
    if (!liq) return;
    vivo($(".idea__rho"), (t) => {
      const base = 190 + Math.sin(t * 0.45) * 55;
      liq.setAttribute("d", onda(0, 300, 6, (x) => base + 7 * Math.sin(x / 26 + t * 2) + 3 * Math.sin(x / 11 - t * 1.3), 360));
    });
  };

  /* -------------------------------------------------------
     Profundímetro
     ------------------------------------------------------- */
  const crearProfundidad = () => {
    const nav = $(".profundidad");
    if (!nav || !("IntersectionObserver" in window)) return;
    const enlaces = $$("a", nav);
    const capas = enlaces.map((a) => $(a.getAttribute("href")));
    const burbuja = $(".profundidad__burbuja", nav);
    const activos = new Set();
    const io = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => (e.isIntersecting ? activos.add(e.target) : activos.delete(e.target)));
      nav.classList.toggle("visible", activos.size > 0);
      enlaces.forEach((a, i) => a.classList.toggle("activo", activos.has(capas[i])));
    }, { rootMargin: "-50% 0px -50% 0px" });
    capas.forEach((c) => c && io.observe(c));
    const mover = () => {
      const ini = capas[0].getBoundingClientRect().top + scrollY;
      const fin = capas[capas.length - 1].getBoundingClientRect().bottom + scrollY - innerHeight;
      const p = Math.max(0, Math.min(1, (scrollY - ini) / Math.max(1, fin - ini)));
      burbuja.style.transform = `translateY(${(p * (nav.clientHeight - 11)).toFixed(1)}px)`;
    };
    addEventListener("scroll", mover, { passive: true });
    addEventListener("resize", mover);
    mover();
  };

  /* -------------------------------------------------------
     Letras que flotan
     ------------------------------------------------------- */
  const partirLetras = (el) => {
    const palabras = el.textContent.trim().split(/\s+/);
    el.textContent = "";
    el.setAttribute("aria-label", palabras.join(" "));
    const letras = [];
    palabras.forEach((p, i) => {
      const w = document.createElement("span");
      w.className = "palabra";
      w.setAttribute("aria-hidden", "true");
      [...p].forEach((c) => {
        const s = document.createElement("span");
        s.className = "ch";
        s.textContent = c;
        w.appendChild(s);
        letras.push(s);
      });
      el.appendChild(w);
      if (i < palabras.length - 1) el.appendChild(document.createTextNode(" "));
    });
    return letras;
  };

  /* =======================================================
     GSAP + ScrollTrigger
     ======================================================= */
  const animaciones = () => {
    // Portada: el nombre sale del agua letra por letra y sigue flotando
    const nombre = $(".portada__nombre");
    const letrasNombre = partirLetras(nombre);
    gsap.set(nombre, { opacity: 1 });
    gsap.set(letrasNombre, { yPercent: 110, opacity: 0 });
    C.alListo(() => {
      gsap.timeline()
        .to(letrasNombre, { yPercent: 0, opacity: 1, rotate: 0, duration: 1.2, ease: "back.out(1.6)", stagger: 0.045 })
        .to(".portada [data-sube]", { opacity: 1, y: 0, filter: "blur(0px)", duration: 1, ease: "power3.out", stagger: 0.08 }, 0.3)
        .add(() => {
          gsap.to(letrasNombre, { y: -7, duration: 1.8, ease: "sine.inOut", stagger: { each: 0.09, repeat: -1, yoyo: true } });
        });
    });

    // Otros títulos: letras que suben como burbujas
    $$("[data-flota]").filter((el) => el !== nombre).forEach((el) => {
      const letras = partirLetras(el);
      gsap.set(el, { opacity: 1 });
      gsap.fromTo(letras, { yPercent: 90, opacity: 0, rotate: () => azar(-10, 10) }, {
        yPercent: 0, opacity: 1, rotate: 0, duration: 1, ease: "back.out(1.8)", stagger: 0.02,
        scrollTrigger: { trigger: el, start: "top 86%" },
      });
    });

    // Párrafos: emergen desenfocados, como vistos bajo el agua
    $$("[data-sube]").filter((el) => !el.closest(".portada")).forEach((el) => {
      gsap.to(el, { opacity: 1, y: 0, filter: "blur(0px)", duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 90%" } });
    });

    // Lo que hicimos: el texto se llena como un vaso mientras la sección queda fija
    gsap.timeline({ scrollTrigger: { trigger: ".hicimos__cab", start: "top top", end: "+=80%", scrub: 0.6, pin: true, anticipatePin: 1 } })
      .to("#manifiesto", { backgroundPosition: "0 100%", ease: "none", duration: 1 })
      .to({}, { duration: 0.35 });

    // Capa 2: las rectas se dibujan con el scroll
    $$("[data-recta]").forEach((r) => {
      const L = r.getTotalLength();
      gsap.fromTo(r, { strokeDasharray: L, strokeDashoffset: L }, {
        strokeDashoffset: 0, ease: "none",
        scrollTrigger: { trigger: "#grafica", start: "top 80%", end: "center 45%", scrub: 0.8 },
      });
    });
    gsap.fromTo("#pendiente", { opacity: 0 }, { opacity: 1, scrollTrigger: { trigger: "#grafica", start: "center 55%", end: "center 40%", scrub: true } });

    // Capa 3: carril horizontal fijado (pantallas grandes)
    const mm = gsap.matchMedia();
    mm.add("(min-width: 900px)", () => {
      const carril = $("#carril"), fijo = $(".capa3__fijo");
      const distancia = () => Math.max(0, carril.scrollWidth - (fijo.clientWidth - 2 * parseFloat(getComputedStyle(fijo).paddingLeft)));
      gsap.to(carril, {
        x: () => -distancia(), ease: "none",
        scrollTrigger: { trigger: fijo, start: "top top", end: () => `+=${distancia()}`, scrub: 0.7, pin: true, anticipatePin: 1, invalidateOnRefresh: true },
      });
    });

    // Capa 1: el cubo entra flotando; capa 4: las lupas se acercan
    gsap.from(".cubo-escena", { y: 80, opacity: 0, duration: 1.2, ease: "power3.out", scrollTrigger: { trigger: ".cubo-escena", start: "top 85%" } });
    gsap.from(".lupa", { scale: 0.6, opacity: 0, rotate: (i) => (i ? 12 : -12), duration: 1.3, ease: "back.out(1.5)", stagger: 0.15, scrollTrigger: { trigger: ".lupas", start: "top 80%" } });
    gsap.fromTo(".idea__rho", { yPercent: 12, rotate: -6 }, { yPercent: -8, rotate: 4, ease: "none", scrollTrigger: { trigger: ".idea", start: "top bottom", end: "bottom top", scrub: true } });

    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
    window.addEventListener("load", () => ScrollTrigger.refresh());
    C.alListo(() => setTimeout(() => ScrollTrigger.refresh(), 120));
  };

  /* =======================================================
     Arranque
     ======================================================= */
  crearOlas();
  crearBurbujas();
  crearAguaPortada();
  crearColumna();
  crearCubo();
  crearGrafica();
  crearMetodos();
  crearLupas();
  crearTanque();
  crearAmbiente();
  crearRho();
  crearProfundidad();
  if (animar) animaciones();
})();
