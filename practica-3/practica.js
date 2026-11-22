/* =========================================================
   Práctica 3 · Cálculo de la gravedad terrestre
   Animaciones propias: un péndulo gigante que invierte los
   colores de la portada, un péndulo de arena que dibuja su
   vaivén, una ola de quince péndulos, un escenario que cambia
   de experimento en cada paso y la Tierra tirando de la masa.
   Los ritmos respetan la física: un hilo más largo oscila más
   despacio, la masa no cambia el ritmo y un ángulo abierto
   lo alarga un poco.
   ========================================================= */
(() => {
  const C = window.Comun || { animar: false, reduce: true, alListo: (f) => f() };
  const animar = !!C.animar;
  const quieto = !!C.reduce; // movimiento reducido: se pinta un cuadro fijo
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const TAU = Math.PI * 2;
  const limitar = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const suave = (v) => { v = limitar(v); return v * v * (3 - 2 * v); };
  const azar = (a, b) => a + Math.random() * (b - a);
  const angosta = () => window.innerWidth < 900;

  const INK = "#15130f";
  const TENUE = "rgba(21,19,15,0.5)";
  const LINEA = "rgba(21,19,15,0.16)";
  const COB = "#2a3cf0";
  const COB_SUAVE = "rgba(42,60,240,0.14)";
  const LAT = "#d9a031";
  const CREMA = "#efeadf";

  /* -------------------------------------------------------
     Un solo bucle de cuadros. También mide la velocidad del
     scroll, que mueve el péndulo y las letras colgantes.
     ------------------------------------------------------- */
  const motor = (() => {
    const tareas = new Set();
    const estado = { vel: 0 };
    let corriendo = false, previo = 0, yPrev = window.scrollY;
    const ciclo = (ms) => {
      if (!tareas.size) { corriendo = false; return; }
      const t = ms / 1000;
      const dt = previo ? limitar(t - previo, 0.001, 0.05) : 1 / 60;
      previo = t;
      const y = window.scrollY;
      estado.vel += ((y - yPrev) / dt - estado.vel) * 0.2;
      yPrev = y;
      tareas.forEach((f) => f(t, dt));
      requestAnimationFrame(ciclo);
    };
    return {
      estado,
      agregar(f) { tareas.add(f); if (!corriendo) { corriendo = true; previo = 0; requestAnimationFrame(ciclo); } },
      quitar(f) { tareas.delete(f); },
    };
  })();

  const enPantalla = (el, jugar, parar) => {
    if (!("IntersectionObserver" in window)) { jugar(); return; }
    new IntersectionObserver(([e]) => (e.isIntersecting ? jugar() : parar()), { rootMargin: "60px 0px" }).observe(el);
  };
  // Corre f mientras el elemento esté en pantalla. Sin movimiento, pinta un cuadro fijo.
  const vivo = (el, f, fijo = 4) => {
    if (quieto) {
      const pintar = () => f(fijo, 0);
      requestAnimationFrame(pintar);
      return pintar;
    }
    enPantalla(el, () => motor.agregar(f), () => motor.quitar(f));
    return null;
  };

  // Canvas nítido en pantallas de alta densidad
  const lienzo = (cv, alMedir) => {
    const o = { cv, ctx: cv.getContext("2d"), w: 1, h: 1, dpr: 1 };
    const medir = () => {
      const r = cv.getBoundingClientRect();
      o.dpr = Math.min(2, window.devicePixelRatio || 1);
      o.w = Math.max(1, r.width);
      o.h = Math.max(1, r.height);
      cv.width = Math.round(o.w * o.dpr);
      cv.height = Math.round(o.h * o.dpr);
      if (alMedir) alMedir();
    };
    medir();
    if ("ResizeObserver" in window) new ResizeObserver(medir).observe(cv);
    else window.addEventListener("resize", medir);
    return o;
  };

  /* -------------------------------------------------------
     Portada: el péndulo gigante. Al bajar, el hilo se alarga
     y el vaivén se vuelve más lento, como en el laboratorio.
     ------------------------------------------------------- */
  const crearPendulo = () => {
    const portada = $(".portada"), pend = $(".pendulo");
    if (!portada || !pend) return;
    const brazo = $(".pendulo__brazo", pend);
    const ecos = $$(".pendulo__eco", pend);
    const st = { fase: 0, A: null, suelto: !animar && !quieto };
    if (animar) C.alListo(() => setTimeout(() => { st.suelto = true; }, 450));
    const T0 = 2.6;
    const pintar = (t, dt) => {
      const h = portada.offsetHeight;
      const L0 = Math.max(160, h * 0.54);
      const L = L0 * (1 + 0.55 * limitar(window.scrollY / h));
      // amplitud que cabe en la pantalla (en celular el vaivén es más corto)
      const Amax = Math.min(0.6, Math.asin(Math.min(1, (0.34 * window.innerWidth) / L0)));
      if (st.A === null) st.A = quieto ? Amax * 0.8 : Amax * 1.7; // empieza sostenido bien arriba
      if (st.suelto) {
        st.fase += (TAU * dt) / (T0 * Math.sqrt(L / L0));
        // scroll rápido = un empujón extra; luego vuelve a su amplitud
        const meta = Amax * (1 + limitar(Math.abs(motor.estado.vel) / 5000) * 0.5);
        st.A += (meta - st.A) * Math.min(1, dt * 0.55);
      }
      const ang = (f) => st.A * Math.cos(f);
      const th = ang(st.fase);
      pend.style.setProperty("--L", L.toFixed(1) + "px");
      brazo.style.transform = `rotate(${((-th * 180) / Math.PI).toFixed(3)}deg)`;
      ecos.forEach((e, k) => {
        const tk = ang(st.fase - (k + 1) * 0.15);
        e.style.transform = `translate(${(L * Math.sin(tk)).toFixed(1)}px, ${(L * Math.cos(tk)).toFixed(1)}px)`;
        e.style.opacity = st.suelto ? [0.13, 0.07, 0.035][k] : 0;
      });
    };
    const fijo = vivo(portada, pintar, 0);
    if (fijo) window.addEventListener("resize", fijo);
  };

  /* -------------------------------------------------------
     Título: un péndulo con arena dibuja su recorrido
     (dos vaivenes cruzados que se apagan poco a poco)
     ------------------------------------------------------- */
  const crearArena = () => {
    const cv = $("#arena");
    if (!cv) return;
    let repintar = null;
    const lz = lienzo(cv, () => repintar && repintar());
    const PASO = 0.015, VEL = 1.2;
    let par, pts, ts, desv, borrando;
    const nuevo = () => {
      const p = () => azar(0, TAU), d = () => azar(-0.014, 0.014);
      const [fa, fb] = Math.random() < 0.5 ? [2, 3] : [3, 2];
      par = { f: [fa + d(), fb + d(), fb + d(), fa + d()], p: [p(), p(), p(), p()], a: azar(0.5, 0.75) };
      pts = []; ts = 0; desv = 1; borrando = false;
    };
    const punto = (t) => {
      const e1 = Math.exp(-0.02 * t), e2 = Math.exp(-0.016 * t), { f, p, a } = par;
      return [
        (Math.sin(f[0] * t + p[0]) * e1 + a * Math.sin(f[1] * t + p[1]) * e2) / (1 + a),
        (Math.sin(f[2] * t + p[2]) * e1 + a * Math.sin(f[3] * t + p[3]) * e2) / (1 + a),
      ];
    };
    const avanzar = (hasta) => { while (ts < hasta) { pts.push(punto(ts)); ts += PASO; } };
    nuevo();
    let tSim = 0;
    const pintar = (t, dt) => {
      if (quieto) { if (!pts.length) avanzar(70); }
      else if (!borrando) {
        tSim += dt * VEL;
        avanzar(tSim);
        if (Math.exp(-0.02 * ts) < 0.16) borrando = true;
      } else {
        desv -= dt / 1.4;
        if (desv <= 0) { nuevo(); tSim = 0; }
      }
      const { ctx, w, h, dpr } = lz;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      if (pts.length < 2) return;
      const R = Math.min(w, h) * 0.42, cx = w * 0.52, cy = h * 0.5;
      const X = (q) => cx + q[0] * R, Y = (q) => cy + q[1] * R;
      ctx.lineJoin = "round";
      ctx.globalAlpha = 0.42 * Math.max(0, desv);
      ctx.strokeStyle = COB;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(X(pts[0]), Y(pts[0]));
      for (let i = 1; i < pts.length; i++) ctx.lineTo(X(pts[i]), Y(pts[i]));
      ctx.stroke();
      // la punta, donde cae la arena ahora
      const n = pts.length, ini = Math.max(0, n - 50);
      ctx.globalAlpha = Math.max(0, desv);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(X(pts[ini]), Y(pts[ini]));
      for (let i = ini + 1; i < n; i++) ctx.lineTo(X(pts[i]), Y(pts[i]));
      ctx.stroke();
      const q = pts[n - 1];
      ctx.fillStyle = COB;
      ctx.beginPath(); ctx.arc(X(q), Y(q), 5, 0, TAU); ctx.fill();
      ctx.strokeStyle = COB; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(X(q), Y(q), 11 + 3 * Math.sin(t * 4), 0, TAU); ctx.stroke();
      ctx.globalAlpha = 1;
    };
    repintar = vivo($(".practica"), pintar, 0);
  };

  /* -------------------------------------------------------
     Lo que hicimos: ola de quince péndulos. Cada uno da una
     oscilación más que el anterior en el mismo tiempo, así que
     se desfasan, dibujan ondas y vuelven a juntarse.
     ------------------------------------------------------- */
  const crearOla = () => {
    const cv = $("#ola-pendulos");
    if (!cv) return;
    let repintar = null;
    const lz = lienzo(cv, () => repintar && repintar());
    const CICLO = 40, N0 = 20;
    const pintar = (t) => {
      const { ctx, w, h, dpr } = lz;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const chica = w < 700;
      const N = chica ? 11 : 15;
      const margen = chica ? 28 : Math.max(60, w * 0.06);
      const paso = (w - 2 * margen) / (N - 1);
      const Lmin = h * (chica ? 0.64 : 0.52), Lmax = h * 0.86;
      const A = chica ? 0.05 : 0.085;
      const Tmax = CICLO / N0, Tmin = CICLO / (N0 + N - 1);
      const pts = [];
      for (let i = 0; i < N; i++) {
        const T = CICLO / (N0 + i);
        // largo proporcional al cuadrado del periodo, ajustado a la pantalla
        const L = Lmin + (Lmax - Lmin) * ((T * T - Tmin * Tmin) / (Tmax * Tmax - Tmin * Tmin));
        const th = A * Math.cos((TAU * t) / T);
        const x0 = margen + i * paso;
        pts.push([x0 + L * Math.sin(th), L * Math.cos(th), th / A, x0]);
      }
      ctx.strokeStyle = "rgba(239,234,223,0.13)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      pts.forEach(([x, y, , x0]) => { ctx.moveTo(x0, 0); ctx.lineTo(x, y); });
      ctx.stroke();
      // curva que une las masas: hace visible la ola
      ctx.strokeStyle = "rgba(143,156,255,0.55)";
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length - 1; i++) {
        const xm = (pts[i][0] + pts[i + 1][0]) / 2, ym = (pts[i][1] + pts[i + 1][1]) / 2;
        ctx.quadraticCurveTo(pts[i][0], pts[i][1], xm, ym);
      }
      ctx.lineTo(pts[N - 1][0], pts[N - 1][1]);
      ctx.stroke();
      const r = chica ? 6 : 9;
      pts.forEach(([x, y, f]) => {
        const u = (f + 1) / 2; // de crema a lila según el lado hacia el que va
        ctx.fillStyle = `rgb(${Math.round(239 - 96 * u)},${Math.round(234 - 78 * u)},${Math.round(223 + 32 * u)})`;
        ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
      });
    };
    repintar = vivo($(".hicimos"), pintar, 7);
  };

  /* -------------------------------------------------------
     Escenario: un lienzo fijo que cambia de experimento
     según el paso que se está leyendo
     ------------------------------------------------------- */
  const crearEscenario = () => {
    const cont = $("#pasos"), cv = $("#escenario");
    if (!cont || !cv) return;
    const pasos = $$(".paso", cont);
    const num = $("#esc-num"), nombre = $("#esc-nombre"), segs = $$(".escenario__barra i");
    let repintar = null;
    const lz = lienzo(cv, () => repintar && repintar());
    const E = { actual: -1, previa: -1, mezcla: 1, entrada: pasos.map(() => 0), prog: pasos.map(() => 0) };
    let ctx = lz.ctx, base = 1, px = 1;

    /* ---- herramientas de dibujo (espacio virtual de 600 × 700) ---- */
    const al = (a) => { ctx.globalAlpha = base * limitar(a); };
    const trazo = (color, lw = 1.5) => { ctx.strokeStyle = color; ctx.lineWidth = lw * px; };
    const linea = (x1, y1, x2, y2, color = INK, lw = 1.5, guiones) => {
      ctx.beginPath();
      ctx.setLineDash(guiones ? guiones.map((g) => g * px) : []);
      ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
      trazo(color, lw); ctx.stroke();
      ctx.setLineDash([]);
    };
    const texto = (str, x, y, o = {}) => {
      const { color = TENUE, tam = 10.5, alin = "left", tit = false, rot = 0 } = o;
      ctx.save();
      ctx.translate(x, y);
      if (rot) ctx.rotate(rot);
      ctx.fillStyle = color;
      ctx.textAlign = alin;
      ctx.textBaseline = "alphabetic";
      if (tit) {
        ctx.font = `800 ${tam}px Archivo, "Arial Narrow", sans-serif`;
        ctx.fillText(str, 0, 0);
      } else {
        // las etiquetas escalan con el dibujo, pero nunca bajan de 9 px reales
        ctx.font = `400 ${Math.max(tam, 9 * px)}px "JetBrains Mono", Consolas, monospace`;
        ctx.fillText(str.toUpperCase(), 0, 0);
      }
      ctx.restore();
    };
    const caja = (x, y, w, h, r, color) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h);
      ctx.fill();
    };
    const bola = (x, y, r, color = COB) => {
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
      const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.05, x - r * 0.35, y - r * 0.4, r);
      g.addColorStop(0, "rgba(255,255,255,0.5)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    };
    const pendulo = (x0, y0, L, th, r, color = COB) => {
      const x = x0 + L * Math.sin(th), y = y0 + L * Math.cos(th);
      linea(x0, y0, x, y, INK, 1.3);
      bola(x, y, r, color);
      return [x, y];
    };
    const recorrido = (x0, y0, L, A, color = LINEA) => {
      ctx.beginPath();
      ctx.setLineDash([3 * px, 5 * px]);
      ctx.arc(x0, y0, L, Math.PI / 2 - A, Math.PI / 2 + A);
      trazo(color, 1.2); ctx.stroke();
      ctx.setLineDash([]);
    };
    const techo = (x1, x2, y) => {
      ctx.fillStyle = INK;
      ctx.fillRect(x1, y - 6, x2 - x1, 6);
      ctx.beginPath();
      for (let x = x1 + 4; x < x2 - 6; x += 12) { ctx.moveTo(x, y - 6); ctx.lineTo(x + 8, y - 16); }
      trazo(TENUE, 1); ctx.stroke();
    };
    const eje = (x, y) => { ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(x, y, 4, 0, TAU); ctx.fill(); };
    const cuna = (x, y, r, A, relleno, borde, lw = 2) => {
      ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, r, Math.PI / 2 - A, Math.PI / 2); ctx.closePath();
      ctx.fillStyle = relleno; ctx.fill();
      ctx.beginPath(); ctx.arc(x, y, r, Math.PI / 2 - A, Math.PI / 2); trazo(borde, lw); ctx.stroke();
    };

    /* ---- 01 · Armar el péndulo ---- */
    const armar = (tau) => {
      const X = 280, Y = 100, L = 400, A = 0.2;
      // soporte universal: base, varilla, nuez y brazo
      caja(48, 636, 290, 16, 4, INK);
      ctx.fillStyle = INK;
      ctx.fillRect(84, 70, 10, 568);
      ctx.fillRect(84, 94, X - 84 + 4, 7);
      caja(76, 86, 26, 24, 3, INK);
      texto("soporte universal", 48, 678);
      // transportador
      ctx.beginPath(); ctx.moveTo(X + 110, Y); ctx.arc(X, Y, 110, 0, Math.PI); ctx.closePath();
      ctx.fillStyle = "rgba(21,19,15,0.035)"; ctx.fill(); trazo(LINEA, 1.2); ctx.stroke();
      ctx.beginPath();
      for (let g = 0; g <= 180; g += 5) {
        const a = (g * Math.PI) / 180, r1 = g % 30 === 0 ? 92 : g % 10 === 0 ? 99 : 104;
        ctx.moveTo(X + Math.cos(a) * r1, Y + Math.sin(a) * r1);
        ctx.lineTo(X + Math.cos(a) * 110, Y + Math.sin(a) * 110);
      }
      trazo(TENUE, 1); ctx.stroke();
      texto("transportador", X + 116, Y + 24);
      // ángulo desde el que se suelta
      cuna(X, Y, 84, A, COB_SUAVE, COB);
      linea(X, Y, X, Y + L + 34, LINEA, 1, [2, 4]);
      texto("ángulo", X + 22, Y + 150, { color: COB });
      // cinta métrica que se desenrolla
      const e = quieto ? 1 : suave(tau / 2.4);
      const TX = 500, largo = L * e;
      ctx.fillStyle = LAT; ctx.fillRect(TX, Y, 18, largo);
      ctx.beginPath();
      for (let k = 0; k <= largo; k += 10) { ctx.moveTo(TX, Y + k); ctx.lineTo(TX + (k % 50 === 0 ? 10 : 5), Y + k); }
      trazo(INK, 1); ctx.stroke();
      caja(TX - 12, Y + largo, 42, 34, 6, INK);
      ctx.fillStyle = CREMA; ctx.beginPath(); ctx.arc(TX + 9, Y + largo + 17, 6, 0, TAU); ctx.fill();
      texto("cinta métrica", TX + 9, Y + largo + 56, { alin: "center" });
      al(suave((e - 0.8) / 0.2));
      linea(X + 6, Y, TX, Y, TENUE, 1, [3, 4]);
      linea(X + 30, Y + L, TX, Y + L, TENUE, 1, [3, 4]);
      texto("largo del hilo", TX + 44, Y + L / 2, { rot: -Math.PI / 2, alin: "center", color: INK });
      al(1);
      // el péndulo
      const th = A * Math.cos((TAU * tau) / 1.8);
      eje(X, Y);
      const [bx, by] = pendulo(X, Y, L, th, 24);
      texto("hilo", X + L * 0.62 * Math.sin(th) - 14, Y + L * 0.62, { alin: "right" });
      texto("masa", bx - 34, by + 4, { color: INK, alin: "right" });
    };

    /* ---- 02 · Medir el periodo: diez oscilaciones, cinco veces ---- */
    const periodo = (tau) => {
      const X = 180, Y = 100, L = 380, T = 1.7, A = 0.24;
      techo(110, 250, Y);
      eje(X, Y);
      recorrido(X, Y, L, A);
      const th = A * Math.cos((TAU * tau) / T);
      pendulo(X, Y, L, th, 22);
      texto("punto de partida", X + L * Math.sin(A), Y + L * Math.cos(A) + 48, { alin: "center" });

      const n = Math.floor(tau / T), k = n % 10, rep = Math.floor(n / 10) % 5, frac = (tau % T) / T;
      const CX = 440, CY = 290, R = 92;
      // cronómetro
      ctx.fillStyle = INK;
      ctx.fillRect(CX - 10, CY - R - 26, 20, 12);
      ctx.fillRect(CX - 3, CY - R - 16, 6, 10);
      ctx.beginPath(); ctx.arc(CX, CY, R + 8, 0, TAU); trazo(INK, 3); ctx.stroke();
      for (let i = 0; i < 10; i++) {
        const a0 = -Math.PI / 2 + (i * TAU) / 10 + 0.05, a1 = a0 + TAU / 10 - 0.1;
        ctx.beginPath(); ctx.arc(CX, CY, R - 8, a0, a1); trazo(LINEA, 10); ctx.stroke();
        const f = i < k ? 1 : i === k ? frac : 0;
        if (f > 0) { ctx.beginPath(); ctx.arc(CX, CY, R - 8, a0, a0 + (a1 - a0) * f); trazo(COB, 10); ctx.stroke(); }
      }
      // destello al completar una oscilación
      if (!quieto && frac < 0.12) {
        al(1 - frac / 0.12);
        ctx.beginPath(); ctx.arc(CX, CY, R + 8 + 10 * (frac / 0.12), 0, TAU); trazo(COB, 2); ctx.stroke();
        al(1);
      }
      texto(String(k + 1).padStart(2, "0"), CX, CY + 18, { tit: true, tam: 54, color: INK, alin: "center" });
      texto("de 10", CX, CY + 44, { alin: "center" });
      texto("repeticiones", CX, CY + R + 58, { alin: "center" });
      for (let i = 0; i < 5; i++) {
        const x = CX - 64 + i * 32, y = CY + R + 84;
        ctx.beginPath(); ctx.arc(x, y, 8, 0, TAU);
        if (i < rep) { ctx.fillStyle = INK; ctx.fill(); }
        else if (i === rep) { ctx.fillStyle = COB_SUAVE; ctx.fill(); trazo(COB, 1.5 + Math.abs(Math.sin(tau * 3))); ctx.stroke(); }
        else { trazo(LINEA, 1.5); ctx.stroke(); }
      }
    };

    /* ---- 03 · Cambiar el largo: tres hilos, tres ritmos ---- */
    const LARGOS = [[150, 150, "corto"], [300, 300, "medio"], [450, 480, "largo"]];
    const periodoDe = (L) => 0.95 * Math.sqrt(L / 150);
    const largo = (tau) => {
      const Y = 80, A = 0.2;
      techo(60, 540, Y);
      LARGOS.forEach(([x, L, nom]) => {
        eje(x, Y);
        recorrido(x, Y, L, A);
        pendulo(x, Y, L, A * Math.cos((TAU * tau) / periodoDe(L)), 18);
        texto(nom, x, Y + L + 46, { alin: "center", color: INK });
      });
      // registro: una marca cada vez que pasa por el centro
      const x0 = 110, x1 = 560, vel = 62;
      texto("cada marca: pasa por el centro", x0, 614);
      LARGOS.forEach(([, L, nom], i) => {
        const y = 638 + i * 22, T = periodoDe(L);
        texto(nom, 40, y + 4);
        linea(x0, y, x1, y, LINEA, 1);
        ctx.beginPath();
        const mMax = Math.floor((tau - T / 4) / (T / 2));
        for (let m = mMax; m >= 0; m--) {
          const xx = x1 - (tau - (T / 4 + (m * T) / 2)) * vel;
          if (xx < x0) break;
          ctx.moveTo(xx, y - 6); ctx.lineTo(xx, y + 6);
        }
        trazo(COB, 2); ctx.stroke();
      });
    };

    /* ---- 04 · De las oscilaciones a la gravedad: la recta ---- */
    const grafica = (tau) => {
      const OX = 100, OY = 540, X1 = 560, Y1 = 110;
      ctx.beginPath();
      for (let x = OX + 92; x < X1; x += 92) { ctx.moveTo(x, OY); ctx.lineTo(x, Y1); }
      for (let y = OY - 86; y > Y1; y -= 86) { ctx.moveTo(OX, y); ctx.lineTo(X1, y); }
      trazo("rgba(21,19,15,0.07)", 1); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(OX, Y1 - 10); ctx.lineTo(OX, OY); ctx.lineTo(X1 + 10, OY);
      ctx.moveTo(X1 + 2, OY - 6); ctx.lineTo(X1 + 12, OY); ctx.lineTo(X1 + 2, OY + 6);
      ctx.moveTo(OX - 6, Y1 - 2); ctx.lineTo(OX, Y1 - 12); ctx.lineTo(OX + 6, Y1 - 2);
      trazo(INK, 1.6); ctx.stroke();
      texto("longitud del hilo", X1 + 10, OY + 30, { alin: "right" });
      texto("periodo al cuadrado", OX + 14, Y1 - 4);

      const r = quieto ? 1 : limitar(tau / 3.6);
      const yl = (x) => OY - (x - OX);
      const xs = [OX + 130, OX + 260, OX + 390], ruido = [8, -7, 5];
      xs.forEach((x, i) => {
        const e = suave((r - 0.06 - i * 0.13) / 0.16);
        if (e <= 0) return;
        const y = yl(x) + ruido[i] - 50 * (1 - e);
        al(e);
        linea(x, y, x, OY, LINEA, 1, [2, 4]);
        linea(OX, y, x, y, LINEA, 1, [2, 4]);
        ctx.fillStyle = COB_SUAVE;
        ctx.beginPath(); ctx.arc(x, y, 14 + 4 * Math.sin(tau * 2.2 + i * 2), 0, TAU); ctx.fill();
        ctx.fillStyle = INK;
        ctx.beginPath(); ctx.arc(x, y, 6.5, 0, TAU); ctx.fill();
        al(1);
      });
      const eL = suave((r - 0.5) / 0.3), xFin = X1 - 30;
      if (eL > 0) linea(OX, OY, OX + (xFin - OX) * eL, yl(OX + (xFin - OX) * eL), COB, 3);
      // un pulso recorre la recta sin parar
      if (eL >= 1 && !quieto) {
        const f = (tau % 2.6) / 2.6, x = OX + (xFin - OX) * f;
        al(Math.sin(f * Math.PI));
        ctx.fillStyle = COB; ctx.beginPath(); ctx.arc(x, yl(x), 6, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.arc(x, yl(x), 13, 0, TAU); trazo(COB, 1.2); ctx.stroke();
        al(1);
      }
      const eT = suave((r - 0.78) / 0.14);
      if (eT > 0) {
        al(eT);
        const a = OX + 170, b = OX + 300;
        linea(a, yl(a), b, yl(a), INK, 1.2, [4, 4]);
        linea(b, yl(a), b, yl(b), INK, 1.2, [4, 4]);
        texto("inclinación", b + 12, (yl(a) + yl(b)) / 2 + 4, { color: INK });
        al(1);
      }
      // la gravedad obtenida queda junto al valor real
      const eG = suave((r - 0.88) / 0.12);
      if (eG > 0) {
        al(eG);
        const g0 = 170, g1 = 550, gy = 646, real = 360;
        texto("gravedad", g0 - 14, gy + 4, { alin: "right", color: INK });
        linea(g0, gy, g1, gy, INK, 1.4);
        ctx.beginPath();
        for (let x = g0; x <= g1; x += 19) { ctx.moveTo(x, gy); ctx.lineTo(x, gy - ((x - g0) % 95 === 0 ? 10 : 5)); }
        trazo(TENUE, 1); ctx.stroke();
        linea(real, gy - 20, real, gy + 10, INK, 2.4);
        texto("valor real", real, gy + 30, { alin: "center", color: INK });
        const nx = real - 9 + 3 * Math.sin(tau * 1.4);
        ctx.fillStyle = COB_SUAVE; ctx.fillRect(nx - 14, gy - 18, 28, 18);
        ctx.fillStyle = COB;
        ctx.beginPath(); ctx.moveTo(nx, gy - 2); ctx.lineTo(nx - 7, gy - 14); ctx.lineTo(nx + 7, gy - 14); ctx.closePath(); ctx.fill();
        texto("nuestro valor", nx, gy - 26, { alin: "center", color: COB });
        al(1);
      }
    };

    /* ---- 05 · Cambiar la masa: liviana y pesada, mismo ritmo ---- */
    const masa = (tau) => {
      const Y = 100, L = 410, T = 1.8, A = 0.22;
      techo(110, 490, Y);
      texto("mismo largo de hilo", 300, Y - 30, { alin: "center", color: INK });
      const th = A * Math.cos((TAU * tau) / T);
      [210, 390].forEach((x) => { eje(x, Y); recorrido(x, Y, L, A); });
      const p1 = pendulo(210, Y, L, th, 13, COB);
      const p2 = pendulo(390, Y, L, th, 40, INK);
      linea(p1[0] + 18, p1[1], p2[0] - 46, p2[1], COB, 1.4, [5, 5]);
      texto("mismo ritmo", (p1[0] + p2[0]) / 2 - 12, p1[1] - 14, { alin: "center", color: COB });
      texto("liviana", 210, Y + L + 76, { alin: "center", color: INK });
      texto("mucho más pesada", 390, Y + L + 76, { alin: "center", color: INK });
      [["liviana", COB], ["pesada", INK]].forEach(([nom, col], i) => {
        const y = 640 + i * 26;
        texto(nom, 40, y + 4);
        linea(140, y, 540, y, LINEA, 1);
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.arc(340 + 190 * (Math.sin(th) / Math.sin(A)), y, 6, 0, TAU); ctx.fill();
      });
    };

    /* ---- 06 · Cambiar el ángulo: una carrera de diez oscilaciones ---- */
    const angulo = (tau) => {
      const X = 300, Y = 100, L = 340, Ts = 1.7, As = 0.17, Ab = 0.95;
      // un ángulo abierto alarga el periodo (corrección para amplitudes grandes)
      const Tb = Ts * (1 + (Ab * Ab) / 16 + (11 * Ab ** 4) / 3072);
      techo(220, 380, Y);
      cuna(X, Y, 70, Ab, "rgba(21,19,15,0.06)", INK, 1.5);
      cuna(X, Y, 112, As, COB_SUAVE, COB);
      recorrido(X, Y, L, Ab);
      recorrido(X, Y, L, As, "rgba(42,60,240,0.4)");
      texto("ángulo abierto", X - L * Math.sin(Ab), Y + L * Math.cos(Ab) - 34, { color: INK });
      texto("ángulo pequeño", X + L * Math.sin(As) + 30, Y + L * Math.cos(As) + 4, { color: COB });
      eje(X, Y);
      pendulo(X, Y, L, Ab * Math.cos((TAU * tau) / Tb), 20, INK);
      pendulo(X, Y, L, As * Math.cos((TAU * tau) / Ts), 20, COB);
      // la carrera se reinicia cuando los dos vuelven a ir al mismo paso
      const B = (Ts * Tb) / (Tb - Ts), c = tau % B;
      const fin = quieto ? 1 : 1 - suave((c - (B - 2)) / 2);
      texto("carrera de 10 oscilaciones", 40, 600, { color: INK });
      [["pequeño", Ts, COB], ["abierto", Tb, INK]].forEach(([nom, T, col], i) => {
        const y = 628 + i * 30, n = Math.min(10, (quieto ? 17.5 : c) / T);
        texto(nom, 40, y + 4);
        ctx.fillStyle = LINEA; ctx.fillRect(140, y - 5, 380, 10);
        al(fin);
        ctx.fillStyle = col; ctx.fillRect(140, y - 5, (380 * n) / 10, 10);
        texto(String(Math.floor(n)).padStart(2, "0"), 562, y + 4, { alin: "right", color: INK });
        al(1);
      });
      if ((quieto ? 17.5 : c) / Ts >= 10) {
        al(fin);
        texto("el abierto tarda más", 562, 600, { alin: "right", color: COB });
        al(1);
      }
    };

    const ESCENAS = [armar, periodo, largo, grafica, masa, angulo];

    // El paso activo es el que cruza la línea de lectura
    const elegir = () => {
      const lineaLectura = window.innerHeight * (angosta() ? 0.74 : 0.5);
      let elegido = 0;
      pasos.forEach((p, i) => {
        const r = p.getBoundingClientRect();
        if (r.top <= lineaLectura) elegido = i;
        E.prog[i] = limitar((lineaLectura - r.top) / Math.max(1, r.height));
      });
      return elegido;
    };
    const activar = (i, t) => {
      if (i === E.actual) return;
      E.previa = E.actual;
      E.actual = i;
      E.mezcla = E.previa < 0 || quieto ? 1 : 0;
      E.entrada[i] = t;
      if (num) num.textContent = String(i + 1).padStart(2, "0");
      if (nombre) nombre.textContent = pasos[i].dataset.nombre || "";
      segs.forEach((s, k) => { s.classList.toggle("activo", k === i); s.classList.toggle("hecho", k < i); });
    };
    const pintar = (t, dt) => {
      activar(elegir(), t);
      if (E.mezcla < 1) E.mezcla = Math.min(1, E.mezcla + dt / 0.55);
      const { w, h, dpr } = lz;
      ctx = lz.ctx;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const s = Math.min(w / 600, h / 700);
      px = 1 / s;
      const ox = (w - 600 * s) / 2, oy = (h - 700 * s) / 2;
      const una = (i, a) => {
        if (i < 0 || a <= 0.01) return;
        ctx.save();
        ctx.setTransform(dpr * s, 0, 0, dpr * s, dpr * ox, dpr * oy);
        base = a;
        ctx.globalAlpha = a;
        ESCENAS[i](quieto ? 6 : t - E.entrada[i], E.prog[i]);
        ctx.restore();
      };
      if (E.mezcla < 1) una(E.previa, 1 - E.mezcla);
      una(E.actual, E.mezcla);
    };
    repintar = vivo(cont, pintar, 0);
    if (repintar) window.addEventListener("scroll", repintar, { passive: true });
  };

  /* -------------------------------------------------------
     Idea central: la Tierra tira de la masa del péndulo
     ------------------------------------------------------- */
  const crearTierra = () => {
    const cv = $("#tierra");
    if (!cv) return;
    let repintar = null;
    const lz = lienzo(cv, () => repintar && repintar());
    const estrellas = Array.from({ length: 70 }, () => [Math.random(), Math.random(), azar(0.6, 1.6), azar(0, TAU)]);
    const pintar = (t) => {
      const { ctx, w, h, dpr } = lz;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const ancho = w >= 900;
      const R = ancho ? h * 0.8 : w * 0.95;
      const cx = ancho ? w * 0.8 : w * 0.5;
      const cy = ancho ? h + R * 0.42 : h + R * 0.62;
      const cima = cy - R;
      estrellas.forEach(([x, y, r, f]) => {
        ctx.globalAlpha = 0.2 + 0.45 * Math.sin(t * 1.1 + f) ** 2;
        ctx.fillStyle = CREMA;
        ctx.beginPath(); ctx.arc(x * w, y * cima, r, 0, TAU); ctx.fill();
      });
      ctx.globalAlpha = 1;
      // el planeta, con meridianos que giran despacio
      ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU);
      ctx.fillStyle = "#1e2dd0"; ctx.fill();
      ctx.clip();
      ctx.strokeStyle = "rgba(239,234,223,0.18)";
      ctx.lineWidth = 1;
      for (let i = 1; i < 7; i++) {
        const lat = (i / 7) * (Math.PI / 2), y = cy - R * Math.sin(lat), mitad = R * Math.cos(lat);
        ctx.beginPath(); ctx.ellipse(cx, y, mitad, mitad * 0.1, 0, 0, TAU); ctx.stroke();
      }
      for (let i = 0; i < 12; i++) {
        const lon = (i / 12) * Math.PI + t * 0.06;
        ctx.beginPath(); ctx.ellipse(cx, cy, R * Math.abs(Math.cos(lon)), R, 0, 0, TAU); ctx.stroke();
      }
      ctx.restore();
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU);
      ctx.strokeStyle = "rgba(239,234,223,0.6)"; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, R + 14, 0, TAU);
      ctx.strokeStyle = "rgba(239,234,223,0.12)"; ctx.lineWidth = 10; ctx.stroke();

      // el péndulo sobre la Tierra
      const y0 = ancho ? 0 : Math.max(0, cima - 200);
      const L = Math.max(70, cima - y0 - (ancho ? Math.min(110, h * 0.12) : 80));
      const th = 0.3 * Math.cos((TAU * t) / (2.2 * Math.sqrt(L / 400)));
      const bx = cx + L * Math.sin(th), by = y0 + L * Math.cos(th);
      if (!ancho) { ctx.fillStyle = CREMA; ctx.fillRect(cx - 30, y0 - 5, 60, 5); }
      ctx.strokeStyle = CREMA; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(cx, y0); ctx.lineTo(bx, by); ctx.stroke();
      // la gravedad apunta siempre hacia el centro de la Tierra
      const dx = cx - bx, dy = cy - by, d = Math.hypot(dx, dy), ux = dx / d, uy = dy / d;
      const r0 = 30, largoFlecha = 64 + 10 * Math.sin(t * 2.4);
      const fx = bx + ux * (r0 + largoFlecha), fy = by + uy * (r0 + largoFlecha);
      ctx.setLineDash([4, 6]);
      ctx.strokeStyle = "rgba(242,193,78,0.4)"; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(cx, cy); ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = "#f2c14e"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(bx + ux * r0, by + uy * r0); ctx.lineTo(fx, fy); ctx.stroke();
      ctx.fillStyle = "#f2c14e";
      ctx.beginPath();
      ctx.moveTo(fx + ux * 12, fy + uy * 12);
      ctx.lineTo(fx - uy * 8, fy + ux * 8);
      ctx.lineTo(fx + uy * 8, fy - ux * 8);
      ctx.closePath(); ctx.fill();
      ctx.font = '500 11px "JetBrains Mono", monospace';
      ctx.textAlign = "left";
      ctx.fillText("GRAVEDAD", fx + 18, fy - 2);
      ctx.fillStyle = CREMA;
      ctx.beginPath(); ctx.arc(bx, by, 22, 0, TAU); ctx.fill();
      ctx.fillStyle = CREMA;
      ctx.beginPath(); ctx.arc(cx, y0, 4, 0, TAU); ctx.fill();
    };
    repintar = vivo($(".idea"), pintar, 2);
  };

  /* -------------------------------------------------------
     Letras que cuelgan: cada letra se mece desde un punto
     por encima de ella
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
        s.style.setProperty("--k", azar(0.55, 1.45).toFixed(2));
        const n = document.createElement("span");
        n.className = "ch__in";
        n.textContent = c;
        s.appendChild(n);
        w.appendChild(s);
        letras.push(n);
      });
      el.appendChild(w);
      if (i < palabras.length - 1) el.appendChild(document.createTextNode(" "));
    });
    return letras;
  };

  // Un oscilador amortiguado: el scroll empuja las letras y ellas vuelven solas.
  const crearVaiven = (titulos) => {
    const visibles = new Set();
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) visibles.add(e.target);
      else { visibles.delete(e.target); e.target.style.setProperty("--vaiven", "0"); }
    }));
    titulos.forEach((el) => io.observe(el));
    const o = { th: 0, w: 0 };
    const om = TAU / 1.5, z = 0.14;
    motor.agregar((t, dt) => {
      const meta = limitar(-motor.estado.vel * 0.003, -8, 8) + 0.9 * Math.sin(t * 1.7);
      o.w += (-om * om * (o.th - meta) - 2 * z * om * o.w) * dt;
      o.th += o.w * dt;
      const v = o.th.toFixed(2);
      visibles.forEach((el) => el.style.setProperty("--vaiven", v));
    });
  };

  /* =======================================================
     GSAP + ScrollTrigger
     ======================================================= */
  const animaciones = () => {
    const titulos = $$("[data-cuelga]");
    // Portada: las letras del nombre caen colgando y se asientan como péndulos
    const nombre = $(".portada__nombre");
    const letrasNombre = partirLetras(nombre);
    gsap.set(nombre, { opacity: 1 });
    gsap.set(letrasNombre, { rotate: () => azar(-75, 75), opacity: 0 });
    C.alListo(() => {
      gsap.timeline()
        .to(letrasNombre, { rotate: 0, duration: 2.6, ease: "elastic.out(1, 0.28)", stagger: { each: 0.045, from: "center" } }, 0)
        .to(letrasNombre, { opacity: 1, duration: 0.5, ease: "power1.out", stagger: { each: 0.045, from: "center" } }, 0)
        .to(".portada [data-sube]", { opacity: 1, y: 0, duration: 1, ease: "power3.out", stagger: 0.08 }, 0.35);
    });

    titulos.filter((el) => el !== nombre).forEach((el) => {
      const letras = partirLetras(el);
      gsap.set(el, { opacity: 1 });
      gsap.set(letras, { rotate: () => azar(-65, 65), opacity: 0 });
      gsap.timeline({ scrollTrigger: { trigger: el, start: "top 88%" } })
        .to(letras, { rotate: 0, duration: 2.3, ease: "elastic.out(1, 0.3)", stagger: 0.022 }, 0)
        .to(letras, { opacity: 1, duration: 0.45, ease: "power1.out", stagger: 0.022 }, 0);
    });
    crearVaiven(titulos);

    $$("[data-sube]").filter((el) => !el.closest(".portada")).forEach((el) => {
      gsap.to(el, { opacity: 1, y: 0, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 90%" } });
    });

    // Portada: al bajar, el nombre se aleja despacio
    const salida = { trigger: ".portada", start: "top top", end: "bottom top", scrub: true };
    gsap.to(".portada__centro", { y: 120, opacity: 0.15, ease: "none", scrollTrigger: salida });
    gsap.to(".portada__pie", { opacity: 0, ease: "none", scrollTrigger: { ...salida, end: "30% top" } });

    // Parallax suave en los dibujos de fondo
    gsap.fromTo("#arena", { yPercent: 8 }, { yPercent: -8, ease: "none", scrollTrigger: { trigger: ".practica", start: "top bottom", end: "bottom top", scrub: true } });
    gsap.fromTo(".hicimos__cab", { y: 40 }, { y: -40, ease: "none", scrollTrigger: { trigger: ".hicimos", start: "top bottom", end: "bottom top", scrub: true } });
    gsap.fromTo(".idea__texto", { y: 50 }, { y: -30, ease: "none", scrollTrigger: { trigger: ".idea", start: "top bottom", end: "bottom top", scrub: true } });

    // Imán suave entre secciones (pantallas de computador): si el scroll se detiene
    // cerca del comienzo de una sección, termina de llevarla a pantalla completa.
    if (C.lenis && window.matchMedia) {
      const pantallaAncha = window.matchMedia("(min-width: 900px) and (min-height: 640px)");
      const anclas = () => [$(".portada"), $(".practica"), $(".hicimos"), ...$$(".paso"), $(".idea"), $(".pie3")]
        .filter(Boolean)
        .map((el) => el.getBoundingClientRect().top + window.scrollY);
      let espera = null;
      C.lenis.on("scroll", () => {
        clearTimeout(espera);
        espera = setTimeout(() => {
          if (!pantallaAncha.matches) return;
          const y = window.scrollY, vh = window.innerHeight;
          const max = document.documentElement.scrollHeight - vh;
          let mejor = null;
          anclas().forEach((a) => {
            const d = Math.min(a, max) - y;
            if (Math.abs(d) < vh * 0.22 && (mejor === null || Math.abs(d) < Math.abs(mejor))) mejor = d;
          });
          if (mejor !== null && Math.abs(mejor) > 6) C.irA(y + mejor, { duration: 0.9 });
        }, 260);
      });
    }

    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
    window.addEventListener("load", () => ScrollTrigger.refresh());
    C.alListo(() => setTimeout(() => ScrollTrigger.refresh(), 120));
  };

  /* =======================================================
     Arranque
     ======================================================= */
  crearPendulo();
  crearArena();
  crearOla();
  crearEscenario();
  crearTierra();
  if (animar) animaciones();
})();
