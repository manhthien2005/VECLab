import { access, writeFile } from 'node:fs/promises'
import { afterEach, expect, it, vi } from 'vitest'

vi.mock('@/server/phreeqc-runtime.js', () => ({ PHREEQC_DATABASE: '/pinned/minteq.v4.dat', runPhreeqc: vi.fn() }))
import { runPhreeqc } from '@/server/phreeqc-runtime.js'
import { runSampleChemistry } from '@/app/simulate/water-treatment/sample-chemistry-action.js'

const input = { targetVolumeMl: 1000, feAddedMl: 50, znAddedMl: 50, pbAddedMl: 5 }
afterEach(() => vi.resetAllMocks())

it('removes scratch input after a failed or timed-out native run', async () => {
  let scratch = ''
  vi.mocked(runPhreeqc).mockImplementation(async (_, cwd) => {
    scratch = cwd
    throw new Error('native timeout')
  })
  await expect(runSampleChemistry(input)).rejects.toThrow('native timeout')
  expect(scratch).toContain('veclab-phreeqc-')
  await expect(access(scratch)).rejects.toMatchObject({ code: 'ENOENT' })
})

it('does not return unconverged results and cleans generated files', async () => {
  let scratch = ''
  vi.mocked(runPhreeqc).mockImplementation(async (args, cwd) => {
    scratch = cwd
    const { join } = await import('node:path')
    await writeFile(join(cwd, 'selected.out'), 'pH Fe Zn Pb\n7 0 0 0\n')
    await writeFile(args[1]!, 'ERROR: calculations did not converge')
  })
  await expect(runSampleChemistry(input)).rejects.toThrow(/không hội tụ/)
  await expect(access(scratch)).rejects.toMatchObject({ code: 'ENOENT' })
})
