import type { WorkbenchTourStep } from '@/features/workbench/tour.js'
export const EXTRACTION_TOUR: readonly WorkbenchTourStep[] = [
 {area:'header',title:'Mục tiêu & lượt thực hành',description:'Xem mục tiêu thu hồi ba cấu tử và trạng thái lưu. Nộp bài khóa lượt và mở báo cáo; bạn vẫn có thể xem lại số đo.'},
 {area:'shelf',title:'Mẫu & dụng cụ',description:'Mẫu chuẩn A/B/N, phễu chiết, bình thu và dụng cụ đo. Mở từng mục để hiểu chức năng; các thao tác được thực hiện ở bảng bên phải.'},
 {area:'simulation',title:'Phễu chiết & các bình mẫu',description:'Chọn S, F hoặc một bình thu để xem phần mẫu đang có. Pha hữu cơ chuẩn ở trên, pha nước ở dưới. Màu chỉ phân biệt pha, không chỉ ra chất A/B/N.'},
 {area:'controls',title:'Thao tác với bình đang chọn',description:'Cấp dung dịch, trộn, xả áp, phân lớp rồi chọn pha và bình nhận. Có thể chiết lặp và đổi hướng xử lý. Lọc, cô, làm khô và đo nằm ở các nhóm bên dưới.'},
 {area:'notebook',title:'Sổ đo & sản phẩm',description:'Xem số đo đã thực hiện và bước đo. Cân sau khi làm khô, khai báo bình chứa từng sản phẩm và nhập đáp số. Thành phần thực theo mô hình chỉ xuất hiện sau nộp.'},
]
