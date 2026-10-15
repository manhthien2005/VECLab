# VECLab — AI tutor: phân tích và thiết kế đề xuất

Trạng thái: đề xuất để người dùng review; chưa triển khai. Ngày 15/10/2026. Đối chiếu source tại `374684f`, nhánh `feature/acid-base-extraction`. Google API là lựa chọn của người dùng; tài liệu không lựa chọn lại nhà cung cấp, giá hoặc cam kết quota miễn phí.

## 1. Giá trị và phạm vi

Tutor là người hướng dẫn bằng hội thoại cho sinh viên không chuyên hóa đã có kiến thức cơ bản. Mục tiêu: người học hiểu thao tác, lý giải được kết quả và tự cải thiện lần thực hành tiếp theo. Thành công không đo bằng số tin nhắn hay điểm số tăng nhờ chép đáp án.

| Nhu cầu | Vai trò tutor | Giá trị quan sát được |
| --- | --- | --- |
| Chưa hiểu dụng cụ hoặc lý thuyết | Giải thích ngắn, liên hệ với bài đang mở và dẫn tài liệu | Người học biết thao tác nào phù hợp và vì sao |
| Bị vướng trong lượt đang làm | Đọc bình/cốc đang chọn, phép đo, lịch sử; gợi ý khi được hỏi | Người học tiếp tục được mà vẫn tự quyết định |
| Không hiểu báo cáo | Phân biệt chất lượng mẫu, sai lệch phép tính và yêu cầu thao tác | Người học chỉ ra được điều cần sửa ở lượt sau |

Bản đầu hỗ trợ Jar Test và chiết tách axit–bazơ. Biết tên/trạng thái các bài từ catalog; bài chưa triển khai chỉ được giới thiệu theo nội dung đã công bố. Không tự dựng quy trình hay nguồn cho bài tương lai.

Phạm vi lịch sử bản đầu là lịch sử thao tác của lượt đang mở và hội thoại của lượt đó. So sánh nhiều lượt, hồ sơ năng lực dài hạn, tự tạo bài tập, giọng nói, ảnh tải lên, điều khiển thí nghiệm bằng AI và chatbot đa chủ đề để sau.

## 2. Cơ sở từ source hiện tại

- `src/features/experiment-catalog/catalog.ts` phục vụ hai bài đang hoạt động.
- Jar Test có `JarSessionView`, `JarProjection`, `JarReportSnapshot`; snapshot chứa số đo, chỉ tiêu, diagnostics và action IDs. `JarSessionView` chưa mang danh sách thao tác; cần đọc event records bằng repository và chỉ lấy input được phép thấy.
- `src/features/simulation-session.ts` có seam Jar local/cloud. Đây chưa phải bằng chứng toàn bộ backend Jar cloud đã được kiểm chứng. API simulation đang có code acid cũ; không dùng mặc định endpoint đó để đọc lượt Jar.
- Chiết tách dùng `GuestAttemptRepository` trong workbench hiện tại. `ExtractionSessionView` đã mang projection, `actions` và report. Có release `0.1.0` và `0.2.0`; quy tắc đánh giá thao tác trộn khác nhau.
- Dữ liệu local không thể được server tự đọc chỉ từ `attemptId`. Đăng nhập cũng không tự chuyển lượt local lên cloud.
- Chưa có dependency AI hoặc pipeline truy xuất tri thức. Next.js, React, Zod, auth guards và repository hiện hữu đủ làm nền cho bản đầu.

## 3. Tutor nằm ở đâu và tương tác thế nào

Workbench có nút **Hỏi trợ giảng** mở panel có thể đóng; desktop dùng vùng bên cạnh bàn thực hành, mobile dùng panel toàn màn hình. Không thu hẹp khu vực thực hành đến mức khó thao tác. Ngôn ngữ, màu, nút và icon theo workbench đã được duyệt.

