# Checkout riêng cho các session VECLab

TL1/coder 1 phụ trách simulation/session/API và tích hợp; session gốc TL2/coder 2 phụ trách UI/UX. Người dùng đã cho local thực hiện UI trực tiếp. Không spawn subagent trừ khi người dùng yêu cầu rõ cho task hiện tại.

Mỗi session dùng checkout riêng. Không switch/reset/pull/rebase hoặc sửa files của session khác. Fetch refs không đổi checkout được phép. Worktree/branch trong tài liệu cũ không phải trạng thái hiện hành; đọc Git thật trước khi bắt đầu.

Normal work từ develop trên nhánh ngắn hạn; tích hợp qua PR và required CI theo [AGENTS](../../AGENTS.md). Production qua PR develop → main. Không direct push hoặc mang production credentials vào phát triển.

Handoff JAR-02 và các brief/review chuẩn bị tháng 10 đã hoàn tất, gỡ khỏi source; tra lại bằng Git nếu cần audit. Không có task đang active chỉ vì một checklist cũ chưa cập nhật. Phạm vi bài theo [current experiments](../ui/current-experiments.md).

Khi thực sự giao việc, dùng [contract](web-handoff-contract.md) và JSON v1 với coder/branch/target/base thật. Quy định chia session không tự cấp quyền nhắn chat khác, merge hay deploy.
