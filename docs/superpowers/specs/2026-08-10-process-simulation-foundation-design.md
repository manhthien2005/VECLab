# Nền tảng thiết kế mô phỏng quy trình Hóa học – CNTT

> **Trạng thái tài liệu:** Tài liệu nền tảng định hướng. Phạm vi lõi hiện hành đã được chốt tại [Báo cáo chốt phạm vi lõi dự án](../../core-project-scope.md); khi có khác biệt, báo cáo ngày 27/08/2026 được ưu tiên áp dụng.

**Trạng thái:** Tài liệu nền tảng tham khảo; không còn là nguồn quyết định cho phạm vi lõi<br>
**Ngày:** 2026-08-10

## 1. Các quyết định đã chốt

- Sản phẩm là nền tảng mô phỏng **quy trình ra quyết định**, không phải chemistry sandbox tổng quát.
- Mỗi kịch bản có phạm vi chất, vật liệu, thao tác và giả định rõ ràng.
- Cùng một bài toán có thể có nhiều quy trình hợp lệ.
- Có hai chế độ sử dụng trên cùng một engine:
  - **Hướng dẫn:** gợi ý bước tiếp theo và giải thích đơn giản.
  - **Tự do:** người học tự chọn trình tự, hóa chất và thông số.
- Kết quả mô phỏng xác định và tái lập được: cùng trạng thái và thao tác phải cho cùng kết quả.
- Hệ thống kiểm tra điều kiện đầu ra trước, sau đó mới đánh giá chi phí, an toàn, chất thải và số bước.
- Kịch bản trung tâm của MVP là xử lý nước thải axit chứa kim loại.
- Kịch bản mở rộng ưu tiên là phân loại nhựa bằng phương pháp nổi – chìm.

## 2. Kiến trúc nền tảng

```text
Scenario Configuration
        |
        v
Process Core
  |-- Trạng thái hiện tại
  |-- Danh sách thao tác
  |-- Kiểm tra điều kiện
  |-- Timeline và phân nhánh
        |
        v
Domain Simulation Module
  |-- Acid–Base
  |-- Metal Precipitation
  `-- Density Separation
        |
        v
