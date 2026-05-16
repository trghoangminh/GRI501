import json
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.chat import ChatSession, ChatMessage
from app.core.llm import get_llm
from app.services.rag_service import search_context
from fastapi import HTTPException
from fastapi.responses import StreamingResponse

SYSTEM_PROMPT = """Bạn là một trợ lý học tập AI thông minh và thân thiện. 
QUY TẮC QUAN TRỌNG:
1. LUÔN LUÔN trả lời bằng Tiếng Việt, trừ khi người dùng yêu cầu ngôn ngữ khác.
2. Nếu có 'Context' (Ngữ cảnh từ tài liệu của người dùng), hãy ưu tiên sử dụng thông tin trong đó để trả lời.
3. Nếu 'Context' KHÔNG liên quan đến câu hỏi, hoặc không có 'Context', hãy bỏ qua nó và trả lời bằng kiến thức chung của bạn.
4. Trình bày rõ ràng, dễ hiểu, mang tính giáo dục và khích lệ."""

def stream_chat_message(db: Session, session_id: UUID, user_id: UUID, content: str):
    """Generates a streaming response, saving user and assistant messages."""
    session = db.query(ChatSession).filter(ChatSession.id == session_id, ChatSession.user_id == user_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
        
    # Save user message
    user_msg = ChatMessage(session_id=session_id, role="user", content=content)
    db.add(user_msg)
    db.commit()

    # Search RAG Context
    contexts = search_context(user_id, content, top_k=3)
    has_rag = len(contexts) > 0
    
    # Build history (limit to last 10 messages for context window)
    history = db.query(ChatMessage).filter(ChatMessage.session_id == session_id).order_by(ChatMessage.created_at.asc()).all()[-10:]
    
    messages = [("system", SYSTEM_PROMPT)]
    
    if has_rag:
        context_str = "\n\n---\n\n".join(contexts)
        rag_prompt = f"Context from student's materials:\n{context_str}\n\nUser Question: {content}"
    else:
        rag_prompt = content
        
    for msg in history[:-1]: # exclude the current user message we just saved
        messages.append(("human" if msg.role == "user" else "ai", msg.content))
        
    messages.append(("human", rag_prompt))
    
    llm = get_llm(streaming=True)
    
    async def generate():
        assistant_content = ""
        try:
            async for chunk in llm.astream(messages):
                if chunk.content:
                    chunk_text = ""
                    if isinstance(chunk.content, str):
                        chunk_text = chunk.content
                    elif isinstance(chunk.content, list):
                        chunk_text = "".join([c.get("text", "") for c in chunk.content if isinstance(c, dict) and "text" in c])
                        
                    if chunk_text:
                        assistant_content += chunk_text
                        yield f"data: {json.dumps({'chunk': chunk_text, 'done': False})}\n\n"
                    
            # Save assistant message
            assistant_msg = ChatMessage(
                session_id=session_id, 
                role="assistant", 
                content=assistant_content,
                has_rag_context=has_rag
            )
            db.add(assistant_msg)
            db.commit()
            
            yield f"data: {json.dumps({'chunk': '', 'done': True, 'has_rag': has_rag})}\n\n"
        except Exception as e:
            print(f"Streaming error: {e}")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")
