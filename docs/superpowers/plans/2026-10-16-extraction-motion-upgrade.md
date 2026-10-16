# Chiết tách axit–bazơ — nâng cấp cảnh thực hành

**Goal:** Áp dụng các yêu cầu đã duyệt ở Jar Test để thấy rõ mẫu, hai pha, mực dịch và kết quả từng thao tác trên bài chiết tách hiện có.

**Architecture:** React/SVG và CSS hiện có; scene đọc projection đã lưu, cue theo action ID. Không thêm thư viện, đổi engine/session/projection, báo cáo, landing hay Jar Test. Tự triển khai và tự review theo quyết định không subagent.

**Spec:** `docs/superpowers/specs/2026-10-15-acid-base-extraction-design.md`, yêu cầu người dùng 16/10/2026 và VECLab Motion.

Coder 2; branch `feature/extraction-motion-upgrade`; base `94ac2b0` (Jar Test đã được người dùng duyệt); target `develop` qua PR sau này. Đây là nhánh tiếp nối trên checkout riêng, không merge/push/deploy trong nhiệm vụ này.

## Hướng triển khai

- Điểm nhấn: rót / mở khóa phễu với nguồn vơi và bình nhận dâng cùng lúc; mũi dòng cấp nối đúng miệng bình. Thu hữu cơ từ miệng phễu, thu nước ở khóa dưới.
- Hình học: cùng dung tích hồ sơ 250 mL; vạch 25/50/100/150/200/250 mL dùng cùng thang với mặt dịch, có xét thân thuôn của phễu/bình thu. Hai pha tính riêng thể tích, màu quy ước chỉ để phân biệt; mẫu rắn chỉ khi projection cho phép.
- Liên tục: trộn, xả áp, phân lớp, kết tủa, lọc, cô, làm khô và phép đo đều có cảnh/giải thích cụ thể. Lọc minh họa thu rắn và tối đa 0,5 mL dịch lưu, dịch lọc còn ở nguồn theo mô hình hiện có.
- Phản hồi: tên thao tác, bình liên quan, thể tích trước → sau, trạng thái hai pha và số đo đã lưu; có thể xem ngay trạng thái cuối. Không suy pH, độ tinh khiết hay A/B/N từ màu/hạt.
- Ngân sách: cue hữu hạn 2,6 giây, không chặn thao tác; transform/opacity, SVG cục bộ, không React render mỗi frame. Pause khi scene ngoài vùng nhìn/tab ẩn; đổi preference trực tiếp về frame cuối. Reload/chọn bình/lượt mới không phát lại cue.

## Thực hiện và kiểm tra

- [x] Đọc contract, model, projection, thao tác và ảnh giao diện hiện tại; baseline 8/8 E2E liên quan và typecheck qua.
- [x] Viết và chạy RED cho mực dịch/vạch chia, hai đường thu pha, cue thay/skip/restore/reduced motion, lọc/làm khô/phép đo.
- [x] Nâng `vessel-art.tsx`, `motion-scene.tsx`, `apparatus.tsx` và CSS; lifecycle tại `workbench.tsx`; không sửa dữ liệu khoa học.
- [x] GREEN các case mới và regressions liên quan desktop/mobile, typecheck, ESLint các file thay đổi, diff check.
- [x] Kiểm hình desktop/mobile/start/middle/end, sửa gộp và xác nhận; review với `review-animations` và VECLab Motion. Giữ bản local cho người dùng duyệt.

## Review focus

Nguồn/đích cùng cập nhật dù cue bị ngắt; không mất cue khi thao tác trên pane mobile; không còn level animation trong reduced motion; lọc không giả chuyển toàn bộ dung dịch; số đo N/A và chưa đo không thành 0; ID SVG không trùng giữa scene và sáu bình; không tràn chữ/vạch trên mobile.

## Kết quả local và bằng chứng

