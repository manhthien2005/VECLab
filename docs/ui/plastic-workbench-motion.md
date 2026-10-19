# Cảnh thực hành phân loại nhựa — SVG và motion

Cập nhật 19/10/2026 theo yêu cầu triển khai của người dùng. Phạm vi: cảnh tương tác bài nhựa, bộ điều khiển chuyển động và việc bỏ khóa thao tác theo thời lượng minh họa. Giữ nguyên engine/profile/session, dữ liệu đã lưu, báo cáo và hai bài chuẩn Jar Test/chiết tách.

## Hướng triển khai

Dùng khung ứng dụng hiện có, bốn cảnh quan sát: Mẫu, Bể phân loại, Ly tâm & cân, Phân đoạn. SVG viết bằng mã; bể pilot là mặt cắt minh họa, không thay pilot thành cốc thí nghiệm nhỏ. Khay và bình thu mẫu, cánh khuấy, khóa xả, rotor và cân có hình nhận biết được. Chất lỏng gần trong suốt; màu hạt là mã nhận diện. Số hạt/vị trí chỉ minh họa, không dùng làm phép đo hoặc động học.

Nhấn hạt, khay hoặc nút tên mẫu để xem thông tin; các nút tên mẫu là đường thao tác bàn phím/touch với đích ít nhất 44 px. Escape/Đóng đóng phần thông tin. Có thể chuyển cảnh quan sát mà không tạo hành động khoa học.

## Motion và quyền sở hữu

Áp dụng [VECLab Motion](../../.agents/skills/veclab-motion/SKILL.md), [Animate](../../.agents/skills/animate/SKILL.md), [Animation Performance](../../.agents/skills/animation-performance/SKILL.md), [Review Animations](../../.agents/skills/review-animations/SKILL.md), với override của dự án. Mục đích là giải thích và chỉ trạng thái; cho phép cùng cảnh khi hành động được kích hoạt bằng bàn phím. Không áp giới hạn UI 300 ms lên một cảnh thí nghiệm có chủ đích.

Sau `session.apply` thành công mới tạo cue theo `attemptId:revision`. Cue mang projection công khai trước thao tác; React luôn dựng vị trí cuối từ projection mới. WAAPI chỉ điều khiển transform/opacity của nhóm trong; nhóm ngoài giữ tọa độ đã lưu. Dùng easing `--ease-out` hiện có, quay rotor theo tuyến tính, không thêm thư viện hoặc cập nhật React mỗi frame.

| Cảnh | Thời lượng minh họa | Ý nghĩa |
| --- | --- | --- |
| Chuẩn bị mẫu | 900 ms | Khay và hạt xuất hiện |
| Nạp/làm ướt | 3.000 ms | Mực chất lỏng, hạt vào bể, cánh khuấy |
| Tách nước / mức dung dịch | 2.800 ms | Hạt dịch tới phân đoạn nổi/chìm công khai |
| Ly tâm–cân | 3.200 ms | Chuyển từ bình thu → rotor → cân; PA/PC có bình và cân riêng |
| Chọn nhánh | 700 ms tối đa | Phản hồi cảnh/môi trường, không tự chạy mức nồng độ |
| Tổng kết | 900 ms | Hiện các bình thu đã ghi nhận |

Các số trên là thời gian kể chuyện, không phải thời gian nghiên cứu. Hoàn tất cue không gọi engine, ghi phép cân hoặc đổi thời gian mô phỏng. Nút Xem trạng thái cuối, đổi cảnh, revision mới, reset, unmount, cảnh ra ngoài màn hình và tab ẩn đều hủy phần chuyển động cũ, giữ hình cuối của dữ liệu hiện tại. Reduced motion được đọc và theo dõi trực tiếp, không đổi preference của hệ điều hành. Mở lại lượt không phát lại cue lịch sử. Hủy WAAPI ngoài luồng cũng đưa cue về trạng thái tĩnh.

## Tự review motion

| Before | After | Why |
| --- | --- | --- |
| Nhiều timeout và vòng lặp, giao diện đợi cảnh để mở nút | Cue hữu hạn sau commit, prerequisite theo dữ liệu | Không bắt người học chờ hoạt ảnh; animation không quyết định khoa học |
| Cả hệ thống thu nhỏ trong một SVG | Cảnh theo dụng cụ, chữ quan trọng nằm trong HTML | Đọc được và tập trung quan sát đúng thao tác |
| Màu môi trường khác nhau, bố trí hạt ngẫu nhiên và CSS chuyển mọi thuộc tính | Chất lỏng trung tính, điểm minh họa ổn định, transform/opacity | Không dùng màu dung dịch hoặc số hạt để suy thành phần/thu hồi |
| Khôi phục/tắt chuyển động vẫn có thể chờ timer | Trạng thái tĩnh là mặc định, preference/skip/cancel đều giữ projection | Kết quả giống nhau khi không chạy chuyển động |

Không còn findings chặn trong phạm vi đã kiểm tra. Đây là source/runtime review, không phải đo FPS thiết bị thật hoặc kiểm chứng thực nghiệm của dữ liệu nguồn.

## Bằng chứng kiểm tra

- Typecheck và ESLint các file thay đổi qua.
- 27 unit test liên quan: engine, session, projection, readout và bố trí cảnh qua.
- Playwright hai project desktop/mobile: 10 kiểm tra qua, 4 trường hợp bỏ qua chủ đích trên mobile do desktop đã chạy phần motion chi tiết và toàn bộ quy trình. Mobile có kiểm tra thao tác không phải đợi, chuyển pane/cảnh, touch inspection, không tràn ngang, khôi phục và liên kết lỗi.
- Kiểm tra khung đầu/giữa/cuối của nạp mẫu bằng WAAPI trong trình kiểm thử; hình cuối sau bỏ qua khớp hình khi reload. Đã kiểm tra live reduced motion, thay revision nhanh, hủy animation, offscreen, reset và báo cáo giữ số liệu.
- Chưa đo FPS trên thiết bị thật; không tuyên bố 60/120 fps. Required CI/build toàn bộ và deploy không nằm trong đợt review local này; chưa merge/promote.
