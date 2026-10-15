# Hồ sơ khoa học bài chiết tách — bản học tập A/B/N v1

Trạng thái: mô hình học tập lý tưởng, chưa hiệu chuẩn thực nghiệm cho một hỗn hợp hóa chất thật. Không lấy hệ số thực của hệ dung môi khác ghép vào bài này. Các giá trị dưới đây là quyết định thiết kế công khai, không phải kết quả đo từ các nguồn phương pháp.

## Tham số và ý nghĩa

- Mỗi cấu tử ban đầu 0,001 mol, khối lượng mol quy ước 100 g/mol: 100 mg A, 100 mg B, 100 mg N; 40 mL pha hữu cơ chuẩn.
- A: axit yếu, pKa=4,2; B: bazơ yếu, pKa(BH+)=5; N: trung tính. Chỉ dạng trung hòa phân bố vào pha hữu cơ.
- K trung hòa A/B/N=50/30/100. Độ tan nội tại pha nước lần lượt 0,001/0,001/0,0005 mol/L. Nhiệt độ cố định 25 °C.
- Thuốc thử axit/bazơ mạnh chuẩn 0,1 mol/L. Lượng axit trừ bazơ mạnh được giữ và chuyển cùng pha nước; pH tìm bằng cân bằng điện tích, không gán từ slider.
- Thể tích cộng tính, dung môi chuẩn có khối lượng riêng quy ước 0,71 g/mL, lớp hữu cơ ở trên; bỏ qua độ tan chéo giữa hai dung môi.
- Lọc lý tưởng thu rắn, kèm tối đa 0,5 mL pha nước nếu có rắn; đây là quy ước thiết bị. Làm khô loại phần dung môi giữ lại.
- Phép cân của mô hình chỉ tính A/B/N + nước/dung môi giữ lại. Không tính khối lượng muối và thuốc thử dư, không dùng con số này làm dự đoán cân thực tế.

## Công thức và kiểm tra độc lập

Với nồng độ trung hòa trong pha nước c, tổng lượng = c[Vaq(1+r)+K Vorg], giới hạn c bởi độ tan nội tại. rA=Ka/[H+], rB=[H+]/Ka(BH+), rN=0. Lượng dư thành rắn trung hòa. pH giải cân bằng điện tích giữa H+, OH-, dạng ion A/B và lượng axit/bazơ mạnh trong pha nước.

Kiểm tra toán học độc lập cho một chất giả định K=2, 100 mL pha nước và tổng 60 mL dung môi: một lần chiết thu 54,5454545455%; ba lần 20 mL thu 63,5568513120%. Đây là fixture đại số, không phải số đo hay hệ số mẫu A/B/N. Tổng lượng từng A/B/N qua S/F/R1/R2/R3/W phải luôn bằng 0,001 mol trong sai số 1e-10 mol.

## Nguồn phương pháp

1. [MIT OCW — Transfer and Extraction Techniques](https://ocw.mit.edu/courses/5-301-chemistry-laboratory-techniques-january-iap-2012/pages/labs/acids-bases-in-between/): tự thiết kế trình tự chiết/rửa, thu hồi và cân sản phẩm. Hỗn hợp thực của MIT khác mẫu chuẩn trừu tượng này.
2. [National Taiwan University — Extraction, 2024](https://teaching.ch.ntu.edu.tw/gclab/eng/wp-content/uploads/5_M19_Extraction.pdf): hệ số phân bố, chiết nhiều lần, ion hóa, lọc, làm khô và cô. Không dùng quy trình hay hệ số của bài hai cấu tử như dữ liệu xác nhận bài ba cấu tử.
3. [University Chemistry, DOI 10.3866/PKU.DXHX201904048](https://www.dxhx.pku.edu.cn/EN/10.3866/PKU.DXHX201904048): các phương án tách axit/kiềm và mục tiêu giáo dục. Không gán phần trăm thu hồi thực nghiệm trong bài báo cho VECLab.

## Ngoài phạm vi

Kinetics, nhũ tương, áp suất, hoạt độ dung dịch đậm đặc, phản ứng phụ, dung môi tự do, nhiệt độ tự do, salts in dry-product mass, melting point và phân tích phổ. Không tạo hiệu ứng màu riêng cho A/B/N để lộ đáp án. Nguồn hỗ trợ nguyên lý; số kiểm tra chương trình xác nhận triển khai theo mô hình, không xác nhận mô hình thực nghiệm.
