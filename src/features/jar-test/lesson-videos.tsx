import { LessonVideos } from '@/features/experiment-guide/lesson-videos.js'
import { JAR_LESSON_VIDEOS } from './lesson-video-content.js'

export function JarLessonVideos() {
  return <LessonVideos id="jar-videos" title="Học Jar Test qua video" videos={JAR_LESSON_VIDEOS} />
}
