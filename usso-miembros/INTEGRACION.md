# Mi espacio USSO — integración local

Estado: conectada a la cuenta real mediante el backend existente. No publicada.

- Sitio público local: http://127.0.0.1:4173/
- Área privada: http://127.0.0.1:4173/miembros/
- El prototipo separado de demostración conserva el marco iPhone/Pixel y datos simulados en 4174.

## Recorrido

Portada pública → Entrar / Mi cuenta → Inicio privado → Subastas → detalle / compra anticipada / puja cuando esté abierta → Mis pujas / Calendario / Cuenta → página pública o cierre de sesión local.

La sesión se comparte entre páginas del mismo origen local. No se copian contraseñas ni tokens de producción; el usuario inicia sesión directamente. Los enlaces de lotes conservan su destino al pasar por el acceso. La ruta privada comprueba sesión y la autorización real antes de habilitar acciones. La seguridad de los datos y de las ofertas depende de las políticas y funciones existentes del backend, no del guard del navegador.

## Implementación

`src/web-main.tsx`, `web.html` y `vite.web.config.ts` montan la web sin carcasa ni teclado simulado. `src/member-ui.tsx` permite reutilizar la misma experiencia en la web y en la demostración, sin editar el runtime móvil protegido.

`src/usso-service.ts` usa el cliente público Supabase existente y estas fuentes:

| Función | Fuente |
| --- | --- |
| Perfil y autorización | profiles + auth.getUser |
| Subastas y evidencia | listings |
| Participaciones propias | bids, filtradas por usuario y ronda vigente |
| Calendario / seguimiento | auction_watchers + pujas propias |
| Avisos | notifications del usuario, sin descartados |
| Guardar próximo lote | toggle_auction_watch |
| Confirmar puja | place_bid |
| Solicitar autorización | request_bid_authorization |
| Editar nombre / ciudad | profiles.update de esos dos campos |
| Salir | auth.signOut con scope local |

Las adjudicaciones cerradas se interpretan con winner_id. Una oferta anterior no se presenta como ganadora sin ese dato. Si no existen subastas abiertas, se muestran próximas oportunidades y estados vacíos honestos. Compra anticipada muestra buy_now_price cuando existe y ofrece el canal de WhatsApp del sitio, sin enviar mensajes automáticamente.

Actualización por eventos de listings, avisos y seguimiento, más consulta cada 30 segundos mientras la página está visible. El calendario utiliza fechas de Ciudad de México. Los avisos fallidos se señalan sin impedir ver las subastas.

## Servidor local

`../local-integration/server.mjs` sirve la web pública existente y el build privado bajo el mismo origen, enlazando los accesos de cabecera, menú y barra inferior. Los ajustes de rutas/login se aplican en memoria mediante `routes.mjs`; no escriben sobre las páginas públicas fuente. Sólo escucha en 127.0.0.1. No hay despliegue ni migración de base de datos.

Desde `usso-miembros`:

```sh
npm run build:web
npm run check:runtime
node --experimental-transform-types --test tests/member-service.test.mjs tests/usso-integration.test.mjs
```

Desde la raíz del proyecto:

```sh
node local-integration/server.mjs
```

Si se modifican `routes.mjs` o el servidor, reiniciarlo. Cambios de la interfaz requieren reconstruir `build:web` y recargar. Las fuentes e imágenes de `/assets/usso/` son servidas por el servidor local; los avisos de Vite sobre fuentes conservadas en runtime son esperados.

## Límites y publicación posterior

