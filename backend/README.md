# AI Study Planner — Backend

Backend API cho hệ thống học tập thông minh hỗ trợ AI. Cung cấp xác thực JWT, tạo lộ trình học cá nhân hóa bằng Gemini AI, Chatbot RAG với streaming SSE, tóm tắt tài liệu PDF/DOCX, tự động tạo Quiz và phân tích tiến trình.

---

## ⚙️ Tech Stack

| Layer | Công nghệ |
|---|---|
| Framework | FastAPI (Python 3.11+) |
| Database | **Supabase (PostgreSQL)** — cloud managed |
| ORM | SQLAlchemy 2.0 |
| AI / LLM | Google Gemini API (`gemini-1.5-flash`), LangChain |
| Embeddings | `sentence-transformers` (local) |
| Vector Store | Qdrant (local mode) |
| Auth | JWT Bearer Token (python-jose) |
| Rate Limiting | SlowAPI |
| Document Processing | PyPDF, LangChain RecursiveCharacterTextSplitter |

---

## 🗄️ Database: Supabase (Shared Cloud DB)

Project dùng **Supabase** (PostgreSQL cloud) làm database chung cho cả team. Bạn **không cần cài Docker, PostgreSQL, hay tạo tài khoản Supabase** — chỉ cần dùng connection string có sẵn.

### ✅ Team chỉ cần làm 1 việc

Copy đúng `DATABASE_URL` bên dưới vào file `.env`:

```env
DATABASE_URL=postgresql://postgres:f0PGNn0PtM99Dvt1@db.wjbshvbujuskrcbddxkj.supabase.co:5432/postgres
```

> 💡 **Lưu ý:** Đây là DB dùng chung của team. Mọi thay đổi dữ liệu (thêm user, roadmap...) sẽ ảnh hưởng tới tất cả. Dùng `seed.py --reset` cẩn thận.

---

## 🚀 Hướng Dẫn Setup

### Yêu Cầu

- Python 3.11+
- Tài khoản Supabase (team đã có sẵn project)
- Google Gemini API Key

### Bước 1 — Clone & Tạo môi trường ảo

```bash
cd backend
python3 -m venv venv
source venv/bin/activate          # macOS / Linux
# hoặc: venv\Scripts\activate    # Windows
```

### Bước 2 — Cài đặt dependencies

```bash
pip install -r requirements.txt
```

> **Nếu gặp lỗi libmagic** (macOS):  Đã được xử lý — project dùng `mimetypes` thay thế. Không cần cài thêm gì.

### Bước 3 — Cấu hình file `.env`

Tạo file `.env` từ template:

```bash
cp .env.example .env
```

Sau đó mở `.env` và điền thông tin:

```env
# Database — Supabase connection string (lấy từ Supabase Dashboard > Settings > Database > URI)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# Google Gemini AI — lấy tại https://aistudio.google.com/app/apikey
GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here

# JWT
JWT_SECRET_KEY=your-super-secret-key-min-32-chars-long
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Frontend URL (CORS)
FRONTEND_URL=http://localhost:5173

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE_MB=10

# Qdrant (vector store — lưu local)
QDRANT_PATH=./qdrant_storage
```

### Bước 4 — Tạo bảng trên Supabase

Chạy script startup để tự động tạo toàn bộ bảng trên Supabase:

```bash
python startup.py
```

Lệnh này sẽ kết nối Supabase và chạy `CREATE TABLE IF NOT EXISTS` cho tất cả các model.

### Bước 5 — Seed dữ liệu mẫu (tùy chọn)

```bash
# Seed lần đầu
python seed.py

# Nếu muốn reset và seed lại từ đầu
python seed.py --reset
```

Sau khi seed xong, có thể đăng nhập bằng:

| Email | Mật khẩu | Role |
|---|---|---|
| `admin@studyplanner.com` | `admin123` | Admin |
| `student@studyplanner.com` | `student123` | User |
| `test@studyplanner.com` | `test123` | User |

### Bước 6 — Khởi chạy server

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Server sẽ chạy tại `http://localhost:8000`.

---

## 🌐 Truy Cập API

| URL | Mô tả |
|---|---|
| `http://localhost:8000` | API root |
| `http://localhost:8000/docs` | Swagger UI (test API trực tiếp) |
| `http://localhost:8000/redoc` | ReDoc documentation |

---

## 🔑 Các Endpoint Chính

| Module | Endpoint | Mô tả |
|---|---|---|
| Auth | `POST /api/auth/register` | Đăng ký tài khoản mới |
| Auth | `POST /api/auth/login` | Đăng nhập, nhận JWT token |
| Auth | `POST /api/auth/logout` | Đăng xuất (blacklist token) |
| User | `GET /api/users/me` | Lấy thông tin user hiện tại |
| Roadmap | `POST /api/roadmap/generate` | Tạo lộ trình học bằng Gemini AI |
| Chat | `POST /api/chat/sessions` | Tạo session chat mới |
| Chat | `POST /api/chat/sessions/{id}/messages` | Gửi tin nhắn (SSE streaming + RAG) |
| Documents | `POST /api/documents/upload` | Upload PDF/DOCX (xử lý background) |
| Quiz | `POST /api/quiz/generate` | Tạo quiz tự động bằng AI |
| Progress | `GET /api/progress/analytics` | Thống kê tiến trình học tập |
| **Admin** | `GET /api/admin/stats` | Thống kê hệ thống (chỉ admin) |
| **Admin** | `GET /api/admin/users` | Danh sách tất cả users (chỉ admin) |
| **Admin** | `PATCH /api/admin/users/{id}/toggle-active` | Bật/tắt user (chỉ admin) |
| **Admin** | `PATCH /api/admin/users/{id}/role` | Đổi role user (chỉ admin) |

---

## 🏗️ Cấu Trúc Thư Mục

```
backend/
├── app/
│   ├── core/          # JWT, dependencies, LLM client
│   ├── models/        # SQLAlchemy ORM models
│   ├── routers/       # FastAPI route handlers
│   ├── schemas/       # Pydantic request/response schemas
│   ├── services/      # Business logic (roadmap, chat, RAG, quiz...)
│   ├── database.py    # DB connection & session
│   ├── config.py      # Settings (từ .env)
│   └── main.py        # FastAPI app entry point
├── startup.py         # Tạo bảng trên Supabase khi khởi động
├── seed.py            # Seed dữ liệu mẫu
├── requirements.txt
├── .env.example
└── README.md
```

---

## 🐛 Xử Lý Lỗi Thường Gặp

### `could not connect to server`
→ Kiểm tra lại `DATABASE_URL` trong `.env`. Đảm bảo dùng đúng **password** và **Direct connection** trên Supabase.

### `ModuleNotFoundError`
→ Chạy lại `pip install -r requirements.txt` trong virtual environment đang active.

### `Address already in use` (port 8000)
→ Có process cũ đang chạy. Kill bằng:
```bash
pkill -f uvicorn
```
Rồi chạy lại server.

### Bảng không tồn tại (relation "users" does not exist)
→ Chạy `python startup.py` để tạo bảng trên Supabase.
