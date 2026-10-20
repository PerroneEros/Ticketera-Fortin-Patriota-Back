import { existsSync } from 'fs'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Capture the command instead of sending anything to a real printer.
const execFileMock = vi.hoisted(() => vi.fn())
vi.mock('child_process', () => ({
  execFile: (file: string, args: string[], callback: (error: Error | null) => void) => {
    execFileMock(file, args)
    const outcome = execFileMock.mock.results.at(-1)?.value
    callback(outcome instanceof Error ? outcome : null)
  }
}))

import { printerService } from './printerService'

const copiedFile = (call: unknown[]): string => (call[1] as string[])[3]

beforeEach(() => {
  execFileMock.mockReset()
})

describe('printerService.printTickets', () => {
  it('copies the tickets to the POS printer share without going through a shell string', async () => {
    await printerService.printTickets(['Coca Cola'])

    expect(execFileMock).toHaveBeenCalledOnce()
    const [file, args] = execFileMock.mock.calls[0]
    expect(file).toBe('cmd.exe')
    expect(args.slice(0, 3)).toEqual(['/c', 'copy', '/b'])
    expect(args[4]).toBe('\\\\127.0.0.1\\POSPrinter')
  })

  it('uses a different temp file for each job so concurrent sales do not overwrite each other', async () => {
    await Promise.all([printerService.printTickets(['A']), printerService.printTickets(['B'])])

    const files = execFileMock.mock.calls.map(copiedFile)
    expect(new Set(files).size).toBe(2)
  })

  it('removes the temp file after sending the job', async () => {
    await printerService.printTickets(['Pancho'])

    expect(existsSync(copiedFile(execFileMock.mock.calls[0]))).toBe(false)
  })

  it('reports a failed copy to the caller and still cleans up', async () => {
    execFileMock.mockReturnValueOnce(new Error('printer offline'))

    await expect(printerService.printTickets(['Pancho'])).rejects.toThrow('printer offline')
    expect(existsSync(copiedFile(execFileMock.mock.calls[0]))).toBe(false)
  })
})
