# USSO local integrado

Vista local en `http://127.0.0.1:4173/`; cuenta real y área móvil en `/miembros/`.

Compilar con `npm run build:web` dentro de `usso-miembros`; iniciar desde la raíz con `node local-integration/server.mjs`. Sólo escucha en loopback. El servidor debe reiniciarse al cambiar sus rutas.

Los cambios de acceso a las páginas existentes se realizan en memoria, sin publicar ni sobrescribir sus fuentes. El backend es real: confirmar una oferta sí registra una puja. No se usan credenciales administrativas ni secretos de servidor.

Ver `../usso-miembros/INTEGRACION.md` para contratos, validación y límites pendientes de publicación.

## Información de USSO
El anuncio de inicio de miembros apunta a `/nosotros.html`, una página pública informativa sin listados de subastas. Incluye trayectoria, financiamiento, redes y contacto, y vuelve a `/miembros/#inicio`. Contenido recuperado de `usso-tractopartes.dc.html` (statItems, financingItems, datos de negocio y redes); no se modifican cuentas ni se publica. Servida por el servidor local existente con `nosotros.css`.

### Desde el taller
`nosotros.html#videos` conserva los cinco videos, títulos y descripciones de la página pública original. `nosotros-videos.js` presenta tres vecinos virtuales, recentrado invisible, un paso por gesto, contador único, teclado y trackpad; las copias son inertes. El reproductor de YouTube se carga solo al pulsar y se elimina al cambiar de selección. Sin conteos de vistas inventados.

Validación local de videos: sintaxis JS correcta, cinco IDs coincidentes con la fuente original, reproducción real de YouTube comprobada, cierre del reproductor al navegar, dos cruces primero↔último y arrastre de mouse sin reproducción accidental. Redimensionado móvil/escritorio sin perder selección. La herramienta de navegador de esta sesión no expone entrada táctil nativa ni emulación de movimiento reducido; esas verificaciones quedan pendientes y no se sustituyen por mouse.
