# Hợp đồng dữ liệu hiện hành

Xem kiểu cụ thể ở `src/domain/process/contracts.ts`, `src/application/attempts/repository.ts`, `jar-projection.ts` và `extraction-projection.ts`. Source và tests của hai bài là căn cứ kiểm tra; không dùng state chuẩn độ cũ làm mẫu.

## Attempt và events

Attempt chứa ID, scenario key/release, trạng thái in_progress/completed/stopped, revision, sequence, state ban đầu/hiện tại, projection và final snapshot. Mỗi action có action ID, fingerprint, input, hashes trước/sau, resource delta và sequence. IndexedDB transaction serialize mutation và kiểm tra revision; retry cùng action ID không ghi trùng. Replay từ chain phải từ chối hash/sequence hỏng.

## Hai loại state

Jar chứa cốc, pH ban đầu, tổng liều mg/L, chương trình khuấy/lắng và phép đo NTU. Extraction chứa thể tích nước/hữu cơ mL, lượng A/B/N, acid equivalents, trạng thái phân lớp/xả áp/làm khô và sản phẩm khai báo. Session/projection của từng bài không cast chéo.

## Báo cáo và giá trị thiếu

Hoàn tất ghi report bất biến cùng lifecycle write. N/A là null/không evaluable, không phải zero. Không lấy current projection để thay nội dung completed report. Comparability kiểm tra đầy đủ version của báo cáo Jar.

## Phiên bản và lịch sử

Extraction v1 vẫn có consumer để đọc/replay đúng release; v2 dùng chung cân bằng và thêm quy tắc thao tác/đánh giá. Dữ liệu thuộc bài đã ngừng phục vụ giữ nguyên; link tương thích báo lý do thay vì đổi bài. Không migrate/xóa IndexedDB trong đợt cleanup.

SQL migrations/fixtures và concurrency tests giữ lịch sử RPC độc lập với catalog runtime. Không viết lại migration đã phát hành chỉ để đổi ví dụ scenario key. Auth/profile lưu riêng, không tự biến local attempt thành cloud attempt.
