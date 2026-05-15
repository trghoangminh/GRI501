import React, { useState, useEffect, useRef } from 'react';
import { Plus, MessageSquare, Sparkles, Send, Trash2, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { cn } from '../utils/cn';
import apiClient from '../api/client';
import toast from 'react-hot-toast';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  has_rag_context?: boolean;
}

interface Session {
  id: string;
  title: string;
  updated_at: string;
}

export const ChatbotScreen: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Xin chào! Tôi là trợ lý học tập AI của bạn. Tôi có quyền truy cập vào các tài liệu bạn đã tải lên. Hôm nay bạn muốn học về gì?' }
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiClient.get('/api/chat/sessions').then((res) => setSessions(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const createNewSession = async () => {
    try {
      const res = await apiClient.post('/api/chat/sessions', { title: 'Đoạn chat mới' });
      const newSession = res.data;
      setSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(newSession.id);
      setMessages([{ role: 'assistant', content: 'Đã bắt đầu phiên mới! Hãy hỏi tôi bất cứ điều gì về tài liệu của bạn.' }]);
    } catch {
      toast.error('Tạo phiên chat mới thất bại.');
    }
  };

  const loadSession = async (sessionId: string) => {
    setActiveSessionId(sessionId);
    try {
      const res = await apiClient.get(`/api/chat/sessions/${sessionId}/messages`);
      const dbMessages: Message[] = res.data.map((m: any) => ({ role: m.role, content: m.content, has_rag_context: m.has_rag_context }));
      setMessages(dbMessages.length > 0 ? dbMessages : [{ role: 'assistant', content: 'Hãy tiếp tục cuộc trò chuyện hoặc đặt một câu hỏi mới.' }]);
    } catch {
      toast.error('Tải nội dung chat thất bại.');
    }
  };

  const deleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiClient.delete(`/api/chat/sessions/${sessionId}`);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
        setMessages([{ role: 'assistant', content: 'Đã xoá phiên chat. Vui lòng tạo một phiên chat mới hoặc chọn phiên khác.' }]);
      }
    } catch {
      toast.error('Xoá phiên chat thất bại.');
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isStreaming) return;

    // Ensure there is an active session
    let sessionId = activeSessionId;
    if (!sessionId) {
      try {
        const res = await apiClient.post('/api/chat/sessions', { title: input.slice(0, 30) });
        sessionId = res.data.id;
        setActiveSessionId(sessionId);
        setSessions((prev) => [res.data, ...prev]);
      } catch {
        toast.error('Tạo phiên chat thất bại. Backend có đang chạy không?');
        return;
      }
    }

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsStreaming(true);

    // Add streaming placeholder
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:8000/api/chat/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ content: userMessage }),
      });

      if (!response.ok) throw new Error('Stream request failed');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let hasRag = false;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const text = decoder.decode(value, { stream: true });
          const lines = text.split('\n').filter((l) => l.startsWith('data: '));
          for (const line of lines) {
            try {
              const json = JSON.parse(line.slice(6));
              if (json.done) {
                hasRag = json.has_rag;
                break;
              }
              if (json.chunk) {
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: 'assistant',
                    content: updated[updated.length - 1].content + json.chunk,
                  };
                  return updated;
                });
              }
            } catch { /* ignore parse errors */ }
          }
        }
        // Mark the last message with RAG info
        if (hasRag) {
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1].has_rag_context = true;
            return updated;
          });
        }
      }
    } catch {
      toast.error('Không nhận được phản hồi. Backend có đang chạy không?');
      setMessages((prev) => prev.slice(0, -1)); // remove empty streaming placeholder
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="absolute inset-4 md:inset-8 flex bg-background/50 backdrop-blur-xl border border-border rounded-2xl overflow-hidden animate-fade-in shadow-2xl">
      {/* Sidebar */}
      <div className="hidden md:flex w-64 bg-surface border-r border-border flex-col">
        <div className="p-4 border-b border-border">
          <Button className="w-full justify-start shadow-none" onClick={createNewSession}>
            <Plus className="w-4 h-4"/> Chat Mới
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2 ml-2 mt-2">Gần đây</div>
          {sessions.length === 0 ? (
            <p className="text-xs text-gray-500 px-3">Chưa có phiên chat nào.</p>
          ) : sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => loadSession(s.id)}
              className={cn(
                "w-full text-left p-3 rounded-xl text-sm truncate flex items-center gap-3 transition-colors group",
                activeSessionId === s.id ? "bg-primary/10 text-primary" : "text-gray-300 hover:bg-surfaceHover"
              )}
            >
              <MessageSquare className="w-4 h-4 text-gray-500 shrink-0"/>
              <span className="flex-1 truncate">{s.title}</span>
              <Trash2
                className="w-3.5 h-3.5 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 shrink-0 transition-all"
                onClick={(e) => deleteSession(s.id, e)}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative bg-transparent">
        <div className="p-4 border-b border-border bg-surface backdrop-blur-md flex items-center justify-between sticky top-0 z-10">
          <h2 className="text-lg font-semibold text-white">
            {activeSessionId ? sessions.find(s => s.id === activeSessionId)?.title || 'Chat' : 'Chat cùng AI'}
          </h2>
          <span className="text-xs bg-primary/10 border border-primary/20 text-primary px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
            <Sparkles className="w-3 h-3"/> Đã bật RAG
          </span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {messages.map((msg, i) => (
            <div key={i} className={cn("flex gap-4 max-w-3xl mx-auto", msg.role === 'user' ? "justify-end" : "justify-start")}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              )}
              <div className={cn(
                "p-4 rounded-2xl text-sm leading-relaxed shadow-sm max-w-[80%]",
                msg.role === 'user' ? "bg-primary text-white rounded-br-none" : "bg-surface border border-border rounded-tl-none text-gray-100"
              )}>
                {msg.content || (isStreaming && i === messages.length - 1 ? (
                  <div className="flex items-center gap-1 h-4">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                  </div>
                ) : '')}
                {msg.has_rag_context && (
                  <div className="mt-3 flex gap-2">
                    <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold bg-background px-2 py-1 rounded-md border border-border/50">
                      📚 Dựa trên tài liệu của bạn
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={endOfMessagesRef} />
        </div>

        <div className="p-4 bg-surface backdrop-blur-md border-t border-border">
          <form onSubmit={handleSend} className="max-w-3xl mx-auto relative flex items-end bg-background border border-border rounded-xl focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all p-2 shadow-inner">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Hỏi bất kỳ điều gì về tài liệu của bạn..."
              className="flex-1 max-h-32 min-h-[40px] bg-transparent resize-none outline-none text-gray-100 py-2 px-2 text-sm"
              rows={1}
              disabled={isStreaming}
            />
            <div className="flex items-center p-1">
              <button type="submit" disabled={!input.trim() || isStreaming} className="p-2 ml-1 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md shadow-primary/20">
                {isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </form>
          <div className="text-center mt-3 text-xs text-gray-500">AI có thể mắc lỗi. Vui lòng xác minh lại các thông tin quan trọng.</div>
        </div>
      </div>
    </div>
  );
};
