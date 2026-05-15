#!/usr/bin/env python3
"""
Seed script: Populate the database with sample data for development/testing.
Usage: python seed.py
       python seed.py --reset  (drop all data first, then seed)
"""
import sys
import uuid
from datetime import datetime, date, timedelta

from app.database import SessionLocal, engine, Base
from app.models import (
    User, Roadmap, Milestone, ChatSession, ChatMessage,
    Document, Quiz, QuizQuestion, QuizAttempt, StudyLog
)
from app.core.security import get_password_hash

# ─── Fixed UUIDs for reproducibility ───────────────────────────────────────────
USER_1_ID = uuid.UUID("11111111-1111-1111-1111-111111111111")
USER_2_ID = uuid.UUID("22222222-2222-2222-2222-222222222222")
USER_3_ID = uuid.UUID("33333333-3333-3333-3333-333333333333")

ROADMAP_1_ID = uuid.UUID("aaaa1111-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
ROADMAP_2_ID = uuid.UUID("aaaa2222-aaaa-aaaa-aaaa-aaaaaaaaaaaa")

MILESTONE_IDS = [
    uuid.UUID(f"bbbb{i:04d}-bbbb-bbbb-bbbb-bbbbbbbbbbbb") for i in range(1, 7)
]

DOC_1_ID = uuid.UUID("cccc1111-cccc-cccc-cccc-cccccccccccc")
DOC_2_ID = uuid.UUID("cccc2222-cccc-cccc-cccc-cccccccccccc")

CHAT_SESSION_1_ID = uuid.UUID("dddd1111-dddd-dddd-dddd-dddddddddddd")
CHAT_SESSION_2_ID = uuid.UUID("dddd2222-dddd-dddd-dddd-dddddddddddd")

QUIZ_1_ID = uuid.UUID("eeee1111-eeee-eeee-eeee-eeeeeeeeeeee")
QUIZ_2_ID = uuid.UUID("eeee2222-eeee-eeee-eeee-eeeeeeeeeeee")


def reset_database():
    """Drop and recreate all tables."""
    print("⚠️  Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    print("✅ Creating all tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ Database reset complete.")


def seed_users(db):
    """Seed sample users."""
    users = [
        User(
            id=USER_1_ID,
            email="admin@studyplanner.com",
            full_name="Admin User",
            hashed_password=get_password_hash("admin123"),
            avatar_url=None,
            learning_goal="Master Python and Machine Learning",
            current_level="intermediate",
            hours_per_week=20,
            deadline=date.today() + timedelta(days=180),
            is_active=True,
            role="admin"
        ),
        User(
            id=USER_2_ID,
            email="student@studyplanner.com",
            full_name="Nguyễn Văn A",
            hashed_password=get_password_hash("student123"),
            avatar_url=None,
            learning_goal="Học lập trình web fullstack",
            current_level="beginner",
            hours_per_week=15,
            deadline=date.today() + timedelta(days=120),
            is_active=True,
        ),
        User(
            id=USER_3_ID,
            email="test@studyplanner.com",
            full_name="Test User",
            hashed_password=get_password_hash("test123"),
            avatar_url=None,
            learning_goal="Learn Data Science",
            current_level="beginner",
            hours_per_week=10,
            deadline=date.today() + timedelta(days=90),
            is_active=True,
        ),
    ]
    db.add_all(users)
    db.flush()
    print(f"  ✅ Seeded {len(users)} users")
    return users


def seed_roadmaps(db):
    """Seed sample roadmaps with milestones."""
    roadmaps = [
        Roadmap(
            id=ROADMAP_1_ID,
            user_id=USER_1_ID,
            title="Python & ML Roadmap",
            description="Lộ trình học Python từ cơ bản đến Machine Learning nâng cao",
            status="active",
        ),
        Roadmap(
            id=ROADMAP_2_ID,
            user_id=USER_2_ID,
            title="Fullstack Web Development",
            description="Lộ trình học lập trình web từ HTML/CSS đến React + FastAPI",
            status="active",
        ),
    ]
    db.add_all(roadmaps)
    db.flush()

    milestones = [
        # Roadmap 1 milestones
        Milestone(
            id=MILESTONE_IDS[0],
            roadmap_id=ROADMAP_1_ID,
            title="Python Basics",
            description="Học cú pháp Python cơ bản, biến, kiểu dữ liệu, vòng lặp, hàm",
            estimated_days=14,
            order_index=0,
            status="completed",
            resources=[
                {"title": "Python Official Tutorial", "url": "https://docs.python.org/3/tutorial/"},
                {"title": "Automate the Boring Stuff", "url": "https://automatetheboringstuff.com/"},
            ],
        ),
        Milestone(
            id=MILESTONE_IDS[1],
            roadmap_id=ROADMAP_1_ID,
            title="Data Structures & OOP",
            description="List, dict, set, class, inheritance, decorator",
            estimated_days=21,
            order_index=1,
            status="in_progress",
            resources=[
                {"title": "Real Python - OOP", "url": "https://realpython.com/python3-object-oriented-programming/"},
            ],
        ),
        Milestone(
            id=MILESTONE_IDS[2],
            roadmap_id=ROADMAP_1_ID,
            title="Machine Learning Fundamentals",
            description="Scikit-learn, regression, classification, clustering",
            estimated_days=30,
            order_index=2,
            status="not_started",
            resources=[
                {"title": "Scikit-learn Docs", "url": "https://scikit-learn.org/stable/"},
                {"title": "ML Course - Andrew Ng", "url": "https://www.coursera.org/learn/machine-learning"},
            ],
        ),
        # Roadmap 2 milestones
        Milestone(
            id=MILESTONE_IDS[3],
            roadmap_id=ROADMAP_2_ID,
            title="HTML & CSS Fundamentals",
            description="Cấu trúc HTML, CSS selectors, Flexbox, Grid, responsive design",
            estimated_days=14,
            order_index=0,
            status="completed",
            resources=[
                {"title": "MDN Web Docs", "url": "https://developer.mozilla.org/en-US/docs/Web"},
            ],
        ),
        Milestone(
            id=MILESTONE_IDS[4],
            roadmap_id=ROADMAP_2_ID,
            title="JavaScript & React",
            description="ES6+, React hooks, state management, routing",
            estimated_days=28,
            order_index=1,
            status="in_progress",
            resources=[
                {"title": "React Official Docs", "url": "https://react.dev/"},
            ],
        ),
        Milestone(
            id=MILESTONE_IDS[5],
            roadmap_id=ROADMAP_2_ID,
            title="Backend với FastAPI",
            description="RESTful API, SQLAlchemy, authentication, deployment",
            estimated_days=21,
            order_index=2,
            status="not_started",
            resources=[
                {"title": "FastAPI Docs", "url": "https://fastapi.tiangolo.com/"},
            ],
        ),
    ]
    db.add_all(milestones)
    db.flush()
    print(f"  ✅ Seeded {len(roadmaps)} roadmaps with {len(milestones)} milestones")


def seed_documents(db):
    """Seed sample documents (metadata only, no actual files)."""
    docs = [
        Document(
            id=DOC_1_ID,
            user_id=USER_1_ID,
            filename="python_basics.pdf",
            original_name="Python_Basics_Guide.pdf",
            file_type="application/pdf",
            file_path="./uploads/python_basics.pdf",
            file_size=2048000,
            status="ready",
            summary="Tài liệu hướng dẫn Python cơ bản bao gồm biến, kiểu dữ liệu, cấu trúc điều khiển và hàm.",
            chunk_count=15,
        ),
        Document(
            id=DOC_2_ID,
            user_id=USER_2_ID,
            filename="web_dev_notes.pdf",
            original_name="Web_Development_Notes.pdf",
            file_type="application/pdf",
            file_path="./uploads/web_dev_notes.pdf",
            file_size=1536000,
            status="ready",
            summary="Ghi chú về phát triển web bao gồm HTML, CSS, JavaScript và các framework phổ biến.",
            chunk_count=12,
        ),
    ]
    db.add_all(docs)
    db.flush()
    print(f"  ✅ Seeded {len(docs)} documents")


def seed_chat_sessions(db):
    """Seed sample chat sessions with messages."""
    sessions = [
        ChatSession(
            id=CHAT_SESSION_1_ID,
            user_id=USER_1_ID,
            title="Hỏi về Python decorators",
        ),
        ChatSession(
            id=CHAT_SESSION_2_ID,
            user_id=USER_2_ID,
            title="Cách dùng React hooks",
        ),
    ]
    db.add_all(sessions)
    db.flush()

    messages = [
        # Session 1
        ChatMessage(
            session_id=CHAT_SESSION_1_ID,
            role="user",
            content="Decorator trong Python là gì? Cho tôi ví dụ cụ thể.",
            has_rag_context=False,
            created_at=datetime.utcnow() - timedelta(hours=2),
        ),
        ChatMessage(
            session_id=CHAT_SESSION_1_ID,
            role="assistant",
            content="Decorator trong Python là một hàm nhận vào một hàm khác và mở rộng hành vi của nó mà không cần thay đổi mã nguồn gốc.\n\n```python\ndef my_decorator(func):\n    def wrapper(*args, **kwargs):\n        print('Before function call')\n        result = func(*args, **kwargs)\n        print('After function call')\n        return result\n    return wrapper\n\n@my_decorator\ndef say_hello():\n    print('Hello!')\n```",
            has_rag_context=False,
            created_at=datetime.utcnow() - timedelta(hours=1, minutes=58),
        ),
        ChatMessage(
            session_id=CHAT_SESSION_1_ID,
            role="user",
            content="Làm sao để tạo decorator có tham số?",
            has_rag_context=False,
            created_at=datetime.utcnow() - timedelta(hours=1, minutes=55),
        ),
        ChatMessage(
            session_id=CHAT_SESSION_1_ID,
            role="assistant",
            content="Để tạo decorator có tham số, bạn cần thêm một lớp hàm bên ngoài:\n\n```python\ndef repeat(n):\n    def decorator(func):\n        def wrapper(*args, **kwargs):\n            for _ in range(n):\n                result = func(*args, **kwargs)\n            return result\n        return wrapper\n    return decorator\n\n@repeat(3)\ndef greet(name):\n    print(f'Hello {name}!')\n```",
            has_rag_context=True,
            created_at=datetime.utcnow() - timedelta(hours=1, minutes=53),
        ),
        # Session 2
        ChatMessage(
            session_id=CHAT_SESSION_2_ID,
            role="user",
            content="useState và useEffect khác nhau như nào?",
            has_rag_context=False,
            created_at=datetime.utcnow() - timedelta(hours=1),
        ),
        ChatMessage(
            session_id=CHAT_SESSION_2_ID,
            role="assistant",
            content="**useState** dùng để quản lý state trong component:\n```jsx\nconst [count, setCount] = useState(0);\n```\n\n**useEffect** dùng để xử lý side effects (gọi API, subscribe events, ...):\n```jsx\nuseEffect(() => {\n  fetchData();\n}, [dependency]);\n```\n\nĐiểm khác biệt chính: useState quản lý dữ liệu, useEffect quản lý hành vi phụ.",
            has_rag_context=True,
            created_at=datetime.utcnow() - timedelta(minutes=58),
        ),
    ]
    db.add_all(messages)
    db.flush()
    print(f"  ✅ Seeded {len(sessions)} chat sessions with {len(messages)} messages")


def seed_quizzes(db):
    """Seed sample quizzes with questions."""
    quizzes = [
        Quiz(
            id=QUIZ_1_ID,
            user_id=USER_1_ID,
            document_id=DOC_1_ID,
            title="Python Basics Quiz",
            topic="Python cơ bản",
            total_questions=3,
        ),
        Quiz(
            id=QUIZ_2_ID,
            user_id=USER_2_ID,
            document_id=DOC_2_ID,
            title="HTML & CSS Quiz",
            topic="HTML và CSS",
            total_questions=3,
        ),
    ]
    db.add_all(quizzes)
    db.flush()

    questions = [
        # Quiz 1 - Python
        QuizQuestion(
            quiz_id=QUIZ_1_ID,
            question="Kiểu dữ liệu nào sau đây là immutable trong Python?",
            options=["list", "dict", "tuple", "set"],
            correct_answer=2,
            explanation="Tuple là kiểu dữ liệu immutable (không thể thay đổi) trong Python. List, dict, và set đều là mutable.",
            order_index=0,
        ),
        QuizQuestion(
            quiz_id=QUIZ_1_ID,
            question="Output của print(type([])) là gì?",
            options=["<class 'tuple'>", "<class 'list'>", "<class 'dict'>", "<class 'set'>"],
            correct_answer=1,
            explanation="[] tạo ra một list rỗng, nên type([]) trả về <class 'list'>.",
            order_index=1,
        ),
        QuizQuestion(
            quiz_id=QUIZ_1_ID,
            question="Từ khóa nào dùng để định nghĩa hàm trong Python?",
            options=["function", "func", "def", "lambda"],
            correct_answer=2,
            explanation="Trong Python, từ khóa 'def' được dùng để định nghĩa hàm. 'lambda' cũng tạo hàm nhưng là hàm ẩn danh.",
            order_index=2,
        ),
        # Quiz 2 - HTML/CSS
        QuizQuestion(
            quiz_id=QUIZ_2_ID,
            question="Thẻ HTML nào dùng để tạo liên kết?",
            options=["<link>", "<a>", "<href>", "<url>"],
            correct_answer=1,
            explanation="Thẻ <a> (anchor) dùng để tạo liên kết. Thẻ <link> dùng để liên kết CSS.",
            order_index=0,
        ),
        QuizQuestion(
            quiz_id=QUIZ_2_ID,
            question="CSS property nào dùng để thay đổi màu chữ?",
            options=["font-color", "text-color", "color", "foreground-color"],
            correct_answer=2,
            explanation="Property 'color' dùng để thay đổi màu chữ trong CSS.",
            order_index=1,
        ),
        QuizQuestion(
            quiz_id=QUIZ_2_ID,
            question="Display: flex thuộc module CSS nào?",
            options=["CSS Grid", "CSS Flexbox", "CSS Float", "CSS Position"],
            correct_answer=1,
            explanation="display: flex kích hoạt CSS Flexbox layout cho container.",
            order_index=2,
        ),
    ]
    db.add_all(questions)
    db.flush()
    print(f"  ✅ Seeded {len(quizzes)} quizzes with {len(questions)} questions")


def seed_quiz_attempts(db):
    """Seed sample quiz attempts."""
    attempts = [
        QuizAttempt(
            quiz_id=QUIZ_1_ID,
            user_id=USER_1_ID,
            score=66.7,
            answers={"0": 2, "1": 1, "2": 0},  # 2 correct, 1 wrong
            time_taken_seconds=120,
            completed_at=datetime.utcnow() - timedelta(days=2),
        ),
        QuizAttempt(
            quiz_id=QUIZ_1_ID,
            user_id=USER_1_ID,
            score=100.0,
            answers={"0": 2, "1": 1, "2": 2},  # all correct
            time_taken_seconds=90,
            completed_at=datetime.utcnow() - timedelta(days=1),
        ),
        QuizAttempt(
            quiz_id=QUIZ_2_ID,
            user_id=USER_2_ID,
            score=33.3,
            answers={"0": 0, "1": 2, "2": 0},  # 1 correct
            time_taken_seconds=180,
            completed_at=datetime.utcnow() - timedelta(hours=5),
        ),
    ]
    db.add_all(attempts)
    db.flush()
    print(f"  ✅ Seeded {len(attempts)} quiz attempts")


def seed_study_logs(db):
    """Seed sample study logs for the past week."""
    today = date.today()
    logs = [
        # User 1 study logs
        StudyLog(
            user_id=USER_1_ID,
            date=today - timedelta(days=6),
            hours_studied=2.5,
            topics=["Python basics", "Variables"],
            notes="Học xong chương 1-3 của tutorial",
        ),
        StudyLog(
            user_id=USER_1_ID,
            date=today - timedelta(days=5),
            hours_studied=3.0,
            topics=["Functions", "Decorators"],
            notes="Thực hành viết decorators",
        ),
        StudyLog(
            user_id=USER_1_ID,
            date=today - timedelta(days=4),
            hours_studied=1.5,
            topics=["OOP", "Classes"],
            notes=None,
        ),
        StudyLog(
            user_id=USER_1_ID,
            date=today - timedelta(days=2),
            hours_studied=4.0,
            topics=["Data Structures", "Algorithms"],
            notes="Giải 5 bài trên LeetCode",
        ),
        StudyLog(
            user_id=USER_1_ID,
            date=today - timedelta(days=1),
            hours_studied=2.0,
            topics=["Machine Learning", "NumPy"],
            notes="Bắt đầu học NumPy basics",
        ),
        # User 2 study logs
        StudyLog(
            user_id=USER_2_ID,
            date=today - timedelta(days=3),
            hours_studied=2.0,
            topics=["HTML", "CSS Flexbox"],
            notes="Làm xong layout portfolio",
        ),
        StudyLog(
            user_id=USER_2_ID,
            date=today - timedelta(days=1),
            hours_studied=3.5,
            topics=["JavaScript", "React hooks"],
            notes="Học useState, useEffect, useRef",
        ),
    ]
    db.add_all(logs)
    db.flush()
    print(f"  ✅ Seeded {len(logs)} study logs")


def run_seed():
    """Run all seed functions."""
    reset_flag = "--reset" in sys.argv

    if reset_flag:
        # Import all models first so metadata knows about them
        reset_database()

    db = SessionLocal()
    try:
        # Check if data already exists
        existing_users = db.query(User).count()
        if existing_users > 0 and not reset_flag:
            print("⚠️  Database already has data. Use --reset to drop and re-seed.")
            print(f"   Found {existing_users} user(s).")
            sys.exit(1)

        print("\n🌱 Seeding database...\n")

        seed_users(db)
        seed_roadmaps(db)
        seed_documents(db)
        seed_chat_sessions(db)
        seed_quizzes(db)
        seed_quiz_attempts(db)
        seed_study_logs(db)

        db.commit()
        print("\n✅ Database seeded successfully!\n")
        print("📋 Test accounts:")
        print("   ┌────────────────────────────────┬──────────────┐")
        print("   │ Email                          │ Password     │")
        print("   ├────────────────────────────────┼──────────────┤")
        print("   │ admin@studyplanner.com         │ admin123     │")
        print("   │ student@studyplanner.com       │ student123   │")
        print("   │ test@studyplanner.com          │ test123      │")
        print("   └────────────────────────────────┴──────────────┘")

    except Exception as e:
        db.rollback()
        print(f"\n❌ Seed failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    run_seed()
