'use client'

import { LessonVideos } from '@/features/experiment-guide/lesson-videos.js'
import { PLASTIC_LESSON_VIDEOS } from './lesson-video-content.js'

export function PlasticLessonVideos() {
  return (
    <LessonVideos
      id="plastic-videos"
      title="Học phân loại nhựa qua video"
      videos={PLASTIC_LESSON_VIDEOS}
    />
  )
}