Panel ghi rõ bài, lượt đang đọc và bình/cốc đang chọn. Bốn câu hỏi gợi ý tương ứng công việc: “Giải thích dụng cụ này”, “Gợi ý để tiếp tục”, “Giải thích bước đã chọn”, “Giải thích kết quả”. Câu không phù hợp giai đoạn hiện tại không xuất hiện. Chọn gợi ý chỉ điền ô chat; người dùng bấm Gửi mới gọi API.

Trong báo cáo có lối mở “Hỏi về kết quả này” kèm sản phẩm/cốc được chọn. Trang lý thuyết có lối hỏi về chính bài đang đọc. Không cần chatbot nổi ở tất cả trang, trang chat riêng hoặc tự chào bằng một request AI.

Mỗi câu trả lời ưu tiên: giải đáp trực tiếp → dữ liệu/bước liên quan → một gợi ý hoặc một câu hỏi tiếp theo nếu cần. Mặc định khoảng 80–150 từ, cho phép yêu cầu giải thích sâu hơn. Gọi đúng tên bình/cốc, dùng “chất”, “khối lượng đã cân”, “độ lệch tính toán”; giải thích thuật ngữ khi thật sự cần.

Trả lời theo trạng thái tại lúc Gửi. Nếu người dùng thao tác trong khi chờ, vẫn nhận câu trả lời nhưng ghi “Dựa trên trạng thái trước thao tác mới”; không tự gọi lại. Hội thoại tách theo tài khoản, bài, release, lượt và chế độ lý thuyết/thực hành/báo cáo. Chuyển lượt không mang kết quả riêng của lượt cũ sang.

## 4. Cách hướng dẫn và ranh giới dữ liệu

| Chế độ | Ngữ cảnh gửi cho model | Cách hướng dẫn |
| --- | --- | --- |
| Lý thuyết | Mục tiêu, dụng cụ, nguyên lý, giới hạn và tài liệu bài | Giải thích, ví dụ có ghi rõ là minh họa |
| Đang thực hành | Input, bình/cốc đang chọn, trạng thái đã hiển thị, số đo và thao tác được phép đọc | Gợi ý từng mức theo yêu cầu; giải thích công thức, cách quan sát và sử dụng dụng cụ |
| Sau nộp | Ngữ cảnh trên + report snapshot, diagnostics và bước có bằng chứng | Đối chiếu chỉ tiêu, phép tính và thao tác; phân biệt sự kiện với giả thuyết |

Gợi ý đi từ nguyên lý, đến điều cần quan sát, rồi đến thao tác cụ thể khi người học yêu cầu rõ hơn. Không chủ động phát hiện rồi nhắc mọi sai lầm giữa lượt. Với yêu cầu “quy trình đạt điểm cao”, giải thích tiêu chí, cách thiết kế phương án và kiểm tra kết quả; không tự đưa một bộ thông số tối ưu hay đáp số của lượt đang làm.

Trong ngữ cảnh đang làm, adapter loại raw state, lượng chất ẩn, expected answers, mô hình dự đoán, bảng tham chiếu đáp án, tiêu chí chấm chưa được công bố và report hoàn chỉnh. Không gửi đáp án rồi chỉ dựa vào prompt yêu cầu AI giữ bí mật. Câu hỏi tính hộ đáp số hiện tại được hướng về công thức và cách tự kiểm tra, phù hợp nguyên tắc phản hồi cuối lượt.

Ví dụ sau nộp: với câu hỏi “Cân được nhiều sao độ tinh khiết thấp?”, tutor đối chiếu khối lượng cân và lượng từng chất trong bình theo snapshot. Chỉ gắn nguyên nhân với bước khi diagnostics/lịch sử cung cấp bằng chứng. Không quy mọi phần chất còn hòa tan hoặc còn ở bình khác thành thao tác sai.

Engine và report vẫn quyết định số liệu, điểm và trạng thái đạt. Tutor không có quyền gọi hành động mô phỏng, ghi điểm, sửa bài hoặc sửa báo cáo. Gợi ý thử một phương án khác không được đi kèm kết quả số học bịa ra cho phương án chưa chạy.

## 5. Hệ thống tri thức gọn và có kiểm soát

Hai gói tri thức được biên soạn trong source, mỗi bài gồm:

