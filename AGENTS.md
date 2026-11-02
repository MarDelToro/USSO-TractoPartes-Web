# USSO: reglas de interacción

- Todos los carruseles actuales y futuros deben ser circulares en ambos sentidos, en escritorio y móvil. Del último se pasa al primero adyacente, y del primero al último, sin recorrer toda la fila ni mostrar un salto de reinicio.
- Usar copias visuales y recentrado invisible (o virtualización equivalente). Mantener una única selección lógica: imagen principal, título, precio, contador y enlace de detalles deben corresponder al mismo producto. No duplicar registros ni conteos reales.
- Un gesto cambia una selección; arrastrar nunca debe activar enlaces. Tocar cualquier tarjeta abre los detalles de ese lote, según la petición más reciente. Conservar también «Ver detalles» en el panel principal. Probar eventos táctiles reales, no solamente arrastre de mouse en un viewport móvil.
- Probar los dos límites repetidamente, tamaños móvil/escritorio, cambios de tamaño, carga asíncrona y movimiento reducido. Con cero o un elemento no debe existir desplazamiento inútil.
- Esta regla no convierte catálogos, listas, filtros o grupos de beneficios en carruseles. Mantener su navegación y desplazamiento vertical.

## Publicaciones (2 de noviembre de 2026)
El usuario retiró la autorización de publicar automáticamente: estos ajustes se trabajan y muestran solo en local. No hacer push ni desplegar, ni siquiera para revertir una publicación, hasta que el usuario lo solicite expresamente; las publicaciones consumen créditos.

Autorización puntual posterior (2 de noviembre de 2026): el usuario pidió «ya puedes publicar» para la distinción de la vista pública de miembros y el botón «Ver próximas subastas», que debe llevar a miembros con sesión a /miembros/#subastas/proximas. Publicar este ajuste comprobado; futuras publicaciones siguen requiriendo solicitud expresa.
