# Validación 001 — Cierre de caja auditable, historial liviano y actualización segura de la base

Fecha: 2026-10-20. Rama `chore/claude-sdd-setup`, sin commitear.
Resultado de la suite: `npm test` → 31 archivos y 191 tests en verde, 2 archivos manuales
omitidos (`*.run.test.ts`, se corren a pedido).

Leyenda: ✅ cubierto por test automatizado en verde · 🟡 cubierto en parte / falta prueba manual.

## A. Cierre de caja auditable

| RF | Test que lo cubre | Resultado |
|---|---|---|
| RF-1, RF-2 | `cashRegisterService.test.ts` (getCloseSummary), `cashRegisterController.test.ts` (GET totals), `cashRegisterClose.test.tsx` ("shows the expected amounts computed by the server") | ✅ |
| RF-3, RF-4 | `cashRegisterService.test.ts` ("splits sales and movements per method…", "expects the opening amount…") | ✅ |
| RF-5 | `cashRegisterService.test.ts` ("negative expectations", "stores a negative expectation as is"), `cashRegisterClose.test.tsx` (muestra `$-2.000,00`) | ✅ |
| RF-6 | `cashRegisterClose.test.tsx` ("asks to confirm again…", "asks again if the cashier changes…") | ✅ |
| RF-7 | `cashRegisterClose.test.tsx` ("…then warns and allows closing") | ✅ |
| RF-8, RF-9 | `cashRegisterService.test.ts` ("stores counted and server-computed expected amounts…") | ✅ |
| RF-10 | `cashRegisterService.test.ts` ("never stores the expected amounts sent by the screen") | ✅ |
| RF-11 | `cashRegisterClose.test.tsx` (diferencia por medio y total), `ClosingBreakdown.test.tsx` | ✅ |
| RF-12 | `cashRegisterService.test.ts` (ExpectedChangedError), `cashRegisterController.test.ts` (409 EXPECTED_CHANGED), `cashRegisterClose.test.tsx` ("reloads the expected amounts…") | ✅ |
| RF-13 | `schemas.test.ts` (closeRegisterSchema), `cashRegisterController.test.ts` (400 con `field`) | ✅ |
| RF-14 | `cashRegisterService.test.ts` ("refuses to close a register that is already closed"), controller 409, modal ALREADY_CLOSED | ✅ |
| RF-15 | `cashRegisterService.test.ts` ("applies only one of two simultaneous closes", "…leaving it untouched") | ✅ |
| RF-16 | `ClosingBreakdown.test.tsx` ("shows expected, counted and difference…") | ✅ |
| RF-17 | `ClosingBreakdown.test.tsx` ("marks registers closed by an older version…"), `0003_0004.test.ts` (quedan en NULL) | ✅ |

## B. Historial y resumen livianos

| RF | Test que lo cubre | Resultado |
|---|---|---|
| RF-18 | `Dashboard.test.tsx` ("asks the API for the range summary instead of every sale"), `salesController.test.ts` | ✅ |
| RF-19 | `salesSummaryService.test.ts`: compara con una copia congelada de la lógica anterior para 5 rangos (incluido el día que en UTC ya es el siguiente) y para cada caja; `Dashboard.test.tsx` ("summary cards") | ✅ |
| RF-20 | `Dashboard.test.tsx` ("loads the detail once when a register is expanded", "loads the open register right away") | ✅ |
| RF-21 | `Dashboard.test.tsx` ("does not load the detail of collapsed registers") | ✅ |
| RF-22 | `salesSummaryService.test.ts` ("returns zeros…"), `Dashboard.test.tsx` ("says there was nothing in an empty period") | ✅ |
| RF-23 | `Dashboard.test.tsx` ("shows an error on the register that failed and retries only that one") | ✅ |

## C. Montos enteros en movimientos

| RF | Test que lo cubre | Resultado |
|---|---|---|
| RF-24 | `0002_cash_movements_integer_amount.test.ts` (triggers), `schemaDrift.test.ts` (modelo INTEGER) | ✅ |
| RF-25 | `0002…test.ts` (10.5→11, 10.49→10, 99.999→100) | ✅ |
| RF-26 | `0002…test.ts` ("records every rounded movement…"), `report.test.ts` | ✅ |

## D. Actualización segura de la base

