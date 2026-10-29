# USSO: reglas de interacción

- Todos los carruseles actuales y futuros deben ser circulares en ambos sentidos, en escritorio y móvil. Del último se pasa al primero adyacente, y del primero al último, sin recorrer toda la fila ni mostrar un salto de reinicio.
- Usar copias visuales y recentrado invisible (o virtualización equivalente). Mantener una única selección lógica: imagen principal, título, precio, contador y enlace de detalles deben corresponder al mismo producto. No duplicar registros ni conteos reales.
- Un gesto cambia una selección; arrastrar nunca debe activar enlaces. Tocar cualquier tarjeta abre los detalles de ese lote, según la petición más reciente. Conservar también «Ver detalles» en el panel principal. Probar eventos táctiles reales, no solamente arrastre de mouse en un viewport móvil.
- Probar los dos límites repetidamente, tamaños móvil/escritorio, cambios de tamaño, carga asíncrona y movimiento reducido. Con cero o un elemento no debe existir desplazamiento inútil.
- Esta regla no convierte catálogos, listas, filtros o grupos de beneficios en carruseles. Mantener su navegación y desplazamiento vertical.
