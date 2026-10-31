# Revisión de la integración local — 31 octubre 2026

## Verificado

- Inicio de sesión realizado por el usuario en el acceso local existente. El área privada cargó con cuenta autorizada y rol real; no se leyeron credenciales ni tokens.
- 11 lotes cargados desde USSO: 4 próximos, 7 finalizados, ninguno abierto durante la revisión.
- Inicio con portada pública en tarjeta pequeña, título PREPARA TU OFERTA., próximos lotes y estado sin puja activa.
- Detalle real de Corte Completo Kenworth T680: número, precio base, inicio/cierre, descripción, evidencia y precio de compra anticipada. Se abrió y cerró el panel sin enviar WhatsApp ni compra.
- Mis pujas mostró resultados anteriores de la cuenta. Avisos mostró su estado vacío real. Cuenta mostró autorización, número y acceso administrativo conforme al rol.
- Calendario mostró el seguimiento existente, inicio y cierre de noviembre. Al cambiar de mes selecciona la primera fecha con evento o el primer día del mes; la agenda ya no queda anclada al mes anterior.
- Vuelta a página pública y entrada por Cuenta de la barra inferior: ahora abre /miembros/. Se detectó y corrigió ese acceso que aún abría el antiguo panel.
- Un enlace existente Subasta.dc.html#id abre el lote correcto en el nuevo espacio.
- Recargar /miembros/#calendario conserva la ruta y la selección de navegación.
- Vista de 392 × 852 CSS px y vista amplia de 586 × 1272 CSS px: sin desbordamiento horizontal. Comprobación visual de inicio y calendario. El zoom del navegador estaba al 67%; se ajustó temporalmente el tamaño de prueba para obtener las dimensiones CSS y se restableció al finalizar.
- Construcción web y TypeScript correctos. Integridad de los 28 archivos protegidos del simulador correcta.
- 10 pruebas automáticas correctas: demostración, rondas y adjudicación, medios seguros, acceso sin sesión, rechazo de pujas inválidas antes del RPC, envío confirmado mediante doble de prueba, deduplicación local, redirecciones seguras y accesos públicos al área privada.

## Alcance de las pruebas

No se confirmaron pujas reales ni se escribieron datos de perfil, seguimiento o autorización. No había lotes abiertos para comprobar en vivo la preparación de una oferta. El RPC de ofertas se verificó con un cliente de prueba, sin ejecutar transacciones reales. No se probó en vivo el cierre de sesión para conservar la sesión del usuario.

Los carruseles públicos y el runtime de gestos no se editaron; no se repitió su batería táctil. La experiencia nueva utiliza listas verticales y no introduce carruseles. El teclado móvil nativo no se verificó en un teléfono físico.

La consola conservó avisos preexistentes de la portada pública (onAuctionImageError durante carga inicial, clientes Supabase múltiples y consulta de visualizaciones de YouTube). No se observaron nuevos errores del área de miembros durante el recorrido; esos avisos públicos quedan fuera de esta integración local.

Evidencia: qa/local-connected-mobile.png; captura completa de la vista en qa/local-connected-full.png. No se ha publicado.

## Ajuste: próxima subasta destacada

Sustituido el estado vacío del inicio por la próxima subasta cronológica cuando no existe una puja personal activa destacada. Los empates de fecha se ordenan por número de lote. El lote destacado no se repite en la lista secundaria. Verificado con la sesión real: lote 3017, Estructura Kenworth T680, precio base $180,000, inicio 2 noviembre 09:00 CDMX. Ver detalles abre el mismo lote. Vista móvil 392 × 852 revisada; no se activaron guardados ni pujas. Build web e integridad del runtime correctos. Evidencia: qa/upcoming-featured-mobile.png.

## Galería circular compartida — 31 octubre 2026

- El detalle usa una misma galería para próximas, activas y finalizadas, incluidas las accedidas desde resultados. Fotos/videos no se filtran por resultado. Se incluye la portada cuando falta en media_urls y se deduplican URLs.
- Tres vecinos virtuales; un gesto cambia una selección, con recentrado sin transición. Flechas, teclado, contador y enlace de ampliación comparten la selección. Los videos se pausan al cambiar y sólo el actual monta controles. Sin desplazamiento ni flechas para cero/un archivo.
- Revisados en cuenta real: Estructura International 9400i (19 archivos; primero → último video → primero), International 9400i finalizada (7 fotos, primero → última), Corte Completo INTERNATIONAL 2006 en resultados (1 foto).
- Consulta pública del backend confirmó que Motor Kenworth no tiene portada ni media_urls; varios lotes de prueba tampoco. El detalle ahora muestra un estado sin fotografías en lugar del logo como evidencia. No se fabricaron ni recuperaron fotos de otras publicaciones.
- 8 pruebas del adaptador correctas, incluida conservación de galerías para ganadas/perdidas, deduplicación, medios inválidos y cero archivos.
- 5 pruebas Playwright correctas en Chrome aislado usando Input.dispatchTouchEvent (eventos táctiles nativos del navegador, no drag de mouse disfrazado): límites repetidos en ambos sentidos, mouse/touch, 393 y 1100 px, reduce/no-preference, cambio de tamaño, ausencia de ventanas tras arrastre, coincidencia del enlace activo, cero/uno, carga asíncrona y scroll vertical. No se usó sesión real ni se escribió al backend en estas pruebas. No es una prueba en teléfono físico.
- Comando reproducible: `npm run test:runtime -- --config playwright.gallery.config.ts` desde usso-miembros; requiere Chrome instalado. La galería QA está en tests/gallery-fixture.html y no se incluye en build:web.
- Build web/TypeScript y los 28 archivos del runtime protegido verificados. El carrusel app-owned se documentó en AGENTS.md; el carrusel libre del simulador permanece intacto.
- Evidencia visual: qa/gallery-connected-mobile.png. Vista local actualizada; no publicada.

