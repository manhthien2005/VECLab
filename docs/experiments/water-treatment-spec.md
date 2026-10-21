# ĐẶC TẢ Ý TƯỞNG THÍ NGHIỆM 4 — XỬ LÝ NƯỚC CHỨA Fe, Zn VÀ Pb

**Scenario key:** `water-treatment`  
**Scenario version:** `0.3.0-draft` (P0-A closed 2026-10-16)  
**State schema version:** `1-draft`  
**Trạng thái nội dung:** Ý tưởng cần bổ sung nguồn, quy chuẩn và kiểm chứng trước khi triển khai  
**Nhiệt độ mô hình:** 25,0 °C (tạm thời; cần khóa cùng bộ hằng số)  
**Ngôn ngữ:** Tiếng Việt

> Đây là mô phỏng giáo dục với mẫu nước tổng hợp ảo. Không dùng mô phỏng này để pha, xử lý,
> xả hoặc uống nước thật; đặc biệt không cho sinh viên thao tác với Pb thật.

> **Nhãn bắt buộc:** Mô hình dựa trên tài liệu cần được bổ sung; chưa được nhóm phát triển
> kiểm chứng bằng thí nghiệm độc lập; trạng thái “đạt” chỉ có nghĩa là đạt ngưỡng mô phỏng
> của mục tiêu MVP đã chốt (Cột A theo Thông tư 06/2025/TT-BTNMT — **đã xác minh pháp lý**
> ngày 16/10/2026, xem §16.1 P0-A và evidence register), không phải chứng nhận
> nước an toàn ngoài thực tế.

## Tổng quan nhanh

| | Nội dung |
| --- | --- |
| 🎯 **Mục đích** | Cho người học tự tạo mẫu nước có Fe, Zn, Pb và pH bất thường, sau đó thiết kế quy trình xử lý và kiểm tra lại. |
| 👥 **Dành cho** | Chemistry engine, frontend workbench, content, QA khoa học và nhóm xây dựng quy chuẩn mô phỏng. |
| ✅ **Sau khi đọc** | Biết input, state, thao tác, phép đo, điều kiện hoàn thành và các dữ liệu còn thiếu trước khi code. |
| ⚠️ **Phạm vi** | Mô phỏng cân bằng và quy trình giáo dục; không phải mô hình nhà máy, nước thải thật hoặc hướng dẫn thao tác với kim loại độc. |

## Đọc tài liệu này khi nào?

- Khi xây dựng scenario xử lý nước nhiều chất ô nhiễm.
- Khi thêm kim loại, thuốc thử, phương pháp tách hoặc bộ giới hạn mới.
- Khi viết solver, calculation trace, report, scoring hoặc test golden case.
- Khi cần kiểm tra rằng pH, kết tủa và bước lọc không bị nhầm là cùng một kết quả.

## Các quyết định chính của bản nháp

1. Sinh viên được tạo **mẫu ảo**, không nhập mẫu nước thật và không thao tác với Pb thật.
2. Mẫu có tối thiểu Fe, Zn, Pb; pH ban đầu là kết quả tính từ composition (không phải user input — xem mục 6.1.2). Nồng độ có thể nằm dưới hoặc trên giới hạn mục tiêu.
3. pH chỉ là một biến điều kiện. Điều chỉnh pH không tự động được tính là đã loại bỏ kim loại.
4. Kim loại chuyển sang pha rắn chỉ được tính là đã loại bỏ sau khi có bước tách bùn hoặc lọc.
5. Mỗi lần đo là một snapshot của state hiện tại; thêm hóa chất hoặc thay đổi quy trình làm mất hiệu lực phép đo cũ.
6. Chuẩn tham chiếu là `QCVN 40:2025/BTNMT`; bản mô phỏng phải khóa cột mục tiêu và điều kiện áp dụng trước khi phát hành.
7. Thể tích mẫu benchmark là `1.000 mL`; miền khám phá tạm thời là `500–2.000 mL`.
8. MVP chỉ cho phép Fe, Zn và Pb trong mẫu ảo; không cho nhập kim loại tùy ý.
9. MVP chỉ mô phỏng hydroxide route với acid/base ảo, trộn, lắng và lọc; route khác để phase sau.
10. Mọi thao tác, phép đo, trạng thái trước/sau và phiên bản engine phải được ghi log bất biến.

## Mục lục

