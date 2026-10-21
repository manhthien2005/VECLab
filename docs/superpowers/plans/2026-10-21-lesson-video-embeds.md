# Lesson video embeds implementation plan

> Execute inline with superpowers:executing-plans; no subagents per AGENTS.md.

**Goal:** Publish the five owner-supplied practice recordings in the existing lesson video workspace, plus the two supplied lesson MP4s and three supplied covers.

**Architecture:** Extend `LessonVideo` with an optional YouTube ID alongside the existing MP4 source. Mount either player only after a play action; selecting another item unmounts the player. Water treatment adopts the shared workspace.

**Tech stack:** Existing Next.js/React, CSS modules, Playwright; no new runtime dependencies.

**Spec:** Human-approved plan in this chat, 2026-10-21. Coder 2; branch `feature/lesson-video-embeds`; target `develop`; base `a17934e`.

## Constraints and review focus

- Preserve existing landing, lesson content and simulator behavior; no remote mutations.
- No player or remote media fetch before play; no mismatched Jar captions on practice recordings.
- Correct YouTube IDs, explicit external fallback, native controls/fullscreen and keyboard focus.
- Selection removes the old player; MP4 error/retry continues to work.
- Supplied cover text remains uncropped; responsive frame stays within the page.

## Task 1: Shared playback and supplied content

- [x] Add focused browser coverage for poster-first playback, correct practice embed, switching, MP4 sources and fallback. Run against baseline and observe missing embeds.
- [x] Extend `src/features/experiment-guide/lesson-videos.tsx` and its CSS for lazy YouTube iframe, focus, fullscreen and external link. Keep MP4 behavior.
- [x] Update `src/features/{jar-test,extraction,plastic-separation,soap,water-treatment}/lesson-video*` with the approved source mapping. Remove obsolete temporary labels/captions.
- [x] Optimize the three supplied covers under `public/assets/{soap-videos,water-treatment-videos}`; use the soap cover for both roles.
- [x] Run relevant video unit tests, focused browser tests on desktop/mobile, typecheck and lint. Verify the two MP4 HTTP responses and actual YouTube embedding separately from stubbed browser checks.
- [x] Review the diff locally, document actual evidence and leave the branch available for human review. No merge/deployment.

## Execution record

- Worktree created from latest fetched `origin/develop`; original checkout and untracked user files preserved.
- Ruling: use focused verification per the persistent proportional UI verification rule; do not run unrelated domain/database suites.
- Ruling: perform review locally per the persistent no-subagent rule.

## Verification (2026-10-21)

- RED: baseline soap page had pending slots and no play button; focused browser test failed at that missing behavior.
- GREEN: `E2E_BASE_URL=http://localhost:3010 npx playwright test e2e/lesson-video-embeds.spec.ts --workers=2 --max-failures=2`: 10 passed (desktop + mobile), including correct embeds, no media before intent, keyboard activation/focus, minimum player size, selection cleanup and MP4 retry.
- `npm run typecheck`: passed. Targeted ESLint over all changed TypeScript files: passed.
- Video unit tests (Jar Test, extraction, plastic): 3 files / 6 tests passed.
- Live playback without interception: all five YouTube embeds reached readyState 4 with advancing currentTime; both supplied MP4s also played with advancing currentTime. Public MP4 HEAD requests returned 200, video/mp4 and byte-range support.
- Four existing guide routes returned 200 with both video roles and zero mounted players before play.
- New lesson covers loaded in browser, and both lesson/practice covers use contain fit; original image content/dimensions retained in optimized WebP.
- Impeccable detector: [] findings. `git diff --check`: passed.
- Final review: self-review per human no-subagent rule; no actionable findings. Review covered provider branching, selection cleanup, focus, fallback, captions, cover mapping and scope.
- Full application build, unrelated suites and required CI: not run for this incremental UI edit; mandatory CI still required before merging. No push, merge or deployment performed.
