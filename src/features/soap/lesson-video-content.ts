/** Placeholder slots — set `source` / `poster` / `pending: false` when recordings are ready. */
export const SOAP_LESSON_VIDEOS = [
  {
    id: 'lesson',
    title: 'Bài học',
    summary: 'Nguyên lý & thứ tự pha kiềm',
    description: 'Hiểu vì sao phải rót NaOH vào nước, cách đọc SAP và các chỉ tiêu đạt của bánh xà phòng cold process.',
    playLabel: 'Phát video bài học xà phòng hóa',
    playerLabel: 'Video bài học xà phòng hóa',
    poster: '/assets/experiments/soap.jpg',
    pending: true,
  },
  {
    id: 'practice',
    title: 'Thao tác thực hành trên VECLab',
    summary: 'Từ pha kiềm đến đo mẫu',
    description: 'Dành cho video thực hiện trọn một lượt trên bàn: chọn cốc, pha kiềm, trộn dầu, đổ khuôn và đọc báo cáo.',
    playLabel: 'Phát video thực hành xà phòng hóa',
    playerLabel: 'Video thực hành xà phòng hóa',
    poster: '/assets/experiments/soap.jpg',
    pending: true,
  },
] as const