## Encuadre completo de las imágenes

Corregida la altura intrínseca de la fila grid que permitía crecer al enlace/imagen por encima del slide y recortaba las fotos verticales. El slide ahora limita el bloque de medios, con contain centrado y bandas oscuras; se conservan proporciones y todos los bordes. Verificada la foto 5/19 de Estructura International 9400i (1080 × 1440): alto de imagen y slide coinciden a 298.32 px en móvil, sin recorte. 6 pruebas de navegador correctas, incluida una regresión de encuadre para fotos verticales, horizontales y panorámicas en 393 y 1100 px, junto con la batería táctil/circular anterior. Build web e integridad runtime correctos. Captura: qa/gallery-framing-fixed.png. Sólo local.

## Deslizamiento prioritario y presentación sin marco

Eliminados borde, fondo de panel, esquinas redondeadas y flechas visibles; se conservan controles accesibles al enfocarlos con teclado. Fotos completas y centradas, contador pequeño, indicación de deslizar y ampliación. Desactivado el arrastre nativo del enlace de imagen, que podía competir con movimientos lentos antes de capturar el puntero. Añadido gesto horizontal de trackpad con acumulación/umbral y bloqueo de inercia para avanzar una sola selección; scroll vertical permanece libre. Umbral de swipe de puntero reducido a 42 px máximo.

7 pruebas de Chrome aislado correctas (48.9 s): cuatro combinaciones móvil/escritorio y movimiento reducido con touch/mouse, cero/uno y carga asíncrona, encuadre completo, y nueva regresión de drag lento de 100 pasos + trackpad continuo + límites + scroll vertical. Sin ventanas abiertas después de arrastrar. Build web y runtime protegido correctos. Evidencia: qa/gallery-swipe-clean.png. Sólo local, sin escrituras al backend durante QA.


### Sala de ejemplo (31 octubre)
- `/miembros/?preview=sala`: verificada en navegador local a tamaño móvil; logo y foto cargan completos.
- Pujar muestra confirmación; confirmar añade oferta simulada y deshabilita el botón mientras va ganando. Una oferta simulada posterior vuelve a habilitarlo.
- La ruta evita crear el cliente Supabase; no ejecuta operaciones sobre la cuenta real.
- Build web y comprobación de 28 archivos protegidos aprobados. Captura: `qa/live-room-preview.png`.

### Integración de sala y precio actualizado (31 octubre)
- En la cuenta real se verificó el recorrido Inicio → detalle lote 3017 → sala próxima, con precio base $180,000 y pujas deshabilitadas. No se enviaron pujas reales. No había una subasta activa para verificar competencia real.
- En `tests/room-fixture.html`, usando el mismo componente conectado y un servicio aislado: oferta externa $90,000 → $95,000, siguiente importe $96,000, cancelación de confirmación obsoleta; confirmación de prueba $96,000 con un único envío; nueva oferta $101,000; bloqueo al desconectar, recuperación y bloqueo al cerrar.
- Pruebas de adaptador: lectura filtrada por lote/usuario/ronda, actualización del precio real, suscripción a pujas y lotes y limpieza. Suite de servicio e integración: 13 pruebas aprobadas en total. Build web y control de integridad del runtime aprobados.
- Feed limitado explícitamente a actualizaciones observadas en esta sesión. El precio es autoridad del servidor, no una animación o actividad inventada.

### Finales dramáticos (31 octubre)
- Ambas vistas de ejemplo alcanzan 00:00 y muestran el final correcto, con lote y precio final. Navegación entre finales comprobada, sin llamadas de pujas reales. Composición revisada a 480 × 852 y en pantalla amplia, sin desbordamiento horizontal.
- 14 pruebas de integración/resultados aprobadas: ganador confirmado, perdedor participante, espectador neutral, ronda anterior excluida, espera sin ganador y ampliación del reloj.
- La victoria requiere cierre confirmado del servidor; el cero del reloj no concede resultados. Reconexión pendiente conserva el estado de espera. Animaciones decorativas desactivadas por CSS con movimiento reducido.
- Build web y 28 archivos protegidos verificados. Ninguna subasta real fue cerrada ni alterada para estas pruebas.

### Centrado y salida de resultados (31 octubre)
- Medición DOM a 480 × 852: centro vertical del bloque de celebración = 426 px; centro de pantalla = 426 px; sin desbordamiento horizontal.
- Transición automática de ganador y perdedor a Resultado de la subasta verificada en navegador. Se conserva el lote y los importes propios/finales.
- «Ver próximas subastas» abre #subastas/proximas con Próximas seleccionado y 4 lotes próximos de la cuenta real. «Regresar al inicio» navega a #inicio.
- Build web y control de integridad de los 28 archivos protegidos aprobados. Sin pujas reales ni publicación. Capturas: qa/ending-centered.png y qa/auction-result.png.

### Resultado ganador y perdedor diferenciados (31 octubre)
- Resultado ganador revisado con encabezado dorado, luz ambiental, sello de lote ganado, fotografía completa ampliada y oferta ganadora de ejemplo $269,000.
- Resultado sin ganar: mensaje explícito, fotografía grande con object-fit contain, precio final $268,000 y oferta propia $267,000 separados. Revisión a 480 × 852 sin desbordamiento horizontal. Se ajustó la foto para mantener ambas salidas visibles.
- Compilación web e integridad del runtime aprobadas. La lógica del resultado confirmado y el paso automático desde la celebración no cambian. Pruebas visuales aisladas, sin ofertas reales ni publicación.
