# Kipu

Kipu es una app de finanzas personales tranquila. Empieza vacía, como recién instalada. Puedes usarla solo en este navegador o iniciar sesión para sincronizar tus datos cifrados entre dispositivos.

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

## Tus datos y sincronización

En modo local, todo queda en `localStorage` de este navegador. Si borras los datos del sitio o cambias de navegador, necesitas una copia de seguridad.

En **Settings → Account & sync**, Kipu envía un enlace de acceso por correo. La persona crea una frase privada de al menos 12 caracteres. Kipu cifra el archivo de datos con AES-GCM y una clave derivada con PBKDF2 antes de enviarlo a Supabase. La frase no sale del dispositivo y no se puede recuperar. Supabase guarda un único archivo cifrado por usuario, protegido por políticas de acceso por fila. Una instalación nueva no tiene cuentas ni datos de ejemplo; los datos locales solo se suben si la persona elige **Move this device’s data to my account**.

El correo de acceso y la sesión de autenticación los gestiona Supabase. Las exportaciones JSON son archivos legibles, así que guárdalas en un lugar seguro. El proyecto Kipu ya tiene `https://kipu-prototipo.vercel.app/` como **Site URL** y como redirección permitida. Para que familiares ajenos a la organización Supabase reciban correos de acceso hay que configurar un proveedor SMTP propio en **Authentication → Emails → SMTP Settings**. El servicio de correo incluido con Supabase solo llega a integrantes del proyecto y permite actualmente dos mensajes por hora. Añade los dominios de vista previa que uses como **Redirect URLs** antes de probar inicio de sesión en ellos.

La sincronización comprueba cambios al volver a la pestaña y cada 30 segundos. Si otro dispositivo cambió el archivo mientras se editaba aquí, Kipu detiene la sobrescritura y avisa; exporta una copia antes de recargar. Un borrador cifrado de la última escritura pendiente queda en este navegador para reintentar después de recargar. El modo de cuenta necesita conexión fiable y aún no hay fusión automática de movimientos editados simultáneamente.

## Código

Sitio estático sin compilación: React 18 y htm desde CDN, y el código en `js/`:

- `store.js`: modelo de datos y cálculos
- `readers.js`: lectura de recibos y estados de cuenta
- `ui.js`, `themes.js`, `currency.js`: componentes, paletas y monedas
- `screens-*.js`, `flows.js`: pantallas y formularios
- `lock.js`: bloqueo con PIN y desbloqueo biométrico
- `cloud.js`: cifrado, acceso y sincronización con control de versión
- `app.js`: navegación y layout

Las pruebas se ejecutan con `node --test tests/*.test.js` (Node.js 18 o posterior). Cubren cálculos financieros, inicio vacío, cifrado, lectura entre dispositivos y conflictos de escritura.

## Prototipo

Las 202 pantallas de diseño originales siguen en [`/prototipo`](prototipo/).
