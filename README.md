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
- Actividad con calendario semanal de fechas individuales y detalle de gastos e ingresos del día
- Categorías propias: créalas al agregar un gasto o en Settings → Categories
- **Idioma:** español o inglés. Se elige solo según el idioma del teléfono y se cambia en la bienvenida o en Ajustes → Idioma. Los nombres que escribiste no se traducen.
- **Vista por país:** si tienes cuentas en varios países (por ejemplo Canadá y Perú), Inicio muestra lo disponible para gastar en cada uno, en su propia moneda, y puedes ver solo ese país. Las cuentas en dólares, euros o libras sin país se cuentan en tu país principal.
- **Tarjetas bimoneda:** una tarjeta puede llevar saldo en dos monedas (soles y dólares) con un solo límite, y pagarse por separado. Los préstamos se pagan en su propia moneda.
- **Sin conversiones inventadas:** si falta el tipo de cambio de una moneda, Kipu no la convierte 1 a 1. Esos montos quedan fuera de los totales con un aviso y se suman cuando llega la tasa.
- **Estados de cuenta antiguos:** cada cuenta y tarjeta recuerda el día en que pusiste su saldo. Al importar, lo anterior a esa fecha ya está incluido en el saldo y solo cuenta para Estadísticas; lo posterior mueve el saldo. Se puede elegir Automático, Todo o Ninguno, y marcar importaciones anteriores o movimientos sueltos como "Ya está pagado".
- **Pagos de tarjeta en el banco:** una línea como "PAGO TARJETA VISA" en un estado de cuenta del banco se importa como transferencia a esa tarjeta, no como gasto, para no contar las compras dos veces. Si ya se importaron como gasto, Estadísticas ofrece corregirlas sin cambiar saldos.
- **Estados de cuenta chequing:** lee las columnas Withdrawal/Deposit (o Debit/Credit, Retiro/Depósito) en CSV y PDF; en PDF ubica cada monto en su columna o usa el saldo acumulado. Si todo viene en positivo, usa las palabras de cada línea.
- **Fechas de los estados de cuenta:** los meses solo cuentan como palabras completas ("14 MARKET" no es marzo), el orden día/mes se decide una vez por archivo (un día mayor que 12 lo define; si no, el orden cronológico y el país de la cuenta), y las fechas sin año toman el año del periodo del estado de cuenta. En Ajustes → Datos se puede deshacer una importación para volver a subirla.
- **Sueldo:** las líneas PAYROLL, NOMINA o SUELDO se importan como sueldo y ajustan tu ingreso esperado (frecuencia, promedio de los últimos tres y próximo pago).
- **Pagos recurrentes:** al importar, los pagos que se repiten cada mes por un monto parecido (seguro, teléfono, gimnasio) se proponen como recibos; también en Plan → Recibos para lo ya importado.
- **Préstamos con débito automático:** al importar, la cuota de un préstamo registrado (auto, financiamiento, hipoteca) se reconoce por el nombre del préstamo o del prestamista y un monto parecido a la cuota, y se registra como pago del préstamo. Un pago recurrente que parece préstamo ofrece "Es un préstamo"; los pagos ya importados como gasto se pueden corregir sin mover saldos.
- **Recibos que cambian de precio:** el recibo sigue su último pago (hasta 25% se actualiza solo y avisa; más, pregunta) y puede tener un mes de fin ("Termina en") después del cual deja de contar.
- **Recibos pagados:** un gasto escrito o importado que coincide con un recibo (nombre parecido, monto dentro del 3 % y ±7 días) lo marca como pagado, así no se descuenta dos veces. Se puede vincular o desvincular a mano en el detalle del gasto.

- **Solo, en pareja o mixto:** al empezar, Kipu pregunta cómo manejas tu plata. *Solo yo* no muestra nada de hogar. *En pareja, compartimos todo* ve todo junto, saluda a los dos y ofrece invitar a la pareja al Hogar conjunto. *Algo mío, algo en común* agrega "Compartido con…" a cada gasto: quién pagó y cómo se divide (mitad y mitad o tu porcentaje habitual). Tus cifras cuentan solo tu parte, la vista del Hogar cuenta el total, e Inicio muestra quién le debe a quién con un botón para saldar cuentas (mueve el saldo, pero no es ingreso ni gasto). Se cambia en Ajustes → Hogar sin borrar nada.
- **Cambiar de espacio en un toque:** en Inicio, un selector pasa de *Todo* a *Compartido*. Con un Hogar conjunto en la nube, pasa de *Lo mío* al Hogar, y un espacio ya abierto en la sesión no vuelve a pedir la frase.

