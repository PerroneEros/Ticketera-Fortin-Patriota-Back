# Tareas 001 — Cierre de caja auditable, historial liviano y actualización segura de la base

> Spec: `spec.md` (aprobada) · Plan: `plan.md` (aprobado 2026-10-20).
> Regla: una tarea por vez, tests primero, `npm test` + `npm run lint` + `npm run typecheck` al
> cerrar cada una, marcar el checkbox y parar. Nunca se usa la base original de `%APPDATA%`: solo
> copias.
> Decisiones tomadas al aprobar el plan: el detalle de cada caja se toma por `cash_register_id`
> (no por horario) y `GET /api/sales?from&to` se elimina en T35 si no tiene otros consumidores.

## Fase 1 — Mecanismo de migraciones (main)

- [x] **T01 · Fixture de base legada para tests** — RF-29 (2026-10-20, 4 tests en verde)
  Helper de test que crea en un archivo temporal una base con el DDL exacto de la sección 0 del
  plan y datos opcionales (cajas, ventas, ítems, movimientos).
  Hecho cuando: un test compara el `sqlite_master` del helper con el DDL capturado y pasa.

- [x] **T02 · Runner: registro de migraciones** — RF-37, RF-38 (2026-10-20, 4 tests en verde)
  Runner sobre `sqlite3` que crea `schema_migrations`, aplica solo los `id` pendientes de una
  lista recibida y deja `user_version` = último id.
  Hecho cuando: tests verifican que una lista de 2 migraciones de prueba se aplica una vez, se
  registra con `applied_at` y una segunda corrida no aplica nada.

- [x] **T03 · Runner: una sola transacción y error informado** — RF-34, RF-35 (2026-10-20, 2 tests nuevos en verde)
  Todas las pendientes + sus registros en un único `BEGIN IMMEDIATE … COMMIT`; ante error,
  `ROLLBACK` y error tipado con mensaje en español.
  Hecho cuando: un test con una migración que falla en el medio comprueba que el contenido de la
  base (dump de todas las tablas) es idéntico al previo y que no quedó ningún registro nuevo.

- [x] **T04 · Migración 0001_baseline** — RF-28, RF-29 (plan D2) (2026-10-20, 5 tests en verde;
  la lista `MIGRATIONS` se crea en T12, cuando se use)
  `CREATE TABLE IF NOT EXISTS` con el DDL legado; en bases existentes verifica columnas con
  `PRAGMA table_info` y aborta si falta alguna.
  Hecho cuando: tests cubren base vacía (crea las 6 tablas), base legada con datos (sin cambios en
  datos) y base con una columna faltante (aborta, base intacta).

- [x] **T05 · Copia previa con VACUUM INTO** — RF-32, RF-33 (plan D6) (2026-10-20, 6 tests en
  verde; el error de migración también informa la ruta de la copia, para RF-35)
  Copia en `copias-actualizacion/pre-<de>-a-<a>-<timestamp>.sqlite` antes del `BEGIN`, solo si
  hay pendientes y la base ya tenía tablas; `quick_check` sobre la copia.
  Hecho cuando: tests verifican que la copia existe y tiene los mismos datos; que una base nueva o
  sin pendientes no genera copia; y que con la carpeta sin permiso de escritura no se migra y el
  error lo dice.

- [x] **T06 · Retención de 5 copias** — RF-40, RF-41 (2026-10-20, 5 tests en verde)
  Hecho cuando: un test con 6 copias previas simuladas deja 5, borra la más vieja, y si la copia
  nueva falla no borra ninguna.

- [x] **T07 · Reintento tras actualización interrumpida** — RF-36 (2026-10-20, 2 tests en verde;
  sin cambios de código: T03 y T05 ya lo cubrían, incluye un proceso que muere a mitad de la
  transacción)
  Hecho cuando: un test hace fallar la primera corrida y en la segunda verifica que aplica todo
  desde el principio con una copia nueva.

