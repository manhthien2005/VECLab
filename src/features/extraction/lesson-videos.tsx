import { LessonVideos, type LessonVideo } from '@/features/experiment-guide/lesson-videos.js'

const lessonSource = 'https://rnreqrlrxhykbkjqbuil.supabase.co/storage/v1/object/public/lesson-videos/acid-bazo-extraction-intro-v1.mp4'

// The practice slot uses the lesson until its own recording is supplied.
// Replace its source, playerLabel and matching captions together when ready.
export const EXTRACTION_LESSON_VIDEOS = [
  {
    id: 'lesson',
    title: 'Bài học',
    summary: 'Hai pha, ion hóa & thu hồi sản phẩm',
    description: 'Hiểu cách môi trường axit–bazơ thay đổi sự phân bố của A, B và N giữa hai pha; phân biệt thu hồi với độ tinh khiết.',
    playLabel: 'Phát video bài học chiết tách axit–bazơ',
    playerLabel: 'Video bài học chiết tách axit–bazơ',
    poster: '/assets/extraction-videos/acid-base-extraction-lesson-cover.webp',
    source: lessonSource,
  },
  {
    id: 'practice',
    title: 'Thao tác thực hành trên VECLab',
    summary: 'Từ chuyển mẫu đến khai báo sản phẩm',
    description: 'Theo dõi quy trình chuyển mẫu, cấp dung dịch, trộn–xả áp–phân lớp, thu pha, làm khô và cân sản phẩm.',
    playLabel: 'Phát video thực hành chiết tách axit–bazơ',
    playerLabel: 'Video bài học dùng tạm cho mục thực hành chiết tách axit–bazơ',
    poster: '/assets/extraction-videos/acid-base-extraction-practice-cover.webp',
    source: lessonSource,
  },
] as const satisfies readonly [LessonVideo, ...LessonVideo[]]

export function ExtractionLessonVideos() {
  return <LessonVideos id="extraction-videos" title="Học chiết tách axit–bazơ qua video" videos={EXTRACTION_LESSON_VIDEOS} />
}
