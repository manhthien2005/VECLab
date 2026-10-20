Tôi đã rà soát toàn bộ danh sách, chưa tìm nguồn. Phần dưới đây liệt kê lại các công thức và hằng số, kèm nhận xét và các chỗ còn thiếu. Bạn xác nhận rồi mình sẽ tìm nguồn.

# Rà soát công thức và hằng số: X\u00e0 ph\u00f2ng th\u1ee7 c\u00f4ng

## 1. Công thức có nguồn một phần

| # | Công thức / hằng số | Trạng thái | Ghi chú kiểm tra | Cần tìm |
|---|---|---|---|---|
| 1 | SAP ô liu 0,136 / dừa 0,183 / cọ 0,142 g NaOH/g dầu | Có nguồn | Đã đổi từ mg KOH/g sang g NaOH/g dầu (×40/56/1000). Đúng. | Đối chiếu tiêu chuẩn gốc (ISO / Codex) |
| 2 | m(NaOH) = m(dầu) × SAP × (1 − S) | Hợp lý | Cần ghi rõ SAP ở đây là hệ số NaOH (g/g), không phải mg KOH/g. Nếu không, công thức sai đơn vị. | Không cần |
| 3 | Thứ tự pha: NaOH vào nước | Có nguồn (LibreTexts Exp. 718) | Đúng | Không cần |

## 2. Công thức của game, cần kiểm tra lại

| # | Công thức / hằng số | Trạng thái | Vấn đề phát hiện | Cần tìm |
|---|---|---|---|---|
| 4 | C = m(NaOH) / (m(NaOH) + m(nước)) | Đúng toán | Ngưỡng 24–33% là tiêu chí học tập, chưa có nguồn | Khoảng nồng độ cold process thường gặp |
| 5 | Nước trên 1 g NaOH = (1 − C)/C | Đúng | Không có | Không cần |
| 6 | ΔT = η × n × ΔH / (m × c) | Sai ở đây | ΔH = 44 500 J/mol là giá trị hòa tan NaOH rắn ở nồng độ vô hạn loãng. Với dung dịch 27%, nhiệt thực tế khác. η = 0,6 là số hiệu chỉnh để khớp spec cũ, không phải hằng số vật lý. | Nhiệt hòa tan NaOH (CRC Handbook), nhiệt dung riêng dung dịch |
| 7 | T_kiềm = T_phòng + ΔT | Đúng về cấu trúc | Với 65 g NaOH và 175 g nước, ΔT ≈ 59 K, cho T ≈ 84 °C. Khớp spec cũ. | Không cần |
| 8 | Nguội: t = −τ ln((T_đích − T_phòng)/(T_đầu − T_phòng)) | Đúng toán | τ = 25 phút là giả định game, cần kiểm tra theo khối lượng và loại bình | Hằng số thời gian làm nguội bình thủy tinh 250–500 mL |
| 9 | S_thực = 1 − m(NaOH)/(m(dầu) × SAP) | **Thiếu đổi đơn vị** | SAP là mg KOH/g, nên cần nhân 40/56/1000 để ra g NaOH. Nếu dùng trực tiếp sẽ sai khoảng 1000 lần. | Không cần, chỉ sửa công thức |
| 10 | ΔT_trộn = \|T_kiềm_max − T_dầu\| | Mơ hồ | Chữ "max" chưa rõ là nhiệt cao nhất đo được hay nhiệt sau khi nguội. Với T_kiềm ≈ 84 °C, ΔT ≈ 39 K, vượt ngưỡng 15 K. Chỉ đạt nếu người chơi nguội kiềm trước khi trộn. | Không cần, cần làm rõ cách tính |
| 11 | T_hỗn hợp = Σ(m·T)/Σm | **Sai** | Công thức trung bình theo khối lượng bỏ qua nhiệt dung khác nhau. Dầu có c ≈ 2,0 J/g·K, nước ≈ 4,18 J/g·K. Nên dùng Σ(m·c·T)/Σ(m·c). | Nhiệt dung riêng dầu thực vật |
| 12 | Seizing: T ≥ 55 °C và khuấy máy > 10 phút | Giả định game | Không có nguồn. Ngưỡng này là quy ước của game, không phải dữ liệu đo. | Tài liệu thực hành về seizing / đông nhanh |
| 13 | Thời gian khuấy: máy 12 phút / 3 phút đặc, tay 5 / 30 phút | Mơ hồ | Ghi "3 phút đặc" không rõ là thời gian đến Trace hay thời gian đặc lại. Tay 5 / 30 phút chưa có nguồn. | Thời gian Trace thực tế theo phương pháp khuấy |
| 14 | m_nước_còn = m₀ × (0,20 + 0,80·e^(−t/τ)), τ = 13 460 phút, ủ 4 tuần | Giả định game | Đây là mô hình nén đơn giản. f = 0,20 và τ chưa có nguồn. Mô hình không tính đến độ ẩm môi trường. | Tỉ lệ nước còn lại sau khi ủ, hằng số bay hơi |
| 15 | m_bánh = m(NaOH) + m(dầu) + m_nước_còn | **Sai nhẹ** | Với superfat > 0, NaOH dư không phản ứng. Nên dùng NaOH thực tế đã phản ứng = min(m(NaOH), m(dầu) × SAP × 0,714/1000). | Không cần, chỉ sửa công thức |
| 16 | pH = 11,2 nếu S ≤ 0; ngược lại max(8, 9,4 + (0,05 − S)·8) | **Gián đoạn tại S = 0** | Tại S = 0 nhánh thứ hai cho pH 9,8, còn nhánh đầu cho 11,2. Đây là bước nhảy 1,4 đơn vị pH. Đây cũng là mô hình tự đặt, không phải số đo. | Đường cong pH theo superfat từ tài liệu |
| 17 | ρ_NaOH = 2,13 | **Sai** | 2,13 g/cm³ là mật độ NaOH rắn. Dung dịch 27% có mật độ khoảng 1,30 g/mL. Công thức dùng cho thể tích dung dịch phải dùng số này. | Bảng mật độ dung dịch NaOH theo nồng độ (CRC) |
| 18 | ρ dầu: dừa 0,91 / cọ 0,92 / ô liu 0,91 | Cần kiểm tra | Dầu cọ thường khoảng 0,89–0,91 g/mL. Ba giá trị này là ước lượng. | Mật độ dầu theo loại |
| 19 | Dung tích cốc theo khối lượng dầu (W/O/M/D) | Tự đặt | Chưa có nguồn, chỉ là quy ước để chia cấp độ cốc | Không cần, là thiết kế game |
| 20 | Sai lệch nồng độ ≤ 0,01 (1 điểm %) | Tự đặt | Cần ghi rõ là tỉ lệ phần trăm khối lượng, không phải phần trăm tương đối | Không cần |

