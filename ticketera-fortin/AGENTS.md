# AGENTS.md — Ticketera Fortín Patriota

## Proyecto
App de escritorio (Electron + electron-vite) para vender en caja e imprimir tickets
por producto en impresora térmica. El proceso main levanta una API Express en
`localhost:34567` con SQLite (Sequelize) en la carpeta userData; el renderer es React
y consume esa API con axios. La ficha completa está en `docs/ficha.md`.
El repo git está en la carpeta padre; todo el código vive en `ticketera-fortin/`.

## Estructura
- `src/main/` proceso main: `routes/` → `controllers/` → `services/` → `model/` (Sequelize),
  `schemas/` (validación con zod), `database/` (conexión y sync).
- `src/preload/` puente entre main y renderer.
- `src/renderer/src/` React: `components/` por feature, `components/context/` (estado),
  `components/service/` (llamadas a la API local).

## Comandos (desde `ticketera-fortin/`)
- Desarrollo: `npm run dev`
- Lint: `npm run lint` · Formato: `npm run format`
- Tipos: `npm run typecheck`
- Build Windows: `npm run build:win`
- Tests: `npm test` (Vitest). Tests junto al código como `*.test.ts(x)`; los del renderer
  empiezan con `// @vitest-environment jsdom`.

## Estilo y convenciones
- TypeScript. Prettier: comillas simples, sin punto y coma, ancho 100, sin trailing comma.
- Main en inglés (modelos, rutas, servicios); UI y mensajes al usuario en español.
- Commits en español con formato `tipo: descripción` (ej. `fix: evitar doble impresión al cobrar`).
- Ramas: `main` + `Dev`, cambios por PR aprobado por otro integrante.

## Reglas
- Lee `docs/ficha.md`, `docs/constitution.md` (si existe) y la spec activa en `specs/`
  antes de tocar código. Features nuevas siguen el flujo SDD (spec → plan → tareas).
- La base se crea con `sequelize.sync()` y no hay migraciones: cualquier cambio de modelo
  puede romper bases ya instaladas en la caja. Proponé plan de migración y esperá confirmación.
- Validá toda entrada de la API con los schemas de zod existentes.
- No cambies la configuración de la impresora sin poder probarla; avisá qué no se pudo verificar.
- No agregues dependencias nativas sin verificar compatibilidad con la versión de Electron.
- La app es 100 % offline (la PC de la caja no tiene red) y corre en Windows 10/11 x64 e ia32.
- Nunca borrar físicamente ventas, movimientos ni cajas; montos siempre en pesos enteros.
- Las acciones sensibles (movimientos, cambio de método de pago, eliminar productos) se
  validan con la contraseña de administrador en el main, no solo en la UI.
- No hacer commit ni push sin pedido explícito.

## Al terminar cualquier tarea
- Ejecutá `npm run lint` y `npm run typecheck` y reportá el resultado real.
- Si la tarea tiene tests, ejecutalos y confirmá que pasan.
- Si toca impresión, indicá qué hay que probar con la impresora real.
