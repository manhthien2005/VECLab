# Rà soát lựa chọn ba thí nghiệm VECLab

Ngày rà soát: 13/10/2026. Trạng thái: khuyến nghị chọn chủ đề sau khi đối chiếu tài liệu; chưa phải chứng nhận mô hình hoặc hiệu quả học tập của sản phẩm.

## Kết luận lựa chọn

Giữ bộ ba cho phiên bản đầu:

1. Khảo sát và điều chỉnh pH mẫu nước mô phỏng bằng trung hòa axit–bazơ.
2. Tối ưu keo tụ–tạo bông–lắng bằng Jar Test trên một mẫu nước đục có đặc tính được khóa.
3. Hấp phụ xanh methylene trên một loại than hoạt tính xác định, theo mẻ.

Đây là ba bài thực hành xử lý hóa–lý có bối cảnh môi trường. Chúng không tạo thành một dây chuyền xử lý hoàn chỉnh cho mọi loại nước thải sinh hoạt. Tên bài, thông số, phạm vi vật liệu và tiêu chí nghiệm thu cần được khóa trong đặc tả riêng trước khi triển khai engine.

## Yêu cầu người dùng được dùng để đánh giá

- Tối đa ba thí nghiệm, ưu tiên chiều sâu và chất lượng.
- Người học chính là sinh viên không chuyên Hóa nhưng có nền tảng hóa học và dụng cụ thí nghiệm.
- Có bối cảnh xử lý nước/môi trường thực tế, mục tiêu học tập và kết quả đo được.
- Bàn thực hành 2D; thao tác với dụng cụ và mẫu có trạng thái; nhiều lựa chọn có hậu quả.
- Quan sát diễn biến ngay; phân tích lỗi khi kết thúc; gợi ý mở theo yêu cầu.
- Phân biệt chất lượng quy trình, kết quả xử lý và phép tính/số đo của người học.
- Có thể thử lại để cải thiện phương án; AI tutor là hướng mở rộng, không quyết định kết quả vật lý của mô hình.

## Căn cứ kiểm tra

### Bài thực hành được giảng dạy thực tế