## 3. Hằng số quy trình

| # | Hằng số | Giá trị | Trạng thái | Cần tìm |
|---|---|---|---|---|
| 21 | Gel 24 giờ | 24 h | Thực hành phổ biến | Không cần, đã thống nhất |
| 22 | Ủ 4 tuần | 4 tuần | Thực hành phổ biến (thường 4–6 tuần) | Không cần |
| 23 | pH đạt 9–10 | 9–10 | Tiêu chí học tập, cần nguồn | pH xà phòng đã ủ, nguồn bình duyệt hoặc tài liệu chuyên ngành |
| 24 | Giới hạn khối lượng dầu | ô liu 50–1000 g, dừa 50–600 g, cọ 50–800 g | Tự đặt | Không cần |
| 25 | T_dầu = 45 °C, T_phòng = 25 °C | Tự đặt | Cần ghi rõ là giá trị game | Không cần |
| 26 | Số mẫu tối đa 3, dung sai 0,05 mL | Tự đặt | Kỹ thuật | Không cần |

## 4. Những thứ còn thiếu

Các phần sau có trong quy trình nhưng chưa có công thức:
- **Nhiệt dung riêng** của dầu và dung dịch NaOH, cần cho công thức nhiệt.
- **Nhiệt tỏa ra khi xà phòng hóa**. Hiện công thức không tính phần này, nên nhiệt hỗn hợp có thể thấp hơn thực tế.
- **Mật độ hỗn hợp** lúc Trace. Hiện chỉ có giá trị 1,05 cố định.
- **Thể tích tổng** để kiểm tra tràn cốc. Có công thức V = m/ρ cho từng thành phần, nhưng chưa có tổng.
- **Thời gian đạt Trace** theo loại dầu và phương pháp khuấy. Hiện chỉ có bảng giá trị.

## 5. Các nguồn cần tìm sau khi bạn xác nhận

1. Nhiệt hòa tan NaOH và nhiệt dung riêng của dung dịch kiềm (CRC Handbook)
2. Mật độ dung dịch NaOH theo nồng độ
3. Mật độ và nhiệt dung riêng của dầu ô liu, dừa, cọ
4. pH của xà phòng đã ủ theo superfat
5. Tài liệu về thời gian đạt Trace và hiện tượng seizing
6. Hằng số bay hơi nước trong xà phòng khi ủ

Bạn xác nhận danh sách này và thứ tự tìm nguồn (hoặc đổi thứ tự), mình sẽ bắt đầu tìm.