1. Mục tiêu, điều kiện và giá trị người học được thay đổi.
2. Tên/vai trò dụng cụ; thuật ngữ thường gặp.
3. Nguyên lý và quan hệ giữa các thao tác, không ép một chuỗi bấm duy nhất.
4. Gợi ý theo nhóm thao tác; câu hỏi thường gặp.
5. Cách đọc kết quả, ý nghĩa các chỉ tiêu, lỗi tính toán và diagnostics.
6. Giới hạn mô hình; source IDs ánh xạ đến nguồn và trang hướng dẫn đã có.

Mỗi gói có `knowledgeVersion`, các release được hỗ trợ và phần nội dung dành cho từng chế độ. Jar ghim `jar-test@0.1.0`; chiết tách phân biệt `acid-base-extraction@0.1.0` và `@0.2.0`. Lượt cũ thiếu protocol không bị tutor tuyên bố trượt theo quy tắc mới. Release chưa hỗ trợ chỉ được trả lời lý thuyết chung kèm thông báo giới hạn; không âm thầm dùng kiến thức release mới.

Thứ tự căn cứ: dữ liệu của lượt đúng release → định nghĩa và giới hạn mô hình → tài liệu phương pháp đã biên soạn. Nguồn phương pháp không chứng nhận các hệ số học tập là dữ liệu thực nghiệm. Giữ riêng bằng chứng số học và kiểm chứng ngoài thực tế.

Chọn nội dung bằng chế độ, thao tác/bình đang chọn, chủ đề người dùng chọn và từ khóa đơn giản. Câu hỏi chung nhận bộ nguyên lý ngắn của bài. Câu hỏi về một bước nhận đúng bước đó và các bước liên quan. Chưa cần embeddings, vector database, đọc PDF trong mỗi request, web search hoặc một model thứ hai để phân loại câu hỏi.

Tri thức được review bằng các câu hỏi mẫu; đối chiếu giới hạn/đơn vị với profile. “Đủ thông minh” đến từ ngữ cảnh đúng, nội dung đủ và cách dạy được kiểm tra, không từ một prompt dài tự nhận là giáo sư.

## 6. Kiến trúc đề xuất

Luồng: **Chat UI → adapter ngữ cảnh → `/api/tutor` → xác thực/kiểm tra/quota → chọn tri thức → một lần gọi Google → kiểm tra phản hồi → hiển thị**.

Một endpoint và một provider wrapper dùng native `fetch`. Chưa cần SDK framework AI, agent loop, tool calling, background worker hoặc streaming. Trả lời hoàn chỉnh có trạng thái chờ và có thể hủy. Model đọc từ cấu hình server, chọn model đang khả dụng cho quota của dự án khi triển khai; không ghim một tên model theo trí nhớ.

Request có `requestId`, bài/release, nguồn local/cloud, mode, revision, câu hỏi, vài lượt chat gần nhất và ngữ cảnh theo schema. Với cloud, server đọc bằng repository gắn verified learner, kiểm quyền sở hữu và tự suy ra mode từ trạng thái lưu. Không tin client gửi một report của người khác.

Với local, server kiểm schema, miền giá trị và chỉ giữ field cho phép. Dữ liệu này được coi là dữ liệu người học cung cấp, không là báo cáo đã được server chứng thực. Tuyên bố hoàn thành ở client không thể trở thành bằng chứng chống gian lận. Bản đầu phục vụ học tập; không mở rộng thành di chuyển toàn bộ lượt local lên cloud hay hệ thống thi có giám sát.

Response có nội dung, source IDs, action sequences nếu liên quan và định danh ngữ cảnh đã dùng. Chỉ render nguồn/bước nằm trong tập đã gửi; URL do server ánh xạ, không dùng URL AI tự tạo. Model text là dữ liệu không tin cậy: render text an toàn, không HTML thực thi. JSON đúng cấu trúc không đồng nghĩa nội dung đúng khoa học; vẫn cần bộ câu hỏi đánh giá.

