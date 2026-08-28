# BÁO CÁO CHỐT PHẠM VI LÕI DỰ ÁN

## Nền tảng mô phỏng quy trình hóa học có căn cứ khoa học

**Trạng thái:** Đã chốt làm phạm vi lõi của dự án<br>
**Ngày chốt:** 27/08/2026<br>
**Thời lượng dự án:** Một học kỳ, tương đương khoảng 2 tháng<br>
**Phạm vi quyết định:** Sản phẩm cần làm gì, làm đến đâu, cần thu thập gì và kết quả cuối cùng phải có

> Đây là tài liệu nguồn quyết định cho phạm vi lõi. Khi có khác biệt với các tài liệu tổng quan hoặc thiết kế trước ngày 27/08/2026, tài liệu này được ưu tiên áp dụng.

> Phạm vi màn hình, tài khoản, dữ liệu, đồng bộ, báo cáo và responsive được chốt riêng tại [Báo cáo phạm vi ứng dụng web](web-application-scope.md).

## Tổng quan nhanh

| | Nội dung |
| --- | --- |
| 🎯 **Mục đích** | Khóa sản phẩm lõi, ba thí nghiệm và giới hạn khoa học của MVP. |
| 👥 **Dành cho** | Toàn team, người duyệt đề tài và người phụ trách nội dung hóa học. |
| ✅ **Sau khi đọc** | Biết dự án làm gì, làm tới đâu, cần thu thập gì và đầu ra bắt buộc là gì. |
| ⚠️ **Lưu ý** | Tài liệu này không mô tả chi tiết UI, database hoặc thuật toán solver. |

## Đọc tài liệu này khi nào?

- Trước khi đề xuất thêm thí nghiệm hoặc tính năng lõi.
- Khi cần xác định một yêu cầu có thuộc MVP hay không.
- Khi cần giải thích giá trị đề tài cho team hoặc người hướng dẫn.

## Các quyết định chính

- MVP có đúng ba bài: trung hòa axit, kết tủa Cu²⁺ và phân loại nhựa nổi–chìm.
- Mỗi bài có nhiều quy trình hợp lệ nhưng chỉ trong miền đã có bằng chứng.
- Điểm 0–100% là mức đạt mục tiêu mô phỏng, không phải xác suất thành công thực tế.
- Mỗi bài bắt buộc có hồ sơ nguồn, giả định, golden cases và disclaimer.
- Chemistry sandbox tổng quát, AI quyết định kết quả, 3D và chứng nhận pháp lý nằm ngoài phạm vi.

## Mục lục

