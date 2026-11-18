# Prácticas de laboratorio · Física General (UNAD)

Páginas de presentación de las prácticas de laboratorio del curso **Física General (100413)** de la Universidad Nacional Abierta y a Distancia (UNAD), 2026. Un proyecto traído por el estudiante **Leonardo Sánchez**.

## Enlaces

| Página | Enlace |
| --- | --- |
| Índice de prácticas | https://thesanchezprogrameitor.github.io/practicas-fisica-general/ |
| Práctica 1 · Error e incertidumbre en mediciones directas e indirectas | https://thesanchezprogrameitor.github.io/practicas-fisica-general/practica-1/ |
| Práctica 2 · Densidad y proporcionalidad en sólidos y líquidos | https://thesanchezprogrameitor.github.io/practicas-fisica-general/practica-2/ |
| Práctica 3 | Próximamente |

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
```

Cada práctica tiene su propia identidad visual (paleta, tipografía de títulos, fondos y animaciones), pero todas comparten la barra de navegación, la estructura (portada, título, «Lo que hicimos», idea central y pie) y los créditos. La Práctica 2 redefine en su `practica.css` las variables de color de `comun.css` solo para su página.

Cada práctica vive en su propia carpeta y tiene su propio enlace (`/practica-N/`). Lo que comparten todas está en `assets/`.

## Cómo agregar la Práctica 3

1. Copiar la carpeta de una práctica como `practica-3`.
2. En `practica-3/index.html`, cambiar el título, la descripción, los datos de la portada y el contenido de «Lo que hicimos».
3. Ajustar `practica.css` y `practica.js` a las nuevas actividades (los bloques de la Práctica 1 que no se usen se pueden borrar).
4. En `index.html` (raíz), convertir el elemento «Práctica 3 · Próximamente» en un enlace a `practica-3/`.
5. En el pie de cada práctica, actualizar la lista de prácticas para enlazar la nueva.

GitHub Pages publica los cambios automáticamente al subirlos a la rama `main`. Al cambiar un `.css` o `.js`, sube el número `?v=` con que se enlaza en el HTML para que los navegadores no usen la versión vieja guardada.

## Tecnología

HTML, CSS y JavaScript sin compilación. Animaciones con [GSAP](https://gsap.com/) y ScrollTrigger, scroll suave con [Lenis](https://github.com/darkroomengineering/lenis). Tipografías: Instrument Serif, Manrope y JetBrains Mono (Google Fonts). Respeta la preferencia de movimiento reducido del sistema.
