# BÁO CÁO CHỐT PHẠM VI ỨNG DỤNG WEB

## Nền tảng mô phỏng quy trình hóa học có căn cứ khoa học

**Trạng thái:** Đã được duyệt làm phạm vi web chính thức<br>
**Ngày chốt:** 27/08/2026<br>
**Thời lượng dự án:** Một học kỳ, tương đương khoảng 2 tháng<br>
**Vai trò người dùng:** Người học<br>
**Ngôn ngữ sản phẩm:** Tiếng Việt

> Tài liệu này xác định sản phẩm web cần xây dựng: các khu vực chức năng, luồng người dùng, cách lưu dữ liệu, hành vi đồng bộ, cách hiển thị kết quả, yêu cầu trên các thiết bị và những nội dung không thuộc phạm vi. Nội dung và mô hình khoa học của ba thí nghiệm được quyết định tại [Báo cáo chốt phạm vi lõi dự án](core-project-scope.md).

### Quan hệ giữa hai tài liệu scope

- [Core Project Scope](core-project-scope.md) quyết định thí nghiệm, quy trình, tham số, bằng chứng và kết quả khoa học.
- Tài liệu này quyết định trải nghiệm web, tài khoản, dữ liệu, báo cáo, responsive và các khu vực chức năng.
- Khi có khác biệt về nội dung hóa học, Core Project Scope được ưu tiên.
- Khi có khác biệt về hành vi hoặc phạm vi web, tài liệu Web Application Scope này được ưu tiên.

## Tổng quan nhanh

| | Nội dung |
| --- | --- |
| 🎯 **Mục đích** | Khóa các trang, luồng người dùng, tài khoản, lưu dữ liệu và responsive của web. |
| 👥 **Dành cho** | Product, frontend, backend, UX và QA. |
| ✅ **Sau khi đọc** | Biết web phải xây chín khu vực nào và hành vi nào bắt buộc hoạt động xuyên suốt. |
| ⚠️ **Lưu ý** | Nội dung và công thức khoa học vẫn do Core Scope và experiment specs quyết định. |

## Đọc tài liệu này khi nào?

- Trước khi thiết kế route, màn hình hoặc luồng xác thực.
- Khi cần phân biệt chế độ khách với tài khoản người học.
- Khi xác định một chức năng web có nằm ngoài MVP hay không.

## Các quyết định chính

- Web có chế độ khách đầy đủ và một vai trò tài khoản người học.
- Dữ liệu khách lưu trên trình duyệt; dữ liệu tài khoản tự lưu vào database và tiếp tục đa thiết bị.
- Simulation Workbench dùng bố cục đã duyệt cho desktop và mobile.
- Báo cáo đọc từ snapshot đã lưu và có thể in/lưu PDF bằng trình duyệt.
- Không có tài khoản giảng viên, CMS, social login, AI, mobile app riêng hoặc offline hoàn chỉnh.

## Mục lục