- [x] **T08 · Migración 0002: montos enteros en movimientos** — RF-24, RF-25, RF-26 (plan D3)
  Redondeo con `ROUND` de las filas no enteras, registro de cada una para el reporte y triggers
  `BEFORE INSERT/UPDATE` que rechazan montos no enteros.
  Hecho cuando: tests verifican `10.5→11`, `10.49→10`, `99.999→100`, que los tres quedan
  registrados con monto original y nuevo, que `typeof(amount)` es `integer` en todas las filas, y
  que insertar `10.5` falla.

- [x] **T09 · Reporte de actualización e inconsistencias** — RF-30 (plan D9)
  Archivo `reporte-<timestamp>.txt` con migraciones aplicadas, redondeos y salida de
  `PRAGMA foreign_key_check`; el runner devuelve los conteos.
  Hecho cuando: un test con una venta y un movimiento huérfanos verifica que siguen en la base sin
  cambios y aparecen en el reporte; sin redondeos ni huérfanos el reporte lo indica.

- [x] **T10 · Migración 0003: desglose del cierre** — RF-8, RF-9, RF-17, RF-39 (plan D4)
  4 columnas `INTEGER NULL` en `cash_register`.
  Hecho cuando: tests verifican las columnas nuevas, que las cajas cerradas legadas quedan con
  NULL y que una caja abierta sigue `open` con sus ventas y movimientos.

- [x] **T11 · Migración 0004: índices** — RNF rendimiento (plan D5)
  Hecho cuando: un test verifica con `sqlite_master` los 5 índices y que `EXPLAIN QUERY PLAN` de
  ventas por `cash_register_id` y por `date` usa índice.

- [x] **T12 · initDb usa el runner; modelos al día** — RF-27, RF-28
  `initDB` corre el runner antes de Sequelize y deja de llamar a `sync()`; `amount` pasa a
  `INTEGER` en el modelo y `cash_register` declara las 4 columnas.
  Hecho cuando: un test de deriva compara los atributos de cada modelo con `PRAGMA table_info` de
  una base migrada y pasa.

- [x] **T13 · Tests existentes sobre el esquema real**
  Los tests de servicios reemplazan `sync({ force: true })` por el runner sobre base temporal.
  Hecho cuando: `npm test` pasa completo sin ningún `sync(` en `src/main` fuera de comentarios.

- [~] **T14 · Avisos de arranque** — RF-31, RF-33, RF-35 (textos y conexión en `index.ts` hechos
  con tests; PENDIENTE la prueba manual con `npm run dev`)
  El main muestra el aviso con conteos y ruta del reporte cuando hubo redondeos o inconsistencias,
  y ante error muestra el mensaje con la ruta de la copia y se cierra sin levantar la API.
  Hecho cuando: test unitario de la función que arma los textos (con y sin hallazgos, error) +
  prueba manual con `npm run dev` sobre una copia con un movimiento `10.5` (anotar resultado).

## Fase 2 — Cierre de caja auditable

- [x] **T15 · Servicio: resumen y esperado del cierre** — RF-1, RF-2, RF-3, RF-4, RF-5
  Agregados SQL: apertura, ventas por medio, movimientos por tipo y medio, esperado.
  Hecho cuando: tests cubren ventas efectivo/transferencia/combinado, ingresos y egresos de ambos
  medios, caja vacía (esperado = apertura / 0) y esperado negativo.

- [x] **T16 · `GET /cash-register/totals/:id` con la forma nueva** — RF-1, RF-2
  Hecho cuando: test de controller verifica la forma del plan (sección 4) y 404 para caja
  inexistente.

- [x] **T17 · Schema zod del cierre** — RF-13
  Hecho cuando: tests rechazan contado negativo, con decimales o faltante, indicando el campo, y
  aceptan esperados mostrados negativos.

