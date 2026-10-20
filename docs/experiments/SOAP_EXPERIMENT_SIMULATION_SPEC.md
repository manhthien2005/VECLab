# Bài xà phòng hóa (cold process)

Tài liệu mô tả bản triển khai `cold-process-soap@0.2.0`. Đây là mô hình học tập, không phải công thức chế tạo hoặc chứng nhận sản phẩm dùng trên da.

## Nguồn triển khai

- [Profile và trạng thái](../../src/domain/experiments/soap/model.ts): tham số khóa, đơn vị, tiêu chí mẫu và công thức của mô hình.
- [Engine](../../src/domain/experiments/soap/engine.ts): kiểm tra đầu vào và chuyển trạng thái.
- [Session](../../src/application/simulation/soap-session.ts): lưu lượt trên trình duyệt, kiểm tra phiên bản, phát lại sự kiện và chống ghi trùng/xung đột.
- [Nguồn và giới hạn](../../src/content/evidence/soap.ts), cùng [bảng rà soát nguồn](../evidence/xa_phong_nguon_cong_thuc.xlsx): phân biệt trích dẫn với giả định mô hình.

## Quy trình hiện hành

1. Chọn cốc. Kính và găng được coi là đã đeo sẵn.
2. Rót nước rồi NaOH vào cốc W; có thể làm nguội kiềm. Rót nước vào NaOH rắn chuyển lượt sang trạng thái nguy hiểm và khóa các thao tác tiếp theo, ngoại trừ hoàn thành lượt.
3. Chọn dầu ô liu, dừa hoặc cọ và rót vào cốc O. Dầu có nhiệt độ cố định 45 °C. Lượng rót bị giới hạn theo dung tích cốc; không có ngưỡng khối lượng tối thiểu/tối đa riêng cho từng loại dầu.
4. Rót kiềm và dầu sang cốc M; khuấy tay hoặc máy, rồi chờ đặc lại. Có thể đổ khuôn sau khuấy nhưng trước đặc lại; mẫu sẽ trượt tiêu chí này. Hỗn hợp đông cứng sớm không đổ khuôn được.
5. Đổ vào khuôn D; chờ 24 giờ mô phỏng, tháo khuôn, chờ 4 tuần mô phỏng rồi đo pH và khối lượng.
6. Làm tối đa 3 mẫu. Có ít nhất một mẫu đạt tất cả tiêu chí thì lượt đạt; lượt thường cần ít nhất một mẫu trước khi hoàn thành.

Cốc W/O/M/D có dung tích cố định lần lượt 750/750/1200/1000 mL. Tràn cốc bị từ chối mà không đổi trạng thái. Các trường thể tích được chuẩn hóa về L trước khi vào engine; khối lượng dùng g, nhiệt độ dùng °C. Hình minh họa chỉ trình bày kết quả đã lưu; thời gian mô phỏng do hành động engine quyết định. pH và khối lượng chỉ xuất hiện trong sổ đo sau hành động đo.

Tiêu chí mẫu: nồng độ kiềm 24–33 % khối lượng; kiềm khi rót không quá 50 °C; chênh nhiệt kiềm–dầu không quá 15 °C; superfat 1–10 %; đã đặc lại trước đổ khuôn; pH mô hình 9–10. Đây là tiêu chí học tập, không bảo đảm an toàn sử dụng thực tế.

## Giới hạn và kiểm chứng

Hệ số giữ nhiệt, làm nguội, bay hơi, pH và quy ước khuấy/đặc lại là giả định khóa của bài. Nhiệt trộn dùng trung bình theo khối lượng; thể tích NaOH vẫn ước theo mật độ rắn cả khi đã hòa tan. Không mô phỏng đầy đủ nhiệt dung từng pha, động học phản ứng hoặc điều kiện ủ thực tế. Không thay đổi các hệ số này chỉ để làm sạch code.

Kiểm thử engine nằm ở [soap-engine.test.ts](../../tests/unit/soap-engine.test.ts), tiến trình ở [soap-progress.test.ts](../../tests/unit/soap-progress.test.ts), lưu/phát lại và cách ly bài ở [soap-session.test.ts](../../tests/unit/soap-session.test.ts). Kiểm thử số học và lưu/phát lại lượt không thay thế kiểm chứng thực nghiệm.