- Las acciones confirmadas en esta vista local escriben datos reales. Durante QA no se enviaron pujas, cambios de perfil, solicitudes de autorización ni cambios de seguimiento.
- Las validaciones de puja del cliente son preventivas; `place_bid` sigue siendo la autoridad final para autorización, fechas y mínimo. Su contrato actual no acepta revisión esperada ni clave de idempotencia. La deduplicación incorporada sólo cubre callbacks de la misma instancia; no garantiza idempotencia entre pestañas ni ante respuesta de red perdida. Antes de un reintento dudoso se debe consultar Mis pujas.
- La fecha del navegador organiza la interfaz; el RPC debe validar su propia hora. No se cambiaron las funciones del servidor.
- No había subastas abiertas durante QA, por lo que la escritura real de una puja no se probó. Se verificó el adaptador con dobles de prueba, sin llamadas reales de escritura.
- Seguimiento sólo se habilita para próximas subastas o para retirar un seguimiento existente, conforme al RPC actual.
- Las campañas siguen siendo configuración local del adaptador. No se agregó un gestor publicitario.
- Para publicar después: trasladar rutas al hosting real, servir `dist/web` y assets, y validar recuperación/registro/redirecciones en ese dominio. Esta sesión no autoriza publicación.

Resultados y evidencia: `integration-qa.md` y `qa/`. La revisión anterior del simulador permanece en `design-qa.md`.


### Sala de subasta: vista previa local
Abrir `/miembros/?preview=sala` para la sala interactiva con actividad simulada. No inicializa el cliente de cuenta real ni llama a la API de pujas. El botón pide confirmar el importe de prueba y se desactiva mientras la oferta va ganando. La demostración caduca tras 7:42 minutos; recargar inicia otra.

### Sala conectada a la cuenta
La ruta `/miembros/#sala/<id>` abre el lote real y se accede desde sus detalles; las participaciones activas también incluyen un acceso en Inicio y Mis pujas. El precio grande usa `listings.current_price`, se anima al cambiar y refresca junto con el mínimo y la posición del usuario.
Escucha cambios del lote e inserciones de pujas, con consulta de respaldo cada 3 segundos, recuperación al volver a la pestaña y consultas serializadas. Sólo usa las políticas de lectura existentes. El registro visible contiene precios observados desde la entrada, no un historial completo ni identidades inventadas.
Una confirmación conserva importe/revisión; cualquier cambio la invalida. El envío usa el RPC existente `place_bid`, con validación fresca previa. Cuenta no autorizada, desconexión/datos vencidos, cierre, próxima subasta y oferta propia ganadora bloquean el botón. La vista de ejemplo permanece aislada en `?preview=sala`. No se ha publicado.

### Pantallas de cierre
Al llegar a cero, la sala muestra «Cerrando la subasta» y sigue consultando. Sólo el estado cerrado/vendido del servidor con ganador asignado activa el final ganador o perdedor. No se deduce del reloj ni del precio de la oferta propia. Quienes no participaron reciben un final neutral. Si se amplía el cierre, la sala vuelve al estado abierto.
El componente `AuctionEnding` conserva el lote y los precios, enfoca el encabezado accesible y respeta movimiento reducido. Confeti y luces son decorativos y finitos; sin sonido automático. Previews aislados: `/miembros/?preview=sala&final=won` y `final=lost` (cierre en 4 s).

### Celebración centrada → resultado
El cierre confirmado tiene dos etapas: celebración centrada (8 segundos, con opción de adelantar «Ver resultado») y página persistente de resultado. La espera de confirmación no avanza automáticamente. El resultado conserva lote, importe y condición ganada/perdida, y ofrece «Ver próximas subastas» e «Ir al inicio». La ruta `#subastas/proximas` abre la lista con el filtro Próximas aplicado. Las demos usan el mismo recorrido y mantienen el aviso de datos simulados.

### Jerarquía visual del resultado
El resultado ganador conserva la emoción con título dorado, haces de luz, sello de lote ganado, fotografía grande completa y oferta ganadora destacada. El resultado sin ganar presenta «No ganaste este lote», foto ampliada, «Precio final de la subasta» y la oferta propia por separado. Se mantienen la celebración centrada de 8 segundos y las salidas a próximas subastas e inicio. Los importes siguen utilizando los datos confirmados del lote.

## Release preparation — 31 October 2026
Publication is now explicitly authorized by the user. `npm run build:release` emits the real-account entry without the live-room demo. `node local-integration/package-release.mjs <isolated-checkout>` packages /miembros/, its assets, information/videos, recovery and login/legacy routing into the current production checkout. Existing public visuals, access gate and Supabase policies remain unchanged. Never deploy the 4174 phone frame as the account website.