<!-- TOC:START -->
- [1. Tóm tắt quyết định](#1-tóm-tắt-quyết-định)
- [2. Mục tiêu của sản phẩm web](#2-mục-tiêu-của-sản-phẩm-web)
- [3. Đối tượng và quyền sử dụng](#3-đối-tượng-và-quyền-sử-dụng)
- [4. Bản đồ chín khu vực chức năng](#4-bản-đồ-chín-khu-vực-chức-năng)
- [5. Các luồng sử dụng chính](#5-các-luồng-sử-dụng-chính)
- [6. Lưu dữ liệu và đồng bộ](#6-lưu-dữ-liệu-và-đồng-bộ)
- [7. Hành vi của mô phỏng trên web](#7-hành-vi-của-mô-phỏng-trên-web)
- [8. Báo cáo, in PDF và so sánh](#8-báo-cáo-in-pdf-và-so-sánh)
- [9. Ngôn ngữ và nội dung](#9-ngôn-ngữ-và-nội-dung)
- [10. Thiết bị và responsive](#10-thiết-bị-và-responsive)
- [11. Xử lý lỗi và trạng thái bất thường](#11-xử-lý-lỗi-và-trạng-thái-bất-thường)
- [12. Bảo mật và quyền riêng tư ở mức scope](#12-bảo-mật-và-quyền-riêng-tư-ở-mức-scope)
- [13. Cấu trúc khái niệm của web](#13-cấu-trúc-khái-niệm-của-web)
- [14. Tiêu chí hoàn thành phạm vi web](#14-tiêu-chí-hoàn-thành-phạm-vi-web)
- [15. Ngoài phạm vi web](#15-ngoài-phạm-vi-web)
- [16. Mockup tham chiếu đã duyệt](#16-mockup-tham-chiếu-đã-duyệt)
- [17. Kết luận chốt scope](#17-kết-luận-chốt-scope)
<!-- TOC:END -->

---


## 1. Tóm tắt quyết định

Dự án sẽ xây dựng một ứng dụng web responsive cho phép người dùng thực hiện ba thí nghiệm mô phỏng đã được chốt trong Core Project Scope.

Web có hai trạng thái sử dụng:

1. **Chế độ khách:** người dùng có thể thực hiện đầy đủ cả ba thí nghiệm mà không cần đăng nhập. Dữ liệu được lưu trên trình duyệt hiện tại.
2. **Tài khoản người học:** dữ liệu được lưu vào database, có thể tiếp tục trên thiết bị khác, xem lịch sử, mở lại báo cáo và so sánh các lượt thử.

Ứng dụng chỉ có một vai trò người học. Không có tài khoản giảng viên, quản lý lớp học hoặc dashboard quản trị trong phạm vi hiện tại.

Web gồm chín khu vực chức năng:

1. Trang chủ và danh mục thí nghiệm.
2. Chi tiết thí nghiệm.
3. Nguồn khoa học.
4. Xác thực tài khoản.
5. Phòng lab của tôi.
6. Không gian mô phỏng.
7. Báo cáo lượt thử.
8. So sánh phương án.
9. Tài khoản và dữ liệu.

Không gian mô phỏng sử dụng bố cục “bàn thí nghiệm cân bằng”: người dùng nhìn thấy tiến trình, trạng thái, thao tác và phản hồi trong cùng một không gian. Trên điện thoại, các phần này được xếp dọc theo thứ tự sử dụng.

---


## 2. Mục tiêu của sản phẩm web

Ứng dụng web phải giúp người học:

- Tìm và hiểu mục tiêu của từng thí nghiệm.
- Bắt đầu nhanh mà không bắt buộc đăng nhập.
- Thực hiện quy trình theo từng thao tác.
- Quan sát hiện tượng, số liệu và trạng thái sau mỗi bước.
- Nhận phản hồi khoa học, cảnh báo và giới hạn mô hình.
- Đóng trình duyệt và tiếp tục lại khi có tài khoản.
- Xem lại toàn bộ quy trình đã làm.
- So sánh các phương án khác nhau.
- Xem báo cáo tổng kết và lưu PDF khi cần.
- Truy cập được nguồn khoa học và giả định đứng sau kết quả.

Giá trị của web không chỉ nằm ở việc hiển thị phép tính. Sản phẩm phải tạo ra một vòng lặp học tập rõ ràng:

```text
Chọn thí nghiệm
→ Quan sát trạng thái
→ Chọn thao tác
→ Nhập tham số
→ Nhận kết quả và giải thích
→ Điều chỉnh quy trình
→ Hoàn thành
→ Xem báo cáo
→ So sánh phương án
```

---


## 3. Đối tượng và quyền sử dụng

### 3.1. Người dùng khách

Người dùng khách được phép:

- Xem trang chủ và danh mục.
- Xem chi tiết thí nghiệm.
- Truy cập nguồn khoa học và giới hạn.
- Bắt đầu và hoàn thành cả ba thí nghiệm.
- Lưu lượt đang làm trên trình duyệt hiện tại.
- Xem báo cáo của lượt thử hiện tại.
- Đăng ký hoặc đăng nhập để chuyển lượt thử vào tài khoản.

Giới hạn của chế độ khách:

- Không đồng bộ sang thiết bị khác.
- Dữ liệu có thể mất khi người dùng xóa dữ liệu trình duyệt.
- Không có lịch sử đám mây lâu dài.
- Không thể mở dữ liệu khách từ một trình duyệt khác.

Web phải giải thích rõ các giới hạn này mà không ngăn người dùng thử sản phẩm.

### 3.2. Tài khoản người học

Người học đã đăng nhập được phép:

- Thực hiện toàn bộ chức năng của chế độ khách.
- Tự động lưu sau mỗi thao tác thành công.
- Tiếp tục lượt đang làm trên thiết bị khác.
- Xem các lượt đang làm và đã hoàn thành.
- Xóa lượt thử của chính mình.
- Mở lại báo cáo.
- Chọn hai lượt đã hoàn thành cùng exact scenario release để so sánh.
- Thay đổi tên hiển thị và mật khẩu.

### 3.3. Nguyên tắc phân quyền

- Chỉ có một vai trò người học.
- Người dùng chỉ được xem và thay đổi dữ liệu thuộc tài khoản của mình.
- Không có chức năng xem dữ liệu của người học khác.
- Không có giảng viên, quản trị viên hoặc người tạo nội dung trong giao diện sản phẩm.
- Nội dung thí nghiệm và nguồn được phát hành cùng ứng dụng, không chỉnh sửa qua CMS.

---


## 4. Bản đồ chín khu vực chức năng

### 4.1. Trang chủ và danh mục thí nghiệm

Mục đích:

- Giải thích ngắn gọn sản phẩm là gì.
- Định vị sản phẩm là công cụ học tập, không phải công cụ vận hành thực tế.
- Giới thiệu ba thí nghiệm.
- Cho phép bắt đầu nhanh hoặc đăng nhập.

Nội dung bắt buộc:

- Tên và mô tả sản phẩm.
- Ba thẻ thí nghiệm.
- Giá trị học tập chính.
- Cảnh báo giới hạn mô hình.
- Nút xem chi tiết và bắt đầu.
- Truy cập đăng nhập hoặc Phòng lab của tôi.

Không xây tin tức, blog, bảng xếp hạng hoặc nội dung marketing dài.

### 4.2. Chi tiết thí nghiệm

Mục đích:

- Giúp người dùng hiểu trước khi bắt đầu.
- Công khai phạm vi và điều kiện của mô hình.

Nội dung bắt buộc:

- Bối cảnh và mục tiêu.
- Trạng thái hoặc mẫu ban đầu.
- Các nhóm quy trình có thể thử.
- Hóa chất, vật liệu và thao tác được phép.
- Các tham số chính.
- Kết quả hệ thống sẽ đánh giá.
- Cảnh báo an toàn.
- Tóm tắt giả định và giới hạn.
- Liên kết tới nguồn khoa học.
- Nút bắt đầu lượt mới.

### 4.3. Nguồn khoa học

Mục đích:

- Tạo khả năng truy xuất cho nội dung mô phỏng.
- Phân biệt dữ liệu có nguồn với giả định của kịch bản.

Nội dung bắt buộc:

- Nguồn được nhóm theo từng thí nghiệm.
- Tên tài liệu, tác giả hoặc tổ chức và liên kết.
- Loại bằng chứng: tài liệu kỹ thuật, nghiên cứu thực nghiệm, giáo trình hoặc video.
- Điều kiện được lấy từ nguồn.
- Dữ liệu, công thức hoặc nhánh quy trình mà nguồn hỗ trợ.
- Ngày kiểm tra và phiên bản nội dung.
- Giới hạn khi áp dụng nguồn vào mô hình.

Trang nguồn khoa học được truy cập công khai. Người dùng không cần đăng nhập để xem.

### 4.4. Xác thực tài khoản

Phạm vi xác thực gồm:

- Đăng ký bằng email và mật khẩu.
- Xác minh email.
- Đăng nhập.
- Đăng xuất.
- Quên mật khẩu.
- Đặt lại mật khẩu.
- Đổi mật khẩu trong trang tài khoản.

Không tích hợp đăng nhập Google, Microsoft, Apple hoặc mạng xã hội.

Sau khi người dùng khách đăng nhập, web phải cho phép chuyển lượt đang làm trên trình duyệt vào tài khoản. Hệ thống không được âm thầm ghi đè một lượt đã có trên tài khoản.

### 4.5. Phòng lab của tôi

Mục đích:

- Là điểm bắt đầu chính sau khi đăng nhập.
- Giúp người dùng tiếp tục nhanh.

Nội dung bắt buộc:

- Các lượt đang làm.
- Nút tiếp tục.
- Các lượt hoàn thành gần đây.
- Trạng thái, thí nghiệm, thời gian cập nhật và mức độ hoàn thành.
- Truy cập báo cáo.
- Truy cập so sánh.
- Xóa lượt thử.
- Nút bắt đầu thí nghiệm mới.

Không xây KPI học tập tổng hợp, bảng xếp hạng hoặc phân tích lớp học.

### 4.6. Không gian mô phỏng

Đây là màn hình trung tâm của sản phẩm.

Các nhóm thông tin bắt buộc:

1. Mục tiêu và phiên bản kịch bản.
2. Tiến trình và lịch sử thao tác.
3. Trạng thái hiện tại của thí nghiệm.
4. Hiện tượng dự kiến có thể quan sát.
5. Các chỉ số khoa học quan trọng.
6. Thao tác tiếp theo và tham số.
7. Dự kiến hoặc cảnh báo trước khi xác nhận khi phù hợp.
8. Phản hồi sau thao tác.
9. Công thức và dữ liệu trung gian.
10. Nguồn và giới hạn mô hình.
11. Trạng thái tự động lưu.
12. Hoàn tác, đặt lại, tạo nhánh hoặc kết thúc khi thao tác đó được kịch bản hỗ trợ.

#### Bố cục trên máy tính

Màn hình sử dụng ba khu vực chính:

```text
Tiến trình
| Trạng thái + hiện tượng + kết quả
| Thao tác tiếp theo
```

Thông tin chuyên môn sâu được mở theo tab, không hiển thị tất cả cùng lúc.

#### Bố cục trên điện thoại

Nội dung xếp dọc:

```text
Trạng thái hiện tại
→ Tiến trình đã thực hiện
→ Thao tác tiếp theo
→ Công thức và dữ liệu trung gian
→ Nguồn và giới hạn
```

Thao tác xác nhận chính phải dễ tiếp cận bằng cảm ứng. Không loại bỏ chức năng cốt lõi trên điện thoại.

### 4.7. Báo cáo lượt thử

Báo cáo là trang tổng kết của một lượt, không phải tài liệu pháp lý hoặc báo cáo nghiên cứu.

Nội dung bắt buộc:

- Tên thí nghiệm và phiên bản kịch bản.
- Điều kiện ban đầu.
- Timeline thao tác.
- Hóa chất, vật liệu, tham số và đơn vị.
- Kết quả trung gian quan trọng.
- Kết quả cuối.
- Mục tiêu đạt hoặc chưa đạt.
- Mức độ hoàn thành và điểm thành phần.
- Biểu đồ có liên quan.
- Giải thích khoa học.
- Nguồn và giới hạn.
- Thời điểm bắt đầu và hoàn thành.

Người dùng có thể in hoặc lưu PDF bằng khả năng của trình duyệt. Không xây dịch vụ tạo PDF phía máy chủ.

### 4.8. So sánh phương án

Người dùng chọn hai lượt thuộc:

- Thuộc tài khoản đang đăng nhập.
- Đã hoàn thành.
- Cùng một thí nghiệm và cùng exact `scenario_release_id`.

So sánh gồm:

- Điều kiện ban đầu.
- Chuỗi thao tác.
- Vật chất và liều lượng.
- Kết quả cuối.
- Hiệu suất, độ tinh khiết hoặc tỷ lệ thu hồi tùy bài.
- Điểm thành phần.
- Số bước.
- Cảnh báo và sai sót.

Web phải giải thích khi hai lượt không thể so sánh trực tiếp.

### 4.9. Tài khoản và dữ liệu

Phạm vi gồm:

- Xem email.
- Thay đổi tên hiển thị.
- Đổi mật khẩu.
- Đăng xuất.
- Xem danh sách lượt thử.
- Xóa một lượt thử của chính mình.

Không xây hồ sơ xã hội, ảnh đại diện tải lên, theo dõi người khác hoặc chia sẻ công khai.

---


## 5. Các luồng sử dụng chính

### 5.1. Khách thực hiện thí nghiệm

```text
Trang chủ
→ Chọn thí nghiệm
→ Xem chi tiết
→ Bắt đầu không đăng nhập
→ Thực hiện thao tác
→ Lưu trên trình duyệt
→ Hoàn thành
→ Xem báo cáo
```

### 5.2. Khách chuyển dữ liệu vào tài khoản

```text
Lượt khách đang làm
→ Đăng ký hoặc đăng nhập
→ Xác nhận chuyển lượt
→ Tạo bản ghi thuộc tài khoản
→ Tiếp tục với đồng bộ đám mây
```

Nếu tài khoản đã có lượt tương tự, hệ thống phải tạo một lượt riêng hoặc yêu cầu người dùng chọn; không ghi đè âm thầm.

### 5.3. Người học tiếp tục trên thiết bị khác

```text
Đăng nhập
→ Phòng lab của tôi
→ Chọn lượt đang làm
→ Tải trạng thái mới nhất
→ Tiếp tục thao tác
→ Tự động lưu
```

### 5.4. Hoàn thành và xem báo cáo

```text
Đủ bước bắt buộc
→ Yêu cầu kết thúc
→ Kiểm tra điều kiện
→ Chốt kết quả
→ Lưu trạng thái hoàn thành
→ Mở báo cáo
→ In hoặc lưu PDF khi cần
```

### 5.5. So sánh hai phương án

```text
Phòng lab của tôi
→ Chọn thí nghiệm
→ Chọn hai lượt đã hoàn thành cùng release
→ Xem so sánh
→ Mở lại từng báo cáo nếu cần
```

---


## 6. Lưu dữ liệu và đồng bộ

### 6.1. Nguyên tắc lưu

- Một thao tác chỉ được lưu vào lịch sử sau khi đầu vào hợp lệ và mô hình trả kết quả thành công.
- Sau mỗi thao tác thành công, hệ thống lưu trạng thái mới.
- Database là nguồn dữ liệu chính cho tài khoản người học.
- Bộ nhớ trình duyệt là nguồn dữ liệu chính cho chế độ khách.
- PDF chỉ là bản xuất; không phải nơi lưu quy trình.
- Khi khách complete, web tạo và lưu `final_report_snapshot` trong IndexedDB; cùng report UI/print CSS dùng cho guest và cloud.

### 6.2. Dữ liệu của một lượt thử

Mỗi lượt phải lưu được:

- Mã người dùng cloud hoặc local attempt ID ở chế độ khách.
- Mã thí nghiệm.
- Phiên bản kịch bản.
- Trạng thái: đang làm, hoàn thành hoặc bị dừng.
- Trạng thái ban đầu.
- Trạng thái hiện tại.
- Danh sách thao tác theo thứ tự.
- Tham số và đơn vị của từng thao tác.
- Kết quả và dữ liệu trung gian cần thiết.
- Cảnh báo và phản hồi.
- Điểm thành phần và kết quả cuối khi hoàn thành.
- Thời gian tạo, cập nhật và hoàn thành.

### 6.3. Đơn vị dữ liệu logic

Phạm vi dữ liệu cần hỗ trợ tối thiểu:

| Đơn vị | Vai trò |
| --- | --- |
| Tài khoản người học | Chủ sở hữu dữ liệu |
| Phiên bản kịch bản | Xác định nội dung, mô hình và nguồn được dùng |
| Lượt thử | Một lần thực hiện thí nghiệm |
| Sự kiện thao tác | Hành động, tham số, kết quả và thời điểm |
| Trạng thái hiện tại | Dữ liệu cần để tiếp tục nhanh |
| Kết quả cuối | Dữ liệu cho báo cáo và so sánh |

Đây là mô hình logic cho scope; chưa quyết định cấu trúc bảng hoặc công nghệ database.

### 6.4. Trạng thái đồng bộ

Giao diện phải phân biệt:

- Đang lưu.
- Đã lưu.
- Chưa đồng bộ.
- Lưu thất bại.
- Có phiên bản mới hơn trên thiết bị khác.

Không được hiển thị “đã lưu” trước khi máy chủ xác nhận.

### 6.5. Xung đột giữa thiết bị

Không xây cơ chế trộn hai chuỗi thao tác.

Khi một thiết bị gửi thay đổi dựa trên trạng thái cũ:

- Máy chủ từ chối thay đổi lỗi thời.
- Web thông báo dữ liệu đã được cập nhật ở nơi khác.
- Người dùng tải trạng thái mới nhất trước khi tiếp tục.
- Thao tác chưa gửi phải được giữ tạm đủ để người dùng không mất nội dung vừa nhập khi có thể.

---


## 7. Hành vi của mô phỏng trên web

### 7.1. Xác nhận thao tác

Trình tự bắt buộc:

```text
Chọn thao tác
→ Nhập tham số
→ Kiểm tra đơn vị và phạm vi
→ Kiểm tra điều kiện trạng thái
→ Chạy mô hình
→ Cập nhật trạng thái
→ Hiển thị kết quả và giải thích
→ Lưu thao tác
```

### 7.2. Thông tin luôn hiển thị

- Thí nghiệm và mục tiêu.
- Trạng thái hoặc bước hiện tại.
- Các chỉ số quan trọng nhất.
- Thao tác có thể thực hiện.
- Trạng thái lưu dữ liệu.

### 7.3. Thông tin hiển thị theo yêu cầu

- Công thức chi tiết.
- Dữ liệu trung gian đầy đủ.
- Nguồn khoa học.
- Giả định và giới hạn.
- Lịch sử dài.

Cách phân lớp này giúp sinh viên mới không bị quá tải nhưng vẫn đủ thông tin cho người có chuyên môn.

### 7.4. Hoàn tác, đặt lại và tạo nhánh

- MVP chỉ hoàn tác thao tác hiệu lực cuối cùng khi mô hình đánh dấu thao tác đó reversible và chưa qua filter/complete.
- Đặt lại kết thúc lượt hiện tại ở trạng thái bị dừng và tạo một lượt mới từ trạng thái ban đầu; không ghi đè lịch sử đã lưu. Người dùng có thể xóa lượt cũ bằng hành động riêng.
- Tạo nhánh chỉ dùng cùng exact scenario release và phải lưu origin snapshot/timeline để không phụ thuộc lượt cha còn tồn tại.
- Mọi thao tác thay đổi lịch sử phải có xác nhận khi có nguy cơ mất dữ liệu.

---


## 8. Báo cáo, in PDF và so sánh

### 8.1. Nguồn của báo cáo

Báo cáo được tạo từ final snapshot đã lưu của lượt thử. Guest đọc snapshot từ IndexedDB; cloud đọc snapshot từ database. Người dùng không phải nhập lại nội dung báo cáo.

### 8.2. In và lưu PDF

- Trang báo cáo có bố cục in rõ ràng.
- Ẩn điều hướng và nút không cần thiết khi in.
- Giữ biểu đồ, đơn vị, nguồn và cảnh báo quan trọng.
- Sử dụng chức năng in/lưu PDF của trình duyệt.
- Không lưu file PDF vào database theo mặc định.

### 8.3. Giới hạn của báo cáo

Báo cáo không phải:

- Chứng chỉ hoàn thành được công nhận.
- Báo cáo phòng thí nghiệm thực.
- Chứng nhận an toàn hoặc tuân thủ.
- Tài liệu thiết kế kỹ thuật.

---


## 9. Ngôn ngữ và nội dung

- Giao diện sử dụng tiếng Việt.
- Nội dung hướng dẫn và phản hồi sử dụng tiếng Việt.
- Tên bài báo, tên tổ chức và tiêu đề nguồn có thể giữ nguyên bản.
- Ký hiệu hóa học, phương trình và đơn vị theo chuẩn của nội dung chuyên môn.
- Không có bộ chuyển ngôn ngữ trong phiên bản này.
- Cấu trúc nội dung có thể tách khỏi giao diện để không cản trở việc bổ sung ngôn ngữ sau này, nhưng việc dịch không nằm trong scope.

---


## 10. Thiết bị và responsive

### 10.1. Phạm vi thiết bị

Web phải sử dụng đầy đủ trên:

- Laptop và máy tính để bàn.
- Tablet.
- Điện thoại thông minh.

Laptop là trải nghiệm được ưu tiên, nhưng điện thoại không được mất chức năng cốt lõi.

### 10.2. Yêu cầu trên màn hình nhỏ

- Không tràn ngang ở độ rộng mục tiêu từ 320 px trở lên.
- Trường nhập có nhãn và đơn vị rõ.
- Nút thao tác chính đủ lớn để sử dụng bằng cảm ứng.
- Không yêu cầu hover để xem nội dung thiết yếu.
- Biểu đồ và bảng phải co giãn hoặc đổi sang trình bày xếp dọc.
- Thông tin chuyên môn sâu được thu gọn bằng tab hoặc phần mở rộng.
- Trạng thái tự lưu vẫn luôn có thể nhận biết.

### 10.3. Ứng dụng di động

Không xây ứng dụng iOS hoặc Android riêng. Phiên bản mobile là giao diện responsive của cùng ứng dụng web.

---


## 11. Xử lý lỗi và trạng thái bất thường

### 11.1. Đầu vào không hợp lệ

Hệ thống phải chặn và giải thích khi:

- Thiếu giá trị bắt buộc.
- Giá trị âm hoặc không phải số.
- Sai đơn vị.
- Ngoài khoảng được phép.
- Hóa chất hoặc vật liệu không phù hợp.
- Thao tác không thể thực hiện ở trạng thái hiện tại.

### 11.2. Mô hình không thể tính

- Không tạo trạng thái mới.
- Không lưu một thao tác thất bại như thao tác thành công.
- Hiển thị thông báo rõ nguyên nhân.
- Không hiển thị số liệu giả hoặc giữ số liệu cũ mà không cảnh báo.

### 11.3. Mất kết nối

- Giữ trạng thái đang thấy trên giao diện.
- Đánh dấu thao tác chưa đồng bộ.
- Cho phép thử lưu lại.
- Không tuyên bố đã lưu khi chưa có xác nhận.
- Không xây khả năng thực hiện trọn vẹn nhiều bước offline rồi tự động hòa trộn sau.

### 11.4. Phiên đăng nhập hết hạn

- Không xóa dữ liệu đang hiển thị.
- Yêu cầu đăng nhập lại.
- Tiếp tục lưu sau khi xác thực lại nếu exact release/revision còn hợp lệ.

### 11.5. Phiên bản kịch bản thay đổi

- Lượt cũ tiếp tục tham chiếu exact scenario release đã dùng.
- Không sửa ngược kết quả lịch sử.
- Nếu phiên bản cũ không còn chạy được, báo cáo vẫn phải đọc được.
- MVP không resume/migrate/compare qua release; hiển thị giải thích khi release khác nhau.

---


## 12. Bảo mật và quyền riêng tư ở mức scope

- Mật khẩu không được lưu dưới dạng văn bản thuần trong database ứng dụng.
- Mọi truy cập dữ liệu lượt thử phải kiểm tra chủ sở hữu ở phía máy chủ.
- Không tin mã người dùng được gửi từ trình duyệt nếu chưa xác thực.
- Dữ liệu khách không tự động chuyển vào tài khoản nếu người dùng chưa đồng ý.
- Hành động xóa lượt phải yêu cầu xác nhận.
- Không thu thập thông tin cá nhân ngoài dữ liệu tối thiểu cần cho tài khoản.
- Không công khai báo cáo bằng đường dẫn mở nếu chưa có một tính năng chia sẻ được duyệt; tính năng đó hiện ngoài phạm vi.

---


## 13. Cấu trúc khái niệm của web

Tài liệu này chưa khóa framework hoặc nhà cung cấp hạ tầng. Về chức năng, web cần các khối sau:

```text
Giao diện web
  |-- Khu vực công khai
  |-- Xác thực
  |-- Phòng lab của tôi
  |-- Không gian mô phỏng
  |-- Báo cáo và so sánh
  `-- Tài khoản
          |
          v
Điều phối phiên và đồng bộ
  |-- Dữ liệu khách trên trình duyệt
  |-- API tài khoản và lượt thử
  |-- Kiểm soát phiên bản
  `-- Kiểm tra quyền sở hữu
          |
          v
Simulation & Evaluation Core
  |-- Process Core
  |-- Ba mô-đun chuyên môn
  |-- Giải thích và cảnh báo
  `-- Chấm điểm
          |
          v
Database + Nội dung kịch bản + Hồ sơ nguồn
```

Simulation Core phải độc lập với giao diện để cùng một thao tác cho cùng kết quả trên desktop, mobile và khi mở lại từ database.

---


## 14. Tiêu chí hoàn thành phạm vi web

Web scope được xem là đạt khi:

1. Có đủ chín khu vực chức năng đã chốt.
2. Người dùng khách làm hoàn chỉnh cả ba thí nghiệm.
3. Dữ liệu khách được lưu trên trình duyệt hiện tại.
4. Đăng ký, xác minh email, đăng nhập, đăng xuất và khôi phục mật khẩu hoạt động.
5. Lượt khách có thể chuyển vào tài khoản sau xác nhận.
6. Tài khoản tự động lưu sau mỗi thao tác thành công.
7. Có thể tiếp tục lượt đang làm trên thiết bị khác.
8. Người dùng chỉ truy cập được dữ liệu của mình.
9. Phòng lab của tôi hiển thị lượt đang làm và lượt đã hoàn thành.
10. Có thể xóa lượt thử của chính mình.
11. Không gian mô phỏng hiển thị tiến trình, trạng thái, thao tác, phản hồi, công thức và nguồn.
12. Cả ba thí nghiệm dùng chung cấu trúc trải nghiệm.
13. Báo cáo được tạo từ dữ liệu đã lưu.
14. Báo cáo có bố cục in/lưu PDF.
15. Có thể so sánh hai lượt cloud đã hoàn thành cùng exact scenario release.
16. Web hoạt động đầy đủ trên laptop, tablet và điện thoại.
17. Không tràn ngang ở độ rộng từ 320 px trong các luồng cốt lõi.
18. Các lỗi đầu vào, mô hình, lưu dữ liệu và phiên đăng nhập có trạng thái rõ.
19. Nguồn và giới hạn luôn truy cập được từ trang chi tiết, workspace hoặc báo cáo.
20. Giao diện và nội dung chính sử dụng tiếng Việt.

---


## 15. Ngoài phạm vi web

Không thực hiện trong phiên bản này:

- Tài khoản giảng viên.
- Quản lý lớp học.
- LMS.
- Bảng xếp hạng.
- Dashboard quản trị.
- CMS để người dùng tạo hoặc sửa thí nghiệm.
- Đăng nhập Google, Microsoft, Apple hoặc mạng xã hội.
- Giao diện song ngữ.
- Ứng dụng mobile riêng.
- Chế độ offline hoàn chỉnh.
- Chatbot hoặc AI.
- Tạo PDF phía máy chủ.
- Xuất CSV.
- Chia sẻ báo cáo công khai.
- Mạng xã hội hoặc theo dõi người dùng.
- Cộng tác nhiều người trong cùng một lượt thử.
- Gửi email báo cáo hoặc thông báo tự động ngoài email xác thực và khôi phục tài khoản.
- Phân tích hành vi học tập nâng cao.
- Nội dung marketing, blog hoặc hệ thống tin tức.

---


## 16. Mockup tham chiếu đã duyệt

Các file mockup dùng để định hình bố cục, không phải mã nguồn production:

- [Trang mở nhanh hai phiên bản](mockups/index.html)
- [Không gian mô phỏng trên máy tính](mockups/simulation-workbench-desktop.html)
- [Không gian mô phỏng trên điện thoại](mockups/simulation-workbench-mobile.html)

Quyết định giao diện chính:

- Giữ bố cục “bàn thí nghiệm cân bằng”.
- Trên desktop hiển thị đồng thời tiến trình, trạng thái và thao tác.
- Trên mobile xếp nội dung theo thứ tự ưu tiên.
- Hiện tượng và số liệu khoa học cùng xuất hiện.
- Công thức, nguồn và giới hạn dùng progressive disclosure để tránh quá tải.
- Trạng thái tự động lưu phải nhìn thấy được.

---


## 17. Kết luận chốt scope

Phạm vi web phù hợp cho dự án là một ứng dụng học tập responsive gồm chín khu vực chức năng, hỗ trợ đầy đủ chế độ khách và một vai trò tài khoản người học.

Giá trị trung tâm của web là không gian mô phỏng có chiều sâu, dữ liệu được lưu theo từng thao tác, khả năng tiếp tục trên thiết bị khác, báo cáo có thể truy xuất và so sánh phương án. Nguồn khoa học và giới hạn mô hình là một phần của trải nghiệm, không phải phụ lục tách rời.

Scope này tạo ra một sản phẩm hoàn chỉnh để học, trình diễn và đánh giá trong thời gian một học kỳ ngắn, đồng thời loại bỏ các hệ thống quản trị, lớp học, AI và tích hợp bên ngoài không cần thiết cho giá trị cốt lõi.
