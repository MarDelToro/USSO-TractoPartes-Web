# USSO: reglas de interacción

- Todos los carruseles actuales y futuros deben ser circulares en ambos sentidos, en escritorio y móvil. Del último se pasa al primero adyacente, y del primero al último, sin recorrer toda la fila ni mostrar un salto de reinicio.
- Usar copias visuales y recentrado invisible (o virtualización equivalente). Mantener una única selección lógica: imagen principal, título, precio, contador y enlace de detalles deben corresponder al mismo producto. No duplicar registros ni conteos reales.
- Un gesto cambia una selección; arrastrar nunca debe activar enlaces. Tocar cualquier tarjeta abre los detalles de ese lote, según la petición más reciente. Conservar también «Ver detalles» en el panel principal. Probar eventos táctiles reales, no solamente arrastre de mouse en un viewport móvil.
- Probar los dos límites repetidamente, tamaños móvil/escritorio, cambios de tamaño, carga asíncrona y movimiento reducido. Con cero o un elemento no debe existir desplazamiento inútil.
- Esta regla no convierte catálogos, listas, filtros o grupos de beneficios en carruseles. Mantener su navegación y desplazamiento vertical.

## Publicaciones (2 de noviembre de 2026)
El usuario retiró la autorización de publicar automáticamente: estos ajustes se trabajan y muestran solo en local. No hacer push ni desplegar, ni siquiera para revertir una publicación, hasta que el usuario lo solicite expresamente; las publicaciones consumen créditos.

Autorización puntual posterior (2 de noviembre de 2026): el usuario pidió «ya puedes publicar» para la distinción de la vista pública de miembros y el botón «Ver próximas subastas», que debe llevar a miembros con sesión a /miembros/#subastas/proximas. Publicar este ajuste comprobado; futuras publicaciones siguen requiriendo solicitud expresa.

## Correos automáticos (8 de noviembre de 2026) — PREPARADO, AÚN NO PUBLICADO (los archivos no están en el repo todavía)
- `netlify/functions/send-emails.mjs` corre cada 2 minutos (función programada): bienvenida, cuenta autorizada, te superaron, ganaste, no ganaste, subasta en 24 h, y avisos al administrador (registro nuevo, solicitud de autorización, subasta cerrada con ganador). Plantillas en `netlify/lib/emails.mjs`.
- Envío por Gmail SMTP (`GMAIL_USER`, `GMAIL_APP_PASSWORD`); lectura con `SUPABASE_SERVICE_ROLE_KEY` (solo en variables de Netlify, nunca en el navegador ni en el repo). `ADMIN_EMAIL` opcional (por defecto `GMAIL_USER`).
- Sin duplicados: cada registro se «aparta» con `email_sent_at` / `welcome_email_sent_at` / `approved_email_sent_at` / `admin_email_sent_at` antes de mandar. Respeta los interruptores de Avisos del usuario.
- Prueba segura: POST `/.netlify/functions/email-test` con `{"test":"todos"}` manda ejemplos solo a `GMAIL_USER`.
- Migración: `supabase/migrations/20261108_email_delivery.sql` (se corre en el SQL Editor de Supabase).

## Miembros en computadora (8 de noviembre de 2026)
- A partir de 960 px el área de miembros usa barra superior y contenido ancho (reglas al final de `usso-miembros/src/web.css`); el celular no cambia. `?preview=demo` (solo builds que no son release) muestra datos de ejemplo para revisar diseño sin cuenta.

## Kit de diseño (8 de noviembre de 2026)
- `usso-kit.css` (raíz) es la fuente única de botones (`k-btn`, `k-btn--gold`, `k-btn--ghost`), etiquetas de estado (`k-badge--upcoming|live|closed`), contador (`k-clock` con `is-soon` / `is-urgent` en la última hora), flechas de carrusel (`k-arrow`) y tarjeta de subasta (`k-lot`). La portada lo enlaza al final del <head>; Mi espacio lo importa en `src/web-main.tsx`.
- Contadores legibles: «2 d 20 h», «20 h 05 min», «8 min 05 s» (`formatCountdown` en la portada, `TimeLeft` en Mi espacio).
- Títulos grandes en Archivo Black y texto de interfaz en Manrope en ambas partes.

