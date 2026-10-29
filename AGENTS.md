# USSO: reglas de interacción

- Todos los carruseles actuales y futuros deben ser circulares en ambos sentidos, en escritorio y móvil. Del último se pasa al primero adyacente, y del primero al último, sin recorrer toda la fila ni mostrar un salto de reinicio.
- Usar copias visuales y recentrado invisible (o virtualización equivalente). Mantener una única selección lógica: imagen principal, título, precio, contador y enlace de detalles deben corresponder al mismo producto. No duplicar registros ni conteos reales.
- Una pulsación o gesto cambia una selección; arrastrar no debe activar enlaces. Seleccionar una miniatura no abre detalles: conservar una acción explícita «Ver detalles».
- Probar los dos límites repetidamente, tamaños móvil/escritorio, cambios de tamaño, carga asíncrona y movimiento reducido. Con cero o un elemento no debe existir desplazamiento inútil.
- Esta regla no convierte catálogos, listas, filtros o grupos de beneficios en carruseles. Mantener su navegación y desplazamiento vertical.
