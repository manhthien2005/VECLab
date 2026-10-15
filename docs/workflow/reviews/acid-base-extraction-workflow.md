# Kiểm tra workflow chiết tách axit–bazơ — 15/10/2026

Source được kiểm tra: `c703f1a1304b993cb5a827efde8d43c870647889`, nhánh `feature/acid-base-extraction`, local `127.0.0.1:3004`.

**Verdict: needs changes.** Luồng chính khả thi và dữ liệu khớp; trải nghiệm học thao tác và truy vết nguyên nhân chưa đủ để chốt. Round này chỉ kiểm tra, không đổi engine, giao diện hoặc release.

## Phần đã xác nhận

- Hai hướng tách A trước / B trước đều hoàn thành được theo hồ sơ A/B/N. Cân bằng từng cấu tử được giữ trong các trường hợp đã kiểm tra.
- Browser thực hiện chuỗi chuyển mẫu → cấp dung dịch → trộn/xả áp/phân lớp → thu pha → kết tủa/lọc → cô/làm khô/cân → khai báo → xác nhận nộp → báo cáo. Reload và mở báo cáo từ Lab giữ giá trị đã lưu.
- Phân lớp khi chưa xả áp bị từ chối; thao tác bị từ chối không tăng revision. Sau cấp dung dịch/chuyển pha, thể tích các bình trên UI khớp dữ liệu đã lưu.
- Chưa có bằng chứng cần thay mô hình số học vì lỗi giao tiếp FE/session trong các đường chạy trên. Đây là session/engine local IndexedDB, không phải kiểm chứng API/cloud hoặc hóa chất thực.

## Findings cần xử lý

### EXT-WF-01 — Cao: bỏ qua trộn vẫn đạt như thao tác đầy đủ

Tái hiện: chạy luồng chuẩn, bỏ cả hai lệnh `mix` sau khi cấp dung dịch vào F; vẫn xả áp, phân lớp và thu pha. Kết quả: cả hai lượt đạt mục tiêu, toàn bộ trạng thái vật chất cuối của sáu bình giống nhau. Khối lượng R1/R2/R3 trong phép thử lần lượt 95,055463 / 91,830791 / 99,341922 mg; đây là đầu ra chương trình, không phải xác nhận thực nghiệm.

`engine.ts:51–53` chỉ dùng `mix` để đổi cờ; `settle` chỉ kiểm tra `vented`. Phân bố được tính từ cân bằng hiện tại, không ghi nhận đã trộn mẻ dung dịch mới hay chưa. Giới hạn cân bằng tức thời là thiết kế đã công khai, nhưng đánh giá cuối chưa phân biệt thao tác thiếu với thao tác đầy đủ.

Hướng sửa tối thiểu: phân biệt kết quả định lượng và việc thực hiện thao tác; ghi nhận thiếu trộn cho mẻ hiện tại trong báo cáo cuối. Không tự cộng/trừ hiệu suất giả hoặc thêm kinetics chưa có dữ liệu. Nếu thay trạng thái/quy tắc domain, cần khóa phiên bản và giữ lượt cũ.

Đối chiếu phương pháp: [NTU, mục V và Procedure I](https://teaching.ch.ntu.edu.tw/gclab/eng/wp-content/uploads/5_M19_Extraction.pdf) phân biệt trộn hai pha, xả áp và để phân lớp. Nguồn này không xác nhận hệ số A/B/N của VECLab.

### EXT-WF-02 — Vừa: thao tác không có mẫu vẫn trông như xử lý thành công

Tái hiện F trống: `mix`, `vent`, `settle`, `filter`, `evaporate`, `dry` đều được chấp nhận, thêm sáu bản ghi lịch sử nhưng không đổi lượng vật chất. Browser xác nhận trộn F trống và lọc F → R1 trống không có phản hồi giải thích việc không thu được mẫu.

Vị trí: `engine.ts:51–79`, `controls.tsx:25` và các nút thao tác. Các nút chỉ khóa theo trạng thái lưu, chưa phản ánh khả năng sử dụng dụng cụ với mẫu đang chọn.

Hướng sửa: phân biệt thao tác không thể thực hiện trên bình trống với lựa chọn hóa học hợp lệ nhưng kém hiệu quả. Có thể khóa thao tác không áp dụng hoặc phản hồi ngắn rằng không có mẫu/chất rắn được chuyển; giữ phép đo 0 và N/A đúng nghĩa. Không chặn sai pha hoặc sai thuốc thử chỉ để dẫn người học tới đáp án.

### EXT-WF-03 — Cao: chưa truy lại được lựa chọn gây sai kết quả

Lịch sử chiếu ra UI chỉ còn số bước, tên hành động và bình đi/đến (`extraction-projection.ts:16`); thiếu loại dung dịch, thể tích, pha đã chuyển. Báo cáo “Thao tác liên quan” chỉ hiển thị tám ký tự đầu của action ID (`report.tsx:11`), không ánh xạ thành thao tác có nghĩa với người học.

Hướng sửa: dùng input đã lưu của event để hiện dòng ngắn, ví dụ “#7 · Thêm bazơ 20 mL vào F” / “#12 · Chuyển pha nước 20 mL F → S”. Báo cáo trỏ về số bước và nội dung này; giữ phân trang, không bung toàn bộ lịch sử và không lộ lượng A/B/N trước nộp. Chỉ quy lỗi/nguyên nhân khi dữ liệu chứng minh được.

### EXT-WF-04 — Vừa: điểm vào chưa gắn với mẫu ban đầu

Lượt mới chọn F trống, mở nhóm Cấp dung dịch, mặc định axit 20 mL; mẫu đầu 40 mL thực sự ở S (`workbench.tsx:34`, `controls.tsx:16–18`). Hướng dẫn mô tả chuyển S → F trước, nhưng bàn thao tác chưa giúp nhận ra điểm bắt đầu này. Đây là rủi ro dễ hiểu nhầm, chưa phải kết luận từ nghiên cứu người dùng.

Hướng sửa: ưu tiên chọn mẫu S khi tạo lượt mới và làm rõ tên bình trong điều khiển; hướng dẫn phần nhận/chuyển mẫu ban đầu khi người học yêu cầu. Giữ tự do chọn axit hay bazơ và thể tích cho bước chiết.

## Bằng chứng kiểm tra

- PASS: `npm run test -- tests/unit/extraction-engine.test.ts tests/integration/extraction-runtime.test.ts` — 5 tests; gồm hai hướng tách, bảo toàn lượng, lưu/mở báo cáo, retry và conflict.
- PASS: Playwright `extraction-workbench.spec.ts`, grep `full workflow`, Chromium — 1 luồng từ hướng dẫn đến báo cáo và mở lại từ Lab.
- PASS: 2 probes domain tạm — so sánh có/không trộn; thao tác trên F trống. PASS ở đây xác nhận đã tái hiện findings, không phải nghiệm thu các hành vi này.
- PASS: 1 probe browser tạm — mặc định F trống, thao tác rỗng, từ chối phân lớp thiếu xả áp, chấp nhận thu pha khi bỏ trộn, thể tích 40/20 mL và revision 7 giữ sau reload.
- Probes chạy trong context dữ liệu riêng, không sửa lượt của người dùng. File probe tạm được xóa sau kiểm tra. Không chạy toàn bộ suite/build, không deploy, không dùng subagents hoặc chụp màn hình.

Ưu tiên tiếp theo: EXT-WF-01 và EXT-WF-03, sau đó EXT-WF-02/04. Cần quyết định cách đánh giá thao tác trước khi thay đổi hợp đồng domain; không cần redesign thêm giao diện.
