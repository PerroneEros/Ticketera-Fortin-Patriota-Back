# Auditoría de código — 2026-10-20

Alcance: todo `src/` (main, preload, renderer), CSP de `index.html`, configuración de build y
dependencias. Rama: `chore/claude-sdd-setup` (adelantada a `main` en `6946d01`).

Estado: ✅ aplicado con tests · ⏳ pendiente (requiere spec y/o migración) · ⚠️ aplicado, falta
probarlo en la caja real.

## Resumen

| # | Sev. | Hallazgo | Estado |
|---|---|---|---|
| 1 | 🔴 | API local sin auth, CORS abierto y escuchando en todas las interfaces | ✅ |
| 2 | 🔴 | Licencia falsificable (secreto HMAC dentro del binario) y ofuscación no configurada | ✅ ⚠️ |
| 3 | 🔴 | `DELETE /api/sales/:id` borraba ventas físicamente | ✅ |
| 4 | 🟡 | `quantity` sin tope (crash por memoria) y montos con decimales | ✅ |
| 5 | 🟡 | Movimientos de caja sin validación (montos negativos) | ✅ |
| 6 | 🟡 | El total cobrado podía diferir del que veía el cajero | ✅ |
| 7 | 🟡 | `executeSale`: N+1, lecturas fuera de la transacción, se vendían productos deshabilitados | ✅ |
| 8 | 🟡 | Impresión: archivo temporal compartido, errores silenciados | ✅ ⚠️ |
| 9 | 🟡 | "Hoy" del dashboard en UTC (después de las 21 h mostraba el día siguiente) | ✅ |
| 10 | 🟡 | El cierre de caja no guarda desglose ni diferencia | ⏳ |
| 11 | 🟡 | `sandbox: false`, IPC genérico expuesto, CSP con `unsafe-eval` | ✅ ⚠️ |
| 12 | 🟡 | Error de base de datos ignorado; se podían abrir dos instancias | ✅ |
| 13 | 🟡 | Hook condicional en `CategoryFilter` | ✅ |
| 14 | 🟡 | El dashboard carga todo el historial; faltan índices | ⏳ |
| 15 | 🔵 | Cálculo de montos duplicado en 5 componentes | ✅ |
| 16 | 🔵 | Código muerto y dependencias sin uso | ✅ |
| 17 | 🔵 | Categorías: logs de depuración y borrado no atómico | ✅ |

## Detalle

### 🔴 1. API local abierta
**Riesgo:** con `cors()` abierto, cualquier página abierta en un navegador de la caja (y, durante
una sesión de TeamViewer con red, cualquier equipo de esa red) podía crear ventas, registrar
movimientos, cerrar la caja o borrar ventas llamando a `http://localhost:34567/api`. La futura
contraseña de administrador se podía saltear llamando a la API directo.
**Cambio:** la API escucha solo en `127.0.0.1`; cada arranque genera un token aleatorio que el
renderer obtiene por el preload (`getApiToken`) y manda en `x-api-token` (`apiClient.ts`); CORS
restringido a los orígenes de la app. Archivos: `main/apiAuth.ts`, `main/index.ts`,
`renderer/.../service/apiClient.ts` y los 4 services.
**Verificado:** prueba de humo del build: escucha solo en `127.0.0.1:34567`, responde 401 sin
token o con token incorrecto.

### 🔴 2. Licencias
**Riesgo:** extrayendo `app.asar`, el secreto `Ticketera_UltraSecreto` y el algoritmo estaban en
texto plano: cualquiera podía generar licencias para cualquier PC. `javascript-obfuscator` estaba
instalado pero no se usaba en el build.
**Cambio:** firmas Ed25519. La app solo tiene la clave **pública** (`main/licensePublicKey.ts`);
la privada queda con el encargado. Scripts en `tools/license/` (excluidos del instalador).
El main se compila a bytecode V8 (`build.bytecode` de electron-vite).
**Pendiente (bloqueante para instalar):** generar el par de claves y pegar la pública en
`licensePublicKey.ts` (ver `tools/license/README.md`). Hasta entonces **ninguna licencia es
válida** y la app muestra "Sistema Bloqueado". Las licencias emitidas con el esquema anterior
dejan de valer. No verificado: que el bytecode compilado en una PC de 64 bits funcione en una caja
de 32 bits.

### 🔴 3. Borrado físico de ventas
Eliminados la ruta `DELETE /api/sales/:id`, su controller y `cancelSale` (y `GET /:id`, sin uso).
Las anulaciones están fuera de alcance; si algún día se necesitan, van como baja lógica con spec.