- **Gasto en una línea (celular):** arriba en Inicio y dentro del botón +, escribes "45 Wong", "S/ 12 taxi ayer" o "20 dólares amazon"; los comercios que más usas aparecen como atajos (tocas uno y escribes el monto). Se guarda con categoría sugerida y la última cuenta o tarjeta que usaste, con Deshacer y Editar.
- **Pregúntale a Kipu:** "¿Llego a fin de mes?" (efectivo, pagos por venir, lo que vence, tu gasto habitual y el ahorro planeado; si falta, cuánto conseguir o recortar por día) y "¿Me alcanza?" (con lo disponible, después del día de pago, en cuotas dentro de tu margen mensual o con ahorros sin quedarte sin colchón).
- **Vence pronto y recordatorios:** Inicio muestra lo que vence en los próximos tres días y no está pagado. En Ajustes → Recordatorios de pagos, Kipu avisa con una notificación al abrirse (en iPhone, con Kipu en la pantalla de inicio). Los recibos que paga la tarjeta no se incluyen.
- **Plan para salir de deudas:** en Cifras → Deuda, eliges un pago extra al mes y el orden (primero el interés más alto o el saldo más chico) y ves la fecha sin deudas, el interés y cuánto ahorras.
- **Perú:** reconoce Yape y Plin en los estados de cuenta ("Yape · María López", sin número ni código) y categoriza comercios peruanos como Plaza Vea, Tottus, Rappi, Inkafarma, Movistar, Cineplanet o Saga Falabella. La moneda principal se sugiere según la región del teléfono (es-PE → PEN).

- **Personal y hogar, privados de verdad:** al crear una cuenta, tarjeta, préstamo, recibo, meta o ingreso, o al subir un estado de cuenta, eliges *Personal* o *Hogar*. Con sesión iniciada, tu archivo personal y el del hogar se abren juntos: lo personal se guarda solo en tu archivo cifrado (tu pareja nunca lo recibe) y lo del hogar en el archivo compartido que abren los dos. Los movimientos de una cuenta compartida son del hogar. Arriba de Inicio, Dinero, Plan y Cifras eliges *Personal · Hogar · Todo*.
- **Entrar sin frase en tu dispositivo:** la frase se pide una sola vez por dispositivo. Luego Kipu guarda la llave en el teléfono como una llave no extraíble y abre directo; con Bloqueo de la app, primero pide Face ID, huella o PIN. Cerrar sesión u "Olvidar este dispositivo" la borra.
- **Pagar en otra moneda:** la compra guarda su moneda y monto; si la tarjeta o cuenta es de otra moneda, Kipu estima el cargo (tasa del día más la comisión de esa tarjeta, que aprende de cargos reales) y acepta el monto exacto del banco. Los estados de cuenta que traen monto original y tipo de cambio lo conservan.
- **Pagos de tarjeta sin doble conteo:** un pago de tarjeta nunca es gasto, aunque el banco no diga "pago" (AUTOPAY, emisores como Amex o MBNA). Si el mismo pago aparece en el estado del banco y en el de la tarjeta, se empareja por monto y fecha y cuenta una sola vez.

## Bloqueo

En Settings → App lock puedes pedir un PIN de 6 dígitos (y Face ID, Touch ID o huella si tu dispositivo lo permite) al abrir Kipu y al volver después de un rato. El PIN no se guarda, solo una versión cifrada irreversible. El bloqueo no cifra los datos: mantén también el bloqueo de pantalla de tu teléfono o computadora.

## Tus datos y sincronización

En modo local, todo queda en `localStorage` de este navegador. Si borras los datos del sitio o cambias de navegador, necesitas una copia de seguridad.

