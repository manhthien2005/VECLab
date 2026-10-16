# Kiến trúc VECLab hiện hành

## Phạm vi và ranh giới

Chỉ [hai bài chạy thật](ui/current-experiments.md). Layer: app/features → application → domain; infrastructure cung cấp auth/profile, content cung cấp nội dung/nguồn. Domain không import React, Next, database, UI hoặc content.

## Engine và Process Core

`src/domain/experiments/jar-test` và `acid-base-extraction` có module/manifest riêng. Process Core giữ hợp đồng action/result, chuẩn hóa đơn vị, ledger, canonical JSON, fingerprint, hash, replay và undo chung. Release khóa model/scoring/state/content/evidence/projection; không ép state của bài này sang bài khác.

## Session và lưu trữ

`jar-session.ts` và `extraction-session.ts` điều phối validate/compute/project/persist trên `GuestAttemptRepository`. IndexedDB giữ attempt, events và snapshot. Ghi dùng revision/action ID; retry và conflict phải giữ tính nhất quán. Session kiểm tra release trước replay hoặc projection.

Hai simulator đang phục vụ đều lưu local. BFF/cloud adapter của bài trung hòa axit đã gỡ; không có API start bài cũ. Supabase hiện dành cho auth/profile và lịch sử hợp đồng database được kiểm thử riêng. Task dọn source không sửa migration/schema hoặc dữ liệu đã lưu.

## Presentation

Workbench nhận learner projection đã commit; animation không tạo action/phép đo/thời gian. Completed report bất biến; số liệu không evaluable giữ null/N/A. `/attempts/[id]` và `/reports/[id]` đọc metadata local, chuyển sang đúng workbench; bài đã nghỉ có thông báo rõ.

## An toàn

Input không tin cậy phải kiểm tra trước mutation. Auth identity từ phiên đã xác minh; service key không đi vào client. Profile write kiểm tra same-origin và response private/no-store. Kiểm thử source graph bảo vệ ranh giới server/client và admin.
