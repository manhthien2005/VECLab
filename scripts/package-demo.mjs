import { spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, extname, join, resolve, sep } from 'node:path'

try {
  const args = process.argv.slice(2)
  if (args.includes('--help')) {
    process.stdout.write('npm run package:demo -- --out <thư-mục-trống>\nChỉ sao chép source và tài nguyên cần cho demo; không sao chép môi trường cá nhân.\n')
    process.exit(0)
  }
  const option = key => args.includes(key) ? args[args.indexOf(key) + 1] : undefined
  const source = resolve(option('--source') || '.')
  if (!option('--out')) throw new Error('Cần chỉ định --out <thư-mục-trống>.')
  const out = resolve(option('--out'))
  if (out === source || ['src', 'public', 'supabase', 'scripts', 'tools'].some(dir => out === join(source, dir) || out.startsWith(join(source, dir) + sep))) throw new Error('Thư mục đích phải nằm ngoài các thư mục source cần sao chép.')
  if (existsSync(out) && readdirSync(out).length) throw new Error('Thư mục đích không rỗng; không ghi đè tệp có sẵn.')
  mkdirSync(out, { recursive: true })
  let copied = 0
  const excluded = /(?:^|[\\/])(?:node_modules|\.next|\.git|\.agents?|\.claude|\.cursor|__pycache__)(?:[\\/]|$)|\.(?:log|tmp|bak|tsbuildinfo|map)$/i
  function copy(file) {
    if (excluded.test(file)) return
    const from = join(source, file), target = join(out, file)
    if (!existsSync(from)) return
    const stat = lstatSync(from)
    if (stat.isSymbolicLink()) throw new Error(`Không đóng gói liên kết ngoài: ${file}`)
    if (stat.isDirectory()) {
      for (const child of readdirSync(from)) copy(join(file, child))
      return
    }
    if (extname(file) === '.md' && !file.endsWith('ATTRIBUTION.md')) return
    mkdirSync(dirname(target), { recursive: true })
    copyFileSync(from, target)
    copied++
  }
  for (const dir of ['src', 'public', 'scripts/demo', 'supabase/migrations']) copy(dir)
  copy('next.config.ts')
  const nextConfigPath = join(out, 'next.config.ts')
  const nextConfig = readFileSync(nextConfigPath, 'utf8')
  const configStart = nextConfig.includes('const nextConfig: NextConfig = {') ? 'const nextConfig: NextConfig = {' : 'export default {'
  if (!nextConfig.includes(configStart)) throw new Error('Không xác định được cấu trúc next.config.ts để tắt tệp agent tự sinh.')
  writeFileSync(nextConfigPath, nextConfig.replace(configStart, `${configStart}\n  agentRules: false,`))
  copy('package-lock.json')
  const pin = 'tools/research/phreeqc-pin/3.8.6-17100'
  for (const file of ['bin/phreeqc.exe', 'bin/phreeqc-linux-x64', 'database/minteq.v4.dat', 'NOTICE-linux.txt', 'PIN.json']) copy(join(pin, file))

  const pkg = JSON.parse(readFileSync(join(source, 'package.json'), 'utf8'))
  pkg.scripts = {
    dev: 'next dev --webpack', build: 'next build --webpack', start: 'next start', typecheck: 'tsc --noEmit',
    'demo:setup': 'node scripts/demo/setup-local.mjs', 'demo:stop': 'node scripts/demo/stop-local.mjs',
  }
  const neededDev = new Set(['@types/node', '@types/react', '@types/react-dom', 'typescript', 'supabase'])
  pkg.devDependencies = Object.fromEntries(Object.entries(pkg.devDependencies || {}).filter(([key]) => neededDev.has(key)))
  writeFileSync(join(out, 'package.json'), JSON.stringify(pkg, null, 2) + '\n')
  const tsconfig = JSON.parse(readFileSync(join(source, 'tsconfig.json'), 'utf8'))
  tsconfig.include = ['next-env.d.ts', 'src/**/*.ts', 'src/**/*.tsx', '.next/types/**/*.ts', '.next/dev/types/**/*.ts']
  tsconfig.exclude = ['node_modules']
  writeFileSync(join(out, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2) + '\n')
  let config = readFileSync(join(source, 'supabase/config.toml'), 'utf8')
  config = config.replace(/project_id\s*=\s*"[^"]+"/, 'project_id = "veclab-demo"')
    .replaceAll('54321', '54331').replaceAll('54322', '54332').replaceAll('54323', '54333').replaceAll('54324', '54334')
    .replace('[inbucket]', '[local_smtp]')
    .replace('  "https://*.vercel.app/**",', '  "http://127.0.0.1:3000/**",\n  "http://localhost:3020/**",')
  mkdirSync(join(out, 'supabase'), { recursive: true })
  writeFileSync(join(out, 'supabase/config.toml'), config)
  writeFileSync(join(out, '.env.example'), '# Chạy npm run demo:setup để tạo đủ các giá trị local. Không điền khóa production.\nNEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54331\nNEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=\nSUPABASE_SECRET_KEY=\n')
  writeFileSync(join(out, '.gitignore'), 'node_modules/\n.next/\n.env.local\n*.tsbuildinfo\nnext-env.d.ts\nsupabase/.temp/\nsupabase/.branches/\n*.log\n')
  const guide = join(source, 'scripts/demo/README-DEMO.md')
  if (existsSync(guide)) copyFileSync(guide, join(out, 'README-DEMO.md'))
  if (existsSync(join(out, 'package-lock.json'))) {
    if (!process.env.npm_execpath) throw new Error('Hãy đóng gói qua npm run package:demo để đồng bộ lockfile.')
    const lock = spawnSync(process.execPath, [process.env.npm_execpath, 'install', '--package-lock-only', '--ignore-scripts', '--no-audit', '--no-fund'], { cwd: out, encoding: 'utf8', windowsHide: true, timeout: 180_000 })
    if (lock.status !== 0) throw new Error(`Không đồng bộ được lockfile bản demo: ${lock.stderr}`)
  }
  process.stdout.write(`Đã chuẩn bị bản source demo tại ${out} (${copied} tệp được sao chép).\n`)
  process.stdout.write(`Bước tiếp theo: cài npm, chạy setup, kiểm tra dev/build/start rồi tạo ZIP từ các tệp source đã chọn.\n`)
} catch (error) {
  process.stderr.write(`${error.message}\n`)
  process.exitCode = 1
}
