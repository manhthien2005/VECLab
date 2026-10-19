# Đặc tả kỹ thuật: Quy trình phân loại nhựa nguyên sinh (Virgin Plastic Density Separation Profile)

**Mã kịch bản (Scenario Key):** `plastic-density-separation`  
**Mã phát hành (Release ID):** `plastic-separation@0.2.0`  
**Mã đặc tả mô hình (Model Spec Version):** `meneses-quelal-2022-virgin-separation`  
**Nguồn khoa học:** Meneses Quelal, Velázquez-Martí & Ferrer Gisbert (2022), DOI [10.1007/s11356-021-15611-w](https://doi.org/10.1007/s11356-021-15611-w)

---

## 1. Mục tiêu và phạm vi

Tài liệu này xác lập hồ sơ kỹ thuật (profile) chuẩn cho mô phỏng phân loại sáu loại polymer nguyên sinh bằng phương pháp chìm–nổi trong các môi trường lỏng khác nhau (nước máy, dung dịch ethanol và dung dịch muối NaCl).

Toàn bộ các thông số vật liệu, điều kiện thiết bị pilot, nồng độ môi trường và kết quả thu hồi được trích xuất trực tiếp từ bài báo khoa học. Không có thông số nào được suy diễn hoặc tự tính toán nội suy.

---

## 2. Thông số sáu polymer nguyên sinh (Table 1)

Nghiên cứu sử dụng sáu loại polymer nguyên sinh với các đặc điểm hình dạng, kích thước và khối lượng riêng danh định như sau:

| Mã | Tên đầy đủ | Khối lượng riêng danh định (g/cm³) | Hình dạng hạt và màu sắc | Kích thước hạt |
| :--- | :--- | :---: | :--- | :---: |
| **PP** | Polypropylene | 0,910 | Dạng hạt (pellets), trắng mờ | 2,0 – 3,36 mm |
| **HDPE** | High-Density Polyethylene | 0,953 | Dạng hạt (pellets), trắng đục | 2,0 – 3,36 mm |
| **PS** | Polystyrene | 1,040 | Hình cầu (spheres), trắng trong suốt | 2,0 – 3,0 mm |
| **ABS** | Acrylonitrile Butadiene Styrene | 1,070 | Hình cầu (spheres), vàng nhạt | 2,0 – 3,0 mm |
| **PA** | Polyamide | 1,140 | Dạng hạt chữ nhật (granules), trắng | 2,0 – 3,5 mm |
| **PC** | Polycarbonate | 1,200 | Dạng hình trụ (cylinders), trắng trong | 2,0 – 3,5 mm |

- **Khối lượng cấp liệu mỗi mẫu:** 2,0 kg cho mỗi polymer (tổng cộng 12,0 kg trong một mẻ nghiên cứu pilot).
- **Mục đích giáo dục:** Người học nhận biết sự khác biệt về hình thái hạt theo mô tả bài báo; màu sắc trên giao diện là mã quy ước trực quan (UI code), không thay thế cho hình dạng thực tế.

---

## 3. Điều kiện vận hành pilot và các bước thực nghiệm

### 3.1. Giai đoạn 1: Chuẩn bị mẫu và làm ướt trong nước máy
- **Thiết bị:** Bể pilot thể tích hữu ích 800 L.
- **Môi trường:** Nước máy. Bài báo không nêu khối lượng riêng nước máy trong mô tả quy trình này; hồ sơ không gán thêm giá trị.
- **Chế độ khuấy:** Cánh khuấy quay ở 160 rpm trong thời gian 1 giờ nhằm làm ướt hoàn toàn bề mặt hạt và loại bỏ bọt khí bám dính.
- **Kết quả phân lớp:**
  - **Phân đoạn nổi (Light fraction):** PP + HDPE.
  - **Phân đoạn chìm (Heavy fraction):** PS + ABS + PA + PC.
  - **Tỷ lệ thu hồi báo cáo:** Nhóm nhẹ (PP + HDPE) đạt 97,5%.
  - *Lưu ý:* Bài báo báo cáo tỷ lệ thu hồi cho cả nhóm PP + HDPE ở bước này, không báo cáo tỷ lệ riêng rẽ cho từng polymer trong nước máy.

### 3.2. Thu hồi và ly tâm
- Hạt sau khi vớt ra khỏi bề mặt nổi hoặc lắng dưới đáy bể được đưa qua máy ly tâm với tốc độ **2.950 rpm** để loại bỏ độ ẩm bề mặt và chất bẩn bám dính.
- Sau ly tâm, mẫu được cân để tính toán hiệu suất thu hồi theo cân bằng khối lượng.
- Phân đoạn nhẹ và phân đoạn nặng được chuyển sang hai nhánh xử lý chọn lọc độc lập.

---

## 4. Các preset môi trường và kết quả phân loại

Engine mô phỏng chỉ hỗ trợ các **preset rời rạc** đã được công bố trong bài báo. Nghiêm cấm việc nội suy hoặc nhập nồng độ tùy ý.

### 4.1. Nhánh Ethanol (xử lý phân đoạn nhẹ: PP + HDPE)
Môi trường phân loại là hỗn hợp ethanol–nước (% thể tích v/v):

| Preset | Nồng độ | Hiện tượng nổi | Hiện tượng chìm | Kết quả thu hồi theo bài báo | Ghi chú khoa học |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **E1** | 23% v/v | PP | HDPE | Thu hồi PP: 95,60% | PP bắt đầu nổi tách khỏi HDPE. |
| **E2** | 31% v/v | PP | HDPE | Thu hồi HDPE: 99,70% | Tách hoàn toàn giữa PP và HDPE. |

> **Thông tin công khai về mâu thuẫn trong bài báo:**  
> Trong bài báo gốc, phần Tóm tắt (Abstract) và Kết luận (Conclusion) có sự hoán đổi nhãn polymer thu hồi so với phần Kết quả (Results) và Hình 6 (Fig. 6).  
> Đặc tả này tuân thủ thống nhất theo **phần Kết quả và Hình 6**: ở 23% v/v thu hồi PP đạt 95,60%; ở 31% v/v thu hồi HDPE đạt 99,70%. Mâu thuẫn này được công bố minh bạch trên giao diện để người học nắm rõ.

### 4.2. Nhánh NaCl (xử lý phân đoạn nặng: PS + ABS + PA + PC)
Môi trường phân loại là dung dịch muối ăn NaCl trong nước (% khối lượng trên thể tích w/v):

| Preset | Nồng độ | Hiện tượng nổi | Hiện tượng chìm | Kết quả thu hồi theo bài báo | Ghi chú khoa học |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **S1** | 11–12% w/v | PS | ABS, PA, PC | Thu hồi PS: 80,3% | PS tách khỏi nhóm còn lại. |
| **S2** | 20% w/v | ABS | PA, PC | Thu hồi ABS: 84,8% | ABS nổi lên bề mặt. |
| **S3** | 40% w/v | PA | PC | Thu hồi PA: 70,0%<br>Thu hồi PC: 95,4% | PA nổi, PC chìm hoàn toàn xuống đáy. |

---

## 5. Ranh giới mô hình và quy tắc dữ liệu

1. **Thu hồi (Recovery) vs. Độ tinh khiết (Purity):**  
   Các tỷ lệ phần trăm được bài báo công bố là **tỷ lệ thu hồi vật liệu (material recovery rate)** qua cân bằng khối lượng. Tuyệt đối không diễn giải các con số này thành "độ tinh khiết" (purity) vì bài báo không công bố số liệu kiểm định thành phần hóa học riêng biệt sau mỗi bước.
2. **Không mô phỏng động học lắng/nổi liên tục:**  
   Thời gian khuấy 1 giờ ở pilot là điều kiện nghiên cứu, animation chỉ minh họa thao tác tượng trưng. Không tạo thanh đếm ngược hay tính toán vận tốc nổi Stokes.
3. **Từ chối nồng độ ngoài preset:**  
   Bất kỳ yêu cầu thực hiện hành động nào ngoài danh mục preset trên sẽ bị engine từ chối với lỗi domain `INVALID_PRESET_CONDITION`.
