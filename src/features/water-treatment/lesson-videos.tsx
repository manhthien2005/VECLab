import { LessonVideos, type LessonVideo } from '@/features/experiment-guide/lesson-videos.js'

const WATER_TREATMENT_LESSON_VIDEOS = [
  {
    id: 'lesson',
    title: 'Bài học',
    summary: 'Nguyên lý xử lý nước nhiễm kim loại nặng',
    description: 'Tìm hiểu bài học xử lý nước nhiễm kim loại nặng Zn, Pb và Fe.',
    playLabel: 'Phát video bài học xử lý nước nhiễm kim loại nặng',
    playerLabel: 'Video bài học xử lý nước nhiễm kim loại nặng',
    poster: '/assets/water-treatment-videos/water-treatment-lesson-cover.webp',
    posterFit: 'contain',
    source: 'https://rnreqrlrxhykbkjqbuil.supabase.co/storage/v1/object/public/lesson-videos/water-treatment-intro-v1.mp4',
  },
  {
    id: 'practice',
    title: 'Thao tác thực hành trên VECLab',
    summary: 'Theo dõi quy trình xử lý và đọc kết quả',
    description: 'Theo dõi thao tác thực hành xử lý nước nhiễm kim loại nặng trên VECLab.',
    playLabel: 'Phát video thực hành xử lý nước nhiễm kim loại nặng',
    playerLabel: 'Video thực hành xử lý nước nhiễm kim loại nặng',
    poster: '/assets/water-treatment-videos/water-treatment-practice-cover.webp',
    posterFit: 'contain',
    youtubeId: 'xK7vcq-jzPU',
  },
] as const satisfies readonly [LessonVideo, ...LessonVideo[]]

export function WaterTreatmentLessonVideos() {
  return <LessonVideos id="water-treatment-videos" title="Học xử lý nước nhiễm kim loại nặng qua video" videos={WATER_TREATMENT_LESSON_VIDEOS} />
}
