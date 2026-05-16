import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Trash2, Save, FileText, Search, Loader2 } from 'lucide-react';
import apiClient from '../api/client';
import toast from 'react-hot-toast';

interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export const NotesScreen: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // States for active note editing
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const res = await apiClient.get('/api/notes/');
      setNotes(res.data);
      if (res.data.length > 0 && !activeNote) {
        handleSelectNote(res.data[0]);
      }
    } catch (error) {
      toast.error('Không thể tải Sổ tay');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectNote = (note: Note) => {
    setActiveNote(note);
    setEditTitle(note.title);
    setEditContent(note.content);
  };

  const createNote = async () => {
    try {
      const res = await apiClient.post('/api/notes/', {
        title: 'Ghi chú mới',
        content: ''
      });
      setNotes([res.data, ...notes]);
      handleSelectNote(res.data);
    } catch (error) {
      toast.error('Không tạo được ghi chú');
    }
  };

  const saveNote = async () => {
    if (!activeNote) return;
    setIsSaving(true);
    try {
      const res = await apiClient.put(`/api/notes/${activeNote.id}`, {
        title: editTitle,
        content: editContent
      });
      
      setNotes(notes.map(n => n.id === activeNote.id ? res.data : n));
      setActiveNote(res.data);
      toast.success('Đã lưu');
    } catch (error) {
      toast.error('Lưu thất bại');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteNote = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Bạn có chắc muốn xóa ghi chú này?')) return;
    
    try {
      await apiClient.delete(`/api/notes/${id}`);
      setNotes(notes.filter(n => n.id !== id));
      if (activeNote?.id === id) {
        setActiveNote(null);
        setEditTitle('');
        setEditContent('');
      }
      toast.success('Đã xóa ghi chú');
    } catch (error) {
      toast.error('Xóa thất bại');
    }
  };

  const filteredNotes = notes.filter(n => n.title.toLowerCase().includes(searchTerm.toLowerCase()));

  // Auto save hook (simple debounce can be added here)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeNote && (editTitle !== activeNote.title || editContent !== activeNote.content)) {
        saveNote();
      }
    }, 2000); // Auto save after 2s of inactivity
    return () => clearTimeout(timer);
  }, [editTitle, editContent]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white tracking-tight flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-primary" /> Sổ tay Ghi chú
          </h1>
          <p className="text-gray-500 mt-1 text-sm">Ghi chép và tổng hợp kiến thức thông minh</p>
        </div>
        <button 
          onClick={createNote}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 font-medium"
        >
          <Plus className="w-4 h-4" />
          Ghi chú mới
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-0">
        {/* Sidebar: Notes List */}
        <div className="w-full md:w-1/3 lg:w-1/4 flex flex-col glass-panel rounded-2xl border border-white/5 overflow-hidden h-[300px] md:h-full">
          <div className="p-4 border-b border-white/5 bg-black/20 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="text" 
                placeholder="Tìm ghi chú..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loading ? (
              <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : filteredNotes.length === 0 ? (
              <div className="text-center p-8 text-gray-500 text-sm">Chưa có ghi chú nào.</div>
            ) : (
              filteredNotes.map(note => (
                <button
                  key={note.id}
                  onClick={() => handleSelectNote(note)}
                  className={`w-full text-left p-3 rounded-xl transition-all duration-200 border group flex justify-between items-start ${
                    activeNote?.id === note.id 
                      ? 'bg-primary/20 border-primary/30' 
                      : 'border-transparent hover:bg-white/[0.02] hover:border-white/5'
                  }`}
                >
                  <div className="flex flex-col overflow-hidden mr-2">
                    <span className="text-sm font-semibold text-white truncate">{note.title || 'Không có tên'}</span>
                    <span className="text-xs text-gray-500 mt-1 truncate">
                      {new Date(note.updated_at).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <div 
                    onClick={(e) => deleteNote(note.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Main Content: Editor */}
        <div className="flex-1 flex flex-col glass-panel rounded-2xl border border-white/5 overflow-hidden h-[500px] md:h-full relative bg-black/20">
          {activeNote ? (
            <div className="flex-1 flex flex-col p-6 h-full">
              <div className="flex items-center justify-between mb-4 shrink-0">
                <input 
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Tiêu đề ghi chú..."
                  className="bg-transparent text-2xl font-bold text-white border-none focus:outline-none focus:ring-0 flex-1 placeholder:text-gray-600"
                />
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  {isSaving ? <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Đang lưu...</span> : <span className="flex items-center gap-1 text-emerald-500"><Save className="w-3 h-3" /> Đã lưu</span>}
                </div>
              </div>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Bắt đầu ghi chép (Hỗ trợ Markdown)..."
                className="flex-1 bg-transparent border-none text-gray-300 resize-none focus:outline-none focus:ring-0 leading-relaxed font-sans placeholder:text-gray-600"
              />
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-gray-600" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Sổ tay trống</h3>
              <p className="text-sm text-gray-500 max-w-sm">
                Chọn một ghi chú bên trái hoặc tạo ghi chú mới để bắt đầu lưu trữ kiến thức của bạn.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
