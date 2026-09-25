# Kipu

Kipu es una app de finanzas personales tranquila. Funciona de verdad: empieza vacía, como recién instalada, y guarda tus datos solo en este navegador.

- **Teléfono:** pantalla completa, con barra inferior Home · Money · + · Plan · Stats
- **Tablet y escritorio:** dashboard con barra lateral
- **Agregar a la pantalla de inicio:** en iPhone, Compartir → Agregar a inicio; en Android, menú → Instalar app

## Qué hace

- Cuentas, tarjetas, préstamos y efectivo en cualquier moneda (unas 160), con banderas, búsqueda por país, nombre o código, y tipos de cambio en vivo. Los saldos y límites de tarjetas se guardan en la moneda de cada tarjeta; patrimonio y Safe to Spend los convierten a la moneda principal.
- **Conversor de monedas** en Settings → Currencies, con los pares que más usas primero
- Tarjetas con día de cierre, día de pago y fecha de vencimiento (aviso dos meses antes), y color a elección
- **Safe to Spend:** tu efectivo menos las facturas, pagos de tarjeta, cuotas de préstamos y ahorro que vencen antes del próximo pago
- Gastos, ingresos y transferencias; cada uno mueve el saldo de su cuenta
- **Escanear recibo:** lee comercio, total, fecha y moneda con OCR dentro del navegador. La primera vez descarga unos 10 MB.
- **Subir estado de cuenta:** CSV o PDF; detecta duplicados y sugiere categorías
- Presupuesto, facturas y suscripciones, metas, viajes
- Estadísticas, insights, revisiones mensuales y forecast con escenarios
- Settings: 4 fondos (Light blanco, Graphite, Dark negro, Midnight azul) más System, y 7 temas de color (Kipu, Ocean, Forest, Sand, Ember, Coral, Dusk, Mono) y uno Custom con tus propios colores que combinan con cualquier fondo; foto de perfil; ocultar montos; reglas de categorías; copia de seguridad (JSON), exportar CSV, restaurar y borrar todo
- Calendario al tocar cualquier fecha
- Categorías propias: créalas al agregar un gasto o en Settings → Categories

## Bloqueo

En Settings → App lock puedes pedir un PIN de 6 dígitos (y Face ID, Touch ID o huella si tu dispositivo lo permite) al abrir Kipu y al volver después de un rato. El PIN no se guarda, solo una versión cifrada irreversible. El bloqueo no cifra los datos: mantén también el bloqueo de pantalla de tu teléfono o computadora.

## Tus datos

Todo queda en `localStorage` de este navegador y dispositivo; nada se envía a un servidor. Si borras los datos del sitio o cambias de navegador, empiezas de cero. Haz una copia en **Settings → Data**.

## Código

Sitio estático sin compilación: React 18 y htm desde CDN, y el código en `js/`:

- `store.js`: modelo de datos y cálculos
- `readers.js`: lectura de recibos y estados de cuenta
- `ui.js`, `themes.js`, `currency.js`: componentes, paletas y monedas
- `screens-*.js`, `flows.js`: pantallas y formularios
- `lock.js`: bloqueo con PIN y desbloqueo biométrico
- `app.js`: navegación y layout

Las pruebas de los cálculos financieros se ejecutan con `node --test tests/finance.test.js` (Node.js 18 o posterior). Cubren altas, ediciones y eliminaciones de movimientos; varias monedas; pagos; Safe to Spend; y el inicio vacío separado de los datos de demostración.

## Prototipo

Las 202 pantallas de diseño originales siguen en [`/prototipo`](prototipo/).
