const lessonSource = '/assets/water-treatment-videos/water-treatment-lesson.mp4'
const lessonCaptions = '/assets/water-treatment-videos/lesson.auto.vi.vtt'

export const WATER_TREATMENT_LESSON_VIDEOS = [
  {
    id: 'lesson',
    title: 'Bài học',
    summary: 'Nguyên lý & cách đọc kết quả',
    description: 'Hiểu vai trò của pH, kết tủa hydroxide và kỹ thuật lọc trong xử lý kim loại nặng.',
    playLabel: 'Phát video bài học Xử lý nước Fe, Zn, Pb',
    playerLabel: 'Video bài học Xử lý nước Fe, Zn, Pb',
    poster: '/assets/water-treatment-videos/water-treatment-lesson-cover.jpg',
    source: lessonSource,
    captions: lessonCaptions,
    temporary: false,
  },
] as const