Chat gần nhất lưu trên trình duyệt theo tài khoản/lượt, có Xóa hội thoại. Mỗi request chỉ gửi tối đa bốn cặp hỏi–đáp gần nhất; không tạo “trí nhớ dài hạn” bằng một lượt gọi AI tóm tắt sau mỗi tin. Không gửi tên, email hoặc thông tin tài khoản cho Google. Người dùng được biết nội dung câu hỏi và dữ liệu bài liên quan sẽ gửi đến dịch vụ AI.

## 7. Tối ưu quota và trạng thái lỗi

Đề xuất v1: AI chỉ dùng khi đăng nhập; khách vẫn dùng đầy đủ mô phỏng và tài liệu. Đây là lựa chọn đề xuất để review, không phải yêu cầu người dùng đã chốt.

- Chỉ gọi khi bấm Gửi; chọn cốc, thay input, mở panel hoặc mở báo cáo không phát sinh request.
- Một request đang chạy trên mỗi người dùng; ban đầu đề xuất 3 câu/phút và 20 câu/ngày/người, có thể hạ theo quota thực. Đây là giới hạn ứng dụng, không phải hạn mức Google.
- Giới hạn cả mức dùng chung của dự án theo quota Google thực tế, có phần dự phòng khoảng 20%. Quota Google áp dụng theo project; nhiều API keys không tạo thêm quota.
- Dùng một bảng metadata request/quota trên database hiện có, reservation nguyên tử trước khi gọi provider, áp dụng được qua nhiều server instance. Không dùng biến trong RAM làm quota production. Chỉ backend truy cập cơ chế reservation; client không được tự thay user ID hoặc cap.
- Cùng `requestId` đang/chưa xử lý rõ ràng không được gọi provider thêm. Duplicate trả trạng thái để UI dùng câu trả lời đã nhận hoặc yêu cầu gửi lại có chủ đích; không hứa exactly-once khi server mất kết nối giữa chừng. Request đã thử gọi được tính bảo thủ vào quota.
- Câu hỏi tối đa 1.200 ký tự, request tối đa 32 KiB. Ngữ cảnh có tổng quan lượt, tối đa 12 thao tác gần đây và các bước được chọn/diagnostics liên quan. Nếu cần lịch sử xa hơn, người dùng chọn bước trong sổ đo; không gửi mọi event snapshot.
- Mục tiêu input thường khoảng 4.000–6.000 tokens; giới hạn payload và đo usage thực tế, không coi số ký tự là phép đếm token chính xác. Output mặc định tối đa 1.024 tokens, điều chỉnh với model và tiếng Việt qua thử nghiệm. Kiểm soát reasoning theo khả năng model để không vô tình tốn quota; phần này xác nhận theo docs lúc triển khai.
- RPM/RPD được chặn bằng reservation dùng chung; TPM theo dõi/ước lượng có dự phòng và luôn xử lý được 429. Không cam kết tránh tuyệt đối rate limit chỉ bằng bộ đếm của ứng dụng. Mốc reset ngày dùng cấu hình theo provider, không hard-code lệch múi giờ.
- Không tự gọi lại khi 429, timeout hoặc trả lời lỗi ở v1. Hiển thị lúc có thể thử lại, giữ câu hỏi và trả quyền quyết định cho người dùng. Một lần gửi thông thường tương ứng tối đa một lần gọi Google.
- FAQ và giải thích dụng cụ ngắn tiếp tục mở từ tài liệu có sẵn không cần AI. Không cần shared cache câu trả lời cá nhân. Hội thoại cục bộ đã có câu trả lời vẫn đọc được khi mất API.

Endpoint kiểm auth, same-origin, body/schema và cấu hình. Thiếu API key, quota hết, DB quota không hoạt động, lỗi provider hoặc phản hồi bị cắt đều không ảnh hưởng lưu/nộp/xem báo cáo. Trả lỗi dễ hiểu, không làm lộ credential hoặc prompt nội bộ. API key chỉ nằm ở server.

## 8. Nghiệm thu và cách triển khai

