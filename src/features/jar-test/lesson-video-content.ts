const lessonSource = 'https://rnreqrlrxhykbkjqbuil.supabase.co/storage/v1/object/public/lesson-videos/jar-test-intro-v1.mp4'
const lessonCaptions = '/assets/jar-videos/lesson.auto.vi.vtt'

// Replace the practice source and its captions together when the recording is ready.
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
    temporary: false,
  },
  {
    id: 'practice',
    title: 'Thao tác thực hành trên VECLab',
    summary: 'Từ chuẩn bị mẫu đến nộp bài',
    description: 'Dành cho video thực hiện trọn một lượt trên bàn thực hành, từ chuẩn bị mẫu đến đọc báo cáo.',
    playLabel: 'Phát video thực hành Jar Test',
    playerLabel: 'Video bài học dùng tạm cho mục thực hành Jar Test',
    poster: '/assets/jar-videos/jar-test-practice-cover.webp',
    source: lessonSource,
    captions: lessonCaptions,
    temporary: true,
  },
] as const
