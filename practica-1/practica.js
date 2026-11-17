/* =========================================================
   Práctica 1 · Error e incertidumbre
   Escala Vernier de la portada, reto de reacción con la regla,
   dibujos que se trazan al hacer scroll y animaciones.
   ========================================================= */
(() => {
  const C = window.Comun || { animar: false, reduce: true, alListo: (f) => f() };
  const animar = C.animar;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const NS = "http://www.w3.org/2000/svg";
  const coma = (n, d = 1) => n.toFixed(d).replace(".", ",");

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
     Reto: atrapa la regla
     ======================================================= */
  const iniciarReto = () => {
    const raiz = $("#reto");
    if (!raiz) return;
    const escena = $("#reto-escena"), regla = $("#reto-regla"), boton = $("#reto-boton");
    const estado = $("#reto-estado"), resultado = $("#reto-resultado");
    const pista = $("#reto-pista"), nota = $("#reto-nota");

    const G = 9.81, LARGO = 30; // m/s², cm
    const MIN = 100, MAX = 350; // escala del historial en ms
    let cm = 16, dedos = 300, fase = "inactivo", inicio = 0, espera = null, cuadro = null;
    let caida = 0, bloqueo = 0;
    const tiempos = [];

    // Números de la regla (0 abajo, 30 arriba)
    for (let i = 0; i <= LARGO; i++) {
      const s = document.createElement("span");
      s.textContent = i;
      s.dataset.cm = i;
      regla.appendChild(s);
    }

    const colocar = () => { regla.style.transform = `translate3d(0, ${(caida * cm).toFixed(2)}px, 0)`; };

    const medir = () => {
      const alto = escena.clientHeight;
      dedos = Math.round(alto * 0.62);
      cm = Math.max(13, Math.min(24, alto / 19));
      escena.style.setProperty("--dedos", `${dedos}px`);
      regla.style.setProperty("--cm", `${cm}px`);
      regla.style.height = `${LARGO * cm}px`;
      regla.style.top = `${dedos - LARGO * cm}px`;
      $$("span", regla).forEach((s) => { s.style.bottom = `${s.dataset.cm * cm}px`; });
      colocar();
    };
    medir();
    if ("ResizeObserver" in window) new ResizeObserver(medir).observe(escena);

    const ponerEstado = (t) => { estado.textContent = t; };

    const preparar = () => {
      if (performance.now() < bloqueo) return;
      clearTimeout(espera); cancelAnimationFrame(cuadro);
      raiz.classList.remove("cerrado");
      resultado.innerHTML = "";
      fase = "esperando";
      boton.disabled = true;
      boton.textContent = "Atento…";
      ponerEstado("Atento… puede caer en cualquier momento");
      const volver = () => { caida = 0; colocar(); };
      // Si se escapó, la regla vuelve a entrar desde arriba.
      if (caida > LARGO) { caida = -(dedos / cm) - 2; colocar(); }
      if (animar && caida !== 0) gsap.to({ v: caida }, { v: 0, duration: 0.5, ease: "power3.out", onUpdate() { caida = this.targets()[0].v; colocar(); } });
      else volver();
      espera = setTimeout(soltar, 1300 + Math.random() * 2400);
    };

    const soltar = () => {
      fase = "cayendo";
      caida = 0;
      inicio = performance.now();
      const caer = () => {
        const t = (performance.now() - inicio) / 1000;
        caida = 0.5 * G * t * t * 100;
        colocar();
        if (fase === "cayendo" && caida > LARGO) escapar();
        if (caida * cm < escena.clientHeight + LARGO * cm && (fase === "cayendo" || fase === "escapo")) {
          cuadro = requestAnimationFrame(caer);
        }
      };
      cuadro = requestAnimationFrame(caer);
    };

    const terminar = () => {
      boton.disabled = false;
      boton.textContent = "Otra vez";
      bloqueo = performance.now() + 450;
    };

    const atrapar = () => {
      const t = (performance.now() - inicio) / 1000;
      cancelAnimationFrame(cuadro);
      caida = Math.min(LARGO, 0.5 * G * t * t * 100);
      colocar();
      fase = "atrapada";
      raiz.classList.add("cerrado");
      const ms = Math.round(t * 1000);
      resultado.innerHTML = `<small>Atrapada a</small><b>${coma(caida)} cm</b><small>≈ ${ms} ms de reacción</small>`;
      ponerEstado("¡Atrapada!");
      registrar(ms);
      terminar();
    };

    const escapar = () => {
      fase = "escapo";
      raiz.classList.add("cerrado");
      resultado.innerHTML = `Se te escapó<small>Cayó más de ${LARGO} cm</small>`;
      ponerEstado("Se escapó");
      terminar();
    };

    const adelantado = () => {
      clearTimeout(espera);
      fase = "inactivo";
      raiz.classList.add("cerrado");
      resultado.innerHTML = `¡Te adelantaste!<small>Espera a que la regla caiga</small>`;
      ponerEstado("Demasiado pronto");
      terminar();
    };

    const registrar = (ms) => {
      tiempos.push(ms);
      if (tiempos.length > 12) tiempos.shift();
      pista.innerHTML = `<em style="left:0">${MIN} ms</em><em style="right:0">${MAX} ms</em>`;
      tiempos.forEach((v, i) => {
        const p = Math.max(0, Math.min(1, (v - MIN) / (MAX - MIN))) * 100;
        const punto = document.createElement("i");
        punto.style.left = `${p}%`;
        if (i === tiempos.length - 1) punto.className = "ultimo";
        pista.appendChild(punto);
      });
      if (tiempos.length === 1) {
        nota.textContent = "Primer intento registrado. Hazlo otra vez y compara: el tiempo cambiará.";
      } else {
        const rango = Math.max(...tiempos) - Math.min(...tiempos);
        nota.textContent = `Llevas ${tiempos.length} intentos. Entre el más rápido y el más lento hay ${rango} ms de diferencia: nadie reacciona igual dos veces.`;
      }
    };

    const accion = () => {
      if (fase === "esperando") adelantado();
      else if (fase === "cayendo") atrapar();
      else preparar();
    };

    boton.addEventListener("click", () => { if (fase !== "esperando" && fase !== "cayendo") preparar(); });
    escena.addEventListener("pointerdown", (e) => { e.preventDefault(); accion(); });
    window.addEventListener("keydown", (e) => {
      if ((e.code === "Space" || e.key === " ") && (fase === "esperando" || fase === "cayendo")) {
        e.preventDefault();
        accion();
      }
    });
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
      tl.fromTo(".portada__titulo .linea > span", { yPercent: 110, y: 0 }, { yPercent: 0, duration: 1.5, stagger: 0.1 })
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
    $$(".hicimos__titulo, .pie__frase").forEach((t) => {
      gsap.fromTo($$(".linea > span", t), { yPercent: 110, y: 0 }, {
        yPercent: 0, duration: 1.4, ease: "expo.out", stagger: 0.12,
        scrollTrigger: { trigger: t, start: "top 82%" },
      });
    });

    // Manifiesto: las palabras se encienden con el scroll
    const manifiesto = $("[data-palabras]");
    if (manifiesto) {
      const palabras = partirPalabras(manifiesto);
      gsap.to(palabras, {
        opacity: 1, ease: "none", stagger: 0.1,
        scrollTrigger: { trigger: manifiesto, start: "top 78%", end: "bottom 42%", scrub: true },
      });
    }

    // Números grandes de capítulo
    $$(".cap .cap__num").forEach((n) => {
      gsap.fromTo(n, { yPercent: 25 }, { yPercent: -25, ease: "none", scrollTrigger: { trigger: n.closest(".cap"), start: "top bottom", end: "bottom top", scrub: true } });
    });

    // 01 · reto
    gsap.from(".reto", { y: 60, opacity: 0, duration: 1.2, ease: "power3.out", scrollTrigger: { trigger: ".reto", start: "top 85%" } });

    // 02 · instrumentos
    $$(".instrumento").forEach((li) => {
      const svg = $("svg", li);
      const tl = gsap.timeline({ scrollTrigger: { trigger: li, start: "top 82%" } });
      const tr = trazar(svg);
      if (tr) tl.add(tr, 0);
      tl.from($$(".instrumento__marcas line", svg), { scaleY: 0, transformOrigin: "50% 0%", duration: 0.5, stagger: 0.01, ease: "power2.out" }, 0.6);
    });

    // 03 · sólidos
    const solidos = $(".solidos");
    if (solidos) {
      const tl = gsap.timeline({ scrollTrigger: { trigger: solidos, start: "top 78%" } });
      $$(".solido svg", solidos).forEach((svg, i) => {
        const tr = trazar(svg, { duration: 1.8 });
        if (tr) tl.add(tr, i * 0.25);
      });
      tl.fromTo($$("[data-cota]", solidos), { opacity: 0 }, { opacity: 1, duration: 0.8, stagger: 0.15 }, 1.4);

      // Retirar el cuerpo y volver a medir
      const n = $("#lecturas-n");
      let lectura = 1;
      const repetir = gsap.timeline({ repeat: -1, repeatDelay: 0.6, paused: true, onRepeat: () => { lectura = (lectura % 5) + 1; n.textContent = lectura; } });
      repetir
        .to($$(".solido svg", solidos), { y: -14, duration: 0.45, ease: "power2.out", stagger: 0.08 })
        .to($$("[data-cota]", solidos), { opacity: 0.15, duration: 0.3 }, 0)
        .to($$(".solido svg", solidos), { y: 0, duration: 0.6, ease: "bounce.out", stagger: 0.08 })
        .to($$("[data-cota]", solidos), { opacity: 1, duration: 0.4 }, "-=0.3");
      ScrollTrigger.create({
        trigger: solidos, start: "top 70%", end: "bottom 10%",
        onToggle: (s) => (s.isActive ? gsap.delayedCall(2.4, () => repetir.play()) : repetir.pause()),
      });
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
        .fromTo(".idea .campana__txt, .idea .campana__centro", { opacity: 0 }, { opacity: 1, duration: 0.6 }, "<")
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
  };

  /* =======================================================
     Arranque
     ======================================================= */
  dibujarCampana();
  marcarInstrumentos();
  iniciarVernier();
  iniciarReto();
  iniciarIndice();
  if (animar) animaciones();
})();
