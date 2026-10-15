import { JAR_PROFILE } from '@/domain/experiments/jar-test/model.js'

export type CatalogEntry = {
  scenarioKey: string; releaseId: string; title: string; summary: string
}

/** Public availability is explicit: the current Jar route serves a local session. */
const JAR_ENTRY: CatalogEntry = {
  scenarioKey: 'jar-test', releaseId: JAR_PROFILE.releaseId, title: 'Jar Test',
  summary: 'Khảo sát pH và liều phèn nhôm để giảm độ đục sau khuấy – lắng.',
}

export function listCatalog(): CatalogEntry[] { return [{ ...JAR_ENTRY }] }
