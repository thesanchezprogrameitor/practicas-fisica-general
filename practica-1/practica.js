/* =========================================================
   Práctica 1 · Error e incertidumbre
   Escala Vernier de la portada, animación de la regla que cae,
   dibujos que se trazan al hacer scroll y animaciones.
   ========================================================= */
(() => {
  const C = window.Comun || { animar: false, reduce: true, alListo: (f) => f() };
  const animar = C.animar;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const NS = "http://www.w3.org/2000/svg";
  const coma = (n, d = 1) => n.toFixed(d).replace(".", ",");

  const gauss = () => {
    let u = 0, v = 0;
    while (!u) u = Math.random();
    while (!v) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  // Ejecuta jugar() mientras el elemento esté en pantalla y parar() cuando salga.
  const enPantalla = (el, jugar, parar, umbral = 0.15) => {
    if (!el || !("IntersectionObserver" in window)) { jugar(); return; }
    new IntersectionObserver(([e]) => (e.isIntersecting ? jugar() : parar()), { threshold: umbral }).observe(el);
  };

  const nodoSvg = (tag, attrs, padre) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (padre) padre.appendChild(n);
    return n;
  };

  const partirPalabras = (el) => {
    const palabras = el.textContent.trim().split(/\s+/);
    el.textContent = "";
    palabras.forEach((p, i) => {
      const s = document.createElement("span");
      s.className = "palabra";
      s.textContent = p;
      el.appendChild(s);
      if (i < palabras.length - 1) el.appendChild(document.createTextNode(" "));
    });
    return $$(".palabra", el);
  };

  /* =======================================================
     Escala Vernier de la portada
     ======================================================= */
  const iniciarVernier = () => {
    const svg = $("#vernier");
    const salida = $("#lectura");
    if (!svg) return;
    const U = 12, W = 1800, H = 150, X0 = 30, BASE = 64;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);

    const principal = nodoSvg("g", { class: "v-principal" }, svg);
    nodoSvg("line", { x1: 0, x2: W, y1: BASE, y2: BASE, class: "v-base" }, svg);
    for (let mm = 0; X0 + mm * U <= W; mm++) {
      const x = X0 + mm * U;
      const largo = mm % 10 === 0 ? 30 : mm % 5 === 0 ? 20 : 11;
      nodoSvg("line", { x1: x, x2: x, y1: BASE, y2: BASE - largo }, principal);
      if (mm % 10 === 0) nodoSvg("text", { x, y: BASE - 37 }, principal).textContent = mm / 10;
    }

    const nonio = nodoSvg("g", { class: "v-nonio" }, svg);
    const paso = 0.9 * U;
    nodoSvg("rect", { x: -18, y: BASE + 2, width: 10 * paso + 36, height: 60, rx: 4, class: "v-placa" }, nonio);
    const lineas = [];
    for (let i = 0; i <= 10; i++) {
      const x = i * paso;
      lineas.push(nodoSvg("line", { x1: x, x2: x, y1: BASE + 2, y2: BASE + 2 + (i % 5 === 0 ? 26 : 16) }, nonio));
      if (i % 5 === 0) nodoSvg("text", { x, y: BASE + 44 }, nonio).textContent = i;
    }

    let previa = -1;
    const pintar = (lectura) => {
      nonio.setAttribute("transform", `translate(${(X0 + lectura * U).toFixed(2)} 0)`);
      const i = Math.round((lectura - Math.floor(lectura)) * 10);
      if (i !== previa) {
        if (lineas[previa]) lineas[previa].classList.remove("coincide");
        if (lineas[i]) lineas[i].classList.add("coincide");
        previa = i;
      }
      if (salida) salida.textContent = coma(Math.round(lectura * 10) / 10);
    };

    if (C.reduce) { pintar(72.4); return; }

    let raton = null, actual = 0, visible = true, corriendo = false;
    const t0 = performance.now();
    window.addEventListener("pointermove", (e) => {
      const r = e.clientX / window.innerWidth;
      if (e.pointerType === "mouse" && Number.isFinite(r)) raton = Math.max(0, Math.min(1, r));
    }, { passive: true });

    const ciclo = () => {
      if (!visible) { corriendo = false; return; }
      const t = (performance.now() - t0) / 1000;
      const base = raton === null
        ? 70 + Math.sin(t * 0.45) * 12 + Math.sin(t * 1.25) * 2.5
        : 70 + (raton - 0.5) * 80;
      const desplazamiento = Math.min(window.scrollY / (window.innerHeight || 1), 1) * 18;
      actual += (base + desplazamiento - actual) * 0.06;
      if (!Number.isFinite(actual)) actual = 70;
      pintar(actual);
      requestAnimationFrame(ciclo);
    };
    const arrancar = () => { if (!corriendo) { corriendo = true; requestAnimationFrame(ciclo); } };
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) arrancar(); }).observe(svg);
    arrancar();
  };

  /* =======================================================
     Tiempo de reacción: animación automática
     Una persona suelta la regla y la otra la atrapa.
     Se reproduce sola mientras está en pantalla.
     ======================================================= */
  const iniciarCaida = () => {
    const raiz = $("#caida");
    if (!raiz) return;
    const regla = $("#caida-regla"), marcas = $("#caida-marcas"), cota = $("#caida-cota");
    const dedosA = $$("#dedos-a .dedo"), dedosB = $$("#dedos-b .dedo");
    const cotaLinea = $("#cota-linea"), cotaFin = $("#cota-fin"), cotaTxt = $("#cota-txt");
    const estado = $("#caida-estado"), lectura = $("#caida-lectura"), pista = $("#caida-pista");

    const PX = 8, CERO = 310, G = 9.81, LENTA = 4; // px por cm, línea del cero, m/s², cámara lenta
    const intentos = [17.6, 14.1, 20.3, 12.9, 15.8, 13.4]; // cm (ilustrativos)
    const esperas = [0.7, 1.1, 0.5, 0.9, 1.3, 0.6]; // s: la regla se suelta sin aviso
    const MIN = 140, MAX = 220; // ms, escala de la pista

    for (let i = 0; i <= 30; i++) {
      const y = CERO - i * PX;
      const largo = i % 10 === 0 ? 10 : i % 5 === 0 ? 8 : 4;
      nodoSvg("line", { x1: 251, x2: 251 + largo, y1: y, y2: y }, marcas);
      if (i % 5 === 0 && i > 0) nodoSvg("text", { x: 267.5, y: y + 2.3 }, marcas).textContent = i;
    }

    const ms = (d) => Math.round(Math.sqrt((2 * d) / 100 / G) * 1000);
    const texto = (n, d) => `Intento ${n}: la regla alcanzó a caer <b>${coma(d)} cm</b> antes de que la mano se cerrara. Eso equivale a unos <b>${ms(d)} ms</b> de reacción.`;
    const ponerCota = (d) => {
      const y = CERO + d * PX;
      cotaLinea.setAttribute("y2", y);
      cotaFin.setAttribute("y1", y);
      cotaFin.setAttribute("y2", y);
      cotaTxt.setAttribute("y", CERO + (d * PX) / 2 + 6);
    };
    const punto = (d) => {
      $$("i", pista).forEach((p) => p.classList.remove("ultimo"));
      const p = document.createElement("i");
      p.className = "ultimo";
      p.style.left = `${Math.max(0, Math.min(1, (ms(d) - MIN) / (MAX - MIN))) * 100}%`;
      pista.appendChild(p);
    };
    const limpiar = () => { $$("i", pista).forEach((p) => pista.removeChild(p)); };

    if (!animar) {
      const d = intentos[0];
      regla.setAttribute("transform", `translate(0 ${d * PX})`);
      dedosB[0].setAttribute("transform", "translate(6 0)");
      dedosB[1].setAttribute("transform", "translate(-6 0)");
      ponerCota(d);
      estado.textContent = "¡Atrapada!";
      lectura.innerHTML = texto(1, d);
      intentos.forEach(punto);
      return;
    }

    gsap.set(cota, { opacity: 0 });
    const tl = gsap.timeline({ repeat: -1, paused: true, onRepeat: limpiar });
    intentos.forEach((d, i) => {
      const t = Math.sqrt((2 * d) / 100 / G) * LENTA;
      tl.call(() => { estado.textContent = "Sostiene la regla…"; })
        .to({}, { duration: esperas[i] })
        .call(() => { estado.textContent = "¡La suelta!"; })
        .to(dedosA[0], { x: -8, duration: 0.12, ease: "power2.out" })
        .to(dedosA[1], { x: 8, duration: 0.12, ease: "power2.out" }, "<")
        // caída libre: la distancia crece con el cuadrado del tiempo
        .to(regla, { y: d * PX, duration: t, ease: "power2.in" }, "<")
        .to(dedosB[0], { x: 6, duration: 0.08, ease: "power3.out" }, ">-0.05")
        .to(dedosB[1], { x: -6, duration: 0.08, ease: "power3.out" }, "<")
        .call(() => {
          estado.textContent = "¡Atrapada!";
          ponerCota(d);
          lectura.innerHTML = texto(i + 1, d);
          punto(d);
        })
        .fromTo(cota, { opacity: 0 }, { opacity: 1, duration: 0.3 })
        .to({}, { duration: 1.5 })
        .to(cota, { opacity: 0, duration: 0.3 })
        .to(dedosB, { x: 0, duration: 0.3 }, "<")
        .to(regla, { y: 0, duration: 0.8, ease: "power2.inOut" }, "<0.1")
        .to(dedosA, { x: 0, duration: 0.2 }, ">-0.1");
    });

    // Nunca quieto: las personas respiran y la línea del cero fluye
    const reposo = gsap.timeline({ paused: true })
      .to($$(".persona .cabeza", raiz), { y: -3, duration: 1.6, ease: "sine.inOut", yoyo: true, repeat: -1, stagger: 0.7 }, 0)
      .to($(".caida__cero", raiz), { strokeDashoffset: -14, duration: 1, ease: "none", repeat: -1 }, 0);
    enPantalla(raiz, () => { tl.play(); reposo.play(); }, () => { tl.pause(); reposo.pause(); }, 0.1);
  };

  /* =======================================================
     Nube de mediciones (pantalla del título)
     Cada punto es una medición: se dispersan alrededor de un
     centro, el anillo marca la incertidumbre y abajo se arma
     el histograma. Se mueve sin parar mientras está visible.
     ======================================================= */
  const iniciarNube = () => {
    const svg = $("#nube");
    if (!svg) return;
    const gp = $("#nube-puntos"), anillo = $("#nube-anillo"), media = $("#nube-media");
    const etq = $("#nube-etq"), histo = $("#nube-histo");
    const MX = 270, MY = 214, S = 40; // el centro de las mediciones no cae justo en la referencia
    const BINS = 20, X0 = 100, ANCHO = 16, BASE = 520;
    const barras = Array.from({ length: BINS }, (_, i) =>
      nodoSvg("rect", { x: X0 + i * ANCHO + 2, y: BASE, width: ANCHO - 4, height: 0, rx: 2 }, histo));
    const cuentas = new Array(BINS).fill(0);
    const vivos = [], recientes = [];
    let mx = MX, my = MY, sd = S;

    const nuevo = (t) => {
      const x = MX + gauss() * S, y = MY + gauss() * S * 0.8;
      const c = nodoSvg("circle", { cx: x.toFixed(1), cy: y.toFixed(1), r: 0 }, gp);
      vivos.push({ c, t });
      recientes.push([x, y]);
      if (recientes.length > 40) recientes.shift();
      const b = Math.floor((x - X0) / ANCHO);
      if (b >= 0 && b < BINS) cuentas[b] += 1;
    };
    const pintarBarras = () => {
      const max = Math.max(...cuentas);
      cuentas.forEach((n, i) => {
        const h = Math.min(86, n * 11);
        barras[i].setAttribute("y", (BASE - h).toFixed(1));
        barras[i].setAttribute("height", h.toFixed(1));
        barras[i].classList.toggle("alto", n > 0 && n === max);
      });
    };
    const pintarAnillo = () => {
      anillo.setAttribute("cx", mx.toFixed(1));
      anillo.setAttribute("cy", my.toFixed(1));
      anillo.setAttribute("r", sd.toFixed(1));
      media.setAttribute("cx", mx.toFixed(1));
      media.setAttribute("cy", my.toFixed(1));
      etq.setAttribute("x", (mx + sd * 0.72 + 8).toFixed(1));
      etq.setAttribute("y", (my - sd * 0.72 - 6).toFixed(1));
    };

    if (!animar) {
      for (let i = 0; i < 70; i++) nuevo(0);
      vivos.forEach((p) => { p.c.setAttribute("r", 3); p.c.setAttribute("opacity", 0.6); });
      pintarBarras();
      pintarAnillo();
      return;
    }

    const VIDA = 4200, CADA = 140;
    let ultimo = 0, visible = false, corriendo = false;
    const ciclo = (ahora) => {
      if (!visible) { corriendo = false; return; }
      if (ahora - ultimo > CADA) { nuevo(ahora); ultimo = ahora; }
      for (let i = vivos.length - 1; i >= 0; i--) {
        const p = vivos[i], e = (ahora - p.t) / VIDA;
        if (e >= 1) { gp.removeChild(p.c); vivos.splice(i, 1); continue; }
        const r = e < 0.06 ? (e / 0.06) * 5 : 5 - e * 2.2;
        p.c.setAttribute("r", Math.max(0, r).toFixed(2));
        p.c.setAttribute("opacity", (e < 0.06 ? 1 : 1 - (e - 0.06) / 0.94).toFixed(3));
        p.c.classList.toggle("reciente", e < 0.12);
      }
      const n = recientes.length;
      if (n > 2) {
        let sx = 0, sy = 0, v = 0;
        recientes.forEach(([x, y]) => { sx += x; sy += y; });
        const ax = sx / n, ay = sy / n;
        recientes.forEach(([x, y]) => { v += (x - ax) ** 2 + (y - ay) ** 2; });
        const s = Math.sqrt(v / (2 * n));
        mx += (ax - mx) * 0.04; my += (ay - my) * 0.04; sd += (s - sd) * 0.04;
      }
      for (let i = 0; i < BINS; i++) cuentas[i] *= 0.995;
      pintarBarras();
      pintarAnillo();
      requestAnimationFrame(ciclo);
    };
    enPantalla(svg, () => {
      visible = true;
      if (!corriendo) { corriendo = true; requestAnimationFrame(ciclo); }
    }, () => { visible = false; }, 0);
  };

  /* =======================================================
     Gotas bajo la campana: mediciones que caen sobre el eje
     ======================================================= */
  const iniciarGotas = () => {
    const g = $("#campana-gotas");
    if (!g || !animar) return;
    const c = 300, s = 72, alto = 150, base = 180;
    let reloj = null;
    const soltar = () => {
      const x = Math.max(30, Math.min(570, c + gauss() * s));
      const y0 = base - alto * Math.exp(-((x - c) ** 2) / (2 * s * s));
      const p = nodoSvg("circle", { cx: x.toFixed(1), cy: y0.toFixed(1), r: 3 }, g);
      if (Math.abs(x - c) <= s) p.classList.add("dentro");
      gsap.fromTo(p, { attr: { cy: y0 } }, {
        attr: { cy: base - 3 }, duration: 0.8, ease: "power2.in",
        onComplete: () => gsap.to(p, { opacity: 0, duration: 1.2, delay: 0.4, onComplete: () => g.removeChild(p) }),
      });
    };
    enPantalla($(".idea__campana"), () => { if (!reloj) reloj = setInterval(soltar, 170); },
      () => { clearInterval(reloj); reloj = null; }, 0);
  };

  /* =======================================================
     Curva de la idea central
     ======================================================= */
  const dibujarCampana = () => {
    const curva = $("#campana-curva"), banda = $("#campana-banda");
    if (!curva) return;
    const c = 300, s = 72, alto = 150, base = 180;
    const y = (x) => base - alto * Math.exp(-((x - c) ** 2) / (2 * s * s));
    let d = "";
    for (let x = 20; x <= 580; x += 4) d += `${x === 20 ? "M" : "L"}${x} ${y(x).toFixed(2)} `;
    curva.setAttribute("d", d.trim());
    let b = `M${c - s} ${base} `;
    for (let x = c - s; x <= c + s; x += 3) b += `L${x} ${y(x).toFixed(2)} `;
    b += `L${c + s} ${y(c + s).toFixed(2)} L${c + s} ${base} Z`;
    banda.setAttribute("d", b);
  };

  /* =======================================================
     Marcas de los dibujos de instrumentos
     ======================================================= */
  const marcarInstrumentos = () => {
    const regla = $("#marcas-regla");
    if (regla) for (let i = 0; i <= 40; i++) {
      const x = 16 + i * 5.2;
      nodoSvg("line", { x1: x, x2: x, y1: 28, y2: 28 + (i % 10 === 0 ? 16 : i % 5 === 0 ? 11 : 6) }, regla);
    }
    const vern = $("#marcas-vernier");
    if (vern) for (let i = 0; i <= 38; i++) {
      const x = 40 + i * 5;
      nodoSvg("line", { x1: x, x2: x, y1: 36, y2: 36 - (i % 10 === 0 ? 8 : i % 5 === 0 ? 6 : 3.5) }, vern);
    }
  };

  /* =======================================================
     Índice lateral de actividades
     ======================================================= */
  const iniciarIndice = () => {
    const indice = $(".indice-cap");
    if (!indice || !("IntersectionObserver" in window)) return;
    const enlaces = $$("a", indice);
    const caps = enlaces.map((a) => $(a.getAttribute("href")));
    const activos = new Set();
    const io = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => (e.isIntersecting ? activos.add(e.target) : activos.delete(e.target)));
      indice.classList.toggle("visible", activos.size > 0);
      enlaces.forEach((a, i) => a.classList.toggle("activo", activos.has(caps[i])));
    }, { rootMargin: "-50% 0px -50% 0px" });
    caps.forEach((c) => c && io.observe(c));
  };

  /* =======================================================
     Animaciones con GSAP + ScrollTrigger
     ======================================================= */
  const trazar = (raiz, extra = {}) => {
    const els = $$("[data-trazo]", raiz);
    if (!els.length) return null;
    els.forEach((el) => {
      const L = el.getTotalLength ? el.getTotalLength() : 0;
      el.style.strokeDasharray = `${L} ${L}`;
      el.style.strokeDashoffset = L;
    });
    return gsap.to(els, {
      strokeDashoffset: 0,
      duration: 1.6,
      ease: "power2.inOut",
      stagger: 0.1,
      onComplete: () => els.forEach((el) => { el.style.strokeDasharray = ""; el.style.strokeDashoffset = ""; }),
      ...extra,
    });
  };

  const animaciones = () => {
    // Portada: entrada
    gsap.set(".portada__pm", { yPercent: -55, y: 0 });
    C.alListo(() => {
      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
      tl.fromTo(".portada__nombre .linea > span", { yPercent: 110, y: 0 }, { yPercent: 0, duration: 1.5, stagger: 0.1 })
        .fromTo(".portada [data-entra]", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1.2, stagger: 0.07 }, 0.2)
        .fromTo(".portada__pm", { opacity: 0, scale: 0.8, rotate: -12 }, { opacity: 1, scale: 1, rotate: 0, duration: 2.4 }, 0)
        .fromTo(".portada__rejilla", { opacity: 0 }, { opacity: 1, duration: 2 }, 0);
    });

    // Portada: parallax al salir
    const salida = { trigger: ".portada", start: "top top", end: "bottom top", scrub: true };
    gsap.to(".portada__pm", { rotate: 30, yPercent: -75, ease: "none", scrollTrigger: salida });
    gsap.to(".portada__centro", { y: -120, opacity: 0.15, ease: "none", scrollTrigger: salida });

    // Revelados genéricos
    $$("[data-revela]").forEach((el) => {
      gsap.to(el, { opacity: 1, y: 0, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%" } });
    });

    // Titulares por líneas
    $$(".practica__titulo, .hicimos__titulo, .pie__frase").forEach((t) => {
      gsap.fromTo($$(".linea > span", t), { yPercent: 110, y: 0 }, {
        yPercent: 0, duration: 1.4, ease: "expo.out", stagger: 0.12,
        scrollTrigger: { trigger: t, start: "top 82%" },
      });
    });

    // Manifiesto: las palabras se encienden con el scroll
    const manifiesto = $("[data-palabras]");
    if (manifiesto) {
      const palabras = partirPalabras(manifiesto);
      // La cabecera se queda fija una pantalla mientras todo el texto se enciende
      gsap.timeline({ scrollTrigger: { trigger: ".hicimos__cab", start: "top top", end: "+=75%", scrub: 0.5, pin: true, anticipatePin: 1 } })
        .to(palabras, { opacity: 1, ease: "none", stagger: 0.1, duration: 0.3 })
        .to({}, { duration: 0.5 });
    }

    // Números grandes de capítulo
    $$(".cap .cap__num").forEach((n) => {
      gsap.fromTo(n, { yPercent: 25 }, { yPercent: -25, ease: "none", scrollTrigger: { trigger: n.closest(".cap"), start: "top bottom", end: "bottom top", scrub: true } });
    });

    // Pantalla del título de la práctica
    gsap.fromTo(".nube", { opacity: 0, scale: 0.92 }, { opacity: 1, scale: 1, duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: ".practica", start: "top 70%" } });
    gsap.fromTo(".practica__regla span", { scaleX: 0 }, { scaleX: 1, ease: "none", scrollTrigger: { trigger: ".practica", start: "top 60%", end: "bottom 40%", scrub: 1 } });

    // 01 · caída de la regla
    gsap.from(".caida", { y: 60, opacity: 0, duration: 1.2, ease: "power3.out", scrollTrigger: { trigger: ".caida", start: "top 85%" } });

    // 02 · instrumentos
    $$(".instrumento").forEach((li) => {
      const svg = $("svg", li);
      const tl = gsap.timeline({ scrollTrigger: { trigger: li, start: "top 82%" } });
      const tr = trazar(svg);
      if (tr) tl.add(tr, 0);
      tl.from($$(".instrumento__marcas line", svg), { scaleY: 0, transformOrigin: "50% 0%", duration: 0.5, stagger: 0.01, ease: "power2.out" }, 0.6);
    });

    // Piezas que se mueven con el scroll (sin pasar el ratón por encima)
    const conScroll = (el) => ({ trigger: el.closest(".instrumento"), start: "top 90%", end: "bottom 20%", scrub: 1 });
    const lector = $("#lector-regla");
    if (lector) gsap.fromTo(lector, { x: 0 }, { x: 208, ease: "none", scrollTrigger: conScroll(lector) });
    const corredera = $(".instrumento__corredera");
    if (corredera) gsap.fromTo(corredera, { x: -54 }, { x: 70, ease: "none", scrollTrigger: conScroll(corredera) });
    const objeto = $("#objeto-balanza");
    if (objeto) {
      gsap.timeline({ scrollTrigger: conScroll(objeto) })
        .fromTo(objeto, { y: -46, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: "power2.in" })
        .to(["#plato-balanza", objeto], { y: "+=3", duration: 0.25, ease: "power2.out" })
        .to("#pantalla-balanza", { fill: "#ff5a1f", duration: 0.25 }, "<")
        .to({}, { duration: 0.5 });
    }
    // ...y además nunca se quedan quietas
    if (lector) gsap.to($$("path", lector), { x: 9, duration: 1.3, ease: "sine.inOut", yoyo: true, repeat: -1 });
    if (corredera) gsap.to($$(":scope > path", corredera), { x: 7, duration: 1.7, ease: "sine.inOut", yoyo: true, repeat: -1 });
    if (objeto) {
      gsap.to($$("rect", objeto), { y: -2.5, duration: 0.9, ease: "sine.inOut", yoyo: true, repeat: -1 });
      gsap.to("#pantalla-balanza", { opacity: 0.35, duration: 0.7, ease: "sine.inOut", yoyo: true, repeat: -1 });
    }

    // 03 · sólidos
    const solidos = $(".solidos");
    if (solidos) {
      const tl = gsap.timeline({ scrollTrigger: { trigger: solidos, start: "top 78%" } });
      $$(".solido svg", solidos).forEach((svg, i) => {
        const tr = trazar(svg, { duration: 1.8 });
        if (tr) tl.add(tr, i * 0.25);
      });
      tl.fromTo($$("[data-cota]", solidos), { opacity: 0 }, { opacity: 1, duration: 0.8, stagger: 0.15 }, 1.4);

      // Cada cuerpo se desplaza a su ritmo mientras se hace scroll
      const desfase = [26, 44, 18];
      gsap.fromTo($$(".solido", solidos), { y: (i) => desfase[i] }, {
        y: (i) => -desfase[i], ease: "none",
        scrollTrigger: { trigger: solidos, start: "top bottom", end: "bottom top", scrub: 1 },
      });

      // Retirar el cuerpo y volver a medir
      const n = $("#lecturas-n");
      let lectura = 1;
      const repetir = gsap.timeline({ repeat: -1, repeatDelay: 0.6, paused: true, onRepeat: () => { lectura = (lectura % 5) + 1; n.textContent = lectura; } });
      repetir
        .to($$(".solido svg", solidos), { y: -14, duration: 0.45, ease: "power2.out", stagger: 0.08 })
        .to($$("[data-cota]", solidos), { opacity: 0.15, duration: 0.3 }, 0)
        .to($$(".solido svg", solidos), { y: 0, duration: 0.6, ease: "bounce.out", stagger: 0.08 })
        .to($$("[data-cota]", solidos), { opacity: 1, duration: 0.4 }, "-=0.3");
      enPantalla(solidos, () => repetir.play(), () => repetir.pause(), 0.2);
    }

    // 04 · propagación
    const propaga = $(".propaga");
    if (propaga) {
      const tl = gsap.timeline({ scrollTrigger: { trigger: propaga, start: "top 75%" } });
      tl.fromTo($$(".nodo", propaga), { opacity: 0, x: -14 }, { opacity: 1, x: 0, duration: 0.8, stagger: 0.12, ease: "power3.out" })
        .fromTo($$(".barra-error:not(.barra-error--calc) path", propaga), { attr: { transform: "scale(0 1)" } }, { attr: { transform: "scale(1 1)" }, duration: 0.8, ease: "back.out(2)", stagger: 0.12 }, 0.3);
      const tr = trazar(propaga, { duration: 1.2, stagger: 0.18 });
      if (tr) tl.add(tr, 0.7);
      tl.fromTo($$(".barra-error--calc path", propaga), { attr: { transform: "scale(0 1)" } }, { attr: { transform: "scale(1 1)" }, duration: 1, ease: "elastic.out(1, 0.5)", stagger: 0.25 }, 1.6);
      tl.add(() => {
        gsap.to($$(".barra-error--calc path", propaga), { attr: { transform: "scale(1.22 1)" }, duration: 1.4, ease: "sine.inOut", yoyo: true, repeat: -1, stagger: 0.3 });
        gsap.to($$(".barra-error:not(.barra-error--calc) path", propaga), { attr: { transform: "scale(1.12 1)" }, duration: 1.1, ease: "sine.inOut", yoyo: true, repeat: -1, stagger: 0.2 });
        // la duda "fluye" por los hilos hacia los resultados
        const hilos = $$(".propaga__hilo", propaga);
        hilos.forEach((h) => { h.style.strokeDasharray = "5 7"; });
        gsap.fromTo(hilos, { strokeDashoffset: 0 }, { strokeDashoffset: -24, duration: 0.9, ease: "none", repeat: -1 });
      });
    }

    // 05 · idea central (fijada en pantallas grandes)
    const frase = $("#idea-frase");
    const palabras = frase ? partirPalabras(frase) : [];
    const banda = $("#campana-banda"), curva = $("#campana-curva");
    const largoCurva = curva.getTotalLength();

    const lineaIdea = (scrollTrigger) => {
      gsap.set(curva, { strokeDasharray: largoCurva, strokeDashoffset: largoCurva });
      return gsap.timeline({ scrollTrigger })
        .fromTo(palabras, { yPercent: 70, opacity: 0, rotate: 4 }, { yPercent: 0, opacity: 1, rotate: 0, duration: 1, stagger: 0.18, ease: "power3.out" })
        .to(curva, { strokeDashoffset: 0, duration: 1.4, ease: "power2.inOut" }, "-=0.2")
        .fromTo(banda, { opacity: 0, attr: { transform: "translate(300 0) scale(0 1) translate(-300 0)" } }, { opacity: 1, attr: { transform: "translate(300 0) scale(1 1) translate(-300 0)" }, duration: 1, ease: "power3.out" }, "-=0.5")
        .fromTo(".idea .campana__txt, .idea .campana__centro, #campana-gotas", { opacity: 0 }, { opacity: 1, duration: 0.6 }, "<")
        .fromTo(".idea__texto", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8 }, "-=0.4")
        .fromTo(".factor", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.15, ease: "power3.out" }, "-=0.4");
    };

    const mm = gsap.matchMedia();
    mm.add("(min-width: 900px) and (min-height: 700px)", () => {
      lineaIdea({ trigger: ".idea", start: "top top", end: "+=150%", scrub: 1, pin: ".idea__fijo", anticipatePin: 1 });
    });
    mm.add("(max-width: 899px), (max-height: 699px)", () => {
      lineaIdea({ trigger: ".idea", start: "top 65%" });
    });

    // Recalcular al cargar las fuentes (cambian alturas)
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
    window.addEventListener("load", () => ScrollTrigger.refresh());
    C.alListo(() => setTimeout(() => ScrollTrigger.refresh(), 120));
  };

  /* =======================================================
     Arranque
     ======================================================= */
  dibujarCampana();
  marcarInstrumentos();
  iniciarVernier();
  iniciarCaida();
  iniciarNube();
  iniciarGotas();
  iniciarIndice();
  if (animar) animaciones();
})();
