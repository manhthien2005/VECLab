# CONTEXT NGUỒN CHO VIDEO: PHÂN LOẠI NHỰA NGUYÊN SINH TRÊN VECLAB

Tài liệu này cung cấp context độc lập để tạo video giải thích thí nghiệm **Phân loại nhựa nguyên sinh** trên VECLab. Mọi dữ kiện khoa học chỉ lấy từ `F:\VECLab\11356_2021_Article_15611.pdf`. Không bổ sung số liệu từ nguồn khác hoặc tự điền phần bài báo không nêu.

## 1. Câu hỏi trung tâm

**Làm sao dùng các dung dịch có khối lượng riêng khác nhau để tách sáu loại nhựa nguyên sinh thành các phân đoạn nổi và chìm, rồi đánh giá lượng vật liệu thu hồi?**

Đây là phương pháp chìm–nổi. Hạt nhẹ hơn môi trường có xu hướng nổi; hạt nặng hơn môi trường có xu hướng chìm. Thay đổi dung dịch có thể đổi polymer nằm ở mỗi phân đoạn. Quá trình chỉ phân loại vật liệu, không biến polymer này thành polymer khác.

## 2. Mẫu và điều kiện theo bài báo

Mỗi polymer được cấp 2,0 kg trong mẻ pilot. Table 1 mô tả sáu mẫu:

| Polymer | Khối lượng riêng | Hình dạng/màu bài báo mô tả |
| --- | ---: | --- |
| PP | 0,910 g/cm³ | Pellet trắng, trong hơn HDPE; 2–3,36 mm |
| HDPE | 0,953 g/cm³ | Pellet trắng; 2–3,36 mm |
| PS | 1,040 g/cm³ | Hình cầu trắng trong; 2–3 mm |
| ABS | 1,070 g/cm³ | Hình cầu vàng nhạt; 2–3 mm |
| PA | 1,140 g/cm³ | Hạt dạng chữ nhật màu trắng; 2–3,5 mm |
| PC | 1,200 g/cm³ | Hình trụ màu trắng; 2–3,5 mm |

Mẫu được trộn trong bể pilot **800 L hữu ích**, với nước máy, khuấy **160 rpm trong 1 giờ** để làm ướt và tránh bọt khí bám hạt. Sau mỗi lần tách, các phân đoạn được ly tâm ở **2.950 rpm**, rồi cân để đánh giá thu hồi theo cân bằng khối lượng.

## 3. Quy trình và kết quả chính

### Tách sơ bộ bằng nước

- Nổi: **PP + HDPE**.
- Chìm: **PS + ABS + PA + PC**.
- Bài báo báo cáo **97,5% thu hồi cho nhóm PP + HDPE**, không có tỷ lệ riêng từng polymer ở bước này.

### Nhánh nhẹ — Ethanol

| Điều kiện theo Results/Figure 6 | Nổi | Chìm | Thu hồi báo cáo |
| --- | --- | --- | --- |
| 23% v/v | PP bắt đầu tách | HDPE | PP: 95,60% |
| 31% v/v | PP tách hoàn toàn khỏi HDPE | HDPE | HDPE: 99,70% |

Trong UI, preset 31% minh họa đưa PP trở lại cùng phân đoạn HDPE để quan sát sự tách hoàn toàn; sau ly tâm, chỉ cân HDPE. Bài báo khuyến nghị xử lý theo giai đoạn các phân đoạn đã tách, nhưng không mô tả chính xác thao tác/nút bấm này. Gọi đây là **minh họa của mô phỏng**, không nói là video tái hiện nguyên văn thao tác của tác giả.

### Nhánh nặng — NaCl

| Điều kiện | Nổi | Chìm | Thu hồi báo cáo |
| --- | --- | --- | --- |
| 11–12% w/v | PS | ABS + PA + PC | PS: 80,3% |
| 20% w/v | ABS | PA + PC | ABS: 84,8% |
| 40% w/v | PA | PC | PA: 70%; PC: 95,4% |

Ở preset 40%, video/UI cần thể hiện PA nổi, PC chìm; sau ly tâm đưa mỗi loại lên **một cân riêng**. Bài báo báo cáo phần trăm thu hồi nhưng không nêu khối lượng cân riêng bằng kg. Nếu hiển thị PA ≈1,40 kg và PC ≈1,91 kg, ghi rõ đó là phép quy đổi minh họa từ 2,0 kg × recovery, không phải số cân tác giả công bố.

