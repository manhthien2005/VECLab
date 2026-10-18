import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { JarLessonVideos } from '@/features/jar-test/lesson-videos.js'

describe('Jar Test learning videos', () => {
  it('offers both video roles without mounting or downloading a remote player before intent', () => {
    const html = renderToStaticMarkup(createElement(JarLessonVideos))
    expect(html).toContain('Bài học')
    expect(html).toContain('Thao tác thực hành trên VECLab')
    expect(html).toContain('Phát video bài học Jar Test')
    expect(html).toContain('Chọn video: Thao tác thực hành trên VECLab')
    expect(html).not.toContain('<video')
    expect(html).not.toContain('supabase.co')
  })

  it('shows the covers without temporary-video or caption notices', () => {
    const html = renderToStaticMarkup(createElement(JarLessonVideos))
    expect(html).not.toContain('Đang dùng tạm video bài học')
    expect(html).not.toContain('Video thực hành: bản tạm')
    expect(html).not.toContain('Phụ đề tiếng Việt tự động')
    expect(html).toContain('id="jar-videos"')
    expect(html).toContain('jar-test-lesson-cover.webp')
    expect(html).toContain('jar-test-practice-cover.webp')
  })
})
