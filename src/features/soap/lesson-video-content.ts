export const SOAP_LESSON_VIDEOS = [
  {
    id: 'lesson',
    title: 'Bài học',
    summary: 'Nguyên lý & thứ tự pha kiềm',
    description: 'Hiểu vì sao phải rót NaOH vào nước, cách đọc SAP và các chỉ tiêu đạt của bánh xà phòng cold process.',
    playLabel: 'Phát video bài học xà phòng hóa',
    playerLabel: 'Video bài học xà phòng hóa',
    poster: '/assets/soap-videos/soap-cover.webp',
    posterFit: 'contain',
    source: 'https://rnreqrlrxhykbkjqbuil.supabase.co/storage/v1/object/public/lesson-videos/xa-phong-hoa-intro-v1.mp4',
  },
  {
    id: 'practice',
    title: 'Thao tác thực hành trên VECLab',
    summary: 'Từ pha kiềm đến đo mẫu',
    description: 'Theo dõi thao tác trên bàn thực hành, từ pha kiềm và trộn dầu đến đổ khuôn và đọc kết quả.',
    playLabel: 'Phát video thực hành xà phòng hóa',
    playerLabel: 'Video thực hành xà phòng hóa',
    poster: '/assets/soap-videos/soap-cover.webp',
    posterFit: 'contain',
    youtubeId: 'u1WPpGTqC0o',
  },
] as const
