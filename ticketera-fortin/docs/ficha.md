# Ficha de proyecto — Ticketera Fortín Patriota

> Fuente de verdad del proyecto. Las secciones ★ son el mínimo para arrancar.
> `[PENDIENTE]` = falta completar. `[DEDUCIDO: fuente]` = sacado del código, a confirmar.
> Para actualizarla: pedile a Claude "completemos la ficha" (skill `ficha-proyecto`).

## 1. Identidad ★
- Nombre: Ticketera Fortín (productName TicketeraFortin)
- Qué es, en una línea: punto de venta de escritorio que cobra e imprime un ticket por unidad vendida, con caja diaria, movimientos de caja, historial y resumen de ventas.
- Problema que resuelve y para quién: cantina/buffet del club Fortín Patriota en eventos y partidos. Reemplaza el registro manual y agiliza la cola (se cobra una vez y se entrega un ticket por producto para retirar). Además da control administrativo: registro de ingresos y egresos (movimientos de caja), consulta de qué y cuánto se vendió en cualquier fecha, e historial de cajas anteriores con filtros.
- Objetivo de negocio y métricas de éxito:
  - Cobrar e imprimir en menos de 10 segundos por venta.
  - Cierre de caja sin diferencias de arqueo.
  - Cero ventas registradas perdidas.
  - Trazabilidad total: toda venta, movimiento, apertura, cierre y cambio queda registrado y es auditable.
- Etapa: en producción, usada en eventos reales en una sola PC de caja, con datos reales que no se pueden perder.
- Hitos y fechas límite: ninguno por ahora.
- Módulos activos: escritorio, web (renderer React), backend_datos (API local + SQLite).

## 2. Usuarios y roles ★
- Cajero: vende y cobra. Sin contraseña.
- Encargado/responsable: único que conoce la contraseña de administrador. Con ella registra ingresos y egresos, cambia el método de pago de una venta y elimina productos. [A IMPLEMENTAR]
- Contraseña de administrador: una sola, compartida por los responsables; la define y la cambia el equipo de desarrollo, no el usuario final. [A IMPLEMENTAR]
- Roles hoy implementados: ninguno (sin auth en la API ni en la UI).
- Volumen: diseñar para más de 1000 ventas por evento (ya se hicieron +400 sin problemas). Cantidad de productos sin tope práctico. Una sola caja por instalación.

## 3. Alcance ★
- Funcionalidades existentes: ABM de productos y categorías (con activar/desactivar), carrito y cobro en efectivo, transferencia o combinado, impresión de tickets térmicos, apertura y cierre de caja, movimientos de caja, historial con fechas y filtros, dashboard de resumen, impresión a PDF.
- Prioridad:
  - Imprescindible: vender, cobrar, imprimir tickets, abrir y cerrar caja.
  - Importante: movimientos de caja, historial con filtros, dashboard, ABM de categorías, alta y edición de productos, PDF.
  - Deseable: eliminar productos.
- Flujo crítico: abrir caja con monto inicial → seleccionar productos al carrito → cobrar → seleccionar método de pago → confirmar → imprimir tickets → registrar movimientos → cerrar caja con arqueo → consultar historial.
- Fuera de alcance: factura electrónica AFIP/ARCA, cobro con tarjeta o integración con Mercado Pago, varias cajas en red, venta online, control de stock, anulación de ventas, reimpresión de tickets desde el historial.

## 4. Plataformas y experiencia
- Plataformas: solo escritorio Windows (instalador NSIS y portable). Mac y Linux configurados en el build pero sin uso.
- Equipo de la caja: Windows 10/11, de 64 y de 32 bits, 4 GB de RAM o más, sin red (ni wifi ni ethernet), sin pantalla táctil.
- Idiomas de la UI: español.
- Accesibilidad exigida: [PENDIENTE]
- Diseño: CSS propio por componente, branding con logo y guarda pampa.

## 5. Stack y versiones ★
- Lenguaje y runtime: TypeScript 5.9, Node de Electron 39.
- Framework(s): Electron 39 + electron-vite 5, React 19.2, React Router 7, Vite 7, Express 5.
- Base de datos y ORM: SQLite (`baseTicketera.sqlite` en userData) con Sequelize 6; validación con zod 4.
- UI / estado / navegación: CSS plano, React Context, react-router-dom, react-hot-toast.
- Impresión: node-thermal-printer (EPSON, cola compartida `\\127.0.0.1\POSPrinter`).
- Gestor de paquetes: npm. Repo: código en subcarpeta `ticketera-fortin/`.
- Hosting e infraestructura: ninguna, todo local y offline.

