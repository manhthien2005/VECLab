const lessonSource = 'https://rnreqrlrxhykbkjqbuil.supabase.co/storage/v1/object/public/lesson-videos/jar-test-intro-v1.mp4'
const lessonCaptions = '/assets/jar-videos/lesson.auto.vi.vtt'

export const JAR_LESSON_VIDEOS = [
  {
    id: 'lesson',
    title: 'Bài học',
    summary: 'Nguyên lý & cách đọc kết quả',
    description: 'Hiểu vai trò của pH, liều phèn và ba pha khuấy nhanh, khuấy chậm, lắng trong Jar Test.',
    playLabel: 'Phát video bài học Jar Test',
    playerLabel: 'Video bài học Jar Test',
    poster: '/assets/jar-videos/jar-test-lesson-cover.webp',
    source: lessonSource,
    captions: lessonCaptions,
  },
  {
    id: 'practice',
    title: 'Thao tác thực hành trên VECLab',
    summary: 'Từ chuẩn bị mẫu đến nộp bài',
    description: 'Theo dõi thao tác trên bàn thực hành, từ chuẩn bị mẫu đến đọc báo cáo Jar Test.',
    playLabel: 'Phát video thực hành Jar Test',
    playerLabel: 'Video thực hành Jar Test',
    poster: '/assets/jar-videos/jar-test-practice-cover.webp',
    youtubeId: 'fpwHE6tpT5g',
  },
] as const
