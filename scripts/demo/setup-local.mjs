import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createLocalEnv, parseEnv } from './local-env.mjs'

if (process.argv.includes('--help')) {
  process.stdout.write('Cần Node.js và Docker Desktop đang chạy. Chạy npm ci rồi npm run demo:setup.\nLệnh khởi động Supabase local, áp dụng migrations và tự tạo .env.local; không kết nối project hosted.\n')
  process.exit(0)
}

try {
  const envPath = resolve('.env.local')
  const previous = existsSync(envPath) ? readFileSync(envPath, 'utf8') : ''
  const currentUrl = parseEnv(previous).NEXT_PUBLIC_SUPABASE_URL
  if (currentUrl && !['localhost', '127.0.0.1', '[::1]'].includes(new URL(currentUrl).hostname)) throw new Error('Không ghi đè môi trường hosted hiện có.')
  const docker = spawnSync('docker', ['info', '--format', '{{.ServerVersion}}'], { encoding: 'utf8', timeout: 15_000, windowsHide: true })
  if (docker.status !== 0) throw new Error('Hãy mở Docker Desktop, chờ Engine running rồi chạy lại npm run demo:setup.')
  if (!process.env.npm_execpath) throw new Error('Hãy chạy bằng npm run demo:setup.')
  if (!existsSync(resolve('supabase/config.toml'))) throw new Error('Thiếu supabase/config.toml. Hãy giải nén đầy đủ bản source trước khi chạy setup.')
  const supabase = args => spawnSync(process.execPath, [process.env.npm_execpath, 'exec', '--', 'supabase', '--agent', 'no', '--workdir', process.cwd(), ...args], { encoding: 'utf8', windowsHide: true, maxBuffer: 16 * 1024 * 1024, timeout: 20 * 60_000 })
  process.stdout.write('Đang chuẩn bị Supabase local. Lần đầu cần tải Docker images, có thể mất vài phút…\n')
  const started = supabase(['start', '--exclude', 'realtime,imgproxy,edge-runtime,logflare,vector,supavisor'])
  if (started.status !== 0) throw new Error(`Không khởi động được Supabase local. ${started.stderr?.split(/\r?\n/).filter(Boolean).slice(-3).join(' ') || 'Kiểm tra Docker và các cổng trong supabase/config.toml.'}`)
  const status = supabase(['status', '--output', 'env'])
  if (status.status !== 0) throw new Error('Không đọc được trạng thái Supabase local.')
  const env = createLocalEnv(status.stdout, previous)
  writeFileSync(envPath, env, { mode: 0o600 })
  process.stdout.write('Đã tạo .env.local đầy đủ. Chạy npm run dev, hoặc npm run build rồi npm start.\nĐăng ký bằng email thử và mật khẩu ít nhất 8 ký tự; demo local không bắt xác minh email.\n')
} catch (error) {
  process.stderr.write(`${error.message}\n`)
  process.exitCode = 1
}
