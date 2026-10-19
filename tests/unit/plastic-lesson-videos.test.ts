import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { PlasticLessonVideos } from '@/features/plastic-separation/lesson-videos.js'
import { PLASTIC_ITEMS } from '@/features/plastic-separation/equipment-panel.js'

describe('Plastic Separation learning videos & equipment panel', () => {
  it('renders lesson video workspace with both video roles and lazy player poster', () => {
    const html = renderToStaticMarkup(createElement(PlasticLessonVideos))
    expect(html).toContain('Bài học')
    expect(html).toContain('Thao tác thực hành trên VECLab')
    expect(html).toContain('Học phân loại nhựa qua video')
    expect(html).toContain('Phát video bài học Phân loại nhựa')
    expect(html).toContain('Chọn video: Thao tác thực hành trên VECLab')
    expect(html).not.toContain('<video')
    expect(html).not.toContain('supabase.co')
  })

  it('contains specifications and photos for all 6 polymers and 3 equipment items', () => {
    const expectedKeys = ['pp', 'hdpe', 'ps', 'abs', 'pa', 'pc', 'pilot-tank', 'centrifuge', 'scale'] as const
    for (const key of expectedKeys) {
      const item = PLASTIC_ITEMS[key]
      expect(item).toBeDefined()
      expect(item.image).toContain(key === 'scale' ? 'scale.jpg' : key === 'centrifuge' ? 'centrifuge.jpg' : key === 'pilot-tank' ? 'pilot-tank.jpg' : `${key}.jpg`)
      expect(item.purpose.length).toBeGreaterThan(10)
      expect(item.facts.length).toBeGreaterThan(2)
      expect(item.steps.length).toBeGreaterThan(1)
    }
  })
})
