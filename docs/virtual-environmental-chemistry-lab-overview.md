# Virtual Environmental Chemistry Lab

> Đây là tài liệu tổng quan ban đầu. Phạm vi lõi đã chốt tại [Báo cáo chốt phạm vi lõi dự án](core-project-scope.md). Khi có khác biệt, báo cáo scope lõi ngày 27/08/2026 là nguồn quyết định hiện hành.

## 1. Tổng quan dự án

**Virtual Environmental Chemistry Lab** là ứng dụng web mô phỏng các thí nghiệm hóa học liên quan đến xử lý chất thải, nước thải và tái chế. Người học được đặt vào một tình huống môi trường cụ thể, tự lựa chọn phương pháp xử lý, hóa chất và thông số vận hành, sau đó quan sát kết quả được tính toán dựa trên các nguyên lý hóa học.

Hệ thống hướng tới các mục tiêu:

- Giúp sinh viên liên hệ kiến thức hóa học với các bài toán môi trường thực tế.
- Cho phép thử nghiệm nhiều phương án mà không cần hóa chất và thiết bị thật.
- Cung cấp phản hồi ngay sau mỗi thao tác.
- Giải thích nguyên nhân hóa học thay vì chỉ thông báo đúng hoặc sai.
- Đánh giá hiệu quả xử lý dựa trên pH, nồng độ chất ô nhiễm, lượng kết tủa, tỷ lệ thu hồi, độ tinh khiết, chi phí và mức độ an toàn.

### Phạm vi MVP đề xuất

Với đội ngũ 4 lập trình viên và thời gian 2 tháng, phiên bản đầu tiên nên tập trung vào 3 bài thực hành hoàn chỉnh:

1. **Trung hòa nước thải axit**
   - Người học chọn bazơ, nhập nồng độ và thể tích.
   - Hệ thống tính số mol, chất dư, pH sau phản ứng, chi phí hóa chất và nguy cơ sử dụng quá liều.

2. **Loại bỏ ion kim loại nặng bằng kết tủa**
   - Người học điều chỉnh pH hoặc thêm chất tạo kết tủa.
   - Hệ thống dự đoán khả năng tạo kết tủa, lượng kim loại còn lại và hiệu suất loại bỏ dựa trên cân bằng tan.

3. **Phân loại nhựa bằng phương pháp nổi – chìm**
   - Người học chọn môi trường phân tách và điều chỉnh khối lượng riêng của dung dịch.
   - Hệ thống xác định loại nhựa nổi hoặc chìm, tỷ lệ thu hồi và độ tinh khiết sau phân tách.

Mỗi bài thực hành gồm:

- Tình huống và mục tiêu xử lý.
- Dữ liệu đầu vào ban đầu.
- Danh sách hóa chất, vật liệu hoặc phương pháp được phép sử dụng.
- Khu vực nhập thông số và đơn vị.
- Kết quả mô phỏng theo từng thao tác.
- Giải thích phương trình hoặc nguyên lý liên quan.
- Điểm hiệu quả, an toàn và chi phí.
- Gợi ý khi lựa chọn chưa phù hợp.
- Báo cáo kết quả cuối bài.

### Hướng tiếp cận đề xuất

Nên triển khai theo mô hình **kịch bản kết hợp**: mỗi bài có mục tiêu và danh sách vật chất giới hạn, nhưng sinh viên vẫn được tự chọn phương án, liều lượng và thứ tự thao tác.

Hướng này cân bằng giữa tính giáo dục, khả năng tương tác và phạm vi có thể hoàn thành trong 2 tháng. MVP chưa nên xây dựng phòng thí nghiệm 3D, engine xử lý mọi phản ứng hóa học, chatbot AI hoặc hệ thống quản lý khóa học quy mô lớn.

## 2. Đối tượng sử dụng

### Sinh viên

- Thực hiện các bài thí nghiệm mô phỏng.
- Quan sát sự thay đổi của hệ sau mỗi thao tác.
- Nhận giải thích và gợi ý cải thiện.
- Xem điểm, lịch sử thao tác và báo cáo kết quả.

