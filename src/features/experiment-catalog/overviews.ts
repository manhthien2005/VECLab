import { APP_STRINGS } from '@/content/index.js'
import { JAR_PROFILE } from '@/domain/experiments/jar-test/model.js'

const PRESENTATION = {
  'acid-base-extraction': {
    image: '/assets/experiments/extraction.svg',
    imageAlt: 'Phễu chiết với pha hữu cơ phía trên, pha nước phía dưới và các bình thu',
    category: 'Chiết lỏng – lỏng',
    question: 'Thứ tự chiết và cách thu pha ảnh hưởng thế nào đến sản phẩm?',
    learning: 'Tách riêng ba cấu tử, theo dõi thất thoát và phân biệt thu hồi với độ tinh khiết.',
    tools: 'Phễu chiết, bình thu, máy đo pH, bộ lọc và cân.',
    prerequisites: 'Hiểu axit–bazơ, hai pha không trộn lẫn và cách sử dụng phễu chiết.',
    input: 'Mẫu chuẩn A/B/N · 100 mg mỗi cấu tử · 40 mL dung môi hữu cơ',
    parameters: 'Hướng chiết, thể tích dung dịch, số lần chiết và phần pha thu',
    outcome: 'Khối lượng đã cân, thu hồi và độ tinh khiết theo mô hình',
    procedure: ['Chọn hướng chiết, trộn, xả áp và phân lớp', 'Thu từng pha, kết tủa, lọc hoặc cô rồi làm khô', 'Cân, tự tính thu hồi và khai báo ba sản phẩm'],
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
