import { spawn } from 'node:child_process'
import { chmod, copyFile } from 'node:fs/promises'
import { join } from 'node:path'

const PIN_ROOT = join(process.cwd(), 'tools', 'research', 'phreeqc-pin', '3.8.6-17100')
export const PHREEQC_DATABASE = join(PIN_ROOT, 'database', 'minteq.v4.dat')
let activeProcesses = 0

export function phreeqcExecutable(platform: string = process.platform, arch: string = process.arch) {
  if (arch === 'x64' && platform === 'win32') return join(PIN_ROOT, 'bin', 'phreeqc.exe')
  if (arch === 'x64' && platform === 'linux') return join(PIN_ROOT, 'bin', 'phreeqc-linux-x64')
  throw new Error('PHREEQC chỉ hỗ trợ máy chủ Windows x64 hoặc Linux x64.')
}

export async function runPhreeqc(args: string[], cwd: string): Promise<void> {
  if (activeProcesses >= 4) throw new Error('PHREEQC đang bận. Vui lòng thử lại sau.')
  let executable = phreeqcExecutable()
  activeProcesses++
  try {
    if (process.platform === 'linux') {
      // Deployed assets can be read-only and lose their execute bit during a
      // Windows upload. Only the request's disposable /tmp directory is changed.
      const scratchExecutable = join(cwd, 'phreeqc')
      try {
        await copyFile(executable, scratchExecutable)
        await chmod(scratchExecutable, 0o700)
      } catch {
        throw new Error('Không thể khởi động PHREEQC trên máy chủ.')
      }
      executable = scratchExecutable
    }
    await new Promise<void>((resolve, reject) => {
      const child = spawn(executable, args, { cwd, windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] })
      let failure: Error | undefined
      const timeout = setTimeout(() => {
        failure = new Error('PHREEQC quá thời gian xử lý. Vui lòng thử lại.')
        child.kill('SIGKILL')
      }, 10_000)
      // Drain diagnostics without retaining native paths or unbounded output.
      child.stderr?.resume()
      child.once('error', () => { failure = new Error('Không thể khởi động PHREEQC trên máy chủ.') })
      child.once('close', (code) => {
        clearTimeout(timeout)
        if (failure) reject(failure)
        else if (code !== 0) reject(new Error('PHREEQC không chạy thành công.'))
        else resolve()
      })
    })
  } finally {
    // Keep the slot until the native process has actually closed.
    activeProcesses--
  }
}