Kết quả + Giải thích + Chấm điểm + Lịch sử
```

Process Core được tái sử dụng cho mọi kịch bản. Mỗi lĩnh vực chỉ bổ sung mô-đun tính toán chuyên môn và dữ liệu kịch bản.

## 3. Vòng lặp mô phỏng chung

```text
Quan sát trạng thái
→ Chọn thao tác
→ Nhập thông số
→ Kiểm tra đầu vào và điều kiện
→ Chạy mô hình chuyên môn
→ Cập nhật trạng thái
→ Hiển thị hiện tượng và giải thích
→ Ghi timeline và điểm thành phần
→ Tiếp tục, hoàn tác hoặc tạo nhánh so sánh
```

Engine trả về sau mỗi thao tác:

- trạng thái mới;
- dữ liệu tính toán trung gian;
- hiện tượng có thể quan sát;
- cảnh báo;
- giải thích đơn giản và nâng cao;
- chi phí, an toàn và chất thải phát sinh;
- sự kiện để phát lại hoặc tạo nhánh.

## 4. Kịch bản 1 — Xử lý nước thải axit chứa Cu²⁺

### 4.1. Trạng thái ban đầu

| Thuộc tính | Giá trị mặc định |
| --- | ---: |
| Thể tích | 1 L |
| pH | 2 |
| Lượng axit tương đương | 10 mmol H⁺ |
| Cu²⁺ | 100 mg/L |
| Nhiệt độ | 25°C, cố định |

Mục tiêu giáo dục mặc định:

- pH đầu ra trong khoảng 6,5–8,5;
- Cu tổng sau lọc không quá 2 mg/L;
- không có vi phạm an toàn nghiêm trọng;
- giảm chi phí và lượng bùn.

Các ngưỡng trên là dữ liệu của kịch bản, không được trình bày như kết luận tuân thủ pháp luật.

### 4.2. Các thao tác

- đo pH hoặc nồng độ Cu;
- thêm NaOH;
- thêm huyền phù Ca(OH)₂;
- thêm axit loãng để sửa lỗi quá liều;
- khuấy;
- chờ lắng;
- lọc;
- đo đầu ra;
- hoàn tác, đặt lại hoặc tạo nhánh.

### 4.3. Các quy trình hợp lệ

#### Quy trình A — NaOH kiểm soát

```text
Đo mẫu
→ Thêm NaOH từng lượng nhỏ
→ Khuấy và đo pH
→ Điều chỉnh đến vùng tạo kết tủa
→ Lắng
→ Lọc Cu(OH)₂
→ Đo đầu ra
```

- Nhanh và dễ tính toán.
- Ít chất rắn dư hơn.
- Có nguy cơ vượt pH khi thêm quá nhiều một lần.

#### Quy trình B — Ca(OH)₂ chi phí thấp

```text
Đo mẫu
→ Thêm Ca(OH)₂
→ Khuấy
→ Kiểm tra pH
→ Chờ lắng lâu hơn
→ Lọc
→ Đo đầu ra
```

- Chi phí hóa chất thấp.
- Sinh nhiều bùn hơn và khó định lượng chính xác hơn.

#### Quy trình C — Kết hợp

```text
Đo mẫu
→ Dùng Ca(OH)₂ để xử lý phần lớn axit
→ Khuấy và đo pH
→ Dùng NaOH để tinh chỉnh
→ Lắng
→ Lọc
→ Đo đầu ra
```

- Cân bằng giữa chi phí, độ chính xác và an toàn.
- Nhiều bước hơn nhưng có thể đạt điểm tổng hợp tốt.

### 4.4. Nhánh sai và phục hồi

| Thao tác | Hậu quả | Cách tiếp tục |
| --- | --- | --- |
| Thêm quá ít bazơ | pH thấp, Cu chưa kết tủa hết | Thêm từng lượng nhỏ và đo lại |
| Thêm quá nhiều NaOH | pH vượt giới hạn | Dùng axit loãng để sửa, chịu thêm chi phí và cảnh báo |
| Lọc trước khi kết tủa | Cu hòa tan đi qua bộ lọc | Điều chỉnh pH rồi lọc lại |
| Không lọc sau kết tủa | Cu hòa tan thấp nhưng Cu tổng vẫn cao | Lắng và tách pha rắn |
| Chỉ kiểm tra pH | Có thể chưa đạt mục tiêu Cu | Đo Cu trước khi kết thúc |

## 5. Kịch bản 2 — Phân loại hỗn hợp nhựa

### 5.1. Trạng thái ban đầu

- hỗn hợp PP, HDPE, PS và PET;
- có nhãn, bụi bẩn và độ ẩm;
- mỗi loại có khối lượng và khối lượng riêng;
- dung dịch phân tách có khối lượng riêng xác định.

Mục tiêu:

- thu hồi loại nhựa được chỉ định;
- đạt độ tinh khiết và tỷ lệ thu hồi của kịch bản;
- giảm nước, hóa chất, chi phí và số bước.

### 5.2. Các hướng xử lý

| Hướng | Đánh đổi |
| --- | --- |
| Chỉ dùng nước | Nhanh và rẻ, nhưng các loại có khối lượng riêng gần nhau vẫn bị trộn |
| Tách nhiều cấp | Độ tinh khiết cao hơn, tốn thêm nước, môi trường phân tách và thời gian |
| Phân loại sơ bộ rồi nổi – chìm | Giảm số lần tách ướt nhưng tăng chi phí phân loại |

### 5.3. Trạng thái cần theo dõi

- khối lượng từng loại nhựa trong mỗi dòng;
- vật liệu nổi, chìm hoặc chưa tách;
- độ tinh khiết;
- tỷ lệ thu hồi;
- lượng nước và hóa chất;
- chi phí, thời gian và chất thải.

## 6. Khung bảo đảm tính thực tế và pháp lý

### 6.1. Phân biệt bốn loại xác nhận

| Loại | Câu hỏi cần trả lời |
| --- | --- |
| Tính thực tế | Quy trình này có được sử dụng hoặc thử nghiệm ngoài thực tế không? |
| Tính khoa học | Công thức, dữ liệu và giả định của mô hình có đúng trong phạm vi đã công bố không? |
| Đối chiếu pháp lý | Quy định nào áp dụng cho loại cơ sở, nguồn thải, địa điểm và thời điểm cụ thể? |
| Quyền áp dụng thực tế | Cơ sở có giấy phép, thiết kế, vận hành và quản lý chất thải đúng yêu cầu không? |

Phần mềm có thể cung cấp hồ sơ bằng chứng và đối chiếu cho ba lớp đầu. Phần mềm giáo dục không được tự chứng nhận lớp thứ tư.

### 6.2. Hồ sơ bằng chứng bắt buộc cho mỗi kịch bản

Mỗi kịch bản chỉ được chuyển sang trạng thái `validated` khi có:

1. Một nguồn kỹ thuật có thẩm quyền mô tả quy trình.
2. Một nguồn độc lập như giáo trình hoặc nghiên cứu bình duyệt.
3. Danh sách phương trình, hằng số, đơn vị và giả định.
4. Các ca kiểm thử chuẩn và kiểm tra bảo toàn khối lượng.
5. Người duyệt chuyên môn hóa học hoặc môi trường.
6. Hồ sơ quy định nếu kịch bản hiển thị ngưỡng pháp lý.
7. Ngày duyệt, phiên bản và lịch rà soát lại.

Nguồn pháp lý phải lấy từ cơ sở dữ liệu hoặc cổng thông tin chính thức. Blog và tài liệu nhà cung cấp chỉ được dùng làm nguồn bổ trợ.

### 6.3. Quy trình phê duyệt nội dung

```text
Đề xuất kịch bản
→ Thu thập nguồn kỹ thuật
→ Xác định phạm vi và giả định
→ Xây mô hình
→ Tạo ca kiểm thử chuẩn
→ Duyệt chuyên môn
→ Đối chiếu quy định theo phiên bản
→ Phát hành
→ Rà soát định kỳ hoặc khi quy định thay đổi
```

### 6.4. Cách trình bày trong sản phẩm

- Mặc định hiển thị **“đạt mục tiêu kịch bản”**, không hiển thị **“đạt pháp luật”**.
- Nếu có cấu hình quy định, dùng câu **“phù hợp với hồ sơ tham chiếu X tại phiên bản Y”**.
- Luôn hiển thị khu vực áp dụng, ngày hiệu lực, nguồn và giả định.
- Không suy luận tuân thủ chỉ từ một hoặc hai chỉ tiêu như pH và Cu.
- Không dùng mô phỏng thay cho phép đo, thử nghiệm jar test, thiết kế kỹ thuật hoặc giấy phép môi trường.
- Khi quy định thay đổi, tạo phiên bản cấu hình mới; không sửa ngược kết quả của phiên học cũ.

### 6.5. Khung tham chiếu Việt Nam cần theo dõi

Tại thời điểm 2026-08-10, các nguồn nền tảng gồm:

- [Luật Bảo vệ môi trường số 72/2020/QH14](https://vanban.chinhphu.vn/?docid=202613&pageid=27160), có hiệu lực từ 2022.
- Nghị định 08/2022/NĐ-CP và [Nghị định 05/2025/NĐ-CP](https://vanban.chinhphu.vn/?classid=1&docid=212284&orggroupid=2&pageid=27160) sửa đổi, bổ sung.
- [Thông tư 06/2025/TT-BTNMT](https://vbpl.vn/TW/Pages/vbpq-thuoctinh.aspx?ItemID=176985) ban hành QCVN 40:2025/BTNMT về nước thải công nghiệp, có hiệu lực từ 2025-09-01.

Giới hạn áp dụng thực tế còn phụ thuộc loại hình cơ sở, nguồn tiếp nhận, phân vùng xả thải, quy định chuyển tiếp và giấy phép môi trường. Vì vậy không được hard-code một ngưỡng duy nhất thành “chuẩn Việt Nam”.

### 6.6. Bằng chứng ban đầu cho hai kịch bản

- U.S. EPA mô tả kết tủa hóa học là công nghệ đã được sử dụng rộng rãi để loại kim loại và chất vô cơ; hiệu quả phụ thuộc pH, thành phần nước và cần được kiểm chứng bằng jar test hoặc đánh giá thực địa: [Wastewater Technology Fact Sheet — Chemical Precipitation](https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=P1001QTR.TXT).
- Nghiên cứu bình duyệt về phân tách nhựa nổi – chìm đã xây dựng và thử nghiệm hệ thống pilot nhiều cấp, đánh giá bằng độ tinh khiết và tỷ lệ thu hồi: [Sink–float density separation of post-consumer plastics for feedstock recycling](https://link.springer.com/article/10.1007/s10163-018-0748-z).

Các nguồn này chứng minh quy trình có cơ sở thực tế; chúng không tự tạo ra quyền vận hành hoặc kết luận tuân thủ pháp luật tại Việt Nam.

## 7. Tiêu chí nghiệm thu nền tảng

- Một Process Core dùng được cho cả nước thải và tái chế nhựa.
- Mỗi thao tác tạo ra trạng thái mới và có thể phát lại.
- Có thể hoàn tác và tạo nhánh so sánh.
- Không bắt buộc người học đi theo một đáp án duy nhất.
- Mọi kịch bản công khai nguồn, giả định, phiên bản và người duyệt.
- Mọi phép tính quan trọng có ca kiểm thử chuẩn.
- Mọi kết quả pháp lý đều được diễn đạt dưới dạng tham chiếu có phạm vi, không phải chứng nhận.

## 8. Ngoài phạm vi MVP

- chemistry engine tổng quát;
- mô phỏng phân tử hoặc thiết bị 3D;
- AI tự quyết định kết quả hóa học;
- tự động chứng nhận tuân thủ pháp luật;
- thiết kế hệ thống xử lý dùng trực tiếp ngoài thực tế;
- tái chế pin và rác điện tử trước khi có chuyên gia và bộ dữ liệu được duyệt.
