# Yêu cầu phát triển Lark Base Custom View

Chào bạn, để xây dựng một Custom View chính xác và hiệu quả nhất trên Lark Base, tôi cần bạn làm rõ những thông tin sau đây:

### 1. Mục đích & Loại hiển thị (View Type)
Bạn muốn hiển thị dữ liệu dưới hình thức nào?
*   **Kanban/Board:** Kéo thả thẻ trạng thái.
*   **Dashboard:** Biểu đồ, số liệu tổng hợp.
*   **Calendar/Gantt:** Lịch trình, timeline.
*   **Gallery/Card:** Danh sách dạng thẻ hình ảnh.
*   **Form/Input:** Giao diện nhập liệu chuyên sâu.
*   **Map:** Bản đồ vị trí.

### 2. Cấu trúc dữ liệu (Data Structure)
Bảng (Table) hiện tại của bạn có những trường (Fields) quan trọng nào? Vui lòng liệt kê:
*   *Ví dụ:*
    *   `Task Name` (Text)
    *   `Status` (Single Select: To Do, In Progress, Done)
    *   `Deadline` (Date)
    *   `Assignee` (Person)
    *   `Attachments` (File/Image)

### 3. Tương tác (Interaction)
Người dùng sẽ tương tác với View như thế nào?
*   **Read-only:** Chỉ xem dữ liệu.
*   **Edit:** Cần chỉnh sửa trực tiếp (ví dụ: đổi trạng thái, sửa text).
*   **Create/Delete:** Cần thêm mới hoặc xóa bản ghi từ View này.

### 4. Logic nghiệp vụ (Business Logic)
Có quy tắc đặc biệt nào không?
*   Ví dụ: "Nếu quá hạn `Deadline`, thẻ chuyển màu đỏ", hoặc "Chỉ hiện task của người đang đăng nhập".

---
*Sau khi bạn cung cấp thông tin này, tôi sẽ cập nhật code trong `App.tsx` và `services/larkService.ts` để thực thi đúng logic.*