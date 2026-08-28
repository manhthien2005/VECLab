# Nền tảng thiết kế mô phỏng quy trình Hóa học – CNTT — Lưu trữ

**Trạng thái:** Tài liệu nền tảng lịch sử; không còn là nguồn quyết định<br>
**Ngày ban đầu:** 10/08/2026<br>
**Ngày rút gọn:** 28/08/2026

> Tài liệu này ghi lại hướng thiết kế trước khi Core Scope, Web Scope và ba experiment spec được chốt. Khi có khác biệt, luôn ưu tiên [Documentation Index](../../README.md) và các tài liệu hiện hành được liệt kê tại đó.

## Tổng quan nhanh

| | Nội dung |
| --- | --- |
| 🎯 **Mục đích** | Ghi lại nền tảng tư duy dẫn đến Process Core và mô hình theo kịch bản. |
| 👥 **Dành cho** | Người cần hiểu nguồn gốc kiến trúc hoặc so sánh quyết định cũ với hiện tại. |
| ✅ **Sau khi đọc** | Hiểu các nguyên tắc ban đầu nào vẫn được giữ và phần nào đã được thay thế. |
| ⚠️ **Lưu ý** | Không lấy số liệu, ngưỡng, công thức hoặc workflow từ file này để viết code. |

## Đọc tài liệu này khi nào?

- Khi cần bối cảnh vì sao dự án chọn Process Core thay vì chemistry sandbox.
- Khi xem Git history hoặc thảo luận kiến trúc ban đầu.
- Không cần đọc để triển khai release hiện tại.

## Các quyết định chính

- Process Core dùng chung cho nhiều domain là ý tưởng nền tảng vẫn được giữ.
- Kịch bản phải giới hạn chất, vật liệu, thao tác và giả định.
- Cùng trạng thái và thao tác phải cho cùng kết quả.
- Kết quả cần giải thích, warning, scoring và timeline.
- Các chi tiết khoa học cũ đã được thay bằng ba experiment spec phiên bản 1.0.0.

## Mục lục

<!-- TOC:START -->
- [1. Vai trò lịch sử](#1-vai-trò-lịch-sử)
- [2. Các nguyên tắc vẫn được giữ](#2-các-nguyên-tắc-vẫn-được-giữ)
- [3. Nội dung đã được thay thế](#3-nội-dung-đã-được-thay-thế)
- [4. Bản đồ tài liệu thay thế](#4-bản-đồ-tài-liệu-thay-thế)
- [5. Quy tắc sử dụng](#5-quy-tắc-sử-dụng)
- [6. Disclaimer](#6-disclaimer)
<!-- TOC:END -->

---


## 1. Vai trò lịch sử

Tài liệu ban đầu xác lập rằng sản phẩm nên mô phỏng **quy trình ra quyết định**, không phải một engine nhận mọi phản ứng hóa học.

Nó cũng đưa ra vòng lặp chung:

```text
Quan sát trạng thái
→ Chọn thao tác
→ Kiểm tra điều kiện
→ Chạy mô hình chuyên môn
→ Cập nhật trạng thái
→ Hiển thị kết quả và giải thích
→ Ghi timeline
```

Vòng lặp này đã được chuẩn hóa trong [System Architecture](../../system-architecture.md) và [Data and State Model](../../data-and-state-model.md).


## 2. Các nguyên tắc vẫn được giữ

- Một Process Core dùng chung cho ba bài.
- Mỗi domain có module tính toán độc lập với giao diện.
- State transition và event history phải tái lập được.
- Không bắt người học đi theo một chuỗi thao tác duy nhất.
- Điều kiện khoa học chính được đánh giá trước resource/safety conventions.
- Nguồn, giả định và limitation là một phần của sản phẩm.
- Phần mềm giáo dục không tự chứng nhận tuân thủ pháp luật.


## 3. Nội dung đã được thay thế

Các nội dung cũ sau không còn được dùng để triển khai:

- Kịch bản nước thải axit chứa Cu được gộp trong một bài duy nhất.
- Giá trị mặc định, mục tiêu pH/Cu và công thức sơ bộ.
- Workflow hoàn tác/tạo nhánh chưa có contract dữ liệu.
- Khung pháp lý gắn với ngày hoặc văn bản cụ thể nhưng chưa version hóa.
- Tiêu chí nghiệm thu trước khi có golden cases và source keys.

Nội dung thay thế nằm trong ba experiment spec và Scientific Evidence Register.


## 4. Bản đồ tài liệu thay thế

| Chủ đề cũ | Nguồn hiện hành |
| --- | --- |
| Process Core và module boundaries | [System Architecture](../../system-architecture.md) |
| Attempt, event, replay và branch | [Data and State Model](../../data-and-state-model.md) |
| Trung hòa axit | [Acid Neutralization Specification](../../experiments/acid-neutralization-spec.md) |
| Kết tủa Cu | [Copper Precipitation Specification](../../experiments/copper-precipitation-spec.md) |
| Phân loại nhựa | [Plastic Density Separation Specification](../../experiments/plastic-density-separation-spec.md) |
| Bằng chứng khoa học | [Scientific Evidence Register](../../scientific-evidence-register.md) |
| Điều kiện nghiệm thu | [Verification and Acceptance](../../verification-and-acceptance.md) |


## 5. Quy tắc sử dụng

- Chỉ dùng file này để hiểu lịch sử quyết định.
- Không thêm yêu cầu mới vào file lưu trữ.
- Mọi thay đổi sản phẩm đi qua Core/Web Scope.
- Mọi thay đổi công thức hoặc hằng số tạo scenario release mới trong experiment spec.


## 6. Disclaimer

> Mô hình dựa trên tài liệu; chưa được nhóm phát triển kiểm chứng bằng thí nghiệm độc lập.