- [x] **T18 · Cierre transaccional** — RF-8, RF-9, RF-10, RF-14, RF-15
  Recalcula el esperado, guarda contados y esperados, `closing` = suma de contados, `UPDATE`
  condicional a `status = 'open'`; 409 `ALREADY_CLOSED`.
  Hecho cuando: tests verifican lo guardado, que los esperados enviados no se guardan, que un
  segundo cierre da 409 sin cambios y que dos cierres en paralelo dejan uno solo aplicado.

- [x] **T19 · 409 `EXPECTED_CHANGED`** — RF-12
  Hecho cuando: un test registra un movimiento entre la consulta y el cierre y verifica 409 con
  los valores nuevos y la caja todavía abierta.

- [x] **T20 · Modal: esperado del servidor** — RF-1, RF-2, RF-5
  El modal usa la forma nueva de `totals` (ventas y movimientos separados) y muestra negativos.
  Hecho cuando: test jsdom muestra esperado de efectivo y transferencia con los valores del
  servidor, incluido uno negativo.

- [x] **T21 · Modal: reconfirmación y aviso de diferencia** — RF-6, RF-7, RF-11
  Hecho cuando: test jsdom verifica que contado ≠ esperado pide reconfirmar, que tras reconfirmar
  muestra la diferencia por medio y total y habilita "Cerrar Caja", y que contado = esperado no
  pide reconfirmar.

- [x] **T22 · Modal: respuestas 409** — RF-12, RF-14
  Hecho cuando: test jsdom verifica que `EXPECTED_CHANGED` actualiza los esperados y pide volver a
  confirmar, y que `ALREADY_CLOSED` muestra el mensaje y recarga la caja activa.

- [x] **T23 · Historial: desglose del cierre** — RF-16, RF-17
  Hecho cuando: test jsdom muestra esperado, contado y diferencia por medio en una caja con
  desglose, y "Cierre sin desglose (versión anterior)" con el total en una legada.

## Fase 3 — Historial y resumen livianos

- [x] **T24 · Test de equivalencia con oráculo (en rojo)** — RF-19
  Seed con ventas de los 3 medios, ingresos, egresos, aperturas, varias cajas y días; oráculo =
  copia en el test de la lógica actual (`getAllSales` + `summarizeMovements` + agrupación de
  productos + conteos de `DashboardCards`/`DashboardPayments`).
  Hecho cuando: el test existe, compara rango, "todo el tiempo" y por caja, y falla solo porque
  `getSummary` no existe.

- [x] **T25 · `getSummary`: dinero y conteos** — RF-18, RF-19, RF-22
  Hecho cuando: la parte de dinero, `salesCount`, `unitsCount` y `operations` del test de T24
  pasa, y un rango vacío devuelve todo en 0.

- [x] **T26 · `getSummary`: productos y filtro por caja** — RF-19
  Hecho cuando: el test de T24 pasa completo (productos por nombre, orden por cantidad, por caja).

- [x] **T27 · Ruta `GET /api/sales/summary`** — RF-18
  Schema zod de query (fechas válidas, a lo sumo un filtro).
  Hecho cuando: tests de controller cubren rango, caja, sin filtros, fechas inválidas y ambos
  filtros (400).

- [x] **T28 · Contexto del dashboard usa el resumen** — RF-18, RF-22
  Deja de pedir `getSalesByDateRange`; guarda el resumen del rango.
  Hecho cuando: test jsdom verifica que al cargar no se llama a la lista de ventas, y que un
  rango vacío muestra "Sin movimientos en el período".

- [x] **T29 · Caja del historial: detalle al expandir** — RF-20, RF-21, RF-23
  Encabezado con el resumen por caja; detalle por `GET /sales/cash-register/:id` al expandir,
  cacheado hasta `refreshData`; error con "Reintentar".
  Hecho cuando: tests jsdom verifican que una caja contraída no pide detalle, que expandir lo pide
  una vez, y que un error muestra el mensaje y reintentar vuelve a pedir solo esa caja.

