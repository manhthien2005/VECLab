# Workflow coder và local

Hai coder web là các phiên do người dùng vận hành, không phải quyền spawn subagent nội bộ. Giữ [checkout riêng](tech-lead-sessions.md) và quyết định no-subagent trong AGENTS.

Task mới bắt đầu từ develop trên nhánh riêng, có coder (1: domain/session/API; 2: UI/UX), branch, target và SHA thật. Không dùng nhánh Hoang/pre-refactor-cleanup làm integration target nữa. Không sửa/merge nhánh coder khác. Local review đầy đủ trước PR về develop; required CI green trước promotion.

Prompt/result giữa agent dùng đúng một JSON v1 theo [contract](web-handoff-contract.md), [task](templates/task.json) và [result](templates/result.json). Không tự mở task kế tiếp hoặc coi installer/skill là quyền thêm dependency, thay scope, deploy hay nhắn người khác.

Task chuẩn bị Jar cũ đã hoàn tất và gỡ khỏi source; giữ các plan triển khai của hai bài để đọc quyết định/bằng chứng. Nội dung historical ở một pinned SHA không tự là task đang chạy. [Phạm vi hiện hành](../ui/current-experiments.md) thắng danh mục bài cũ.