- [1. Mục tiêu giáo dục](#1-mục-tiêu-giáo-dục)
- [2. Kịch bản chuẩn](#2-kịch-bản-chuẩn)
- [3. Miền đầu vào](#3-miền-đầu-vào)
- [4. Luồng trạng thái](#4-luồng-trạng-thái)
  - [4.2. Type definitions cho các trường tham chiếu trong state](#42-type-definitions-cho-các-trường-tham-chiếu-trong-state)
- [5. Hành động và điều kiện trước](#5-hành-động-và-điều-kiện-trước)
- [6. Mô hình hóa học](#6-mô-hình-hóa-học)
- [7. Các họ quy trình xử lý](#7-các-họ-quy-trình-xử-lý)
- [8. Phép đo và kiểm tra](#8-phép-đo-và-kiểm-tra)
- [9. Kết quả đầu ra](#9-kết-quả-đầu-ra)
- [10. Cách chấm điểm](#10-cách-chấm-điểm)
- [11. Nhánh sai và phục hồi](#11-nhánh-sai-và-phục-hồi)
- [12. Điều kiện hoàn thành](#12-điều-kiện-hoàn-thành)
- [13. An toàn và giới hạn](#13-an-toàn-và-giới-hạn)
- [14. Ma trận nguồn cần bổ sung](#14-ma-trận-nguồn-cần-bổ-sung)
- [15. Tiêu chí nghiệm thu](#15-tiêu-chí-nghiệm-thu)
- [16. Dữ liệu còn thiếu trước khi build](#16-dữ-liệu-còn-thiếu-trước-khi-build)
- [17. Phần thực hành đã chốt](#17-phần-thực-hành-đã-chốt)

---

## 1. Mục tiêu giáo dục

Người học phải:

- Phân biệt pH, nồng độ kim loại hòa tan, tổng kim loại và lượng kim loại đã tách.
- Hiểu rằng Fe, Zn và Pb không nhất thiết kết tủa tại cùng một pH.
- Nhận biết điều chỉnh pH chỉ tạo điều kiện cho xử lý, không thay thế lắng và lọc.
- Thiết kế chuỗi xử lý có thể gồm điều chỉnh pH, tạo kết tủa, keo tụ, lắng và lọc.
- Theo dõi cân bằng vật chất của Fe, Zn, Pb giữa nước, bùn và chất thải.
- So sánh hiệu quả xử lý với lượng hóa chất, số công đoạn và lượng bùn tạo ra.
- Hiểu rằng kết quả “đạt ngưỡng mô phỏng” không phải chứng nhận mẫu nước thật đạt chuẩn.

## 2. Kịch bản chuẩn

### 2.1. Mẫu nước đầu vào

Các giá trị dưới đây chỉ là placeholder cho benchmark; chưa được dùng để tuyên bố nước
thật hoặc đại diện cho một nguồn nước cụ thể.

| Đại lượng | Giá trị chuẩn | Trạng thái |
| --- | ---: | --- |
| Thể tích mẫu | 1.000 mL | Benchmark đề xuất; miền 500–2.000 mL |
| Fe tổng ban đầu | 0–100 mg/L | Đã khóa; cap = `single_max` (mục 3.2.1) |
| Zn tổng ban đầu | 0–100 mg/L | Đã khóa; cap = `single_max` (mục 3.2.1) |
| Pb tổng ban đầu | 0–100 mg/L | Đã khóa; cap = `single_max` (mục 3.2.1) |
| **pH ban đầu** | **— (tính từ composition)** | **Không phải user input. Xem mục 6.1.2.** |
| Độ kiềm | TBD | Có thể để phase 2 |
| Độ cứng | TBD | Có thể để phase 2 |
| Nhiệt độ | 25,0 °C | Tạm thời, cần khóa theo bộ hằng số |

> **Lưu ý về cap per metal:** Giá trị 0–100 mg/L ở trên là **cap cho 1 kim loại duy nhất**
> (N = 1). Khi user tick nhiều kim loại, slider max thực tế của mỗi kim loại co lại theo
> công thức `slider_max = 100 / N²` ở mục 3.2.2 (N = 2 → 25 mg/L; N = 3 → ≈ 11,1 mg/L).
> Nếu muốn cap phẳng 0–100 cho mọi N, phải bỏ công thức 1/N² ở mục 3.2.2.

**Lưu ý quan trọng về pH ban đầu:**

- pH ban đầu **không phải** user input. Nó là kết quả tính toán từ composition khi user
  pick slider Fe/Zn/Pb + volume.
- Khi user pick Fe, Zn, Pb (mục 3.2), simulator tính khối lượng muối precursor
  (FeCl₃·6H₂O, ZnSO₄·7H₂O, Pb(NO₃)₂) cần thêm vào V mL nước, rồi chạy mô hình pH
  (mục 6.1.2) để xác định pH sau khi muối tan hết và cân bằng acid-base ổn định.
- pH tính được có thể nằm ngoài miền QCVN 6–9 — đây là kết quả vật lý, không phải
  lỗi. User sẽ thêm HCl/NaOH (mục 5.2) nếu cần điều chỉnh về Cột A.
- Tại sao không cho user pick pH: precursor muối có tính acid/base riêng (FeCl₃ rất
  acid, ZnSO₄ gần trung tính, Pb(NO₃)₂ hơi acid). pH là hệ quả tất yếu của thành phần
  — cho user pick tự do sẽ tạo trạng thái hóa học không nhất quán (vd "Fe = 10 mg/L
  ở pH 7 với FeCl₃" là không khả thi vì FeCl₃ tự nó đẩy pH xuống ~2,5).
- pH chỉ trở thành "input" khi user thêm acid/base qua reagent controller (mục 5.2) — và
  khi đó, mô hình pH (mục 6.1.1) sẽ dự đoán pH mới trước khi commit.


Khối lượng ban đầu được tính theo `m (mg) = C (mg/L) × V (L)`. Với benchmark 1 L,
miền khối lượng tương ứng là Fe `0,5–20 mg`, Zn `0,2–10 mg` và Pb `0,02–1 mg`.
### 2.2. Chuẩn đầu ra tham chiếu

> ✅ **Trạng thái xác minh: P0-A — ĐÃ ĐÓNG** (ngày 16/10/2026).
>
> Bảng dưới và bảng "đường giới hạn pháp lý" ở §3.2.4 đã được đối chiếu với bản
> chính thức **Thông tư 06/2025/TT-BTNMT** ban hành ngày 01/3/2025 (QCVN 40:2025/BTNMT).
> Xem chi tiết trong `docs/experiments/water-treatment-evidence.md` mục "Register — Xử lý nước
> Fe/Zn/Pb" và `docs/experiments/Thong-tu-06-2025-TT-BTNMT.pdf` (SHA-256:
> `1fb859f91af39c31c32936fd8988f69b4d2f25805a9689afff578be4050ac5da`).
>
> **Kết quả đối chiếu Cột A (mục tiêu MVP):** Fe ≤ 2,0; Zn ≤ 1,0; Pb ≤ 0,1 mg/L;
> pH 6–9 — **khớp** với Bảng 2, TT 06/2025/BTNMT (trang 5–6).
>
> **Kết quả đối chiếu Cột B/C:** Fe 10/10, Zn 5/5, Pb 0,5/0,5, pH 6–9 cho cả 3
> cột — **khớp** với Bảng 2 của Thông tư. Bảng §3.2.4 trước đây ghi sai (Fe B=5,0;
> Zn B=3,0; Pb C=1,0; pH B=5,5–9; pH C=5–9) đã được sửa để khớp với cùng một bảng
> số tại §2.2.
>
> **Mâu thuẫn nội bộ §2.2 ↔ §3.2.4** đã được giải quyết. Cả hai bảng giờ tham chiếu
> cùng Bảng 2, TT 06/2025/BTNMT.

Bản này sử dụng `QCVN 40:2025/BTNMT — Quy chuẩn kỹ thuật quốc gia về nước thải công
nghiệp` (ban hành kèm **Thông tư 06/2025/TT-BTNMT** ngày 01/3/2025) làm chuẩn tham
chiếu. Nội dung QCVN được trích từ bản PDF chính thức, bao gồm:

- **Mục 1.3.3.1** (trang 3): định nghĩa Cột A — "Cột A quy định giá trị giới hạn cho
  phép của thông số ô nhiễm trong nước thải khi xả ra nguồn nước tiếp nhận **có chức năng
  cấp nước cho mục đích sinh hoạt** hoặc **có mục đích quản lý, cải thiện chất lượng môi
  trường nước như Mức A Bảng 2, Bảng 3 QCVN 08:2023/BTNMT** — Quy chuẩn kỹ thuật quốc
  gia về chất lượng nước mặt, hoặc theo quy định của UBND cấp tỉnh".
- **Bảng 2** (trang 5–6): giá trị giới hạn cho pH, tổng N, tổng P, Fe, Zn, Pb, các
  kim loại nặng khác, chất hữu cơ, vi sinh.
- **Mục 3.1 + Phụ lục 1**: phương pháp xác định (chỉ dùng để tham chiếu; simulator
  không tự phân tích mẫu).
- **Mục 4.4**: tiêu chí đánh giá tuân thủ — kết quả quan trắc không vượt giá trị
  giới hạn cho phép tại Bảng 1 và Bảng 2.

QCVN phân cột A/B/C theo chức năng nguồn nước tiếp nhận; việc chọn cột phụ thuộc vào
phân vùng xả thải của từng cơ sở. MVP khóa Cột A cho cả mục tiêu học tập và ngưỡng đầu ra
để giữ kết quả so sánh nhất quán giữa các lượt:

```ts
receivingWaterClass: 'A'
standardColumn: 'A'
```

Đây là mục tiêu mô phỏng được chọn có chủ đích, không phải kết luận rằng mọi cơ sở xả
thải đều bắt buộc áp dụng Cột A.

Các giới hạn trích từ **Bảng 2, Thông tư 06/2025/TT-BTNMT** (đã xác minh pháp lý với
bản PDF chính thức; xem §16.1 P0-A):

| Thông số | Cột A | Cột B | Cột C | Nguồn |
| --- | ---: | ---: | ---: | --- |
| Fe | ≤ 2,0 mg/L | ≤ 10 mg/L | ≤ 10 mg/L | Bảng 2, TT 06/2025/BTNMT, hạng 17 |
| Zn | ≤ 1,0 mg/L | ≤ 5,0 mg/L | ≤ 5,0 mg/L | Bảng 2, TT 06/2025/BTNMT, hạng 14 |
| Pb | ≤ 0,1 mg/L | ≤ 0,5 mg/L | ≤ 0,5 mg/L | Bảng 2, TT 06/2025/BTNMT, hạng 9 |
| pH | 6–9 | 6–9 | 6–9 | Bảng 2, TT 06/2025/BTNMT, hạng 1 |

> **Áp dụng F ≤ 2.000 m³/ngày:** bảng trên áp dụng cho cơ sở có lưu lượng xả thải
> F ≤ 2.000 m³/ngày (Bảng 1 ghi chú đầu bảng, TT 06/2025/BTNMT). Đối với F > 2.000
> m³/ngày, ngưỡng COD/BOD/TSS (Bảng 1) thắt chặt hơn; Fe/Zn/Pb/pH ở Bảng 2 giữ nguyên.
> VECLab mô phỏng 1.000 mL ≈ 1 L mỗi lượt, nằm trong nhóm F ≤ 2.000 m³/ngày.

> **Lưu ý Bảng 1 (COD/BOD/TSS):** simulator không dùng các thông số này vì scope mô
> phỏng Fe/Zn/Pb/pH; nếu mở rộng, cần đối chiếu Bảng 1 (trang 4) cùng Thông tư.
> Mã ngành VECLab theo Phụ lục 2 là M712 (Kiểm tra và phân tích kỹ thuật) — thông số
> đặc trưng chỉ gồm **Amoni** (hạng 4 cột 4 Phụ lục 2). Fe/Zn/Pb không thuộc nhóm
> đặc trưng bắt buộc theo ngành nhưng thuộc Bảng 2 (Mục 4.1.4 cho phép bổ sung các
> thông số khác thuộc Bảng 2 khi phát sinh); mẫu mô phỏng có Fe/Zn/Pb nên phải kiểm
> soát theo Bảng 2.

> **Phân biệt rõ hai việc** (xem §16.1 P0-A): **(1) chọn Cột A làm mục tiêu mô phỏng**
> đã được quyết trong MVP (Fe ≤ 2,0, Zn ≤ 1,0, Pb ≤ 0,1 mg/L, pH 6–9); **(2) xác minh
> pháp lý các trị số** này với bản chính thức QCVN 40:2025/BTNMT — **đã đóng** với
> Thông tư 06/2025/TT-BTNMT (xem evidence register).

MVP dùng Cột A theo cấu hình MVP đã chốt (Fe ≤ 2,0, Zn ≤ 1,0, Pb ≤ 0,1 mg/L, pH 6–9).
Cột B/C chỉ dùng cho chế độ so sánh. Các trị số này là **đã xác minh pháp lý** với
bản chính thức QCVN 40:2025/BTNMT (Thông tư 06/2025/TT-BTNMT) theo evidence register
mục "Register — Xử lý nước Fe/Zn/Pb". Bất kỳ thay đổi nào về `standardColumn` hoặc
nguồn nước tiếp nhận phải kèm theo cập nhật evidence register và số Thông tư tương ứng.

Các giá trị trong bảng dưới được trích trực tiếp từ **Bảng 2 của Thông tư 06/2025/TT-BTNMT**
(đã xác minh, không phải bản nháp). Vị trí trích dẫn ghi rõ trong cột "Nguồn". Khi Thông
tư được sửa đổi hoặc thay thế, phải đối chiếu lại và cập nhật evidence register.

### 2.3. Mục tiêu đầu ra

Mục tiêu phải được tách thành từng tiêu chí, không dùng một nhãn “nước sạch” chung:

- pH cuối nằm trong khoảng mục tiêu MVP (đã xác minh pháp lý với Thông tư 06/2025/TT-BTNMT): `6–9`.
- Fe hòa tan cuối không vượt giới hạn Fe mục tiêu MVP.
- Zn hòa tan cuối không vượt giới hạn Zn mục tiêu MVP.
- Pb hòa tan cuối không vượt giới hạn Pb mục tiêu MVP.
- Không còn bùn chưa tách trong dòng sản phẩm.
- Cân bằng khối lượng đạt sai số cho phép.

> **Lưu ý ngôn ngữ:** "đạt mục tiêu MVP" / "đạt ngưỡng mô phỏng" **không đồng nghĩa**
> với "đạt QCVN". Cột A ở đây là mục tiêu mô phỏng đã chốt cho MVP, chưa phải trị số
> pháp lý đã xác minh. UI không được dùng nhãn "đạt QCVN" trong bất kỳ trường hợp nào
> khi P0-A còn mở (xem §4.1 `assessCompliance` và §17.6).

Mục tiêu đầu ra MVP tham chiếu `targetStandardId` với `standardColumn = 'A'` và phiên bản cụ thể. Nếu chuẩn chưa
được xác minh hoặc phép đo không đủ độ nhạy, kết quả bắt buộc là `N/A`, không được gắn
nhãn đạt.

### 2.4. Các hóa chất và công cụ bản MVP

Chỉ mô phỏng các vật tư ảo trong danh mục được cấp:

- HCl ảo để hạ pH và biểu diễn thêm chloride trong mô hình.
- NaOH ảo để tăng pH và tạo điều kiện kết tủa hydroxide.
- Precursor salt ảo của Fe, Pb và Zn để tạo mẫu; loại muối và nồng độ stock phải được khóa trong content bundle.
- Chất keo tụ chỉ mở sau khi có mô hình và nguồn phù hợp.
- Bể lắng ảo, bộ lọc ảo và thiết bị đo pH/nồng độ.

Tên hóa chất, nồng độ stock, giới hạn liều và hệ số nguy hại đều cần được khóa trong
content bundle; không hardcode tùy ý trong UI.

## 3. Miền đầu vào

Người học điều khiển:

1. Thể tích mẫu trong miền `500–2.000 mL`, mặc định `1.000 mL`.
2. Nồng độ Fe, Zn và Pb trong miền đã khóa.
3. pH ban đầu — **không phải user input**; là kết quả tính từ composition (mục 2.1, 6.1.2).
4. Chế độ mục tiêu: xử lý tất cả kim loại hoặc tập trung vào một kim loại.
5. Hóa chất và thể tích mỗi lần thêm.
6. Trình tự điều chỉnh pH, trộn, lắng và lọc.
7. Điểm dừng và quyết định có đo lại hay tiếp tục xử lý.

### 3.1. Kiểm soát tải kim loại hòa tan

Fe, Zn và Pb đều được phép cùng vượt ngưỡng đầu ra, nhưng chỉ khi mẫu vẫn nằm trong
miền mà mô hình cho phép tồn tại dưới dạng hòa tan. Không được kiểm tra từng kim loại
độc lập rồi cộng cả ba tải lượng mà không xét ảnh hưởng của pH, thể tích và các chất
đang có trong mẫu.

Với mỗi kim loại `M`, validator phải tính:

```text
dissolvedMassM = concentrationM × sampleVolume
availableCapacityM = capacityM(
  pH,
  temperature,
  sampleVolume,
  ionicStrength,
  alkalinity,
  competingDissolvedMasses,
  speciesBundleVersion,
)
```

Mẫu chỉ hợp lệ khi:

```text
0 <= dissolvedMassM <= availableCapacityM
```

`availableCapacityM` không phải một hằng số chung cho Fe, Zn và Pb. Nó phải được tính
riêng theo bộ species/hằng số đã khóa. Nếu thiếu dữ liệu để tính capacity hoặc phần vượt
khả năng hòa tan không xác định được, mẫu phải bị từ chối với `SOLUBILITY_UNRESOLVED`,
không tự động chuyển phần dư thành kết tủa.

Validator cũng phải kiểm tra tổng tải hòa tan và tác động lẫn nhau:

- Tăng Zn không được làm Fe hoặc Pb biến mất khỏi state mà không có cơ chế hóa học.
- Tăng Pb hoặc Fe cũng phải được kiểm tra cùng capacity và species bundle của mẫu.
- Khối lượng kim loại được tính theo thể tích mẫu thực tế, không theo thể tích benchmark cố định.
- Nếu mẫu có phần rắn ban đầu, phần đó phải được khai báo riêng; không gọi toàn bộ là hòa tan.
- Nồng độ vượt ngưỡng quy chuẩn không đồng nghĩa với vượt capacity hòa tan; đây là hai validator khác nhau.

Đối với MVP, có thể dùng `capacityModelStatus = 'unresolved'` cho các miền chưa đủ dữ liệu.
UI chỉ cho tiếp tục khi validator trả về `valid`; report phải hiển thị rõ capacity, tải đã
nhập và phần margin còn lại.

Không cho phép:

- Nồng độ âm, thể tích âm hoặc pH ngoài miền mô hình.
- Tạo mẫu có tổng khối lượng không hợp lệ.
- Tạo mẫu có tải Fe, Zn hoặc Pb vượt capacity hòa tan tại điều kiện đầu vào.
- Tạo mẫu có tổng tải kim loại hoặc tải cạnh tranh chưa thể tính bằng species bundle hiện hành.
- Tự nhập hằng số cân bằng, giới hạn quy chuẩn hoặc mật độ tùy ý trong benchmark.
- Gọi nước là “đạt chuẩn” khi chưa lọc/tách bùn và chưa đo đủ ba kim loại.

### 3.2. Cấu hình slider kim loại đầu vào

Slider là cách người học chọn nồng độ mục tiêu của Fe, Zn, Pb khi tạo mẫu. Cấu hình
slider được khóa theo các quy tắc dưới đây để giữ mô hình giáo dục nhất quán giữa các lượt.

#### 3.2.1. Slider cap (`single_max`)

- `single_max` = **100 mg/L** cho mỗi kim loại.
- Đây là miền slider thực tế, đủ cho mục tiêu giáo dục.
- Không phải độ tan vật lý — chỉ là practical cap. Độ tan vật lý được hiển thị riêng
  (xem mục 3.2.3) cho mục đích tham khảo cơ sở hóa học.

#### 3.2.2. Công thức slider max (quy tắc 1/N²)

Khi tick `N` kim loại (N ∈ {1, 2, 3}), slider max cho mỗi kim loại là:

```text
slider_max(metal) = single_max / N² = 100 / N²
```

| Tick | N | Slider max mỗi KL |
| --- | :-: | ---: |
| 1 KL | 1 | 100 mg/L |
| 2 KL | 2 | 25 mg/L |
| 3 KL | 3 | ≈ 11,1 mg/L |

> **Quy tắc này là quy ước sư phạm, không phải định luật vật lý.** Lý do chọn
> 1/N²: khi tick nhiều kim loại, tổng tải kim loại trên cùng một thể tích nước
> tăng theo `N × cap`. Nếu giữ nguyên `single_max = 100 mg/L` cho cả 3 KL, tổng
> tải lên tới 300 mg/L — vượt xa benchmark 10 mg/L Fe + 5 mg/L Zn + 0,3 mg/L Pb
> (tổng ≈ 15,3 mg/L) và cũng vượt miền mô hình có khả năng hội tụ (xem §6.6.5).
>
> **Công thức hiện tại** `N × (single_max / N²) = single_max / N` cho thấy tổng tải
> **giảm** khi N tăng (100 → 50 → 33,3 mg/L), **không** giữ không đổi. Câu "giữ
> tổng tải tối đa không đổi" trong bản trước là sai toán. Lý do giảm: mô hình
> solver khó hội tụ ở tổng tải cao (xem §6.6.5). Đây là giới hạn do **ràng
> buộc mô hình**, không phải do "chia nước theo 1/N²".
>
> **Bản tiếp theo nên dùng `single_max / N`** thay vì `single_max / N²` để phản
> ánh đúng ràng buộc tổng tải; trong MVP này vẫn dùng `/ N²` vì khóa trước
> khi có capacity 3 KL (P0-C).
>
> Slider cap không có ý nghĩa hóa học. Mục 3.2.3 hiển thị độ tan vật lý riêng
> cho mục đích tham khảo cơ sở hóa học; §3.2.4 giải thích vùng đầu vào để luyện
> tập.

#### 3.2.3. Độ tan vật lý (info display)

Hiển thị text bên cạnh slider để user tham khảo cơ sở hóa học. **Không dùng làm slider
cap** — slider cap luôn là 100 mg/L (mục 3.2.1).

| Muối precursor | Độ tan trong 1L nước | Nồng độ ion kim loại tương ứng | Nguồn |
| --- | ---: | ---: | --- |
| FeCl₃·6H₂O | 912 g/L (25 °C) | 188.400 mg Fe³⁺/L | CRC Handbook 95th |
| ZnSO₄·7H₂O | 22 g/100 mL (20 °C) | 50.000 mg Zn²⁺/L | CRC Handbook 87th |
| Pb(NO₃)₂ | 597 g/L (25 °C) | 373.500 mg Pb²⁺/L | CRC Handbook 96th |

Lưu ý:

- Độ tan vật lý cao hơn slider cap 100 mg/L rất nhiều (gấp ~100 lần trở lên).
- Mục đích hiển thị là giáo dục (cho user biết cơ sở hóa học), không phải để mở rộng slider.
- Nguồn chi tiết và claim mapping trong sổ đăng ký bằng chứng khoa học (claim key
  `WT-SALT-SOLUBILITY`).

#### 3.2.4. Vùng đầu vào để luyện tập (không phải ngưỡng pháp lý)

> **Tên gọi đã đổi từ "Vùng khuyến nghị (QCVN Cột A)" → "Vùng đầu vào để luyện tập".**
> Lý do: cận trên của vùng xanh (10 mg/L Fe/Zn, 0,5 mg/L Pb) **không phải** giới hạn
> QCVN Cột A mà là giới hạn Cột B/C; cận dưới (1,0 mg/L Fe/Zn, 0,05 mg/L Pb) cũng
> không phải giới hạn dưới của QCVN. Gọi vùng này là "QCVN Cột A" là sai — gây hiểu
> nhầm rằng giá trị trong vùng xanh là compliant.

**Hai khái niệm phải tách rõ trong UI:**

1. **Vùng đầu vào để luyện tập** (educational input zone, vùng xanh slider) — khoảng
   giá trị user nên pick để thấy được hiệu quả xử lý. Scale theo 1/N² cùng slider max
   (mục 3.2.2). **Đây là quy ước giáo dục, không phải giới hạn pháp lý.**

2. **Giới hạn pháp lý QCVN 40:2025** (legal compliance threshold) — Fe ≤ 2,0; Zn ≤ 1,0;
   Pb ≤ 0,1 mg/L tại Cột A (không scale theo N). Cố định bởi quy chuẩn, không phải
   cấu hình bundle.

| Tick | Fe (vùng luyện tập) | Zn (vùng luyện tập) | Pb (vùng luyện tập) |
| --- | --- | --- | --- |
| 1 KL | 1,0 – 10,0 | 1,0 – 10,0 | 0,05 – 0,5 |
| 2 KL | 0,25 – 2,5 | 0,25 – 2,5 | 0,0125 – 0,125 |
| 3 KL | 0,111 – 1,11 | 0,111 – 1,11 | 0,0056 – 0,0556 |

> **Ghi chú:** Cận trên của vùng luyện tập (10 mg/L Fe/Zn, 0,5 mg/L Pb) trùng giới
> hạn Cột B/C của QCVN; cận dưới (1,0 mg/L Fe/Zn, 0,05 mg/L Pb) gần với LOD thực tế
> của phép đo. Đây là quy ước giáo dục thuận tiện, không phải quy định pháp lý.

**Đường giới hạn pháp lý (hiển thị cố định trên slider, không scale theo N):**

| Kim loại | Cột A | Cột B | Cột C |
| --- | ---: | ---: | ---: |
| Fe (mg/L) | 2,0 | 10,0 | 10,0 |
| Zn (mg/L) | 1,0 | 5,0 | 5,0 |
| Pb (mg/L) | 0,1 | 0,5 | 0,5 |
| pH | 6 – 9 | 6 – 9 | 6 – 9 |

> ✅ **Bảng này khớp với bảng §2.2** (cùng Bảng 2, Thông tư 06/2025/TT-BTNMT, đã xác
> minh ngày 16/10/2026). Cột A giữ nguyên; Cột B/C đã được sửa: Fe B = 10,0 (sửa từ
> 5,0); Zn B = 5,0 (sửa từ 3,0); Pb C = 0,5 (sửa từ 1,0); pH B/C = 6–9 (sửa từ
> 5,5–9 và 5–9). Mâu thuẫn nội bộ §2.2 ↔ §3.2.4 đã được giải quyết. Xem §16.1 P0-A.

UI phải vẽ các đường này dưới dạng vạch dọc trên slider để user thấy mối tương quan
giữa vùng luyện tập (màu xanh) và ngưỡng pháp lý (vạch đen). Post-treatment
Assessment (§7.4.7) dùng giới hạn pháp lý, không dùng vùng luyện tập.

#### 3.2.5. Cảnh báo vượt QCVN

Khi user pick giá trị ngoài **vùng luyện tập** (mục 3.2.4):

- Hiển thị cảnh báo: **"Vượt vùng luyện tập — kiểm tra mối quan hệ với QCVN 40:2025
  Cột A (Fe 2,0; Zn 1,0; Pb 0,1 mg/L)."**
- Vẫn cho pick, nhưng gắn `reasonCode: 'INPUT_OUT_OF_TRAINING_ZONE'` vào sample
  assessment event.
- Cảnh báo không chặn commit, chỉ đánh dấu để chấm điểm quy trình.

Khi user pick giá trị nằm trong Cột B/C nhưng ngoài Cột A (ví dụ Fe = 5 mg/L ở chế độ
1 KL): cảnh báo bổ sung: **"Trong Cột B/C — cần xử lý đạt Cột A để xả vào nguồn nước
nhạy cảm."**

#### 3.2.6. Slider step

| Kim loại | Step | Đơn vị |
| --- | ---: | --- |
| Fe | 0,1 | mg/L |
| Zn | 0,1 | mg/L |
| Pb | 0,001 (1-KL & 2-KL); 0,001 (3-KL) | mg/L |
| Fe, Zn | 0,1 (1-KL & 2-KL); 0,01 (3-KL) | mg/L |

> **Quyết định khóa (P0-H):** step phụ thuộc số kim loại tick để luôn biểu diễn
> được training zone cận dưới. Cụ thể:
>
> | Kim loại | 1-KL | 2-KL | 3-KL | Lý do |
> | --- | ---: | ---: | ---: | --- |
> | Fe | 0,1 | 0,1 | 0,01 | 3-KL cận dưới 0,111 mg/L — step 0,1 chỉ ra 0,1 hoặc 0,2 (sai số 0,011); step 0,01 ra 0,11 (sai số 0,001) |
> | Zn | 0,1 | 0,1 | 0,01 | tương tự Fe |
> | Pb | 0,001 | 0,001 | 0,001 | Cận dưới 0,05 / 0,0125 / 0,0056; step 0,001 ra lần lượt 0,050 / 0,013 (sai số 0,0005) / 0,006 (sai số 0,0004). Sai số tuyệt đối ≤ 0,0005 mg/L chấp nhận được cho mục đích đào tạo. |
>
> Slider cap 100 mg/L × step nhỏ nhất 0,001 = 100.000 detents — HTML range input
> chấp nhận được. UI hiển thị 3-4 chữ số có nghĩa (vd `0,0056`) thay vì
> `0,00599999...`.

#### 3.2.7. Pick = 0

- User có thể pick = 0 cho bất kỳ kim loại nào (kể cả khi đã tick).
- Pick = 0 nghĩa là kim loại đó không có trong mẫu → không cần xử lý.
- Slider vẫn hiển thị nhưng không cảnh báo QCVN (vì 0 ≤ min).

#### 3.2.8. Quan hệ với input range khám phá (mục 2.1)

Slider cap (100 mg/L) rộng hơn input range khám phá trong mục 2.1:

| Kim loại | Input range khám phá (mục 2.1) | Slider cap (mục 3.2.1) |
| --- | --- | --- |
| Fe | 0,5 – 20 mg/L | 100 mg/L |
| Zn | 0,2 – 10 mg/L | 100 mg/L |
| Pb | 0,02 – 1 mg/L | 100 mg/L |

User có thể pick ngoài input range khám phá (ví dụ Fe = 50 mg/L) để xem "nếu mẫu quá ô
nhiễm thì sao". Cảnh báo phụ: **"Ngoài input range khám phá — kết quả chỉ mang tính minh họa."**

#### 3.2.9. Ví dụ minh họa

> Quy tắc step áp dụng cho mọi ví dụ dưới đây: **Fe/Zn 0,1 mg/L (1-KL & 2-KL) hoặc
> 0,01 mg/L (3-KL); Pb 0,001 mg/L mọi mode** (xem §3.2.6). Slider cap tuân theo
> `100 / N²` (mục 3.2.2): 1-KL = 100 mg/L, 2-KL = 25 mg/L, 3-KL ≈ 11,1 mg/L.

Khi tick **1 kim loại** (ví dụ Fe):

- Slider Fe: 0–100 mg/L
- Vùng xanh Fe: 1,0–10,0 mg/L
- Step Fe: 0,1 mg/L
- (Pb và Zn không hiển thị)

Khi tick **2 kim loại** Fe + Zn:

- Slider Fe: 0–25 mg/L
- Slider Zn: 0–25 mg/L
- Vùng xanh Fe: 0,25–2,5 mg/L
- Vùng xanh Zn: 0,25–2,5 mg/L
- Step Fe/Zn: 0,1 mg/L
- (Pb không hiển thị)

Khi tick **3 kim loại** Fe + Zn + Pb:

- Slider Fe: 0–11,1 mg/L (= 100 / 3²)
- Slider Zn: 0–11,1 mg/L (= 100 / 3²)
- Slider Pb: 0–11,1 mg/L (= 100 / 3²)
- Vùng xanh Fe: 0,111–1,11 mg/L
- Vùng xanh Zn: 0,111–1,11 mg/L
- Vùng xanh Pb: 0,0056–0,0556 mg/L
- Step Fe/Zn: **0,01 mg/L**
- Step Pb: **0,001 mg/L**

## 4. Luồng trạng thái

```text
SAMPLE_DRAFT
  → SAMPLE_READY
  → CHARACTERIZED
  → REAGENT_ADDED
  → MIXED
  → SETTLED
  → FILTERED
  → VERIFIED
      ├─ đạt → COMPLETED / SUCCESS
      ├─ chưa đạt, còn giới hạn → REAGENT_ADDED (vòng mới)
      └─ không đủ dữ liệu → COMPLETED / INVALID
```

### 4.1. State đề xuất

```ts
type WaterTreatmentState = {
  attemptPhase: 'draft' | 'in-progress' | 'completed'
  sample: WaterSample
  targetStandardId: string | null
  standardColumn: 'A' | 'B' | 'C' | null // MVP: 'A'
  receivingWaterClass: 'A' | 'B' | 'C' | 'unspecified' | null // MVP: 'A'
  processRoute: TreatmentRoute | null
  phase:
    | 'sample-draft'
    | 'sample-ready'
    | 'characterized'
    | 'reagent-added'
    | 'mixed'
    | 'settled'
    | 'filtered'
    | 'verified'
    | 'completed'
  additions: TreatmentAddition[]
  measurements: WaterMeasurement[]
  solids: SolidInventory
  streams: WaterStream[]
  resources: WaterTreatmentResourceLedger
  dissolvedCapacity: DissolvedCapacitySnapshot
  pHGuard: PHGuardSnapshot
  compositionRevision: number
  measurementRevision: number | null
  /** Kết quả mô phỏng nội bộ từ solver — chưa phải kết luận cuối cùng cho user. */
  calculatedOutcome: 'pending' | 'success' | 'partial-success' | 'failed' | 'invalid'
  goalStatus: 'pending' | 'success' | 'partial-success' | 'failed' | 'invalid' | 'unknown'
  invalidReasonCodes: string[]
  unknownReasonCodes: ('P0-A' | 'P0-B' | 'P0-C' | 'P0-D' | 'P0-E' | 'P0-F')[]
  // P0-J (mass-balance tolerance §16.1) không phải blocker kết quả cuối.
  // Nếu mass_balance fail → calculatedOutcome = 'invalid', không bao giờ vào unknown.
  // P0-J chỉ là kiểm tra nội bộ; khi P0-J đóng, con số tolerance mới được commit.
}
```

**Ghi chú về `qcvnCompliant`:** `qcvnCompliant` **đã bị loại bỏ** khỏi spec
vì logic cũ (chỉ xét pH, không xét Fe/Zn/Pb) dẫn đến kết luận sai. Thay bằng
hàm `assessCompliance` dưới đây. Nếu code cũ tham chiếu `qcvnCompliant`, phải
chuyển sang dùng `assessCompliance`.

**Hàm `assessCompliance` — đánh giá tổng hợp trạng thái tuân thủ:**

> **Nguyên tắc pháp lý bắt buộc:** không được suy ra `'pass'` chỉ từ việc không
> có lỗi pH. Hàm phải xem xét đồng thời pH, Fe, Zn, Pb **và** các điều kiện
> tiên quyết (chuẩn đã xác minh, phép đo hợp lệ, mass balance OK, bùn đã tách).
> Thiếu bất kỳ điều kiện nào → `'unknown'`, không phải `'pass'` hay `'fail'`.

```ts
type ComplianceStatus = 'pass' | 'fail' | 'unknown'

function assessCompliance(input: {
  standardVerified: boolean   // true khi P0-A đóng: QCVN đã xác minh pháp lý
  measurementsValid: boolean // true khi có measurement after-treatment hợp lệ
  massBalancePassed: boolean // true khi mass balance check §7.4.5 đạt
  sludgeSeparated: boolean   // true khi phase = 'filtered'
  pH_pass: boolean          // pH filtrate trong dải QCVN
  Fe_pass: boolean          // Fe filtrate ≤ giới hạn Cột A
  Zn_pass: boolean          // Zn filtrate ≤ giới hạn Cột A
  Pb_pass: boolean          // Pb filtrate ≤ giới hạn Cột A
}): ComplianceStatus {
  // Bước 1: nếu thiếu dữ liệu cần thiết → không thể kết luận
  if (!input.standardVerified || !input.measurementsValid) {
    return 'unknown'
  }

  // Bước 2: nếu mass balance hoặc sludge separation lỗi → không đáng tin
  if (!input.massBalancePassed || !input.sludgeSeparated) {
    return 'unknown'
  }

  // Bước 3: đánh giá kết quả thực — phải đạt cả 4 thông số
  const allTargetsPass =
    input.pH_pass && input.Fe_pass && input.Zn_pass && input.Pb_pass
  return allTargetsPass ? 'pass' : 'fail'
}
```

**Quy tắc sử dụng:**

- `assessCompliance` trả `'pass'` hoặc `'fail'` **chỉ khi** tất cả điều kiện
  tiên quyết ở Bước 1 và 2 đều thỏa mãn.
- Khi trả `'unknown'`, UI phải hiển thị "chưa xác định" thay vì "đạt" hoặc
  "không đạt" QCVN.
- `'pass'` / `'fail'` từ `assessCompliance` dùng để hiển thị cho user và quyết
  định `goalStatus` cuối cùng.
- **`assessCompliance` vs `calculatedOutcome/goalStatus` — hai hệ tên khác nhau:**
  - `ComplianceStatus` (dùng trong `assessCompliance`): `'pass'` | `'fail'` | `'unknown'`
    → phản ánh kết quả mô hình hóa học so với giới hạn.
  - `calculatedOutcome` / `goalStatus` (schema state): `'success'` | `'partial-success'` |
    `'failed'` | `'invalid'` | `'unknown'` → phản ánh workflow và tính hợp lệ tổng thể.
  - Code **không được** gán giá trị từ hệ này sang hệ kia (ví dụ: không gán
    `goalStatus = 'pass'`). Nếu implementation cần chuyển đổi, phải qua hàm
    `finalizeOutcome` hoặc `assessCompliance` tùy ngữ cảnh.
- `goalStatus` có thể vẫn là `'unknown'` ngay cả khi `assessCompliance` trả
  `'pass'` — nếu P0 blockers còn mở (xem mục goalStatus semantics).

Mọi lần thêm hóa chất phải tăng `compositionRevision` và làm mất hiệu lực kết quả đo cũ.
Lọc phải chuyển khối lượng kim loại đã kết tủa sang dòng bùn; không được âm thầm xóa khỏi
dòng nước.

`dissolvedCapacity` phải lưu capacity của từng kim loại tại revision hiện tại, tải đang có,
margin còn lại, trạng thái tính toán và phiên bản species bundle. `pHGuard` phải lưu pH
trước addition, pH dự đoán, miền cho phép và lý do từ chối nếu addition không hợp lệ.

**Ngữ nghĩa `calculatedOutcome` và `goalStatus` (two-layer design):**

Mỗi khi solver hoặc assessment logic gán kết quả, phải gán vào **hai trường** theo
quy tắc dưới đây. Không bao giờ gán `goalStatus` trực tiếp bằng kết quả solver.

**`calculatedOutcome`** — kết quả mô phỏng nội bộ (không hiển thị trực tiếp cho user):

- `pending` — chưa chạy đủ flow.
- `success` — tất cả thông số filtrate đạt Cột A **và** mass balance OK.
- `partial-success` — Fe+Zn đạt, Pb fail (xem §7.4.9).
- `failed` — Fe hoặc Zn fail (đã dùng hết dose cap).
- `invalid` — mass balance fail, dose cap exceeded, v.v.

**`goalStatus`** — kết quả được phép hiển thị cho user:

- Nếu **bất kỳ P0 blocker nào còn mở** (P0-A → P0-F chưa đóng): `goalStatus = 'unknown'`
  và `unknownReasonCodes` phải liệt kê tất cả các P0 chưa đóng.
- Nếu **tất cả P0 cần thiết đã đóng**: `goalStatus = calculatedOutcome`.
  (Điều kiện "P0 nào cần thiết" do từng giai đoạn quyết định: Pre-treatment cần
  P0-A; Post-treatment + scoring cần P0-A đến P0-F.)
- `pending`, `invalid` — giữ nguyên, không bị override bởi P0 check.

**Hàm helper gán kết quả (dùng trong mọi nơi gán calculatedOutcome):**

> **Lưu ý TypeScript:** hàm trả về một **object chứa cả `goalStatus` và
> `calculatedOutcome` mới** (không chỉ trả về string). Caller phải destructure
> và merge vào state. Hai nhánh `pending`/`invalid` cũng trả object để giữ
> contract đồng nhất.

```ts
type FinalizeResult = {
  goalStatus: WaterTreatmentState['goalStatus']
  calculatedOutcome: WaterTreatmentState['calculatedOutcome']
  unknownReasonCodes: WaterTreatmentState['unknownReasonCodes']
}

function finalizeOutcome(
  calculated: WaterTreatmentState['calculatedOutcome'],
  openBlockers: P0Code[]
): FinalizeResult {
  // pending và invalid là final — không override bởi P0 check
  if (calculated === 'pending' || calculated === 'invalid') {
    return {
      goalStatus: calculated,
      calculatedOutcome: calculated,
      unknownReasonCodes: []
    }
  }

  // Có blocker còn mở → goalStatus bị giữ, calculatedOutcome vẫn lưu để debug
  if (openBlockers.length > 0) {
    return {
      goalStatus: 'unknown',
      calculatedOutcome: calculated,
      unknownReasonCodes: [...openBlockers]
    }
  }

  // Đủ điều kiện → truyền calculatedOutcome ra goalStatus
  return {
    goalStatus: calculated,
    calculatedOutcome: calculated,
    unknownReasonCodes: []
  }
}

// Cách dùng đúng (phải merge vào state, không gán trực tiếp):
const result = finalizeOutcome(calculatedOutcome, openBlockers)
state.goalStatus = result.goalStatus
state.calculatedOutcome = result.calculatedOutcome
state.unknownReasonCodes = result.unknownReasonCodes
```

**Quy tắc quan trọng:** Đội code có thể chạy solver và xem kết quả nội bộ
(`calculatedOutcome`) trong quá trình phát triển. UI chỉ hiển thị `goalStatus`
— và khi P0 blockers còn mở, `goalStatus` luôn là `'unknown'` với thông báo
"chưa xác định — chờ xác minh". Đây là rào chắn pháp lý bắt buộc.

### 4.2. Type definitions cho các trường tham chiếu trong state

`WaterTreatmentState` ở mục 4.1 tham chiếu nhiều kiểu dữ liệu chưa được khai báo tại
các mục khác. Mục này định nghĩa các kiểu còn lại đủ để viết skeleton code và test harness.
Hai kiểu `DissolvedCapacitySnapshot` và `PHGuardSnapshot` đã có ở mục 6.4 nên không lặp lại
tại đây. `WaterMeasurement` tạm thời chưa định nghĩa — chờ §14 khóa LOD/accuracy/rounding
(xem mục 16 mục 6) rồi bổ sung sau.

Các kiểu dưới đây dùng union `ReagentId` để dễ mở rộng khi thêm reagent (ví dụ precursor
salt FeCl₃, ZnSO₄, Pb(NO₃)₂ ở phase sau):

```ts
type ReagentId = 'hcl_1m' | 'naoh_1m'
type MetalId = 'Fe' | 'Zn' | 'Pb'
type StreamId = 'filtrate' | 'sludge'
```

#### 4.2.1. `TreatmentAddition`

Lưu mỗi lần thêm acid/base. Khi `accepted: false` thì vẫn log event để audit
(xem mục 5.3).

```ts
type TreatmentAddition = {
  additionId: string                  // UUID, khoá event log
  attemptId: string
  sequence: number                    // tăng đơn điệu trong attempt
  reagentId: ReagentId                // 'hcl_1m' | 'naoh_1m' (mục 5.2.1)
  doseMl: number                      // liều từ aliquot set {0,05; 0,10; 0,50; 1,00; 5,00}
  doseUnit: 'mL'
  stockConcentrationM: number         // = 1,0 (mirror từ bundle, mol/L)
  pHBefore: number
  pHPredicted: number | null          // null nếu pH model unresolved
  pHGuardStatus: 'allowed' | 'rejected' | 'unresolved'
  pHGuardReasonCode: string | null    // 'PH_GUARD_EXCEEDED' | 'DOSE_LIMIT_EXCEEDED' | 'PH_MODEL_UNRESOLVED' | null
  compositionRevision: number         // tăng nếu commit
  accepted: boolean                   // false nếu guard reject
  errorCodes: string[]
  timestamp: string                   // ISO 8601
  actor: 'learner' | 'system'
}
```

`pHPredicted` lấy từ `solveAcidBaseEquilibrium` (mục 5.2, 6.1.1). Khi mở thêm reagent,
`ReagentId` union mở rộng; type `TreatmentAddition` không cần đổi.

#### 4.2.2. `WaterTreatmentResourceLedger`

Cumulative tracking cho cap và chỉ số giáo dục. Controller (`add_reagent`) phải đọc
ledger trước khi commit để kiểm tra `cumulativeDoseByReagent[id] + dose ≤
maxCumulativeDoseByReagent[id]`.

```ts
type WaterTreatmentResourceLedger = {
  attemptId: string
  cumulativeDoseByReagent: Record<ReagentId, number>      // mL, mặc định 0
  maxSingleDoseByReagent: Record<ReagentId, number>       // mirror từ bundle, mL
  maxCumulativeDoseByReagent: Record<ReagentId, number>   // mirror từ bundle, mL
  pHGuardHits: number                                     // số lần guard reject
  doseLimitHits: number                                   // số lần DOSE_LIMIT_EXCEEDED
  totalReagentVolumeMl: number                            // tổng tất cả reagent, mL
  totalSampleVolumeMl: number                             // V_sample hiện tại, mL
  updatedAtCompositionRevision: number
}
```

- HCl/NaOH hiện có cap 5/10 mL mỗi loại (mục 5.2.1). Khi mở precursor salt, thêm key
  vào 3 map `…ByReagent` — controller không cần đổi logic.
- `pHGuardHits` và `doseLimitHits` phục vụ chấm quy trình (mục 10: "Tuân thủ quy trình
  15 điểm" có thể trừ theo số lần reject).
- `totalReagentVolumeMl` / `totalSampleVolumeMl` phục vụ mục 9.2 "Tổng thể tích từng
  reagent".

#### 4.2.3. `WaterSample`

Composition ban đầu, sau khi user pick slider. Tạo một lần khi `configure_sample` được
chấp nhận.

```ts
type WaterSample = {
  sampleId: string
  attemptId: string
  volumeMl: number                      // 500–2000, benchmark 1000 (mục 2.1)
  temperatureC: number                  // mặc định 25,0 °C; mirror từ config
  compositionRevision: number           // 0 khi mới tạo
  nominalFe_mgPerL: number              // từ slider Fe
  nominalZn_mgPerL: number              // từ slider Zn
  nominalPb_mgPerL: number              // từ slider Pb
  precursorMass: {                      // khối lượng muối thêm vào (mục 5.1.2)
    fecl3_6h2o_mg: number
    znso4_7h2o_mg: number
    pbno3_mg: number
  }
  initialPH: number | null              // tính bởi mục 6.1.2
  initialPHModelResult: InitialPHResult | null
  qcvnAssessment: PreTreatmentAssessment | null  // bảng 4 dòng pH/Fe/Zn/Pb vs Cột A
  createdAt: string
}
```

- `initialPHModelResult` tham chiếu `InitialPHResult` ở mục 6.1.2 (đã định nghĩa).
- `qcvnAssessment` map với bảng Pre-treatment ở mục 5.1.1 (4 dòng, ✓/✗, tỉ lệ vượt).
- `temperatureC` không hardcode 25,0 trong type: giá trị mặc định 25,0 °C đặt tại
  constructor của sample builder, lấy từ config release. Khi chốt bộ hằng số ở nhiệt
  độ khác, chỉ đổi config.

#### 4.2.4. `SolidInventory`

Theo dõi kết tủa và sludge. Cập nhật mỗi lần `mix` (mục 7.4.3) và `filter` (mục 7.4.5).

> **Quy ước đơn vị cho `precipitateByMetal_mol`:** tên field ghi `_mol` = tổng số mol
> trong toàn bộ mẫu (không phải mol/L). Khi cộng dồn, **phải nhân với `V_sample_L`
> = `volumeMl / 1000`**. Sai quy ước này dẫn đến mass balance sai ~1000 lần. Xem
> §4.2.7 cho quy ước đơn vị toàn schema.

```ts
type SolidInventory = {
  attemptId: string
  compositionRevision: number
  precipitateByMetal_mol: Record<MetalId, number>     // tổng mol trong toàn mẫu (= mol/L × V_L)
  sludgeMassDry_mg: {
    feoh3: number                                     // × M_Fe(OH)3 = 106,87 g/mol × 1000 = 106870 mg/mol
    znoh2: number                                     // × M_Zn(OH)2 = 99,40 g/mol × 1000 = 99400 mg/mol
    pboh2: number                                     // × M_Pb(OH)2 = 241,20 g/mol × 1000 = 241200 mg/mol
  }
  totalSludgeMassDry_mg: number                       // tổng (đơn vị mg)
  carriedWaterFraction: number                        // mặc định 0,10 (mục 7.4.5)
  updatedAt: string
}
```

- Tách rõ `precipitateByMetal_mol` (dùng cho mass balance mục 6.3) và
  `sludgeMassDry_mg` (dùng cho hiển thị mục 9.1 "khối lượng chất rắn").
- `carriedWaterFraction` để §16 mục 5 khi chốt "lý tưởng hay recovery" thì sửa tại đây,
  không phải sửa logic nơi khác.

#### 4.2.5. `WaterStream`

Filtrate và sludge stream sinh ra sau `filter` (mục 7.4.5). Stream lưu **khối lượng**
(mg), không phải nồng độ — vì stream có thể được pha loãng thêm khi sang bước tiếp.
Nồng độ tính tại chỗ đọc:

```
concentration (mg/L) = mass_mg × 1000 / volumeMl
```

(ví dụ: 5 mg Fe hòa tan trong 1000 mL → 5 × 1000 / 1000 = 5 mg/L, đúng. Sai công thức
cũ `mass / volumeMl` cho 0,005 mg/mL — sai đơn vị 1000 lần.)

```ts
type WaterStream = {
  streamId: StreamId                   // 'filtrate' | 'sludge'
  attemptId: string
  compositionRevision: number
  parentSampleId: string | null        // null nếu là stream gốc
  volumeMl: number
  dissolvedFe_mg: number
  dissolvedZn_mg: number
  dissolvedPb_mg: number
  solidFe_mg: number
  solidZn_mg: number
  solidPb_mg: number
  pH: number | null
  massBalanceResidual_pct: number | null   // cho mục 12.1 mass balance check
  createdAt: string
}
```

- `StreamId` hiện tại `'filtrate' | 'sludge'`; mở rộng khi thêm adsorption (sẽ có
  `'treated-water' | 'spent-carbon'`).
- `parentSampleId` để trace lại nguồn khi replay server-side (mục 17.4).

#### 4.2.6. Trạng thái chưa định nghĩa

- `WaterMeasurement`: chờ §14 khóa LOD/accuracy/rounding (xem mục 16 mục 6). Khi có số
  LOD sẽ thêm vào đây; pattern dự kiến: `pH`, `dissolved*_mgPerL` là `number | null` (null
  khi thiết bị không đo được hoặc dưới LOD), kèm `noiseModel: { metalRelPct: number;
  pHAbs: number }`.

#### 4.2.7. Quy ước đơn vị toàn schema

Mọi field trong state phải theo quy ước dưới. Sai đơn vị dẫn đến mass balance sai
~1000 lần (mg vs mg/L) hoặc ~1000 lần (mL vs L).

**Bảng quy ước:**

| Hậu tố / tên field | Đơn vị | Quy ước |
| --- | --- | --- |
| `_mg` | miligam (khối lượng) | Khối lượng tuyệt đối, không phải nồng độ |
| `_mgPerL` | mg/L (nồng độ) | Chia `mass_mg` cho `V_L`, hoặc `mass_mg × 1000 / V_mL` |
| `_mol` | mol (tổng lượng) | Tổng mol trong toàn mẫu = `concentration × V_L` |
| `_molPerL` | mol/L (nồng độ) | Output của solver §6.6; phải nhân `V_L` để thành tổng mol |
| `_ml` | mililít (thể tích) | Thể tích; chia 1000 để ra L |
| `_l` (lowercase) | lít | Hiếm dùng; ưu tiên `_ml` cho nhất quán với input UI |
| `_pct` | phần trăm (%) | Không phải phần thập phân; 50% = 50, không phải 0,5 |
| `pH` | đơn vị pH | `pH = -log10([H⁺])`; không có hậu tố |
| `temperatureC` | °C | Độ C; convert sang K bằng `+ 273,15` nếu cần |

**Chuyển đổi chuẩn:**

| Từ | Sang | Công thức |
| --- | --- | --- |
| `mass_mg`, `V_mL` | `concentration_mgPerL` | `mass_mg × 1000 / V_mL` |
| `concentration_mgPerL`, `V_mL` | `mass_mg` | `concentration_mgPerL × V_mL / 1000` |
| `concentration_molPerL`, `V_mL` | `mol_total` | `concentration_molPerL × V_mL / 1000` |
| `mol_total` | `mass_mg` | `mol_total × M_gPerMol × 1000` |
| `concentration_mgPerL` | `concentration_molPerL` | `concentration_mgPerL / (M_gPerMol × 1000)` |

**Field cụ thể:**

| Field | Đơn vị | Ghi chú |
| --- | --- | --- |
| `WaterSample.volumeMl` | mL | Thể tích mẫu gốc |
| `WaterSample.nominalFe_mgPerL` | mg/L | Nồng độ Fe trong mẫu |
| `WaterSample.precursorMass.fecl3_6h2o_mg` | mg | Khối lượng muối thêm vào |
| `WaterStream.volumeMl` | mL | Thể tích stream (filtrate hoặc sludge) |
| `WaterStream.dissolvedFe_mg` | mg | Khối lượng Fe hòa tan trong stream |
| `WaterStream.solidFe_mg` | mg | Khối lượng Fe rắn trong stream |
| `SolidInventory.precipitateByMetal_mol.Fe` | tổng mol | Tổng mol Fe kết tủa = `precipitated_Fe × V_L` |
| `SolidInventory.sludgeMassDry_mg.feoh3` | mg | Tổng khối lượng Fe(OH)₃ khô |
| `PHGuardSnapshot.pHModelMin/Max` | pH | Solver bisection domain |
| `Dose.amount_ml` | mL | Thể tích mỗi dose reagent |
| `Dose.cumulative_ml` | mL | Tổng tích lũy |

**Quy tắc kiểm tra tự động (gợi ý cho code review):**

- Mọi field có hậu tố `_mg` hoặc `_mol` **không** được dùng trong phép chia với `volumeMl` mà không nhân 1000.
- Mọi field có hậu tố `_mgPerL` hoặc `_molPerL` **không** được cộng trực tiếp vào field `_mg` / `_mol` mà không nhân `V_L`.
- Mọi hằng số khối lượng mol (`M_Fe = 55,845 g/mol`) phải đi kèm đơn vị; khi chuyển sang mg, nhân 1000.

## 5. Hành động và điều kiện trước

| Action | Điều kiện trước | Kết quả |
| --- | --- | --- |
| `configure_sample` | Chưa bắt đầu xử lý | Tạo mẫu ảo |
| `validate_dissolved_load` | Mẫu đã cấu hình | Kiểm tra capacity từng kim loại và tải cạnh tranh |
| `select_standard` | Mẫu hợp lệ | Khóa mục tiêu và giới hạn |
| `measure_initial` | Mẫu đã sẵn sàng | Ghi pH, Fe, Zn, Pb ban đầu |
| `select_reagent` | Reagent nằm trong bundle | Chọn hóa chất |
| `add_reagent` | Hóa chất và liều hợp lệ | Cập nhật thành phần, tăng revision |
| `mix` | Có addition chưa trộn | Tính lại trạng thái cân bằng |
| `wait_settle` | Đã trộn | Tạo trạng thái lắng theo mô hình |
| `filter` | Đã lắng | Tách bùn khỏi dòng nước |
| `measure_after_treatment` | Đã lọc hoặc công đoạn cho phép đo | Ghi nồng độ sau xử lý |
| `repeat_treatment` | Chưa đạt mục tiêu và còn giới hạn | Mở công đoạn tiếp theo |
| `complete_attempt` | Đã đo đủ và kiểm tra mass balance | Đóng lượt, tạo report snapshot |

Các hành động hóa học không hoàn tác. Chỉ cho phép sửa cấu hình mẫu trước khi bắt đầu
hoặc tạo lượt mới; lịch sử thao tác vẫn giữ nguyên để chấm quy trình.

### 5.1. Quy trình đặc trưng mẫu trước xử lý

Mẫu không được tự động điều chỉnh về pH mục tiêu trước phép đo ban đầu. Quy trình chuẩn:

```text
Tạo mẫu nước tổng hợp ảo (pick slider Fe/Zn/Pb + volume)
→ Tính khối lượng muối precursor cần thêm (mục 5.1.2)
→ Cho muối tan vào V mL nước, khuấy đồng nhất
→ Tính pH sau khi pha từ composition (mục 6.1.2) — pH là output, không phải input
→ Ghi nhận kết tủa tự phát nếu có (khi vượt capacity tại pH vừa tính)
→ Chia aliquot: một phần để đặc trưng ban đầu, phần còn lại giữ nguyên để xử lý
→ Đo pH và Fe/Pb/Zn trước xử lý (verify với giá trị tính được)
→ So sánh với Cột A (Pre-treatment Assessment) — xem mục 5.1.1
  ├─ Tất cả thông số ✓ Đạt → KHÓA workflow, hiển thị "Mẫu đã đạt Cột A — không cần xử lý"
  → User chỉ có thể: (a) chỉnh lại slider thành phần mẫu (Fe/Zn/Pb + volume), hoặc (b) đóng lượt với success
  └─ Có ít nhất một ✗ Vượt → tiếp tục workflow
→ Chọn phương pháp xử lý (mục 7.4 định nghĩa chi tiết cho hydroxide route)
→ Xử lý, lắng và lọc (mục 7.4.3, 7.4.4, 7.4.5 — sử dụng mô hình kết tủa mục 6.5)
→ Đo pH và Fe/Pb/Zn sau xử lý (mục 7.4.6)
→ So sánh với target và tính hiệu suất loại bỏ (mục 7.4.7 — Post-treatment Assessment)
```

Nếu mẫu có kết tủa ngay khi hình thành, không được lọc bỏ toàn bộ trước khi xử lý. Việc
lọc một phần làm mẫu ban đầu được phép để phân tích, nhưng phần xử lý phải giữ đúng trạng
thái nghiên cứu; nếu không, quá trình lọc sẽ bị tính nhầm hoặc bỏ sót như một công đoạn xử lý.

#### 5.1.1. Đánh giá mẫu trước xử lý (Pre-treatment Assessment)

Sau bước "Đo pH và Fe/Pb/Zn trước xử lý", simulator tự động so sánh từng thông số với
giới hạn Cột A của QCVN 40:2025/BTNMT (mục 2.2) và hiển thị bảng đánh giá.

**Nguồn giá trị pH trong bảng:**

- pH lấy từ **kết quả tính toán mục 6.1.2** (pH sau khi pha muối vào nước), có thể
  được verify lại bằng "đo" (bước 5.1 ngay trên). Hai giá trị phải nằm trong sai số
  cho phép (mặc định ± 0,1 đơn vị pH).
- Nếu `|pH_calculated - pH_measured| > 0,1`: ghi event `ph_measurement_mismatch` và
  dùng pH_measured làm giá trị chính thức (đo là ground truth).
- Fe, Zn, Pb lấy từ measurement (ground truth) vì có thể đã bị kết tủa một phần
  trước khi đo.

**Bảng Pre-treatment Assessment (4 dòng, pH + 3 kim loại):**

| Thông số | Giá trị đo | Giới hạn Cột A | Trạng thái | Tỉ lệ vượt |
| --- | --- | --- | --- | --- |
| pH | (giá trị đo được) | 6 – 9 | ✓ Đạt / ✗ Vượt | (n/a nếu đạt; nếu vượt: so với cận gần nhất) |
| Fe | (giá trị đo được) mg/L | ≤ 2,0 mg/L | ✓ Đạt / ✗ Vượt | n× |
| Zn | (giá trị đo được) mg/L | ≤ 1,0 mg/L | ✓ Đạt / ✗ Vượt | n× |
| Pb | (giá trị đo được) mg/L | ≤ 0,1 mg/L | ✓ Đạt / ✗ Vượt | n× |

**Quy tắc tỉ lệ vượt:**

- pH: nếu pH < 6 thì vượt cận dưới → tỉ lệ = 6/pH; nếu pH > 9 thì vượt cận trên → tỉ lệ = pH/9.
- Kim loại: tỉ lệ = giá trị đo / giới hạn Cột A.
- Ví dụ: Fe = 8,2 mg/L → 8,2/2,0 = 4,1×.
- Hiển thị 1 chữ số thập phân (4,1×, 1,5×, …). Nếu vượt ≥ 10× thì hiển thị ≥ 10× (không tính chính xác hơn).

**Quyết định workflow sau Pre-treatment Assessment:**

```text
all_pass = (pH ✓) AND (Fe ✓) AND (Zn ✓) AND (Pb ✓)

if all_pass:
  → workflowState = 'pre-treatment-ok'
  → KHÓA: không cho thêm reagent, mix, settle, filter, đo lại
  → Hiển thị thông báo:
    "Mẫu đạt tất cả ngưỡng mô phỏng Cột A (đã xác minh pháp lý với Thông tư 06/2025/TT-BTNMT) — không cần xử lý.
     **Lưu ý:** ngưỡng này đã xác minh pháp lý với bản chính thức
     QCVN 40:2025/BTNMT (P0-A đã đóng 16/10/2026, xem §16.1 và evidence register §5.1).
     Kết quả 'đạt' ở đây có nghĩa là đạt mục tiêu mô phỏng MVP khớp với giới hạn Cột A,
     không phải chứng nhận pháp lý ngoài thực tế.
     Bạn có thể:
     (a) Chỉnh lại slider thành phần mẫu (Fe/Zn/Pb + volume) để tạo mẫu cần xử lý.
     (b) Đóng lượt với trạng thái phù hợp (xem bên dưới)."
  → calculatedOutcome = 'success'
  → Phân biệt rõ pre-treatment vs post-treatment (xem 'Quy tắc UI bắt buộc' dưới):
     - 'success' ở pre-treatment nghĩa là "mẫu đã đạt mục tiêu mô phỏng MVP ngay từ
       đầu, không qua xử lý" — KHÔNG đồng nghĩa với "xử lý thành công".
     - 'success' ở post-treatment (§7.4.7) là kết quả của quá trình xử lý thực sự.
  → Áp dụng two-layer design (§4.1):
     - Nếu P0-A chưa đóng: goalStatus = 'unknown', unknownReasonCodes = ['P0-A']
     - Nếu P0-A đã đóng: goalStatus = 'success'
  → Hai nút hành động:
    [Chỉnh lại mẫu] → quay về màn hình cấu hình mẫu, giữ nguyên attemptId
    [Đóng lượt]     → complete_attempt với goalStatus đã xác định ở trên
else:
  → workflowState = 'pre-treatment-fail'
  → Tiếp tục "Chọn phương pháp xử lý" như bình thường
```

**Quy tắc UI bắt buộc khi hiển thị `goalStatus = 'success'` ở pre-treatment:**

- Tiêu đề: **"Mẫu đạt mục tiêu mô phỏng MVP (Cột A placeholder)"** — không dùng
  "đạt QCVN" hay "đạt chuẩn".
- Phụ đề: **"Đây là mẫu đầu vào đã nằm trong ngưỡng mô phỏng ngay từ đầu, chưa qua
  xử lý. Chưa phải chứng nhận pháp lý."**
- Khi `goalStatus = 'unknown'` (P0-A còn mở): thêm dòng "chưa xác minh pháp lý —
  chờ P0-A đóng". Khi P0-A đã đóng nhưng vẫn ở pre-treatment: hiển thị "đã xác minh
  ngưỡng mô phỏng, nhưng mẫu chưa qua xử lý thực tế".
- Tương tự cho `'fail'` ở pre-treatment (nếu xảy ra): dùng "vượt mục tiêu mô phỏng",
  không dùng "không đạt QCVN".

**Lý do khóa workflow khi đạt:**

- Mục tiêu giáo dục là luyện tập quy trình xử lý nước ô nhiễm. Mẫu đã đạt Cột A không
  có gì để xử lý, tiếp tục sẽ lãng phí reagent và làm sai bản chất bài học.
- Buộc user chỉnh lại mẫu đảm bảo mỗi lượt đều có "vấn đề" cần giải quyết.
- Ngoại lệ: user vẫn có thể đóng lượt với success để ghi nhận "mẫu này đạt rồi".

**Validation khi chỉnh lại mẫu:**

- Chỉ slider Fe/Zn/Pb + volume được phép chỉnh; **không có control pH trực tiếp** trong
  màn hình cấu hình mẫu (xem §2.1 — pH là hệ quả của composition, không phải input).
- Sau khi chỉnh slider, simulator phải chạy lại Pre-treatment Assessment với giá trị mới.
  pH cũng được tính lại theo §6.1.2 với composition mới.
- Nếu vẫn đạt → tiếp tục khóa. Nếu có ít nhất một ✗ → mở khóa workflow.
- Tăng `compositionRevision` và `measurementRevision` mỗi lần chỉnh.
- Ghi event `pre_treatment_assessment_updated` với state trước/sau.

**Lưu ý về tỉ lệ vượt:**

- Tỉ lệ vượt chỉ là chỉ số giáo dục, không phải capacity hòa tan (mục 3.1).
- pH vượt cận dưới (pH < 6) cũng tính "vượt" dù chiều tăng/giảm pH để xử lý khác nhau.
- Khi vượt nhiều thông số cùng lúc, hiển thị thông số vượt nhiều nhất làm headline.

#### 5.1.2. Tính khối lượng muối precursor

Sau khi user pick slider Fe/Zn/Pb + volume (mục 2.1, 3.2), simulator tính khối lượng
muối precursor cần thêm vào V mL nước để đạt nồng độ mục tiêu.

**Công thức khối lượng muối:**

```text
m_salt(metal) = C_metal (mg/L) × V (L) / (M_metal / M_salt) × 1000
              = C_metal (mg/L) × V (L) × M_salt / M_metal / 1000  × 1000
              = C_metal × V × M_salt / M_metal            (đơn vị: mg)
```

Trong đó:

- `C_metal`: nồng độ mục tiêu của ion kim loại (mg/L)
- `V`: thể tích mẫu (L)
- `M_metal`: khối lượng mol của ion kim loại (g/mol) — Fe=55,845; Zn=65,38; Pb=207,2
- `M_salt`: khối lượng mol của muối precursor ngậm nước (g/mol)
  - FeCl₃·6H₂O: 270,295
  - ZnSO₄·7H₂O: 287,53
  - Pb(NO₃)₂: 331,2

**Ví dụ (V = 1,000 mL, Fe = 10 mg/L, Zn = 5 mg/L, Pb = 0,3 mg/L):**

| Kim loại | C (mg/L) | V (L) | M_metal | M_salt | m_salt (mg) |
| --- | ---: | ---: | ---: | ---: | ---: |
| Fe | 10 | 1,0 | 55,845 | 270,295 | 48,4 |
| Zn | 5 | 1,0 | 65,38 | 287,53 | 22,0 |
| Pb | 0,3 | 1,0 | 207,2 | 331,2 | 0,48 |

Tổng khối lượng muối thêm vào: ~70,9 mg (không đáng kể so với 1L nước, nên bỏ qua
qua ảnh hưởng thể tích khi tính nồng độ).

**Nồng độ mol của từng ion trong dung dịch (input cho mục 6.1.2):**

| Ion | Công thức | Đơn vị |
| --- | --- | --- |
| Fe³⁺ | C_Fe / M_Fe / 1000 × 1000 = C_Fe / 55,845 | mmol/L |
| Zn²⁺ | C_Zn / 65,38 | mmol/L |
| Pb²⁺ | C_Pb / 207,2 | mmol/L |
| Cl⁻ | 3 × [Fe³⁺] | mmol/L |
| SO₄²⁻ | [Zn²⁺] | mmol/L |
| NO₃⁻ | 2 × [Pb²⁺] | mmol/L |

**Không cho phép:**

- Pick nồng độ âm hoặc vượt slider cap (mục 3.2).
- Tổng khối lượng muối > 5% khối lượng nước (giả định thể tích ≈ V nước): nếu vượt,
  cảnh báo nhưng vẫn cho chạy (mô hình vẫn ổn, chỉ giáo dục).
- Muối khác ngoài FeCl₃·6H₂O, ZnSO₄·7H₂O, Pb(NO₃)₂ (chỉ 3 muối này được bật
  trong MVP, mục 3.2.3).

### 5.2. Kiểm soát acid/base

Hóa chất acid/base chỉ được thêm qua controller có giới hạn. Controller phải kiểm tra
trước khi commit:

```text
predictedPH = solveAcidBaseEquilibrium(state, reagent, dose)
```

Action bị từ chối nếu:

- `predictedPH` thấp hơn `pHGuardMin` (**2,0**) hoặc cao hơn `pHGuardMax` (**13,0**).
- Liều làm mẫu đi qua vùng pH mục tiêu với bước nhảy vượt tolerance cho phép.
- Stock concentration, dose hoặc tổng liều vượt bundle đã khóa tại mục 5.2.1.
- Thêm acid/base làm species hoặc capacity của Fe, Zn, Pb chuyển sang trạng thái không xác định.

Mỗi reagent phải khai báo đầy đủ `reagentId`, công thức, stock concentration, dose unit,
maximum single dose, maximum cumulative dose, pH guard range và source reference — giá trị
khóa tại mục 5.2.1. Không cho UI đặt pH trực tiếp bằng cách gán một con số; mọi thay đổi pH
phải xuất phát từ lượng hóa chất được thêm và cân bằng acid-base của mẫu.

Trạng thái acid/base phải được kiểm tra cả trước và sau khi tạo kết tủa. Mẫu không được
coi là hợp lệ nếu pH đạt tạm thời nhưng sau khi trộn hoặc cân bằng lại vượt miền cho phép.

#### 5.2.1. Bộ HCl/NaOH ảo (reagent bundle MVP)

Hai reagent được phép trong MVP, cùng stock **1,0 mol/L** để liều tính theo mL tỉ lệ thuận
với mmol OH⁻/H⁺ cần thêm. Aliquot và cumulative lấy theo pattern bài acid-neutralization
(mục 3.2 của spec đó) để giữ thao tác quen thuộc giữa hai scenario.

| `reagentId` | Công thức | Stock (mol/L) | Đơn vị liều | Max single dose (mL) | Max cumulative (mL) | pH guard range | Source reference |
| --- | --- | ---: | --- | ---: | ---: | --- | --- |
| `naoh_1m` | NaOH | 1,0 | mL | 5,00 | 10,00 | [2,0; 13,0] | mục 2.4, mục 6.5.5 |
| `hcl_1m` | HCl | 1,0 | mL | 5,00 | 10,00 | [2,0; 13,0] | mục 2.4 (đối xứng NaOH) |

- **Aliquot rời rạc** (5 giá trị, copy từ acid-neutralization): `{0,05; 0,10; 0,50; 1,00; 5,00} mL`.
  Controller chỉ chấp nhận liều nằm trong tập này; không cho nhập số thực tùy ý.
- **Max single dose** = 5,00 mL (= phần tử lớn nhất của aliquot set).
- **Max cumulative dose** = 10,00 mL cho mỗi reagent trong suốt một attempt, đếm riêng
  cho HCl và NaOH. Cap này là giới hạn vận hành (operational cap), **không phải** kết quả
  của mô hình pH/precipitation — số liệu OH⁻ cần thiết phải được tính bởi solver §6.6 với
  composition thực tế. Nếu solver trả về `OH_total_needed > 10 mmol/L`, pH guard cảnh
  báo nhưng vẫn cho phép thêm đến khi chạm cap; nếu chạm cap trước khi pH đạt target,
  attempt bị đánh dấu `DOSE_LIMIT_EXCEEDED` và gọi
  `finalizeOutcome('invalid', openBlockers)` để set `goalStatus = 'invalid'`. pH guard sẽ
  reject liều tiếp theo với `DOSE_LIMIT_EXCEEDED` nếu tổng vượt cap.
- **pH guard range** `[2,0; 13,0]`: nằm trong solver bounds `pH ∈ [0; 14]` của mục 6.1.1
  và chừa khoảng an toàn để user quan sát hiện tượng vượt biên trước khi model mất
  hiệu lực (xem cảnh báo amphoteric tại mục 6.5.6). Ngoài khoảng này, action bị từ
  chối với `PH_GUARD_EXCEEDED`.
- **Giả định thể tích mẫu**: bundle trên khóa cho V = 1.000 mL benchmark (mục 2.1). Khi
  V chạy trong miền 500–2.000 mL, controller vẫn dùng cùng aliquot set; pH guard tự
  siết vì pH sau addition được dự đoán theo V hiện tại (mục 6.1.1).

#### 5.2.2. Correction HCl

HCl được dùng để kéo pH về khi vượt QCVN trần 9,0. Correction mở khi một trong hai
điều kiện xảy ra:

- pH đo được sau mix ổn định `> 9,0` (QCVN 40:2025/BTNMT Cột A, mục 2.2); hoặc
- pH dự đoán từ NaOH aliquot tiếp theo `> 9,0` (pH guard reject trước, mục 5.2).

Cùng bundle `hcl_1m` 1,0 M, cùng aliquot set, cùng cumulative cap 10 mL như mục 5.2.1.
Correction HCl và NaOH cộng dồn vào **hai cumulative riêng biệt**, không gộp.

#### 5.2.3. QCVN target band (informational, không chặn)

pH 6,0 – 9,0 là dải mục tiêu mô phỏng Cột A (mục 2.2 — **đã xác minh pháp lý** với
Thông tư 06/2025/TT-BTNMT, xem §16.1 P0-A và evidence register §5.1). Controller không reject khi pH rời khỏi
dải này; thay vào đó:

- `qcvnCompliant` là **derived view**, không phải field trong `WaterTreatmentState`.
  Logic cũ (chỉ xét pH) đã bị loại bỏ. Thay bằng `assessCompliance` (§4.1):
  `'pass' | 'fail' | 'unknown'` dựa trên tất cả 4 thông số (pH, Fe, Zn, Pb),
  mass balance và sludge separation. Xem chi tiết tại §4.1.
- measurement event tương ứng được gắn reason code `PH_OUTSIDE_QCVN_BAND` để
  downstream (UI, báo cáo) lọc ra; controller vẫn commit, không rollback;
- UI hiển thị cảnh báo "ngoài dải mục tiêu mô phỏng Cột A" nhưng vẫn cho phép tiếp
  tục attempt (mục 13). Tránh dùng ngắn gọn "ngoài QCVN" vì có thể bị hiểu nhầm là
  ngoài chuẩn pháp lý đã xác minh.

Mục tiêu giáo dục: "đạt mục tiêu mô phỏng Cột A" ≠ "đạt model". pH ngoài dải mục tiêu
mô phỏng nhưng vẫn trong pH guard là kết quả hợp lệ về mặt mô hình — user học được sự
khác biệt giữa tuân thủ mục tiêu mô phỏng và tính đúng của solver.

### 5.3. Log sự kiện bắt buộc

Mỗi action được chấp nhận hoặc bị từ chối phải có event log. Event đã ghi không được sửa
hoặc xóa; điều chỉnh được biểu diễn bằng event mới.

```ts
type WaterTreatmentEvent = {
  eventId: string
  attemptId: string
  sequence: number
  eventType: string
  timestamp: string
  actor: 'learner' | 'system'
  compositionRevision: number
  engineVersion: string
  modelBundleVersion: string
  input: unknown
  stateBefore: unknown
  stateAfter: unknown
  calculationTraceId: string | null
  validationStatus: 'valid' | 'rejected' | 'unresolved'
  errorCodes: string[]
}
```

Tối thiểu phải có các event `sample_created`, `initial_measurement`, `reagent_added`,
`mix_completed`, `equilibrium_calculated`, `settling_completed`, `filtration_completed`,
`measurement_recorded`, `treatment_repeated`, `validation_failed` và `attempt_completed`.

## 6. Mô hình hóa học

### 6.1. Lớp tối thiểu cho MVP

MVP cần mô hình được các đại lượng sau:

- Cân bằng acid-base của nước.
- Phần kim loại hòa tan và phần chuyển sang pha rắn.
- Ảnh hưởng của pH đến từng kim loại.
- Capacity hòa tan của từng kim loại trong điều kiện mẫu hiện tại.
- Ảnh hưởng cạnh tranh giữa Fe, Zn, Pb và các ligand/ion đã được bật trong bundle.
- Thể tích và độ pha loãng sau mỗi lần thêm.
- Lượng kết tủa tạo ra và lượng bùn sau lọc.

Không được dùng quy tắc đơn giản “pH cao là tất cả kim loại biến mất”. Mỗi kim loại phải
có species bundle, hằng số và giới hạn áp dụng riêng.

Trước khi viết solver, cần có tài liệu định lượng riêng cho từng kim loại: dạng hóa học,
trạng thái oxy hóa, phản ứng thủy phân, pha rắn tham chiếu, hằng số cân bằng, ligand được
xét, miền pH áp dụng và cách xử lý kim loại lưỡng tính. MVP phải nói rõ đây là mô hình cân
bằng; `wait_settle` là bước quy trình giáo dục, không phải mô phỏng động học lắng.

Mô hình kết tủa hydroxide chi tiết (công thức capacity, Ksp, bảng theo pH, trade-off) nằm
ở **mục 6.5**. Mô hình pH cho HCl/NaOH addition nằm ở **mục 6.1.1**. Mô hình pH cho
mẫu ban đầu (sau khi pha muối) nằm ở **mục 6.1.2**.

#### 6.1.1. Mô hình pH (acid-base equilibrium)

pH là biến trạng thái quan trọng nhất của mô hình. Mục này khóa mô hình pH tối thiểu cho
MVP. Các mô hình mở rộng (nhiều acid/base, complexant, ligand) để phase sau.

**Phạm vi áp dụng:**

- Chạy khi: (a) sau khi thêm acid/base, (b) sau khi trộn, (c) sau khi kết tủa hydroxide
  ảnh hưởng pH, (d) sau khi lọc (nếu filtrate có pH thay đổi do tách CO₂).
- **Không chạy** cho pH ban đầu của mẫu (mục 6.1.2) — pH đó đã được tính bằng mô hình
  riêng khi user pick slider Fe/Zn/Pb + volume, coi là kết quả của quá trình tạo mẫu
  đã ổn định.

**Input của mô hình:**

| Đại lượng | Ký hiệu | Nguồn |
| --- | --- | --- |
| Tổng acid mạnh đã thêm | C_HCl (mol/L) | Từ reagent HCl ảo, cộng dồn |
| Tổng base mạnh đã thêm | C_NaOH (mol/L) | Từ reagent NaOH ảo, cộng dồn |
| Tổng carbonate ban đầu | C_TIC (mol/L) | Mặc định 0 cho closed model; có thể bật sau |
| Nhiệt độ | T (°C) | Khóa 25,0 °C cho MVP |
| Thể tích | V (L) | State hiện tại |

**Output của mô hình:**

| Đại lượng | Ký hiệu | |
| --- | --- | --- |
| pH | pH | |
| Nồng độ H⁺ tự do | [H⁺] (mol/L) | |
| Nồng độ OH⁻ tự do | [OH⁻] (mol/L) | |
| (nếu có TIC) Nồng độ HCO₃⁻, CO₃²⁻, H₂CO₃ | [HCO₃⁻], [CO₃²⁻], [H₂CO₃] | |

**Công thức tối thiểu cho MVP (closed carbonate model, mặc định):**

```text
1. pH definition:        pH = -log₁₀([H⁺])
2. Water autoionization: [H⁺] × [OH⁻] = Kw(T)
3. Charge balance:       [H⁺] + [Na⁺] = [OH⁻] + [Cl⁻]
   (trong trường hợp chỉ có HCl + NaOH; thêm số hạng carbonate nếu bật TIC)
4. Kw(25°C) = 10^(-13,990)  ← claim AN-KW-25C, source IAPWS-KW-2024
```

**Hằng số sử dụng (claim mapping):**

| Hằng số | Giá trị | Claim key | Source key |
| --- | --- | --- | --- |
| pKw (25°C) | 13,990 | `AN-KW-25C` | `IAPWS-KW-2024` |
| pKa1 (carbonic acid) | 6,352 | `AN-CARBONATE-CONSTANTS` | `USGS-PHREEQC-1995` |
| pKa2 (carbonic acid) | 10,329 | `AN-CARBONATE-CONSTANTS` | `USGS-PHREEQC-1995` |

**Solver convention:**

- Charge balance là phương trình chính; tìm `[H⁺]` bằng phương pháp bisection trên
  pH ∈ [0, 14] (giống mục 6.1.2 và khớp miền hóa học thực tế; 1 M HCl/NaOH không thể
  đẩy pH ngoài khoảng này).
- Nếu `[H⁺]` âm hoặc không hội tụ sau N bước → trả về `status: 'unresolved'`, action
  bị từ chối với `PH_MODEL_UNRESOLVED`.

**Trạng thái model:**

```ts
type PHModelResult = {
  status: 'valid' | 'unresolved'
  pH: number | null
  h_plus: number | null  // [H⁺] mol/L
  oh_minus: number | null  // [OH⁻] mol/L
  hco3_minus: number | null  // null nếu closed model
  co3_2minus: number | null  // null nếu closed model
  solverIterations: number
  speciesBundleVersion: string
}
```

**Closed carbonate (mặc định MVP):**

- Không có CO₂ exchange với khí quyển (mục 3.1 evidence register, claim `AN-CLOSED-CARBON`).
- Tổng carbonate (TIC) = const trong suốt attempt.
- Nếu TIC = 0: mô hình chỉ gồm HCl + NaOH + nước, không có buffer carbonate.
- Nếu TIC > 0: thêm phương trình Ka1, Ka2 cho carbonic acid; pH có buffer ở vùng
  pKa1 (≈ 6,35) và pKa2 (≈ 10,33).

**Lưu ý quan trọng:**

- pH ban đầu (mục 2.1) **không phải** input trực tiếp từ user. Mô hình pH (mục 6.1.1)
  này **không dùng** để tính pH ban đầu — pH đó do mục 6.1.2 (mô hình cho mẫu sau khi
  pha muối) tính.
- Mô hình pH **chỉ** dùng để dự đoán pH sau khi có thay đổi thành phần (thêm reagent,
  trộn, kết tủa).
- pH guard (mục 5.2) dùng mô hình pH để dự đoán trước khi commit reagent. Nếu mô hình
  pH trả về `unresolved`, action bị từ chối với `PH_MODEL_UNRESOLVED`.
- Capacity hòa tan từng kim loại (mục 3.1, 6.4) là hàm của pH. Nếu pH model `unresolved`,
  capacity cũng `unresolved` → `SOLUBILITY_UNRESOLVED`.

**Không hỗ trợ trong MVP:**

- CO₂ exchange với khí quyển (open system).
- Nhiều acid/base phức tạp (H₂SO₄, HNO₃, Ca(OH)₂, Na₂CO₃, …) — chỉ HCl + NaOH.
- Nhiều ligand/ion cạnh tranh ngoài Cl⁻ và Na⁺.
- Buffer phosphate, borate, acetate.
- Ảnh hưởng ionic strength lên Ka (chỉ dùng Ka ở infinite dilution).
- Temperature dependence ngoài 25°C.

Các mục trên sẽ được mở rộng ở phase 2+ khi có thêm hằng số và nguồn evidence.

#### 6.1.2. Mô hình pH cho mẫu ban đầu (sau khi pha muối)

pH ban đầu **không phải user input** (mục 2.1). Mục này định nghĩa cách simulator tính
pH từ composition khi user pick slider Fe/Zn/Pb + volume. Đây là "tính toán sẵn" theo
yêu cầu: pH phải được xác định trước khi user quyết định xử lý.

> ⚠️ **Giới hạn mô hình:** solver dùng hydrolysis bậc 1 cho Fe³⁺ (1 bước) và bỏ qua
> hydrolysis cho Zn²⁺/Pb²⁺. Ở pH thấp, Fe³⁺ có thêm các bước hydrolysis bậc 2/3 và
> các phức chloro (FeCl²⁺, FeCl₂⁺) — tất cả bị bỏ qua trong MVP. Vì vậy pH tính được
> chỉ mang tính gần đúng; sai số so với thực nghiệm có thể lên tới 0,3–0,5 đơn vị pH.
> Spec không khóa con số pH initial nào; PHREEQC cross-check là bắt buộc trước khi
> đưa vào golden cases (xem §6.6 mở đầu).

**Phạm vi áp dụng:**

- Chạy **một lần** ngay sau khi user pick slider + volume, trước cả bước "đo" trong
  mục 5.1. Kết quả pH sẽ được lưu vào state là `initialPH`.
- Khác với mục 6.1.1 (chạy khi thêm acid/base), mục 6.1.2 chạy khi **phá vỡ** trạng
  thái nước ban đầu bằng cách thêm muối.

**Input (từ mục 5.1.2):**

| Đại lượng | Ký hiệu | Đơn vị |
| --- | --- | --- |
| Nồng độ Fe³⁺ | C_Fe | mol/L |
| Nồng độ Zn²⁺ | C_Zn | mol/L |
| Nồng độ Pb²⁺ | C_Pb | mol/L |
| Nồng độ Cl⁻ | C_Cl = 3 × C_Fe | mol/L |
| Nồng độ SO₄²⁻ | C_SO4 = C_Zn | mol/L |
| Nồng độ NO₃⁻ | C_NO3 = 2 × C_Pb | mol/L |
| Tổng carbonate | C_TIC = 0 (closed model) | mol/L |
| Nhiệt độ | T = 25,0 | °C |
| Thể tích | V (không ảnh hưởng pH nếu coi nước nguyên chất) | L |

**Output:**

| Đại lượng | Ký hiệu | |
| --- | --- | --- |
| pH | pH | |
| Nồng độ H⁺ | [H⁺] | mol/L |
| Nồng độ OH⁻ | [OH⁻] | mol/L |
| Nồng độ kim loại hòa tan còn lại (sau kết tủa tự phát) | [M]_dissolved | mol/L |

**Công thức (cation hydrolysis + sulfate protonation model, MVP):**

Mô hình dùng **nồng độ thay cho hoạt độ** (γ = 1, mô hình lý tưởng theo IUPAC S05742).
Solver lặp để hội tụ đồng thời pH, species, kết tủa và mass balance — xem §6.6.

**Bước 1 — Khai báo species hòa tan (species bundle):**

| Species | Nguồn gốc | Phản ứng tạo thành | Charge |
| --- | --- | --- | ---: |
| H⁺ | nước | H₂O ⇌ H⁺ + OH⁻ | +1 |
| OH⁻ | nước | H₂O ⇌ H⁺ + OH⁻ | -1 |
| Fe³⁺ (free) | FeCl₃ | FeCl₃ → Fe³⁺ + 3 Cl⁻ | +3 |
| FeOH²⁺ | thủy phân Fe³⁺ | Fe³⁺ + H₂O ⇌ FeOH²⁺ + H⁺ | +2 |
| Zn²⁺ (free) | ZnSO₄ | ZnSO₄ → Zn²⁺ + SO₄²⁻ | +2 |
| Pb²⁺ (free) | Pb(NO₃)₂ | Pb(NO₃)₂ → Pb²⁺ + 2 NO₃⁻ | +2 |
| Cl⁻ | FeCl₃ | (cation đi kèm) | -1 |
| SO₄²⁻ | ZnSO₄ | (cation đi kèm) | -2 |
| HSO₄⁻ | proton hóa SO₄²⁻ | SO₄²⁻ + H⁺ ⇌ HSO₄⁻ | -1 |
| NO₃⁻ | Pb(NO₃)₂ | (cation đi kèm) | -1 |
| Na⁺ | NaOH (nếu thêm) | NaOH → Na⁺ + OH⁻ | +1 |

**Bước 2 — Charge balance dùng FREE species × charge thực (KHÔNG nhân tổng kim loại
với điện tích ion gốc):**

```text
[H⁺] + 3×[Fe³⁺]_free + 2×[FeOH²⁺] + 2×[Zn²⁺]_free + 2×[Pb²⁺]_free + [Na⁺]
  = [OH⁻] + [Cl⁻] + 2×[SO₄²⁻] + [HSO₄⁻] + [NO₃⁻]
```

**Lưu ý quan trọng:** Nếu Fe³⁺ thủy phân thành FeOH²⁺ thì phần điện tích dương do Fe
đóng góp là `3[Fe³⁺] + 2[FeOH²⁺]`, **không phải** `3 × T_Fe` (vì FeOH²⁺ chỉ mang +2).
Tương tự sulfate: phần điện tích âm do S đóng góp là `2[SO₄²⁻] + [HSO₄⁻]`, không
phải `2 × T_S`.

**Bước 3 — Mass balance mỗi nguyên tố:**

```text
T_Fe  = [Fe³⁺]_free + [FeOH²⁺]   (chỉ có 1 hydroxo trong MVP)
T_Zn  = [Zn²⁺]_free               (hydroxo bậc 1 yếu, β₁ = 10⁻⁹, bỏ qua)
T_Pb  = [Pb²⁺]_free               (hydroxo bậc 1 yếu vừa, β₁ = 10⁻⁷·⁷, bỏ qua trong MVP)
T_Cl  = [Cl⁻]                     (= 3 × C_Fe từ input)
T_S   = [SO₄²⁻] + [HSO₄⁻]         (= C_Zn từ input; sulfate proton hóa ở pH thấp)
T_N   = [NO₃⁻]                    (= 2 × C_Pb từ input)
T_Na  = [Na⁺]                     (= 0 nếu chưa thêm NaOH)
```

> **Định nghĩa nguyên tố đầu vào (S / N / Na) — bắt buộc rõ trong spec và UI:**
>
> | Ký hiệu | Đại diện cho | Không bao gồm |
> | --- | --- | --- |
> | `T_S` | **Sulfate hòa tan** = `[SO₄²⁻] + [HSO₄⁻]` | Không bao gồm tổng lưu huỳnh (S⁰, sulfide, hợp chất hữu cơ chứa S) |
> | `T_N` | **Nitrate hòa tan** = `[NO₃⁻]` (= `2 × C_Pb` từ Pb(NO₃)₂) | Không bao gồm nitrite, amonia, tổng nitơ (TN), nitơ hữu cơ |
> | `T_Na` | **Natri hòa tan** = `[Na⁺]` (= tổng Na từ NaOH đã thêm; MVP chưa có nguồn Na khác) | Không bao gồm natri trong kết tủa hay hợp chất rắn |
>
> Lý do phải rõ: EPA reference MDL (Method 300.0) ghi `NO₃⁻-N` (= nitơ trong nitrate,
> đơn vị mg N/L), không phải `NO₃⁻` (đơn vị mg NO₃⁻/L). Quy đổi: `mg NO₃⁻/L = mg N/L × 62/14`.
> Tương tự S: khi so với giới hạn sulfate công nghiệp, dùng mg SO₄²⁻/L; khi so với tổng
> lưu huỳnh, dùng mg S/L (= mg SO₄²⁻/L × 32/96). UI phải hiển thị đúng đơn vị và loại
> nguyên tố đang đề cập; spec này dùng quy ước sulfate (mg/L) và nitrate-N (mg N/L)
> cho đầu vào solver. Na là mg Na⁺/L.

**Bước 4 — Cân bằng thủy phân & proton hóa:**

```text
Kw       = [H⁺] × [OH⁻]                  = 10^(-13,990)        (claim AN-KW-25C, IAPWS R11-24)
K_FeOH   = [FeOH²⁺] × [H⁺] / [Fe³⁺]      = 10^(-2,19)          (claim WT-CHEM-K-FeOH, phreeqc.dat)
K_SO4    = [SO₄²⁻] × [H⁺] / [HSO₄⁻]      = 10^(-1,99)          (H₂SO₄ second dissociation; claim WT-CHEM-H2SO4-dissociation;
                                                                  pKa₂ tương ứng = +1,99 (WT-CHEM-pKa2-H2SO4), MINTEQ v4 D5)
```

Các hằng số thủy phân của Zn(OH)⁺ (log β₁ = -9,0) và Pb(OH)⁺ (log β₁ = -7,7) bị bỏ qua
trong solver pH §6.1.2 vì đóng góp < 0,01% ở pH ≤ 9. Hệ quả được kiểm tra trong §6.6.4.

**Bước 5 — Solve bằng bisection trên pH:**

- Bisection `pH ∈ [0; 14]` (§6.4).
- Tại mỗi pH guess: tính `[OH⁻] = Kw/[H⁺]`, suy ra `[Fe³⁺]_free`, `[FeOH²⁺]`, `[HSO₄⁻]`
  từ mass balance + equilibria, rồi đánh giá charge balance. Bisection hội tụ khi
  `|Σ(c_i × z_i)| < 10⁻⁹ mol/L`.
- Tính pH = -log₁₀([H⁺]).

**Bước 6 — Spontaneous precipitation (kết tủa tự phát, có lặp):**

Sau khi có pH, kiểm tra từng kim loại với `C_{M^n+,free,sat}(pH)` (§6.5.1):

```text
for each metal M:
  if T_M > C_{M^n+,free,sat}(pH):
    # Fe dùng (1 + K_FeOH/[H⁺]); Zn/Pb dùng (1) vì hydroxo bỏ qua
    if M == 'Fe':
      T_M_precipitated = T_M − C_{Fe³⁺,free,sat}(pH) × (1 + K_FeOH / [H⁺])
    else:
      T_M_precipitated = T_M − C_{M^n+,free,sat}(pH)
    T_M = C_{M^n+,free,sat}(pH)
```

**Chú thích:** Công thức Fe dùng `K_FeOH/[H⁺]` chứ không phải `β₁[OH⁻]` (xem §6.5.1 — hai
cách viết tương đương nếu β₁ = K_FeOH/K_w, nhưng trong spec K_FeOH = 10^(-2,19) là hằng
số hydrolysis chứ không phải formation constant truyền thống).

**Quan trọng:** kết tủa hydroxide tiêu thụ OH⁻ (3 mol/Fe, 2 mol/Zn, 2 mol/Pb), làm
pH thay đổi. Vì vậy sau khi cập nhật mass balance, **quay lại Bước 1** với T_M mới và
giải lại pH. Lặp cho đến khi `|ΔpH| < 0,001` và `|ΔT_M| < 10⁻⁶ mol/L`. Xem §6.6 để
biết thuật toán đầy đủ và tiêu chí hội tụ.

**Hằng số sử dụng (claim mapping):**

| Hằng số | Giá trị | Claim key | Source key |
| --- | --- | --- | --- |
| pKw (25 °C) | 13,990 | `AN-KW-25C` | `IAPWS-KW-2024` |
| log K Fe(OH)²⁺ (Fe³⁺ + H₂O ⇌ FeOH²⁺ + H⁺) | −2,19 (giữ nguyên) | `WT-CHEM-K-FeOH` | `phreeqc.dat` PHREEQC 3.8.6-17100; SHA-256 `59373961d648dfbf68a40744060c1d64f57ecbec98f4f5fb89f3a1b4213ccd10` |
| log K Zn(OH)⁺ (Zn²⁺ + H₂O ⇌ ZnOH⁺ + H⁺) | bỏ qua trong MVP (β₁ yếu) | `WT-CHEM-K-ZnOH` (nộp khi dùng) | `phreeqc.dat` PHREEQC 3.8.6-17100 |
| log K Pb(OH)⁺ (Pb²⁺ + H₂O ⇌ PbOH⁺ + H⁺) | bỏ qua trong MVP (β₁ yếu) | `WT-CHEM-K-PbOH` (nộp khi dùng) | `phreeqc.dat` PHREEQC 3.8.6-17100 |
| Ksp Fe(OH)₃ (pha **Ferrihydrite**, D2) | 10⁻³⁸·⁷⁷⁹ | `WT-CHEM-Ksp-Fe` | `minteq.v4.dat` PHREEQC 3.8.6-17100; SHA-256 `a93914e63b0c616f8506cc92739188e50c5b9a15c33b111979652f308457f4ac` |
| Ksp Zn(OH)₂ (pha **Zn(OH)₂(am)**, D3) | 10⁻¹⁵·⁵⁰⁶ | `WT-CHEM-Ksp-Zn` | `minteq.v4.dat` PHREEQC 3.8.6-17100; cùng SHA-256 |
| Ksp Pb(OH)₂ (pha **Pb(OH)₂**, D1) | 10⁻¹⁹·⁸³⁰ | `WT-CHEM-Ksp-Pb` | `minteq.v4.dat` PHREEQC 3.8.6-17100 (primary, cùng SHA-256). `phreeqc.dat` cùng phase `Pb(OH)₂` với cùng `log_k 8.15` (alternative storage trong cùng bản phát hành PHREEQC) — **KHÔNG phải nguồn độc lập**, không dùng để xác nhận độc lập |
| pKa₂ (H₂SO₄) | **+1,99** (dương, MINTEQ v4 convention, D5) | `WT-CHEM-pKa2-H2SO4` | `minteq.v4.dat` PHREEQC 3.8.6-17100; cùng SHA-256 |
| log K dissociation (HSO₄⁻ ⇌ H⁺ + SO₄²⁻) | −1,99 (riêng, KHÔNG lưu vào field `pKa2`) | `WT-CHEM-H2SO4-dissociation` | `minteq.v4.dat` + `phreeqc.dat` PHREEQC 3.8.6-17100 |
| log K protonation (H⁺ + SO₄²⁻ ⇌ HSO₄⁻) | +1,99 (riêng) | `WT-CHEM-H2SO4-protonation` | `minteq.v4.dat` + `phreeqc.dat` PHREEQC 3.8.6-17100 |
| Solid phase assumption (D4) | Fe = `Ferrihydrite`; Zn = `Zn(OH)₂(am)`; Pb = `Pb(OH)₂` | `WT-CHEM-SOLID-PHASE` | Tổng hợp từ `minteq.v4.dat` (đã verify) |

**Trạng thái model:**

```ts
type InitialPHResult = {
  status: 'valid' | 'unresolved'
  initialPH: number | null
  h_plus: number | null
  oh_minus: number | null
  dissolved: {
    Fe: number | null  // mol/L, sau precipitation
    Zn: number | null
    Pb: number | null
  }
  precipitated: {
    Fe: number | null  // mol/L, do kết tủa tự phát
    Zn: number | null
    Pb: number | null
  }
  speciesBundleVersion: string
  solverIterations: number
}
```

**Trường hợp đặc biệt:**

- Nếu `T_Fe = T_Zn = T_Pb = 0`: pH = 7,00 (nước nguyên chất, closed system).
- Nếu một trong các kim loại = 0: gom charge balance cho 2 cation còn lại.
- Nếu cation hydrolysis dẫn đến pH < 1 hoặc pH > 13: trả về `unresolved`, mở khóa
  cho user chỉnh slider.

**Tích hợp với Pre-treatment Assessment (mục 5.1.1):**

- pH lưu trong state là `initialPH` (tính bởi mục 6.1.2 này).
- Metal concentrations lưu trong state là `dissolved` (sau precipitation).
- Bảng Pre-treatment Assessment lấy giá trị từ state này, không tính lại.

**Không hỗ trợ trong MVP (giống mục 6.1.1):**

- CO₂ exchange với khí quyển.
- Nhiều acid/base khác ngoài Cl⁻/SO₄²⁻/NO₃⁻ là gốc acid của muối.
- Nhiều ligand/ion cạnh tranh ngoài Cl⁻ và SO₄²⁻/NO₃⁻.
- Hydrolysis bậc 2, 3 cho Fe³⁺.
- Hydrolysis bậc 1 cho Zn²⁺, Pb²⁺ (gộp vào "bỏ qua" cho MVP, capacity Ksp xử lý chính).
- Ảnh hưởng ionic strength lên Ka, Ksp.
- Temperature dependence ngoài 25°C.

#### 6.1.3. `referenceBenchmark` schema — EPA reference MDL cho UI demo (P0-E deferred)

> **Bối cảnh (16/10/2026):** P0-E bị defer — dự án chưa chọn analytical method, chưa có
> dữ liệu validation nên chưa có LOD/LOQ/accuracy "của dự án". EPA Method 200.8 (kim
> loại) và Method 300.0 (anion) cung cấp **MDL tham chiếu** trong điều kiện nước thuốc
> thử; EPA cảnh báo MDL nền mẫu thực có thể khác. UI có thể hiển thị các con số này
> để user có cảm giác về ngưỡng phát hiện, **nhưng phải ghi rõ đây là tham chiếu EPA,
> không phải LOD/LOQ đã xác nhận cho dự án**.

**Schema (dùng cho UI demo, không tham gia solver):**

```ts
interface ReferenceBenchmark {
  analyte:
    | 'Fe'
    | 'Zn'
    | 'Pb'
    | 'Cl'
    | 'N_NO3'   // nitrate-N (mg N/L), không phải mg NO3-/L
    | 'S_SO4'   // sulfate (mg SO4²⁻/L), không phải mg S/L
    | 'Na';
  value: number;            // giá trị MDL tham chiếu (đơn vị như units dưới)
  units: string;            // vd 'mg/L', 'mg N/L', 'mg SO4²⁻/L'
  matrix: 'reagent-water';  // EPA ghi rõ điều kiện nước thuốc thử
  method: {
    sourceKey: string;      // vd 'EPA-METHOD-200.8', 'EPA-METHOD-300.0'
    citation: string;       // URL + revision
  };
  caveat: string;           // vd 'MDL nền mẫu thực có thể khác'
  // Cờ phân biệt với LOD/LOQ đã xác nhận dự án
  isProjectValidated: false; // LUÔN là false khi P0-E chưa đóng
  addedOn: string;          // ISO date
}
```

**Ví dụ (bảng tham chiếu, có thể hiển thị trong UI dạng tooltip/footnote):**

| Analyte | EPA reference MDL | Units | Method | Source key | Caveat |
| --- | ---: | --- | --- | --- | --- |
| Fe | `(chờ verify)` | mg/L | EPA Method 200.8 | `EPA-METHOD-200.8` | IDL ≠ MDL; matrix-dependent; cần user đối chiếu Table IDL của Method 200.8 Revision hiện hành trước khi dùng |
| Zn | `(chờ verify)` | mg/L | EPA Method 200.8 | `EPA-METHOD-200.8` | IDL ≠ MDL; matrix-dependent; cần user đối chiếu Table IDL của Method 200.8 Revision hiện hành trước khi dùng |
| Pb | `(chờ verify)` | mg/L | EPA Method 200.8 | `EPA-METHOD-200.8` | IDL ≠ MDL; matrix-dependent; cần user đối chiếu Table IDL của Method 200.8 Revision hiện hành trước khi dùng |
| Cl⁻ | 0,02 | mg/L | EPA Method 300.0 | `EPA-METHOD-300.0` | nền mẫu thực có thể khác |
| NO₃⁻-N | 0,002 | mg N/L | EPA Method 300.0 | `EPA-METHOD-300.0` | nền mẫu thực có thể khác |
| SO₄²⁻ | 0,02 | mg SO₄²⁻/L | EPA Method 300.0 | `EPA-METHOD-300.0` | nền mẫu thực có thể khác |
| Na | `(chờ verify)` | mg/L | EPA Method 200.8 (ICP-MS) | `EPA-METHOD-200.8` | IDL ≠ MDL; matrix-dependent; cần user đối chiếu Table IDL của Method 200.8 Revision hiện hành trước khi dùng |

> **Ghi chú về EPA Method 200.8 IDL cho Fe/Zn/Pb/Na (16/10/2026):** Agent không tự
> commit một con số cụ thể nào vì:
>
> 1. EPA Method 200.8 có nhiều revision (hiện hành 5.4 / 5.5 / 5.6 tuỳ năm) và bảng
>    IDL thay đổi giữa các revision; cần đối chiếu bảng gốc để có số chính xác.
> 2. IDL (instrument detection limit) khác MDL (method detection limit); EPA chỉ ghi
>    IDL trong Method 200.8, MDL do lab xác định theo quy trình `EPA-MDL-REV2-2016`.
> 3. Giá trị tham khảo chung cho ICP-MS thường nằm trong khoảng 0,001–0,01 mg/L cho
>    Fe/Zn/Na và 0,0001–0,001 mg/L cho Pb, **nhưng** con số này **không** tự động là
>    LOD/LOQ dự án (xem evidence register §5.1.4).
>
> **Yêu cầu từ agent:** user đối chiếu Table IDL của EPA Method 200.8 (revision hiện
> hành cho năm phát hành) và điền giá trị vào bảng trên; sau đó evidence register có
> thể tạo entry `EPA-METHOD-200.8-FE-IDL`, `EPA-METHOD-200.8-ZN-IDL`, v.v. với số
> chính xác. Cho đến khi điền, schema `referenceBenchmark` ở trên vẫn dùng được nhưng
> giá trị `value` để `null` cho Fe/Zn/Pb/Na và `isProjectValidated: false`.

> **Cách hiển thị bắt buộc trên UI** (xem thêm §4.1, §17.5):
>
> 1. Mỗi giá trị EPA reference phải kèm tooltip với `sourceKey` + URL.
> 2. Hiển thị rõ label: **"EPA reference MDL (nước thuốc thử), chưa phải LOD/LOQ dự án"**.
> 3. **Không** dùng trong tính toán solver hoặc trong `goalStatus`.
> 4. **Không** dùng để quyết định tuân thủ QCVN.
> 5. Khi P0-E đóng (có analytical method + validation data), thay thế các giá trị
>    này bằng `WT-MEAS-*` claim trong evidence register; nếu UI vẫn cần EPA reference,
>    giữ trong schema này nhưng đánh dấu `supersededBy: 'WT-MEAS-FE' | ...`.

**Giải thích đơn vị (rất quan trọng để không nhầm giữa EPA reference và QCVN):**

- `NO₃⁻-N` của EPA Method 300.0 = nitơ trong nitrate, đơn vị **mg N/L** (không phải
  mg NO₃⁻/L). Quy đổi: `1 mg N/L = 62/14 ≈ 4,43 mg NO₃⁻/L`.
- `SO₄²⁻` đơn vị **mg SO₄²⁻/L** (không phải mg S/L). Quy đổi: `1 mg SO₄²⁻/L = 32/96 ≈ 0,333 mg S/L`.
- `Cl⁻` đơn vị **mg Cl⁻/L** (không phải mg Cl₂/L hay mg HCl/L).
- `Na` đơn vị **mg Na⁺/L** (không phải mg NaCl/L).

### 6.2. Các route xử lý dự kiến

1. **Hydroxide route:** điều chỉnh pH, tạo hydroxide kim loại, trộn, lắng, lọc.
2. **Carbonate route:** dùng carbonate khi có dữ liệu cân bằng và giới hạn phù hợp.
3. **Adsorption route:** để phase sau, chỉ mở khi có dữ liệu capacity, breakthrough và xử lý vật liệu hấp phụ.

Route nào chưa có hằng số hoặc nguồn thì phải để trạng thái “chưa phát hành”, không đưa vào
workbench như một hóa chất có thể dùng.

### 6.3. Cân bằng vật chất

Với mỗi kim loại `M`:

```text
M_initial = M_dissolved + M_solid + M_unresolved
```

Sai số cân bằng phải nằm dưới tolerance được khóa trong scenario. `M_unresolved` không
được tính là đã xử lý và phải làm goal/score thành N/A nếu vượt ngưỡng cho phép.

### 6.4. Contract capacity và pH guard

Engine phải cung cấp kết quả có cấu trúc, không trả về một số capacity rời rạc:

```ts
type DissolvedCapacitySnapshot = {
  status: 'valid' | 'unresolved' | 'out-of-model'
  temperatureC: number
  pH: number
  volumeL: number
  capacityByMetal: Record<MetalId, number>
  dissolvedMassByMetal: Record<MetalId, number>
  marginByMetal: Record<MetalId, number>
  competingLoad: Record<MetalId, number>
  speciesBundleVersion: string
}

type PHGuardSnapshot = {
  pHBefore: number
  pHPredicted: number | null
  pHModelMin: number   // = 0 (solver bisection lower bound)
  pHModelMax: number   // = 14 (solver bisection upper bound)
  status: 'allowed' | 'rejected' | 'unresolved'
  reasonCode: string | null
}
```

**Miền pH guard (mục 5.2.1):** hai miền pH được khóa cố định trong code:

| Miền | Giá trị | Dùng ở đâu |
| --- | --- | --- |
| Solver bisection (charge balance) | `[0; 14]` | §6.1.1 (pH sau HCl/NaOH); `pHModelMin = 0`, `pHModelMax = 14` |
| Guard effective range | `[2; 13]` | §5.2.1 (pH guard); prediction ngoài `[2; 13]` → reject với `PH_GUARD_EXCEEDED` |

- Solver domain `[0; 14]` được hardcode trong bisection loop. `[H⁺]` tương ứng ∈ `[10⁻¹⁴; 10⁰]` mol/L — đủ cho HCl/NaOH 1 M (1 M HCl = pH 0; 1 M NaOH = pH 14).
- Guard domain `[2; 13]` là miền **người dùng nhìn thấy**: nếu `predictedPH` < 2 hoặc > 13, action bị reject. Giá trị này không phải cấu hình bundle mà là hằng số MVP.
- `pHModelMin/Max` trong `PHGuardSnapshot` luôn ghi `{0, 14}` (solver), không ghi `[2; 13]`; guard domain chỉ dùng trong logic reject ở §5.2, không lưu vào state.

`capacityByMetal` phải được tính lại khi thay đổi pH, thể tích, reagent, ionic strength
hoặc composition revision. Chưa có capacity hợp lệ thì không được chạy bước đánh giá đạt.

### 6.5. Mô hình kết tủa hydroxide (precipitation chemistry)

Mục này định nghĩa mô hình hóa học cho **route hydroxide** (mục 6.2, MVP). Hydroxide
route là cách duy nhất được bật trong MVP; carbonate và adsorption để phase sau.

> **⚠️ Cập nhật baseline Ksp 16/10/2026 (chemistry owner chốt D1–D5, P0-D đã đóng):**
>
> Giá trị Ksp và phase rắn trong §6.5.1, §6.5.2 đã được thay bằng **baseline model
> assumptions** chốt bởi chemistry owner ngày 16/10/2026 (xem `docs/experiments/water-treatment-evidence.md`
> §5.1.3 "Approved baseline model assumptions (D1–D5)" và "Discrepancy log vs current
> spec §6.5"):
>
> | Kim loại | Ksp cũ (Smith-Martell 2004) | **Ksp mới (baseline)** | Pha rắn baseline | Quyết định | Cross-check |
> | --- | --- | --- | --- | --- | --- |
> | Fe | 10⁻³⁸·⁶ (amorphous Fe(OH)₃) | **10⁻³⁸·⁷⁷⁹** | **Ferrihydrite** (`minteq.v4.dat`) | **D2** | `GC-PREC-01` PASS (sai số 0,001) |
> | Zn | 10⁻¹⁶·⁹ (ε-Zn(OH)₂, nhưng −16,9 thực ra là hydrolysis constant cho Zn(OH)₂(aq) — sai loại hằng số) | **10⁻¹⁵·⁵⁰⁶** | **Zn(OH)₂(am)** (`minteq.v4.dat`) | **D3** | `GC-PREC-02` PASS (sai số 0,004) |
> | Pb | 10⁻¹⁵·³ (không truy được nguồn trong database đã pin) | **10⁻¹⁹·⁸³⁰** | **Pb(OH)₂** (`minteq.v4.dat` + `phreeqc.dat`) | **D1** | `GC-PREC-03` PASS (sai số 0,000) |
> | pKa₂(H₂SO₄) | −1,99 (đặt sai tên trong field `pKa2`) | **+1,99** (dương, riêng field `pKa2`); `logK_dissociation = −1,99`; `logK_protonation = +1,99` | MINTEQ v4 convention | **D5** | `GC-SO4-01` PASS (sai số 0,000) |
>
> Tất cả 6 claim (`WT-CHEM-K-FeOH`, `WT-CHEM-Ksp-Fe`, `WT-CHEM-Ksp-Zn`,
> `WT-CHEM-Ksp-Pb`, `WT-CHEM-pKa2-H2SO4`, `WT-CHEM-SOLID-PHASE`) đã đạt
> `verificationStatus = 'cross-checked'` ngày 16/10/2026 bằng 7 case chuyên biệt
> trong PHREEQC 3.8.6-17100 trên `minteq.v4.dat` đã pin (SHA-256
> `a93914e63b0c616f8506cc92739188e50c5b9a15c33b111979652f308457f4ac`). Tổng hợp tại
> `tools/research/phreeqc-pin/3.8.6-17100/cases/P0-D-CROSSCHECK-REPORT.md`. **P0-D đã đóng**.
>
> Giá trị cũ (−38,6; −16,9; −15,3; −1,99) **giữ nguyên trong discrepancy log của evidence
> register** — KHÔNG xóa, KHÔNG ngụy trang thành giá trị đã xác minh. Baseline mới đã
> cross-checked bằng PHREEQC simulation thực tế; solver **được phép** dùng trong chế độ
> `validated` cho chemistry. Các lý do giữ `goalStatus = "unknown"` còn lại (P0-A QCVN,
> P0-E LOD, P0-C capacity 3 KL chưa cross-check, P0-F golden case) vẫn áp dụng theo
> two-layer design (§4.1).
>
> **Hệ quả ngay lập tức (cập nhật 16/10/2026 — sau khi đóng P0-D):**
>
> 1. Bảng capacity §6.5.2 đã được tính lại với baseline đã cross-check. Số liệu mới
>    cho thấy **Pb đạt Cột A thoải mái từ pH ≥ ~7,5** (capacity ≈ 0,029 mg/L ≪ 0,1 mg/L);
>    **Zn ranh giới** ở pH 6–9 (capacity vượt 1 mg/L đến tận pH ≈ 8,5–9). Điều này
>    **đảo ngược narrative "Pb là kim loại khó đạt Cột A bằng hydroxide"** đang nằm
>    trong các bản trước.
> 2. Ví dụ §6.5.4 với pH target = 9,0 và T_Pb = 0,3 mg/L: với Ksp_Pb đã cross-check,
>    **Pb CÓ kết tủa** ở pH 9,0 (capacity ≈ 2,93×10⁻⁵ mg/L ≪ T_Pb); kết quả chuyển
>    từ `partial-success` (Pb fail với Ksp cũ) sang `success` (cả 3 đạt Cột A ở pH 9).
> 3. Narrative đã cập nhật đầy đủ trong §6.5.2 Đọc bảng, §6.5.5.1, §6.5.6 và §7.4
>    để phản ánh baseline mới. Solver dùng baseline này không còn cần caveat
>    "chưa cross-check" cho 6 hằng số.
> 4. Limitation vẫn còn: trong mẫu có sulfate/carbonate nồng độ cao, pha rắn Pb thực
>    tế có thể là anglesite/cerussite/hydrocerussite (xem `WT-EXP-PB-PRECIP-SO4-CO3`).
>    Baseline `Pb(OH)₂` là assumption, không phải khẳng định phổ quát. UI phải ghi
>    rõ đây là dự đoán mô hình. Co-precipitation, ageing, kinetics vẫn bỏ qua
>    (§6.5.6).

#### 6.5.1. Phản ứng kết tủa và định nghĩa capacity

**Phản ứng thuận nghịch (giả định 25 °C, I = 0, ideal model — giá trị baseline đã chốt
D1–D5 ngày 16/10/2026; xem evidence register §5.1.3 và banner ở đầu §6.5):**

> **Provenance từng baseline Ksp (rõ ràng để không nhầm nguồn):**
>
> | Kim loại | Baseline Ksp | Primary source | Alternative storage / ghi chú |
> | --- | ---: | --- | --- |
> | Fe(OH)₃ → Fe³⁺ + 3 OH⁻ | −38,779 | `minteq.v4.dat` PHREEQC 3.8.6-17100 (SHA-256 `a93914e63b0c616f8506cc92739188e50c5b9a15c33b111979652f308457f4ac`) — phase `Ferrihydrite`, `log_k 3.191` | `phreeqc.dat` KHÔNG có phase `Ferrihydrite` riêng → KHÔNG dùng để verify Ksp này |
> | Zn(OH)₂ → Zn²⁺ + 2 OH⁻ | −15,506 | `minteq.v4.dat` (cùng SHA-256) — phase `Zn(OH)₂(am)`, `log_k 12.474` | `phreeqc.dat` chỉ có hydrolysis constant cho `Zn(OH)₂(aq)` (`−log_k −16.9`), KHÔNG có Ksp solid của `Zn(OH)₂(am)` |
> | Pb(OH)₂ → Pb²⁺ + 2 OH⁻ | −19,830 | `minteq.v4.dat` (cùng SHA-256) — phase `Pb(OH)₂`, `log_k 8.15` | `phreeqc.dat` cùng phase `Pb(OH)₂` với cùng `log_k 8.15` (alternative storage trong cùng bản phát hành PHREEQC) — **KHÔNG phải nguồn độc lập**, không dùng để xác nhận độc lập |

```text
Fe³⁺  + 3 OH⁻ ⇌ Fe(OH)₃(s, Ferrihydrite)   (Ksp_Fe = 10^(-38,779), claim WT-CHEM-Ksp-Fe, D2)
Zn²⁺  + 2 OH⁻ ⇌ Zn(OH)₂(s, amorphous)      (Ksp_Zn = 10^(-15,506), claim WT-CHEM-Ksp-Zn, D3)
Pb²⁺  + 2 OH⁻ ⇌ Pb(OH)₂(s, basic)          (Ksp_Pb = 10^(-19,830), claim WT-CHEM-Ksp-Pb, D1)
```

**Quy ước phase rắn:** Ba phase trên là **baseline model assumption** (D4) — giả định
mô hình cho solver MVP, **không phải** khẳng định phổ quát rằng ba phase này chắc chắn
hình thành trong mọi mẫu nước thải thực tế. Phase identity phải hiển thị rõ trong config,
evidence record, calculation output và UI (xem evidence register §5.1.3 quy tắc dùng
baseline assumption trong code).

**Lưu ý nguồn (chemistry owner chốt 16/10/2026):**

- Giá trị cũ −38,6 / −16,9 / −15,3 giữ trong evidence register “Discrepancy log” để
  truy ngược, KHÔNG đại diện cho hằng số đã xác minh. Xem bảng reconciliation đầu §6.5.
- −16,9 thực ra là hằng số tạo loài hòa tan `Zn²⁺ + 2H₂O ⇌ Zn(OH)₂(aq) + 2H⁺`,
  không phải Ksp của pha rắn (D3). Code type/comment phải tách field:
  `znKsp` cho Ksp; `znAqHydrolysisLogK` riêng cho hydrolysis constant.
- −15,3 không khớp với bất kỳ ứng viên nào trong database đã pin (D1); chỉ giữ trong
  discrepancy log như “legacy value không truy được nguồn”.

**Định nghĩa theo IUPAC (S05742, §14):** `Ksp` được xác định từ hoạt độ (activity) của
ion ở cân bằng hòa tan. Trong MVP, **dùng nồng độ thay cho hoạt độ** (γ = 1, mô hình
lý tưởng). Mọi giá trị Ksp dùng trong engine phải được khai báo tương ứng với quy ước
ideal này; nếu nguồn cho giá trị ở quy ước khác phải chuyển đổi trước khi nạp. Sai số
do γ ≠ 1 được ghi trong §6.5.6 (ionic strength correction).

**Tính [OH⁻] từ pH — dùng pKw nhất quán:** `pKw = 13,990` tại 25 °C (IAPWS R11-24,
claim `AN-KW-25C`). Công thức đúng:

```text
log₁₀[OH⁻] = pH - pKw   (tức [OH⁻] = 10^(pH - 13,990))
log₁₀[H⁺]  = -pH
```

**Định nghĩa capacity = nồng độ ion tự do tại cân bằng bão hòa:**

```text
C_{Fe³⁺,free,sat}(pH)  = Ksp_Fe / [OH⁻]³
C_{Zn²⁺,free,sat}(pH)  = Ksp_Zn / [OH⁻]²
C_{Pb²⁺,free,sat}(pH)  = Ksp_Pb / [OH⁻]²
```

Đây là **nồng độ ion tự do** (free M^n+) tại cân bằng, **không phải tổng kim loại hòa tan**.
Viết lại theo pH với pKw = 13,990:

```text
log C_{Fe³⁺,free,sat} = -38,779 - 3×(pH - 13,990) = 3,191 - 3×pH
log C_{Zn²⁺,free,sat} = -15,506 - 2×(pH - 13,990) = 12,474 - 2×pH
log C_{Pb²⁺,free,sat} = -19,830 - 2×(pH - 13,990) = 8,150 - 2×pH
```

**Phân biệt tổng kim loại hòa tan vs ion tự do:** Tại pH cao, một phần kim loại tồn tại
dưới dạng phức hydroxo (FeOH²⁺, ZnOH⁺, PbOH⁺, ...). Trong MVP, với 1 bước thủy phân
đầu tiên:

- Fe³⁺: `K_FeOH = [FeOH²⁺][H⁺]/[Fe³⁺] = 10^(-2,19)` (claim `WT-CHEM-K-FeOH`, `phreeqc.dat` PHREEQC 3.8.6-17100, SHA-256 `59373961d648dfbf68a40744060c1d64f57ecbec98f4f5fb89f3a1b4213ccd10`)
- Zn²⁺, Pb²⁺: hydroxo bậc 1 yếu (β₁ ≈ 10⁻⁹ và 10⁻⁷·⁷), bỏ qua trong MVP — xem §6.7

Tỷ lệ hydroxo đúng là `K_FeOH/[H⁺]` (theo định nghĩa K_FeOH), không phải `β₁[OH⁻]`
trừ khi β₁ được định nghĩa là `K_FeOH/K_w` (≈ 10^(+11,8)). Bản trước ghi β₁ = 10^(-2,19)
(= K_FeOH) rồi áp `β₁[OH⁻]` — đó là hai hằng số khác nhau, dẫn đến tỷ lệ hydroxo lệch
~6 bậc. Công thức đúng:

```text
C_{Fe,total,dissolved,sat}(pH)  ≈  C_{Fe³⁺,free,sat}(pH)  +  C_{Fe³⁺,free,sat}(pH) × K_FeOH / [H⁺]
                                =  C_{Fe³⁺,free,sat}(pH) × (1 + K_FeOH / [H⁺])
```

- Với Fe³⁺ ở pH 6: `K_FeOH/[H⁺] = 10^(-2,19) / 10⁻⁶ ≈ 6,5×10³` → hydroxo chiếm ~99,98%.
  Tỷ lệ này **không** phải "< 0,1%" như bản cũ. **Dùng capacity = free là xấp xỉ kém
  cho Fe** ở pH ≥ 4; capacity "tổng hòa tan" thực tế cao hơn free ~6.500× tại pH 6.
- Với Zn²⁺ và Pb²⁺ ở pH 7–9: hydroxo bậc 1 rất yếu (β₁ ≈ 10⁻⁹ và 10⁻⁷·⁷), đóng góp < 0,01%.
  **Dùng capacity = free là xấp xỉ tốt cho Zn/Pb.**
- Ở pH > 10: hydroxo bậc 2+ (Fe(OH)₂⁺, Zn(OH)₃⁻, Pb(OH)₃⁻) có thể chiếm ưu thế và gây
  **tái hòa tan** (amphoteric). MVP **chưa hỗ trợ**, đã có cảnh báo ở §6.5.6.

**Hệ quả với bảng capacity (§6.5.2):**

- Bảng hiện đang dùng `C_{M^n+,free,sat}(pH)` cho cả Fe và Zn/Pb. Với Fe ở pH ≥ 4, giá trị
  này **đánh giá quá thấp** total dissolved capacity (sai số lên tới 4 bậc log). Kết quả
  vẫn đủ nhỏ để Fe đạt mục tiêu mô phỏng Cột A trong mọi pH của bảng, **nhưng Fe có
  thể bị "over-predict" removal so với thực nghiệm nếu hydroxo không tách khi lọc**.
  Bảng được giữ nguyên trong MVP, kèm cảnh báo ở §6.5.6; capacity "free" là conservative
  ước lượng cho compliance check ở mức **mục tiêu mô phỏng MVP** (Cột A — đã xác minh
  pháp lý với Thông tư 06/2025/TT-BTNMT, xem §16.1 P0-A) nhưng **không phải** total
  dissolved concentration thực tế.

**Kết luận MVP:** trong miền pH `[2; 4]` (Fe) và `[2; 10]` (Zn, Pb), `capacity(pH) =
C_{M^n+,free,sat}(pH)` là xấp xỉ **conservative** (đánh giá thấp khả năng hòa tan) cho
tổng kim loại hòa tan đối với mục đích compliance ở mức **mục tiêu mô phỏng MVP**
(Cột A — đã xác minh pháp lý với Thông tư 06/2025/TT-BTNMT, xem §16.1 P0-A).
Engine dùng giá trị này cho cả hiển thị "dung tối đa" và cho trigger kết tủa. Mọi tài
liệu phải ghi "capacity theo mô
hình lý tưởng, nồng độ ≈ hoạt độ, bỏ qua amphoteric bậc 2+, hydroxo Fe bậc 1 chỉ tính
gần đúng".

#### 6.5.2. Bảng capacity theo pH (mol/L và mg/L)

> **Cách đọc bảng:** Giá trị trong bảng là **capacity của ion tự do** (`[Fe³⁺]`, `[Zn²⁺]`,
> `[Pb²⁺]`) tại cân bằng bão hòa Ksp lý tưởng, **không phải** tổng kim loại hòa tan.
> Nhãn `[Fe³⁺]` có nghĩa là nồng độ Fe³⁺ tự do (free), dùng cho trigger kết tủa ở §6.5.3:
> nếu `T_Fe > [Fe³⁺]@pH` → phần dư kết tủa Fe(OH)₃. Vì Fe có hydroxo mạnh (bậc 1
> K_FeOH = 10^(-2,19)), nên `[Fe³⁺]@pH` << `[Fe]_total,dissolved@sat` ở pH ≥ 4.
> Cột "Ghi chú" dùng `[Fe³⁺]` để so sánh với giới hạn QCVN — đây là ước lượng
> **conservative** (thận trọng) cho Fe (model đánh giá thấp khả năng hòa tan thực tế),
> nhưng **đúng** cho Zn/Pb (hydroxo bỏ qua). Phần ghi chú "Fe đạt / Zn đạt" có nghĩa:
> `[M^n+]@pH < giới hạn Cột A` → nếu T_M ≤ giới hạn, không cần kết tủa thêm; nếu
> T_M > giới hạn, phần vượt kết tủa. Không dùng bảng này để ước lượng `[Fe]_total`
> thực tế ở pH ≥ 4.
>
> **⚠️ Miền áp dụng của mô hình Ksp lý tưởng:**
> - Giá trị capacity tại pH **6,0** và **7,0** (các hàng đầu tiên) nằm **ngoài miền
>   tin cậy** của mô hình khi tổng muối > 0,1 M (ionic strength cao, γ ≠ 1 — xem
>   §6.6.5). Tại pH 6–7 với benchmark composition, tổng muối có thể vượt 0,1 M do
>   precursor và HCl/NaOH. Các giá trị ở pH 6,0 và 7,0 **chỉ mang tính tham khảo
>   lý thuyết**; solver phải gắn flag `I_HIGH_APPROX` khi ionic strength > 0,1 M và/hoặc
>   khi pH ∈ [6; 7] với tổng muối cao. **Không dùng các hàng này làm cơ sở để
>   khẳng định dự đoán hóa học đã được xác minh.**
> - Miền tin cậy của bảng: **pH 8,0–10,0** với ionic strength ≤ 0,1 M.
>
> **Nguồn số:** Tính từ Ksp Fe(OH)₃ (Ferrihydrite) = 10⁻³⁸·⁷⁷⁹, Ksp Zn(OH)₂(am) =
> 10⁻¹⁵·⁵⁰⁶, Ksp Pb(OH)₂ = 10⁻¹⁹·⁸³⁰, pKw = 13,990 (IAPWS R11-24, claim `AN-KW-25C`).
> Ba Ksp là **baseline model assumption** (D1/D2/D3, chốt ngày 16/10/2026 từ
> `minteq.v4.dat` PHREEQC 3.8.6-17100, SHA-256
> `a93914e63b0c616f8506cc92739188e50c5b9a15c33b111979652f308457f4ac` — **primary
> source duy nhất cho cả 3 Ksp**):
>
> | Kim loại | Ksp | Primary source | Alternative storage / ghi chú |
> | --- | ---: | --- | --- |
> | Fe(OH)₃ (Ferrihydrite) | −38,779 | `minteq.v4.dat`, `log_k 3.191` | `phreeqc.dat` không có phase `Ferrihydrite` riêng → KHÔNG dùng để verify Ksp này |
> | Zn(OH)₂(am) | −15,506 | `minteq.v4.dat`, `log_k 12.474` | `phreeqc.dat` chỉ có hydrolysis constant `Zn²⁺ + 2H₂O ⇌ Zn(OH)₂(aq) + 2H⁺` (`−log_k −16.9`), KHÔNG có Ksp solid Zn(OH)₂(am) |
> | Pb(OH)₂ | −19,830 | `minteq.v4.dat`, `log_k 8.15` | `phreeqc.dat` cùng phase `Pb(OH)₂` với cùng `log_k 8.15` (alternative storage trong cùng bản phát hành PHREEQC) — KHÔNG phải nguồn độc lập, không dùng để xác nhận độc lập |
>
> Script tại `tools/research/verify-wt-capacity.mjs`
> (version `v2026-10-16-D1D2D3`); output verify tại `tools/research/wt-capacity-output.txt`.
> **Mọi thay đổi giá trị bảng phải chạy script để verify** trước khi commit.
>
> **Legacy values** −38,6 / −16,9 / −15,3 từ Smith-Martell 2004 chỉ giữ trong
> `docs/experiments/water-treatment-evidence.md` §5.1.3 “Discrepancy log vs current spec §6.5”
> để truy ngược — KHÔNG dùng cho mô phỏng khi chưa qua PHREEQC verification.
>
> **Lưu ý về Zn/Pb ở pH thấp:** Giá trị Zn²⁺ ~3 mol/L và Pb²⁺ ~1,4×10⁻⁴ mol/L tại pH
> 6,0 là kết quả đúng của công thức — Zn/Pb tan cao trong môi trường axit. Không phải
> lỗi bảng. Cột mol/L và mg/L quy đổi khớp nhau ở mọi hàng (verify bằng script). Bảng
> trước bản này có lỗi ở cột Zn mg/L (thiếu 1.000×), cột Fe mol/L (lệch ~3×) — đã
> được sửa. **Ngoài ra**, bảng trước còn dùng Ksp sai loại −16,9 và Ksp Pb −15,3
> không truy được nguồn — đã thay bằng baseline D1/D3 từ `minteq.v4.dat`.

| pH  | [Fe³⁺] mol/L | [Fe³⁺] mg/L | [Zn²⁺] mol/L | [Zn²⁺] mg/L | [Pb²⁺] mol/L | [Pb²⁺] mg/L | Ghi chú |
| --: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 6,0 | 1,6×10⁻¹⁵ | 8,7×10⁻¹¹ | 3,0 | 1,95×10⁵ | 1,4×10⁻⁴ | 29,3 | Fe đạt; Zn vượt rất xa; Pb vượt ~293× |
| 7,0 | 1,6×10⁻¹⁸ | 8,7×10⁻¹⁴ | 3,0×10⁻² | 1,95×10³ | 1,4×10⁻⁶ | 0,293 | Fe đạt; Zn vượt ~1.950×; Pb vượt ~3× |
| 8,0 | 1,6×10⁻²¹ | 8,7×10⁻¹⁷ | 3,0×10⁻⁴ | 19,5 | 1,4×10⁻⁸ | 2,9×10⁻³ | Fe, Pb đạt; Zn vượt ~20× |
| 8,5 | 4,9×10⁻²³ | 2,7×10⁻¹⁸ | 3,0×10⁻⁵ | 1,95 | 1,4×10⁻⁹ | 2,9×10⁻⁴ | Fe, Pb đạt; Zn vượt ~2× (sát ngưỡng Cột A 1 mg/L) |
| 9,0 | 1,6×10⁻²⁴ | 8,7×10⁻²⁰ | 3,0×10⁻⁶ | 0,195 | 1,4×10⁻¹⁰ | 2,9×10⁻⁵ | Fe, Zn, Pb đạt; **pH > 9 vượt QCVN** |
| 9,5 | 4,9×10⁻²⁶ | 2,7×10⁻²¹ | 3,0×10⁻⁷ | 0,0195 | 1,4×10⁻¹¹ | 2,9×10⁻⁶ | Fe, Zn, Pb đạt; **pH > 9 vượt QCVN** |
| 10,0 | 1,6×10⁻²⁷ | 8,7×10⁻²² | 3,0×10⁻⁸ | 1,95×10⁻³ | 1,4×10⁻¹² | 2,9×10⁻⁷ | Fe, Zn, Pb đạt; **pH > 9 vượt QCVN; Zn/Pb có thể tái hòa tan (xem §6.5.6)** |

**Đọc bảng (số liệu baseline D1/D2/D3 đã cross-checked 16/10/2026):**

- Fe: `[Fe³⁺]@pH` giảm nhanh theo pH (3 bậc log/pH). Tại pH ≥ ~2,6, `[Fe³⁺]@pH`
  < 2 mg/L. **Chú ý:** `[Fe³⁺]` = free Fe³⁺, nhỏ hơn nhiều so với total dissolved Fe
  ở pH ≥ 4 (hydroxo chiếm ưu thế). Cột "Fe đạt" dùng `[Fe³⁺]` để so sánh — model
  conservative, không ước lượng `[Fe]_total` thực tế.
- Zn: `[Zn²⁺]@pH` giảm 2 bậc log/pH. Hydroxo Zn bỏ qua trong MVP, nên `[Zn²⁺] ≈
  [Zn]_total,dissolved` trong miền này. **Với baseline mới** (D3, Ksp = 10⁻¹⁵·⁵⁰⁶ cho
  Zn(OH)₂(am)), Zn **không đạt Cột A 1 mg/L** ở pH ≤ 8,5; chỉ đạt từ pH ≈ 8,6 trở
  lên. Tại pH 9,0 capacity = 0,195 mg/L ≪ 1 mg/L; tại pH 8,5 còn 1,95 mg/L (~2× Cột A).
- Pb: `[Pb²⁺]@pH` giảm 2 bậc log/pH. **Với baseline mới** (D1, Ksp = 10⁻¹⁹·⁸³⁰ cho
  Pb(OH)₂), tại pH 9,0 capacity = 2,9×10⁻⁵ mg/L ≪ 0,1 mg/L (Cột A). Pb **đạt Cột A**
  ngay từ pH ≈ 7,5 trở lên. Đảo ngược narrative cũ (“Pb KHÔNG tự kết tủa ở pH 9 với
  Ksp cũ −15,3” — sai vì −15,3 không truy được nguồn trong database đã pin).

**Trade-off giáo dục (baseline đã cross-checked 16/10/2026):**

- Với QCVN Cột A (pH 6–9, Zn ≤ 1,0, Pb ≤ 0,1 mg/L):
  - **Fe:** đạt thoải mái từ pH ≥ ~3.
  - **Zn:** cần pH gần 9 để đạt ≪ 1 mg/L (tại pH 9 capacity = 0,195 mg/L ≪ 1 mg/L).
    Trong pH 6–8,5 capacity Zn vượt Cột A 1 mg/L từ nhiều lần đến rất nhiều lần.
  - **Pb:** đạt thoải mái từ pH ≥ 7,5 (capacity ≈ 0,029 mg/L ≪ 0,1 mg/L).
  - **Hệ quả vận hành:** với baseline đã cross-checked, hydroxide đơn bước tại pH 9
    có thể đạt Cột A đồng thời cho cả 3 kim loại theo công thức lý tưởng (I = 0, không
    amphoteric). Đây là kết luận ngược với narrative cũ ("Pb cần carbonate/sulfide/
    adsorption để đạt Cột A" dựa trên Ksp cũ −15,3) — narrative cũ đã chuyển vào
    `WT-CHEM-NARRATIVE-LEGACY` và KHÔNG còn là narrative hiện hành.
- Miền ranh giới cũ (tại pH 9,0, Pb capacity ≈ 10× ngưỡng Cột A) không còn đúng với
  baseline đã cross-checked; narrative này được thay bằng "Zn là kim loại ranh giới
  trong khuôn khổ QCVN Cột A". Mọi report / UI / bài học dùng công thức **"Zn ranh
  giới; Pb đạt thoải mái ở pH ≈ 7,5–9"** — đã được xác minh bằng PHREEQC 7 case
  chuyên biệt ngày 16/10/2026 (P0-D đã đóng).

> ⚠️ **Giới hạn mô hình (vẫn còn, không thay đổi bởi baseline update):** Capacity tính
> theo Ksp ở I = 0, ionic strength = 0. Tại ionic strength thực tế (do muối precursor
> và NaCl từ HCl/NaOH), Ksp hiệu dụng có thể khác. **Đây là một trong các giả định của
> MVP; ghi trong report và evidence.** Baseline D1/D2/D3 đã `cross-checked` 16/10/2026,
> nên:
>
> - Solver được dùng trong chế độ `validated` cho chemistry. Kết quả vẫn là
>   **dự đoán mô hình** với assumption D4 (Pb(OH)₂), không phải khẳng định phổ
>   quát cho mọi mẫu thực tế.
> - Co-precipitation, ageing, kinetics vẫn bỏ qua (§6.5.6).
> - Amphoteric Zn/Pb ở pH > 10 vẫn là giới hạn chưa model hoá (§6.5.6).
> - Mass-balance tolerance O9 vẫn chưa được owner cung cấp; solver không được tự gán.

Các lựa chọn ngoài MVP để xử lý triệt để Pb (chỉ liệt kê, không implement):

- Carbonate route (PbCO₃ kết tủa ở pH thấp hơn hydroxide) — mục 6.2.
- Sulfide route (PbS kết tủa ở pH rất rộng) — phase 3+.
- Adsorption (than hoạt tính, ion exchange) — mục 6.2.
- Co-precipitation với Fe(OH)₃ ở pH 8–9 (Pb bị "kẹp" vào sludge Fe) — có thể mở rộng
  trong phase 2 với hằng số distribution coefficient.

#### 6.5.3. Tính lượng kết tủa

**Quy ước biến (mol/L, nội bộ solver):**

| Biến | Nghĩa | Đơn vị |
|---|---|---|
| `T_M_input_mol_L` | Tổng mol nguyên tố M nạp vào (input từ composition) | mol/L |
| `T_M_dissolved_mol_L` | Tổng mol M **còn hòa tan** trước bước kết tủa hiện tại | mol/L |
| `precipitated_M_mol_L` | Mol M kết tủa trong bước này (= free ion vượt capacity) | mol/L |
| `T_M_dissolved_after_mol_L` | Tổng mol M còn hòa tan **sau** bước kết tủa hiện tại | mol/L |
| `C_{M^n+,free,sat}(pH)` | Nồng độ ion tự do M^n+ tại bão hòa Ksp | mol/L |

> **Phân biệt rõ:**
> - `T_M_dissolved_mol_L` = tổng M hòa tan (free + hydroxo + complex) — dùng cho
>   mass balance nguyên tố.
> - `C_{M^n+,free,sat}(pH)` = chỉ phần ion tự do tại bão hòa — dùng cho trigger
>   kết tủa. **Không gán** trực tiếp `T_M_dissolved = C_{free,sat}`.

**Phương trình mass balance nguyên tố (phải thoả mãn tại mỗi bước lặp):**

```text
T_M_input_mol_L = T_M_dissolved_mol_L + precipitated_M_mol_L
```

> Solver **phải verify** phương trình này sau mỗi lần cập nhật `T_M_dissolved_mol_L`
> hoặc `precipitated_M_mol_L`. Sai số dưới `10⁻⁸ mol/L` (xem §6.6.4 mục 1).

**⚠️ Mô hình kết tủa là xấp xỉ — KHÔNG phải cân bằng hóa học đầy đủ:**
Công thức `precipitated = max(0, T_dissolved − C_free,sat)` giả định rằng **toàn bộ
lượng kim loại vượt capacity tự động chuyển thành pha rắn**. Điều này chỉ đúng khi
phản ứng nhanh và không có phức hòa tan chiếm ưu thế. Nếu có phức đáng kể (ví dụ
sulfate, carbonate), phần chênh lệch `T_dissolved − C_free,sat` **không thể coi toàn
bộ** là kết tủa — cần giải hệ phương trình cân bằng đầy đủ.

> **Giới hạn cụ thể:**
> - **Zn/Pb (MVP):** hydroxo bậc 1 yếu (β₁ ≈ 10⁻⁹ và 10⁻⁷·⁷), bỏ qua trong MVP →
>   xấp xỉ tốt, sai số < 0,01% (xem §6.5.1).
> - **Fe (MVP):** hydroxo FeOH²⁺ chiếm ưu thế ở pH ≥ 4; công thức dùng
>   `(1 + K_FeOH/[H⁺])` để ước lượng tổng dissolved từ free ion — **xấp xỉ kém**,
>   sai số lên tới ~10⁴× tại pH 6. Đây là conservative estimate cho compliance
>   (§6.5.1).
> - **Khi ionic strength > 0,1 M** (§6.6.5): γ ≠ 1, Ksp hiệu dụng khác giá trị
>   ideal — kết quả **không đáng tin**.

> **Mô hình đầy đủ (phase 2+):** Giải hệ phương trình cân bằng gồm Ksp, hydrolysis
> (β₁, β₂), complexation (sulfate, carbonate nếu có) và mass balance cho **mọi**
> dạng hòa tan cùng lúc. Solver hiện tại **không** thực hiện điều này. Mã nguồn
> và giao diện **phải** gắn nhãn kết quả kết tủa là "mô phỏng nội bộ theo mô hình
> xấp xỉ MVP, chưa xác minh bằng PHREEQC hoặc thực nghiệm."

**Công thức tổng quát** (xấp xỉ `C_{M^n+,free,sat} ≈ C_{M,total,dissolved,sat}` trong miền pH `[2; 4]` cho Fe và `[2; 10]` cho Zn/Pb, xem §6.5.1 — chú ý hydroxo Fe bậc 1 chiếm ưu thế ở pH ≥ 4, capacity này là **conservative** ước lượng cho compliance ở mức mục tiêu mô phỏng MVP — Cột A đã xác minh pháp lý, xem §16.1 P0-A):

```text
precipitated_Fe_mol_L = max(0, T_Fe_dissolved_mol_L
                            − C_{Fe³⁺,free,sat}(pH_target) × (1 + K_FeOH / [H⁺]@pH_target))
precipitated_Zn_mol_L = max(0, T_Zn_dissolved_mol_L
                            − C_{Zn²⁺,free,sat}(pH_target))              # β Zn bỏ qua trong MVP
precipitated_Pb_mol_L = max(0, T_Pb_dissolved_mol_L
                            − C_{Pb²⁺,free,sat}(pH_target))              # β Pb bỏ qua trong MVP

T_Fe_dissolved_after_mol_L = T_Fe_dissolved_mol_L − precipitated_Fe_mol_L
T_Zn_dissolved_after_mol_L = T_Zn_dissolved_mol_L − precipitated_Zn_mol_L
T_Pb_dissolved_after_mol_L = T_Pb_dissolved_mol_L − precipitated_Pb_mol_L
```

> **Vòng lặp:** Sau bước trên, `T_M_dissolved_mol_L` được cập nhật thành
> `T_M_dissolved_after_mol_L`, rồi §6.6 gọi lại bisection với T_M mới. Lặp tối đa 10
> lần; dừng khi `|ΔpH| < 0,001` và `|ΔT_M| < 10⁻⁶ mol/L` cho mỗi M.
> Công thức trên chỉ áp dụng cho **một bước của vòng lặp**, không phải kết quả cuối.

**Đơn vị:** mol/L cho input/output, quy đổi sang mg/L khi hiển thị bằng `mg/L = mol/L × M_metal × 1000`.
Tổng mol trong toàn mẫu (cho state): `mol_in_sample = mol_L × V_sample_L`.

#### 6.5.4. Khối lượng kết tủa hydroxide (sludge mass)

**Chuỗi chuyển đổi bắt buộc** (dùng cùng quy ước §4.2.7):

```
Bước 1 — Nồng độ kết tủa (mol/L, do solver trả về):
  precipitated_Fe_mol_L = max(0, T_Fe_dissolved − C_{Fe,free,sat})   [mol/L]

Bước 2 — Tổng mol trong mẫu (nhân V_sample_L):
  precipitated_Fe_mol  = precipitated_Fe_mol_L × V_sample_L             [mol]
  precipitated_Zn_mol  = precipitated_Zn_mol_L × V_sample_L
  precipitated_Pb_mol  = precipitated_Pb_mol_L × V_sample_L

Bước 3 — Khối lượng khô hydroxide (nhân M_metal × 1000):
  m_Fe(OH)₃_mg = precipitated_Fe_mol_L × V_sample_L × M_Fe(OH)₃ × 1000
                = precipitated_Fe_mol_L × V_sample_L × 106870           [mg]
  m_Zn(OH)₂_mg = precipitated_Zn_mol_L × V_sample_L × M_Zn(OH)₂ × 1000
                = precipitated_Zn_mol_L × V_sample_L × 99400            [mg]
  m_Pb(OH)₂_mg = precipitated_Pb_mol_L × V_sample_L × M_Pb(OH)₂ × 1000
                = precipitated_Pb_mol_L × V_sample_L × 241200            [mg]
```

> **Quy tắc:** mọi biến nội bộ solver là **mol/L**. Khi lưu vào state
> (`SolidInventory.precipitateByMetal_mol`), phải **nhân V_sample_L** để được tổng mol
> trong mẫu. Khi tính khối lượng bùn, tiếp tục nhân M × 1000. Không bao giờ trộn
> mol/L với tổng mol trong cùng một biểu thức. Viết unit test cho ít nhất hai thể
> tích mẫu khác nhau (500 mL và 2.000 mL) để xác nhận khối lượng tỷ lệ tuyến tính
> với thể tích khi nồng độ giữ nguyên.

**Công thức khối lượng kết tủa** (dùng precipitated_mol_L nội bộ):

```text
m_Fe(OH)₃ = precipitated_Fe (mol) × M_Fe(OH)₃ = precipitated_Fe × 106,87 g/mol
m_Zn(OH)₂ = precipitated_Zn (mol) × M_Zn(OH)₂ = precipitated_Zn × 99,40 g/mol
m_Pb(OH)₂ = precipitated_Pb (mol) × M_Pb(OH)₂ = precipitated_Pb × 241,20 g/mol
```

**Ví dụ** (1L, T_Fe = 0,179 mM = 1,79×10⁻⁴ mol/L = 10 mg/L Fe, T_Zn = 0,0765 mM = 7,65×10⁻⁵ mol/L = 5 mg/L Zn, T_Pb = 1,45 µM = 1,45×10⁻⁶ mol/L = 0,3 mg/L Pb, pH target = 9,0; dùng baseline Ksp D1/D2/D3):

- capacity_Fe(9) ≈ 1,6×10⁻²⁴ mol/L ≪ T_Fe → precipitated_Fe_mol_L ≈ 1,79×10⁻⁴ mol/L
- capacity_Zn(9) ≈ 3,0×10⁻⁶ mol/L ≪ T_Zn → precipitated_Zn_mol_L ≈ 7,65×10⁻⁵ mol/L
- capacity_Pb(9) ≈ 1,4×10⁻¹⁰ mol/L = 2,9×10⁻⁵ mg/L ≪ T_Pb = 1,45×10⁻⁶ mol/L = 0,3 mg/L
  → **Pb CÓ kết tủa** (kết quả đảo so với bản cũ dùng Ksp_Pb = −15,3; xem banner §6.5).

→ m_Fe(OH)₃ = 1,79×10⁻⁴ mol/L × 1 L × 106870 mg/mmol = 19,1 mg
→ m_Zn(OH)₂ = 7,65×10⁻⁵ mol/L × 1 L × 99400 mg/mmol  = 7,6 mg
→ m_Pb(OH)₂ = 1,45×10⁻⁶ mol/L × 1 L × 241200 mg/mmol = 0,35 mg
→ Tổng sludge khô ≈ 27,1 mg trong 1 L nước (rất loãng, đúng tính chất giáo dục).
→ **Mass balance ở filtrate (với baseline mới):** m_Pb_filtrate ≈ capacity_Pb(9) × V_sample
  = 1,4×10⁻¹⁰ mol/L × 0,9 L × 207200 mg/mmol ≈ 2,6×10⁻⁵ mg; nồng độ trong filtrate:
  C_Pb_filtrate ≈ capacity(9) ≈ 2,9×10⁻⁵ mg/L ≪ 0,1 mg/L (Cột A) → **Pb đạt Cột A**.
  Tương tự Fe đạt (capacity_Fe ≈ 8,7×10⁻²⁰ mg/L ≪ 2,0), Zn đạt (capacity_Zn ≈ 0,195
  mg/L ≪ 1,0). → goal sẽ là `success` theo baseline mới **NẾU** các giới hạn mô hình
  (§6.5.6 — amphoteric, ionic strength, mass balance) được đảm bảo; trong khi chờ
  PHREEQC verification và chemistry owner review toàn bộ downstream narrative, kết
  quả này vẫn phải gắn nhãn `goalStatus = "unknown"` (§16.1 P0-D).

**Sludge thể tích ước tính** (giả định density ≈ 1 g/mL cho khô + nước kèm theo):
- Sau lắng, sludge thể tích ≈ (m_total / 1) × 10 (10× thể tích khô do lỗ rỗng và nước kèm).
- Cho MVP, chỉ hiển thị **khối lượng khô**, không tính thể tích sludge.

#### 6.5.5. Cân bằng OH⁻ tiêu thụ

Để tạo kết tủa, hệ thống cần cung cấp OH⁻. Tổng OH⁻ tiêu thụ cho kết tủa hydroxide:

```text
OH_for_Fe = 3 × precipitated_Fe   (mol/L)
OH_for_Zn = 2 × precipitated_Zn   (mol/L)
OH_for_Pb = 2 × precipitated_Pb   (mol/L)
OH_total_precipitation = OH_for_Fe + OH_for_Zn + OH_for_Pb
```

Tổng OH⁻ cần thêm vào (từ NaOH ảo) phải cover cả 2 phần:

1. **OH⁻ để nâng pH** từ `pH_current` lên `pH_target` (charge balance).
2. **OH⁻ cho kết tủa** (`OH_total_precipitation` ở trên).

```text
OH_needed_total = OH_for_pH_adjustment + OH_total_precipitation
```

**NaOH stock ảo** (mục 2.4): giả định stock concentration = 1,0 M (khóa trong bundle).

```text
V_NaOH_needed (L) = OH_needed_total (mol/L) × V_sample (L) / 1,0 (mol/L)
                  = OH_needed_total × V_sample
```

**Ví dụ (placeholder; baseline đã cross-checked 16/10/2026):** V = 1 L, mẫu N = 3
với Fe = 10, Zn = 5, Pb = 0,3 mg/L, pH target = 9,0. Tất cả số liệu dưới đây phải
được tính lại bởi solver §6.6 với composition thực tế của attempt; các giá trị trong
bản trước (pH initial ≈ 1,87; NaOH ≈ 0,82 mL; pH adjust OH⁻ ≈ 0,023 mM) đã bị loại
bỏ vì không nhất quán với charge balance:

- pH initial thực tế phải được solver §6.6 tính từ composition; bản trước ghi "1,87" nhưng
  charge balance ideal 1-step hydrolysis cho T_Fe = 0,179 mM, T_Cl = 0,537 mM (chỉ FeCl₃
  trong nước) cho pH ~3–4 (chưa tính kết tủa Fe(OH)₃) — lệch xa "1,87". Khi tính
  kết tủa Fe(OH)₃, pH còn cao hơn do OH⁻ bị tiêu thụ tạo kết tủa. Con số "1,87" và
  "0,023 mM" trong bản cũ chỉ nhất quán nội tại nếu giả định T_Fe lớn hơn ~13 mM
  (gấp ~75 lần slider cap), không phải 0,179 mM. **Không dùng làm reference**.
- Lượng NaOH stock cần (1 M) = tổng OH⁻ tiêu thụ / 1 M, trong đó OH⁻ tiêu thụ gồm:
  neutralize [H⁺] cũ (≈ T_H⁺ ở pH initial) + cung cấp [OH⁻] ở pH 9 (≈ 10⁻⁵ M) + deprotonate
  HSO₄⁻/FeOH²⁺ (nhỏ) + 3·T_Fe + 2·T_Zn + 2·T_Pb. Tổng này **phải do solver trả về**;
  spec không hardcode con số nào. Cap 10 mL §5.2.1 giới hạn OH⁻ ≤ 10 mmol/L — nếu solver
  trả > 10 mmol/L, attempt đánh dấu `DOSE_LIMIT_EXCEEDED`.
- Con số "5,6 mL" trong bản cũ đã được loại bỏ — không nhất quán với charge balance và
  vượt quá miền pH guard [2; 13] nếu NaOH được thêm tới pH > 9.

**Phân bổ OH⁻ tiêu thụ — template để solver điền, KHÔNG dùng làm kết quả cứng:**

| Mục đích | Công thức (mol/L) | Ghi chú |
| --- | --- | --- |
| pH adjust initial → target | `[H⁺]@pH_initial − [H⁺]@pH_target + [OH⁻]@pH_target − [OH⁻]@pH_initial` | ≈ `[H⁺]@pH_initial` khi pH_target cao; solver tính |
| HSO₄⁻ → SO₄²⁻ (ZnSO₄ salt) | `T_S × (1 − [HSO₄⁻]@pH_target/T_S) − (1 − [HSO₄⁻]@pH_initial/T_S)` | nhỏ vì T_S chỉ = T_Zn (≤ 0,077 mM) |
| FeOH²⁺ → Fe³⁺ (reverse hydrolysis) | `T_Fe_dissolved × (α_FeOH@initial − α_FeOH@target)` | α_FeOH = K_FeOH/[H⁺] / (1 + K_FeOH/[H⁺]); có thể âm/dương |
| Kết tủa Fe(OH)₃ | `3 × precipitated_Fe` | chiếm ưu thế ở pH ≥ 4 |
| Kết tủa Zn(OH)₂ | `2 × precipitated_Zn` | 0 nếu pH_target < ~8,5 (theo baseline Ksp_D3 −15,506) |
| Kết tủa Pb(OH)₂ | `2 × precipitated_Pb` | 0 nếu pH_target < ~7,5 (theo baseline Ksp_D1 −19,830); xem §6.5.2 trade-off đang chờ chemistry owner review |
| **Tổng** | **Σ các dòng trên** | **solver §6.6 trả về** |

Template này chỉ để verifier thấy solver cần track từng thành phần. Mọi số liệu cụ thể
phải đến từ solver; spec không khóa con số nào trong MVP.

#### 6.5.5.1. Tương tác giữa các kim loại khi N ≥ 2

Khi user tick nhiều kim loại (N = 2 hoặc N = 3), các kim loại **không phản ứng trực
tiếp với nhau** mà **cạnh tranh** 2 nguồn lực chung: OH⁻ budget (cung cấp bởi NaOH,
cap 10 mL ở mục 5.2.1) và thể tích mẫu (1L). Trong MVP, 3 cơ chế tương tác được tính:

1. **Thứ tự kết tủa theo Ksp** — kim loại có Ksp thấp nhất kết tủa trước khi pH tăng (baseline D1/D2/D3 đã cross-checked 16/10/2026):

   | Kim loại | Ksp baseline (I = 0, MINTEQ v4) | Ngưỡng pH bắt đầu kết tủa (xấp xỉ) |
   | --- | ---: | ---: |
   | Fe(OH)₃ (Ferrihydrite) | 10⁻³⁸·⁷⁷⁹ (D2) | ~3–4 |
   | Zn(OH)₂(am) | 10⁻¹⁵·⁵⁰⁶ (D3) | ~7–9 (tùy T_Zn) |
   | Pb(OH)₂ | 10⁻¹⁹·⁸³⁰ (D1) | ~7–8 (tùy T_Pb) |

   > **Ngưỡng pH ở trên là xấp xỉ từ mô hình ideal I = 0 với baseline Ksp đã cross-checked.**
   > Kết luận "Pb kết tủa sớm hơn Zn ở pH 7" **chỉ áp dụng khi**: (a) phase rắn thực sự
   > hình thành là `Pb(OH)₂` (xem Water Research 1995 — đã quan sát `PbSO₄` anglesite,
   > `PbCO₃` cerussite, hydrocerussite thay vì Pb(OH)₂ trong hệ có sulfate/carbonate);
   > (b) kinetics cho phép Pb(OH)₂ kết tủa (một số pha có vẻ thuận lợi về nhiệt động
   > học nhưng không kết tủa do hạn chế động học); (c) không có co-precipitation/
   > adsorption đáng kể với Fe(OH)₃ (Zn có thể bị hấp phụ lên ferrihydrite — xem
   > Dyer et al.). Bản cũ ("Pb cần pH ≈ 8–9 mới kết tủa", "Zn kết tủa trước Pb")
   > dùng Ksp −15,3 cho Pb và không còn đúng với baseline đã cross-check; đã được
   > chuyển vào evidence register `WT-CHEM-NARRATIVE-LEGACY`. Narrative §6.5.5.1
   > mô tả **dự đoán mô hình có điều kiện** với baseline assumption D4 (Pb(OH)₂),
   > không khẳng định kết quả xử lý thực tế trong mọi mẫu nước.

   Ở pH 7, Fe gần kết tủa hết (capacity rất thấp), Zn mới bắt đầu (capacity còn cao),
   Pb chưa đáng kể. Bảng capacity ở mục 6.5.2 đã capture steady-state này — user không
   cần chờ Fe xong rồi Zn mới bắt đầu, mô hình cho kết quả cuối cùng tại `pH_target`
   trong 1 bước.

2. **OH⁻ budget chung** — tổng OH⁻ cần thêm bằng
   `OH_for_pH_adjustment + OH_total_precipitation` (xem mục 6.5.5). Nếu tổng này
   vượt **10 mmol NaOH** (= 10 mL cap × 1 M, mục 5.2.1), pH guard reject với
   `DOSE_LIMIT_EXCEEDED`. Hệ số tiêu thụ: Fe cần 3 OH⁻/Fe; Zn và Pb chỉ 2 OH⁻/M.
   → Mẫu nhiều Fe "đốt" OH⁻ nhanh hơn, để lại ít cho Zn/Pb. **Hệ quả:** với cùng
   mức pH target, mẫu Fe-dominant cần nhiều NaOH hơn mẫu Zn/Pb-dominant.

3. **Counter-ion cạnh tranh qua ionic strength** — 3 muối precursor (FeCl₃, ZnSO₄,
   Pb(NO₃)₂) cùng tan tạo Cl⁻, SO₄²⁻, NO₃⁻ chung dung dịch, đẩy ionic strength I lên.
   Ksp hiệu dụng tăng (γ⁺ × γ⁻² giảm ở I cao, làm [M²⁺][OH⁻]² cần cao hơn để vượt
   Ksp). MVP dùng Ksp ở I = 0; sai số tăng khi tổng muối > 0,1 M (xem cảnh báo ở
   mục 6.5.6).

**Hai tương tác vẫn không hỗ trợ trong MVP** (xem mục 6.5.6):

- **Co-precipitation**: Fe(OH)₃ kết tủa có thể kéo theo Zn²⁺/Pb²⁺ bằng adsorption
  hoặc inclusion — hiệu quả thực tế có thể cao hơn model. MVP bỏ qua.
- **Kinetics**: Fe kết tủa xong rồi Zn mới bắt đầu (có delay thực tế vài giây đến
  phút). MVP coi tức thì sau mix.

**Ví dụ minh họa (template, baseline đã cross-checked 16/10/2026):** V = 1 L, mẫu N = 3
với Fe = 10, Zn = 5, Pb = 0,3 mg/L, pH target = 9,0.

> **Số liệu dưới đây là template** từ mô hình ideal (§6.1.2 + §6.6) với baseline đã
> cross-checked bằng PHREEQC ngày 16/10/2026 (P0-D đã đóng). Một số con số placeholder
> trong bản cũ (pH initial = 1,87 hoặc 2,5; NaOH = 5,6 mL hoặc 0,82 mL; pH adjust
> OH⁻ = 0,023 mM) **đã bị loại bỏ** vì không nhất quán với charge balance; spec không
> khóa con số nào trong MVP, chỉ mô tả template để solver điền.

- **pH initial**: do solver §6.6 tính từ composition. Bản trước ghi "≈ 1,87" nhưng giá
  trị này không khớp với charge balance ideal 1-step hydrolysis của T_Fe = 0,179 mM
  (charge balance cho ra pH ~3–4 nếu không kết tủa, cao hơn khi tính kết tủa Fe(OH)₃).
  pH "1,87" chỉ nhất quán nội tại nếu T_Fe ~13 mM, gấp ~75 lần slider cap — không
  thể xảy ra với slider MVP. **Không dùng làm reference**.
- **OH⁻ tiêu thụ (template)**: solver §6.6 trả về theo các dòng ở §6.5.5; spec không
  commit con số nào.
- **Số liệu cũ (pH initial = 1,87 hoặc 2,5; NaOH = 5,6 mL hoặc 0,82 mL; pH adjust
  OH⁻ = 0,023 mM) đã bị loại bỏ** vì không nhất quán với charge balance. Bản cũ ghi
  "0,023 mM" cho pH adjust 1,87 → 9 nhưng charge balance đòi trung hòa ~T_H⁺ ban đầu
  (≈ 10 mM nếu pH initial = 1,87), chênh ~3 bậc log.
- **Kết quả dự kiến sau xử lý (pH 9)** — phụ thuộc solver; số liệu baseline D1/D3 cho thấy:
  - Fe_dissolved: ≈ 0 (capacity_Fe(9) = 1,6×10⁻²⁴ M ≪ T_Fe)
  - Zn_dissolved: ≈ 0 (capacity_Zn(9) = 3,0×10⁻⁶ M ≪ T_Zn ≈ 7,65×10⁻⁵ M)
  - Pb_dissolved: ≈ capacity_Pb(9) = 1,4×10⁻¹⁰ M ≈ 2,9×10⁻⁵ mg/L theo mô hình ideal —
    **kết quả này chỉ là dự đoán** có điều kiện (xem banner trên): phase rắn thực tế
    có thể là `Pb(OH)₂`, `PbSO₄` (anglesite), `PbCO₃` (cerussite) hoặc hydrocerussite
    tùy nền mẫu; kinetics và co-precipitation có thể thay đổi Pb còn lại trong dung
    dịch. Đảo ngược so với bản cũ dùng Ksp −15,3 (xem banner §6.5 và
    `WT-CHEM-NARRATIVE-LEGACY`).
    `calculatedOutcome` theo baseline = `success` cho kịch bản này. Hai-layer design
    (§4.1) vẫn yêu cầu `goalStatus = "unknown"` cho các P0 còn mở (P0-D đã đóng 16/10/2026;
    P0-A QCVN đã đóng 16/10/2026; P0-E LOD deferred; P0-C capacity 3 KL chưa
    cross-check; P0-F golden case).
- **Verify bằng PHREEQC** đã hoàn tất 16/10/2026 (xem `P0-D-CROSSCHECK-REPORT.md`):
  7 case PASS với sai số ≤ 0,004 đơn vị log. Ionic strength > 0,1 M và sulfate
  complexation vẫn là giới hạn của mô hình ideal I = 0 (chưa có activity correction
  trong MVP; xem §6.5.6).

#### 6.5.6. Không hỗ trợ trong MVP

- **Amphoteric Zn/Pb**: ở pH > 10, Zn(OH)₂ và Pb(OH)₂ bắt đầu tan lại thành Zn(OH)₃⁻
  và Pb(OH)₃⁻. Mô hình này nằm ngoài MVP; nếu user tăng pH quá 10, kết quả sẽ
  **lạc quan quá mức** (Zn/Pb trong dung dịch thực tế cao hơn model dự đoán). Cảnh báo
  UI: "pH > 10 có thể tái hòa tan Zn/Pb — mô hình chưa hỗ trợ."
- **Co-precipitation**: Fe(OH)₃ kết tủa có thể kéo theo Pb²⁺/Zn²⁺ bằng adsorption hoặc
  inclusion. Hiệu quả thực tế có thể cao hơn model đơn thuần Ksp. MVP bỏ qua.
- **Kinetics**: tốc độ kết tủa, thời gian đạt cân bằng, kích thước hạt. MVP coi là tức
  thì sau mix.
- **Ageing**: Ostwald ripening, recrystallization theo thời gian. MVP bỏ qua.
- **Crystallization vs amorphous**: Fe(OH)₃ có nhiều polymorph (Ferrihydrite, Goethite,
  Lepidocrocite…). MVP dùng **Ferrihydrite** làm **baseline assumption** (D2,
  `minteq.v4.dat` `log_k 3.191`, `logKsp = −38,779`); chưa model các polymorph khác.
- **Ionic strength correction**: Ksp ở I = 0 dùng cho mọi mẫu. Sai số tăng khi I > 0,1 M.
- **Baseline assumption đã cross-checked (P0-D đã đóng 16/10/2026)**: Ksp_Fe −38,779 (D2),
  Ksp_Zn −15,506 (D3), Ksp_Pb −19,830 (D1), phase identity (D4), H₂SO₄ pKa₂/logK
  convention (D5) hiện ở `cross-checked` sau khi 7 case chuyên biệt
  (P0-D §5.1.3) trong PHREEQC PASS 16/10/2026 với sai số ≤ 0,004 đơn vị log; solver
  **được phép** dùng trong chế độ `validated` cho chemistry. Limitation về pha rắn
  (xem mục tiếp theo) vẫn áp dụng. Hai-layer design (§4.1) vẫn yêu cầu
  `goalStatus = "unknown"` cho các P0 khác (P0-A/E/C/F) khi còn mở.
- **Pha rắn thực tế có thể khác baseline assumption**: trong hệ có sulfate/carbonate,
  nghiên cứu thực nghiệm (Water Research 1995, 10 mg/L Pb, pH 3,9–11,3) quan sát
  các pha rắn `PbSO₄` (anglesite), `PbCO₃` (cerussite) và hydrocerussite; phù hợp
  giữa mô hình và thực nghiệm phụ thuộc lựa chọn pha rắn. Một số pha có vẻ thuận
  lợi về nhiệt động học nhưng không kết tủa do hạn chế động học. MVP chỉ dùng
  `Pb(OH)₂` (D4) làm **baseline assumption**, không bao gồm anglesite/cerussite/
  hydrocerussite. Solver **không được** khẳng định "Pb đạt Cột A ở pH ≥ 7,5" như
  một kết luận chắc chắn cho mọi mẫu; phải ghi rõ đây là dự đoán mô hình có điều
  kiện với baseline assumption này. Bằng chứng experimental ghi trong evidence
  register `WT-EXP-PB-PRECIP-SO4-CO3` và `WT-EXP-ZN-SORB-FERRIHYDRITE`.
- **Zn có thể bị hấp phụ lên Fe(OH)₃ (ferrihydrite)**: nghiên cứu thực nghiệm
  (Dyer et al., Zn(II) sorption on ferrihydrite) cho thấy pH, ionic strength và
  nồng độ ảnh hưởng đáng kể phân bố Zn giữa dung dịch và pha rắn. Mô hình MVP
  hiện chỉ xét kết tủa hydroxide riêng từng kim loại; co-precipitation / adsorption
  Zn lên Fe(OH)₃ bị bỏ qua. Nếu user tick cả Fe và Zn, kết quả có thể over-predict
  Zn còn lại trong dung dịch so với thực nghiệm. Cảnh báo UI: "mô hình chưa tính
  Zn hấp phụ lên Fe(OH)₃ — kết quả Zn có thể cao hơn thực tế."

### 6.6. Solver algorithm — giải đồng thời pH, species, kết tủa, mass balance

> ⚠️ **Trạng thái MVP (cập nhật 16/10/2026 — P0-D đã đóng):** §6.6.x mô tả **thuật toán**
> solver. Baseline 6 hằng số (`WT-CHEM-K-FeOH`, `WT-CHEM-Ksp-Fe`, `WT-CHEM-Ksp-Zn`,
> `WT-CHEM-Ksp-Pb`, `WT-CHEM-pKa2-H2SO4`, `WT-CHEM-SOLID-PHASE`) đã ở `cross-checked`
> sau khi 7 case chuyên biệt §5.1.3 "Specialized cross-check cases" PASS trong
> PHREEQC 3.8.6-17100 trên database đã pin ngày 16/10/2026 (xem
> `tools/research/phreeqc-pin/3.8.6-17100/cases/P0-D-CROSSCHECK-REPORT.md`). Solver
> **được phép** dùng baseline mới trong chế độ `validated` cho chemistry. Hai-layer
> design (§4.1) vẫn yêu cầu `goalStatus = "unknown"` cho các P0 khác (P0-A/E/C/F)
> khi còn mở — đây là rào chắn pháp lý bắt buộc, không liên quan P0-D.

#### 6.6.0. Giới hạn mô hình hóa học của solver MVP (bắt buộc đọc)

Solver MVP dùng **mô hình giản lược** thay vì hệ cân bằng đầy đủ. Các giới hạn sau đây
là **chủ đích** trong MVP và phải được ghi rõ trong mọi nơi phát hành kết quả:

1. **Fe hydrolysis chỉ xét một bước** (`Fe³⁺ + H₂O ⇌ FeOH²⁺ + H⁺`, hằng số
   `K_FeOH`). Bỏ qua `Fe(OH)₂⁺`, `Fe(OH)₃(aq)`, `Fe(OH)₄⁻` và các polynuclear
   `Fe₂(OH)₂⁴⁺`, `Fe₃(OH)₄⁵⁺`. Sai số tăng ở pH > 3 và khi T_Fe > 1 mM.

2. **Hydroxo complex của Zn và Pb bị bỏ qua hoàn toàn**. Chỉ dùng cân bằng Ksp
   (`Zn(OH)₂(s) ⇌ Zn²⁺ + 2OH⁻`, tương tự Pb). Bỏ qua `Zn(OH)⁺`, `Zn(OH)₃⁻`,
   `Zn(OH)₄²⁻`, `Pb(OH)⁺`, `Pb(OH)₃⁻` và chloro-complex `PbCl⁺`, `PbCl₂(aq)`,
   `ZnCl⁺`, `ZnCl₂(aq)`. Ảnh hưởng đáng kể ở pH > 9 và khi [Cl⁻] > 0,05 M.

3. **Hoạt độ (activity) được giả định bằng nồng độ** (γ = 1 cho mọi species). Bỏ qua
   ionic strength correction (Debye-Hückel, Davies, v.v.). Sai số tăng khi tổng muối
   vượt 0,1 M; với mẫu benchmark 1 L (Fe ~ 10 mg/L, Zn ~ 5 mg/L, Pb ~ 0,3 mg/L),
   ionic strength ~ 1–3 mM nên assumption γ = 1 còn hợp lý.

4. **Pha rắn và Ksp baseline đã owner chốt D1–D5 ngày 16/10/2026 và đã cross-check
   thành công 16/10/2026** (7 case PHREEQC §5.1.3 PASS với sai số ≤ 0,004 đơn vị log).
   Baseline (Fe Ferrihydrite Ksp −38,779 / Zn(OH)₂(am) Ksp −15,506 / Pb(OH)₂ Ksp
   −19,830) lấy từ `minteq.v4.dat` (+ `phreeqc.dat`) PHREEQC 3.8.6-17100. Solver
   **được phép** dùng trong chế độ `validated`. Limitation về pha rắn (xem §6.5.6) vẫn
   áp dụng — baseline `Pb(OH)₂` không bao gồm anglesite/cerussite/hydrocerussite.

5. **Sulfate chỉ xét một proton hóa** (`SO₄²⁻ + H⁺ ⇌ HSO₄⁻`, pKa₂ ≈ 1,99). Bỏ qua
   `H₂SO₄(aq)` ở pH rất thấp và bỏ qua ion-pair `FeSO₄⁺`, `ZnSO₄(aq)`.

6. **Không xét carbonate / alkalinity** (§6.1.1 đã khóa TIC = 0, closed carbonate).
   Nghĩa là bỏ qua `HCO₃⁻`, `CO₃²⁻`, `FeCO₃⁺`, `PbCO₃(aq)`, v.v. — đây là giới hạn
   đã chốt trong MVP, không phải thiếu sót.

7. **Co-precipitation, ageing, kinetics** (§6.5.6): bỏ qua hoàn toàn.

**Quy tắc bắt buộc khi solver không đủ dữ liệu hoặc không hội tụ:**

- Solver **phải** trả `status: 'unresolved'` khi:
  - Không tìm được bracket `[pH_lo, pH_hi]` cho bisection (§6.6.2).
  - Fixed-point iteration không hội tụ sau 10 vòng với `|ΔT_M| < 10⁻⁶ mol/L`
    (§6.6.3).
  - Mass balance check thất bại (`|T_input - T_remaining - T_precipitated| > 1e-8`
    cho Fe/Zn/Pb/Cl/S/N/Na).
  - Charge balance check thất bại (`|Σc×z| > 10⁻⁹ mol/L`).
  - Ionic strength vượt 0,1 M (assumption γ = 1 không còn hợp lý).
- Khi solver trả `'unresolved'`:
  - `dissolvedCapacity` cho từng kim loại phải báo `unknown`.
  - `pHGuard` phải báo `pHGuardStatus: 'unresolved'` và `pHGuardReasonCode:
    'SOLVER_UNRESOLVED'`.
  - **Không được** tự động giả định kim loại đã bị loại bỏ. Không được gán
    `calculatedOutcome = 'success'` hoặc `'partial-success'`. Phải gán
    `calculatedOutcome = 'invalid'` với `invalidReasonCodes` chứa `'SOLVER_UNRESOLVED'`.
  - Sau đó two-layer design (§4.1) sẽ giữ `goalStatus = 'unknown'` nếu P0 còn mở,
    hoặc chuyển thành `'invalid'` nếu đã đủ điều kiện — nhưng UI vẫn phải hiển thị
    "không hợp lệ về mặt mô hình", không dùng "đạt / không đạt QCVN".

**Cảnh báo cho người triển khai:** Khi solver §6.6 trả về kết quả có vẻ "đẹp"
(ví dụ: Fe và Zn đều kết tủa hoàn toàn, mass balance OK), đây **chưa phải** là bằng
chứng rằng solver đã đúng. Do mô hình giản lược ở trên, nhiều hiệu ứng có thể bị
bỏ sót (đặc biệt hydroxo complex của Zn/Pb ở pH cao, chloro complex, ionic strength).
Trước khi dùng bất kỳ kết quả solver nào để so sánh với số liệu đo thực tế hoặc để
khẳng định "đạt QCVN", cần:

1. Chạy PHREEQC cross-check cho cùng composition và pH target (§6.5.5).
2. Hoàn thiện biểu thức capacity 3 kim loại với cross-check PHREEQC (P0-C).
3. Có ≥ 3 golden cases đã verify độc lập (P0-F).

Cho đến khi các P0 này đóng, mọi kết quả solver là **placeholder giáo dục**, không
có giá trị chứng nhận.

Các bước ở §6.1.2 và §6.5.3 không thể tách rời vì:
- Kết tủa hydroxide tiêu thụ OH⁻ (3 mol/Fe, 2 mol/Zn, 2 mol/Pb) → thay đổi charge balance
- Fe³⁺ hydrolysis giải phóng H⁺ → thay đổi pH → thay đổi Ksp capacity → thay đổi kết tủa
- Sulfate proton hóa ở pH thấp tiêu thụ H⁺ → ảnh hưởng pH

Vì vậy solver dùng **vòng lặp cố định (fixed-point iteration)** với convergence check
mỗi bước. Mục này định nghĩa thuật toán chung cho cả §6.1.2 (pH initial) và
§6.5.3 (sau `mix`).

#### 6.6.1. Đầu vào solver

- Composition: `T_Fe, T_Zn, T_Pb, T_Cl, T_S, T_N, T_Na` (mol/L) — từ slider + reagent
  đã cộng dồn.
- Hằng số: pKw, K_FeOH, K_SO4, Ksp_Fe, Ksp_Zn, Ksp_Pb.
- Guess khởi đầu: pH = 7,0 (neutral).

#### 6.6.2. Hệ phương trình cần giải

Solver giải đồng thời 3 loại cân bằng. Gọi `C_i(pH)` là nồng độ (mol/L) của
species `i` tại pH cho trước, và `z_i` là điện tích của nó.

**1. Cân bằng điện tích (charge balance):**

```
f(pH) = Σ C_i(pH) × z_i = 0

       = [H⁺] + 3·[Fe³⁺]_free + 2·[FeOH²⁺] + 2·[Zn²⁺]_free + 2·[Pb²⁺]_free + [Na⁺]
         − [OH⁻] − [Cl⁻] − 2·[SO₄²⁻] − [HSO₄⁻] − [NO₃⁻] = 0
```

Trong đó mỗi `C_i` là hàm của pH (thông qua Kw, K_FeOH, K_SO4, mass balance):

```
[H⁺]            = 10^(−pH)
[OH⁻]           = Kw / [H⁺]
[Fe³⁺]_free     = T_Fe / (1 + K_FeOH / [H⁺])
[FeOH²⁺]        = T_Fe × (K_FeOH / [H⁺]) / (1 + K_FeOH / [H⁺])
[Zn²⁺]_free     ≈ T_Zn                         (hydroxo bỏ qua, β₁ ≈ 10⁻⁹)
[Pb²⁺]_free     ≈ T_Pb                         (hydroxo bỏ qua, β₁ ≈ 10⁻⁷·⁷)
[HSO₄⁻]         = T_S × ([H⁺] / K_SO4) / (1 + [H⁺] / K_SO4)
[SO₄²⁻]         = T_S / (1 + [H⁺] / K_SO4)
```

**2. Cân bằng khối lượng nguyên tố (Fe, Zn, Pb, Cl, S, N, Na):** mỗi tổng nguyên tố
bằng input từ slider + reagent đã cộng dồn.

**3. Điều kiện bão hòa pha rắn:** nếu `T_M > C_{M^n+,free,sat}(pH)` thì phần vượt kết tủa.
Kết tủa tiêu thụ OH⁻, tạo vòng phản hồi → cần lặp.

**Thuật toán: bisection trên f(pH) = 0**

`f(pH)` là hàm **giảm đơn điệu** theo pH (tăng pH → giảm [H⁺], tăng [OH⁻], thay đổi
hydroxo ratio → tổng charge dương giảm). Bisection được dùng thay cho Newton-Raphson
vì:

- Hàm `f(pH)` có thể có đạo hàm gần 0 (flat region) → Newton-Raphson không ổn định.
- Đạo hàm `f'(pH)` phụ thuộc vào d[H⁺]/dpH, d[OH⁻]/dpH, và derivative của capacity
  qua Ksp — phức tạp để tính đúng.
- Bisection: **guaranteed convergence** miễn là tìm được `[pH_lo, pH_hi]` sao cho
  `f(pH_lo) > 0` và `f(pH_hi) < 0`.

```
# 1. Tìm bracket [pH_lo, pH_hi] với trái dấu
pH_lo = 0
pH_hi = 14
# Check f(0) và f(14)
if f(0) và f(14) cùng dấu:
  → mở rộng bracket: thử pH_lo = -1, pH_hi = 15
  → nếu vẫn cùng dấu: "không tìm được nghiệm trong miền [0; 14]"
  → trả unresolved

# 2. Bisection loop
while (pH_hi - pH_lo) > 0.001:
  pH_mid = (pH_lo + pH_hi) / 2
  if f(pH_mid) > 0:        # dư charge dương → thiếu anion → pH quá thấp
    pH_lo = pH_mid
  else:                     # dư charge âm → thiếu cation → pH quá cao
    pH_hi = pH_mid

# 3. Sau khi pH hội tụ, tính species
→ Tính all species concentrations tại pH = (pH_lo + pH_hi) / 2
→ Kiểm tra precipitation: T_M vs C_{M^n+,free,sat}(pH)
→ Nếu có kết tủa: cập nhật T_M_new = T_M - precipitated, quay lại bước 1
```

**Tại sao không dùng Newton-Raphson:** mỗi lần gọi `f(pH)` phải tính lại toàn bộ
speciation + precipitation, và `f'(pH)` = `df/d(pH)` yêu cầu đạo hàm của từng
species theo pH — tức đạo hàm của `1/(1+K/[H⁺])`, `[HSO₄⁻]`, và capacity(Ksp, pH).
Một lỗi đạo hàm → không hội tụ hoặc hội tụ sai. **Bisection tránh hoàn toàn vấn đề
này.**

**Max iterations:** 100 (cho outer loop × bisection × inner precipitation check).

**Convergence tolerance:** bisection tolerance `|pH_hi - pH_lo| < 0,001`. Charge balance
tại nghiệm phải thỏa `|f(pH)| < 10⁻⁹ mol/L`.

**Vấn đề mở (chưa triển khai trong MVP):** thuật toán bisection trên yêu cầu
`f(pH_lo) × f(pH_hi) < 0` (trái dấu). Với composition cực đoan (rất nhiều muối,
hoặc ionic strength cao), `f(0)` và `f(14)` có thể cùng dấu → không có bracket → solver
thất bại. Cần xử lý bằng cách thử nhiều bracket hoặc dùng Brent method. Đánh dấu
`status: 'unresolved'` nếu không tìm được bracket.

#### 6.6.3. Tiêu chí dừng và xử lý thất bại

| Điều kiện | Hành động |
| --- | --- |
| `pH_hi - pH_lo < 0,001` **AND** `|f(pH)| < 10⁻⁹ mol/L` | Hội tụ → trả kết quả |
| `pH_hi - pH_lo < 0,001` nhưng `|f(pH)| ≥ 10⁻⁹` | Bug, trả `unresolved` |
| Bisection > 30 bước (tương ứng `pH_hi - pH_lo < 10⁻⁹`) mà chưa hội tụ | Đã đạt tolerance, return |
| Không tìm được bracket `f(pH_lo) × f(pH_hi) < 0` | Trả `unresolved`, lý do: "no bracket — composition ngoài miền giải" |
| Sau kết tủa, recompute bracket mà f(0)/f(14) cùng dấu | Trả `unresolved`; có thể do capacity âm hoặc tổng muối cực lớn |
| pH ra ngoài `[0; 14]` | Trả `unresolved`, lý do: "pH vượt solver domain" |

**Outer loop (precipitation iteration):** sau khi bisection hội tụ tại pH_mid, tính
precipitated_M, cập nhật T_M_new, **gọi lại bisection** với T_M mới. Lặp tối đa 10 lần;
dừng khi `|ΔT_M| < 10⁻⁶ mol/L` cho mỗi M.

#### 6.6.4. Kiểm tra biên sau hội tụ

> **Quy ước đơn vị nội bộ của solver:** solver hoạt động hoàn toàn trong miền
> **mol/L** (nồng độ mol trong 1 L dung dịch). Kết quả `precipitateByMetal_mol`
> trong state là **tổng mol trong toàn mẫu** (§4.2.4), tức `mol/L × V_sample_L`.
> **Phải nhân với `V_sample_L` khi lưu vào state.** Sai quy ước này dẫn đến
> mass balance sai ~1000 lần khi V ≠ 1 L.
>
> **Hai lớp kiểm tra mass balance — phục vụ hai mục đích khác nhau, dùng hai biến
> riêng, không dùng chung `MASS_BALANCE_RESIDUAL`:**
>
> | Lớp | Biến | Đơn vị | Giá trị | Mục đích |
> |---|---|---|---|---|
> | **Solver arithmetic** | `MASS_BALANCE_SOLVER_TOL` | mol/L (tuyệt đối) | `1×10⁻⁸` | Kiểm tra hội tụ số học và phương trình nguyên tố trong solver |
> | **Sample-level** | `MASS_BALANCE_SAMPLE_TOL` | % tương đối so với tổng mol input | **`±2%`** *(đã chốt O9 ngày 16/10/2026; xem evidence register §5.1.4)* | Kiểm tra khối lượng giữa filtrate, sludge nước kèm và kết tủa (sample-level) |

Sau khi solver hội tụ, phải kiểm tra:

1. **Mass balance nguyên tố trong solver** (arithmetic): `|T_input_mol_L − T_remaining_mol_L − T_precipitated_mol_L| < MASS_BALANCE_SOLVER_TOL = 1×10⁻⁸ mol/L` cho mỗi nguyên tố (Fe, Zn, Pb, Cl, S, N, Na). Nếu fail → bug, trả `unresolved`.
2. **Charge balance**: `|Σc×z| < 10⁻⁹ mol/L`. Nếu fail → bug, trả `unresolved`.
3. **Giả định hợp lệ**:
   - `[FeOH²⁺] < 0,1 × T_Fe` (nếu không, hydroxo cao hơn bậc 1 có thể chiếm ưu thế; cảnh báo nhưng vẫn commit)
   - `[HSO₄⁻] < 0,5 × T_S` (nếu không, pH thấp, sulfate chủ yếu ở HSO₄⁻; cảnh báo)
4. **Kết quả lưu vào state** (nội bộ solver: mol/L → **NHÂN VỚI V_sample_L** → lưu tổng mol):
   - `initialPH` hoặc `pH_predicted`
   - `T_M_dissolved_after` (mol/L) cho mỗi M → **NHÂN VỚI V_sample_L** → lưu tổng mol vào state
   - `precipitateByMetal_mol` (**tổng mol trong toàn mẫu**, không phải mol/L) cho mỗi M
   - `pHGuardSnapshot` (status, reasonCode, pHModelMin, pHModelMax)
5. **Mass balance toàn mẫu** (sample-level, chạy **sau** khi `filter` ở §7.4.5):
   `|M_filtrate_dissolved + M_sludge_dissolved + M_sludge_precipitated − M_input| / M_input × 100% < MASS_BALANCE_SAMPLE_TOL = 2%`
   cho mỗi nguyên tố. Biến: `MASS_BALANCE_SAMPLE_RESIDUAL_PCT` (%). Nếu fail → `calculatedOutcome = 'invalid'`, `errorCode: 'MASS_BALANCE_FAILED'`.

#### 6.6.5. Khi nào KHÔNG dùng solver này

- pH vượt `[0; 14]`: bị loại bỏ bởi pH guard trước khi vào solver.
- Tổng muối > 0,1 M (ionic strength cao): sai số do γ ≠ 1 đáng kể; solver vẫn chạy
  nhưng **kết quả phải kèm flag `I_HIGH_APPROX`** để UI cảnh báo sai số.
- pH target > 10: hydroxo bậc 2+ (Zn(OH)₃⁻, Pb(OH)₃⁻, Fe(OH)₄⁻) có thể chiếm ưu thế
  → solver không hợp lệ, đã có cảnh báo ở §6.5.6.

### 6.7. Species bundle và solid phase assumption

#### 6.7.1. Species bundle (MVP)

Các species hòa tan được engine **hỗ trợ** (tính toán đầy đủ):

| Species | Charge | Phản ứng tạo thành | Hằng số | Claim key |
| --- | ---: | --- | --- | --- |
| H⁺ | +1 | H₂O ⇌ H⁺ + OH⁻ | pKw = 13,990 | `AN-KW-25C` |
| OH⁻ | -1 | H₂O ⇌ H⁺ + OH⁻ | (Kw) | (cùng trên) |
| Fe³⁺ (free) | +3 | FeCl₃ → Fe³⁺ + 3 Cl⁻ | — | — |
| FeOH²⁺ | +2 | Fe³⁺ + H₂O ⇌ FeOH²⁺ + H⁺ | log K = -2,19 | `WT-CHEM-K-FeOH` |
| Zn²⁺ (free) | +2 | ZnSO₄ → Zn²⁺ + SO₄²⁻ | — | — |
| Pb²⁺ (free) | +2 | Pb(NO₃)₂ → Pb²⁺ + 2 NO₃⁻ | — | — |
| Na⁺ | +1 | NaOH → Na⁺ + OH⁻ | — | — |
| Cl⁻ | -1 | (cation đi kèm) | — | — |
| SO₄²⁻ | -2 | (cation đi kèm) | — | — |
| HSO₄⁻ | -1 | SO₄²⁻ + H⁺ ⇌ HSO₄⁻ | pKa2 ≈ 1,99 | `WT-SO4-PKA2-25C` (claim mới) |
| NO₃⁻ | -1 | (cation đi kèm) | — | — |

Các species **chưa hỗ trợ** trong MVP (có thể ảnh hưởng ≥ 1% ở một số pH):

- `Fe(OH)₂⁺`, `Fe(OH)₃(aq)`, `Fe(OH)₄⁻` — bậc 2-4 Fe hydroxo
- `ZnOH⁺`, `Zn(OH)₂(aq)`, `Zn(OH)₃⁻`, `Zn(OH)₄²⁻` — Zn hydroxo đầy đủ
- `PbOH⁺`, `Pb(OH)₂(aq)`, `Pb(OH)₃⁻` — Pb hydroxo đầy đủ
- `ZnSO₄(aq)`, `Zn(SO₄)₂²⁻` — phức zinc-sulfate
- `PbCl⁺`, `PbCl₂(aq)`, `PbCl₃⁻`, `PbCl₄²⁻` — phức lead-chloride
- `FeCl²⁺`, `FeCl₂⁺` — phức iron-chloride (có thể đáng kể trong mẫu nhiều Cl⁻)
- Các phức carbonate (TIC = 0, đã loại khỏi MVP theo §6.1.1)
- Các phức hữu cơ, complexant, chelate (chưa có trong scenario)

#### 6.7.2. Solid phase (pha rắn giả định)

| KL | Công thức rắn | Pha rắn giả định | Ghi chú |
| --- | --- | --- | --- |
| Fe(OH)₃ | Fe(OH)₃(s) | **Amorphous Fe(OH)₃** | Ksp phụ thuộc pha; amorphous có Ksp cao hơn crystalline (goethite, hematite). Baseline giả định `Ferrihydrite` (D2), nguồn primary `minteq.v4.dat` `log_k 3.191`. `phreeqc.dat` KHÔNG có phase `Ferrihydrite` riêng → không dùng để verify Ksp Fe |
| Zn(OH)₂ | Zn(OH)₂(s) | **Zn(OH)₂(am)** (baseline D3, `minteq.v4.dat` `log_k 12.474`) | `minteq.v4.dat` có 5 hydroxide pha (am, β, γ, ε); baseline chọn `Zn(OH)₂(am)` vì giả định kết tủa nhanh; phase khác (β, γ, ε) chưa được model trong MVP. **`phreeqc.dat` không có Ksp solid `Zn(OH)₂(am)`** — chỉ có hydrolysis constant `Zn²⁺ + 2H₂O ⇌ Zn(OH)₂(aq) + 2H⁺` (`−log_k −16.9`), là hằng số tạo loài hòa tan, không phải Ksp |
| Pb(OH)₂ | Pb(OH)₂(s) | **Basic lead hydroxide** (baseline D4) | Công thức thực nghiệm thường ghi PbO·H₂O hoặc Pb(OH)₂; baseline Ksp = −19,830 từ `minteq.v4.dat` (D1, chốt 16/10/2026, `log_k 8.15`). `phreeqc.dat` cùng phase `Pb(OH)₂` với cùng `log_k 8.15` (alternative storage trong cùng bản phát hành PHREEQC) — **KHÔNG phải nguồn độc lập**, không dùng để xác nhận độc lập |

**Yêu cầu cho evidence register:** mỗi Ksp claim phải kèm **tên pha rắn**, nguồn,
quy ước nhiệt độ, quy ước activity (ideal/concentration). Không ghi con số Ksp đơn
lẻ mà không kèm metadata pha rắn — vi phạm nguyên tắc IUPAC S05742.

#### 6.7.3. Activity model

- **Mô hình:** ideal, **γ = 1** cho mọi ion, nồng độ ≈ hoạt độ.
- **Điều kiện áp dụng:** tốt cho I < 0,01 M (Davis eq.) hoặc I < 0,1 M với sai số
  nhỏ; sai số tăng khi I > 0,1 M.
- **I trong mẫu MVP:** I = 0,5 × Σ(c_i × z_i²). Với 100 mg/L Fe + 100 mg/L Zn +
  100 mg/L Pb trong 1 L: I ≈ 0,008 M (ok). Với slider max × 3 KL × 1,8 mM = ~5 mM
  → I ≈ 0,008 M. **Vẫn nằm trong miền ideal.**
- **Khi nào vượt ideal:** nếu user dùng HCl/NaOH quá nhiều (tổng > 10 mM), I có thể
  lên ~0,015 M. Vẫn chấp nhận được nhưng nên cảnh báo.
- **Tương lai:** phase 2 có thể thêm Davies equation hoặc Debye-Hückel; hiện không
  trong MVP.

## 7. Các họ quy trình xử lý

### 7.1. Quy trình cơ bản

```text
Tạo mẫu
→ Đo đầu vào
→ Chọn base/acid
→ Thêm liều nhỏ
→ Trộn
→ Chờ lắng
→ Lọc
→ Đo Fe/Zn/Pb và pH
→ Lặp hoặc hoàn tất
```

### 7.2. Quy trình điều chỉnh pH hai chiều

Mẫu axit dùng base để tiến đến vùng kết tủa; mẫu bazơ dùng acid để đưa pH về vùng vận
hành. Sau mỗi lần đổi chiều phải ghi nhận chi phí, thể tích và revision mới.

### 7.3. Quy trình mục tiêu một kim loại

Người học chọn Fe, Zn hoặc Pb làm mục tiêu. Các kim loại còn lại vẫn phải được đo và hiển
thị; không được coi một lượt thành công nếu chỉ mục tiêu chính đạt nhưng chất khác vượt giới hạn.

### 7.4. Quy trình xử lý hydroxide chi tiết

Sau khi Pre-treatment Assessment (mục 5.1.1) có ít nhất một ✗, workflow tiếp tục theo
quy trình hydroxide. Mục 6.5 định nghĩa mô hình hóa học; mục này định nghĩa workflow.

**Tổng quan 7 bước:**

```text
Bước 1: Chọn pH mục tiêu         (7.4.1)
Bước 2: Điều chỉnh pH             (7.4.2)
Bước 3: Tạo kết tủa hydroxide     (7.4.3)
Bước 4: Lắng                       (7.4.4)
Bước 5: Lọc                        (7.4.5)
Bước 6: Đo sau xử lý              (7.4.6)
Bước 7: So sánh với Cột A          (7.4.7)
```

#### 7.4.1. Chọn pH mục tiêu

> **Narrative dưới đây dùng baseline mới D1/D2/D3 chốt 16/10/2026** (Ksp Fe −38,779
> Ferrihydrite, Ksp Zn −15,506 Zn(OH)₂(am), Ksp Pb −19,830 Pb(OH)₂, pKw 13,990 —
> xem §6.5.1 provenance table). Narrative cũ dùng Ksp legacy (−38,6 Fe, −16,9 Zn,
> −15,3 Pb) đã được chuyển vào evidence register "Discrepancy log vs current spec
> §6.5" — KHÔNG phải narrative hiện hành.

User có 2 chọn lựa:

- **Auto (mặc định):** simulator đề xuất `pH_target` đủ để **cả Fe, Zn và Pb đạt Cột A**
  với baseline mới. Từ bảng §6.5.2:
  - Fe đạt thoải mái từ pH ≥ ~3 (capacity ≪ 2,0 mg/L).
  - Zn cần pH ≥ ~8,6 để capacity ≪ 1,0 mg/L.
  - Pb đạt từ pH ≥ ~7,5 (capacity ≈ 0,029 mg/L ≪ 0,1 mg/L).
  - → auto = **9,0** (pH lớn nhất trong Cột A mà cả 3 kim loại đều đạt; vẫn nằm dưới pH trần 9 của QCVN).
- **Manual:** user pick `pH_target` từ slider 6,5–10,5.
  - Nếu pH < 8: cảnh báo "pH này có thể không đủ để kết tủa Zn về dưới 1 mg/L
    (capacity Zn ở pH 8 ≈ 19,5 mg/L với baseline mới)."
  - Nếu pH > 9: cảnh báo "pH > 9 vượt giới hạn trên của Cột A — chỉ đạt pH sau khi
    trung hòa ngược."
  - Nếu pH > 10: cảnh báo thêm "pH > 10 có thể tái hòa tan Zn/Pb (mục 6.5.6)."

**Output:** `state.processRoute.pHTarget = number` (pH đã chốt cho vòng này).

#### 7.4.2. Điều chỉnh pH

**Bước 2a — Dự đoán lượng NaOH/HCl cần:**

- Nếu `pH_current < pH_target`: thêm NaOH ảo (mục 5.2, pH guard).
- Nếu `pH_current > pH_target`: thêm HCl ảo.
- Nếu `|pH_current - pH_target| < 0,1`: bỏ qua, chuyển sang bước 2c.

**Bước 2b — Chia liều nhỏ:**

- Dùng mô hình pH (mục 6.1.1) để dự đoán pH sau mỗi liều.
- Mỗi liều không vượt `maxSingleDose` (khóa trong bundle, vd 0,5 mL NaOH 1M).
- Lặp cho đến khi `|pH_predicted - pH_target| < tolerance` (mặc định 0,1).
- Nếu sau N liều mà vẫn không đạt tolerance → `PH_GUARD_EXCEEDED`, yêu cầu user
  chỉnh `pH_target` hoặc chấp nhận pH gần target.

**Bước 2c — Commit:**

- Mỗi lần `add_reagent` tăng `compositionRevision`.
- Mỗi lần commit phải qua pH guard (mục 5.2):
  - `predictedPH ∈ [pHModelMin, pHModelMax]`
  - Liều không vượt bundle
  - Species không bị `unresolved`
- Nếu guard fail → reject, yêu cầu chỉnh liều.

**Output:** `state.pH = pH_target ± tolerance`, đã commit vào `additions[]`.

#### 7.4.3. Tạo kết tủa hydroxide

Sau khi mix xong ở bước 2 (cũng chính là `mix` action trong mục 5), simulator chạy
mô hình kết tủa (mục 6.5.3):

```text
T_M_dissolved_after = min(T_M_dissolved_before, capacity_M(pH_target))
```

`T_M_dissolved_before` và `T_M_dissolved_after` là **nồng độ mol/L** (kết quả của solver
§6.6, output ở dạng concentration).

**Mass balance update (state.solids, đơn vị mg và tổng mol):**

Hai nhóm trường trong `SolidInventory` được cập nhật đồng thời:

*Tổng mol kết tủa trong toàn mẫu* (dùng cho mass balance §6.3, §7.4.5):

> **Lưu ý đơn vị:** `precipitateByMetal_mol` lưu **tổng mol** (mol trong toàn bộ mẫu),
> không phải mol/L. Khi cộng dồn từ `precipitated_M` (mol/L), phải nhân với
> `V_sample_L = volumeMl / 1000`.

```text
V_sample_L = sample.volumeMl / 1000
solids.precipitateByMetal_mol.Fe += precipitated_Fe × V_sample_L    # tổng mol Fe kết tủa
solids.precipitateByMetal_mol.Zn += precipitated_Zn × V_sample_L    # tổng mol Zn kết tủa
solids.precipitateByMetal_mol.Pb += precipitated_Pb × V_sample_L    # tổng mol Pb kết tủa
```

*Khối lượng khô theo mg* (dùng cho hiển thị §9.1, tính trực tiếp từ mol/L × thể tích):

```text
solids.sludgeMassDry_mg.feoh3 += precipitated_Fe × V_sample_L × M_Fe(OH)3 × 1000
                                = precipitated_Fe × V_sample_L × 106870     (mg)
solids.sludgeMassDry_mg.znoh2 += precipitated_Zn × V_sample_L × 99400        (mg)
solids.sludgeMassDry_mg.pboh2 += precipitated_Pb × V_sample_L × 241200       (mg)
solids.totalSludgeMassDry_mg = feoh3 + znoh2 + pboh2                        (mg)
```

> **Không có** field `totalMass_g` — tất cả khối lượng dùng mg. Nếu cần g, chia cho 1000
> tại nơi hiển thị.

**Edge case — không có kết tủa:**

- Nếu pH_target quá thấp (vd 6,5) và capacity > dissolved: không có kết tủa.
- Tất cả kim loại vẫn ở dạng hòa tan. Đây là kết quả hợp lệ, không phải lỗi.
- Nếu user pick pH_target = 6,5 với Fe/Zn/Pb trong giới hạn đầu vào: mẫu vẫn có thể
  pass Cột A nếu concentrations đã dưới ngưỡng.

**Edge case — pH quá cao:**

- Nếu pH > 10, cảnh báo mục 6.5.6 (amphoteric chưa hỗ trợ).
- Mô hình vẫn chạy với Ksp thuần, có thể cho kết quả lạc quan.

**Output:** state đã có `solids` updated, `phase = 'reagent-added'` → `mixed`.

#### 7.4.4. Lắng (wait_settle)

- Educational step, KHÔNG phải kinetics (mục 6.1).
- Thời gian UI: cố định 30 giây cho MVP.
- Trong thời gian lắng:
  - pH **không đổi** (closed system, không CO₂ exchange).
  - pH model re-run (mục 6.1.1 scenario c) → confirm pH vẫn ổn định.
  - Sludge lắng xuống đáy, clarified water ở trên (mô hình hóa, không tính chi tiết).
- Không có action mới — chỉ là `wait_settle` đã có ở mục 5.

**Output:** `phase = 'settled'`, sludge + clarified water đã phân lớp (logic state).

#### 7.4.5. Lọc (filter)

- Tách sludge (chứa Fe(OH)₃, Zn(OH)₂, Pb(OH)₂ + nước kèm) khỏi clarified water.
- Tạo 2 stream mới:
  - **Filtrate stream**: chứa nước đã lọc, V_filtrate ≈ 0,9 × V_before (giả định 10%
    nước theo sludge).
  - **Sludge stream**: chứa rắn + 10% nước, V_sludge ≈ 0,1 × V_before.
- Filtrate chứa phần kim loại hòa tan còn lại (sau kết tủa 7.4.3).
- Sludge chứa toàn bộ kết tủa.

**Mass balance check:**

Mass balance check dùng khối lượng (mg) trên toàn bộ mẫu:

```text
M_Fe_in  = M_Fe_filtrate_dissolved + M_Fe_sludge_dissolved + M_Fe_sludge_precipitated
M_Zn_in  = M_Zn_filtrate_dissolved + M_Zn_sludge_dissolved + M_Zn_sludge_precipitated
M_Pb_in  = M_Pb_filtrate_dissolved + M_Pb_sludge_dissolved + M_Pb_sludge_precipitated
```

Trong đó tất cả M_* đều là **khối lượng mg** trên toàn bộ mẫu gốc:

*Filtrate stream (V_filtrate ≈ 0,9 × V_before):*
- `M_filtrate_dissolved = T_dissolved_after (mol/L) × (V_filtrate / 1000) (L) × M_metal × 1000`
  → đơn giản: `T_dissolved_after × V_filtrate × M_metal` (mg trên toàn mẫu gốc)

*Sludge stream (V_sludge ≈ 0,1 × V_before, 10% nước kèm):*
- `M_sludge_dissolved = T_dissolved_after × V_sludge × M_metal` (mg dissolved còn lại trong 10% nước)
- `M_sludge_precipitated = precipitate_metal_mol_L × V_sample_L × M_metal × 1000` (mg từ §6.5.3)
  → ví dụ Fe: `precipitate_metal_mol_L × V_sample_L × 55,845 × 1000`
  = `precipitate_metal_mol_L × V_sample_L × 55845` mg
  (**KHÔNG** dùng `precipitate_metal` thẳng — biến này là mol/L nội bộ solver, phải
  nhân V_sample_L trước khi nhân M_metal × 1000)

*Đơn vị trong WaterStream (type §4.2.5):* `dissolvedFe_mg` và `solidFe_mg` là khối lượng mg
của stream đó, không phải nồng độ. Nồng độ tính tại chỗ:
`concentration (mg/L) = mass_mg × 1000 / volumeMl` (xem §4.2.7 quy ước đơn vị toàn schema).

**Tỉ lệ nước kèm sludge** (mặc định 10%) là assumption giáo dục. Có thể chỉnh trong
bundle nhưng MVP khóa 10%. Sai số của assumption này ảnh hưởng mass balance — phải ghi
trong `MASS_BALANCE_SAMPLE_RESIDUAL_PCT` (xem §6.6.4 mục 5).

**Sample-level mass balance check (§6.6.4 mục 5):**

```text
M_total = M_filtrate_dissolved + M_sludge_dissolved + M_sludge_precipitated     (mg)
M_input = T_input_mol_L × V_sample_L × M_metal × 1000                            (mg)
MASS_BALANCE_SAMPLE_RESIDUAL_PCT = |M_total − M_input| / M_input × 100%          (%)
pass nếu MASS_BALANCE_SAMPLE_RESIDUAL_PCT < MASS_BALANCE_SAMPLE_TOL (= 2%)
```

> **Lưu ý:** `MASS_BALANCE_SAMPLE_TOL` (±2%) và `MASS_BALANCE_SOLVER_TOL` (1×10⁻⁸ mol/L)
> phục vụ hai mục đích khác nhau. Sample-level dùng đơn vị % và kiểm tra tổng
> khối lượng mg; solver-level dùng đơn vị mol/L và kiểm tra arithmetic. Không
> dùng chung một biến `MASS_BALANCE_RESIDUAL`.

**Output:** `state.streams = [filtrate, sludge]`, `phase = 'filtered'`.

#### 7.4.6. Đo sau xử lý

- Đo pH và Fe/Zn/Pb của **filtrate** (không phải sludge).
- Lưu vào `measurements[]` với `streamId = filtrate stream`.
- pH được verify với pH model (mục 6.1.1) trên filtrate.
- Nếu `|pH_predicted - pH_measured| > 0,1` → ghi event `ph_measurement_mismatch`.
- Fe/Zn/Pb trong filtrate = **T_dissolved_after (mg/L)** — nồng độ cân bằng sau xử lý,
  giả định kim loại hòa tan phân bố đồng nhất. Không dùng công thức pha loãng
  `T_dissolved × V_filtrate / V_sample` vì không có thêm nước hay trộn dòng.
  Khối lượng trong filtrate: `M_filtrate = T_dissolved_after × V_filtrate × M_metal` (mg).

**Output:** `state.measurements += [{phase: 'after-treatment', stream: 'filtrate', pH, Fe, Zn, Pb}]`.

#### 7.4.7. So sánh với Cột A (Post-treatment Assessment)

**Ba trường hợp phép đo — xử lý riêng:**

> ⚠️ **LOD ≠ dải đo hợp lệ:** LOD (Limit of Detection) chỉ áp dụng cho Fe/Zn/Pb.
> pH không có LOD — thay vào đó có **khoảng đo hợp lệ** (ví dụ 0–14), **độ phân giải**
> (ví dụ 0,01 pH) và **độ chính xác** (ví dụ ±0,05 pH). §16.1 P0-E cần khóa cả
> pH (accuracy/resolution) lẫn Fe/Zn/Pb (LOD).

**Trường hợp A — Phép đo hợp lệ, kết quả định lượng:**
- compositionRevision khớp, phase = 'after-treatment', stream = 'filtrate', thực hiện
  sau filter.
- Fe/Zn/Pb ≥ LOD tương ứng; pH trong khoảng đo hợp lệ.
- → Dùng giá trị để so sánh với mục tiêu.

**Trường hợp B — Giá trị dưới LOD (Fe/Zn/Pb):**
- compositionRevision khớp, nhưng giá trị kim loại < LOD.
- → Ghi `'<LOD'` cho kim loại đó. **Không dùng** để tính pass/fail.
- **Quy tắc kết luận khi giá trị dưới LOD:**
  - Nếu `LOD ≤ ngưỡng mục tiêu`: kết luận **đạt an toàn** (giá trị thực ≤ LOD ≤ ngưỡng).
  - Nếu `LOD > ngưỡng mục tiêu`: **không đủ dữ liệu** → `calculatedOutcome` giữ
    nguyên, ghi event `insufficient_data_for_conclusion`, user được thông báo.
  - **Không** tự động coi dưới LOD là 'success' hay 'failed'.
- Trường hợp này **không** phải 'invalid'.

**Trường hợp C — Phép đo không hợp lệ:**
- compositionRevision không khớp, hoặc phép đo không thuộc phase/stream đúng, hoặc
  pH nằm ngoài khoảng đo hợp lệ, hoặc có lỗi thiết bị ghi nhận.
- → Ghi event tương ứng, trả `calculatedOutcome = 'invalid'`,
  `errorCode = 'MEASUREMENT_INVALID'`.

**Bảng so sánh** filtrate với mục tiêu mô phỏng Cột A (mục 2.2 — **đã xác minh
pháp lý** với Thông tư 06/2025/TT-BTNMT, xem §16.1 P0-A và evidence register §5.1):

| Thông số | Giá trị (filtrate) | Mục tiêu MVP (placeholder) | Kết quả |
| --- | --- | --- | --- |
| pH | (đo được) | 6–9 | ✓ / ✗ |
| Fe | (đo được) mg/L | ≤ 2,0 mg/L | ✓ / ✗ |
| Zn | (đo được) mg/L | ≤ 1,0 mg/L | ✓ / ✗ |
| Pb | (đo được) mg/L | ≤ 0,1 mg/L | ✓ / ✗ |

**Quyết định (two-layer design — kiểm tra tính hợp lệ TRƯỚC khi đánh giá kết quả):**

```text
sample_mass_balance_ok = MASS_BALANCE_SAMPLE_RESIDUAL_PCT < MASS_BALANCE_SAMPLE_TOL (= 2%)
all_pass              = (pH ✓) AND (Fe ✓) AND (Zn ✓) AND (Pb ✓)

-- Bước 1: kiểm tra sample-level mass balance (chạy ở §7.4.5)
if not sample_mass_balance_ok:
  → phase = 'verified'
  → calculatedOutcome = 'invalid'
  → errorCode: 'MASS_BALANCE_FAILED'

-- Bước 2: đánh giá kết quả (chỉ khi mass balance đã đạt)
elif all_pass:
  → phase = 'verified'
  → calculatedOutcome = 'success'

elif not all_pass:
  -- Kiểm tra từng thông số để phân biệt partial-success vs failed
  pH_pass = (pH ✓)
  Fe_pass = (Fe ✓)
  Zn_pass = (Zn ✓)
  Pb_pass = (Pb ✓)

  -- partial-success: pH, Fe, Zn đạt; Pb không đạt; mass balance đã đạt (đã qua bước 1)
  if pH_pass AND Fe_pass AND Zn_pass AND not Pb_pass:
    → phase = 'verified'
    → calculatedOutcome = 'partial-success'
  else:
    -- failed: có ít nhất một trong pH/Fe/Zn không đạt
    → phase = 'verified'
    → calculatedOutcome = 'failed'

-- Bước 3: gán goalStatus cuối cùng (two-layer enforcement):
-- Post-treatment cần đóng P0-A..P0-F (đủ để khẳng định kết quả cuối cùng).
openBlockers = các P0 chưa đóng trong [P0-A..P0-F]
goalStatus = finalizeOutcome(calculatedOutcome, openBlockers)
```

**Quy tắc UI bắt buộc khi hiển thị post-treatment outcome:**

- `'success'` (P0-A đã đóng): tiêu đề **"Đạt mục tiêu mô phỏng Cột A"**; phụ đề
  **"Quy trình xử lý đưa filtrate về ngưỡng mục tiêu MVP. Ngưỡng này đã xác minh
  pháp lý với Thông tư 06/2025/TT-BTNMT (P0-A đóng 16/10/2026, xem §16.1 và
  evidence register §5.1)."** Không dùng đơn thuần "đạt QCVN".
- `'partial-success'` / `'failed'`: **"Vượt mục tiêu mô phỏng Cột A ở một số thông số"**;
  không dùng "không đạt QCVN".
- `'unknown'` (P0 còn mở): **"Chưa xác định — chờ xác minh"** kèm danh sách P0 blockers.
- `'invalid'` (mass balance fail, dose cap exceeded): **"Không hợp lệ về mặt mô hình"**
  kèm `errorCode`; không dùng "không đạt QCVN".

**Đặc biệt cho hydroxide route (narrative đã cập nhật 16/10/2026 theo baseline cross-checked):**

- Với baseline Ksp `Pb(OH)₂` = 10⁻¹⁹·⁸³⁰ đã cross-checked bằng `GC-PREC-03`, **Pb đạt
  Cột A thoải mái từ pH ≥ ~7,5** (capacity ≈ 0,029 mg/L ≪ 0,1 mg/L) và đạt với
  margin rất lớn ở pH 9 (capacity ≈ 2,9×10⁻⁵ mg/L). Kết quả `calculatedOutcome` cho
  mẫu chuẩn Fe 10 + Zn 5 + Pb 0,3 mg/L tại pH 9 = `success` (cả 3 đạt Cột A theo
  ideal model I = 0).
- **Zn** là kim loại ranh giới: cần pH ≥ ~8,5 để capacity ≪ 1,0 mg/L (tại pH 8,5
  capacity = 1,95 mg/L ~ 2× Cột A; tại pH 9,0 capacity = 0,195 mg/L ≪ 1,0 mg/L).
- UI cập nhật thông báo giáo dục: "Zn ranh giới — cần pH ≥ 8,5 để đạt Cột A;
  Pb đạt thoải mái từ pH 7,5 với baseline mới. Trong mẫu sulfate/carbonate cao,
  pha rắn Pb thực tế có thể khác Pb(OH)₂ (xem limitation §6.5.6)."
- Khi `goalStatus = 'unknown'` (P0 khác còn mở): UI **không được** hiển thị "đạt
  QCVN" hay "không đạt QCVN"; phải hiển thị "chưa xác định — chờ xác minh" kèm
  danh sách P0 blockers.

**Output:** `calculatedOutcome` và `goalStatus` mới, ready cho `complete_attempt` hoặc `repeat_treatment`.

#### 7.4.8. Lặp lại (repeat_treatment)

- Nếu `partial-success` hoặc `failed`, user có thể chọn `repeat_treatment`.
- Lưu ý: phép đo mới phải được thực hiện trên filtrate mới, không dùng đo cũ
  (mục 5.3, mỗi lần đo là snapshot).
- Mỗi vòng mới tăng `compositionRevision`, tạo mới `additions[]` cho vòng đó.
- Không giới hạn số vòng lặp trong MVP, nhưng mỗi vòng thêm bùn → sludge stream tăng.

#### 7.4.9. Ví dụ minh họa end-to-end (template, baseline đã cross-checked 16/10/2026)

> Số liệu dưới đây là template từ mô hình ideal (§6.1.2 + §6.6) với **baseline D1/D2/D3
> đã cross-checked** (Ksp Fe −38,779 Ferrihydrite, Ksp Zn −15,506 Zn(OH)₂(am), Ksp Pb
> −19,830 Pb(OH)₂, pKw 13,990 — xem §6.5.1 provenance table). Baseline đã verify
> bằng 7 case PHREEQC §5.1.3 ngày 16/10/2026 (P0-D đã đóng). Tất cả giá trị pH và
> lượng NaOH phải được tính bởi solver §6.6 với composition thực tế của attempt; spec
> không khóa con số nào.
>
> **Legacy narrative (dùng Ksp −15,3 cho Pb):** bản trước §7.4.9 ghi
> `capacity_Pb(9) ≈ 4,8×10⁻⁶ M = 0,99 mg/L > T_Pb = 0,3 mg/L → Pb KHÔNG kết tủa`.
> Con số 4,8×10⁻⁶ M = 0,99 mg/L tương ứng với Ksp cũ log K = −15,3; với baseline
> mới log K = −19,830, capacity_Pb(9) = 1,41×10⁻¹⁰ M = 2,93×10⁻⁵ mg/L ≪ T_Pb.
> Narrative cũ đã được chuyển vào evidence register "Discrepancy log vs current spec
> §6.5" (xem §6.5 banner). KHÔNG dùng làm narrative hiện hành.

**Input:** V = 1 L, Fe = 10 mg/L, Zn = 5 mg/L, Pb = 0,3 mg/L. pH current (sau khi pha)
= **solver §6.6 trả về** (bản cũ ghi 2,5 hoặc 1,87 — đã loại bỏ vì không nhất quán với
charge balance; xem §6.1.2 và §6.5.5).

**Bước 1 — Chọn pH target = 9,0** (auto §7.4.1: pH lớn nhất trong Cột A mà cả Fe,
Zn, Pb đều đạt với baseline đã cross-check).

**Bước 2 — Điều chỉnh pH:**
- Thêm NaOH 1M, dự đoán qua pH model (§6.1.1).
- Số liều và tổng NaOH **do solver §6.6 trả về**, không hardcode trong spec.
  Bản cũ ghi "5 liều × 0,5 mL = 5,6 mL" — đã loại bỏ vì (a) pH initial không khớp với
  charge balance 0,179 mM Fe, (b) tổng 5,6 mL vượt pH guard [2; 13] nếu chỉ có 1 mL
  pH buffer, (c) 5 mM NaOH cho pH adjust chỉ nhất quán với pH initial ~4,5, không phải
  1,87 hay 2,5.
- pH guard: tùy solver; có thể `OK`, `DOSE_LIMIT_EXCEEDED`, hoặc `PH_GUARD_EXCEEDED`.

**Bước 3 — Kết tủa:** (theo §6.5.3 và bảng §6.5.2 với baseline đã cross-check)

- capacity_Fe(9) = 1,55×10⁻²⁴ M ≪ T_Fe ≈ 0,179 mM → precipitated_Fe ≈ toàn bộ.
- capacity_Zn(9) = 3,0×10⁻⁶ M = 0,195 mg/L ≪ T_Zn ≈ 0,076 mM → precipitated_Zn ≈
  toàn bộ.
- capacity_Pb(9) = 1,41×10⁻¹⁰ M = 2,93×10⁻⁵ mg/L ≪ T_Pb = 0,3 mg/L → **Pb CÓ kết tủa**
  với baseline đã cross-check (đảo so với narrative cũ Ksp −15,3; đã chuyển vào
  discrepancy log).
- Sludge mass: do solver trả về (≈ 19,1 mg Fe(OH)₃ + 7,6 mg Zn(OH)₂ + 0,35 mg Pb(OH)₂
  theo §6.5.4 với baseline; con số này dùng được vì không phụ thuộc pH).
- OH⁻ tiêu thụ: do solver §6.6 tính; spec không commit con số nào.

**Bước 4 — Lắng:** 30 giây UI, pH không đổi (closed system, §7.4.4).

**Bước 5 — Lọc:**
- V_filtrate ≈ 900 mL, V_sludge ≈ 100 mL.
- Metal hòa tan trong filtrate (V_filtrate = 0,9 L, V_sludge = 0,1 L):
  - Fe: ≈ 0 mg/L (đã kết tủa hết; phần còn lại 0,1 L sludge nước cũng ≈ 0 mg/L)
  - Zn: ≈ 0 mg/L (tương tự Fe)
  - **Pb: C_Pb_filtrate ≈ capacity_Pb(9) = 2,93×10⁻⁵ mg/L** ≪ 0,1 mg/L (Cột A).
    Khối lượng Pb trong filtrate:
    2,93×10⁻⁵ mg/L × 0,9 L ≈ 2,6×10⁻⁵ mg; trong sludge nước:
    2,93×10⁻⁵ mg/L × 0,1 L ≈ 2,9×10⁻⁶ mg; Pb kết tủa ≈ 0,35 mg (theo precipitated_Pb
    ở Bước 3). Tổng khối lượng Pb ≈ 0,35 mg = m_Pb ban đầu →
    `MASS_BALANCE_SAMPLE_RESIDUAL_PCT ≈ 0%` (pass).
  - Đạt Cột A với baseline đã cross-check.
- Sludge: chứa Fe(OH)₃ + Zn(OH)₂ + Pb(OH)₂ (cả 3 hydroxide).

**Bước 6 — Đo sau xử lý:**
- pH ≈ 9,0 ✓ (trong 6–9)
- Fe ≈ 0 mg/L ✓
- Zn ≈ 0 mg/L ✓
- **Pb ≈ capacity_Pb(9) ≈ 2,93×10⁻⁵ mg/L ✓** (≪ 0,1 mg/L Cột A; baseline đã cross-check
  Ksp −19,830)
- → calculatedOutcome = `'success'` theo baseline đã cross-check (cả 3 đạt Cột A
  trong ideal model).

**Bước 7 — So sánh:**
- `sample_mass_balance_ok = true` (MASS_BALANCE_SAMPLE_RESIDUAL_PCT ≈ 0% < 2%)
  → bước 1: không rơi vào nhánh invalid.
- pH_pass = true, Fe_pass = true, Zn_pass = true, Pb_pass = true (baseline đã cross-check)
  → calculatedOutcome = `'success'`.
  **(Legacy narrative với Ksp −15,3 cũ: Pb_pass = false → partial-success. Đã được
  chuyển vào evidence register discrepancy log; KHÔNG dùng làm narrative hiện hành.)**
- sample_mass_balance_ok → phase = 'verified'
- `goalStatus` phụ thuộc vào các P0 còn mở. **P0-D đã đóng** ngày 16/10/2026; các
  P0 khác (P0-A QCVN đã đóng 16/10/2026; P0-B design-assumed; P0-C capacity 3 KL;
  P0-E LOD deferred; P0-F golden case) vẫn áp dụng theo two-layer design (§4.1).
- → goalStatus = `'unknown'`, unknownReasonCodes = ['P0-A', 'P0-B', 'P0-C', 'P0-D', 'P0-E', 'P0-F']
  (mặc dù calculatedOutcome = `'success'`, P0 blockers còn mở nên goalStatus = `'unknown'`)
- UI hiển thị:
  - **Tiêu đề:** "Chưa xác định — chờ xác minh"
  - **Phụ đề:** kèm danh sách P0 blockers còn mở (P0-D đã đóng 16/10/2026) và
    giải thích "kết quả mô phỏng nội bộ là `success` (cả Fe+Zn+Pb đạt Cột A theo
    baseline đã cross-check D1/D2/D3, ideal model, I = 0), nhưng goalStatus bị giữ
    ở `unknown` cho đến khi các P0 blockers còn lại đóng — xem §4.1 two-layer design".
  - **Không được** dùng nhãn "đạt QCVN" / "không đạt QCVN" ở bất kỳ trường hợp nào
    khi P0 còn mở.
- Thông báo giáo dục với baseline đã cross-check: "Pb ≈ 2,93×10⁻⁵ mg/L theo mô hình
  ideal với Ksp Pb(OH)₂ baseline −19,830 đã cross-check bằng PHREEQC. Model chưa tính
  activity correction, complexation, competing phases, mass-balance tolerance — kết
  quả chỉ là xấp xỉ free-ion saturation."

**Lưu ý quan trọng về Pb trong ví dụ này:**

- Bản trước ghi "Pb ≈ 0,01 mg/L → đạt QCVN 0,1" nhưng giá trị 0,01 mg/L sai vì
  capacity_Pb(9) với Ksp cũ −15,3 = 0,99 mg/L, lớn hơn T_Pb = 0,3 mg/L → Pb **không kết
  tủa** trong narrative cũ, không thể có filtrate 0,01 mg/L trừ khi có co-precipitation
  với Fe(OH)₃ (xem §6.5.6 — MVP bỏ qua).
- Với baseline đã cross-check (Ksp_Pb = −19,830), capacity_Pb(9) = 2,93×10⁻⁵ mg/L ≪ T_Pb
  → Pb **có kết tủa** và filtrate ≈ capacity(Pb) ≪ Cột A.
- Các phép tính trên **không chứng minh** rằng mẫu nước thật đạt Cột A. Chúng chưa tự
  động tính đến **hoạt độ ion (γ ≠ 1)**, **tạo phức với sulfate/carbonate**, **các pha
  rắn cạnh tranh** (Smithsonite, Hydrocerussite, Goethite, PbO…), **động học kết tủa**
  hay toàn bộ **cân bằng khối lượng**. Kết luận hợp lệ: baseline đã cross-check
  **dự đoán** rằng hydroxide route ở pH 9 có thể đạt Cột A đồng thời cho Fe, Zn, Pb
  **trong giới hạn của mô hình ideal I = 0**; activity correction còn để xác minh
  trong phase 2+ (xem §6.5.6). Không được biến thành khẳng định chung cho mọi mẫu
  nước.

**Noise đo (mục 8):** LOD/accuracy là TBD. MVP giả định noise ± 5% cho metal, ± 0,05 cho pH.
Điều này có thể làm kết quả "đạt" ở biên bị đẩy sang "vượt" — phải ghi rõ trong report.

## 8. Phép đo và kiểm tra

Mỗi sample/attempt phải lưu tối thiểu:

| Trường | Ý nghĩa |
| --- | --- |
| `sampleId` | Mã mẫu |
| `metalCombination` | Fe, Pb, Zn hoặc tổ hợp |
| `nominalFe`, `nominalPb`, `nominalZn` | Nồng độ danh nghĩa tính từ lượng precursor ảo |
| `initialPH` | pH đo sau khi mẫu hình thành và đồng nhất |
| `measuredFe`, `measuredPb`, `measuredZn` | Nồng độ đo trước xử lý |
| `precipitateObserved` | Có/không kết tủa tự phát trước xử lý |
| `treatmentMethod` | Phương pháp xử lý được thử |
| `finalPH` | pH sau xử lý |
| `finalFe`, `finalPb`, `finalZn` | Nồng độ sau xử lý |
| `meetsTarget` | Kết quả so với mục tiêu MVP đã chốt (Cột A — **đã xác minh pháp lý** với Thông tư 06/2025/TT-BTNMT; xem §16.1 P0-A và evidence register §5.1) |

Mỗi giá trị kim loại phải ghi rõ là `dissolved` hay `total`. Nếu là dissolved, protocol
phải ghi điểm và điều kiện lọc; nếu là total, protocol phải bao gồm phần kim loại trong
cặn. Không được so sánh nominal input với final dissolved output mà không ghi rõ phép
chuyển đổi và trạng thái pha.

Mỗi lần đo cần ghi:

- pH hiện tại.
- Fe hòa tan, Zn hòa tan, Pb hòa tan.
- Tổng thể tích nước.
- Revision của thành phần mẫu.
- Công đoạn và dòng nước được đo.
- Sai số hoặc trạng thái không xác định nếu thiết bị không đủ độ nhạy.
- Capacity hòa tan hiện tại của Fe, Zn và Pb.
- Margin capacity còn lại của từng kim loại.
- pH trước addition, pH dự đoán sau addition và trạng thái pH guard.

Ba đại lượng phải được tách riêng trong state và report:

1. `dissolved_metal_mass`: khối lượng kim loại trong dòng nước được định nghĩa là hòa tan.
2. `solid_metal_mass`: khối lượng kim loại trong bùn/chất rắn đã tách.
3. `unresolved_metal_mass`: phần chưa xác định do giới hạn mô hình hoặc sai số.

`total_metal` của mẫu đầu vào không được dùng thay thế cho `dissolved_metal` sau lọc.

**Phân biệt dissolved metal (engine) vs compliance measurement (QCVN):**

Đây là hai đại lượng khác nhau và có thể cho kết luận khác nhau:

- **Engine output** (§6, §7): `dissolved_metal` = tổng kim loại ở pha hòa tan theo định
  nghĩa mô hình (sau khi lọc qua filter 0,45 µm giả định). Bao gồm ion tự do + hydroxo
  phức trong phạm vi §6.7.1. **KHÔNG bao gồm** colloid, hạt nhỏ, kim loại gắn vào chất
  hữu cơ tự nhiên, hoặc phần rắn còn sót lại.

- **Compliance measurement** (QCVN 40:2025/BTNMT, Phụ lục 1): phương pháp lấy mẫu và
  phân tích theo quy chuẩn thường đo **tổng kim loại phục hồi được** (recoverable total
  metal) qua phân hủy acid mạnh, bao gồm cả phần hòa tan lẫn phần gắn với hạt/colloid
  nhỏ. Giá trị này **luôn ≥ dissolved_metal** trong thực tế.

**Hệ quả cho MVP:** engine chỉ tính dissolved_metal. Khi so sánh với giới hạn QCVN
(Fe ≤ 2; Zn ≤ 1; Pb ≤ 0,1 mg/L tại Cột A), giá trị engine được dùng như **ước lượng
thấp nhất** của compliance measurement. Mẫu có `dissolved ≤ giới hạn` chưa chắc đã pass
theo quy chuẩn nếu phương pháp đo thực tế bao gồm colloid/hạt nhỏ. UI phải ghi rõ:
"So sánh theo dissolved metal (mô hình); compliance theo QCVN cần xác nhận bằng phương
pháp đo quy chuẩn."

**Việc cần làm trước release (nằm trong §16 mục 6):**
- Đối chiếu Phụ lục 1 QCVN 40:2025/BTNMT để xác định phương pháp đo áp dụng cho Fe,
  Zn, Pb trong từng loại nguồn nước (công nghiệp, sinh hoạt, ...).
- Nếu phương pháp đo là "tổng phục hồi được", mô hình cần bổ sung phần colloid/hạt nhỏ
  (hiện MVP bỏ qua).
- Nếu phương pháp đo là "hòa tan qua filter 0,45 µm", mô hình hiện tại đã khớp (cần
  xác nhận trong evidence).

Phép đo sau khi thêm hóa chất nhưng trước khi trộn/lắng/lọc phải được đánh dấu là chưa hợp lệ
cho mục tiêu cuối. Độ chính xác, giới hạn phát hiện và phương pháp đo là **TBD**.

## 9. Kết quả đầu ra

### 9.1. Kết quả khoa học

- pH đầu vào và cuối.
- Nồng độ Fe, Zn, Pb trước và sau từng công đoạn.
- Phần trăm loại bỏ của từng kim loại.
- Khối lượng chất rắn/bùn tạo ra.
- Khối lượng còn lại trong dòng nước.
- Mass balance residual.
- Capacity hòa tan và margin theo từng composition revision.
- Tải kim loại cạnh tranh đã được engine xét đến.

### 9.2. Kết quả quy trình

- Số lần thêm hóa chất.
- Tổng thể tích từng reagent.
- Số lần điều chỉnh pH.
- Thời gian bước lắng theo quy tắc UI, không tuyên bố là kinetics thật.
- Số lần lọc.
- Tài nguyên và chỉ số nguy hại giáo dục.

## 10. Cách chấm điểm

> **Trọng số chính thức đã chốt (O8, 16/10/2026):** baseline 4 nhóm tiêu chí — kết quả
> 40% / quy trình 30% / hiệu quả hóa chất–bùn 15% / báo cáo & truy vết 15% (tổng 100%).
> Tỉ lệ 40/30/15/15 thay thế đề xuất cũ 50/20/15/15. Lý do: ưu tiên nặng hơn cho quy
> trình (30% thay vì 20%) vì mục tiêu giáo dục là học quy trình xử lý, không chỉ
> kết quả; hiệu quả hóa chất–bùn và báo cáo giữ nguyên 15% mỗi nhóm.

**Bốn nhóm tiêu chí và trọng số:**

| Nhóm | Trọng số | Đại lượng đánh giá |
| --- | ---: | --- |
| **Kết quả xử lý** | **40%** | pH, Fe, Zn, Pb sau xử lý có đạt QCVN Cột A không (cộng cả 3 kim loại + pH trong dải 6–9) |
| **Quy trình** | **30%** | Đo đủ, trộn, lắng, lọc đúng thứ tự; tuân thủ `wait_settle`, pH guard, dose cap |
| **Hiệu quả hóa chất–bùn** | **15%** | Lượng NaOH/HCl/precursor dùng; khối lượng bùn tạo ra; so với benchmark thiết kế |
| **Báo cáo & truy vết** | **15%** | Event log đầy đủ, revision, citation, quyết định tuân thủ QCVN rõ ràng |

**Tổng: 100%.** Tất cả 4 nhóm cộng lại 100%; rubric không cho phép một nhóm nào
vượt 100% hay âm.

**Quy tắc N/A — chuẩn hóa mẫu số khi loại tiêu chí:**

- Nếu một nhóm tiêu chí bị loại (vd LOD chưa có → không đánh giá được kết quả Fe),
  trọng số của nhóm đó được **phân bổ đều** cho 3 nhóm còn lại theo tỉ lệ ban đầu.
  Ví dụ: nếu nhóm "Kết quả" bị N/A, 40% được phân bổ cho Quy trình/Hiệu quả/Báo cáo
  theo tỉ lệ 30:15:15 → cộng thêm 20/60×40 = 13,33% cho Quy trình, 6,67% cho Hiệu
  quả, 6,67% cho Báo cáo. **Không được** dùng N/A để né lỗi: nếu dữ liệu có sẵn
  nhưng solver chưa xử lý, không được N/A — phải trả `invalid`.
- Trong MVP, khi P0-D hoặc P0-E chưa đóng, `goalStatus = "unknown"` (§4.1) — rubric
  tạm thời coi như "toàn bộ" trả N/A và chuyển sang trạng thái giáo dục; không commit
  điểm.

`success` phải là điều kiện cứng:

```text
success = valid_measurement
       && all_target_limits_pass
       && mass_balance_pass
       && sludge_separated
```

Điểm cao không được biến mẫu vượt giới hạn thành mẫu "đạt". Nếu thiếu giới hạn hoặc thiếu
phép đo, kết quả là `N/A`.

Trạng thái lifecycle và trạng thái kết quả là hai khái niệm khác nhau:

| Trạng thái | Ý nghĩa |
| --- | --- |
| `completed` | Lượt đã kết thúc, bất kể đạt hay không đạt |
| `success` | Tất cả tiêu chí mục tiêu và mass balance đều đạt |
| `partial-success` | Đạt mục tiêu học tập hoặc một kim loại, nhưng chưa đạt toàn bộ |
| `failed` | Đã đủ dữ liệu nhưng một hoặc nhiều giới hạn không đạt |
| `invalid` | Thiếu dữ liệu, vi phạm precondition hoặc mass balance không thể đánh giá |

## 11. Nhánh sai và phục hồi

| Trường hợp | Mã dự kiến | Phục hồi |
| --- | --- | --- |
| pH ngoài miền | `PH_OUT_OF_RANGE` | Tạo mẫu hoặc điều chỉnh trong miền |
| Tải kim loại vượt capacity | `SOLUBILITY_CAPACITY_EXCEEDED` | Giảm tải hoặc chọn điều kiện mẫu hợp lệ |
| Capacity chưa xác định | `SOLUBILITY_UNRESOLVED` | Bổ sung bundle hoặc đánh dấu mẫu không đánh giá |
| Chưa đo mẫu đầu vào | `INITIAL_MEASUREMENT_REQUIRED` | Đo trước khi xử lý |
| Thêm reagent ngoài bundle | `REAGENT_UNAVAILABLE` | Chọn reagent được cấp |
| Liều vượt giới hạn | `DOSE_LIMIT_EXCEEDED` | Giảm liều hoặc bắt đầu lượt mới |
| Đo ngay sau khi thêm | `SAMPLE_NOT_MIXED` | Trộn trước khi đo |
| Chưa lắng | `SAMPLE_NOT_SETTLED` | Chờ lắng |
| Lọc trước khi lắng | `FILTER_PRECONDITION_FAILED` | Quay lại bước lắng |
| Bùn chưa tách | `SOLIDS_NOT_SEPARATED` | Lọc hoặc xử lý lại |
| Mass balance không đạt | `MASS_BALANCE_FAILED` | Kiểm tra dòng và bắt đầu lại |
| Thiếu giới hạn quy chuẩn | `STANDARD_UNAVAILABLE` | Không cho kết luận đạt |
| Kim loại chưa xác định | `ANALYTE_UNRESOLVED` | Đo lại hoặc đánh dấu N/A |
| Addition làm pH vượt guard | `PH_GUARD_EXCEEDED` | Giảm liều hoặc chọn reagent hợp lệ |
| Acid/base ngoài bundle | `REAGENT_MODEL_UNRESOLVED` | Không commit action |

## 12. Điều kiện hoàn thành

`completed` chỉ có nghĩa là người học đã đóng lượt. Nó không đồng nghĩa với `success`.
Một lượt có thể hoàn thành ở trạng thái `success`, `partial-success`, `failed` hoặc
`invalid`, và report phải hiển thị lý do tương ứng.

### 12.1. Mục tiêu xử lý tất cả

- Đã đo Fe, Zn, Pb và pH đầu vào.
- Đã lọc/tách bùn ở công đoạn cuối.
- Tất cả dòng lá phải ở trạng thái `verified` hoặc `final`.
- Fe, Zn, Pb và pH đều nằm trong mục tiêu MVP đã chốt (placeholder Cột A — **chưa
  xác minh pháp lý** với bản chính thức QCVN 40:2025/BTNMT, xem §16.1 P0-A và §17.6).
- Mass balance đạt tolerance.
- Không còn `unresolved` mass vượt giới hạn.

### 12.2. Mục tiêu một kim loại

Có thể hoàn thành để phục vụ học tập, nhưng report phải ghi rõ kim loại nào chưa đạt. Không
được dùng trạng thái này để gắn nhãn nước đạt chuẩn toàn bộ.

## 13. An toàn và giới hạn

- Chỉ mô phỏng mẫu nước và hóa chất; không hướng dẫn pha hoặc xử lý Pb thật.
- Không tạo UI khuyến khích sinh viên tự thử nghiệm với kim loại nặng.
- Không dùng kết quả để quyết định xả thải, uống nước hoặc chọn liều ngoài mô phỏng.
- Không mô phỏng đầy đủ bùn nguy hại, phơi nhiễm, vận chuyển và xử lý chất thải trong MVP.
- Không gọi pH đẹp hoặc độ trong cao là bằng chứng nước an toàn.
- Không tuyên bố chuẩn pháp lý nếu chưa khóa đúng quy chuẩn, phiên bản và phương pháp đo.

## 14. Ma trận nguồn cần bổ sung

Trạng thái cập nhật `2026-10-16` (bản `0.2.0-draft`). Sổ đăng ký bằng chứng khoa học
hiện chưa có mục `6. Register — Xử lý nước Fe/Zn/Pb`; 6 claim Ksp + hydrolysis đang ở
trạng thái **placeholder số** (công thức có, nguồn chính thức chưa nộp vào register).

| Claim / dữ liệu | Claim key | Nguồn bắt buộc | Trạng thái | Ghi chú |
| --- | --- | --- | --- | --- |
| Giới hạn Fe/Zn/Pb/pH | `WT-QCVN-COL-*` | Thông tư 06/2025/TT-BTNMT, Bảng 2 (PDF SHA-256 `1fb859f9...`) | ✅ **Đã xác minh pháp lý 16/10/2026** (P0-A đóng); xem evidence register §5.1 | §2.2, §3.2.4, §17.2; §16.1 P0-A |
| pKw tại 25°C | `AN-KW-25C` | IAPWS-KW-2024 | ✅ Đã cite | §6.1.1, §6.1.2; đang dùng chung với acid-neutralization |
| pKa1, pKa2 carbonic | `AN-CARBONATE-CONSTANTS` | USGS-PHREEQC-1995 | ✅ Đã cite | §6.1.1; chưa kích hoạt (TIC = 0 trong MVP) |
| Ksp Fe(OH)₃ (Ferrihydrite) = 10⁻³⁸·⁷⁷⁹ | `WT-CHEM-Ksp-Fe` | `minteq.v4.dat` PHREEQC 3.8.6-17100 (D2, baseline 16/10/2026); SHA-256 `a93914e63b0c616f8506cc92739188e50c5b9a15c33b111979652f308457f4ac`. Legacy −38,6 (Smith-Martell) chỉ trong evidence register “Discrepancy log”. | ✅ Nộp + version + pin SHA-256 | §6.1.2, §6.5.1, §6.5.2; baseline assumption, chưa `cross-checked` |
| Ksp Zn(OH)₂ (Zn(OH)₂(am)) = 10⁻¹⁵·⁵⁰⁶ | `WT-CHEM-Ksp-Zn` | `minteq.v4.dat` PHREEQC 3.8.6-17100 (D3, baseline 16/10/2026); cùng SHA-256. Legacy −16,9 (`phreeqc.dat`, `minteq.v4.dat`) là hydrolysis constant cho Zn(OH)₂(aq), **không phải Ksp** — chỉ trong evidence register “Discrepancy log”. | ✅ Nộp + version + pin SHA-256 | §6.1.2, §6.5.1, §6.5.2; baseline assumption, chưa `cross-checked` |
| Ksp Pb(OH)₂ = 10⁻¹⁹·⁸³⁰ | `WT-CHEM-Ksp-Pb` | `minteq.v4.dat` PHREEQC 3.8.6-17100 (D1, baseline 16/10/2026, primary; cùng SHA-256). `phreeqc.dat` cùng phase `Pb(OH)₂` với cùng `log_k 8.15` (alternative storage) — **KHÔNG phải nguồn độc lập**. Legacy −15,3 không truy được nguồn trong database đã pin — chỉ trong evidence register “Discrepancy log” với limitation note. | ✅ Nộp + version + pin SHA-256 | §6.1.2, §6.5.1, §6.5.2; baseline assumption, chưa `cross-checked` |
| log K Fe³⁺ + H₂O ⇌ FeOH²⁺ + H⁺ = −2,19 | `WT-CHEM-K-FeOH` | `phreeqc.dat` PHREEQC 3.8.6-17100 (D1–D5 không đổi; baseline đã đúng từ đầu); SHA-256 `59373961d648dfbf68a40744060c1d64f57ecbec98f4f5fb89f3a1b4213ccd10` | ✅ Nộp + version + pin SHA-256 | §6.1.2, §6.5.1; hydrolysis constant, không phải Ksp; chưa `cross-checked` |
| log β₁ Zn(OH)⁺ ≈ −9,0 | `WT-CHEM-K-ZnOH` | `phreeqc.dat` PHREEQC 3.8.6-17100 | ⚠️ Số có, MVP bỏ qua | §6.1.2; “bỏ qua trong MVP” (β₁ yếu) |
| log β₁ Pb(OH)⁺ ≈ −7,7 | `WT-CHEM-K-PbOH` | `phreeqc.dat` PHREEQC 3.8.6-17100 | ⚠️ Số có, MVP bỏ qua | §6.1.2; “bỏ qua trong MVP” (β₁ yếu) |
| pKa2 H₂SO₄ (proton hóa SO₄²⁻) | `WT-SO4-PKA2-25C` | CRC Handbook 95/87/96th | ❌ Chưa | §6.1.2 mới thêm; cần cite + điều kiện áp dụng |
| **Pha rắn Fe(OH)₃** (Ferrihydrite baseline, D2) | `WT-CHEM-SOLID-PHASE` (mục Fe) | `minteq.v4.dat` PHREEQC 3.8.6-17100; SHA-256 `a93914e63b0c616f8506cc92739188e50c5b9a15c33b111979652f308457f4ac`. Baseline đã chốt 16/10/2026 (D4) | ✅ Source + version + pin SHA-256 (baseline assumption) | §6.7.2: baseline `Ferrihydrite`; phase khác (Goethite `log_k 0.491`) chưa model trong MVP |
| **Pha rắn Zn(OH)₂** (Zn(OH)₂(am) baseline, D3) | `WT-CHEM-SOLID-PHASE` (mục Zn) | `minteq.v4.dat` PHREEQC 3.8.6-17100; cùng SHA-256. Baseline đã chốt 16/10/2026 (D4) | ✅ Source + version + pin SHA-256 (baseline assumption) | §6.7.2: baseline `Zn(OH)₂(am)`; β/γ/ε chưa model trong MVP |
| **Pha rắn Pb(OH)₂** (Pb(OH)₂ baseline, D1) | `WT-CHEM-SOLID-PHASE` (mục Pb) | `minteq.v4.dat` PHREEQC 3.8.6-17100 (primary, cùng SHA-256). `phreeqc.dat` cùng phase `Pb(OH)₂` với cùng `log_k 8.15` (alternative storage) — **KHÔNG phải nguồn độc lập**. Baseline đã chốt 16/10/2026 (D4) | ✅ Source + version + pin SHA-256 (baseline assumption) | §6.7.2: baseline `Pb(OH)₂`; PbO/PbO·H₂O/Hydrocerussite chưa model |
| **Định nghĩa IUPAC của Ksp** (activity-based) | n/a (methodology) | IUPAC S05742 | ✅ Có link, cần add vào register | §6.5.1; quyết định: MVP dùng ideal model (γ = 1) |
| **IAPWS R11-24** (pKw chính thức) | `IAPWS-KW-2024` → đổi tên thành `IAPWS-R11-24` | IAPWS Release R11-24, tháng 6/2024 | ✅ Đã cite source; cần ghi version + extract page | §6.1.1, §6.1.2, §6.5.1; khóa pKw = 13,990 tại 25°C |
| **USGS PHREEQC** (cross-check) | `USGS-PHREEQC-DATABASE` | PHREEQC database `phreeqc.dat` version cụ thể | ❌ Chưa | §6.5.5; dùng để cross-check Ksp/hydrolysis + pha rắn |
| **PHREEQC database version** (phải khoá rõ) | n/a (metadata) | USGS PHREEQC release notes | ❌ Chưa | §6.5.1; mỗi Ksp/hydrolysis claim phải ghi rõ phiên bản database đã dùng để verify |
| Ảnh hưởng độ kiềm/độ cứng | n/a | n/a | ❌ Chưa | §6.1.1 khóa TIC = 0 (closed carbonate); đã quyết định loại khỏi MVP |
| Hiệu quả lắng/lọc | `WT-SETTLE-FILTER-MODEL` | n/a | ⚠️ Sơ khai | §7.4.5 khóa 10% carried water nhưng chưa có nguồn định lượng; coi kinetics tức thì |
| Độ tan precursor salt | `WT-SALT-SOLUBILITY` | CRC Handbook 95/87/96th | ✅ Đã cite | §3.2.3; dùng cho info display, không phải slider cap |
| Khối lượng mol muối ngậm nước | n/a | CRC / IUPAC | ✅ Đã cite | §5.1.2 (FeCl₃·6H₂O = 270,295; ZnSO₄·7H₂O = 287,53; Pb(NO₃)₂ = 331,2) |
| LOD / accuracy phép đo | `WT-MEASUREMENT-LOD` | Datasheet / phương pháp | ❌ Chưa | §8 ghi "TBD"; đang chặn định nghĩa `WaterMeasurement` (§4.2.6) |
| **Phương pháp đo QCVN** (dissolved vs total recoverable) | `WT-COMPLIANCE-METHOD` | QCVN 40:2025/BTNMT, Phụ lục 1 | ❌ Chưa | §8 mới; phải đối chiếu Phụ lục 1 để biết đại lượng compliance đo là gì |
| Hệ số nguy hại giáo dục | n/a | Quy ước nội bộ | ❌ Chưa | §10 đề cập; chưa có bảng số |
| Golden cases | n/a | Tính toán độc lập (PHREEQC, MINTEQ) | ❌ Chưa | §7.4.9 có 1 ví dụ; cần ≥ 3 case (không xử lý, đạt, thất bại) verify độc lập |
| Mass-balance tolerance | n/a | n/a | ✅ Đã chốt | §6.6.3 có tiêu chí hội tụ; số tolerance **`±2%`** (O9 đã chốt 16/10/2026, evidence register §5.1.4) |
| Safety copy Pb | n/a | Safety sheet nội bộ | ✅ Đã có | §13, nhãn đầu file |

**Tóm tắt (cập nhật sau khi sửa lý thuyết hóa):** 7 claim ✅, 9 claim ⚠️ (số có, nguồn chưa nộp hoặc thiếu metadata pha rắn/phiên bản database), 8 dòng ❌ (chưa có).

**Yêu cầu chất lượng cho mỗi Ksp/hydrolysis claim khi nộp register (§6.5.1, §6.7.2):**

1. Tên đầy đủ + version của database/handbook (vd `minteq.v4.dat` PHREEQC 3.8.6-17100, SHA-256
   `a93914e63b0c616f8506cc92739188e50c5b9a15c33b111979652f308457f4ac`, hoặc
   `phreeqc.dat` cùng phiên bản). Smith-Martell 2004 vẫn được cite nếu hằng số
   hydrolysis của Fe³⁺ (−2,19) trùng với `phreeqc.dat`.
2. Pha rắn được giả định (baseline D4: Ferrihydrite, Zn(OH)₂(am), Pb(OH)₂).
3. Quy ước nhiệt độ (25°C, 1 atm).
4. Quy ước activity/concentration (ideal model γ = 1, hay đã convert từ γ ≠ 1).
5. Cross-check bằng database độc lập (PHREEQC `phreeqc.dat` hoặc MINTEQ).

Nếu thiếu một trong 5 mục trên, claim **không được tính là đã xác minh** — phải đánh
dấu "chưa xác minh" trong bảng.

Nguồn tham chiếu:

- **Source key:** `QCVN40-2025-BTNMT` — xem [Sổ đăng ký bằng chứng khoa học](water-treatment-evidence.md)
- [Thông tư 06/2025/TT-BTNMT và QCVN 40:2025/BTNMT — PDF nguồn do người dùng cung cấp](https://qcvn.com.vn/wp-content/uploads/2025/03/Thong-tu-06-2025-TT-BTNMT.pdf)
- [QCVN 40:2025/BTNMT trên cổng thông tin văn bản pháp luật](https://vbpl.vn/FileData/TW/Lists/vbpq/Attachments/176985/VanBanGoc_06-2025-tt-btnmt.pdf)
- [Thông tin QCVN 40:2025/BTNMT của cơ quan thuộc Bộ](https://vukhcn.monre.gov.vn/tin-khoa-hoc-cong-nghe-cua-bo/quy-chuan-ky-thuat-quoc-gia-qcvn-402025-btnmt-ve-nuoc-thai-cong-nghiep/tt-9067)

Nội dung QCVN dùng trong bản cập nhật này dựa trên PDF người dùng cung cấp. Khi phát hành,
nhóm cần lưu bản PDF cùng checksum vào evidence register, ghi số Thông tư, ngày hiệu lực
và đối chiếu lại Bảng 2, Mục 1.3.3, Mục 3.1 và Mục 4.4.

## 15. Tiêu chí nghiệm thu và các mốc phát hành

Tài liệu này phân biệt ba mốc trưởng thành phát hành:

| Mốc | Điều kiện | Trạng thái hiện tại |
|---|---|---|
| **Skeleton-ready** | Types, action handler, event log, revision, UI shell, test thứ tự mix→settle→filter→measure có thể viết ngay với placeholder hợp lệ. Không phụ thuộc P0 đóng. | ✅ Có thể bắt đầu |
| **Chemistry-validated** | P0-B (salt bundle) + P0-D (hằng số) + P0-E (LOD/accuracy) đóng. Solver có dữ liệu khoa học để chạy, mass-balance tolerance đã khóa. | ⚠️ Chưa — *P0-B ✅ (entry design-assumed), P0-E ⏸ deferred, P0-D mở (chờ 7 case PHREEQC); tolerance ±2% đã chốt O9* |
| **Release-ready** | Chemistry-validated **AND** P0-A (QCVN Cột A xác minh) + P0-C (capacity model 3 KL) + P0-F (golden cases) đóng. Tổng: **đóng P0-A → P0-F** (xem §17.6 cho danh sách đầy đủ lý do chặn phát hành). | ❌ Chưa |

> **Một danh sách duy nhất cho release-ready:** đóng tất cả P0-A → P0-F (xem §17.6).
> Bảng trên chỉ phân nhóm theo mốc để dễ theo dõi. **Điều kiện phát hành thực tế là
> P0-A → P0-F cộng P0-J** (vì P0-J là tiên quyết của chemistry-validated, mà chemistry-
> validated là tiên quyết của release-ready). P0-J không chỉ là điều kiện kèm theo —
> nó phải đóng trước khi solver được coi là đáng tin để đối chiếu với golden cases.
> validated, không phải blocker release-ready.

> **Giải thích các mốc:**
> - **Skeleton-ready** nghĩa là infrastructure và workflow UI có thể build mà không cần
>   chờ P0. Chemistry engine vẫn là placeholder; UI phải hiển thị `goalStatus = 'unknown'`
>   khi P0 còn mở — không tự gắn nhãn "đạt QCVN".
> - **Chemistry-validated** nghĩa là solver có đủ dữ liệu khoa học để cho kết quả
>   có ý nghĩa, nhưng chưa khẳng định pháp lý. **P0-J là tiên quyết của giai đoạn
>   này** — solver không đáng tin khi mass-balance tolerance chưa khóa bằng golden case.
> - **Release-ready** nghĩa là P0-A đến P0-F đã đóng **và** chemistry-validated đã
>   đạt (tức P0-J đã đóng gián tiếp). Kết luận "đạt / không đạt" được phép hiển thị
>   sau khi xác minh cuối cùng.

Các tiêu chí bên dưới dùng cho **nghiệm thu và phát hành** (không phải điều kiện
build skeleton). Một tiêu chí ⚠️/❌ không ngăn việc viết skeleton nhưng **ngăn**
phát hành chemistry engine và kết luận pháp lý. Trạng thái ghi nhận tại bản
`0.2.0-draft` (2026-10-16).

**Tổng hợp nhanh (cập nhật 16/10/2026 sau khi đóng P0-D):**

- ✅ Đạt: 7/12 (tiêu chí 1, 2, 5, 8, 10, 11, 12) — tiêu chí 5 vừa đạt nhờ P0-D đã đóng
- ⚠️ Một phần: 3/12 (tiêu chí 4, 7, 9) — tiêu chí 9 đã có algorithm 3 cơ chế tương tác cross-checked; còn biểu thức định lượng cạnh tranh đồng thời (P0-C)
- ❌ Chưa có: 2/12 (tiêu chí 3, 6)

Tiêu chí ❌ hoặc ⚠️ map 1-1 sang các mục tương ứng trong §16 (cột "Mục" của bảng §16):

| Tiêu chí §15 | Tương ứng §16 mục | Trạng thái tổng hợp |
| --- | --- | --- |
| 4 (stock concentration, dose limits, đơn vị) | §16 mục 1 (precursor salt bundle) | ⚠️ Một phần (HCl/NaOH ✅, FeCl₃/ZnSO₄/Pb(NO₃)₂ ⚠️ chỉ có tên + mol weight; stock + pH guard + max dose còn thiếu) |
| 5 (species/hằng số) | §16 mục 3 (PT, hằng số, species bundle) + §16 mục 9 (nguồn khoa học) | ✅ Đạt (P0-D đã đóng 16/10/2026) |
| 7 (mass-balance tolerance + unresolved handling) | §16 mục 10 (mass-balance tolerance + cách xử lý `unresolved`) — **mục mới trong bản này** | ⚠️ Một phần |
| 9 (capacity 3 KL đồng thời) | §16 mục 4 (capacity model 3 KL) | ⚠️ Một phần (algorithm ✅, biểu thức định lượng ❌) |
| 3 (golden case) | §16 mục 8 (golden cases) | ❌ Chưa có |
| 6 (LOD/accuracy) | §16 mục 6 (LOD/accuracy/rounding) | ❌ Chưa có |

> **Lưu ý về đồng bộ §15 ↔ §16:** Bản này thống nhất tiêu chí 4 = ⚠️ Một phần (không
> còn ✅ Đạt như bản trước), thêm mục §16 #10 cho mass-balance tolerance, và ghi rõ
> tiêu chí 9 cùng trạng thái với §16 mục 4. Bất kỳ thay đổi nào ở §15 cần phản
> ánh tương ứng trong §16 và ngược lại.

| # | Tiêu chí | Trạng thái | Bằng chứng |
| --- | --- | --- | --- |
| 1 | Có target standard và phiên bản rõ ràng | ✅ Đạt | QCVN 40:2025/BTNMT, nguồn `QCVN40-2025-BTNMT` |
| 2 | Có `standardColumn` và `receivingWaterClass` được chọn theo QCVN | ✅ Đạt | §2.2, §17.2: `standardColumn = 'A'`, `receivingWaterClass = 'A'` |
| 3 | Có benchmark input cho mẫu axit và mẫu bazơ | ❌ Chưa | §2.1 chỉ có mẫu axit (FeCl₃/ZnSO₄/Pb(NO₃)₂); §7.2 nhắc workflow bazơ nhưng không có benchmark số |
| 4 | Có stock concentration, dose limits, đơn vị cho mọi reagent | ⚠️ Một phần | HCl/NaOH ✅ (§5.2.1: stock 1 M, dose limit, aliquot set); precursor salt FeCl₃/ZnSO₄/Pb(NO₃)₂ ⚠️ chỉ có mol weight + tên muối (§5.1.2, §14); stock + pH guard + max dose ❌ (xem §16 mục 1 / P0-B); §4.2.7 quy ước đơn vị toàn schema ✅ |
| 5 | Có species/hằng số được nhóm khoa học phê duyệt | ✅ **Đạt** (P0-D đã đóng 16/10/2026) | Solver algorithm ✅ (§6.6); charge balance + speciation ✅ (§6.1.2); capacity = free M^n+ ✅ (§6.5.1); 6 claim Ksp/hydrolysis/solid-phase/pKa2 ✅ `cross-checked` bằng 7 case PHREEQC (§6.1.2, §6.5.1, §6.7.2); discrepancy legacy −15,3 / −16,9 / −38,6 đã phân giải và lưu trong evidence register |
| 6 | Có ≥ 3 golden case (không xử lý, đạt, thất bại) | ❌ Chưa | 7 case PHREEQC chuyên biệt (`P0-D-CROSSCHECK-REPORT.md`) đã chạy để cross-check 6 claim; golden cases cho solver MVP end-to-end (P0-F) chưa có | **CHEM** (verify) |
| 7 | Có mass-balance tolerance + cách xử lý `unresolved` | ⚠️ Một phần → ✅ *đã chốt tolerance O9 ngày 16/10/2026* | Công thức ✅ (§6.6.4, §4.2.7); số tolerance ✅ ±2% (O9); quy tắc `unresolved` ✅ (§6.6.0, §6.6.3); verify với golden case ⏳ |
| 8 | Có quyết định rõ về tổng kim loại hay kim loại hòa tan | ✅ Đạt | §8 tách 3 loại (dissolved / solid / unresolved); §17.3 khóa; tuân thủ quy ước đơn vị §4.2.7 |
| 9 | Có capacity model cho 3 KL đồng thợi + mã lỗi | ⚠️ Một phần | 3 cơ chế tương tác ✅ (§6.5.5.1, đã cross-checked 16/10/2026 với baseline mới); biểu thức định lượng cho cạnh tranh đồng thời cần cross-check riêng (P0-C); mã lỗi solver ✅ (§6.6.0, §11) | **CHEM** (P0-C) |
| 10 | Có pH guard trước và sau khi thêm acid/base | ✅ Đạt | §5.2, §6.4, §17.3; pH guard `[2; 13]` trong solver domain `[0; 14]` |
| 11 | Có acceptance test cho thứ tự mix → settle → filter → measure | ✅ Đạt | §7.4.3–7.4.6, §11 có mã lỗi cho từng bước; mass balance unit convention thống nhất (§4.2.7) |
| 12 | Có safety copy được duyệt cho Pb và chất thải mô phỏng | ✅ Đạt | §13, nhãn đầu file, §17.4 |

**Tổng: ✅ 6/12 đạt, ⚠️ 4/12 một phần, ❌ 2/12 chưa có** (đếm từ bảng trên; đã đồng bộ
với §16 trong bản này)

## 16. Dữ liệu còn thiếu trước khi build

Danh sách cập nhật `2026-10-16` (bản `0.2.0-draft`). Trạng thái mỗi mục đối chiếu với
§14 (nguồn) và §15 (nghiệm thu). Cột **Trạng thái**: ✅ đã đóng, ⚠️ đang mở (một phần),
❌ chưa có. Cột **Chặn giai đoạn**: giai đoạn build bị chặn nếu mục chưa đóng — chia
thành 4 giai đoạn thay vì 1 cờ chung "CÓ":

| Mã | Giai đoạn | Ý nghĩa |
| --- | --- | --- |
| **CHEM** | Chemistry engine | Solver §6.6 + golden case cân bằng cần mục này |
| **MEAS** | Measurement model | `WaterMeasurement` + noise + LOD cần mục này |
| **SCORE** | Scoring & rubric | §10 rubric + trọng số + điểm quy trình cần mục này |
| **RELEASE** | Release config | Khoá standardColumn + bằng chứng + khẳng định khoa học cần mục này |

| # | Mục | Trạng thái | Bằng chứng hiện tại | Chặn giai đoạn |
| --- | --- | --- | --- | --- |
| 1 | Precursor salt bundle (stock/guard/max dose cho FeCl₃/ZnSO₄/Pb(NO₃)₂) | ⚠️ Một phần | Tên muối + M_salt ✅; stock concentration + pH guard + max dose ❌ | **CHEM** |
| 2 | Mô hình độ kiềm/độ cứng/complexant trong MVP | ✅ Đã đóng (quyết định loại) | §6.1.1: TIC = 0, closed carbonate | — |
| 3 | Phương trình, hằng số, species bundle, solver convention | ✅ **Đã đóng (P0-D)** | pH model + initial pH model + precipitation model ✅; 6 claim Ksp/hydrolysis đã `cross-checked` bằng 7 case PHREEQC 16/10/2026 (sai số ≤ 0,004 đơn vị log) | **CHEM** |
| 4 | Capacity model định lượng 3 KL đồng thời | ⚠️ Một phần | §6.5.5.1 mô tả 3 cơ chế tương tác ✅; biểu thức định lượng cho cạnh tranh đồng thời ❌ (cần cross-check PHREEQC) | **CHEM** |
| 5 | Mô hình lắng/lọc (lý tưởng / recovery) | ⚠️ Một phần | §7.4.5: 10% carried water; coi tức thì | — (assumption MVP đủ dùng) |
| 6 | LOD/accuracy/rounding | ❌ Chưa | §8 cuối: "TBD" | **MEAS** |
| 7 | Rubric chi tiết + trọng số + N/A | ✅ Đã chốt (O8 16/10/2026) | §10: **40/30/15/15** (kết quả / quy trình / hiệu quả / báo cáo); quy tắc N/A có; quy tắc chuẩn hóa mẫu số có | **SCORE** |
| 8 | Golden cases (≥ 3, có case vượt capacity + vượt pH guard) | ❌ Chưa | §7.4.9: 1 ví dụ (chưa cross-check PHREEQC) | **CHEM** (verify) |
| 9 | Nguồn khoa học còn thiếu + người duyệt | ⚠️ Một phần | §14 liệt kê 6 claim chưa nộp evidence register | **RELEASE** |
| 10 | Mass-balance tolerance + cách xử lý `unresolved` (§15 tiêu chí 7 ↔ §6.6.3–4) | ✅ Đã chốt tolerance O9 ngày 16/10/2026 | Công thức kiểm tra từng nguyên tố ✅ (§6.6.4 mục 1, §4.2.7); quy tắc `unresolved` ✅ (§6.6.0, §6.6.3); số tolerance ✅ ±2% (O9 đã chốt); verify với golden case ⏳ | **CHEM** (verify) |

**Tổng kết trạng thái (đếm lại từ bảng trên, bản `0.2.0-draft`):**

- ✅ 1 mục đã đóng (mục 2)
- ⚠️ 7 mục đang mở (mục 1, 3, 4, 5, 7, 9, 10) — *so với bản trước (6 mục) vì mục 10
  mới được tách ra từ tiêu chí 7 của §15*
- ❌ 2 mục chưa có (mục 6, 8)

**Tổng kết giai đoạn bị chặn (gom theo cột "Chặn giai đoạn"):**

- **CHEM (chemistry engine):** 5 mục (1, 3, 4, 8, 10).
  - Mục **1 (precursor salt bundle)** và mục **4 (capacity 3 KL)** chặn cứng — không
    thể dùng placeholder.
  - Mục **3 (PT, hằng số, species)** baseline D1–D5 đã chốt 16/10/2026 (`source-checked`)
    — solver dùng giá trị Ksp mới nhưng phải gắn `goalStatus = "unknown"` cho đến khi
    7 case chuyên biệt §5.1.3 pass và O5/O9 đóng; KHÔNG dùng placeholder Smith-Martell
    2004 nữa.
  - Mục **8 (golden cases)** phụ thuộc mục 1 + 4 (cần solver 3 KL chạy được trước).
  - Mục **10 (mass-balance tolerance)** algorithm có sẵn (§6.6.3–4), nhưng giá trị số
    tolerance (±2% đề xuất) cần verify với golden case; vì vậy ở mức "mềm" và có thể
    dùng `UNVERIFIED` placeholder khi build skeleton.
  - **Kết luận:** không build chemistry engine với golden case độc lập cho đến khi
    mục 1 + 4 đóng. Skeleton solver 1-KL (chỉ Fe) có thể viết với placeholder.
- **MEAS (measurement model):** 1 mục (6) — `WaterMeasurement` cần LOD/accuracy/rounding.
- **SCORE (scoring & rubric):** 1 mục (7) — rubric + trọng số chính thức.
- **RELEASE:** 1 mục (9) — không chặn dev, chặn release.

**Chặn chemistry engine — phân loại "cứng" vs "mềm":**

| Loại | Mục | Lý do chặn cứng/mềm | Có thể skeleton? |
| --- | --- | --- | --- |
| Cứng | 1 (precursor salt bundle) | Không có stock/guard/dose → controller không khởi tạo được | Không |
| Cứng | 4 (capacity 3 KL đồng thời) | Biểu thức định lượng cho cạnh tranh 3 KL chưa có → solver chỉ chạy được 1-KL | Không (3 KL) / Có (1 KL) |
| Mềm | 3 (hằng số + species) | ✅ Algorithm ✅, baseline D1–D5 đã chốt + `cross-checked` 16/10/2026 (7 case PHREEQC PASS); solver dùng trong chế độ `validated` cho chemistry | Có (không còn gắn `goalStatus = "unknown"` vì lý do P0-D; các P0 khác vẫn áp dụng) |
| Mềm | 8 (golden cases) | Phụ thuộc 1 + 4; không có số verified thì không có golden case đáng tin | Không (đợi 1+4) |

**Tổng kết "ba mục chặn chemistry engine thực sự"** (theo góc nhìn product owner):
mục 1 + 4 + 8 — vì mục 3 đã có algorithm, chỉ thiếu evidence (có thể chạy skeleton
với placeholder). Nếu tính cả mục 3, tổng là 4 mục. Hai cách đếm này **không mâu
thuẫn** mà khác nhau về tiêu chí: "có thuật toán + số placeholder" (3 mục) vs "có
số verified + golden case" (4 mục). §15 và §16 phải ghi rõ đang dùng tiêu chí nào
để tránh nhầm lẫn.

**Không chặn (skeleton code có thể viết ngay):**

- Types §4.1 + §4.2 (đã đủ)
- Action handler stub §5 (đã đủ)
- Event log repo §5.3 (đã đủ)
- pH model solver §6.1.1 (công thức đủ, số có thể dùng placeholder claim)
- Initial pH model §6.1.2 (công thức đủ)
- Precipitation model §6.5 (baseline Ksp D1/D2/D3 từ `minteq.v4.dat` + `phreeqc.dat` đã pin,
  pKw 13,990 từ IAPWS R11-24)
- HCl/NaOH controller §5.2.1 (đã đủ)
- Pre-treatment Assessment component §5.1.1 (không cần LOD)
- UI skeleton, breadcrumb, lesson header (đã đủ thông tin từ các mục khác)

Chưa nên bắt đầu build **chemistry engine với golden case độc lập**, **measurement
noise/LOD**, **scoring** và **release config** cho đến khi các mục CHEM + MEAS + SCORE
+ RELEASE tương ứng đóng. Xem §16.1 cho thứ tự P0 cần chốt.

### 16.1. Thứ tự P0 cần chốt

Bảng dưới sắp xếp các mục còn thiếu theo thứ tự ưu tiên. Mỗi mục liệt kê: phụ thuộc
(blocked-by), chặn giai đoạn nào, output kỳ vọng, và chủ sở hữu đề xuất. Mục có
**Sẵn sàng build skeleton** có nghĩa là code có thể viết ngay với placeholder hợp lệ;
mục có **Phải chốt trước khi build phase tương ứng** có nghĩa là không code phase đó
cho tới khi mục đóng.

| # | P0 | Phụ thuộc | Chặn | Output kỳ vọng | Chủ sở hữu đề xuất | Sẵn sàng skeleton? |
| --- | --- | --- | --- | --- | --- | --- |
| P0-A | **QCVN 40:2025/BTNMT: ✅ ĐÃ ĐÓNG** (đối chiếu với Thông tư 06/2025/TT-BTNMT ngày 01/3/2025) | — | RELEASE ✅ | Bảng §2.2 và §3.2.4 đã thống nhất về cùng một bảng số từ Bảng 2, Thông tư 06/2025/TT-BTNMT (trang 5–6): Fe 2/10/10, Zn 1/5/5, Pb 0,1/0,5/0,5, pH 6–9 cho cả 3 cột. PDF + SHA-256 lưu tại `docs/experiments/Thong-tu-06-2025-TT-BTNMT.pdf` (SHA-256: `1fb859f91af39c31c32936fd8988f69b4d2f25805a9689afff578be4050ac5da`). Mục 1.3.3.1 (định nghĩa Cột A) đã được trích dẫn trong §2.2. Evidence register mục "Register — Xử lý nước Fe/Zn/Pb" đã có source key `QCVN-40-2025-BTNMT`. **Mục tiêu mô phỏng** Fe ≤ 2,0; Zn ≤ 1,0; Pb ≤ 0,1 mg/L; pH 6–9 đã được xác minh pháp lý. | Khoa học + product owner | **Có** — code dùng giá trị đã xác minh, không còn placeholder |
| P0-B | **Precursor salt bundle** (mục 1) | ✅ Đã chốt design-assumed 16/10/2026 | CHEM | Stock + dose cap giả định: FeCl₃·6H₂O 1,00 M / 5 mL×V=1 L (5 mmol Fe/lần); ZnSO₄·7H₂O 1,00 M / 5 mL/lần (5 mmol Zn); Pb(NO₃)₂ 0,10 M / 5 mL/lần (0,5 mmol Pb). Xem `docs/experiments/water-treatment-evidence.md` §5.1.5 (O6). Khi có SDS/vendor thật, thay bằng `WT-SALT-*-VENDOR`. | Khoa học (an toàn hoá chất) | **Đã chốt design-assumed** — types + số đã có; spec ghi rõ đây là giả định thiết kế, không từ SDS |
| P0-C | **Capacity model 3 KL đồng thời** (mục 4) | P0-B | CHEM | Biểu thức định lượng cho 3 cơ chế tương tác (Ksp order, OH⁻ budget chung, ionic strength); cross-check PHREEQC cho ≥ 1 case | Chemistry owner | **Không** — chưa thể viết solver 3 KL |
| P0-D | **6 claim Ksp/hydrolysis/solid-phase** (mục 3 + 9) | P0-B | CHEM + RELEASE | ✅ **ĐÃ ĐÓNG 16/10/2026**: Evidence register đã nộp 6/6 claim số học + 1 baseline assumption (D1–D5, chốt 16/10/2026 — xem `docs/experiments/water-treatment-evidence.md` §5.1.3 và banner §6.5). 7 case chuyên biệt (§5.1.3 "Specialized cross-check cases") đã chạy thành công trong PHREEQC 3.8.6-17100 trên database đã pin (SHA-256 `a93914e63b0c616f8506cc92739188e50c5b9a15c33b111979652f308457f4ac`) ngày 16/10/2026 với sai số ≤ 0,004 đơn vị log. `verificationStatus = 'cross-checked'` cho cả 6 claim. Discrepancy legacy −15,3 / −16,9 / −38,6 đã phân giải. | Khoa học + reviewer | **Đạt** — solver dùng baseline đã cross-check trong chế độ `validated` |
| P0-E | **LOD/accuracy/rounding** (mục 6) | ⏸ Deferred 16/10/2026 (O7) | MEAS | `WaterMeasurement` chưa thể định nghĩa xong vì chưa chọn analytical method, chưa có validation data. UI dùng schema `referenceBenchmark` (spec §6.1.3) với EPA reference MDL (Method 200.8/300.0) + caveat rõ; **không** được label là LOD/LOQ dự án. Bằng chứng experimental về kinetics/sorption (Water Research 1995, Dyer et al.) đã thêm vào evidence register §5.1.4 để giới hạn narrative. Reopen khi có method + matrix + validation data. | Measurement owner | **Deferred** — EPA reference có, dự án validation chưa có |
| P0-F | **Golden cases ≥ 3** (mục 8) | P0-B + P0-C + P0-D | CHEM (verify) | Tối thiểu: (a) mẫu đạt không cần xử lý; (b) mẫu hydroxide route đạt Fe+Zn nhưng Pb fail; (c) mẫu vượt pH guard / dose cap | Chemistry owner + QA | **Không** — cần P0-C đóng trước |
| P0-G | **Rubric + trọng số + N/A** (mục 7) | ✅ Đã chốt O8 16/10/2026 | SCORE | Trọng số chính thức **40/30/15/15** (kết quả / quy trình / hiệu quả hóa chất–bùn / báo cáo & truy vết) + quy tắc N/A chuẩn hóa mẫu số (xem §10) | Product owner + giáo dục | **Đã chốt** — rubric ready; scoring có thể implement với type đầy đủ |
| P0-H | **Slider step theo số kim loại tick** (§3.2.6) | — | UI | ✅ Đã khóa: Pb 0,001 mg/L mọi mode; Fe/Zn 0,1 (1-KL & 2-KL) và 0,01 (3-KL) | UI owner | **Có** — slider cap hiện tại không block code |
| P0-J | **Mass-balance tolerance ± %** (§16 mục 10 ↔ §15 tiêu chí 7 ↔ §6.6.3–4) | ✅ Đã chốt | CHEM (verify) | Khoá số tolerance toàn mẫu `±2%` mỗi nguyên tố Fe/Zn/Pb/Cl/S/N/Na (O9 đã chốt ngày 16/10/2026, evidence register §5.1.4), quy tắc fallback khi fail (`MASS_BALANCE_BELOW_TOLERANCE` → `unresolved`), và verify bằng ≥ 1 golden case mục 8 | Chemistry owner + QA | **Đã chốt tolerance** — số ±2% locked; chờ verify với golden case (P0-F) |

**Đề xuất thứ tự ưu tiên giải quyết:**

1. **P0-A** (khoá QCVN) — 1-2 ngày, chờ đối chiếu bản chính thức QCVN 40:2025/BTNMT. Không chặn gì ngoài §3.2.4.
2. **P0-B** (precursor salt bundle) — 2-3 ngày, khoá số an toàn hoá chất. Cần trước P0-C, P0-D, P0-F.
3. **P0-D** (6 claim evidence) — ✅ **ĐÃ ĐÓNG 16/10/2026**: 6/6 claim số học + 1 baseline assumption ở `cross-checked` sau khi chemistry owner chốt D1–D5 và 7 case PHREEQC chuyên biệt (P0-D step 6) chạy thành công ngày 16/10/2026 trên database đã pin (`docs/experiments/water-treatment-evidence.md` §5.1.3; xem `tools/research/phreeqc-pin/3.8.6-17100/cases/P0-D-CROSSCHECK-REPORT.md`). Solver dùng baseline mới trong chế độ `validated` cho chemistry. Limitation về pha rắn (Pb(OH)₂ assumption, không bao gồm anglesite/cerussite/hydrocerussite) và activity correction (γ = 1) vẫn áp dụng.
4. **P0-C** (capacity 3 KL) — 5-7 ngày sau khi P0-B + P0-D xong. Cần PHREEQC cross-check.
5. **P0-E** (LOD/accuracy) — 2-3 ngày, độc lập với chemistry.
6. **P0-F** (golden cases) — 3-5 ngày sau P0-C, cần solver 3 KL chạy được.
7. **P0-G** (rubric) — 2-3 ngày, có thể làm sớm vì chỉ cần product + giáo dục chốt trọng số.
8. **P0-H** (slider step Pb) — 1 giờ, thuộc UI owner.

**Trạng thái khuyến nghị cho skeleton code (không chờ tất cả P0):**

- ✅ Viết skeleton ngay: types §4.1+§4.2, action handler §5, event log §5.3, pH solver skeleton §6.1.1, initial pH skeleton §6.1.2, precipitation skeleton §6.5, HCl/NaOH controller §5.2.1, Pre-treatment Assessment component §5.1.1, UI skeleton.
- ⏸ Hoãn: measurement với noise (cần P0-E), scoring với trọng số (cần P0-G), release config (cần P0-F).

## 11. Nguồn và phạm vi căn cứ

Các thông số, workflow và yêu cầu đánh giá của bài lấy từ hồ sơ scenario,
model constants và giao diện VECLab hiện có. Các tài liệu dưới đây hỗ trợ
nguyên lý và bối cảnh; chúng không xác nhận các hằng số, kết quả hay hiệu lực
thực nghiệm của mô phỏng VECLab.

### Nguồn nguyên lý và phương pháp

1. Qasem, N. A. A., Mohammed, R. H., & Lawal, D. U. (2021). “Removal of heavy
   metal ions from wastewater: a comprehensive and critical review.” *npj Clean
   Water*, 4(1), Article 36. [DOI: 10.1038/s41545-021-00127-0](https://doi.org/10.1038/s41545-021-00127-0).
   Tổng quan các phương pháp xử lý ion kim loại trong nước thải, gồm kết tủa
   hóa học và các phương pháp cạnh tranh; hỗ trợ bối cảnh lựa chọn công nghệ,
   không cung cấp xác nhận riêng cho model VECLab.
2. Baltpurvins, K. A., Burns, R. C., Lawrance, G. A., & Stuart, A. D. (1996).
   “Use of the Solubility Domain Approach for the Modeling of the Hydroxide
   Precipitation of Heavy Metals from Wastewater.” *Environmental Science &
   Technology*, 30(5), 1493–1499. [DOI: 10.1021/es950421u](https://doi.org/10.1021/es950421u).
   Nguồn về mô hình miền độ tan cho kết tủa hydroxide kim loại, phụ thuộc pH
   và hành vi lưỡng tính. Kết quả/hằng số của hệ được nghiên cứu không được
   chuyển thẳng thành hằng số cho Fe/Zn/Pb trong VECLab.
3. U.S. Environmental Protection Agency. (2000). *Wastewater Technology Fact
   Sheet: Chemical Precipitation*, EPA 832-F-00-018.
   [EPA NEPIS fact sheet](https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=P1001QTR.TXT).
   Mô tả kết tủa hóa học, keo tụ-tạo bông, jar test và các cân nhắc vận hành;
   tài liệu lưu ý liều tối ưu cần được xác định theo từng trường hợp. Đây là
   hướng dẫn công nghệ, không phải validation của mô hình VECLab.

### Căn cứ quy chuẩn Việt Nam

4. Bộ Tài nguyên và Môi trường. (2025). *Thông tư 06/2025/TT-BTNMT*, ban hành
   QCVN 40:2025/BTNMT — Quy chuẩn kỹ thuật quốc gia về nước thải công nghiệp.
   [Bản PDF đã lưu trong hồ sơ](Thong-tu-06-2025-TT-BTNMT.pdf); đối chiếu pháp lý
   và SHA-256 được ghi trong [evidence register](water-treatment-evidence.md),
   mục 5.1. Bảng 2 (trang 5–6) ghi giới hạn Fe, Zn, Pb và pH theo cột; mục
   1.3.3.1 (trang 3) định nghĩa Cột A.

   Cột A trong bài là **mục tiêu học tập mô phỏng**. QCVN này điều chỉnh nước
   thải công nghiệp theo điều kiện áp dụng của quy chuẩn; không dùng nó để
   chứng nhận mẫu tổng hợp trong mô phỏng hoặc nước thật đạt chuẩn. Hệ Fe/Zn/Pb
   được chọn làm tình huống học tập của VECLab, không phải danh sách khẳng định
   áp dụng pháp lý cho mọi ngành và cơ sở.

### Phạm vi bằng chứng

Các nguồn trên hỗ trợ nguyên lý hydroxide precipitation, sự phụ thuộc pH,
amphoteric behavior và vai trò của jar test/batch experiment. QCVN 40:2025/BTNMT
là căn cứ quy định của Việt Nam, không phải nguồn cho các nguyên lý quốc tế.
Model constants và các giả định pha rắn phải được truy về database/nguồn cụ thể
trong evidence register; kiểm tra số học hoặc đối chiếu database không tương
đương kiểm chứng thực nghiệm độc lập. Mô phỏng không phải tư vấn thiết kế hay
hướng dẫn xử lý/xả thải nước thật.

## 17. Phần thực hành đã chốt

Các quyết định dưới đây đã đủ rõ để chuẩn bị skeleton code, contract và test harness.
Chúng chưa có nghĩa là chemistry engine đã được phép phát hành.

### 17.1. Phạm vi scenario

- Scenario key: `water-treatment`.
- Mẫu chỉ là mẫu nước tổng hợp ảo; không dùng Pb thật.
- MVP chỉ cho phép ba kim loại: Fe, Zn và Pb.
- Thể tích benchmark: `1.000 mL`; miền khám phá: `500–2.000 mL`.
- Miền nồng độ input tạm thời: Fe `0,5–20 mg/L`, Zn `0,2–10 mg/L`, Pb `0,02–1 mg/L`.
- pH đầu vào tạm thời: **tính từ composition** (mục 6.1.2) — không phải user input;
  nhiệt độ model tạm thời: `25,0 °C`.
- Khối lượng đầu vào tính theo `m (mg) = C (mg/L) × V (L)`.

### 17.2. Chuẩn và kiểm tra đầu ra

- Chuẩn tham chiếu: `QCVN 40:2025/BTNMT` (ban hành kèm **Thông tư 06/2025/TT-BTNMT** ngày 01/3/2025).
- Các giới hạn Fe, Zn, Pb và pH được trích từ **Bảng 2** của Thông tư 06/2025/TT-BTNMT
  (đã xác minh pháp lý ngày 16/10/2026). Xem §16.1 P0-A và evidence register §5.1.
- **Phân biệt rõ**:
  - "Chọn Cột A cho mục tiêu mô phỏng MVP" đã được quyết trong nhóm phát triển
    (không phụ thuộc vào việc xác minh pháp lý QCVN).
  - "Xác minh pháp lý các trị số Cột A với bản chính thức QCVN" — **chưa đóng**
    (đang chờ đối chiếu PDF + checksum + số Thông tư + ngày hiệu lực).
  - Hai việc này **độc lập**; đóng P0-A chỉ có nghĩa là đã xác minh pháp lý các
    trị số, không phải là quyết định dùng Cột A.
- Engine phải nhận `targetStandardId`, `standardColumn` và `receivingWaterClass`; MVP khởi tạo `standardColumn = 'A'` và `receivingWaterClass = 'A'`.
- Cột A/B/C là giới hạn đầu ra, không phải capacity hòa tan đầu vào.
- Ngưỡng đầu ra MVP dùng Cột A (placeholder): pH `6–9`, Fe `≤ 2,0 mg/L`, Zn `≤ 1,0 mg/L`, Pb `≤ 0,1 mg/L`.
- **Ngôn ngữ hiển thị bắt buộc**:
  - Khi `goalStatus = 'unknown'` (P0-A còn mở hoặc chưa đủ điều kiện): UI hiển thị
    **"chưa xác định — chờ xác minh"**. **Không** được dùng "đạt QCVN" / "không đạt QCVN".
  - Khi `goalStatus = 'success'` hoặc `'failed'` (P0-A đã đóng và đủ điều kiện): UI
    dùng **"đạt ngưỡng mô phỏng Cột A"** / **"vượt ngưỡng mô phỏng Cột A"**, không
    dùng đơn thuần "đạt QCVN" để tránh suy ra chứng nhận pháp lý.
- **Chưa tuyên bố kết quả đạt QCVN cho đến khi P0-A đóng** (xem §16.1 và §17.6).
- Kết quả chỉ được gọi là `success` khi phép đo hợp lệ, tất cả giới hạn đạt, mass balance đạt và bùn đã tách.

### 17.3. Quy trình và kiểm soát

- Route MVP: hydroxide route với HCl ảo, NaOH ảo, trộn, lắng và lọc.
- Luồng chính: tạo mẫu → đo ban đầu → thêm reagent → trộn → lắng → lọc → đo lại → lặp hoặc hoàn tất.
- Tải Fe/Zn/Pb phải được validate đồng thời theo capacity model; không kiểm tra từng kim loại độc lập.
- Acid/base phải đi qua pH guard dự đoán trước khi commit; UI không được gán pH trực tiếp.
- Mọi addition làm tăng `compositionRevision` và vô hiệu phép đo cũ.
- State phải tách `dissolved_metal_mass`, `solid_metal_mass` và `unresolved_metal_mass`.
- Lifecycle `completed` tách khỏi kết quả `success`, `partial-success`, `failed` và `invalid`.

### 17.4. Persistence và audit

- Guest dùng IndexedDB qua `GuestAttemptRepository`.
- Tài khoản dùng BFF và `SupabaseAttemptRepository`; browser không ghi trực tiếp vào bảng hoặc RPC privileged.
- Dùng chung `attempts`, `attempt_events`, revision, sequence, action idempotency, state hashes và `finalReportSnapshot`.
- Event log append-only, gồm action, input, state trước/sau, calculation trace, observations, warnings và resource delta.
- Report chỉ đọc attempt/timeline đã lưu và không tự chạy lại thao tác hóa học.
- Không tạo bảng database riêng cho `water-treatment`; chỉ thêm release manifest, content/evidence và adapter/session typed.
- Guest import lên cloud phải replay server-side theo release đã khóa.

### 17.5. Skeleton code — có thể viết ngay (không cần chờ P0)

Code có thể viết với placeholder hợp lệ ngay từ bản spec này; không phụ thuộc
việc đóng P0-A đến P0-F:

- Types `WaterTreatmentState`, `WaterTreatmentAction`, `WaterTreatmentEvent`
  (§4.1, §4.2). Enum `goalStatus` đã bao gồm `'unknown'` và `unknownReasonCodes`
  với các giá trị `'P0-A' | 'P0-B' | 'P0-C' | 'P0-D' | 'P0-E' | 'P0-F'`.
  Field `calculatedOutcome` đã có trong state để tách kết quả solver nội bộ
  khỏi kết luận cuối cùng (`finalizeOutcome` helper quy định trong §4.1).
- Event log infrastructure (§5.3).
- Action handler / controller cho HCl, NaOH (§5.2.1).
- pH solver skeleton (§6.1.1) — công thức đủ, số có thể dùng placeholder claim.
- Initial pH model skeleton (§6.1.2) — công thức đủ.
- Precipitation model skeleton (§6.5) — bảng 6.5.2 đã dùng baseline Ksp D1/D2/D3
  (Ferrihydrite −38,779; Zn(OH)₂(am) −15,506; Pb(OH)₂ −19,830; pKw 13,990) đã
  `cross-checked` 16/10/2026 bằng 7 case PHREEQC §5.1.3. Solver **được phép** dùng
  baseline này trong chế độ `validated` cho chemistry. `goalStatus = "unknown"`
  không còn bị khoá vì lý do P0-D; hai-layer design (§4.1) vẫn áp dụng cho các
  P0 khác (P0-A đã đóng 16/10/2026; P0-E LOD deferred; P0-C capacity 3 KL;
  P0-F golden case).
  pass và mass-balance tolerance được owner cung cấp (O9).
- Pre-treatment Assessment component (§5.1.1) — không cần LOD.
- UI skeleton, breadcrumb, lesson header, slider theo §3.2.6 + §3.2.9.
- `DissolvedCapacitySnapshot` và `PHGuardSnapshot` types (§6.4).
- Mass balance check trong §7.4.5 dùng 10% carried water (assumption MVP).
- Goal status policy với two-layer design: khi P0 blockers còn mở, engine **phải**
  trả `goalStatus = 'unknown'` kèm `unknownReasonCodes` chứa các P0 chưa đóng,
  dù `calculatedOutcome` có là `'success'` hay `'partial-success'`. UI phải hiển thị
  "chưa xác định — chờ xác minh" thay vì "đạt / không đạt" QCVN. Đây là rào
  chắn pháp lý bắt buộc.

### 17.6. Chemistry engine — KHÔNG phát hành cho đến khi đóng P0-A đến P0-F

**Quan hệ giữa P0-J và release gate:**
- **P0-J** (mass-balance tolerance) là **điều kiện của chemistry-validated** (xem §15).
  Không thể coi solver đã được kiểm chứng khi tolerance chưa khóa.
- **Chemistry-validated** là **tiên quyết** cho release-ready. Do đó, P0-J cũng là
  tiên quyết gián tiếp cho release-ready — dù §15 bảng ghi "release-ready cần P0-A→P0-F",
  thì thực tế **P0-J phải đóng trước khi P0-C, P0-D, P0-E được coi là đủ** vì kết
  quả solver không đáng tin khi mass-balance tolerance chưa xác định.

**Tóm tắt release gate (cập nhật 16/10/2026):**

| Giai đoạn | P0 cần đóng | Ghi chú | Trạng thái hiện tại |
|---|---|---|---|
| Skeleton-ready | (không P0) | UI/infrastructure không phụ thuộc P0 | ✅ Sẵn sàng — solver skeleton có thể viết theo §17.5 |
| Chemistry-validated | P0-B + P0-D + P0-E + **P0-J** | P0-J = mass-balance tolerance ±2% (đã chốt O9) | ⚠️ P0-B ✅ (design-assumed), **P0-D ✅ (16/10/2026)**, P0-J ✅ (tolerance ±2%), P0-E ⏸ deferred |
| Release-ready | P0-A + P0-C + P0-F | Cộng thêm chemistry-validated (tức P0-B + P0-D + P0-E + P0-J) | ⚠️ P0-A ✅, **P0-D ✅**; P0-C + P0-F mở (cần O5 PHREEQC CLI hoặc tương đương) |

**Khối lượng phát hành bị chặn** vì các lý do sau (xem §16.1 cho chi tiết):

- **P0-A** (QCVN Cột A) — ✅ **đã đóng 16/10/2026**: trị số pháp lý đã xác minh với
  Thông tư 06/2025/TT-BTNMT (xem evidence register §5.1). Không còn chặn phát hành
  vì lý do này.
- **P0-B** (precursor salt bundle) — ✅ **đã chốt design-assumed 16/10/2026**:
  FeCl₃·6H₂O stock 1,00 M / dose cap 5 mL/lần (5 mmol Fe); ZnSO₄·7H₂O stock 1,00 M
  / dose cap 5 mL/lần (5 mmol Zn); Pb(NO₃)₂ stock 0,10 M / dose cap 5 mL/lần
  (0,5 mmol Pb). Xem evidence register §5.1.5. Khi có SDS nhà cung cấp thật, thay
  bằng `WT-SALT-*-VENDOR` entry.
- **P0-C** (mô hình 3-KL capacity định lượng) — chưa cross-check PHREEQC; biểu
  thức cạnh tranh đồng thời 3 kim loại chưa có.
- **P0-D** (hằng số Ksp / hydrolysis / pha rắn) — ✅ **ĐÃ ĐÓNG 16/10/2026**: baseline
  D1–D5 chốt + 7 case chuyên biệt đã chạy thành công trong PHREEQC 3.8.6-17100 trên
  `minteq.v4.dat` đã pin (SHA-256 `a93914e63b0c616f8506cc92739188e50c5b9a15c33b111979652f308457f4ac`)
  với sai số ≤ 0,004 đơn vị log. `verificationStatus = 'cross-checked'` cho cả 6 claim.
  Narrative Pb/Zn đã cập nhật §6.5.2/§6.5.5.1/§6.5.6/§7.4 theo baseline đã cross-check.
  Solver dùng baseline mới trong chế độ `validated` cho chemistry; limitation về
  pha rắn (Pb(OH)₂ assumption, không bao gồm anglesite/cerussite/hydrocerussite)
  vẫn được ghi rõ.
- **P0-E** (LOD / accuracy / rounding) — ⏸ **deferred 16/10/2026** (xem evidence
  register §5.1.4): chưa chọn analytical method, chưa có validation data. UI hiển
  thị EPA reference MDL qua schema `referenceBenchmark` (§6.1.3) với caveat rõ;
  KHÔNG dùng để khẳng định LOD/LOQ dự án.
- **P0-F** (golden case ≥ 3) — solver chưa được chứng minh chạy đúng bằng
  kiểm chứng độc lập. Phụ thuộc O5 (PHREEQC CLI executable).
- **P0-G** (rubric + trọng số + N/A) — ✅ **đã chốt 16/10/2026** (O8): baseline
  40/30/15/15 (kết quả / quy trình / hiệu quả hóa chất–bùn / báo cáo & truy vết) +
  quy tắc N/A chuẩn hóa mẫu số. Xem §10.
- **P0-H** (slider step theo KL) — ✅ **đã khóa** (§3.2.6).
- **P0-J** (mass-balance tolerance) — ✅ **đã chốt tolerance ±2% 16/10/2026** (O9,
  xem evidence register §5.1.4). Solver không được tự gán tolerance khác. Còn phải
  verify bằng golden case (P0-F) trước khi kết luận solver đáng tin. **Không phát
  hành solver cho user trước khi P0-F verify tolerance này.**

Khi phát hành chemistry engine, cần:

1. Đóng P0-A đến P0-F theo §16.1. P0-A ✅ (16/10/2026), **P0-D ✅ (16/10/2026)**;
   còn lại P0-B (design-assumed), P0-C (capacity 3 KL chưa cross-check),
   P0-E (LOD deferred), P0-F (golden case chưa có).
2. Có tối thiểu 3 golden case với kết quả tham chiếu độc lập (vd từ PHREEQC).
3. Lưu bằng chứng: PDF QCVN + checksum + số Thông tư + ngày hiệu lực; Ksp/hydrolysis
   claim map; PHREEQC database version; datasheet phương pháp đo.
4. Sau khi đóng, chuyển `goalStatus = 'unknown'` thành các trạng thái
   `success / partial-success / failed / invalid` tùy theo kết quả đo đạt.

Trong suốt thời gian này, mọi kết quả solver được xem là **mô phỏng giáo dục**,
không có giá trị khẳng định pháp lý. UI phải hiển thị rõ disclaimer này. Solver
đã có thể dùng baseline Ksp/phase đã cross-check; vẫn phải ghi rõ limitation
(Pb(OH)₂ assumption, activity correction γ = 1 chưa có, co-precipitation/kinetics
bỏ qua) trong report và UI.