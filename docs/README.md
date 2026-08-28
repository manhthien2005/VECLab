# MỤC LỤC TÀI LIỆU DỰ ÁN

## Nền tảng mô phỏng quy trình hóa học có căn cứ khoa học

**Cập nhật:** 28/08/2026<br>
**Trạng thái bộ tài liệu:** Đã biên soạn cho phạm vi MVP một học kỳ

## Tổng quan nhanh

| | Nội dung |
| --- | --- |
| 🎯 **Mục đích** | Là bản đồ điều hướng và quy tắc ưu tiên cho toàn bộ tài liệu VECLab. |
| 👥 **Dành cho** | Tất cả thành viên trước khi đọc hoặc chỉnh sửa tài liệu chuyên sâu. |
| ✅ **Sau khi đọc** | Biết nên mở file nào, tài liệu nào là nguồn quyết định và xử lý mâu thuẫn ra sao. |
| ⚠️ **Lưu ý** | Đây là trang điều hướng; công thức và hợp đồng kỹ thuật nằm trong các đặc tả chuyên ngành. |

## Đọc tài liệu này khi nào?

- Khi mới tham gia dự án.
- Khi chưa biết yêu cầu nằm ở Core Scope, Web Scope hay experiment spec.
- Trước khi sửa một quyết định đã được phiên bản hóa.

## Các quyết định chính

- Hai tài liệu scope quyết định sản phẩm; ba experiment spec quyết định mô hình khoa học.
- Scientific Evidence Register quyết định nguồn của claim và hằng số.
- Verification and Acceptance quyết định điều kiện được phép gọi là hoàn thành.
- Hai tài liệu cũ chỉ có giá trị lịch sử, không được dùng thay nguồn hiện hành.

## Mục lục