## Tono negro / blanco, intro y secciones de información (8 de noviembre de 2026)
- Tono: `html[data-theme=light]` (guardado en `localStorage.usso_theme`, compartido por portada y Mi espacio). Botón ☀/☾ en el menú de la portada (`toggleTheme`) y en la cabecera de Mi espacio (`ThemeButton`). La portada (#hero), la vitrina de subastas y las fotos de tarjetas se quedan oscuras a propósito. En tono blanco se usa `assets/logo-usso-transparent.png` (letras oscuras).
- Intro «logo express» de 1.5 s, sólo la primera visita del dispositivo (`localStorage.usso_intro_seen`).
- Financiamiento con simulador (precio ÷ meses, estimado de referencia, manda la cotización por WhatsApp), tarjetas de confianza antes de Subastas, contacto con mapa y pie de página completo. Pendiente: dirección exacta y horario.
- Portada «cinemática» (#hero.k-hero): `assets/intro-v2.mp4` (vertical, 3.2 s, el camión prende luces) corre UNA vez al terminar el intro y se queda en el último cuadro; sin bucle. Todo vive en `.k-hero-scene` (columna vertical anclada a la derecha): luz difuminada alineada con el camión (`.k-hero-ambient--on/--off`), el camión (`.k-hero-stage`, bordes desvanecidos) y el interruptor `.k-switch` (role=switch). Apagar = fundido de 1.2 s al primer cuadro (`.k-hero-off`, capturado al cargar); prender = el video avanza desde ese cuadro. #hero usa `overflow:clip` para que no se desplace de lado. Con movimiento reducido se muestra directo con luces prendidas.
- Datos de confianza («USSO en números») entre Videos y Contacto. Página local `simulador.html` (no se sube) muestra portada y Mi espacio en marcos de celular; `?preview=demo` mueve las fechas de ejemplo a hoy.

## Celular «Claro y confiable» (8 de noviembre de 2026)
- En ≤760 px la portada muestra `#m-inicio` (`.k-mhome`): título, buscador (`openSearch`), categorías en círculos y la próxima subasta en tarjeta blanca; se ocultan `#hero`, la cinta de marcas y `#subastas`. La barra inferior apunta a #m-inicio, #todas-subastas, #financiamiento y Cuenta.
- Mi espacio · Inicio: saludo, aviso «Te superaron» con Pujar, «Tus pujas» con insignias (Superado/Ganando), «Guardados» (En X) y enlace a Conoce USSO (clases `m3-*` en web.css).
- En celular el tono por defecto es blanco si la persona no eligió otro (`localStorage.usso_theme`).
- (8-nov, después) Celular: portada C = el mismo #hero de las luces mostrado como tarjeta redonda (reglas ≤760 px al final de usso-kit.css); la cinta de marcas va en `.k-mbrands` antes de #hero; vuelve el carrusel original #subastas bajo «Próximas subastas»; financiamiento en celular = título, texto, simulador y botón «Ver detalles» (`toggleFinDetails`). Mi espacio · Inicio tiene `UpcomingCarousel` circular (tres copias + recentrado). «Conoce USSO» (nosotros.html/css) usa el kit y el tono negro/blanco.
- (8-nov) Mi espacio · Inicio: saludo «Hola, nombre · Bienvenido a tu espacio USSO» arriba y `LightsHero` (portada de luces con interruptor) antes de las subastas. Pie de página: `.k-footer nav` neutraliza las reglas viejas de `nav`.
- (8-nov) Mi espacio · Tus pujas: sin aviso aparte; la fila muestra «Casi tuya» si va ganando o «Superado» + botón Pujar (abre la puja rápida) si lo superaron; se actualiza sola con los datos en vivo.
