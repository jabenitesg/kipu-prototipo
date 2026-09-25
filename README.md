# Kipu · prototipo

Prototipo navegable de Kipu, una app de finanzas personales tranquila. Son 202 pantallas conectadas, diseñadas para iPhone 16 Pro (393 × 852).

**Empieza en Home:** `Main.dc.html` (la página principal redirige ahí).

## Navegación

- Barra inferior: Home · Money · + · Plan · Stats
- **+** abre acciones rápidas: gasto, ingreso, escanear recibo, subir estado de cuenta, transferir
- **Money:** Cuentas · Tarjetas · Préstamos · Actividad · Household
- **Plan:** Resumen · Presupuesto · Facturas y recurrentes · Metas · Viajes
- **Stats:** Estadísticas · Insights · Revisiones · Forecast
- **Settings:** desde el avatar en Home

## Cómo funciona

Cada pantalla es un archivo `.dc.html` con su plantilla y su lógica. `support.js` es un motor ligero que las renderiza en el navegador: rellena los datos, repite listas, muestra u oculta bloques y maneja los botones. No necesita compilación ni servidor; basta con cualquier hosting estático, como GitHub Pages.

Los datos son de ejemplo.
# kipu-prototipo
