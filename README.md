# Kipu

Kipu es una app de finanzas personales tranquila. Funciona de verdad: empieza vacía, como recién instalada, y guarda tus datos solo en este navegador.

- **Teléfono:** pantalla completa, con barra inferior Home · Money · + · Plan · Stats
- **Tablet y escritorio:** dashboard con barra lateral
- **Agregar a la pantalla de inicio:** en iPhone, Compartir → Agregar a inicio; en Android, menú → Instalar app

## Qué hace

- Cuentas, tarjetas, préstamos y efectivo, en varias monedas, con tipos de cambio en vivo
- **Safe to Spend:** tu efectivo menos las facturas, pagos de tarjeta, cuotas de préstamos y ahorro que vencen antes del próximo pago
- Gastos, ingresos y transferencias; cada uno mueve el saldo de su cuenta
- **Escanear recibo:** lee comercio, total, fecha y moneda con OCR dentro del navegador. La primera vez descarga unos 10 MB.
- **Subir estado de cuenta:** CSV o PDF; detecta duplicados y sugiere categorías
- Presupuesto, facturas y suscripciones, metas, viajes
- Estadísticas, insights, revisiones mensuales y forecast con escenarios
- Settings: 7 temas y 5 modos (Light, Dark, Midnight, Ash, Onyx), ocultar montos, reglas de categorías, copia de seguridad (JSON), exportar CSV, restaurar y borrar todo

## Tus datos

Todo queda en `localStorage` de este navegador y dispositivo; nada se envía a un servidor. Si borras los datos del sitio o cambias de navegador, empiezas de cero. Haz una copia en **Settings → Data**.

## Código

Sitio estático sin compilación: React 18 y htm desde CDN, y el código en `js/`:

- `store.js`: modelo de datos y cálculos
- `readers.js`: lectura de recibos y estados de cuenta
- `ui.js`, `themes.js`: componentes y temas
- `screens-*.js`, `flows.js`: pantallas y formularios
- `app.js`: navegación y layout

## Prototipo

Las 202 pantallas de diseño originales siguen en [`/prototipo`](prototipo/).
