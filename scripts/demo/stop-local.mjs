import { spawnSync } from 'node:child_process'

if (!process.env.npm_execpath) {
  process.stderr.write('Hãy chạy npm run demo:stop.\n')
  process.exit(1)
}
const result = spawnSync(process.execPath, [process.env.npm_execpath, 'exec', '--', 'supabase', '--workdir', process.cwd(), 'stop'], { stdio: 'inherit', windowsHide: true })
process.exitCode = result.status ?? 1
