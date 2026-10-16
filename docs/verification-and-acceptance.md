# Kiểm chứng và nghiệm thu

Phạm vi hiện hành: [Jar Test và chiết tách axit–bazơ](ui/current-experiments.md). Thẻ hấp phụ chỉ kiểm tra nội dung/availability, không giả lập luồng thực hành.

## Gates

- TypeScript và ESLint: imports/callers, kiểu release/projection, server/client boundary.
- Unit/integration: model bounds, đơn vị, bảo toàn, valid/N/A, báo cáo bất biến, revision conflict, idempotency, replay, IndexedDB và auth/profile guards.
- Playwright: learner journey hai bài, resume, report, lab/account/compare, bàn phím/touch/mobile, reduced motion và blocked-action reasons. Bài đã nghỉ không mở simulator; link saved attempt không đổi nhãn/xóa dữ liệu.
- Production build xác nhận route/import bundle sau khi xóa module.
- Required CI App Quality và Database Contract phải green trước merge. Database tests chạy local/ephemeral, không dùng production privileged credentials.

## Báo kết quả

Ghi lệnh, môi trường, pass/fail/not-run và phạm vi thật. Kiểm chứng số học không phải thực nghiệm. Không nói cloud sync đã hoạt động khi hai simulator chỉ lưu browser-local. Test cũ của bài đã gỡ phải xóa cùng code; test Process Core dùng module hiện hành và giữ kiểm tra bảo mật/replay/undo.
