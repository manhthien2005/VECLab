const lessonSource =
  'https://rnreqrlrxhykbkjqbuil.supabase.co/storage/v1/object/public/lesson-videos/Plastic-separation-intro-v1.mp4'

export const PLASTIC_LESSON_VIDEOS = [
  {
    id: 'lesson',
    title: 'Bài học',
    summary: 'Khối lượng riêng và hiện tượng nổi–chìm',
    description:
      'Tìm hiểu cách phân loại nhựa dựa trên khối lượng riêng, vai trò của nước máy, dung dịch ethanol và NaCl trong quy trình nghiên cứu.',
    playLabel: 'Phát video bài học Phân loại nhựa',
    playerLabel: 'Video bài học Phân loại nhựa nguyên sinh',
    poster: '/assets/plastic-separation/plastic-theory-overview-cover.jpg',
    source: lessonSource,
  },
  {
    id: 'practice',
    title: 'Thao tác thực hành trên VECLab',
    summary: 'Thao tác phân loại nhựa theo khối lượng riêng',
    description:
      'Theo dõi thao tác phân loại nhựa theo khối lượng riêng và cách quan sát hiện tượng nổi–chìm trên VECLab.',
    playLabel: 'Phát video thực hành Phân loại nhựa',
    playerLabel: 'Video thực hành Phân loại nhựa',
    poster: '/assets/plastic-separation/plastic-practice-overview-cover.jpg',
    youtubeId: 'RJ-m-Y5uuXY',
  },
] as const