### 🟡 4. Topes y enteros en los schemas
`quantity` entero entre 1 y 500, máximo 100 productos distintos por venta, y `.int()` en
precios, aperturas, cierres y montos. Los topes 500/100 son supuestos: ajustarlos si hace falta.

### 🟡 5. Movimientos de caja
Nuevo `createMovementSchema` (tipo, método, monto entero positivo, descripción 3–200 caracteres) y
`cashMovementService`, siguiendo las capas routes → controllers → services.
**Pendiente:** la columna `amount` es `DECIMAL(10,2)`; pasarla a `INTEGER` requiere migración.

### 🟡 6. Total esperado
El carrito manda `expectedTotal` (lo que vio el cajero) y el servidor rechaza la venta si los
precios cambiaron. El error se muestra también como toast porque el modal tapa el carrito.
El payload ya no manda campos que la API descartaba, ni hace un `GET /current` extra por venta.

### 🟡 7. `executeSale`
Una sola consulta de productos (solo activos) dentro de la transacción, funciones
`buildSaleItems` y `resolvePayment`, e impresión con los nombres ya cargados.

### 🟡 8. Impresión ⚠️
Archivo temporal único por trabajo, `execFile` en lugar de `exec`, el error llega al llamador y el
archivo se borra al terminar. El formato del ticket no cambió. **Probar con la impresora real**
(en particular, usuarios de Windows con espacios en el nombre).

### 🟡 9. Fecha local
`toLocalDateString` reemplaza `toISOString().split('T')[0]` en el dashboard.

### 🟡 10. Cierre de caja ⏳
`closing` guarda efectivo + transferencias sumados; el esperado y la diferencia solo existen en la
UI. Necesita columnas nuevas (contado y esperado por medio de pago) calculadas en el servidor →
spec + migración.

### 🟡 11. Sandbox y CSP ⚠️
`sandbox: true`, el preload expone solo `api` (sin `ipcRenderer` genérico), CSP sin
`'unsafe-eval'` y `connect-src` limitado a la API. **Probar `npm run dev`** (no se verificó la UI
en modo desarrollo).

### 🟡 12. Arranque
`initDB` propaga el error: la app muestra un aviso y se cierra en vez de abrir sin base. Bloqueo
de instancia única y aviso si el puerto está ocupado.

### 🟡 13. Hooks
`useProductList()` antes del `return` condicional en `CategoryFilter`.

### 🟡 14. Rendimiento del dashboard ⏳
"Todo el tiempo" trae todas las ventas con un ítem por unidad (~3.000 filas por evento) y cada caja
filtra la lista completa. Propuesta: cargar las ventas de cada caja al expandirla
(`GET /sales/cash-register/:id` ya existe), resumen por rango calculado en el servidor, e índices
en `Sales.date`, `Sale_items.sale_id` y `Cash_movements.cash_register_id` vía migración.

### 🔵 15. Cálculo de montos unificado
`utils/cashSummary.ts` (`summarizeMovements`, `isRealSale`, `formatMoney`) reemplaza las 5 copias
en el dashboard y el PDF. Además, los nombres de producto se escapan en el HTML del PDF.

### 🔵 16. Código muerto eliminado
`CashRegisterOpen`, `Versions`, `ipcHandle`, canal `ping`, listeners de `caja-actualizada`,
`filasMovimientos`, `registerList`, `getSales`/`getSalesByFilter`, rama de filtro viejo,
`getCategoryById` (front), `getRegisterById`, `getProductById`, `salesInputs.ts`, dependencias
`javascript-obfuscator` y `better-sqlite3`. Se mantiene la columna `printed` hasta la migración.

### 🔵 17. Categorías
Alta con búsqueda puntual (sin logs ni traer todas), nombre recortado, y reasignación + borrado en
una transacción.

## Verificación (2026-10-20)

| Chequeo | Antes | Después |
|---|---|---|
| Tests (`npm test`) | 4 | 73, todos pasan |
| Typecheck main | 1 error | 0 |
| Typecheck renderer | 59 errores | 50 (todos previos) |
| Lint | 208 errores | 177 (ningún archivo tocado empeoró) |
| Build (`npm run build`) | — | OK, main en bytecode |

## Pendientes

1. Generar el par de claves de licencia y cargar la pública (bloqueante para instalar).
2. Probar en la caja: impresión real, `npm run dev`, build ia32.
3. Specs: cierre de caja auditable (#10) y rendimiento del dashboard (#14), con la migración de
   `amount` a INTEGER (#5) y los índices.