[Environmental Engineering Lab Manual của Qatar University](https://www.qu.edu.qa/static_file/qu/colleges/engineering/civil/documents/Lab%20Manuals/Environmental_Engineering_Lab._Manual.pdf) liệt kê Jar Test (thí nghiệm 6) và hấp phụ xanh methylene trên than hoạt tính (thí nghiệm 8). Tài liệu cũng có kiến thức nồng độ, chuẩn độ, pH và thực hành xác định độ kiềm.

Điều này hỗ trợ tính phù hợp của chủ đề với đào tạo kỹ thuật môi trường ngoài chuyên ngành Hóa. Nó không chứng minh rằng phần mềm của VECLab đã dễ dùng hoặc phù hợp với mọi sinh viên. Không sao chép mọi thông số trong một manual thành hằng số phổ quát; các giá trị cụ thể phải được đối chiếu độc lập.

### Giá trị xử lý thực tế

[EPA, Development Document for Centralized Waste Treatment, chương 8](https://www.epa.gov/sites/default/files/2015-06/documents/cwt_dd_2000.pdf#page=174) mô tả trung hòa để điều chỉnh pH và keo tụ/tạo bông hỗ trợ tách hạt khỏi nước; có sử dụng thử nghiệm jar ở quy mô nhỏ để lựa chọn điều kiện cho một dòng nước cụ thể.

[EPA, Overview of Drinking Water Treatment Technologies](https://www.epa.gov/sdwa/overview-drinking-water-treatment-technologies) mô tả ứng dụng hấp phụ bằng than hoạt tính, đồng thời nêu sự phụ thuộc vào chất cần xử lý, loại than và các thành phần cạnh tranh trong nước.

### Có hướng xây mô hình định lượng, với phạm vi giới hạn

- Trung hòa: cân bằng vật chất/điện tích và acid–base cho thành phần đã biết. [Đặc tả hiện có](../experiments/acid-neutralization-spec.md) chỉ bao phủ dung dịch HCl tổng hợp trong miền đã công bố; chưa đại diện nước thải chưa biết thành phần.
- Jar Test: [nghiên cứu RSM năm 2024](https://www.gigvvy.com/journals/ijase/articles/ijase-202403-21-1-010) có khảo sát độ đục đầu, pH, liều alum và loại cánh khuấy. Đây là bằng chứng có thể xây quan hệ thực nghiệm trong một miền thử nghiệm; chưa chấp nhận ngay phương trình hoặc hệ số cho VECLab. Cần đọc/kiểm tra dữ liệu, sai số và ca xác minh của mô hình ứng viên.
- Hấp phụ: [Kannan & Sundaram, 2001](https://www.sciencedirect.com/science/article/pii/S0143720801000560) và [Karaca et al., 2008 — trang của nhóm tác giả](https://avesis.atauni.edu.tr/yayin/35a4dcd1-58bc-46f9-808d-8b30c8914118/adsorption-of-cationic-dye-from-aqueous-solutions-by-activated-carbon) khảo sát hấp phụ theo mẻ, gồm than thương mại và các điều kiện cụ thể. Có cơ sở tìm mô hình cân bằng/động học; chưa khóa loại than, hệ số hoặc bộ dữ liệu cuối cùng.

## Độ sâu tương tác đề xuất

Các thao tác dưới đây là yêu cầu thiết kế ứng viên, cần được xác minh trong đặc tả. Không mặc định mọi lỗi dụng cụ đều đã có mô hình định lượng.

| Bài | Quyết định học tập | Tương tác dụng cụ | Bằng chứng đầu ra |
| --- | --- | --- | --- |
| Trung hòa | Ước lượng liều, chia liều, chọn thời điểm đo và điểm dừng | Lấy mẫu, đọc buret, thêm dung dịch, khuấy, vận hành máy đo pH | Lịch sử liều/pH, mức đạt mục tiêu, hóa chất đã dùng, phép tính của người học |
| Jar Test | Thiết kế các cốc so sánh, chọn điều kiện, đánh đổi hiệu quả với lượng hóa chất | Đong mẫu, cấp hóa chất, thiết lập các giai đoạn khuấy/lắng, lấy mẫu lớp nước và đo độ đục | So sánh các cốc, độ đục còn lại, hiệu suất giảm đục, liều hóa chất |
| Hấp phụ theo mẻ | Chọn khối lượng than, thời gian lấy mẫu và điểm dừng trong miền có dữ liệu | Cân, pha loãng, chuẩn bị đường chuẩn, tiếp xúc than/mẫu, tách than và đo quang | Nồng độ theo thời gian, hiệu suất loại màu, lượng chất hấp phụ trên khối lượng than, sai số tính toán |

Ba cách học khác nhau: điều khiển một quá trình liên tục, thiết kế thí nghiệm so sánh song song, và theo dõi chuyển chất giữa pha lỏng–rắn theo thời gian. Chất lượng tương tác phải đến từ quyết định và hệ quả, không từ số lần bấm hoặc kéo thả.

Ví dụ lỗi đo/calculate: bỏ hệ số pha loãng có thể làm nồng độ người học báo cáo sai dù phần xử lý vật lý đúng. Engine phải tách trạng thái vật lý, số đo của dụng cụ và kết luận người học; không làm thay đổi vật lý để tạo hiệu ứng phạt.

## Các giới hạn cần siết lại so với mô tả sơ bộ

1. Jar Test là bài có rủi ro mô hình hóa cao nhất trong bộ ba. Chỉ cho điều chỉnh độc lập pH, liều, tốc độ hoặc thời gian khi có dữ liệu/mô hình tương ứng. Một bộ dữ liệu giữ cố định chế độ khuấy không đủ để tính mọi tốc độ khuấy mới.
2. Đường đẳng nhiệt hấp phụ mô tả cân bằng. Để mô phỏng việc sinh viên dừng/lấy mẫu sớm, cần mô hình động học và dữ liệu theo thời gian; phương trình cân bằng riêng không đủ.
3. Chốt rõ một loại chất màu, loại than, nhiệt độ, nền nước và miền nồng độ. Hiệu quả với mẫu xanh methylene không đại diện hiệu quả xử lý mọi chất hữu cơ hoặc toàn bộ nước thải dệt nhuộm.
4. pH mục tiêu phụ thuộc đề bài; không mặc định mọi nhiệm vụ đều cần pH đúng bằng 7. Mẫu tổng hợp có thành phần đã biết phải được ghi rõ.
5. Không suy độ đục sang COD hoặc kết luận đạt chất lượng xả thải chỉ từ màu/độ trong.
6. Kết quả khác phương án tham chiếu chưa đồng nghĩa làm sai. Phân biệt đạt yêu cầu, chưa tối ưu và vi phạm quy trình; không gán phần trăm đóng góp của từng lỗi khi chưa có phép phân tích hợp lệ.

## So với các bài thay thế

- SBR phù hợp mục tiêu nước thải sinh hoạt nhưng cần thêm mô hình sinh học, điều kiện sinh khối ban đầu và hiệu chỉnh động học. Chưa có căn cứ trong đợt rà soát này để hứa chất lượng mô phỏng ngang ba bài trên trong cùng phạm vi phát triển. Không kết luận SBR bất khả thi.
- Kết tủa đồng có giá trị xử lý kim loại, nhưng bộ ba được đề xuất tạo thêm khác biệt về kiểu thao tác và đo lường qua bài hấp phụ; không đánh giá kết tủa đồng là bài kém giá trị.
- Tách nhựa có giá trị tái chế nhưng liên hệ với trọng tâm xử lý nước của phiên bản đầu gián tiếp hơn.

## Điều kiện trước khi triển khai và nghiệm thu

- Khóa nhiệm vụ học tập, mẫu đầu vào và các đại lượng được đo/đánh giá.
- Mỗi thao tác có mapping hành động → trạng thái → hiện tượng/số đo → căn cứ giải thích.
- Khóa nguồn, hệ số, đơn vị, miền áp dụng và các điều kiện không mô phỏng được.
- Có ca chuẩn/bảo toàn và đối chiếu dữ liệu; mô hình thực nghiệm phải có ca kiểm tra ngoài dữ liệu dùng để hiệu chỉnh khi có thể thu thập.
- Có lượt đạt mục tiêu, lượt hợp lệ nhưng chưa tối ưu và lượt sai có thể giải thích bằng mô hình.
- Chạy thử với sinh viên đúng đối tượng: kiểm tra họ có tự thực hiện, nhận diện nguyên nhân trong báo cáo và cải thiện lượt tiếp theo hay không. Đây là kiểm tra thiết kế ban đầu, không tự động chứng minh hiệu quả giáo dục trên diện rộng.
- Chỉ chốt con số thời lượng bài sau thử nghiệm sử dụng; 10–15 phút hiện là mục tiêu thiết kế, không phải kết quả đã đo.

Rà soát này đủ cơ sở giữ lựa chọn chủ đề. Chưa hoàn thành thẩm định số học/benchmark cho các engine mới, kiểm chứng thí nghiệm độc lập hoặc kiểm thử trải nghiệm với sinh viên.
