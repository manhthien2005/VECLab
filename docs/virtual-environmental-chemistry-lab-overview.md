# Virtual Environmental Chemistry Lab — Tài liệu tổng quan lưu trữ

**Trạng thái:** Tài liệu lịch sử, không còn là nguồn quyết định<br>
**Cập nhật trạng thái:** 28/08/2026

> File này từng là bản tổng quan đầu tiên của dự án. Nội dung hiện hành đã được tách thành các scope, đặc tả thí nghiệm, kiến trúc và tiêu chí nghiệm thu chuyên biệt.

## Tổng quan nhanh

| | Nội dung |
| --- | --- |
| 🎯 **Mục đích** | Giữ bối cảnh hình thành VECLab và dẫn người đọc sang tài liệu hiện hành. |
| 👥 **Dành cho** | Người muốn hiểu lịch sử đề tài hoặc lý do các quyết định ban đầu được thay đổi. |
| ✅ **Sau khi đọc** | Biết phần nào còn giá trị tham khảo và file nào phải dùng để triển khai. |
| ⚠️ **Lưu ý** | Không dùng file này để quyết định scope, công thức, kiến trúc, timeline hoặc phân công. |

## Đọc tài liệu này khi nào?

- Khi cần hiểu dự án bắt đầu từ nhu cầu giáo dục nào.
- Khi gặp một quyết định cũ trong Git history và cần tìm tài liệu thay thế.
- Không cần đọc file này trước khi triển khai sản phẩm.

## Các quyết định chính

- VECLab là công cụ học tập dựa trên quy trình có thật, không thay thực hành thật.
- Giá trị trung tâm là thử nhiều lựa chọn và nhận giải thích khoa học.
- Phạm vi hiện hành là ba thí nghiệm có bằng chứng, không phải chemistry sandbox tổng quát.
- Mọi yêu cầu triển khai phải lấy từ bộ tài liệu hiện hành bên dưới.

## Mục lục

<!-- TOC:START -->
- [1. Vì sao tài liệu này tồn tại](#1-vì-sao-tài-liệu-này-tồn-tại)
- [2. Định vị hiện hành của VECLab](#2-định-vị-hiện-hành-của-veclab)
- [3. Những ý tưởng lịch sử vẫn còn đúng](#3-những-ý-tưởng-lịch-sử-vẫn-còn-đúng)
- [4. Nội dung đã được thay thế](#4-nội-dung-đã-được-thay-thế)
- [5. Bộ tài liệu hiện hành](#5-bộ-tài-liệu-hiện-hành)
- [6. Disclaimer](#6-disclaimer)
<!-- TOC:END -->

---


## 1. Vì sao tài liệu này tồn tại

Bản tổng quan ban đầu được viết để thống nhất ý tưởng về một phòng thí nghiệm hóa học môi trường trên web. Nó mô tả lợi ích giáo dục, các nhóm chức năng có thể có và một phạm vi MVP sơ bộ.

Sau khi nghiên cứu sâu hơn, dự án cần tách riêng:

- Phạm vi sản phẩm.
- Phạm vi web.
- Công thức và state machine của từng thí nghiệm.
- Bằng chứng khoa học.
- Kiến trúc và dữ liệu.
- Kiểm chứng và nghiệm thu.

Vì vậy, bản tổng quan dài trước đây đã được rút gọn để tránh tạo hai nguồn quyết định song song.


## 2. Định vị hiện hành của VECLab

VECLab là ứng dụng web mô phỏng quá trình ra quyết định trong ba bài:

1. Trung hòa dung dịch HCl tổng hợp.
2. Kết tủa Cu trong dung dịch CuSO₄ tổng hợp.
3. Phân loại PP, HDPE, PS và PET bằng phương pháp nổi–chìm.

Người dùng chọn thao tác và tham số trong miền đã được kiểm chứng bằng tài liệu, xem trạng thái thay đổi, nhận kết quả định lượng, giải thích, warning và báo cáo.

Sản phẩm ưu tiên sinh viên nhưng vẫn công khai dữ liệu trung gian, công thức, nguồn và giới hạn cho người có chuyên môn.


## 3. Những ý tưởng lịch sử vẫn còn đúng

- Kết quả phải xác định và có thể tái lập.
- Người học được làm lại và so sánh phương án.
- Giải thích quan trọng hơn một điểm tổng duy nhất.
- Nguồn, giả định và giới hạn phải hiện trong sản phẩm.
- Không dùng AI để tự quyết định kết quả khoa học.
- Không mô phỏng 3D hoặc mọi phản ứng hóa học trong MVP.
- Web phải sử dụng được trên laptop và điện thoại.


## 4. Nội dung đã được thay thế

Các phần sau của bản tổng quan cũ không còn hiệu lực:

- Mốc thời gian chi tiết.
- Phân công theo thành viên.
- Danh sách công nghệ mang tính đề xuất ban đầu.
- Mô hình hóa học đơn giản trước khi khóa constant bundle.
- Dashboard giảng viên và quản lý lớp học.
- Các ngưỡng pháp lý hoặc mục tiêu kịch bản chưa có version.

Git history vẫn giữ bản cũ nếu cần đối chiếu quá trình hình thành.


## 5. Bộ tài liệu hiện hành

| Cần tìm | Tài liệu |
| --- | --- |
| Làm sản phẩm gì | [Core Project Scope](core-project-scope.md) |
| Web xây những gì | [Web Application Scope](web-application-scope.md) |
| Công thức ba bài | [Thư mục experiment specs](experiments/) |
| Claim dựa vào nguồn nào | [Scientific Evidence Register](scientific-evidence-register.md) |
| Các module kết nối ra sao | [System Architecture](system-architecture.md) |
| Attempt/event/report lưu thế nào | [Data and State Model](data-and-state-model.md) |
| Khi nào được gọi là hoàn thành | [Verification and Acceptance](verification-and-acceptance.md) |
| Bắt đầu đọc từ đâu | [Documentation Index](README.md) |


## 6. Disclaimer

> Mô hình dựa trên tài liệu; chưa được nhóm phát triển kiểm chứng bằng thí nghiệm độc lập.

VECLab là công cụ giáo dục. Sản phẩm không thay thế phép đo, jar test, đánh giá an toàn, thiết kế kỹ thuật, quản lý chất thải hoặc kết luận tuân thủ pháp luật.