| RF | Test que lo cubre | Resultado |
|---|---|---|
| RF-27 | `schemaDrift.test.ts` + `testDb.ts` (todos los tests de servicios corren sobre la base migrada); arranque real (`initDB` → `runMigrations`) | 🟡 falta abrir la app real (`npm run dev` / instalador) |
| RF-28 | `0001_baseline.test.ts` ("creates the six legacy tables on an empty database"), `backup.test.ts` ("does not copy a brand-new database") | ✅ |
| RF-29 | `0001_baseline.test.ts` ("leaves an existing legacy database…"), `tryMigration.test.ts`, prueba sobre la base de esta PC (abajo) | ✅ |
| RF-30 | `report.test.ts` ("keeps orphan rows untouched and lists them"), `0002…test.ts` (montos no numéricos o no positivos) | ✅ |
| RF-31 | `startupMessages.test.ts` (textos del aviso) | 🟡 falta ver el diálogo en la app real |
| RF-32 | `backup.test.ts` ("copies an existing database…") | ✅ |
| RF-33 | `backup.test.ts` ("does not migrate when the copy cannot be written"), `startupMessages.test.ts` | ✅ (diálogo real 🟡) |
| RF-34 | `runner.test.ts` ("leaves the database exactly as it was…"), `retry.test.ts` (proceso que muere a mitad de la transacción) | ✅ (corte de luz real no simulable) |
| RF-35 | `runner.test.ts` (MigrationError), `backup.test.ts` ("tells where the copy is…"), `startupMessages.test.ts` | ✅ (diálogo real 🟡) |
| RF-36 | `retry.test.ts` | ✅ |
| RF-37, RF-38 | `runner.test.ts` | ✅ |
| RF-39 | `0003_0004.test.ts` (caja abierta sigue abierta), `tryMigration` sobre la base de esta PC (tenía una caja abierta) | ✅ |
| RF-40, RF-41 | `backup.test.ts` (retention) | ✅ |

## Requisitos no funcionales

| RNF | Evidencia | Resultado |
|---|---|---|
| Offline | Nada nuevo usa red; la API sigue en 127.0.0.1. | ✅ |
| Montos enteros | Esperados, contados y diferencias son INTEGER; zod `.int()`. | ✅ |
| Historial < 2 s / detalle < 1 s con 20.000 ventas | `npm run db:volume` en esta PC: resumen total 29 ms, detalle de caja de 1.500 ventas 173 ms. | 🟡 medido en la PC de desarrollo, falta una PC de 4 GB |
| Actualización < 30 s | Misma medición: 131 ms con ~20.000 ventas y ~39.000 ítems; 46 ms con la base de esta PC. | 🟡 idem |
| Venta < 10 s tras actualizar | Solo se agregaron índices (escritura apenas más cara); no se midió con la impresora. | 🟡 |
| Windows x64 e ia32 | Sin dependencias nuevas; `sqlite3` ya estaba. Build x64 OK. | 🟡 build ia32 sin verificar (pendiente previo) |

## Prueba sobre la base de prueba del equipo (T34)

`npm run db:try-migration` con `%APPDATA%\ticketera-fortin\baseTicketera.sqlite`:

- Original abierta solo en lectura: mismo MD5 antes y después (`9d050cd3…a07b`).
- Copia con 2 casos agregados (movimiento de $10,50; venta y movimiento de una caja inexistente).
- Versión 0 → 4 en 46 ms. Filas antes y después: Category 1, Products 3, cash_register 4,
  Sales 227, Sale_items 823, Cash_movements 3.
- Reporte: 1 monto redondeado (10.5 → 11), 2 inconsistencias conservadas.
- **Resultado: sin diferencias.**

Volver atrás: verificado que la copia previa contiene la base sin migrar (`tryMigration.test.ts`).
**No verificado**: abrir esa copia con la versión anterior instalada.

## Veredicto

**Spec cumplida a nivel de código y tests.** Para cerrarla del todo faltan pruebas manuales que
no se pueden hacer desde acá:

1. Abrir la app (`npm run dev` o instalador) sobre una copia con datos y ver la actualización, el
   aviso del reporte y el cierre con diferencia (reconfirmación + aviso) en la UI real.
2. Ver el PDF de una caja y compararlo con el de la versión anterior.
3. Volver atrás: restaurar la copia previa y abrirla con la versión anterior.
4. Medir en una PC de 4 GB y probar el build ia32.

`npm run lint`: 157 errores en todo el proyecto (antes 177), todos en código previo; los archivos
nuevos no tienen errores. `npm run typecheck`: main 0 errores; renderer 48 (antes 50), todos
previos.