### Giảng viên

- Xem danh sách bài thực hành.
- Theo dõi kết quả và số lần thử của sinh viên.
- Xem phương án xử lý sinh viên đã sử dụng.
- Xuất kết quả dưới dạng CSV.

Trong MVP, nội dung bài thực hành có thể được quản lý bằng tệp JSON hoặc dữ liệu trong cơ sở dữ liệu. Chưa cần xây dựng công cụ để giảng viên tự tạo phản ứng mới.

## 3. Lợi ích khi triển khai

### Đối với sinh viên

- Thực hành an toàn, không tiếp xúc với hóa chất độc hại.
- Có thể thử lại nhiều lần mà không phát sinh chi phí vật tư.
- Nhận phản hồi ngay lập tức.
- Hiểu ảnh hưởng của liều lượng, nồng độ và thứ tự thao tác.
- Phát triển khả năng phân tích và ra quyết định thay vì chỉ ghi nhớ phương trình.
- Có thể học trên laptop hoặc điện thoại mà không phụ thuộc phòng thí nghiệm.

### Đối với giảng viên và nhà trường

- Giảm chi phí hóa chất, thiết bị và xử lý chất thải sau thí nghiệm.
- Dễ tổ chức hoạt động chuẩn bị trước hoặc củng cố sau buổi thực hành thật.
- Chuẩn hóa tình huống, dữ liệu và cách đánh giá.
- Theo dõi được quá trình thử nghiệm, không chỉ kết quả cuối cùng.
- Có thể tái sử dụng và mở rộng nội dung qua từng học kỳ.

### Đối với giá trị của đề tài

- Giải quyết bài toán thực tế và có ý nghĩa môi trường rõ ràng.
- Kết hợp kiến thức hóa học, công nghệ phần mềm và giáo dục.
- Có kết quả trực quan qua số liệu, đồ thị và tình huống tương tác.
- Có tiềm năng mở rộng thành nền tảng học tập hoặc nghiên cứu.

## 4. Hạn chế và rủi ro khi triển khai

### 4.1. Giới hạn của mô hình hóa học

Mô phỏng chỉ phản ánh các giả định đã được lập trình. Kết quả thực tế còn phụ thuộc vào nhiệt độ, tốc độ khuấy, hoạt độ ion, tạp chất, động học phản ứng và thiết bị.

**Cách kiểm soát:** công bố rõ điều kiện giả định và giới hạn áp dụng trong từng bài.

### 4.2. Độ chính xác của dữ liệu

Hằng số cân bằng, tích số tan và khối lượng riêng có thể thay đổi theo nguồn dữ liệu và điều kiện môi trường.

**Cách kiểm soát:** thống nhất nguồn dữ liệu, đơn vị và điều kiện chuẩn; nhờ giảng viên hóa học kiểm duyệt.

### 4.3. Khó xây dựng engine tổng quát

Một engine có thể xử lý mọi phản ứng hóa học là phạm vi quá lớn đối với 4 người trong 2 tháng.

**Cách kiểm soát:** sử dụng giao diện chung nhưng xây công thức riêng cho từng nhóm bài toán.

### 4.4. Không thay thế hoàn toàn thực hành thật

Sinh viên không học được kỹ năng sử dụng dụng cụ, thao tác an toàn và quan sát vật lý ngoài đời.

**Cách kiểm soát:** xác định sản phẩm là công cụ chuẩn bị và củng cố kiến thức, không phải giải pháp thay thế hoàn toàn phòng thí nghiệm.

### 4.5. Khối lượng xây dựng nội dung

Mỗi bài thực hành cần dữ liệu, công thức, giải thích, gợi ý và bộ kiểm thử riêng.

**Cách kiểm soát:** ưu tiên 3 bài có chất lượng tốt thay vì nhiều bài nhưng sơ sài.

### 4.6. Rủi ro tiến độ

Giao diện, mô hình hóa học và nội dung giáo dục đều có thể phát sinh thêm yêu cầu.

**Cách kiểm soát:** hoàn thành một bài thực hành xuyên suốt ngay trong 2 tuần đầu, sau đó tái sử dụng cấu trúc cho các bài còn lại.

