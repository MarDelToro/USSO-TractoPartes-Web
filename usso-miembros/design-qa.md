# Revisión visual — Mi espacio USSO

Fecha: 31 octubre 2026. Alcance: prototipo privado navegable, sin conexión a producción.

## Referencia y evidencia

- Fuente: `../output/member-experience-2026-10-31/inicio-miembros-promociones-v4.png`, 768 × 2048, normalizada a 393 × 1048.
- Implementación: http://127.0.0.1:4174/.
- Capturas finales: `qa/home.png`, `qa/bid-card.png`, `qa/calendar.png` (393 × 852); `qa/calendar-pixel.png` (427 × 952). Confirmación: `qa/confirm.png`.
- Comparación conjunta examinada: `qa/comparison.png`; detalle de promoción y oferta: `qa/comparison-focus.png`.
- Se pidió viewport exterior 1400 × 1200. El navegador tenía zoom previo 67%: DOM exterior 2089 × 1791 y devicePixelRatio 0.67. Se verificó el teléfono a escala CSS 1: 392.99 × 851.99; Pixel 426.99 × 951.99. La captura nativa completa se recortó al rectángulo de pantalla para conservar la escala, sin comparar el lienzo exterior. Algunas capturas se ven suavizadas por el zoom del navegador.
- Estado comparado: Carlos autorizado, oferta superada, precio $85,000, oferta propia $80,000. El diseño fuente muestra una página larga; la implementación conserva desplazamiento y navegación fija. La barra de estado y el indicador de inicio son del simulador, no forman parte del diseño fuente.

## Hallazgos e iteraciones

1. P2 corregido: selección del calendario y pestaña activa perdían el dorado por especificidad de estilos compartidos con el modal. Se redujo la especificidad con `:where`; selección y pestaña aparecen doradas en las capturas finales.
2. P2 corregido: texto pequeño de la promoción e importe de confirmación heredaban gris oscuro de la plantilla. Se definieron colores explícitos y se revisó promoción y confirmación.
3. P1 corregido: el enfoque de controles podía desplazar el contenedor exterior del teléfono y dejar un espacio del teclado fuera del contenido. Se limita el desplazamiento a MobileScroll y al contenido del modal, con `overflow: clip` en el contenedor de esta app. El teclado oculto también se excluye visualmente. Se repitió Inicio → Pujar → cerrar → Calendario, cambio iPhone/Pixel y regreso. El contenedor de pantalla conserva scrollTop 0. Evidencia posterior: `qa/calendar.png`, `qa/calendar-pixel.png`, `qa/home.png`.
4. El encuadre fotográfico se acercó a la referencia usando los archivos originales disponibles. Se mantiene la portada pública y una fotografía real del motor; no se recrean los productos mediante dibujos.

## Superficies de fidelidad

- Tipografía: Manrope local 400/600/700/800, jerarquía clara y texto español sin truncamiento relevante. El título de campaña es menos pesado que la imagen generada: diferencia P3 de acabado; no cambia jerarquía ni significado.
- Espaciado: tarjetas de 19–22 px de radio, márgenes compactos, navegación fija y espacio inferior suficiente para recorrer la última fila. La promoción es ligeramente más alta para conservar copia legible; el estado del sistema ocupa espacio adicional respecto al mock largo.
- Color: negro/carbón, oro cálido, luz en el CTA Pujar, estados de oferta con texto explícito. Corregidas las pérdidas de contraste identificadas.
- Imágenes: logo original transparente y fotos locales de USSO. Los encuadres y la resolución documental difieren del render generativo; es una adaptación intencional para usar contenido real. No se reemplazaron activos de marca por geometría.
- Contenido: título público PREPARA TU OFERTA., subtítulo original, promoción exclusivamente en Inicio privado, CTA Pujar y calendario en su propia pestaña. Una sola promoción: se omitieron los puntos de carrusel ficticios. Los lotes permanecen en listas verticales.

## Verificaciones

- Navegación por las cinco pestañas, promoción → subastas próximas → detalle de lote.
- Guardar/quitar lote y actualización compartida; selección de noviembre y fecha con evento.
- Pujar → importe → confirmación → éxito; actualización a $86,000 y estado Vas ganando en Mis pujas/calendario. Importe $80,000 rechazado frente al mínimo de $86,000.
- Adaptación del marco a iPhone y Pixel, y restauración del tamaño exterior del navegador.
- Consola del navegador revisada: sin errores ni advertencias capturadas.
- Compilación TypeScript/Vite y comprobación de 28 archivos protegidos: aprobadas.
- Tres pruebas del servicio (oferta/idempotencia/concurrencia; autorización/vigencia/importes; guardados/perfil/aislamiento) aprobadas. Cuatro pruebas de empaquetado aprobadas.
- No se realizaron ofertas reales. No hay carruseles en esta implementación; las reglas de límites circulares no aplican.

## Límites y siguientes pasos

No se probaron un backend real, sesión real, notificaciones push ni un dispositivo físico. Movimiento reducido está contemplado en los estilos propios; no se hizo una auditoría completa con lector de pantalla. Perfil, búsqueda y ayuda están implementados, pero no tuvieron la misma cobertura de interacción visual que la oferta y el calendario. Los pasos de conexión y las dependencias del simulador están descritos en `INTEGRACION.md`.

No quedan hallazgos P0/P1/P2 en el alcance visual verificado. Las diferencias tipográficas y de encuadre indicadas quedan como ajustes P3 opcionales.

final result: passed