## 6. Arquitectura
- Estilo: monolito local. Main = API Express por capas (routes → controllers → services → models). Renderer = React que llama a la API por HTTP. [DEDUCIDO]
- Decisiones ya tomadas (y por qué): [PENDIENTE] (¿por qué Express por HTTP en vez de IPC?)
- Patrones obligatorios: capas del main y validación con zod. [DEDUCIDO]
- Patrones o tecnologías prohibidas: [PENDIENTE]

## 7. Datos
- Entidades principales: category 1–N product; sales 1–N sale_items N–1 product; cash_register 1–N sales; cash_movements. [DEDUCIDO: model/associations.ts]
- Montos: pesos enteros, sin centavos (INTEGER).
- Datos personales o sensibles: ninguno.
- Backups [A IMPLEMENTAR]: al cerrar la caja, copia automática de la base y de los PDF del cierre a una carpeta local, conservando las últimas 30. Opción de exportar una copia a pendrive. Sin nube (la PC no tiene red).
- Datos existentes a migrar: sí, hay instalaciones con datos reales; todo cambio de modelo necesita migración.

## 8. Integraciones
- Autenticación: ninguna hoy.
- Otras: impresora térmica EPSON por cola de Windows.
- Secretos: hoy ninguno. Con el sistema de licencias, la clave privada del generador es un secreto del equipo y nunca va dentro de la app.

## 9. Requisitos no funcionales
- Concurrencia: una caja por instalación.
- Offline: 100 % offline, la PC no tiene red.
- Corte de luz: una venta confirmada se persiste antes de imprimir y no se pierde. Los tickets pendientes quedan en la cola de impresión y salen al volver la luz. [A VERIFICAR con la impresora real]
- Rendimiento: menos de 10 s entre confirmar el cobro e imprimir; fluido con más de 1000 ventas por evento en PCs de 4 GB de RAM.

## 10. Seguridad y cumplimiento
- Autenticación y sesiones: ninguna hoy. Contraseña de administrador para acciones sensibles (ver sección 2). [A IMPLEMENTAR]
- Licencias [A IMPLEMENTAR]: cada PC se habilita con una licencia generada por un generador de claves propio. Si la app detecta un cambio de computadora, pide licencia de nuevo. Funciona offline.
- Protección del código [A IMPLEMENTAR]: ofuscación, para dificultar la lectura.
- Normativa: no se emite factura electrónica (fuera de alcance).
- Auditoría y trazabilidad: ventas y movimientos de caja quedan registrados. Sin anulaciones. Hoy un error de método de pago se corrige con dos movimientos (egreso del método erróneo + ingreso del correcto); se planea reemplazarlo por un cambio directo del método de pago, que debe quedar auditado (valor anterior, nuevo y fecha).
- Pentest o revisión de seguridad planificada: [PENDIENTE]

## 11. Infraestructura y operación
- Entornos y CI/CD: sin CI. Builds manuales con `npm run build:win`.
- Distribución y actualización: a mano, con USB o por acceso remoto (TeamViewer o similar).
- Monitoreo y alertas: solo console.log.
- Presupuesto: [PENDIENTE]

## 12. Equipo y proceso ★
- Equipo: 3 personas (brunofernandez87, Ivo Depari, PerroneEros), nivel intermedio. Todos tocan todo.
- Zonas protegidas: ninguna.
- Flujo de Git: `main` + `Dev`, PRs en github.com/PerroneEros/Ticketera-Fortin-Patriota-Back.
- Convención de commits: en español, formato `tipo: descripción` (ej. `fix: evitar doble impresión al cobrar`).
- Linters y formatters: ESLint (config @electron-toolkit) + Prettier.
- Definición de terminado: pasan lint, tipos y tests; probado en la app real (con impresora si toca impresión); aprobado en PR por otro integrante.

## 13. Calidad
- Framework de tests: Vitest (comparte configuración con Vite). Empezar por la lógica del main (ventas, caja, licencias) y sumar tests con cada arreglo; luego el renderer. [A CONFIGURAR]
- Cobertura mínima: [PENDIENTE]
- Reglas de revisión de código: un integrante distinto del autor aprueba el PR.

