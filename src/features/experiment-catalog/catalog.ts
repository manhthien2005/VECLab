import { EXTRACTION_PROFILE } from '@/domain/experiments/acid-base-extraction/model.js'
import { JAR_PROFILE } from '@/domain/experiments/jar-test/model.js'

export type CatalogEntry = {
  scenarioKey: string; releaseId: string; title: string; summary: string
}

/** Public availability is explicit; these routes serve browser-persisted sessions. */
const JAR_ENTRY: CatalogEntry = {
  scenarioKey: 'jar-test', releaseId: JAR_PROFILE.releaseId, title: 'Jar Test',
  summary: 'Khảo sát pH và liều phèn nhôm để giảm độ đục sau khuấy – lắng.',
}

export function listCatalog(): CatalogEntry[] { return [{ ...JAR_ENTRY }, { scenarioKey: 'acid-base-extraction', releaseId: EXTRACTION_PROFILE.releaseId, title: 'Chiết tách axit–bazơ', summary: 'Tách mẫu chuẩn A/B/N qua hai pha, thu sản phẩm và đối chiếu thu hồi, độ tinh khiết.' }] }