## 5. Kiến trúc đề xuất

Nên sử dụng kiến trúc web monolith đơn giản:

```text
Trình duyệt sinh viên
        |
        v
Ứng dụng Next.js
  |-- Giao diện phòng thí nghiệm
  |-- API và xác thực
  |-- Simulation Engine
  |-- Feedback & Scoring Engine
  `-- Quản lý kịch bản
        |
        v
Supabase PostgreSQL
  |-- Người dùng
  |-- Kịch bản
  |-- Lần thực hành
  `-- Kết quả
```

Không nên dùng microservice, Kubernetes, message queue hoặc hệ thống container phức tạp trong MVP.

### Công nghệ phù hợp

- **Frontend và backend:** Next.js với TypeScript.
- **Giao diện:** Tailwind CSS và thư viện component nhẹ.
- **Đồ thị:** Recharts hoặc Chart.js.
- **Cơ sở dữ liệu:** Supabase PostgreSQL.
- **Đăng nhập:** Supabase Auth; đồng thời cho phép dùng thử không cần tài khoản.
- **Hosting ứng dụng:** Vercel.
- **Kiểm thử:** Vitest cho công thức và Playwright cho luồng thực hành chính.
- **Theo dõi lỗi:** Sentry ở gói miễn phí nếu cần.
- **Mã nguồn và tự động kiểm tra:** GitHub và GitHub Actions.

Mô hình này có chi phí ban đầu gần như bằng 0, dễ triển khai và phù hợp với sinh viên.

## 6. Các core cần tập trung xây dựng

### 6.1. Scenario Core

Quản lý cấu hình của một bài thực hành:

- Bối cảnh và mục tiêu.
- Trạng thái ban đầu.
- Danh sách chất hoặc vật liệu.
- Khoảng giá trị đầu vào.
- Quy tắc thành công.
- Gợi ý và nội dung giải thích.

Kịch bản nên có cấu trúc dữ liệu thống nhất để giao diện không phải viết lại hoàn toàn cho từng bài.

### 6.2. Simulation Engine

Đây là phần quan trọng nhất của dự án. Engine nên được viết dưới dạng các hàm TypeScript thuần, độc lập với giao diện và cơ sở dữ liệu.

Ba mô-đun ban đầu:

- **Acid–Base Engine:** số mol, chất giới hạn, lượng dư và pH.
- **Precipitation Engine:** phản ứng tạo kết tủa, tích số tan, nồng độ còn lại và hiệu suất loại bỏ.
- **Density Separation Engine:** so sánh khối lượng riêng, trạng thái nổi/chìm, tỷ lệ thu hồi và độ tinh khiết.

Mỗi phép tính phải trả về cả kết quả cuối và dữ liệu trung gian để hệ thống có thể giải thích cách tính.

### 6.3. Interaction Core

- Chọn hóa chất hoặc phương pháp.
- Nhập nồng độ, thể tích hoặc khối lượng.
- Kiểm tra đơn vị và giới hạn đầu vào.
- Thực hiện từng thao tác.
- Làm lại hoặc đặt lại thí nghiệm.
- Hiển thị lịch sử thao tác.

### 6.4. Explanation & Feedback Core

Phản hồi cần chỉ ra:

- Điều gì vừa xảy ra.
- Phương trình hoặc nguyên lý liên quan.
- Vì sao kết quả tốt hoặc chưa tốt.
- Sinh viên có thể điều chỉnh thông số nào.
- Cảnh báo khi dùng quá liều hoặc chọn phương án không phù hợp.

MVP nên dùng luật xác định trước thay vì AI để kết quả ổn định, dễ kiểm thử và không phát sinh chi phí API.

### 6.5. Evaluation Core

Chấm điểm theo các tiêu chí:

- Mức độ đạt mục tiêu xử lý.
- Lượng hóa chất đã sử dụng.
- Chi phí tương đối.
- Số bước thực hiện.
- Mức độ an toàn.
- Chất thải thứ cấp phát sinh.

