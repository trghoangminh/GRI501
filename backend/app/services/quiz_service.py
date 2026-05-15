import json
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.document import Document
from app.models.quiz import Quiz, QuizQuestion
from app.core.llm import get_llm
from fastapi import HTTPException

QUIZ_SYSTEM_PROMPT = """You are an expert quiz creator. Generate multiple choice questions.
Return ONLY valid JSON array, no markdown."""

def generate_quiz_json(topic_or_content: str, num_questions: int) -> list:
    prompt = f"""Generate {num_questions} multiple choice questions about: {topic_or_content}

Return JSON array:
[
  {{
    "question": "question text",
    "options": ["A. option1", "B. option2", "C. option3", "D. option4"],
    "correct_answer": 0,
    "explanation": "why this answer is correct"
  }}
]"""

    llm = get_llm(temperature=0.7)
    messages = [
        ("system", QUIZ_SYSTEM_PROMPT),
        ("human", prompt)
    ]
    response = llm.invoke(messages)
    
    try:
        content = response.content.strip()
        if content.startswith("```json"):
            content = content[7:-3]
        elif content.startswith("```"):
            content = content[3:-3]
        return json.loads(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to parse LLM response into JSON")

def generate_quiz(db: Session, user_id: UUID, topic: str, num_questions: int, document_id: UUID = None) -> Quiz:
    content_to_use = topic
    if document_id:
        document = db.query(Document).filter(Document.id == document_id, Document.user_id == user_id).first()
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        # For simplicity, if document_id is provided, we use the summary or rely on RAG if we had a specific document RAG flow.
        # But per spec, we just take "text" (here we use summary to avoid passing too much).
        if not document.summary:
            from app.services.document_service import generate_document_summary
            generate_document_summary(db, document)
        content_to_use = f"Document Title: {document.original_name}\nSummary: {document.summary}"
        title = f"Quiz: {document.original_name}"
    else:
        title = f"Quiz on {topic}"

    questions_data = generate_quiz_json(content_to_use, num_questions)
    
    quiz = Quiz(
        user_id=user_id,
        document_id=document_id,
        title=title,
        topic=topic,
        total_questions=len(questions_data)
    )
    db.add(quiz)
    db.flush()
    
    for i, q_data in enumerate(questions_data):
        qq = QuizQuestion(
            quiz_id=quiz.id,
            question=q_data.get("question", ""),
            options=q_data.get("options", []),
            correct_answer=q_data.get("correct_answer", 0),
            explanation=q_data.get("explanation", ""),
            order_index=i
        )
        db.add(qq)
        
    db.commit()
    db.refresh(quiz)
    return quiz