<!-- TOC:START -->
- [1. Tóm tắt quyết định](#1-tóm-tắt-quyết-định)
- [2. Định vị sản phẩm](#2-định-vị-sản-phẩm)
- [3. Đối tượng sử dụng](#3-đối-tượng-sử-dụng)
- [4. Trải nghiệm lõi chung](#4-trải-nghiệm-lõi-chung)
- [5. Thí nghiệm 1 — Trung hòa dung dịch axit](#5-thí-nghiệm-1--trung-hòa-dung-dịch-axit)
- [6. Thí nghiệm 2 — Loại bỏ Cu²⁺ bằng kết tủa hóa học](#6-thí-nghiệm-2--loại-bỏ-cu-bằng-kết-tủa-hóa-học)
- [7. Thí nghiệm 3 — Phân loại nhựa bằng phương pháp nổi – chìm](#7-thí-nghiệm-3--phân-loại-nhựa-bằng-phương-pháp-nổi--chìm)
- [8. Cách biểu diễn kết quả và mức độ thành công](#8-cách-biểu-diễn-kết-quả-và-mức-độ-thành-công)
- [9. Hồ sơ bằng chứng bắt buộc](#9-hồ-sơ-bằng-chứng-bắt-buộc)
- [10. Dữ liệu và nội dung cần tiếp tục tìm](#10-dữ-liệu-và-nội-dung-cần-tiếp-tục-tìm)
- [11. Ví dụ trải nghiệm cụ thể](#11-ví-dụ-trải-nghiệm-cụ-thể)
- [12. Thành phần sản phẩm nằm trong phạm vi](#12-thành-phần-sản-phẩm-nằm-trong-phạm-vi)
- [13. Kết quả cuối cùng bắt buộc phải có](#13-kết-quả-cuối-cùng-bắt-buộc-phải-có)
- [14. Ngoài phạm vi lõi](#14-ngoài-phạm-vi-lõi)
- [15. Hướng phát triển cốt lõi](#15-hướng-phát-triển-cốt-lõi)
- [16. Kết luận chốt scope](#16-kết-luận-chốt-scope)
<!-- TOC:END -->

---


## 1. Tóm tắt quyết định

Dự án sẽ xây dựng một ứng dụng web mô phỏng **ba quy trình hóa học hoặc vật lý – hóa học có thật**, có thể thực hiện hoặc kiểm chứng ở quy mô phòng thí nghiệm và đã được mô tả trong tài liệu kỹ thuật, tài liệu đại học hoặc nghiên cứu khoa học.

Ba thí nghiệm được chọn là:

1. **Trung hòa dung dịch axit.**
2. **Loại bỏ ion Cu²⁺ bằng kết tủa hóa học.**
3. **Phân loại hỗn hợp nhựa bằng phương pháp nổi – chìm.**

Người dùng không chỉ nhập số liệu rồi nhận một đáp án. Họ được chọn quy trình, thực hiện từng thao tác, thay đổi các tham số trong phạm vi được phép, quan sát trạng thái trung gian, sửa phương án chưa phù hợp và so sánh nhiều lần thử.

Mỗi thí nghiệm phải có nhiều hướng xử lý hợp lệ, nhưng toàn bộ hóa chất, thao tác, công thức và khoảng tham số đều bị giới hạn theo các nguồn đã được kiểm tra. Sản phẩm không phải là một chemistry sandbox có thể xử lý mọi phản ứng.

Sản phẩm cung cấp **mức độ đạt mục tiêu mô phỏng**, không tuyên bố xác suất thành công ngoài thực tế. Do nhóm không có điều kiện làm thí nghiệm độc lập, mọi kết quả phải được ghi rõ là mô hình dựa trên tài liệu và chỉ có giá trị trong phạm vi giả định đã công bố.

---


## 2. Định vị sản phẩm

### 2.1. Sản phẩm là gì

Sản phẩm là một **nền tảng học tập và khám phá quy trình dựa trên mô phỏng xác định**. Với cùng trạng thái ban đầu và cùng chuỗi thao tác, hệ thống phải trả về cùng một kết quả.

Nền tảng giúp người dùng:

- Hiểu quan hệ giữa lựa chọn quy trình, tham số vận hành và kết quả.
- Thử nhiều phương án mà không cần sử dụng hóa chất và thiết bị thật.
- Nhìn thấy sự đánh đổi giữa hiệu quả, lượng vật chất, chi phí tương đối, an toàn và chất thải thứ cấp.
- Kiểm tra công thức, dữ liệu trung gian, giả định và nguồn tham khảo.
- Nhận biết giới hạn giữa mô hình giáo dục và hệ thống ngoài thực tế.

### 2.2. Sản phẩm không phải là gì

Sản phẩm không phải:

- Công cụ thiết kế hoặc vận hành hệ thống xử lý công nghiệp.
- Phần mềm chứng nhận an toàn, chất lượng hoặc tuân thủ pháp luật.
- Công cụ thay thế thí nghiệm, jar test, đo đạc hoặc đánh giá chuyên môn.
- Engine tổng quát cho phép nhập tùy ý mọi chất và mọi phản ứng.
- Hệ thống dự đoán xác suất thành công trong điều kiện thực tế chưa biết.

---


## 3. Đối tượng sử dụng

### 3.1. Người dùng chính

- Sinh viên hóa học, hóa môi trường, kỹ thuật môi trường hoặc ngành liên quan.
- Người học cần chuẩn bị trước thí nghiệm hoặc củng cố kiến thức sau giờ học.
- Sinh viên cần quan sát ảnh hưởng của liều lượng, nồng độ, thứ tự thao tác và lựa chọn vật chất.

### 3.2. Người dùng phụ

- Giảng viên sử dụng sản phẩm để minh họa hoặc kiểm tra một tình huống giảng dạy.
- Người tự học muốn tiếp cận quy trình bằng mô hình tương tác.
- Người có kiến thức chuyên môn muốn xem công thức, dữ liệu trung gian, nguồn và giới hạn của mô hình.

### 3.3. Nguyên tắc phục vụ nhiều trình độ

Sản phẩm chỉ có một nền tảng mô phỏng, không xây một phiên bản chuyên gia riêng. Nội dung được trình bày theo hai lớp:

1. **Lớp giải thích cơ bản:** hiện tượng, kết quả, cảnh báo và gợi ý dễ hiểu.
2. **Lớp thông tin kỹ thuật:** phương trình, dữ liệu trung gian, giả định, nguồn tham khảo và giới hạn áp dụng.

Người có chuyên môn có thể sử dụng lớp thông tin kỹ thuật để xem xét mô hình, nhưng không được hiểu kết quả như một khuyến nghị vận hành thực tế.

---


## 4. Trải nghiệm lõi chung

Mọi thí nghiệm sử dụng chung một vòng lặp tương tác:

1. Chọn thí nghiệm và mục tiêu cần đạt.
2. Xem trạng thái hoặc mẫu ban đầu.
3. Chọn một thao tác được phép.
4. Chọn hóa chất, vật liệu hoặc dòng xử lý liên quan.
5. Nhập tham số và đơn vị.
6. Hệ thống kiểm tra phạm vi hợp lệ.
7. Chạy mô hình chuyên môn và cập nhật trạng thái.
8. Hiển thị kết quả trung gian, hiện tượng dự kiến, giải thích và cảnh báo.
9. Người dùng tiếp tục, điều chỉnh, đặt lại hoặc kết thúc.
10. Hệ thống đánh giá kết quả và cho phép so sánh với lần thử khác.

### 4.1. Tiêu chuẩn về độ đa dạng

Mỗi thí nghiệm phải có:

- Ít nhất **ba hướng quy trình hợp lệ**.
- Khoảng **5–7 tham số có ý nghĩa**, chỉ xuất hiện khi phù hợp với thao tác hiện tại.
- Ít nhất **ba trạng thái sai, thiếu hoặc chưa tối ưu**.
- Khả năng điều chỉnh và tiếp tục sau sai sót hợp lý.
- Ít nhất **hai mục tiêu có sự đánh đổi**.
- Khả năng làm lại và so sánh các phương án.
- Không có một chuỗi thao tác duy nhất được xem là đáp án tuyệt đối.

Độ đa dạng đến từ lựa chọn vật chất, liều lượng, thứ tự thao tác, số lần đo, cách tách dòng và mục tiêu tối ưu. Độ đa dạng không đến từ việc cho phép ghép các hóa chất hoặc phản ứng chưa có nguồn hỗ trợ.

### 4.2. Kiểm soát đầu vào và trường hợp không hỗ trợ

Hệ thống phải:

- Từ chối giá trị âm, sai đơn vị hoặc không phải số.
- Cảnh báo khi đầu vào nằm ngoài khoảng đã được dẫn nguồn.
- Không chạy tổ hợp hóa chất hoặc thao tác chưa được mô hình hóa.
- Không tự ngoại suy kết quả rồi trình bày như một kết luận khoa học.
- Giải thích rõ vì sao một thao tác không thể thực hiện trong trạng thái hiện tại.

---


## 5. Thí nghiệm 1 — Trung hòa dung dịch axit

### 5.1. Mục tiêu

Người dùng cần đưa một dung dịch axit có thành phần xác định về vùng pH mục tiêu, đồng thời hạn chế quá liều, lượng hóa chất và rủi ro thao tác.

Đây là mô hình của một hệ dung dịch tổng hợp đã biết thành phần và lượng axit tương đương. Hệ thống không suy ra toàn bộ nhu cầu trung hòa chỉ từ giá trị pH, vì hai dung dịch có cùng pH vẫn có thể có khả năng đệm và tổng lượng axit khác nhau.

### 5.2. Phạm vi hệ hóa học

- Một dung dịch axit mạnh hoặc một mẫu axit tổng hợp được cấu hình sẵn.
- Thể tích, nồng độ hoặc lượng axit tương đương được biết trước.
- Nhiệt độ được cố định theo điều kiện của mô hình.
- Các chất trung hòa được chọn từ danh sách đã có nguồn, ưu tiên NaOH, Ca(OH)₂ và Na₂CO₃.
- Không mô phỏng một mẫu nước thải không rõ thành phần hoặc có hệ đệm phức tạp.

### 5.3. Thao tác và tham số được phép

- Đo hoặc xem pH ban đầu.
- Chọn chất trung hòa.
- Chọn nồng độ dung dịch hoặc dạng cấp hóa chất đã cấu hình.
- Nhập liều lượng hoặc thể tích thêm vào.
- Thêm hóa chất một lần hoặc chia thành nhiều lần.
- Khuấy và đo lại pH.
- Điều chỉnh khi thiếu hoặc quá liều trong phạm vi kịch bản.
- Kết thúc khi người dùng cho rằng mục tiêu đã đạt.

Các tham số có thể thay đổi gồm:

- Thể tích mẫu.
- Nồng độ hoặc lượng axit tương đương.
- Loại chất trung hòa.
- Nồng độ chất trung hòa.
- Liều lượng mỗi lần thêm.
- Số lần thêm.
- Mục tiêu pH của kịch bản.

**Làm rõ cho release 1.0.0:** benchmark dùng 25,00 mL HCl 0,01000 M; exploration cho phép thay thể tích 25–50 mL, HCl 0,005–0,020 M và target pH* 6,5–7,5. Stock base giữ cùng nồng độ đương lượng với HCl và nhiệt độ khóa 25 °C. Chi tiết tại [Acid Neutralization Specification](experiments/acid-neutralization-spec.md).

### 5.4. Các hướng quy trình hợp lệ

1. **NaOH định lượng:** phản ứng nhanh, dễ tính nhưng có nguy cơ vượt pH nếu thêm quá nhiều.
2. **Ca(OH)₂:** có lợi thế về chi phí tương đối trong nhiều ứng dụng, nhưng có giới hạn hòa tan và cách cấp khác NaOH.
3. **Na₂CO₃ hoặc quy trình nhiều bước:** cho phép nghiên cứu sự khác biệt về đương lượng, tốc độ điều chỉnh và sản phẩm phụ trong phạm vi nguồn đã chọn.

Việc chia liều, đo lại và tinh chỉnh tạo ra nhiều chuỗi thao tác hợp lệ cho cùng một chất trung hòa.

### 5.5. Kết quả cần trả về

- pH sau mỗi lần thêm.
- Số mol axit và bazơ đã phản ứng.
- Chất còn dư.
- Lượng hóa chất đã sử dụng.
- Mức độ đạt vùng pH mục tiêu.
- Cảnh báo thiếu liều hoặc quá liều.
- Chi phí tương đối và chỉ số an toàn theo dữ liệu kịch bản.
- Đường biến thiên pH theo thao tác.
- Giải thích phương trình và cách tính.

### 5.6. Bằng chứng ban đầu

- [U.S. EPA — Design Manual: Neutralization of Acid Mine Drainage](https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=20007H0I.TXT): mô tả các chất trung hòa thực tế như quicklime, hydrated lime, limestone, caustic soda và soda ash, cùng các yếu tố đánh đổi về chi phí, phản ứng và bùn.
- [A comparison of neutralization efficiency of chemicals with respect to acidic Kopili River water](https://link.springer.com/article/10.1007/s13201-016-0391-6): nghiên cứu thực nghiệm so sánh khả năng trung hòa của CaCO₃, Ca(OH)₂, CaO, Na₂CO₃, NaOH và ammonia đối với một nguồn nước axit cụ thể.
- [MIT OpenCourseWare — Titration](https://ocw.mit.edu/courses/res-5-0001-digital-lab-techniques-manual-spring-2007/resources/titration/): video hướng dẫn thao tác chuẩn độ axit – bazơ trong phòng thí nghiệm.
- [San José State University — Acid-Base Neutralization Experiment](https://www.sjsu.edu/people/resa.kelly/general_chemistry_animations_and_videos/Acid-Base_Neutralization_Experiment/index.html): video thí nghiệm HCl – NaOH và quan sát pH.

### 5.7. Giới hạn bắt buộc phải công bố

- Không đại diện cho mọi loại nước thải axit.
- Không mô phỏng đầy đủ hoạt độ ion, hệ đệm, tạp chất hoặc truyền nhiệt nếu chưa có mô hình được duyệt.
- Kết quả chỉ đúng cho các chất, điều kiện và giả định được cấu hình.

---


## 6. Thí nghiệm 2 — Loại bỏ Cu²⁺ bằng kết tủa hóa học

### 6.1. Mục tiêu

Người dùng cần giảm nồng độ Cu hòa tan trong một dung dịch tổng hợp về mục tiêu của kịch bản bằng cách chọn chất kết tủa, pH và chuỗi khuấy – lắng – lọc phù hợp.

Mục tiêu của bài không chỉ là tạo chất rắn. Người dùng phải hiểu rằng kết tủa cần được tách khỏi pha lỏng và kết quả phụ thuộc vào pH, tỷ lệ hóa chất, thành phần nền và điều kiện xử lý.

### 6.2. Phạm vi hệ hóa học

- Dung dịch CuSO₄ tổng hợp hoặc một hệ Cu²⁺ có thành phần được chọn từ nghiên cứu tham chiếu.
- Nồng độ ban đầu, thể tích và nhiệt độ được xác định.
- Không có chất tạo phức hoặc tạp chất ngoài danh sách của kịch bản.
- Mô hình chỉ sử dụng các chất kết tủa và khoảng pH có dữ liệu hỗ trợ.
- Không suy rộng kết quả sang nước thải công nghiệp thực mà không có jar test hoặc dữ liệu riêng.

### 6.3. Thao tác và tham số được phép

- Đo hoặc xem pH và nồng độ Cu ban đầu.
- Chọn NaOH, Ca(OH)₂ hoặc Na₂CO₃ khi nhánh đó đã được hoàn thiện hồ sơ bằng chứng.
- Nhập liều lượng hoặc tỷ lệ chất kết tủa/Cu²⁺.
- Khuấy theo điều kiện được cấu hình.
- Chờ lắng.
- Lọc hoặc lấy dòng nước trong.
- Đo đầu ra.
- Bổ sung hóa chất và xử lý tiếp khi chưa đạt.

Các tham số có thể thay đổi gồm:

- Nồng độ Cu²⁺ ban đầu.
- Thể tích mẫu.
- Loại chất kết tủa.
- Liều lượng hoặc tỷ lệ mol.
- pH mục tiêu.
- Điều kiện khuấy trong phạm vi mô hình.
- Thời gian lắng hoặc trạng thái tách rắn – lỏng được cấu hình.

**Làm rõ cho release 1.0.0:** người dùng thay Cu ban đầu, thể tích, route, dose ratio, số lần dose và thứ tự workflow. pH goal band, mixing và settling là scenario presets/state transitions; không có slider rpm/thời gian vì model không có kinetics/jar-test data. Chi tiết tại [Copper Precipitation Specification](experiments/copper-precipitation-spec.md).

### 6.4. Các hướng quy trình hợp lệ

1. **Kết tủa hydroxide bằng NaOH:** dễ định lượng và điều chỉnh nhanh, nhưng có nguy cơ quá liều và pH đầu ra cao.
2. **Kết tủa bằng Ca(OH)₂:** sử dụng tác nhân khác với đặc điểm hòa tan, chi phí và lượng chất rắn khác.
3. **Kết tủa carbonate bằng Na₂CO₃:** tạo một nhánh hóa học khác đã có nghiên cứu so sánh với hydroxide.

Trong từng nhánh, người dùng có thể thêm một lần, thêm theo nhiều bước, đo giữa các bước hoặc tiếp tục khi chưa đạt. Việc lọc sớm, không lắng hoặc kết thúc chỉ dựa vào pH tạo ra các nhánh sai có thể giải thích và phục hồi.

### 6.5. Kết quả cần trả về

- pH sau xử lý.
- Nồng độ Cu hòa tan còn lại theo mô hình.
- Hiệu suất loại bỏ Cu.
- Lượng kết tủa lý thuyết hoặc lượng chất rắn theo mô hình đã chọn.
- Khối lượng hóa chất sử dụng.
- Trạng thái pha rắn và pha lỏng.
- Cảnh báo khi chưa lọc, sai vùng pH hoặc dùng quá liều.
- Mức độ đạt mục tiêu của kịch bản.
- Chi phí tương đối, lượng chất rắn và chỉ số an toàn.
- Phương trình, cân bằng vật chất, giả định và nguồn dữ liệu.

### 6.6. Bằng chứng ban đầu

- [U.S. EPA — Development Document for Metal Products & Machinery Effluent Guidelines](https://www.epa.gov/sites/default/files/2015-11/documents/mp-m_dd_2003.pdf): mô tả kết tủa hydroxide bằng lime, NaOH hoặc Mg(OH)₂ và nêu rõ pH tối ưu của nước thải thực phải được xác định bằng jar test.
- [Recovery of cobalt and copper via carbonate and hydroxide precipitation](https://link.springer.com/article/10.1186/s42834-022-00140-z): nghiên cứu thực nghiệm so sánh Na₂CO₃ và NaOH ở nhiều mức pH và tỷ lệ chất kết tủa/kim loại.
- [Heavy metals in wastewater: Modelling the hydroxide precipitation of copper(II) using lime](https://www.sciencedirect.com/science/article/pii/S0956053X97000147): nghiên cứu mô hình hóa kết tủa Cu(II) bằng vôi và đối chiếu với thực nghiệm.

### 6.7. Giới hạn bắt buộc phải công bố

- Nước thải thực có thể chứa chất tạo phức, ion cạnh tranh và tạp chất làm thay đổi độ tan.
- Giá trị pH tối ưu không được trình bày như một con số áp dụng chung cho mọi hệ.
- Mô hình cân bằng lý tưởng không thay thế jar test hoặc phép đo Cu trong mẫu thật.
- Nếu mô hình sử dụng hệ số thực nghiệm của một nghiên cứu, hệ số đó chỉ áp dụng cho điều kiện đã công bố.

---


## 7. Thí nghiệm 3 — Phân loại nhựa bằng phương pháp nổi – chìm

### 7.1. Mục tiêu

Người dùng cần thiết kế một hoặc nhiều cấp phân tách để thu hồi loại nhựa mục tiêu, cân bằng giữa độ tinh khiết, tỷ lệ thu hồi, số bước và lượng môi trường phân tách.

### 7.2. Phạm vi vật liệu

- Hỗn hợp giới hạn gồm PP, HDPE, PS và PET.
- Khối lượng hoặc tỷ lệ ban đầu của từng loại được biết.
- Khối lượng riêng của vật liệu và môi trường được lấy từ nguồn đã chọn.
- Môi trường ưu tiên gồm nước, dung dịch NaCl và dung dịch ethanol – nước trong khoảng nghiên cứu.
- Kích thước, nhiệt độ, độ ẩm và mức tạp chất được cố định hoặc đơn giản hóa rõ ràng.

### 7.3. Thao tác và tham số được phép

- Chọn loại nhựa mục tiêu.
- Xem hoặc thay đổi thành phần hỗn hợp theo các mẫu được cho phép.
- Chọn môi trường phân tách.
- Điều chỉnh nồng độ hoặc khối lượng riêng môi trường trong khoảng dữ liệu.
- Thực hiện tách và quan sát dòng nổi, dòng chìm.
- Chọn một dòng để thu hồi hoặc xử lý ở cấp tiếp theo.
- Dừng sau một cấp hoặc xây quy trình nhiều cấp.

Các tham số có thể thay đổi gồm:

- Khối lượng hoặc tỷ lệ từng loại nhựa.
- Loại nhựa mục tiêu.
- Loại môi trường phân tách.
- Nồng độ dung dịch.
- Khối lượng riêng môi trường.
- Số cấp tách.
- Dòng vật liệu được chọn cho bước tiếp theo.

**Làm rõ cho release 1.0.0:** nồng độ và mật độ medium được điều chỉnh bằng các preset vật lý đã kiểm chứng ở 20 °C, không nhập giá trị liên tục hoặc nội suy tùy ý. Chi tiết tại [Plastic Density Separation Specification](experiments/plastic-density-separation-spec.md).

### 7.4. Các hướng quy trình hợp lệ

1. **Tách một cấp bằng nước:** nhanh, ít hóa chất nhưng chỉ tạo được các nhóm nhựa nhẹ và nặng tương đối.
2. **Tách nhiều cấp bằng dung dịch NaCl:** thay đổi khối lượng riêng để tăng khả năng tách một số polymer.
3. **Sử dụng ethanol – nước hoặc kết hợp nhiều môi trường:** hỗ trợ phân tách các vật liệu có khối lượng riêng gần nhau trong phạm vi nghiên cứu.

Người dùng có thể ưu tiên độ tinh khiết hoặc tỷ lệ thu hồi. Một phương án giữ được phần lớn nhựa mục tiêu nhưng lẫn nhiều nhựa khác không được đánh giá giống một phương án có độ tinh khiết cao nhưng làm mất nhiều vật liệu mục tiêu.

### 7.5. Kết quả cần trả về

- Thành phần và khối lượng của dòng nổi, dòng chìm và dòng đã thu hồi.
- Độ tinh khiết của sản phẩm mục tiêu.
- Tỷ lệ thu hồi nhựa mục tiêu.
- Cân bằng khối lượng giữa các dòng.
- Số cấp phân tách.
- Lượng nước và hóa chất tương đối.
- Mức độ đạt mục tiêu của kịch bản.
- Giải thích vì sao từng loại nhựa nổi hoặc chìm.
- Nguồn cho khối lượng riêng và hệ số thu hồi sử dụng.

### 7.6. Bằng chứng ban đầu

- [Separation of virgin plastic polymers and post-consumer mixed plastic waste by sinking-flotation technique](https://pmc.ncbi.nlm.nih.gov/articles/PMC8724085/): nghiên cứu thực nghiệm sử dụng nước, dung dịch NaCl và ethanol, có mô tả quy trình và kết quả thu hồi.
- [Sink–float density separation of post-consumer plastics for feedstock recycling](https://link.springer.com/article/10.1007/s10163-018-0748-z): nghiên cứu xây dựng và thử nghiệm hệ thống pilot nhiều cấp cho nhựa sau tiêu dùng.

### 7.7. Giới hạn bắt buộc phải công bố

- Nhựa thực tế có phụ gia, nhãn, bọt khí, độ ẩm, lão hóa và tạp chất làm thay đổi kết quả.
- Mô hình khối lượng riêng lý tưởng không tự động đại diện cho mọi dòng rác nhựa.
- Hệ số thu hồi từ nghiên cứu chỉ được sử dụng trong điều kiện tương ứng hoặc phải được gắn nhãn là giá trị tham chiếu.

---


## 8. Cách biểu diễn kết quả và mức độ thành công

### 8.1. Ba lớp kết quả

Mỗi lần chạy phải trả về ba lớp thông tin:

1. **Kết quả khoa học:** pH, nồng độ, khối lượng, hiệu suất, độ tinh khiết hoặc tỷ lệ thu hồi.
2. **Trạng thái mục tiêu:** đạt, chưa đạt hoặc không thể đánh giá do thiếu bước bắt buộc.
3. **Điểm hiệu quả:** điểm thành phần và mức độ hoàn thành từ 0–100%.

### 8.2. Ý nghĩa của con số 0–100%

Con số này là **mức độ đạt mục tiêu của kịch bản**, không phải:

- Xác suất phản ứng xảy ra.
- Xác suất quy trình hoạt động ngoài thực tế.
- Độ tin cậy thống kê của mô hình.
- Chứng nhận đạt quy định môi trường.

Mức độ hoàn thành phải được tính từ các tiêu chí công khai. Điều kiện khoa học chính được kiểm tra trước; sau đó mới xem xét hóa chất, chi phí tương đối, an toàn, chất thải và số bước.

### 8.3. Yêu cầu minh bạch

Người dùng phải xem được:

- Mục tiêu và ngưỡng của kịch bản.
- Điểm thành phần.
- Dữ liệu đầu vào và các thao tác đã thực hiện.
- Công thức hoặc nguyên lý chính.
- Giả định và giới hạn.
- Nguồn được dùng để xây mô hình.

---


## 9. Hồ sơ bằng chứng bắt buộc

Một thí nghiệm hoặc một nhánh quy trình chỉ được coi là sẵn sàng phát hành khi có hồ sơ gồm:

1. Ít nhất một nguồn kỹ thuật có thẩm quyền, giáo trình hoặc tài liệu đại học.
2. Ít nhất một nghiên cứu thực nghiệm bình duyệt liên quan trực tiếp.
3. Video hoặc hình ảnh thực tế từ nguồn đáng tin cậy nếu có.
4. Quy trình, hóa chất, thiết bị và điều kiện thí nghiệm gốc.
5. Phương trình, hằng số, đơn vị và nguồn của từng dữ liệu quan trọng.
6. Bộ dữ liệu hoặc kết quả tham chiếu.
7. Khoảng đầu vào mà mô hình được phép nhận.
8. Danh sách giả định và các yếu tố bị bỏ qua.
9. Liên kết giữa từng thao tác hoặc nhánh mô phỏng với nguồn hỗ trợ.
10. Các trường hợp tính toán chuẩn và quy tắc sai số.
11. Ngày kiểm tra và phiên bản nguồn.
12. Nhãn bắt buộc: **“Mô hình dựa trên tài liệu; chưa được nhóm phát triển kiểm chứng bằng thí nghiệm độc lập.”**

Video là bằng chứng bổ trợ cho quy trình và hiện tượng. Video không được dùng một mình để xác lập công thức, hằng số hoặc kết quả định lượng.

---


## 10. Dữ liệu và nội dung cần tiếp tục tìm

Phần này xác định những gì dự án bắt buộc phải thu thập trước khi mô hình được coi là hoàn chỉnh. Đây không phải kế hoạch thời gian.

### 10.1. Dùng chung cho ba thí nghiệm

- Phiên bản đầy đủ và thông tin thư mục của từng nguồn.
- Điều kiện nhiệt độ, áp suất, nồng độ và đơn vị.
- Dữ liệu số có thể dùng làm trường hợp tham chiếu.
- Khoảng tham số an toàn và có ý nghĩa giáo dục.
- Quy tắc làm tròn và sai số cho từng đại lượng.
- Nội dung cảnh báo an toàn phù hợp với hóa chất liên quan.
- Mức chi phí tương đối có nguồn hoặc được ghi rõ là quy ước của kịch bản.
- Tiêu chí đánh giá không bị trình bày nhầm thành tiêu chuẩn pháp lý.

### 10.2. Cho bài trung hòa axit

- Chọn chính xác hệ axit đại diện và nồng độ mặc định.
- Dữ liệu đương lượng và độ tinh khiết của các chất trung hòa.
- Mô hình hòa tan phù hợp nếu dùng Ca(OH)₂ dạng huyền phù.
- Dữ liệu cần thiết để mô tả Na₂CO₃ và sản phẩm khí nếu nhánh này được giữ lại.
- Các điểm tham chiếu của đường chuẩn độ và trường hợp thiếu, đủ, thừa bazơ.
- Phạm vi mà mô hình lý tưởng còn có thể chấp nhận.

### 10.3. Cho bài kết tủa Cu²⁺

- Chọn một nghiên cứu chính làm hệ tham chiếu cho thành phần dung dịch.
- Giá trị tích số tan và điều kiện áp dụng.
- Cách xử lý sai khác giữa cân bằng lý tưởng và dữ liệu thực nghiệm.
- Dữ liệu về pH, tỷ lệ chất kết tủa/Cu²⁺ và nồng độ Cu còn lại.
- Điều kiện khuấy, lắng và lọc được phép mô phỏng.
- Cách ước lượng lượng chất rắn hoặc bùn mà không tuyên bố vượt quá dữ liệu nguồn.
- Trường hợp Cu tạo phức hoặc có ion cạnh tranh phải được loại khỏi phạm vi hoặc mô hình hóa riêng.

### 10.4. Cho bài phân loại nhựa

- Khoảng khối lượng riêng của PP, HDPE, PS và PET từ nguồn thống nhất.
- Quan hệ giữa nồng độ NaCl hoặc ethanol và khối lượng riêng dung dịch tại nhiệt độ chọn.
- Thành phần hỗn hợp mẫu dùng trong các kịch bản.
- Hệ số thu hồi và độ tinh khiết từ nghiên cứu thực nghiệm.
- Cách biểu diễn ảnh hưởng của tạp chất, nhãn, độ ẩm và bọt khí.
- Quy tắc bảo toàn khối lượng qua nhiều cấp tách.

---


## 11. Ví dụ trải nghiệm cụ thể

### 11.1. Ví dụ — Kết tủa Cu²⁺

Hệ thống cung cấp một mẫu gồm 1 L dung dịch CuSO₄ tổng hợp với nồng độ Cu ban đầu đã biết. Người dùng nhận mục tiêu giảm Cu hòa tan và đưa pH đầu ra về vùng của kịch bản.

Một lượt thử có thể diễn ra như sau:

1. Người dùng đo pH và Cu ban đầu.
2. Chọn NaOH làm chất kết tủa.
3. Nhập liều lượng và thực hiện thêm hóa chất.
4. Khuấy, sau đó xem pH và lượng kết tủa dự kiến.
5. Người dùng lọc ngay hoặc chờ lắng.
6. Hệ thống tính Cu hòa tan còn lại, lượng chất rắn và trạng thái tách pha.
7. Nếu chỉ tiêu chưa đạt, người dùng bổ sung hóa chất, khuấy và lọc lại.
8. Người dùng tạo lượt thử thứ hai bằng Ca(OH)₂ hoặc Na₂CO₃.
9. Hệ thống so sánh hiệu suất, lượng hóa chất, chất rắn, số bước và điểm an toàn.

Ví dụ này tạo ra nhiều quyết định mà vẫn giữ toàn bộ thao tác trong phạm vi một quy trình có nguồn khoa học.

### 11.2. Ví dụ — Phân loại nhựa nhiều cấp

Người dùng nhận một hỗn hợp PP, HDPE, PS và PET, sau đó chọn thu hồi PET:

1. Tách bằng nước để chia nhóm nhẹ và nặng.
2. Chọn dòng chìm chứa PS và PET.
3. Điều chỉnh dung dịch NaCl đến khối lượng riêng được phép.
4. Thực hiện cấp tách thứ hai.
5. Thu dòng giàu PET và xem độ tinh khiết, tỷ lệ thu hồi.
6. So sánh với phương án dừng sau một cấp.

Người dùng sẽ thấy một quy trình ít bước có thể thu hồi nhanh nhưng độ tinh khiết thấp hơn, trong khi quy trình nhiều cấp dùng thêm môi trường phân tách để cải thiện chất lượng sản phẩm.

---


## 12. Thành phần sản phẩm nằm trong phạm vi

Phiên bản lõi bao gồm:

- Trang giới thiệu và định vị giới hạn của sản phẩm.
- Danh mục ba thí nghiệm.
- Tình huống và mục tiêu cho từng thí nghiệm.
- Giao diện thực hiện thao tác theo trạng thái.
- Kiểm tra đầu vào, đơn vị và phạm vi.
- Ba mô-đun tính toán chuyên môn tương ứng.
- Lịch sử thao tác trong lượt thực hành.
- Kết quả trung gian và hiện tượng dự kiến.
- Giải thích cơ bản và thông tin kỹ thuật mở rộng.
- Cảnh báo an toàn và cảnh báo vượt phạm vi mô hình.
- Đánh giá đạt/chưa đạt và điểm thành phần.
- Làm lại và so sánh các lượt thử.
- Báo cáo cuối lượt.
- Trang nguồn, giả định và giới hạn cho từng thí nghiệm.
- Khả năng sử dụng trực tiếp trên web mà không bắt buộc đăng nhập.

---


## 13. Kết quả cuối cùng bắt buộc phải có

Phạm vi lõi được xem là đạt khi có đầy đủ:

1. Một ứng dụng web có thể sử dụng xuyên suốt mà không bắt buộc đăng nhập.
2. Ba thí nghiệm hoạt động từ lựa chọn tình huống đến báo cáo kết quả.
3. Mỗi thí nghiệm có ít nhất ba hướng quy trình hợp lệ.
4. Mỗi thao tác hợp lệ tạo ra trạng thái mới và kết quả có thể giải thích.
5. Các trường hợp sai phổ biến có cảnh báo và cách tiếp tục hợp lý.
6. Cùng đầu vào và chuỗi thao tác luôn trả về cùng kết quả.
7. Có chức năng đặt lại, làm lại và so sánh phương án.
8. Kết quả khoa học quan trọng có dữ liệu trung gian và nguồn.
9. Mỗi thí nghiệm có hồ sơ bằng chứng và giới hạn áp dụng công khai.
10. Các trường hợp tham chiếu khớp phép tính hoặc dữ liệu nguồn trong sai số đã công bố.
11. Bảo toàn mol hoặc bảo toàn khối lượng được kiểm tra ở các phần áp dụng.
12. Hệ thống không nhận đầu vào ngoài phạm vi mà không cảnh báo.
13. Mọi điểm số 0–100% được ghi rõ là mức độ đạt mục tiêu mô phỏng.
14. Sản phẩm hiển thị rõ rằng nhóm chưa kiểm chứng mô hình bằng thí nghiệm độc lập.

---


## 14. Ngoài phạm vi lõi

Không thực hiện trong phạm vi này:

- Thí nghiệm thứ tư trước khi ba thí nghiệm chính đạt yêu cầu.
- Chemistry engine tổng quát.
- Cho người dùng tự định nghĩa chất, phản ứng hoặc quy trình tùy ý.
- Mô phỏng phân tử, động lực học phân tử hoặc thiết bị 3D.
- Mô phỏng chi tiết thiết bị công nghiệp và thủy lực quy mô nhà máy.
- AI tự tạo phản ứng, công thức hoặc kết quả hóa học.
- Xác suất thành công ngoài thực tế.
- Tự động thiết kế hệ thống xử lý thực.
- Chứng nhận an toàn, pháp lý hoặc tuân thủ môi trường.
- Thay thế jar test, phép đo phòng thí nghiệm hoặc đánh giá chuyên gia.
- Tuyên bố kết quả áp dụng cho mọi mẫu nước thải hoặc rác nhựa.
- Tài khoản và phân quyền phức tạp.
- Bảng điều khiển quản lý lớp học, LMS hoặc hệ thống quản trị nội dung đầy đủ.
- Ứng dụng di động riêng.
- Kiểm chứng thực nghiệm do chính nhóm phát triển thực hiện.

Các mục trên chỉ được xem xét sau phạm vi lõi và không phải điều kiện để dự án hiện tại thành công.

---


## 15. Hướng phát triển cốt lõi

Giá trị chính của dự án không nằm ở số lượng thí nghiệm, mà nằm ở việc chứng minh được một cấu trúc mô phỏng quy trình có thể tái sử dụng:

```text
Kịch bản có nguồn
→ Trạng thái hiện tại
→ Thao tác và tham số được phép
→ Mô hình chuyên môn
→ Trạng thái mới
→ Kết quả, giải thích và cảnh báo
→ Đánh giá và so sánh
```

Ba thí nghiệm được cố ý chọn để chứng minh hai điều:

- Nền tảng xử lý tốt các quy trình liên quan đến phản ứng, cân bằng và tách pha.
- Cấu trúc chung vẫn sử dụng được cho một bài toán phân tách vật liệu dựa trên tính chất vật lý.

Vì vậy, dự án cần ưu tiên ba bài có chiều sâu, có bằng chứng và có khả năng khám phá. Việc thêm nhiều bài nhưng thiếu dữ liệu, giải thích hoặc kiểm chứng tài liệu sẽ làm giảm giá trị khoa học của sản phẩm.

---


## 16. Kết luận chốt scope

Trong một học kỳ khoảng 2 tháng, phạm vi phù hợp là xây dựng **một nền tảng web mô phỏng quy trình có căn cứ khoa học với đúng ba thí nghiệm hoàn chỉnh**: trung hòa axit, kết tủa Cu²⁺ và phân loại nhựa nổi – chìm.

Mỗi thí nghiệm phải cho phép nhiều hướng xử lý và nhiều lần điều chỉnh, nhưng chỉ trong tập thao tác và tham số có nguồn. Sản phẩm phải trả về kết quả định lượng, giải thích, mức độ đạt mục tiêu, điểm đánh đổi và hồ sơ bằng chứng. Kết quả phải minh bạch, tái lập và có giới hạn rõ ràng.

Đây là phạm vi đủ để tạo ra một sản phẩm có giá trị giáo dục, có chiều sâu kỹ thuật, có khả năng trình diễn tốt và vẫn phù hợp với năng lực của một đội trong thời gian một học kỳ ngắn.