- Thang vạch và mặt dịch dùng cùng hình học thân bình 250 mL; lớp nước và hữu cơ được tính từ thể tích từng pha, không chia chiều cao theo tỷ lệ đơn giản. Đây là hình học SVG xấp xỉ, không phải hiệu chuẩn dụng cụ thực.
- Bổ sung mặt dịch di chuyển, nguồn cấp vơi, nguồn/đích thay đổi đồng thời; dòng rót đi từ mép miệng bình. Cốc nghiêng quanh mép rót, nhóm dịch giữ hướng ngang. Hai đường thu từ F được phân biệt theo pha.
- Lọc có cảnh riêng, chỉ rắn ẩm/dịch lưu sang bình thu; dịch lọc vẫn ở nguồn. Cô/làm khô có cảnh loại dịch, chất rắn định tính; máy đo/cân hiện đúng phép đo đã lưu.
- Dải giải thích thao tác có thể tích trước → sau và nút xem frame cuối; thao tác tiếp theo thay cue cũ. Clock chỉ dọn UI, giữ thời gian còn lại khi scene/tab ẩn; live reduced motion đưa ngay về projection. Restore/lượt mới dọn cue.
- RED ban đầu: 4/4 desktop case mới thiếu thang/cảnh/feedback. GREEN: 10/10 case mới desktop/mobile, gồm frame đầu/giữa/cuối, skip, restore, hai pha, lọc/làm khô/cân, cue mobile, live preference, sự kiện tab ẩn, lượt mới và ID SVG.
- Regression hiện có: 8/8 case desktop/mobile cho hai quy trình hoàn chỉnh (đúng và bỏ trộn), số đo/báo cáo lưu bất biến, tooltip/keyboard/touch và trạng thái pha/giới hạn thể tích. Sau chỉnh hình học rót, 4/4 case trạng thái pha/tooltip được chạy lại cùng 10 case mới: 14/14 qua.
- Kiểm hình phát hiện source bị cắt trên desktop ở góc nghiêng và một nhãn dung tích đè lên cảnh cân/lọc. Thêm assertion bounding box tái hiện RED cho clipping; sửa headroom và nhãn theo cảnh. Lần cuối 10/10 case mới qua, typecheck và ESLint 6 file TS/TSX qua, `git diff --check` qua. Bản sửa nhãn mô tả đường thu pha là copy-only.
- Ảnh QA nằm trong `.superpowers/extraction-visual-pass` và `.superpowers/extraction-confirm` (git-ignored); không thêm runner, control seek công khai hoặc thư viện.

## Tự review theo VECLab Motion / review-animations

| Trước | Sau | Căn cứ |
| --- | --- | --- |
| Vạch không có số, thang hình học tách rời thể tích pha | Cùng thang cho vạch/mặt dịch, xét thân thuôn | Frame cuối và giá trị 40/20 mL độc lập trong E2E |
| F luôn xả từ khóa khi chuyển dịch | Nước qua khóa; hữu cơ rót từ miệng | Hai nhánh collection có test |
| Lọc dùng cảnh dòng dịch giống chuyển toàn mẫu | Cảnh thu rắn, dịch lưu 0,5 mL và dịch lọc ở nguồn | Fixture S 50 → 49,5; R1 0 → 0,5 mL |
| Reduced motion vẫn animate level | Frame projection tĩnh, số/giải thích giữ nguyên | Live media và reload tests |
| Clock bắt đầu lại khi trở về scene | Giữ remaining và callback theo key | Case pane mobile/tab ẩn, revision không tăng |
| Máy đo/cân chỉ là minh họa không số | Hiện phép đo đã lưu, N/A giữ nguyên | Đối chiếu readout và màn hình máy |

Verdict: passes assigned local UI scope, tự review theo quy định không subagent. Phần source/target bị cắt đã có RED→GREEN; không còn finding chặn bản local. SVG stroke/clip có thể repaint; không tuyên bố 60fps trên thiết bị thật. Không kiểm chứng thực nghiệm mô hình hóa học. Không sửa engine/session/projection/API/database, legacy release, báo cáo, Jar Test, landing hoặc dependency. Không chạy full suite/production build/CI vì chưa merge hay phát hành.

Đã giữ commit Jar Test được người dùng duyệt tại `94ac2b0`; patch extraction hiện ở nhánh riêng, chưa commit/push/merge/deploy, chờ người dùng xem bản local: `http://localhost:3004/simulate/acid-base-extraction`.
