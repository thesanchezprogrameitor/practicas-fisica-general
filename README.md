# Prácticas de laboratorio · Física General (UNAD)

Páginas de presentación de las prácticas de laboratorio del curso **Física General (100413)** de la Universidad Nacional Abierta y a Distancia (UNAD), 2026. Un proyecto traído por el estudiante **Leonardo Sánchez**.

## Enlaces

| Página | Enlace |
| --- | --- |
| Índice de prácticas | https://thesanchezprogrameitor.github.io/practicas-fisica-general/ |
| Práctica 1 · Error e incertidumbre en mediciones directas e indirectas | https://thesanchezprogrameitor.github.io/practicas-fisica-general/practica-1/ |
| Práctica 2 · Densidad y proporcionalidad en sólidos y líquidos | https://thesanchezprogrameitor.github.io/practicas-fisica-general/practica-2/ |
| Práctica 3 · Cálculo de la gravedad terrestre | https://thesanchezprogrameitor.github.io/practicas-fisica-general/practica-3/ |

## Estructura

```
index.html            Índice con las tres prácticas
404.html              Página para enlaces que no existen
assets/
  css/comun.css       Paleta, tipografía, barra superior, cursor, carga y telón
  js/comun.js         Scroll suave, barra de progreso, cursor, carga y transiciones
practica-1/
  index.html          Página de la Práctica 1
  practica.css        Estilos propios de la Práctica 1
  practica.js         Animaciones e interacciones propias de la Práctica 1
practica-2/
  index.html          Página de la Práctica 2
  practica.css        Identidad propia: columna de densidad (paleta, títulos, olas)
  practica.js         Animaciones propias de la Práctica 2
practica-3/
  index.html          Página de la Práctica 3
  practica.css        Identidad propia: papel crema, tinta y azul cobalto; letras que cuelgan
  practica.js         Péndulos animados: portada, arena, ola de péndulos, escenario por pasos y la Tierra
```

Cada práctica tiene su propia identidad visual (paleta, tipografía de títulos, fondos y animaciones), pero todas comparten la barra de navegación, la estructura (portada, título, «Lo que hicimos», idea central y pie) y los créditos. Las prácticas 2 y 3 redefinen en su `practica.css` las variables de color de `comun.css` solo para su página.

Cada práctica vive en su propia carpeta y tiene su propio enlace (`/practica-N/`). Lo que comparten todas está en `assets/`.

## Publicación

GitHub Pages publica los cambios automáticamente al subirlos a la rama `main`. Al cambiar un `.css` o `.js`, sube el número `?v=` con que se enlaza en el HTML para que los navegadores no usen la versión vieja guardada.

## Tecnología

HTML, CSS y JavaScript sin compilación. Animaciones con [GSAP](https://gsap.com/) y ScrollTrigger, scroll suave con [Lenis](https://github.com/darkroomengineering/lenis). Tipografías: Instrument Serif, Manrope y JetBrains Mono (Google Fonts). Respeta la preferencia de movimiento reducido del sistema.