- [x] **T30 · Tarjetas, pagos y productos desde el resumen** — RF-19
  `DashboardView`, `DashboardCards`, `DashboardPayments`, `DashboardProducts` reciben el resumen.
  Hecho cuando: tests jsdom con un resumen fijo muestran los mismos números que hoy con las ventas
  equivalentes, y ningún componente del dashboard importa la lista de ventas del rango.

- [x] **T31 · PDF de caja con detalle bajo demanda** (cambio: el PDF solo necesita totales y
  productos, así que usa el resumen de la caja, sin pedir el detalle; contenido igual. PENDIENTE
  comparar el PDF a ojo con la versión anterior)
  Si la caja no está expandida, pide el detalle antes de generar; el contenido no cambia.
  Hecho cuando: test jsdom verifica que imprimir una caja contraída pide su detalle una vez, y
  prueba manual del PDF sobre la copia de la base de prueba coincide con el de la versión actual.

## Fase 4 — Herramientas, prueba con datos y cierre

- [x] **T32 · `tools/db/try-migration`** (hecho como `npm run db:try-migration`, lógica en
  `src/main/database/testing/tryMigration.ts`; no hizo falta dependencia nueva)
  Copia la base indicada a temporal (original solo lectura), agrega los casos faltantes (centavos,
  huérfanos), cuenta filas y totales por caja, migra, recuenta y compara.
  Hecho cuando: corre sobre una base legada de test y reporta "sin diferencias".

- [x] **T33 · `tools/db/seed-volume` y medición** — RNF rendimiento (`npm run db:volume`. En la
  PC de desarrollo: ~20.000 ventas, actualización 131 ms, resumen total 29 ms, detalle de caja de
  1.500 ventas 173 ms. PENDIENTE medir en una PC de 4 GB)
  Siembra 20.000 ventas y 200 cajas en una copia y mide resumen total, detalle de una caja de
  1.500 ventas y duración de la migración.
  Hecho cuando: el script imprime los 3 tiempos y se anotan en este archivo (con la aclaración de
  que la PC de 4 GB queda pendiente).

- [~] **T34 · Prueba sobre la base de prueba del equipo** — Criterio de finalización (2026-10-20:
  "sin diferencias", original intacta (mismo MD5), 0→4 en 46 ms. PENDIENTE abrir la copia
  restaurada con la versión anterior instalada)
  `try-migration` sobre una copia de `%APPDATA%/ticketera-fortin/baseTicketera.sqlite`, más volver
  atrás: restaurar la copia previa y abrirla con la versión anterior.
  Hecho cuando: salida "sin diferencias" anotada aquí y la versión anterior abre la copia
  restaurada con los mismos totales.

- [x] **T35 · Quitar `GET /api/sales?from&to`**
  Hecho cuando: no queda ningún consumidor (búsqueda en `src/`), se eliminan ruta, controller,
  `getAllSales` y `getSalesByDateRange`, y `npm test` pasa.

- [~] **T36 · Runbook de actualización** (`docs/runbook-actualizacion.md` escrito; solo el paso
  de prueba en copia se ejecutó. PENDIENTE instalar y volver atrás en una caja real)
  `docs/runbook-actualizacion.md` con instalación, qué hacer si falla y cómo volver atrás (plan,
  sección 8).
  Hecho cuando: el documento existe y cada paso fue ejecutado al menos una vez en T34.

- [x] **T37 · Validación de la spec** (`validacion.md`; demo manual PENDIENTE)
  Recorrer RF-1 a RF-41 y los RNF indicando test y resultado; demo manual: abrir caja, vender en
  los 3 medios, ingreso y egreso, cerrar con diferencia (reconfirmación y aviso), ver el cierre en
  el historial y el PDF.
  Hecho cuando: tabla RF → test → resultado escrita en `specs/001-…/validacion.md`, `npm test`,
  `npm run lint` y `npm run typecheck` sin errores nuevos, y veredicto "spec cumplida" o la lista
  de lo que falta.