Xây theo bốn bước có giá trị độc lập: (1) tri thức + adapter an toàn; (2) backend Google + quota; (3) tutor trong báo cáo/lý thuyết; (4) tutor theo trạng thái đang làm. Chi tiết tại [kế hoạch triển khai](../plans/2026-10-15-ai-tutor.md).

Bộ đánh giá ban đầu gồm 24 tình huống cân bằng giữa hai bài: 8 lý thuyết/dụng cụ, 6 ngữ cảnh lượt đang làm, 6 giải thích báo cáo, 4 tình huống khó gồm thiếu dữ liệu/release cũ/yêu cầu lộ đáp án/chỉ dẫn ngoài phạm vi. Fixture có câu trả lời hoặc rubric mong đợi; không dùng chính model để tự tuyên bố đạt.

Điều kiện mở thử nghiệm: các test ranh giới dữ liệu/quyền/quota đều đạt; không còn finding nghiêm trọng về bịa số liệu, chấm lại lượt cũ hoặc lộ dữ liệu trước nộp trong tập đánh giá; tối thiểu 20/24 câu được reviewer đánh giá đúng, phù hợp và có ích. Đây là ngưỡng pilot đề xuất, không là chứng minh AI luôn đúng. Ghi lại model/knowledge/prompt version, số request và token của lượt đánh giá; không chạy liên tục sau các chỉnh sửa UI nhỏ.

Thử với 3–5 sinh viên mục tiêu: người học có tự tiếp tục được không, có giải thích được một khác biệt trong báo cáo không, có phân biệt số liệu mô hình với thực nghiệm không. Dùng một câu hỏi chuyển giao không có tutor để xem họ hiểu thay vì chỉ chép. Số lần chat hoặc điểm tăng riêng lẻ không đủ chứng minh hiệu quả học tập.

Chỉ theo dõi metadata cần thiết: số request, trạng thái, token, thời gian chờ, model/prompt/knowledge version và phản hồi Có ích/Chưa có ích. Không xây dashboard phân tích riêng hoặc lưu toàn bộ hội thoại trên server cho bản đầu.

## 9. Các lựa chọn đề xuất cần người dùng review

1. Một tutor chung, chỉ hai bài hiện có; chat theo lượt, chưa có trí nhớ qua nhiều lượt.
2. Ưu tiên đưa vào báo cáo/lý thuyết trước; bổ sung trợ giúp theo trạng thái ngay trong cùng kế hoạch.
3. Đang làm: gợi ý theo yêu cầu, không tự nhắc lỗi hoặc đưa đáp số/bộ thông số tối ưu.
4. V1 yêu cầu đăng nhập để dùng AI; giới hạn ứng dụng ban đầu có thể giảm theo quota Google thực.
5. Native Google API, tri thức trong source, không thêm framework AI/vector database.

Round này chỉ tạo tài liệu. Chưa gọi Gemini, cài dependency, tạo migration, sửa UI/domain, gửi dữ liệu người học hay thay đổi production.

## Tài liệu kỹ thuật đã đối chiếu

- [Google — Rate limits](https://ai.google.dev/gemini-api/docs/rate-limits): quota theo project, model/tier và thời điểm reset. Đọc hạn mức thực trong AI Studio lúc triển khai, không dùng một con số miễn phí cố định trong thiết kế.
- [Google — API keys](https://ai.google.dev/gemini-api/docs/api-key): khóa ở server, không đưa vào frontend.
- [Google — Token counting](https://ai.google.dev/gemini-api/docs/tokens): đo input/output, đối chiếu usage và giới hạn ngữ cảnh.
- [Google — Troubleshooting](https://ai.google.dev/gemini-api/docs/troubleshooting): 429/transient errors; backoff khi có retry. V1 chủ động không có retry tự động.
- [Google — Structured output](https://ai.google.dev/gemini-api/docs/structured-output): cấu trúc đầu ra; không là bảo đảm đúng nội dung.
- [Supabase — RLS](https://supabase.com/docs/guides/database/postgres/row-level-security): cô lập dữ liệu, quyền truy cập backend và ownership. Migration tương lai chỉ kiểm local/CI; production vẫn theo AGENTS.
