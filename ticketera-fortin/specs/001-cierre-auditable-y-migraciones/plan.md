# Plan 001 — Cierre de caja auditable, historial liviano y actualización segura de la base

> Estado: APROBADO (2026-10-20). Spec: `spec.md` (v3, aprobada el 2026-10-20).
> Sin código: contratos y decisiones. Las tareas van en `tasks.md` tras aprobar este plan.

## 0. Punto de partida (medido sobre una copia de la base de prueba de esta PC, 2026-10-20)

- Esquema creado por `sequelize.sync()`: 6 tablas (`Category`, `Products`, `cash_register`,
  `Sales`, `Sale_items`, `Cash_movements`). **No hay ningún índice** además de las PK (SQLite no
  indexa las FK solo).
- `Sales.cash_register_id` y `Sale_items.sale_id` tienen `ON DELETE CASCADE`.
  `Cash_movements.cash_register_id` es FK sin cascada. Ninguna tabla referencia a
  `Cash_movements`.
- `Cash_movements.amount` está declarado `DECIMAL(10,2)` (afinidad NUMERIC en SQLite).
- `PRAGMA user_version = 0`, `journal_mode = delete`. SQLite incluido en `sqlite3@6.0.1`: 3.52.0.
- Datos: 4 cajas (1 abierta), 226 ventas, 823 ítems (todos con `quantity = 1`: un ítem por
  unidad), 1 movimiento, 0 montos con centavos, 0 huérfanos. Faltan casos para probar redondeo,
  huérfanos y volumen: se agregan a la copia (sección 7).
