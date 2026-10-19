const lessonSource =
  'https://rnreqrlrxhykbkjqbuil.supabase.co/storage/v1/object/public/lesson-videos/Plastic-separation-intro-v1.mp4'

export const PLASTIC_LESSON_VIDEOS = [
  {
    id: 'lesson',
    title: 'Bài học',
    summary: 'Nguyên lý & cơ chế chìm–nổi',
    description:
      'Tìm hiểu nguyên lý tỷ trọng biểu kiến, cơ chế phân tách phân đoạn nhẹ và nặng bằng nước máy, ethanol và NaCl trong bể pilot theo nghiên cứu của Meneses Quelal et al. (2022).',
    playLabel: 'Phát video bài học Phân loại nhựa',
    playerLabel: 'Video bài học Phân loại nhựa nguyên sinh',
    poster: '/assets/plastic-separation/plastic-theory-overview-cover.jpg',
    source: lessonSource,
    temporary: false,
  },
  {
    id: 'practice',
    title: 'Thao tác thực hành trên VECLab',
    summary: 'Từ nạp mẫu đến tổng kết phân đoạn',
    description:
      'Video thực hiện trọn vẹn một mẻ thực hành trên bàn mô phỏng: nạp 6 mẫu polymer, tách nước, ly tâm và cân, chạy 2 nhánh ethanol/NaCl và đọc báo cáo.',
    playLabel: 'Phát video thực hành Phân loại nhựa',
    playerLabel: 'Video bài học dùng tạm cho mục thực hành Phân loại nhựa',
    poster: '/assets/plastic-separation/plastic-practice-overview-cover.jpg',
    source: lessonSource,
    temporary: true,
  },
] as const
