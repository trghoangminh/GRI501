import React, { useState, useEffect } from 'react';
import { MessageSquare, User, Bot, Search, Calendar, ChevronRight, Loader2, RefreshCw } from 'lucide-react';
import apiClient from '../../api/client';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatSession {
  id: string;
  title: string;
  user_email: string;
  user_name: string;
  message_count: number;
  created_at: string;
  updated_at: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  created_at: string;
}

export const AdminChatLogsScreen: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const fetchSessions = async () => {
    setLoadingList(true);
    try {
      const res = await apiClient.get('/api/admin/chats');
      setSessions(res.data.data);
    } catch (error) {
      toast.error('Không thể tải lịch sử chat');
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchMessages = async (session: ChatSession) => {
    setSelectedSession(session);
    setLoadingMessages(true);
    try {
      const res = await apiClient.get(`/api/admin/chats/${session.id}`);
      setMessages(res.data.data);
    } catch (error) {
      toast.error('Không thể tải nội dung tin nhắn');
    } finally {
      setLoadingMessages(false);
    }
  };

  const filteredSessions = sessions.filter(s => 
    s.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white tracking-tight">Lịch sử Chat AI</h1>
          <p className="text-gray-500 mt-1 text-sm">Giám sát các cuộc hội thoại giữa học viên và AI</p>
        </div>
        <button 
          onClick={fetchSessions}
          disabled={loadingList}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors border border-white/10"
        >
          <RefreshCw className={`w-4 h-4 ${loadingList ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-0">
        {/* Sidebar: Session List */}
        <div className="w-full md:w-1/3 flex flex-col glass-panel rounded-2xl border border-white/5 overflow-hidden h-[400px] md:h-full">
          <div className="p-4 border-b border-white/5 bg-black/20 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="text" 
                placeholder="Tìm email, tên..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loadingList ? (
              <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : filteredSessions.length === 0 ? (
              <div className="text-center p-8 text-gray-500 text-sm">Không tìm thấy phiên chat nào.</div>
            ) : (
              filteredSessions.map(session => (
                <button
                  key={session.id}
                  onClick={() => fetchMessages(session)}
                  className={`w-full text-left p-3 rounded-xl transition-all duration-200 border ${
                    selectedSession?.id === session.id 
                      ? 'bg-primary/20 border-primary/30' 
                      : 'border-transparent hover:bg-white/[0.02] hover:border-white/5'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-sm font-semibold text-white truncate pr-2">{session.title}</span>
                    <span className="text-[10px] text-gray-500 shrink-0 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(session.updated_at).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="text-xs text-gray-400 truncate">{session.user_email}</span>
                    </div>
                    <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full text-gray-400 shrink-0">
                      {session.message_count} tin
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Main Content: Messages */}
        <div className="flex-1 flex flex-col glass-panel rounded-2xl border border-white/5 overflow-hidden h-[500px] md:h-full relative">
          {selectedSession ? (
            <>
              <div className="p-4 border-b border-white/5 bg-black/20 shrink-0 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white">{selectedSession.user_name}</h2>
                  <p className="text-xs text-gray-500">{selectedSession.user_email}</p>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-black/10">
                {loadingMessages ? (
                  <div className="flex justify-center h-full items-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-gray-500 mt-10">Chưa có tin nhắn nào trong phiên này.</div>
                ) : (
                  messages.map(msg => (
                    <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.role === 'model' && (
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0 mt-1 shadow-lg shadow-primary/20">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                      )}
                      
                      <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 ${
                        msg.role === 'user' 
                          ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-white/10 text-gray-100 rounded-tr-sm' 
                          : 'bg-white/[0.02] border border-white/5 text-gray-300 rounded-tl-sm'
                      }`}>
                        <div className="text-sm leading-relaxed font-sans prose prose-sm prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10 prose-a:text-primary text-left">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                        <div className={`text-[10px] mt-2 opacity-50 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                          {new Date(msg.created_at).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      </div>

                      {msg.role === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shrink-0 mt-1">
                          <User className="w-4 h-4 text-gray-300" />
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-black/10">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-gray-600" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Chưa chọn phiên Chat</h3>
              <p className="text-sm text-gray-500 max-w-md">
                Chọn một học viên từ danh sách bên trái để đọc lại chi tiết nội dung cuộc hội thoại với AI.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
