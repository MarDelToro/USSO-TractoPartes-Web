# Arquitectura operativa de USSO

## Principios que no se deben romper

1. **Supabase es la única fuente de verdad.** La interfaz muestra datos; no inventa contadores, ganadores, rondas ni estados localmente.
2. **Tiempo real primero, sondeo sólo como respaldo.** Un cambio en una puja o subasta debe generar una actualización coordinada. El sondeo periódico sólo recupera la vista si se perdió la conexión.
3. **Una consulta por dominio a la vez.** Subastas, pujas, usuarios y avisos tienen coordinadores separados que agrupan eventos y evitan solicitudes simultáneas.
4. **Los estados dependen de fechas y reglas.** Una subasta es `proxima`, `activa` o `finalizada` por su inicio, cierre y estado persistido; la tarjeta no decide por su cuenta.
5. **Cada ronda conserva su historial.** Reabrir crea una nueva ronda sin borrar ofertas anteriores. Ganador, contador y precio visible pertenecen a la ronda actual.
6. **Las acciones críticas son atómicas.** Pujar, cerrar, reabrir y autorizar deben resolverse en funciones de base de datos, no mediante varias escrituras independientes desde el navegador.
7. **Un componente se limpia al salir.** Temporizadores, sonidos, videos, observadores, canales y listeners deben detenerse cuando la sección deja de existir.
8. **Una entidad aparece una sola vez.** Los carruseles desplazan elementos reales; nunca duplican físicamente tarjetas, videos ni subastas para simular continuidad.

## Flujo central

```text
Supabase
  -> evento en tiempo real
  -> coordinador del dominio
  -> una consulta consolidada
  -> estado de la pantalla
  -> portada / detalle / administración

Si falla tiempo real:
  -> sondeo de respaldo visible
  -> mismo coordinador
  -> sin consultas duplicadas
```

## Próxima fase recomendada

1. Crear una función única de base de datos para finalizar subastas y registrar resultados por ronda.
2. Crear una bandeja de eventos (`auction_events`) para ganador, perdedores, puja superada, inicio próximo y cierre cercano.
3. Procesar avisos mediante una cola con estados `pending`, `sent`, `failed` y reintentos controlados.
4. Añadir una pantalla de salud administrativa: conexión en tiempo real, avisos fallidos, subastas vencidas sin cerrar y datos incompletos.
5. Incorporar pruebas automáticas de los recorridos críticos: registro, autorización, puja, superación, cierre, reapertura y compra.
6. Separar el código compartido de tiempo, formato, estado y multimedia para que portada, detalle y panel usen exactamente las mismas reglas.

## Criterio de terminado

Una función no está terminada sólo porque se ve bien. Debe funcionar en escritorio y móvil, sobrevivir a reconexiones, evitar duplicados, conservar historial, mostrar el mismo dato en todas las vistas y limpiar sus recursos al salir.
