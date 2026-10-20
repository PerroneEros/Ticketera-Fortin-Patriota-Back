import sqlite3 from 'sqlite3'

// Thin promise wrapper over sqlite3. Migrations and backups use their own connection, outside
// Sequelize, so pragmas and transaction boundaries are fully under our control.
export interface SqliteDb {
  exec(sql: string): Promise<void>
  run(sql: string, params?: unknown[]): Promise<{ changes: number; lastID: number }>
  all<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>
  close(): Promise<void>
}

export function openSqlite(
  filePath: string,
  options: { readonly?: boolean } = {}
): Promise<SqliteDb> {
  const mode = options.readonly
    ? sqlite3.OPEN_READONLY
    : sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE

  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(filePath, mode, (openError) => {
      if (openError) {
        reject(openError)
        return
      }
      resolve({
        exec: (sql) =>
          new Promise((res, rej) => db.exec(sql, (error) => (error ? rej(error) : res()))),
        run: (sql, params = []) =>
          new Promise((res, rej) =>
            db.run(sql, params, function (this: sqlite3.RunResult, error: Error | null) {
              if (error) rej(error)
              else res({ changes: this.changes, lastID: this.lastID })
            })
          ),
        all: <T>(sql: string, params: unknown[] = []) =>
          new Promise<T[]>((res, rej) =>
            db.all(sql, params, (error, rows) => (error ? rej(error) : res(rows as T[])))
          ),
        close: () => new Promise((res, rej) => db.close((error) => (error ? rej(error) : res())))
      })
    })
  })
}
