# Jar Test — nâng cấp cảnh thực hành

Coder 2; branch `feature/jar-motion-upgrade`; base `fca4649`; target `develop`.
Người dùng yêu cầu áp dụng bộ skill và triển khai từ các mẫu hiện có.

Giữ khung workbench, sáu vị trí cốc, controls/guide/notebook và contract khoa học.
Dùng CSS/SVG hiện có, không thêm dependency, không đổi extraction/landing/engine.

- Điểm nhấn: bình cấp mẫu và pipet rõ hình học, dòng cấp nối đúng cốc; pha lắng
  chuyển từ bông đang phân tán đến lớp đáy, chỉ khi có action vừa commit.
- Liên tục: cue theo action ID; kết thúc tự dọn; không phát lại khi chọn cốc,
  đổi pane hay khôi phục attempt. Pha máy khuấy đang biểu diễn vẫn chạy khi hiện.
- Phản hồi: dải giải thích thao tác hữu hạn, xác định cốc/pha; phép đo giữ số thật,
  minh họa cuvet và máy đo. Không dùng số hạt để suy NTU.
- Ngân sách: cue tối đa 2,6 giây, không chặn controls; transform/opacity và clip
  cục bộ. Pause ngoài viewport/tab; reduced motion giữ frame cuối và phản hồi chữ.

1. Regression cho cue mobile, dọn cue, khôi phục và đổi motion preference: RED.
2. Nối lifecycle cue ở workbench, nâng hình dung cụ/các pha, giữ SVG chi tiết cũ.
3. GREEN focused E2E desktop/mobile, đo NTU hiện có, typecheck, lint và diff check.
4. Tự review với veclab-motion/review-animations, kiểm hình một lượt desktop/mobile,
   sửa gộp nếu cần và để bản local cho người dùng xem. Không subagent/merge/deploy.

Ruling: reduced motion dùng frame tĩnh và nhãn pha, thay vòng khuấy chậm vô hạn cũ;
đây là nâng cấp accessibility của motion, không thay thời gian mô phỏng/kết quả.

## Kết quả local

- Đã nâng hình bình cấp mẫu, pipet, dòng cấp/ripple, bông/lớp đáy và cuvet/máy đo;
  giữ dàn cốc chi tiết, controls, guide và notebook hiện có. Dải giải thích chỉ hiện
  sau action được lưu; cue mới thay cue cũ, kết thúc dọn đúng action ID.
- Frame lắng tĩnh dùng elapsed time từ projection và duration từ profile. Chỉ cue
  `run_phase` mới phát lắng; reload/khôi phục và đổi cốc không phát lại. Reduced
  motion giữ frame cuối; chữ/số đo và pha vẫn hiện, không sửa preference hệ thống.
- Pause cả chuyển động và thanh cue khi ngoài viewport/tab. Chọn cốc tự đưa cốc
  vào vùng nhìn của rack, không cuộn trang hay đổi focus. Không thêm action/kết quả.
- RED: hai case mới thất bại đúng vì thiếu explanation và reduced motion vẫn
  quay; case chọn F thất bại desktop/mobile vì cốc ngoài vùng nhìn, trước khi sửa.
- GREEN cuối: 8/8 case mới desktop/mobile (`jar-motion-upgrade`), cộng 8/8 case
  existing tập trung cho layout, khuấy mặc định và phép đo NTU trong reduced motion.
  Bao phủ cue chờ pane mobile, dọn/thay cue, đổi cốc, restore và hình học cuối pha.
- Typecheck, ESLint bốn file TS/TSX thay đổi và `git diff --check`: pass.
  Một lần Impeccable detector trả `[]`. Hai vòng kiểm hình theo giới hạn skill:
  desktop/mobile cho chuẩn bị/lắng, sửa bình cấp và xác nhận; không tràn trang.

## Tự review motion

| Trước | Sau | Căn cứ |
| --- | --- | --- |
| Lắng theo phase có thể phát lại khi restore | Chỉ phát theo cue action; frame nghỉ từ projection | Regression reload và geometry cuối |
| Reduced motion quay liên tục | Pha/số đo giữ nguyên với frame tĩnh | Live media change và NTU existing cases |
| Cue không có vòng đời rõ | Clock cosmetic hữu hạn, callback ID chỉ dọn UI | Case thay cue và revision không tăng |
| Cốc F có thể ngoài vùng nhìn | Chỉ rack tự cuộn tới cốc được chọn | Case desktop/mobile riêng |

Verdict: đủ cho người dùng xem bản local. Tự review, không subagent theo AGENTS.
Không sửa simulation/session/projection/engine/API/DB, extraction, landing hoặc
dependency. Không chạy full suite/cloud/DB/production build cho phạm vi UI này.
Ảnh kiểm chỉ là browser rendering; không phải bằng chứng 60fps trên thiết bị thật
hay validation thực nghiệm. Chưa commit/push/merge/deploy phiên bản nâng cấp.

Bản local: `http://localhost:3004/simulate/jar-test`.

## Tinh chỉnh mực nước theo phản hồi người dùng

- Người dùng làm rõ chỉ cần thấy mẫu và mực nước đúng khi cấp/rót. Giữ release
  hiện tại: cốc trống trước `prepare_cup`, sau đó chứa 500 mL mẫu nước đục kaolin.
  250 mg/L là liều phèn, không phải thể tích. Không thêm thao tác nước mới.
- Mặt nước, vạch lớn 250/500/750/1000 mL và vạch nhỏ 50 mL dùng cùng thang hình học
  từ dung tích profile. Nguồn mẫu vơi đồng thời cốc nhận dâng; meniscus và dòng
  rót đi cùng mặt nước, không chỉ mở một mask tại vị trí cố định.
- Phân biệt nhãn 0 mL/cốc trống với 500 mL mẫu nước đục, tăng độ rõ chất lỏng/lớp
  đáy. Kích thước SVG cùng dàn được cố định, nhãn dài không đẩy lệch đường đáy.
- Cấp phèn không làm tăng nước trong renderer: contract hiện tính khối lượng/liều,
  chưa có thể tích dung dịch cấp. Độ đục và số bông không làm đổi thể tích mẫu.
- RED→GREEN cho nguồn giảm/cốc tăng, vạch 500 khớp mặt nước, reload/reduced motion
  và kích thước cốc bằng nhau. Regression phát hiện key trùng giữa body/surface
  trong bản sửa; đã tách key để không giữ lớp hạt cũ khi cue bị thay.
- 12/12 E2E tập trung desktop/mobile qua sau sửa, typecheck/lint/diff check qua.
  Đã xem một lượt hình cấp/đầy desktop/mobile và xác nhận sau căn dàn.
