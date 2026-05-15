# Lumina — AI Study Planner

Lumina là một hệ thống học tập thông minh hỗ trợ bởi AI (Google Gemini). Nền tảng cung cấp các tính năng như tạo lộ trình học cá nhân hóa, Chatbot RAG (tương tác với tài liệu), tóm tắt PDF/DOCX, tự động tạo bài trắc nghiệm (Quiz) và phân tích tiến trình học tập.

Hệ thống bao gồm 2 phần:
- **Frontend**: React + Vite + TypeScript, giao diện dark mode hiện đại.
- **Backend**: FastAPI + Supabase (PostgreSQL) + LangChain.

---

## 🚀 Hướng Dẫn Setup Toàn Hệ Thống

### Yêu Cầu Chung
- Node.js (v18+)
- Python (v3.11+)
- Google Gemini API Key

---

### 1. Setup Backend

Project dùng **Supabase** (PostgreSQL cloud) làm database chung. Bạn **không cần cài Docker hay PostgreSQL** trên máy, chỉ cần connection string của team.

```bash
# 1. Di chuyển vào thư mục backend
cd backend

# 2. Tạo và kích hoạt môi trường ảo
python3 -m venv venv
source venv/bin/activate          # macOS / Linux
# venv\Scripts\activate           # Windows

# 3. Cài đặt dependencies
pip install -r requirements.txt

# 4. Cấu hình biến môi trường
cp .env.example .env
```

**Cấu hình `.env` cho Backend**:
Mở file `backend/.env` và điền:
- `DATABASE_URL`: Connection string Supabase của team (Direct connection).
- `GOOGLE_GEMINI_API_KEY`: API Key lấy từ Google AI Studio.

```bash
# 5. Khởi tạo database (chỉ cần chạy lần đầu)
python startup.py

# 6. Seed dữ liệu mẫu (tùy chọn)
python seed.py

# 7. Khởi chạy server (Chạy ở cổng 8000)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

### 2. Setup Frontend

```bash
# 1. Di chuyển vào thư mục frontend
cd frontend

# 2. Cài đặt các gói phụ thuộc
npm install

# 3. Khởi chạy server phát triển (Chạy ở cổng 5173)
npm run dev
```

---

## 👤 Tài Khoản Mặc Định 


| Role | Email | Mật khẩu | Chức năng |
|---|---|---|---|
| **Admin** | `admin@studyplanner.com` | `admin123` | Quản lý người dùng, cài đặt hệ thống, xem thống kê chung. |
| **User** | `student@studyplanner.com` | `student123` | Học viên, tạo lộ trình, tải tài liệu, làm bài tập. |

---

## 🗂️ Cấu Trúc Dự Án

```
GRI501/
├── frontend/          # React + Vite + TypeScript (Tailwind CSS)
│   ├── src/
│   │   ├── components/  # UI components dùng chung
│   │   ├── screens/     # Các trang giao diện (Auth, Dashboard, Admin...)
│   │   ├── contexts/    # React Context (Auth)
│   │   └── api/         # Axios client giao tiếp với Backend
│   └── package.json
│
├── backend/           # FastAPI + LangChain
│   ├── app/
│   │   ├── routers/     # API Endpoints
│   │   ├── services/    # Logic AI (RAG, Chat, Roadmap, Quiz)
│   │   └── models/      # SQLAlchemy Database Models
│   ├── startup.py       # Script tạo bảng Supabase
│   ├── seed.py          # Script tạo data mẫu
│   └── .env.example     # Biến môi trường mẫu
└── README.md          # File hướng dẫn này
```

---

## 🔑 Các Tính Năng Chính

- **Lộ trình AI**: Dựa trên mục tiêu và trình độ, Gemini sẽ tự động vạch ra lộ trình học tập gồm các cột mốc chi tiết.
- **Thư Viện Tài Liệu**: Upload PDF, DOCX. Backend sử dụng PyPDF và Langchain để băm nhỏ (chunk) và lưu vector vào Qdrant.
- **RAG Chatbot**: Chat trực tiếp với AI. AI sẽ truy xuất nội dung từ các tài liệu bạn đã tải lên để trả lời một cách chính xác (streaming text).
- **Tạo Trắc Nghiệm Tự Động**: Nhập chủ đề, AI sẽ tạo bài kiểm tra ngay lập tức.
- **Phân Tích Tiến Trình**: Biểu đồ thống kê giờ học, mức độ hoàn thành và điểm số.
- **Trang Quản Trị**: Admin dashboard giúp quản lý user và theo dõi tài nguyên hệ thống.