En **Settings → Account & sync**, Kipu permite entrar con Google o con correo y contraseña. La persona crea además una frase privada de al menos 12 caracteres para sus datos. Kipu cifra el archivo con AES-GCM y una clave derivada con PBKDF2 antes de enviarlo a Supabase. La frase no sale del dispositivo y no se puede recuperar; es distinta de la contraseña de acceso. Supabase guarda un único archivo cifrado por usuario, protegido por políticas de acceso por fila. Una instalación nueva no tiene cuentas ni datos de ejemplo; los datos locales solo se suben si la persona elige **Move this device’s data to my account**. Los datos de demostración nunca se ofrecen para subir a una cuenta real.

El **Household conjunto** es opcional y separado del archivo personal. Quien lo crea indica el correo de su pareja y elige una frase compartida de al menos 12 caracteres. La pareja inicia sesión con su propia cuenta y usa esa frase para abrir el mismo archivo cifrado. Ambos pueden ver y editar todo lo que agreguen a ese espacio; las cuentas personales siguen separadas. Al crear el Household, empieza con cero cuentas, tarjetas, préstamos y movimientos. La invitación se basa en el correo exacto de una cuenta confirmada y las políticas de Supabase limitan la lectura y escritura al dueño y a la persona invitada. La frase compartida se comunica directamente entre ellos; Kipu no la envía por correo ni puede recuperarla.

El correo de confirmación y recuperación de contraseña y la sesión de autenticación los gestiona Supabase. Las exportaciones JSON son archivos legibles, así que guárdalas en un lugar seguro. El proyecto Kipu ya tiene `https://kipu-prototipo.vercel.app/` como **Site URL** y como redirección permitida. Para que familiares ajenos a la organización Supabase reciban correos de confirmación o recuperación hay que configurar un proveedor SMTP propio en **Authentication → Emails → SMTP Settings**. El servicio de correo incluido con Supabase solo llega a integrantes del proyecto y permite actualmente dos mensajes por hora. Google está conectado, pero la aplicación OAuth aún está en modo de prueba: cada familiar que use Google necesita añadirse como usuario de prueba en Google Cloud hasta publicar la aplicación. Añade los dominios de vista previa que uses como **Redirect URLs** antes de probar inicio de sesión en ellos.

La sincronización comprueba cambios al volver a la pestaña y cada 30 segundos. Si otro dispositivo guardó mientras se editaba aquí, Kipu combina los dos cambios: junta los movimientos, cuentas y metas nuevos de ambos lados y suma las diferencias de saldo, en vez de sobrescribir. Si los dos editan el mismo movimiento a la vez, queda la última versión guardada. Un borrador cifrado de la última escritura pendiente queda en este navegador y se combina igual al reabrir. El modo de cuenta necesita conexión fiable.

## Código

Sitio estático sin compilación: React 18 y htm desde CDN, y el código en `js/`:

- `store.js`: modelo de datos y cálculos
- `readers.js`: lectura de recibos y estados de cuenta
- `ui.js`, `themes.js`, `currency.js`: componentes, paletas y monedas
- `screens-*.js`, `flows.js`: pantallas y formularios
- `lock.js`: bloqueo con PIN y desbloqueo biométrico
- `cloud.js`: cifrado, acceso y sincronización con control de versión
- `i18n.js`, `i18n-es.js`: idioma; las pantallas están escritas en inglés y el texto se reemplaza por su traducción al mostrarse
- `app.js`: navegación y layout

Las pruebas se ejecutan con `node --test tests/*.test.js` (finanzas, nube y lectura de estados de cuenta) (Node.js 18 o posterior). Cubren cálculos financieros, inicio vacío y demo explícita, cifrado de archivos privados y conjuntos, lectura entre dispositivos, fusión de cambios simultáneos, monedas sin tasa, recibos pagados por gastos importados, vista por país y tarjetas bimoneda. Las políticas de Household se verificaron en Supabase con identidades simuladas de dueño, invitado y tercero; la prueba real con dos cuentas de Google debe completarse antes de considerarlo validado para uso habitual.

## Prototipo

Las 202 pantallas de diseño originales siguen en [`/prototipo`](prototipo/).
