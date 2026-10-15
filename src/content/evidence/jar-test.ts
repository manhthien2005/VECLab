import { JAR_PROFILE } from '@/domain/experiments/jar-test/model.js'

/** Citations used by the current lesson; neither source validates VECLab itself. */
export const JAR_SOURCES = [
  {
    key: 'alateef-2024-rsm',
    title: 'Initial turbidity, pH, dosage of alum and paddles type optimization of efficiency removal by using response surface methods (RSM)',
    author: 'Zainb Abd alelah Abd Alateef và cộng sự · IJASE · 2024',
    kind: 'Mô hình tính toán',
    url: 'https://doi.org/' + JAR_PROFILE.sourceDoi,
    alternativeUrl: 'https://www.researchgate.net/publication/379000836_Initial_turbidity_pH_dosage_of_alum_and_paddles_type_optimization_of_efficiency_removal_by_using_response_surface_methods_RSM',
    location: 'Equation 3 · Tables 1–3 và 9 · Cánh khuấy hai bản',
    use: 'Nguồn phương trình đáp ứng cuối quy trình, với mẫu kaolin tổng hợp và phèn nhôm. Bài dùng hệ số in công bố tại độ đục đầu 125 NTU.',
    limit: 'Tái hiện số học của phương trình, chưa phải kiểm chứng thực nghiệm ngoài mẫu cho VECLab. Không mô tả động học hạt hoặc độ đục giữa pha.',
  },
  {
    key: 'qatar-environmental-lab',
    title: 'Environmental Engineering Laboratory Manual',
    author: 'Qatar University · Department of Civil and Architectural Engineering',
    kind: 'Quy trình & an toàn',
    url: 'https://www.qu.edu.qa/static_file/qu/colleges/engineering/civil/documents/Lab%20Manuals/Environmental_Engineering_Lab._Manual.pdf',
    alternativeUrl: null,
    location: 'Experiment #6: Jar Test · Trang PDF 23–25; Safety Guide ở đầu tài liệu',
    use: 'Tham khảo mục đích Jar Test, thao tác khuấy – lắng – đo độ đục và quy tắc an toàn trong phòng thí nghiệm.',
    limit: 'Không cung cấp hệ số tính toán cho bài này. Các điều kiện trong tài liệu không thay thế hồ sơ mô hình đã khóa của VECLab.',
  },
] as const

export const JAR_LIMITS = [
  'Mẫu kaolin tổng hợp với phèn nhôm; không đại diện cho mọi loại nước thải.',
  'Chỉ khảo sát pH ban đầu và tổng liều. Chương trình khuấy/lắng được cố định.',
  'Hạt và chuyển động là minh họa. Chỉ số đo đã thực hiện mới xuất hiện trong sổ đo.',
  'Mục tiêu giảm đục 80% là tiêu chí học tập, không phải chứng nhận nước đạt chuẩn uống hoặc xả thải.',
] as const