- Fechas guardadas como texto `YYYY-MM-DD HH:MM:SS.SSS +00:00` (UTC).
- El main hace `await initDB()` antes de `listen`, y la app tiene bloqueo de instancia única
  (auditoría #12): nadie más toca la base mientras se actualiza.
- Hallazgo: `GET /cash-register/totals/:id` hoy devuelve ventas **y movimientos** sumados en un
  mismo número; la tarjeta "Efectivo ventas" del cierre muestra ese número mezclado.

## 1. Módulos y responsabilidades

| Módulo | Cambio | RF |
|---|---|---|
| `main/database/migrations/` (nuevo) | Runner de migraciones + lista ordenada de migraciones | RF-24–41 |
| `main/database/backup.ts` (nuevo) | Copia previa, verificación y retención de 5 | RF-32, 33, 40, 41 |
| `main/database/initDb.ts` | Deja de usar `sync()`; llama al runner antes de inicializar modelos | RF-27, 28 |
| `main/index.ts` | Muestra aviso de reporte (RF-31) o error y cierra (RF-33, 35) | RF-31, 33, 35 |
| `main/model/cash_registers.ts`, `cash_movements.ts` | Columnas nuevas del cierre; `amount` INTEGER | RF-8, 9, 24 |
| `main/services/cashRegisterService.ts` | `getCloseSummary` (esperado por medio) y `closeRegister` transaccional | RF-1–15 |
| `main/schemas/cashRegisterSchema.ts` | Schema zod del cierre nuevo | RF-13 |
| `main/services/salesService.ts` + ruta nueva | `getSummary` con agregados SQL por rango o por caja | RF-18, 19, 22 |
| `renderer/.../cashRegister/cashRegsiterClose.tsx` | Reconfirmación, aviso de diferencia, manejo de 409 | RF-1, 2, 5–7, 11, 12 |
| `renderer/.../context/dashboardContext.tsx` y `dashboard/*` | Resumen del servidor; detalle por caja bajo demanda | RF-16–23 |
| `tools/db/` (nuevo, fuera del instalador) | Script para probar la migración sobre una copia y sembrar volumen | Criterios de finalización |

## 2. Decisiones (con la alternativa descartada)

**D1. Mecanismo de migraciones: runner propio, sin dependencias nuevas.**
Un módulo que abre la base con `sqlite3` (ya instalado, lo usa Sequelize), lee la tabla
`schema_migrations`, y aplica en orden las migraciones pendientes declaradas como un array en
código (`{ id, name, up(db) }`), todas dentro de **una** transacción `BEGIN IMMEDIATE … COMMIT`.
Corre antes de que Sequelize abra la base.
- Descartada **Umzug**: resolvería lo mismo, pero es una dependencia más para ~80 líneas, y su
  carga de archivos por glob choca con el bundle de electron-vite y el bytecode del main.
- Descartada **`sync({ alter: true })`**: en SQLite reconstruye tablas copiando datos, sin backup
  ni registro, y con `ON DELETE CASCADE` puede borrar ventas e ítems. Incompatible con la
  constitución (principios 3, 4 y 6).
- Descartado **sequelize-cli**: pensado para correr a mano desde consola, no dentro de una app
  instalada sin red.
- Por qué conexión `sqlite3` propia y no transacciones de Sequelize: el dialecto SQLite de
  Sequelize abre otra conexión por transacción y activa `foreign_keys` en cada una; con una
  conexión propia controlamos pragmas y orden exacto.

**D2. Línea base para instalaciones existentes.**
Migración `0001_baseline`: `CREATE TABLE IF NOT EXISTS` con el DDL exacto que hoy genera
`sync()` (capturado en la sección 0). En una base nueva crea todo (RF-28); en una base existente
no cambia nada, pero antes **verifica** con `PRAGMA table_info` que cada tabla tenga las columnas
esperadas. Si falta alguna, aborta sin tocar nada (RF-35): significa una instalación más vieja
que no conocemos y no queremos adivinar.
- Descartado mantener `sync()` para bases nuevas y migraciones solo para existentes: dos fuentes
  del esquema que pueden divergir; las bases nuevas y las actualizadas terminarían distintas.

**D3. `amount` a enteros sin reconstruir la tabla.**
Migración `0002`: `UPDATE Cash_movements SET amount = CAST(ROUND(amount) AS INTEGER)` solo para
filas con `typeof(amount) <> 'integer'`, registrando antes cada fila afectada en el reporte
(RF-25, 26). `ROUND` de SQLite redondea 0,5 hacia arriba en positivos (RF-25; un monto negativo,
que no debería existir, se redondea alejándose de cero y además se reporta como inconsistencia).
Se agregan triggers `BEFORE INSERT/UPDATE` que abortan si `typeof(NEW.amount) <> 'integer'`, y el
modelo pasa a `INTEGER`. Verificable: `SELECT count(*) WHERE typeof(amount) <> 'integer'` = 0.
- Descartada la **reconstrucción de la tabla** (crear `Cash_movements_new` con `INTEGER`, copiar,
  borrar, renombrar): con `foreign_keys` activo, un movimiento huérfano haría fallar la copia y
  RF-30 exige conservarlo; desactivar FKs en medio exige otra conexión y más pasos que pueden
  fallar. El tipo declarado en el DDL quedaría `DECIMAL(10,2)`, pero en SQLite es solo afinidad:
  lo que se guarda es entero y el trigger lo garantiza. Costo aceptado.

**D4. Datos del cierre: columnas nuevas en `cash_register`.**
Migración `0003`: `ALTER TABLE cash_register ADD COLUMN` × 4, todas `INTEGER NULL`:
`counted_cash`, `counted_transfer`, `expected_cash`, `expected_transfer`.
- `NULL` = caja cerrada con la versión anterior ("sin desglose", RF-17) o caja abierta.
- `closing` se sigue llenando con `counted_cash + counted_transfer`, para que la versión anterior
  (si se reinstala) y el PDF actual sigan funcionando.
- Las diferencias **no se guardan**: se calculan como contado − esperado al mostrarlas (RF-11).
  Guardarlas duplicaría datos que podrían quedar inconsistentes.
- Descartada una tabla aparte `cash_register_closings` (1 a 1): permitiría varios arqueos por
  caja, pero reabrir o corregir cierres está fuera de alcance; hoy solo agrega un JOIN.

**D5. Índices.**
Migración `0004`: `Sales(date)`, `Sales(cash_register_id)`, `Sale_items(sale_id)`,
`Cash_movements(cash_register_id)`, `Cash_movements(date)`. Los dos que no pedía la auditoría
(`Sales.cash_register_id` y `Cash_movements.date`) los usan el esperado por caja y el resumen por
rango. `cash_register(opened_at)` no: la tabla tiene una fila por evento.
- Costo: escribir una venta actualiza 2 índices más en `Sales` y 1 en `Sale_items`;
  despreciable frente a los 10 s del cobro.

**D6. Copia previa con `VACUUM INTO`.**
Sobre la conexión del runner, antes del `BEGIN`: `VACUUM INTO '<userData>/copias-actualizacion/
pre-<versión-origen>-a-<versión-destino>-<AAAAMMDD-HHmmss>.sqlite'`. Luego se abre la copia en
solo lectura y se corre `PRAGMA quick_check`; si falla, se borra la copia incompleta y se aborta
(RF-33). Retención: con la copia nueva verificada, se borran las más viejas hasta dejar 5
(RF-40, 41). Solo se copia si hay migraciones pendientes **y** la base ya tenía tablas.
- Descartado `fs.copyFile` del archivo: requiere asegurar que no haya ninguna conexión abierta ni
  journal pendiente; `VACUUM INTO` produce una copia consistente desde SQLite (≥ 3.27, tenemos
  3.52).

**D7. Atomicidad y corte de luz.**
Todas las migraciones pendientes + las filas de `schema_migrations` van en una sola transacción.
Con `journal_mode = delete`, si se corta la luz SQLite deshace la transacción al reabrir
(RF-34); en el arranque siguiente las migraciones siguen pendientes y se reintenta todo, con
copia nueva (RF-36). Las copias de intentos fallidos cuentan para la retención de 5.

**D8. Registro de migraciones.**
Tabla `schema_migrations(id INTEGER PRIMARY KEY, name TEXT NOT NULL, applied_at TEXT NOT NULL)`
(RF-37). El runner aplica solo los `id` que no estén (RF-38). Además deja
`PRAGMA user_version` = último id, como dato rápido para soporte. No hay detección de versiones
más nuevas (decisión del 2026-10-20).

**D9. Reporte de actualización.**
Archivo de texto en `copias-actualizacion/reporte-<timestamp>.txt` con: migraciones aplicadas,
movimientos redondeados (id, monto original, monto nuevo) y la salida de
`PRAGMA foreign_key_check` (registros que apuntan a filas inexistentes), que se conservan sin
tocar (RF-30). Si hubo redondeos o inconsistencias, el main muestra un aviso con los conteos y la
ruta (RF-31). Solo se genera si se aplicó alguna migración.

**D10. Cierre: el servidor calcula, la pantalla solo muestra.**
- Esperado (RF-3, 4) con agregados SQL dentro de la transacción del cierre:
  `expected_cash = opening + Σ Sales.cash_amount + Σ ingresos efectivo − Σ egresos efectivo` y
  el equivalente para transferencias.
- Cierre atómico: `UPDATE … WHERE cash_register_id = ? AND status = 'open'`; si afecta 0 filas,
  la caja ya estaba cerrada (RF-14, cubre el doble clic).
- RF-12 (esperado cambió): la pantalla manda el esperado que mostró; si difiere del recalculado,
  el servidor responde 409 con los valores nuevos y no cierra. Ese valor solo se compara, nunca
  se guarda (RF-10).
- Descartado calcular el esperado en la pantalla y validarlo en el servidor: dos lugares con la
  misma fórmula, que es justo el problema que tiene hoy.

**D11. Dashboard: resumen agregado por el servidor y detalle por caja bajo demanda.**
- Un `getSummary` en el main que devuelve, por rango o por caja, exactamente los números que hoy
  arma la pantalla con `summarizeMovements`, `isRealSale` y la agrupación de productos: con
  `SUM`/`COUNT` y `GROUP BY` en SQL, sin traer filas de detalle (RF-18, 19).
- Misma semántica que hoy: ventas y movimientos se filtran por `date`, aperturas por `opened_at`,
  y las aperturas suman a ingresos en efectivo (decisión 2026-10-20). Productos agrupados por
  nombre, como hoy.
- Diferencia a vigilar: hoy cada caja toma sus ventas **por horario** (entre apertura y cierre);
  el detalle nuevo las toma **por `cash_register_id`**, que es lo correcto. Con datos sanos da lo
  mismo; el test de equivalencia (sección 6) lo confirma sobre la base de prueba.
- El detalle de una caja (`GET /sales/cash-register/:id`, ya existe) se pide al expandirla
  (RF-20) y queda cacheado en el contexto hasta `refreshData` (RF-21). La caja abierta arranca
  expandida, como hoy.
- El PDF de una caja necesita el detalle: si la caja no está expandida, se pide antes de generar.
  El contenido del PDF no cambia (fuera de alcance).
- Descartado paginar `getAllSales`: sigue mandando miles de filas para calcular totales que el
  servidor puede devolver en una fila.

## 3. Modelo de datos (después de las migraciones)

```
cash_register  (+ counted_cash, counted_transfer, expected_cash, expected_transfer: INTEGER NULL)
Cash_movements (amount: valores enteros garantizados por trigger; declarado DECIMAL(10,2))
schema_migrations (id, name, applied_at)                                   -- nueva
Índices: Sales(date), Sales(cash_register_id), Sale_items(sale_id),
         Cash_movements(cash_register_id), Cash_movements(date)
```
Sin cambios en `Category`, `Products`, `Sales` (columnas), `Sale_items`. `printed` se mantiene.

Migraciones: `0001_baseline`, `0002_cash_movements_integer_amount`, `0003_cash_register_closing_breakdown`,
`0004_indexes`. Las cuatro se aplican juntas en la primera actualización.

## 4. Contratos de API (todos con `x-api-token`, entrada validada con zod)

**`GET /api/cash-register/totals/:id`** (cambia la forma; único consumidor: el cierre)
```
200 { opening, sales: { cash, transfer },
      movements: { cashIn, cashOut, transferIn, transferOut },
      expected: { cash, transfer } }        // enteros; expected puede ser negativo (RF-5)
404 { message: 'Caja no encontrada.' }
```

**`PUT /api/cash-register/close/:id`** (cambia el body)
```
body { countedCash: int ≥ 0, countedTransfer: int ≥ 0,
       shownExpectedCash: int, shownExpectedTransfer: int }
200 { message, cashRegister }   // con counted_*, expected_*, closing = counted_cash + counted_transfer
400 { message, field }          // RF-13: negativo, decimales o faltante
404 { message: 'Caja no encontrada.' }
409 { code: 'ALREADY_CLOSED', message }                        // RF-14
409 { code: 'EXPECTED_CHANGED', message, expected: { cash, transfer } }   // RF-12
```

**`GET /api/cash-register?from&to`** (sin cambios de forma): cada caja trae además
`counted_*` y `expected_*` (null = sin desglose, RF-17).

**`GET /api/sales/summary?from&to`** o **`?cash_register_id=`** (nuevo; exactamente uno de los dos
filtros, o ninguno para "todo el tiempo")
```
200 { salesCount, unitsCount,
      money: { cashIn, cashOut, transferIn, transferOut, cashBalance, transferBalance, total },
      operations: { cash, transfer },          // conteos que hoy muestra DashboardPayments
      products: [{ name, quantity, total }] }  // ordenado por quantity desc
400 si las fechas no son válidas o vienen ambos filtros
```
Rango vacío → todos los números en 0 y `products: []` (RF-22).

**`GET /api/sales/cash-register/:id`**: sin cambios (detalle de una caja).
**`GET /api/sales?from&to`**: queda sin uso en el dashboard; se elimina en la última tarea si no
hay otro consumidor.

## 5. Impacto

- **Datos:** 4 migraciones aditivas; la única que modifica valores es el redondeo de `amount`
  (reportado). Nada se borra.
- **API:** dos contratos cambian (`totals`, `close`); los consume solo el renderer del mismo
  build, así que no hay clientes viejos.
- **UI:** modal de cierre (reconfirmación, aviso, 409) e historial (resumen del servidor, detalle
  al expandir, desglose en cajas cerradas, "Cierre sin desglose (versión anterior)").
- **Permisos:** sin cambios (la contraseña de administrador es otra spec).
- **Impresión:** no se toca. Rendimiento de venta: solo los índices nuevos en escritura.
- **Versión anterior sobre base migrada:** su `sync()` no toca tablas existentes; ignora las
  columnas nuevas y `schema_migrations`. Si cierra una caja, el desglose queda en NULL. Funciona,
  pero el camino soportado para volver atrás es restaurar la copia (sección 8).

## 6. Estrategia de tests (Vitest)

**Runner y copia (unitarios, base en archivo temporal):**
- Base nueva → crea todo, registra 0001–0004 (RF-28, 37).
- Base con el DDL legado de la sección 0 y datos → mismas cantidades y montos antes/después
  (RF-26, 29); caja abierta sigue abierta (RF-39).
- Correr dos veces → la segunda no aplica nada ni hace copia (RF-38).
- Migración que falla a propósito en el medio → base idéntica a la original (checksum de
  contenido) y error informado (RF-34, 35).
- Directorio de copias sin permiso de escritura → no migra (RF-33).
- Seis actualizaciones → quedan 5 copias, se borró la más vieja y solo después de la nueva
  (RF-40, 41).
- Movimientos `10.5`, `10.49`, `99.999` → `11`, `10`, `100` y aparecen en el reporte (RF-25, 26).
- Movimiento y venta huérfanos → se conservan y aparecen en el reporte (RF-30).
- Base con una columna faltante → aborta sin cambios (D2).
- Trigger: insertar `amount = 10.5` falla (RF-24).
- **Deriva de esquema:** para cada modelo Sequelize, sus atributos coinciden con
  `PRAGMA table_info` de la base migrada. Los tests de servicios existentes pasan a usar el runner
  en vez de `sync({ force: true })`, para probar contra el esquema real.

**Cierre (integración servicio + controller):**
- Fórmula del esperado con ventas efectivo/transferencia/combinado, ingresos y egresos de ambos
  medios, y caja vacía (RF-3, 4).
- Esperado negativo se guarda (RF-5). Contado negativo o decimal → 400 (RF-13).
- Esperado mostrado distinto → 409 y la caja sigue abierta (RF-12). Valores esperados enviados
  nunca se guardan (RF-10).
- Ya cerrada → 409 sin cambios; dos cierres en paralelo → uno solo gana (RF-14, 15).

**Cierre (renderer, jsdom + Testing Library):** contado ≠ esperado pide reconfirmar (RF-6); tras
reconfirmar muestra el aviso con la diferencia y habilita cerrar (RF-7); 409 `EXPECTED_CHANGED`
muestra los valores nuevos (RF-12); historial muestra desglose o "sin desglose" (RF-16, 17).

**Dashboard:**
- **Equivalencia (RF-19):** sobre una base sembrada (ventas de los tres medios, ingresos,
  egresos, aperturas, varias cajas y días), el resumen del servidor coincide número por número
  con `summarizeMovements` + agrupación de productos aplicados a la salida de `getAllSales`
  actual, que se conserva en el test como oráculo.
- Rango vacío (RF-22). Contexto: no pide detalle de cajas contraídas (RF-21); error al cargar
  una caja muestra mensaje y permite reintentar (RF-23).

**Rendimiento (script, no corre en `npm test`):** `tools/db/seed-volume` siembra 20.000 ventas
y 200 cajas en una copia; mide resumen de "todo el tiempo" (< 2 s), detalle de una caja de 1.500
ventas (< 1 s) y duración de la migración (< 30 s). Se mide en esta PC y se anota que la medición
en una PC de 4 GB queda pendiente para la caja real.

**Prueba sobre la base de prueba del equipo:** `tools/db/try-migration <ruta>` copia la base a
una carpeta temporal (la original se abre solo en lectura), le agrega los casos que le faltan,
cuenta filas y totales por caja, migra, vuelve a contar y compara. Imprime el reporte.

## 7. Datos de prueba

Base de esta PC (`%APPDATA%/ticketera-fortin/baseTicketera.sqlite`), siempre copiada antes de
usarla. A la copia se le agregan: 1 movimiento con centavos, 1 venta y 1 movimiento huérfanos,
y (para rendimiento) el volumen sembrado. Ajusta el principio 6 de la constitución según la
decisión del 2026-10-20 (redacción propuesta en el chat, pendiente de aplicar por el equipo).

## 8. Despliegue y vuelta atrás

**Instalación en una caja con datos:**
1. Instalar entre eventos, nunca con un evento en curso (puede haber una caja abierta; se
   conserva, pero conviene cerrarla antes).
2. Abrir la app: migra sola. Si hubo redondeos o inconsistencias aparece el aviso con la ruta del
   reporte.
3. Revisar en el historial que las cajas anteriores aparezcan con los mismos totales.

**Si la actualización falla:** la base queda como estaba (D7), la app avisa y se cierra.
Reinstalar la versión anterior y reportar el error con el archivo de reporte.

**Si la actualización salió bien pero hay que volver atrás:**
1. Cerrar la app.
2. Copiar `copias-actualizacion/pre-…sqlite` sobre `baseTicketera.sqlite` (renombrar antes la
   actual, no borrarla).
3. Instalar la versión anterior.
Lo que se haya vendido después de la actualización está solo en la base renombrada; recuperarlo
es manual. Por eso el paso 3 de la instalación se hace antes del siguiente evento.

Se documenta en un apartado de `docs/` (runbook) en la última tarea.

## 9. Cobertura de RF

| RF | Dónde | Test |
|---|---|---|
| 1–4 | D10, `totals` | Fórmula del esperado |
| 5 | D10 | Esperado negativo |
| 6, 7 | Modal de cierre | Renderer |
| 8, 9, 10 | D4, D10, `close` | Integración cierre |
| 11 | Modal e historial (derivado) | Renderer |
| 12 | D10 (409) | Integración + renderer |
| 13 | zod `close` | Integración |
| 14, 15 | D10 (UPDATE condicional) | Integración, paralelo |
| 16, 17 | Historial, D4 (NULL) | Renderer |
| 18, 19, 22 | D11, `summary` | Equivalencia, rango vacío |
| 20, 21, 23 | D11, contexto | Renderer |
| 24–26 | D3 | Runner |
| 27–29, 39 | D1, D2 | Runner |
| 30, 31 | D9 | Runner |
| 32, 33, 40, 41 | D6 | Runner |
| 34–36 | D7 | Runner (fallo inducido) |
| 37, 38 | D8 | Runner |
| RNF rendimiento | D5, D11 | Script de volumen |

## 10. Riesgos

- **Bytecode y `sqlite3` en ia32:** el runner usa el mismo `sqlite3` que ya usa Sequelize; no
  agrega riesgo nuevo, pero el build ia32 sigue sin verificarse (auditoría, pendiente 2).
- **Instalaciones con esquema distinto al de la sección 0:** D2 aborta sin tocar nada; el costo
  es que esa caja no se actualiza hasta revisar su base a mano. Preferible a adivinar.
- **Tiempo de migración en bases grandes:** crear 5 índices sobre ~100.000 filas en una PC lenta
  se mide con el script de volumen; si supera 30 s, la app debe mostrar "Actualizando base…"
  antes de bloquear (se agrega como tarea si hace falta).
- **Diferencia horario vs. `cash_register_id` (D11):** si alguna base vieja tiene ventas con
  horarios fuera de su caja, el historial nuevo las mostrará en su caja real. El test de
  equivalencia sobre la base de prueba lo detecta.
- **Disco lleno:** `VACUUM INTO` necesita espacio igual al tamaño de la base; si falla, no se
  migra (RF-33) y la app no abre hasta liberar espacio.