Điểm tổng hợp chỉ là phần tóm tắt. Sinh viên vẫn cần xem điểm thành phần để hiểu cách cải thiện.

### 6.6. Learning Progress Core

- Lưu lần thực hành.
- Lưu từng thao tác và kết quả.
- So sánh các lần thử.
- Hiển thị tiến độ hoàn thành.
- Tạo báo cáo cuối bài.
- Cho giảng viên xem hoặc xuất kết quả.

### 6.7. Content Validation & Testing Core

Các công thức phải có bộ dữ liệu chuẩn đã được kiểm chứng. Mỗi bài cần kiểm thử:

- Trường hợp đúng điển hình.
- Thiếu và thừa hóa chất.
- Giá trị biên.
- Sai đơn vị.
- Dữ liệu âm hoặc không hợp lệ.
- Trường hợp không tạo kết tủa hoặc không phân tách được.
- Sai số số học và quy tắc làm tròn.

## 7. Milestone triển khai trong 2 tháng

| Thời gian | Công việc chính | Kết quả cần đạt |
| --- | --- | --- |
| **Tuần 1** | Chốt phạm vi MVP; xác định giả định hóa học; thu thập dữ liệu; thiết kế luồng người dùng và cấu trúc kịch bản | Có đặc tả cho 3 bài, công thức, wireframe và tiêu chí nghiệm thu |
| **Tuần 2** | Khởi tạo ứng dụng, UI chung và cơ sở dữ liệu; xây Acid–Base Engine và bài trung hòa đầu tiên | Một luồng hoàn chỉnh từ nhập dữ liệu đến kết quả và giải thích |
| **Tuần 3** | Hoàn thiện bài trung hòa; thêm biểu đồ, scoring, gợi ý và kiểm thử công thức | Bài số 1 đạt chất lượng demo và được kiểm tra chuyên môn |
| **Tuần 4** | Xây Precipitation Engine và bài loại bỏ kim loại nặng | Mô phỏng được kết tủa, nồng độ còn lại và hiệu suất xử lý |
| **Tuần 5** | Xây Density Separation Engine và bài phân loại nhựa | Mô phỏng được nổi/chìm, độ tinh khiết và tỷ lệ thu hồi |
| **Tuần 6** | Đăng nhập, lưu tiến độ, lịch sử thao tác, báo cáo và màn hình giảng viên tối thiểu | Người dùng có thể hoàn thành và xem lại toàn bộ bài thực hành |
| **Tuần 7** | Kiểm thử tích hợp, kiểm tra công thức, sửa UX, tối ưu điện thoại và bổ sung nội dung | Bản release candidate ổn định; các trường hợp biên được xử lý |
| **Tuần 8** | Thử nghiệm với nhóm sinh viên, sửa lỗi, triển khai production, viết tài liệu và chuẩn bị demo | MVP chạy trên Internet, có tài khoản demo và kịch bản thuyết trình |

### Checkpoint quan trọng

- **Cuối tuần 2:** có một luồng hoàn chỉnh, không chỉ có giao diện.
- **Cuối tuần 5:** cả 3 engine hoạt động và có unit test.
- **Cuối tuần 7:** khóa tính năng, chỉ sửa lỗi và hoàn thiện nội dung.
- **Tuần 8:** không bổ sung mô-đun hóa học mới.

## 8. Phân công đội ngũ 4 người

### Thành viên 1 – Frontend và UX

- Giao diện phòng thí nghiệm.
- Form nhập dữ liệu và kiểm tra đầu vào.
- Đồ thị, animation và khả năng hiển thị trên điện thoại.
- Phối hợp kiểm thử luồng người dùng.

### Thành viên 2 – Chemistry Simulation Engine

- Mô hình và công thức hóa học.
- Chuẩn hóa đơn vị.
- Kiểm thử kết quả số.
- Phối hợp với giảng viên hoặc người phụ trách chuyên môn.

### Thành viên 3 – Backend và dữ liệu

- API, cơ sở dữ liệu và xác thực.
- Lưu phiên thực hành, thao tác và điểm.
- Báo cáo sinh viên và giảng viên.
- Quyền truy cập dữ liệu.

