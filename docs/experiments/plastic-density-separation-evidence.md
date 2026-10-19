# Sổ đăng ký bằng chứng khoa học: Phân loại nhựa nguyên sinh (Evidence Register)

**Mã kịch bản (Scenario):** `plastic-density-separation`  
**Phiên bản đăng ký (Register Version):** `1.0.0`  
**Ngày cập nhật:** 17/10/2026

---

## 1. Nguồn khoa học được trích dẫn (Sources)

### `MENESES-QUELAL-2022`
- **Tác giả:** Meneses Quelal, O., Velázquez-Martí, B., & Ferrer Gisbert, C. M.
- **Năm xuất bản:** 2022
- **Tựa đề:** Separation of virgin and post-consumer plastics by density methods
- **Tạp chí:** *Environmental Science and Pollution Research*, 29, 15611–15622
- **DOI:** [10.1007/s11356-021-15611-w](https://doi.org/10.1007/s11356-021-15611-w)
- **Phạm vi sử dụng trong VECLab:**
  - Bảng 1 (Table 1): Khối lượng riêng danh định và hình thái của sáu loại polymer nguyên sinh (PP, HDPE, PS, ABS, PA, PC).
  - Mục Phương pháp (Materials and methods): Bể pilot 800 L, khuấy 160 rpm trong 1 giờ làm ướt; máy ly tâm 2.950 rpm; mẫu 2,0 kg mỗi polymer.
  - Mục Kết quả và Thảo luận (Results and discussion) & Hình 6 (Fig. 6): Tách nước (nổi PP+HDPE, thu hồi 97,5%), các preset ethanol (23% và 31% v/v), các preset NaCl (11–12%, 20%, 40% w/v) và các tỷ lệ thu hồi tương ứng.

---

## 2. Các tuyên bố khoa học có bằng chứng (Evidenced Claims)

| Mã tuyên bố | Nội dung tuyên bố | Trích dẫn nguồn |
| :--- | :--- | :--- |
| **PDS-6-POLYMERS** | Sáu polymer nguyên sinh được khảo sát có khối lượng riêng danh định: PP (0,910 g/cm³), HDPE (0,953 g/cm³), PS (1,040 g/cm³), ABS (1,070 g/cm³), PA (1,140 g/cm³), PC (1,200 g/cm³). | MENESES-QUELAL-2022, Table 1 |
| **PDS-WATER-STAGE** | Trong nước máy, PP và HDPE nổi lên bề mặt trong khi PS, ABS, PA và PC chìm xuống đáy; tỷ lệ thu hồi phân đoạn nhẹ PP+HDPE đạt 97,5%. | MENESES-QUELAL-2022, Section 3.1 & Fig. 6 |
| **PDS-ETHANOL-PRESETS** | Trong môi trường ethanol, ở nồng độ 23% v/v PP bắt đầu tách và đạt tỷ lệ thu hồi 95,60%; ở 31% v/v đạt sự tách hoàn toàn với tỷ lệ thu hồi HDPE 99,70%. | MENESES-QUELAL-2022, Section 3.2 & Fig. 6 |
| **PDS-NACL-PRESETS** | Trong môi trường NaCl, ở 11–12% w/v PS nổi với thu hồi 80,3%; ở 20% w/v ABS nổi với thu hồi 84,8%; ở 40% w/v PA nổi với thu hồi 70% và PC chìm với thu hồi 95,4%. | MENESES-QUELAL-2022, Section 3.2 & Fig. 6 |
| **PDS-CENTRIFUGE-CONDITIONS** | Sau mỗi giai đoạn tách, các phần vật liệu được ly tâm ở tốc độ 2.950 rpm để làm sạch bề mặt và cân xác định khối lượng. | MENESES-QUELAL-2022, Section 2.2 |
| **PDS-RESULTS-FIG6-ALIGNMENT** | VECLab áp dụng kết quả gán polymer và tỷ lệ thu hồi theo mục Results và Hình 6 để giải quyết mâu thuẫn hoán đổi nhãn trong mục Abstract/Conclusion của bài báo gốc. | MENESES-QUELAL-2022, Section 3 & Fig. 6 |

---

## 3. Các giới hạn công bố (Limitations)

1. **`limitations.plastic.pilot-conditions`**: Các thông số 800 L, 160 rpm, 1 giờ và 2,0 kg mỗi mẫu là điều kiện mẻ thí nghiệm pilot của tác giả; phần mềm không mô phỏng động học chất lưu hay thời gian thực của thiết bị pilot.
2. **`limitations.plastic.discrete-presets-only`**: Mô hình chỉ hỗ trợ các nồng độ định mức rời rạc đã được bài báo công bố; không hỗ trợ nội suy đường cong tỷ trọng – nồng độ.
3. **`limitations.plastic.recovery-not-purity`**: Số liệu công bố là tỷ lệ thu hồi vật liệu (recovery), không phản ánh độ tinh khiết hóa học tuyệt đối của từng phân đoạn.
4. **`limitations.plastic.ethanol-conflict-disclosed`**: Người học cần lưu ý sự không đồng nhất giữa phần Tóm tắt/Kết luận và phần Kết quả/Hình 6 trong bài báo nguồn; mô hình chọn thể hiện theo phần Kết quả và Hình 6.
