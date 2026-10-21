import { EventEmitter } from 'node:events'
import { PassThrough } from 'node:stream'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

vi.mock('node:child_process', () => ({ spawn: vi.fn() }))
vi.mock('node:fs/promises', () => ({ copyFile: vi.fn(), chmod: vi.fn() }))
import { copyFile, chmod } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { phreeqcExecutable, runPhreeqc } from '@/server/phreeqc-runtime.js'

function child() {
  return Object.assign(new EventEmitter(), { stderr: new PassThrough(), kill: vi.fn() })
}

beforeEach(() => { vi.spyOn(process, 'platform', 'get').mockReturnValue('win32') })
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); vi.clearAllMocks() })

it('selects pinned native binaries and refuses unsupported platforms', () => {
  expect(phreeqcExecutable('win32', 'x64')).toMatch(/phreeqc\.exe$/)
  expect(phreeqcExecutable('linux', 'x64')).toMatch(/phreeqc-linux-x64$/)
  expect(() => phreeqcExecutable('darwin', 'arm64')).toThrow(/hỗ trợ/)
})

it('drains only bounded diagnostics, ignores stdin/stdout and handles exit failures', async () => {
  const process = child()
  vi.mocked(spawn).mockReturnValue(process as unknown as ReturnType<typeof spawn>)
  const result = runPhreeqc(['input', 'report', 'database'], '/tmp')
  const rejected = expect(result).rejects.toThrow(/^PHREEQC không chạy thành công\.$/)
  expect(vi.mocked(spawn).mock.calls[0]?.[2]).toMatchObject({ stdio: ['ignore', 'ignore', 'pipe'], windowsHide: true })
  process.stderr.write('sensitive path'.repeat(10000))
  process.emit('close', 1)
  await rejected
})

it('kills a hung process at ten seconds and retains its slot until close', async () => {
  vi.useFakeTimers()
  const processes = Array.from({ length: 4 }, child)
  for (const process of processes) vi.mocked(spawn).mockReturnValueOnce(process as unknown as ReturnType<typeof spawn>)
  const runs = processes.map(() => runPhreeqc([], '/tmp'))
  const rejected = runs.map((run) => expect(run).rejects.toThrow(/quá thời gian/))
  await vi.advanceTimersByTimeAsync(10000)
  expect(processes.every((process) => process.kill.mock.calls[0]?.[0] === 'SIGKILL')).toBe(true)
  await expect(runPhreeqc([], '/tmp')).rejects.toThrow(/đang bận/)
  processes.forEach((process) => process.emit('close', null))
  await Promise.all(rejected)
  const next = child()
  vi.mocked(spawn).mockReturnValueOnce(next as unknown as ReturnType<typeof spawn>)
  const run = runPhreeqc([], '/tmp')
  next.emit('close', 0)
  await expect(run).resolves.toBeUndefined()
})

it('reports a missing executable safely and releases capacity after close', async () => {
  const process = child()
  vi.mocked(spawn).mockReturnValue(process as unknown as ReturnType<typeof spawn>)
  const result = runPhreeqc([], '/tmp')
  const rejected = expect(result).rejects.toThrow(/khởi động/)
  process.emit('error', new Error('ENOENT private filesystem path'))
  process.emit('close', -2)
  await rejected
})

it('copies Linux executable into writable scratch space and sets execute permission', async () => {
  const platform = vi.spyOn(process, 'platform', 'get').mockReturnValue('linux')
  const processChild = child()
  vi.mocked(spawn).mockReturnValue(processChild as unknown as ReturnType<typeof spawn>)
  const result = runPhreeqc([], '/scratch/sample')
  await vi.waitFor(() => expect(spawn).toHaveBeenCalled())
  expect(copyFile).toHaveBeenCalledWith(expect.stringMatching(/phreeqc-linux-x64$/), expect.stringMatching(/sample[\\/]phreeqc$/))
  expect(chmod).toHaveBeenCalledWith(expect.stringMatching(/sample[\\/]phreeqc$/), 0o700)
  processChild.emit('close', 0)
  await expect(result).resolves.toBeUndefined()
  platform.mockRestore()
})