<!-- TOC:START -->
- [1. Bắt đầu từ đâu](#1-bắt-đầu-từ-đâu)
- [2. Tài liệu nguồn quyết định](#2-tài-liệu-nguồn-quyết-định)
- [3. Mockup giao diện](#3-mockup-giao-diện)
- [4. Tài liệu nền/tham khảo](#4-tài-liệu-nềntham-khảo)
- [5. Thứ tự ưu tiên khi có mâu thuẫn](#5-thứ-tự-ưu-tiên-khi-có-mâu-thuẫn)
- [6. Định nghĩa trạng thái tài liệu](#6-định-nghĩa-trạng-thái-tài-liệu)
- [7. Nomenclature dùng chung](#7-nomenclature-dùng-chung)
- [8. Đường đọc theo nhu cầu](#8-đường-đọc-theo-nhu-cầu)
- [9. Quy tắc thay đổi](#9-quy-tắc-thay-đổi)
- [10. Disclaimer chung](#10-disclaimer-chung)
<!-- TOC:END -->

---


## 1. Bắt đầu từ đâu

Mọi thành viên nên đọc theo thứ tự:

1. [Core Project Scope](core-project-scope.md) — sản phẩm làm gì và giới hạn khoa học.
2. [Web Application Scope](web-application-scope.md) — web xây những khu vực và hành vi nào.
3. Đặc tả thí nghiệm liên quan đến phần đang làm.
4. [System Architecture](system-architecture.md) và [Data and State Model](data-and-state-model.md).
5. [Verification and Acceptance](verification-and-acceptance.md).

Không dùng tài liệu tổng quan cũ để thay quyết định trong các file trên.

---


## 2. Tài liệu nguồn quyết định

| Tài liệu | Trả lời câu hỏi | Trạng thái |
| --- | --- | --- |
| [Core Project Scope](core-project-scope.md) | Làm sản phẩm gì, ba thí nghiệm nào, đến đâu? | Đã chốt |
| [Web Application Scope](web-application-scope.md) | Web có trang, tài khoản, dữ liệu và responsive như thế nào? | Đã chốt |
| [Acid Neutralization Specification](experiments/acid-neutralization-spec.md) | Bài trung hòa tính và chuyển state như thế nào? | Model spec 1.0.0 |
| [Copper Precipitation Specification](experiments/copper-precipitation-spec.md) | Bài Cu tính speciation/solid/workflow như thế nào? | Model spec 1.0.0 |
| [Plastic Density Separation Specification](experiments/plastic-density-separation-spec.md) | Bài nhựa partition stream/purity/recovery như thế nào? | Model spec 1.0.0 |
| [Scientific Evidence Register](scientific-evidence-register.md) | Mỗi claim/constant/process dựa vào nguồn nào? | Source register hiện hành |
| [System Architecture](system-architecture.md) | Các mô-đun, ranh giới và stack mục tiêu là gì? | Kiến trúc mục tiêu |
| [Data and State Model](data-and-state-model.md) | Attempt/event/snapshot/auth/sync được lưu ra sao? | Data contract MVP |
| [Verification and Acceptance](verification-and-acceptance.md) | Điều gì phải pass trước khi gọi là hoàn thành? | Acceptance source |

---


## 3. Mockup giao diện

- [Trang mở nhanh](mockups/index.html)
- [Simulation Workbench — desktop](mockups/simulation-workbench-desktop.html)
- [Simulation Workbench — mobile](mockups/simulation-workbench-mobile.html)

Mockup là tài liệu bố cục, không phải source code production và số liệu trong mockup không phải golden chemistry data.

---


## 4. Tài liệu nền/tham khảo

| Tài liệu | Vai trò |
| --- | --- |
| [Virtual Environmental Chemistry Lab Overview](virtual-environmental-chemistry-lab-overview.md) | Tổng quan ban đầu; không phải scope source hiện hành |
| [Process Simulation Foundation Design 2026-08-10](superpowers/specs/2026-08-10-process-simulation-foundation-design.md) | Nền tảng định hướng trước khi scope cuối được chốt |

Khi có khác biệt, ưu tiên tài liệu ở mục 2.

---


## 5. Thứ tự ưu tiên khi có mâu thuẫn

### 5.1. Phạm vi và sản phẩm

```text
Core Project Scope
→ Web Application Scope
→ System Architecture
→ Data and State Model
```

### 5.2. Khoa học và tính toán

```text
Experiment Specification
→ Scientific Evidence Register
→ System Architecture generic contract
```

Experiment spec quyết định state, action, equation, constant bundle, score và golden case của bài đó.

### 5.3. Kiểm thử

```text
Experiment golden/tolerance
→ Verification and Acceptance
→ implementation test fixtures
```

Nếu implementation fixture khác spec, sửa fixture/code hoặc cập nhật spec có version; không âm thầm sửa expected value.

---


## 6. Định nghĩa trạng thái tài liệu

| Nhãn | Ý nghĩa |
| --- | --- |
| Đã chốt | Quyết định phạm vi đã được người phụ trách duyệt |
| Model spec 1.0.0 | Hằng số, formula, state và golden bundle của release đầu |
| Source register hiện hành | Mapping claim/source đã được đọc và tổng hợp |
| Kiến trúc mục tiêu | Ranh giới kỹ thuật phải giữ; chi tiết code có thể theo convention |
| Data contract MVP | Bất biến dữ liệu và ownership phải giữ |
| Acceptance source | Test/gate phải có bằng chứng thực thi trước release |

Không có nhãn nào nghĩa là bench validation bởi đội.

---


## 7. Nomenclature dùng chung

| Thuật ngữ | Nghĩa |
| --- | --- |
| Scenario key | Tên ổn định của một thí nghiệm |
| Scenario release ID | Bundle bất biến engine/scoring/state/content/evidence |
| Attempt | Một lượt thực hiện |
| Event | Một domain/lifecycle transition đã được chấp nhận |
| Current state | Snapshot sau event cuối |
| Final report snapshot | Dữ liệu báo cáo bất biến sau complete |
| Golden case | Regression target của model đã khóa |
| Achievement percent | Mức đạt mục tiêu bài học, không phải probability |
| Evidence card | Dữ liệu nghiên cứu hiển thị với exact condition, không tự động là model coefficient |
| Ideal filter/separator | Quy tắc định nghĩa của simulator, không phải hiệu suất thiết bị thật |

---


## 8. Đường đọc theo nhu cầu

### Hiểu sản phẩm

- Core Scope.
- Web Scope.
- Mockup desktop/mobile.

### Làm simulation engine

- Experiment spec tương ứng.
- Scientific Evidence Register.
- System Architecture § Process/Domain.
- Verification § experiment tương ứng.

### Làm frontend

- Web Scope.
- Mockups.
- System Architecture § route/feature/contract.
- Experiment action/output contract.
- Verification § responsive/accessibility/E2E.

### Làm backend và database

- System Architecture.
- Data and State Model.
- Web Scope § auth/sync/report.
- Verification § transaction/idempotency/RLS/import.

### Kiểm tra khoa học và QA

- Experiment specs.
- Evidence Register.
- Verification and Acceptance.

---


## 9. Quy tắc thay đổi

- Thay đổi scope phải cập nhật Core/Web Scope trước.
- Thay công thức, hằng số, source, state schema hoặc scoring làm thay đổi kết quả phải tạo scenario release mới.
- Completed report không được sửa ngược theo engine mới.
- Source metadata trong completed report là resolved snapshot.
- Mọi claim mới cần claim ID và source mapping.
- Không thêm experiment thứ tư trước khi ba bài đạt acceptance gates.

---


## 10. Disclaimer chung

> Mô hình dựa trên tài liệu; chưa được nhóm phát triển kiểm chứng bằng thí nghiệm độc lập.

Sản phẩm là công cụ giáo dục. Nó không thay thế phép đo, jar test, thiết kế kỹ thuật, đánh giá an toàn, quản lý chất thải hoặc kết luận tuân thủ pháp luật.
