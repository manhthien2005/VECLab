import { EXTRACTION_PROFILE } from '@/domain/experiments/acid-base-extraction/model.js'
import { JAR_PROFILE } from '@/domain/experiments/jar-test/model.js'
import { PLASTIC_PROFILE } from '@/domain/experiments/virgin-plastic-separation/model.js'
import { WATER_TREATMENT_PROFILE } from '@/domain/experiments/water-treatment/model.js'

export type CatalogEntry = {
  scenarioKey: string; releaseId: string; title: string; summary: string
}

/** Public availability is explicit; these routes serve browser-persisted sessions. */
const JAR_ENTRY: CatalogEntry = {
  scenarioKey: 'jar-test', releaseId: JAR_PROFILE.releaseId, title: 'Jar Test',
  summary: 'Khảo sát pH và liều phèn nhôm để giảm độ đục sau khuấy – lắng.',
}

export function listCatalog(): CatalogEntry[] {
  return [
    { ...JAR_ENTRY },
    { scenarioKey: 'acid-base-extraction', releaseId: EXTRACTION_PROFILE.releaseId, title: 'Chiết tách axit–bazơ', summary: 'Tách mẫu mô phỏng A/B/N qua hai pha, thu sản phẩm và đối chiếu thu hồi, độ tinh khiết.' },
    { scenarioKey: 'plastic-density-separation', releaseId: PLASTIC_PROFILE.releaseId, title: 'Phân loại nhựa nguyên sinh', summary: 'Theo dõi sáu polymer qua các bước tách chìm–nổi bằng nước máy, ethanol và NaCl; đọc khối lượng phân đoạn và thu hồi theo preset.' },
    { scenarioKey: 'water-treatment', releaseId: WATER_TREATMENT_PROFILE.releaseId, title: 'Xử lý nước Fe, Zn, Pb', summary: 'Điều chỉnh pH và dùng hydroxide để loại kim loại nặng, kiểm tra với QCVN 40:2025.' },
  ]
}