### Thành viên 4 – Integration, QA và triển khai

- Scenario Engine, Feedback Engine và scoring.
- Kiểm thử đầu cuối.
- CI/CD, hosting và giám sát lỗi.
- Tài liệu sử dụng và dữ liệu demo.

Không nên chia tách hoàn toàn theo vai trò. Mỗi core quan trọng cần có ít nhất 2 người hiểu để tránh phụ thuộc vào một thành viên.

## 9. Hạ tầng tối ưu cho sinh viên

### Môi trường phát triển

- GitHub repository.
- Quy trình branch và pull request ngắn.
- Tự động chạy lint, type-check và unit test khi tạo pull request.
- Ba môi trường: local, preview và production.
- Mỗi pull request có một đường dẫn preview trên Vercel.

### Production

- **Vercel Free/Hobby:** host ứng dụng Next.js.
- **Supabase Free:** PostgreSQL, xác thực và lưu trữ dữ liệu.
- **GitHub Actions:** kiểm tra tự động.
- **Tên miền:** dùng tên miền Vercel miễn phí trong giai đoạn đầu.
- **Sao lưu:** xuất dữ liệu định kỳ hoặc sử dụng khả năng backup của Supabase tùy gói.

### Tối ưu chi phí và vận hành

- Không yêu cầu sinh viên cài đặt phần mềm.
- Cho phép thực hành không đăng nhập; chỉ cần tài khoản khi muốn lưu tiến độ.
- Giảm kích thước hình ảnh và animation.
- Không sử dụng AI API trong MVP.
- Không chạy máy chủ riêng liên tục.
- Cache dữ liệu kịch bản ít thay đổi.
- Ưu tiên responsive web thay vì xây ứng dụng mobile riêng.
- Có dữ liệu demo cục bộ để ứng dụng vẫn trình diễn được nếu cơ sở dữ liệu gặp lỗi.

## 10. Tiêu chí nghiệm thu MVP

MVP được xem là hoàn thành khi:

- Cả 3 bài thực hành hoạt động xuyên suốt.
- Kết quả các ca kiểm thử hóa học khớp dữ liệu chuẩn trong sai số quy định.
- Mọi đầu vào đều có đơn vị và được kiểm tra hợp lệ.
- Mỗi thao tác đều có kết quả và giải thích.
- Sinh viên có thể làm lại và so sánh kết quả.
- Hệ thống lưu được lịch sử và báo cáo.
- Giao diện sử dụng tốt trên laptop và điện thoại.
- Ứng dụng được triển khai trên một đường dẫn công khai.
- Có tài liệu mô tả giả định và giới hạn của từng mô hình.

## 11. Hướng mở rộng sau MVP

- Xử lý độ cứng của nước.
- Hấp phụ bằng than hoạt tính.
- Keo tụ và tạo bông.
- Mô phỏng nhu cầu oxy hóa học hoặc sinh hóa.
- Tái chế pin và thu hồi kim loại.
- Tối ưu đa mục tiêu: hiệu quả, chi phí và chất thải thứ cấp.
- Công cụ để giảng viên tự xây dựng kịch bản.
- Chế độ lớp học và bảng xếp hạng.
- Kết nối LMS như Moodle.

## 12. Kết luận

Với đội ngũ 4 người trong 2 tháng, mục tiêu phù hợp nhất là xây dựng một simulation engine có kết quả xác định, dễ kiểm thử và 3 bài thực hành có chiều sâu. Phạm vi này đủ để tạo ra một MVP hoàn chỉnh, có giá trị giáo dục, chi phí vận hành thấp và thuyết phục khi trình diễn.

## 13. Tài liệu thiết kế nền tảng

Các quyết định mới nhất về Process Core, kịch bản xử lý nước thải, kịch bản tái chế nhựa và khung kiểm chứng kỹ thuật – pháp lý được ghi tại:

- [Nền tảng thiết kế mô phỏng quy trình Hóa học – CNTT](superpowers/specs/2026-08-10-process-simulation-foundation-design.md)