## 14. Convenciones de código
- Estructura de carpetas: ver AGENTS.md.
- Idioma: código del main en inglés, UI en español, commits en español.
- Manejo de errores y logging: console.log/console.error. Formato deseado: [PENDIENTE]

## 15. Cómo quiero que trabajes ★
- Nivel de explicación: breve; más detalle en decisiones importantes. Si hay una duda puntual, bajar el nivel técnico.
- Preguntar o asumir: preguntar antes de cambios en la base o en la impresión; en lo demás avanzar declarando supuestos.
- Tolerancia a dependencias nuevas: solo justificadas.
- Confirmación: nunca commit ni push sin pedido explícito.

## 16. Estado actual
- Qué ya existe y funciona: ver sección 3. Último trabajo: impresión a PDF y "cambios final" (2026-09-30).
- Backlog (2026-10-20):
  1. Bug: impresión doble de tickets al presionar dos veces "cobrar".
  2. Ofuscar el código.
  3. Licencias por PC con generador de claves propio; pedir licencia si cambia la computadora.
  4. Contraseña de administrador para ingresos/egresos, cambio de método de pago y eliminar productos.
  5. Eliminar un producto.
  6. Cambiar el método de pago desde el historial (reemplaza la corrección con dos movimientos).
  7. Crear, editar y eliminar productos sin tener que abrir caja.
  8. Backups automáticos al cerrar caja (base + PDF) y exportación a pendrive.
- Bugs y deuda técnica conocidos:
  - Sin tests automatizados.
  - Esquema con `sequelize.sync()` sin migraciones: cambiar un modelo puede romper bases instaladas.
  - Configuración de build duplicada: `build` en package.json (appId com.fortinPatriotas.ticketera) y electron-builder.yml (appId com.electron.app).
  - Puerto 34567 fijo y nombre de impresora hardcodeado.
  - Dos drivers de SQLite instalados (better-sqlite3 y sqlite3).
- Riesgos identificados:
  - API local sin auth, con CORS abierto y escuchando en todas las interfaces. Como la PC no tiene red el riesgo baja, pero cualquier página abierta en un navegador de la caja podría llamarla. Mitigar escuchando solo en 127.0.0.1 con token, o pasando a IPC. Sin esto, la contraseña de administrador se puede saltear llamando a la API directo.
  - `sandbox: false` en la ventana principal.
  - Sin backups de la base local hasta implementar el ítem 8.
  - La ofuscación en Electron solo dificulta leer el código, no lo impide. La protección real contra copias es la licencia firmada con una clave privada que no salga del equipo.
  - Cambio de hardware (disco, placa) dispara pedido de licencia: hace falta un procedimiento de reactivación.
  - PCs de 32 bits: requieren un build ia32 aparte; verificar que Electron 39 y los drivers de SQLite lo soporten. [NO VERIFICADO]
  - Cola de impresión ante corte de luz: no está garantizado que Windows conserve los trabajos tras un apagado brusco, y no hay reimpresión. Probar con la impresora real.
  - Contraseña única compartida: no identifica quién hizo cada acción, y cambiarla depende del equipo de desarrollo.
  - Eliminar productos con ventas asociadas no debe borrar las ventas: probablemente baja lógica.
  - Cambio de método de pago y movimientos de corrección: definir en la spec cómo conviven en el arqueo para no duplicar montos.

## 17. Glosario de dominio
- Caja (cash register): sesión de venta con apertura (monto inicial), ventas, movimientos y cierre con arqueo.
- Ticket: comprobante impreso por cada unidad vendida (2 Coca-Colas = 2 tickets).
- Movimiento de caja: ingreso o egreso en efectivo o transferencia, que no es una venta. Se usa para retiros de efectivo, devoluciones (egreso) y, hoy, para corregir un método de pago erróneo (egreso + ingreso).
- Pago combinado: parte en efectivo y parte por transferencia.

## 18. Registro de decisiones y supuestos
- [2026-10-20] Ficha creada a partir del análisis del código.
- [2026-10-20] Ficha completada en entrevista con PerroneEros. Decisiones: sin anulaciones ni reimpresión, montos enteros, Vitest para tests, backups locales al cerrar caja, licencias por PC, contraseña de administrador única gestionada por el equipo.
