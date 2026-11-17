# Prácticas de laboratorio · Física General (UNAD)

Páginas de presentación de las prácticas de laboratorio del curso **Física General (100413)** de la Universidad Nacional Abierta y a Distancia (UNAD), 2026. Un proyecto traído por el estudiante **Leonardo Sánchez**.

## Enlaces

| Página | Enlace |
| --- | --- |
| Índice de prácticas | https://thesanchezprogrameitor.github.io/practicas-fisica-general/ |
| Práctica 1 · Error e incertidumbre en mediciones directas e indirectas | https://thesanchezprogrameitor.github.io/practicas-fisica-general/practica-1/ |
| Práctica 2 | Próximamente |
| Práctica 3 | Próximamente |

## Estructura

```
index.html            Índice con las tres prácticas
assets/
  css/comun.css       Paleta, tipografía, barra superior, cursor, carga y telón
  js/comun.js         Scroll suave, barra de progreso, cursor, carga y transiciones
practica-1/
  index.html          Página de la Práctica 1
  practica.css        Estilos propios de la Práctica 1
  practica.js         Animaciones e interacciones propias de la Práctica 1
```

Cada práctica vive en su propia carpeta y tiene su propio enlace (`/practica-N/`). Lo que comparten todas está en `assets/`.

## Cómo agregar la Práctica 2 (y la 3)

1. Copiar la carpeta `practica-1` como `practica-2`.
2. En `practica-2/index.html`, cambiar el título, la descripción, los datos de la portada y el contenido de «Lo que hicimos».
3. Ajustar `practica.css` y `practica.js` a las nuevas actividades (los bloques de la Práctica 1 que no se usen se pueden borrar).
4. En `index.html` (raíz), convertir el elemento «Práctica 2 · Próximamente» en un enlace a `practica-2/`, igual que el de la Práctica 1.
5. En el pie de cada práctica, actualizar la lista de prácticas para enlazar la nueva.

GitHub Pages publica los cambios automáticamente al subirlos a la rama `main`.

## Tecnología

HTML, CSS y JavaScript sin compilación. Animaciones con [GSAP](https://gsap.com/) y ScrollTrigger, scroll suave con [Lenis](https://github.com/darkroomengineering/lenis). Tipografías: Instrument Serif, Manrope y JetBrains Mono (Google Fonts). Respeta la preferencia de movimiento reducido del sistema.