## 4. Luồng trên VECLab

Đường vào: **Thí nghiệm (`/experiments`) → Phân loại nhựa nguyên sinh → Bắt đầu thực hành**. Mô phỏng: `/simulate/plastic-density-separation`; hướng dẫn: `/experiments/plastic-density-separation/guide`.

Bàn thực hành có mẫu/dụng cụ bên trái, sơ đồ bể pilot SVG ở giữa, thanh tiến trình và thẻ thao tác bên phải. Luồng gồm: **Chuẩn bị mẫu → Tách nước → Ly tâm & cân → Phân loại dung dịch (Ethanol hoặc NaCl) → Kết quả**. Chạy preset tạo animation nổi/chìm trong bể pilot; người học ghi nhận ly tâm/cân để cập nhật kết quả. Bảng thu hồi chỉ hiện số sau khi preset tương ứng đã chạy và hoàn tất ly tâm/cân.

## 5. Gợi ý storyboard ngắn

1. Mở bằng câu hỏi: vì sao các loại nhựa khác nhau lại nổi/chìm khác nhau?
2. Giới thiệu sáu polymer, hình dạng hạt và khối lượng riêng; nạp mẫu vào bể 800 L.
3. Khuấy trong nước ở 160 rpm, 1 giờ; PP+HDPE nổi, bốn polymer còn lại chìm.
4. Tách tiếp PP/HDPE bằng ethanol: 23% bắt đầu tách; 31% tách hoàn toàn theo Results/Figure 6.
5. Tách PS, ABS, PA, PC bằng ba mức NaCl; nhấn mạnh tại 40% PA nổi, PC chìm và được cân riêng.
6. Kết luận: chìm–nổi cho biết phân đoạn; cân bằng khối lượng cho biết recovery.

## 6. Quy tắc hình ảnh và giới hạn

- Giữ màu/hình dạng từng polymer nhất quán. Màu UI là mã minh họa, không phải màu nhận diện khoa học; ưu tiên giữ hình dạng theo Table 1.
- Dùng cùng một bể pilot cho nước, Ethanol và NaCl. Hạt chuyển động lên/xuống mượt, dễ đọc; không để hạt đè lên chữ hoặc thiết bị.
- Animation là minh họa, không mô phỏng vận tốc nổi/lắng hoặc thời gian thực. Không thêm số pH, khối lượng đo thật, nồng độ ngoài preset hay hiệu suất không có trong bài.
- **Recovery không phải purity.** Không nói phân đoạn đã tinh khiết hoàn toàn chỉ vì hạt nổi/chìm hoặc recovery cao.
- Không nhập quy trình nhựa sau tiêu dùng vào luồng này. Bài báo có quy trình riêng cho nhựa thải, bao gồm nghiền mẫu; video này tập trung sáu polymer nguyên sinh.

## 7. Điểm không nhất quán trong PDF cần công khai

- **Ethanol:** Abstract và Conclusion gán kết quả khác với Results. Các số trong context/UI này theo Results và Figure 6: 23% thu hồi PP 95,60%; 31% tách hoàn toàn và thu hồi HDPE 99,70%. Nếu nêu số, nói rõ phần bài báo đang theo.
- **Tách nước:** một câu trong Materials and methods nhắc PET trong nhóm chìm, trong khi Table 1 và bộ sáu mẫu nguyên sinh có PC. Luồng VECLab theo sáu polymer ở Table 1; không tự đưa PET vào danh sách.
- Methods ghi khối lượng riêng dung dịch NaCl 1,055 / 1,100 / 1,175 g/cm³ và ethanol 0,935 g/cm³; Results/Figures ghi nồng độ phần trăm. Không tự quy đổi hai cách mô tả này.

## Nguồn duy nhất

Meneses Quelal, W. O., Velázquez-Martí, B., & Ferrer Gisbert, A. (2022). “Separation of virgin plastic polymers and post-consumer mixed plastic waste by sinking-flotation technique.” *Environmental Science and Pollution Research*, 29, 1364–1374. DOI: `10.1007/s11356-021-15611-w`. PDF: `F:\VECLab\11356_2021_Article_15611.pdf` (Table 1; Materials and methods; Results/Figures 1, 5, 6; Discussion; Conclusion).
