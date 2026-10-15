import { APP_STRINGS } from '@/content/index.js'
import { JAR_PROFILE } from '@/domain/experiments/jar-test/model.js'

const PRESENTATION = {
  'acid-neutralization': {
    image: '/assets/experiments/ph.webp',
    imageAlt: 'Cốc phản ứng, buret và điện cực đo pH',
    category: 'Axit – bazơ',
    question: 'Thêm bao nhiêu chất trung hòa để đạt pH mục tiêu?',
    learning: 'Đọc pH, điều chỉnh liều và đối chiếu kết quả.',
    tools: 'Buret, máy khuấy và máy đo pH.',
    prerequisites: 'Hiểu pH và phản ứng axit–bazơ cơ bản.',
    input: 'Mẫu nước cần điều chỉnh pH · Nội dung dự kiến',
    parameters: 'Thể tích, nồng độ và lượng hóa chất',
    outcome: 'Độ lệch pH, lượng hóa chất đã dùng',
    procedure: ['Chuẩn bị mẫu và hiệu chuẩn máy đo', 'Thêm hóa chất, khuấy và chờ ổn định', 'Đo pH và đối chiếu kết quả'],
  },
  'jar-test': {
    image: '/assets/experiments/jar.webp',
    imageAlt: 'Dàn Jar Test với hai cốc nước và cánh khuấy',
    category: 'Keo tụ – tạo bông',
    question: 'Điều kiện nào giúp giảm độ đục sau lắng?',
    learning: 'Thiết kế các mẫu so sánh và lựa chọn phương án xử lý.',
    tools: 'Dàn khuấy sáu vị trí, cốc và máy đo độ đục.',
    prerequisites: 'Hiểu pH, nồng độ và cách so sánh các mẫu nước.',
    input: `Mẫu kaolin ${JAR_PROFILE.initialNtu} NTU · ${JAR_PROFILE.aliquotVolumeL.toLocaleString('vi-VN')} L/cốc · Phèn nhôm`,
    parameters: `pH ${JAR_PROFILE.availableInitialPh.join(' / ')} · Liều ${JAR_PROFILE.minDoseMgL}–${JAR_PROFILE.maxDoseMgL} mg/L`,
    outcome: 'Độ đục sau lắng, hiệu suất xử lý',
    procedure: ['Chuẩn bị các cốc, đo mẫu đầu và chọn liều phèn', 'Khuấy nhanh 60 giây, khuấy chậm 20 phút và lắng 30 phút mô phỏng', 'Đo độ đục, tự tính hiệu suất và chọn phương án nộp'],
  },
  'methylene-blue-adsorption': {
    image: '/assets/experiments/adsorption.webp',
    imageAlt: 'Dung dịch xanh methylene và than hoạt tính',
    category: 'Hấp phụ',
    question: 'Liều than và thời gian tiếp xúc ảnh hưởng thế nào đến khả năng loại màu?',
    learning: 'Liên hệ điều kiện xử lý với hiệu suất hấp phụ.',
    tools: 'Cân, bình tiếp xúc, cuvet và máy đo quang.',
    prerequisites: 'Hiểu nồng độ dung dịch và cách tính phần trăm.',
    input: 'Xanh methylene, than hoạt tính',
    parameters: 'Liều than và thời gian tiếp xúc',
    outcome: 'Nồng độ màu, hiệu suất loại màu',
    procedure: ['Chuẩn bị dung dịch và lượng than hoạt tính', 'Cho tiếp xúc theo điều kiện đã chọn', 'Đo nồng độ và tính hiệu suất loại màu'],
  },
} as const

/** Presentation only. Runtime availability is always resolved from listCatalog(). */
export const EXPERIMENT_OVERVIEWS = APP_STRINGS.home.showcaseCards.map(({ scenarioKey, title }) => ({
  scenarioKey, title, ...PRESENTATION[scenarioKey],
}))

export type ExperimentOverview = (typeof EXPERIMENT_OVERVIEWS)[number]
