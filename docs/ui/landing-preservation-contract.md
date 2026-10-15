# Landing VECLab — giữ thiết kế gốc, tinh chỉnh có giới hạn

Quyết định của người dùng ngày 14/10/2026. Owner: TL2 / coder 2.

## Nguồn và trạng thái

- Tham chiếu hình thức: landing trước UI-02 tại `a7c8e86349ccd54ac04dbb714e7bb836fd02fdef`, cùng ảnh toàn trang người dùng đã gửi.
- UI-02/R2 tại `ed3bc50239704d87b200dd47763a652eadbe02b2` đã qua checks kỹ thuật nhưng **bị người dùng từ chối về giao diện**. Không coi technical acceptance là đồng ý với thiết kế hoặc quyền tích hợp.
- Contract này thay thế chỉ dẫn giản lược trái với yêu cầu giữ gốc trong `landing-page-audit.md`. Không dùng lại nguyên copy deck UI-02 như một thiết kế đã được duyệt.
- Local đang phục hồi nguyên bản để đối chiếu tại `http://127.0.0.1:3002/`. Bản đối chiếu vẫn chứa nội dung/bài cũ và các lỗi đã biết; đây không phải bản đủ điều kiện phát hành.

## Phần phải giữ

- Trật tự các chương, bố cục hai vùng của hero, tỷ lệ giữa nội dung và hình sản phẩm, nhận diện teal/navy, light/dark và font Manrope hiện có.
- Hero có khung sản phẩm chi tiết: dụng cụ, biểu đồ và các panel hỗ trợ. Không thay bằng cốc đơn lẻ kèm đoạn chữ hoặc SVG nét sơ sài.
- Ba thẻ bài giữ độ chi tiết của hình minh họa và cấu trúc thẻ. Đổi bài cũ sang bài mới không có nghĩa bỏ hình hoặc dùng chung một biểu tượng cốc.
- Workbench preview giữ khung thao tác đầy đủ: tiến trình, dụng cụ, số liệu, biểu đồ và phần giải thích. Chỉnh nội dung sai ngay trong panel thay vì xóa panel.
- Evidence, CTA và footer giữ vai trò và bố cục của bản gốc; rút câu lặp trong từng khối thay vì làm trang trống hoặc xóa toàn bộ khối.

## Phạm vi tinh chỉnh

- Font weight, size, leading, khoảng cách và căn chỉnh để đọc tốt tiếng Việt, kể cả khi tăng cỡ chữ.
- Câu chữ cụ thể, tự nhiên, đúng mục đích giới thiệu toàn dự án; giữ sức nặng của tiêu đề. Không ép tất cả phần thành một câu chung chung.
- Cập nhật ba bài thành Điều chỉnh pH, Jar Test và Hấp phụ xanh methylene; trạng thái và đường dẫn phải phản ánh tính năng thật tại base của task mới. Không sửa engine/release để làm khớp quảng bá.
- Làm mượt hover/focus/press/entrance có sẵn; giảm hiệu ứng gây vướng mà vẫn giữ phản hồi và reduced motion.
- Sửa tương phản và lỗi cắt/chồng chữ có bằng chứng. Có thể dùng cách sửa đã kiểm chứng ở R1/R2 khi chuẩn bị task mới, nhưng không tự cherry-pick cả gói UI-02 đã bị từ chối.

## Giữ hình thức nhưng sửa tính trung thực

- Bản gốc là tham chiếu thiết kế, không phải nguồn xác nhận mọi con số hay câu khoa học.
- Có thể giữ biểu đồ mẫu và dữ liệu minh họa tĩnh khi ghi rõ **dữ liệu minh họa**, tách khỏi phép đo của người học. Không gọi biểu đồ tĩnh là số đo vừa thực hiện.
- Số đo chưa thực hiện vẫn là `Chưa đo`/null; không dùng 0 hoặc số mẫu để giả phép đo. Giữ panel hiển thị ngay cả khi chưa có dữ liệu.
- Demo chỉ thay thể tích phải nói đúng thao tác đó; không hứa đo pH hoặc hiện kết luận hóa học giả sau click.
- Sửa công thức/bài cũ không liên quan, số nguồn cố định hoặc ngụ ý được tổ chức bên ngoài thẩm định ngay trong khung evidence hiện hữu. Không thêm claim nước đạt chuẩn, validation thực nghiệm hoặc AI tutor đã có.

## Cách giao coder 2 tiếp theo

- Chuẩn bị task JSON v1 riêng, pinned base và allowlist theo workflow. Chưa có task triển khai mới được giao bởi tài liệu này.
- Ghim source chứa contract và giữ cách làm web implement / local review. Không đổi checkout của TL1 hoặc root; không subagents.
- Dùng diff nhỏ, nêu từng khối được chỉnh và phần hình thức được bảo toàn; không thay hàng loạt component chỉ để dễ viết lại.
- Trước khi giao, TL2 đối chiếu phạm vi với bản gốc. Sau khi coder trả, kiểm tra hình ảnh thực tế cạnh bản gốc trước khi báo người dùng duyệt; technical tests chỉ là một gate.
- Cần giữ nội dung thật, layout responsive, accessibility và hành vi đúng; không áp lệnh cấm trang trí của skill để xóa nét nhận diện người dùng muốn giữ.
- Human visual approval vẫn là gate trước khi coi thiết kế được chấp nhận. Không merge/deploy hoặc tự mở rộng scope.
