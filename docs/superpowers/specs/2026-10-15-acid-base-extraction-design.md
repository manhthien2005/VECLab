# Chiết tách axit–bazơ — thiết kế bản thực hành đầu

Ngày 15/10/2026. Căn cứ source Jar Test production `ea748af1d939c571d7e684966dc00adc090a65f4`. Người dùng yêu cầu triển khai riêng bài này; không sửa các thí nghiệm khác, không tự phát hành production.

## Quyết định được giữ

- Bộ ba mục tiêu: Jar Test, Chiết tách axit–bazơ (thay bài pH độc lập), Hấp phụ xanh methylene. Lượt hiện tại chỉ xây bài chiết; không thay thẻ hay engine bài khác.
- Sinh viên không chuyên hóa, có nền tảng cơ bản. Cho tự quyết định và mắc lỗi; giải thích nguyên nhân sau nộp. Có hướng dẫn dụng cụ và lý thuyết theo yêu cầu.
- Dùng khung workbench sáng của Jar: mẫu/dụng cụ, khu vực thực hành, thao tác theo bình được chọn, sổ đo; desktop và mobile.
- Local IndexedDB kể cả đăng nhập, lưu/mở lại, chống nhân đôi thao tác, xác nhận nộp và báo cáo bất biến. Không cloud, database migration, AI tutor hoặc dependency mới.

## Hồ sơ học tập minh bạch

Đợt đầu là mẫu chuẩn ba cấu tử A (axit yếu), B (bazơ yếu), N (trung tính), không phải một hỗn hợp hóa chất thực đã được hiệu chuẩn. Hệ số phân bố, pKa, khối lượng phân tử và độ tan là quy ước công khai, được khóa phiên bản. Không gọi kết quả là thực nghiệm hoặc chỉ dẫn vận hành cho hóa chất thật.

Mô hình tính phân bố cân bằng hai pha ở nhiệt độ cố định, cân bằng axit–bazơ và kết tủa theo độ tan giới hạn. Không mô phỏng kinetics, nhũ tương, áp suất thực, phản ứng phân hủy, độ không lý tưởng hoặc màu giả để chỉ đáp án. Xả áp là thao tác sử dụng dụng cụ, không có kịch bản nổ ngẫu nhiên.

Nguồn phương pháp: [MIT — Acids, Bases and in Between](https://ocw.mit.edu/courses/5-301-chemistry-laboratory-techniques-january-iap-2012/pages/labs/acids-bases-in-between/), [NTU — Extraction](https://teaching.ch.ntu.edu.tw/gclab/eng/wp-content/uploads/5_M19_Extraction.pdf), [University Chemistry — hai phương án tách](https://www.dxhx.pku.edu.cn/EN/10.3866/PKU.DXHX201904048). Các nguồn chứng minh phương pháp/giáo dục, không chứng minh hệ số quy ước VECLab.

## Lượt thực hành

1. Nhận mẫu chuẩn, chuyển vào phễu chiết.
2. Chọn dung dịch axit, bazơ hoặc nước và thể tích; trộn, xả áp, để phân lớp.
3. Thu pha nước hoặc hữu cơ vào bình được chọn. Có thể chiết lặp với pha mới, giữ/rửa/gộp các phần mẫu; không ép axit trước hay bazơ trước.
4. Điều chỉnh phần dịch đã thu để tạo chất rắn; lọc sang bình sản phẩm. Pha hữu cơ có thể thu hồi bằng cô dung môi.
5. Làm khô, cân, khai báo bình chứa A/B/N và tự tính phần trăm thu hồi.
6. Xác nhận nộp; xem lượng thu hồi, thành phần theo mô hình, đáp số, dung môi và các thao tác dẫn tới thất thoát/lẫn mẫu.

Định danh bình ổn định: S (mẫu đầu), F (phễu), R1/R2/R3 (bình thu), W (thải). Không sinh workspace/editor tự do. Chọn dụng cụ, trạng thái panel và tốc độ chuyển động chỉ là UI; lượng chất do engine quyết định.

## Điều kiện thành công

- Hai thứ tự tách hợp lệ đều được chấp nhận theo kết quả, không so với một checklist thứ tự duy nhất.
- Chuyển sai pha/gộp sai bình/đưa vào thải là thao tác có hậu quả, không bị chặn như input sai.
- Tên cấu tử và lượng ẩn trong từng pha không xuất hiện trước nộp; sinh viên thấy thể tích, pha, chất rắn định tính và số đo đã thực hiện.
- Phân biệt % thu hồi, độ tinh khiết theo mẫu chuẩn, khối lượng cân và sai lệch đáp số. Chưa cân/khai báo thì N/A, không thành 0.
- Báo cáo chỉ nói điều được lịch sử chứng minh. Không quy phần trăm tổn thất cho một thao tác nếu không có cân bằng lượng chất tương ứng. Không tự kết luận mọi hiệu suất thấp là thao tác sai.
- Reload hoặc bỏ qua animation không đổi kết quả, không tự chạy hóa học. Giữ nguyên Jar Test và source của bài khác.
