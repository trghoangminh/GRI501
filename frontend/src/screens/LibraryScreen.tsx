import React, { useState, useEffect, useCallback } from 'react';
import { Upload, Search, FileText, Trash2, Check, Clock, Sparkles, Loader2, X } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { cn } from '../utils/cn';
import apiClient from '../api/client';
import toast from 'react-hot-toast';

interface Doc {
  id: string;
  original_name: string;
  file_type: string;
  file_size: number;
  status: string;
  summary?: string;
  chunk_count: number;
  created_at: string;
}

export const LibraryScreen: React.FC = () => {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<Doc | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'content'>('summary');
  const [docContent, setDocContent] = useState<string | null>(null);
  const [docHtml, setDocHtml] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const fetchDocs = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (search) params.search = search;
      const res = await apiClient.get('/api/documents', { params });
      setDocs(res.data);
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  // Auto-poll if any document is processing
  useEffect(() => {
    const hasProcessing = docs.some(d => d.status === 'processing');
    if (!hasProcessing) return;

    const interval = setInterval(async () => {
      try {
        const params: any = {};
        if (search) params.search = search;
        const res = await apiClient.get('/api/documents', { params });
        setDocs(res.data);
      } catch (err) {
        // ignore errors during silent polling
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [docs, search]);

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await apiClient.post('/api/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setDocs((prev) => [res.data, ...prev]);
      toast.success(`Đã tải lên "${file.name}"! AI đang xử lý ở chế độ nền.`);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Tải lên thất bại. Hãy kiểm tra định dạng và kích thước.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleDelete = async (docId: string) => {
    try {
      await apiClient.delete(`/api/documents/${docId}`);
      setDocs((prev) => prev.filter((d) => d.id !== docId));
      if (selectedDoc?.id === docId) setSelectedDoc(null);
      toast.success('Đã xóa tài liệu.');
    } catch {
      toast.error('Xóa tài liệu thất bại.');
    }
  };

  const handleSummarize = async (doc: Doc) => {
    setIsSummarizing(true);
    try {
      const res = await apiClient.post(`/api/documents/${doc.id}/summarize`);
      setDocs((prev) => prev.map((d) => d.id === doc.id ? { ...d, summary: res.data.summary } : d));
      setSelectedDoc((prev) => prev ? { ...prev, summary: res.data.summary } : null);
      toast.success('Đã tạo xong bản tóm tắt!');
    } catch {
      toast.error('Tạo bản tóm tắt thất bại.');
    } finally {
      setIsSummarizing(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold text-white">Thư viện tài liệu</h1>
        <div className="flex w-full md:w-auto gap-2">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm tài liệu..."
              className="input-field pl-9 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.docx,.txt,.pptx" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
          <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Tải Lên
          </Button>
        </div>
      </div>

      {/* Drag & Drop Area */}
      <div
        className="border-2 border-dashed border-border rounded-2xl p-10 flex flex-col items-center justify-center text-center bg-surface/30 hover:bg-surface/50 transition-colors cursor-pointer group"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
          {isUploading ? <Loader2 className="w-8 h-8 text-primary animate-spin" /> : <Upload className="w-8 h-8 text-primary" />}
        </div>
        <h3 className="text-lg font-medium text-white mb-1">Tải lên tài liệu học tập</h3>
        <p className="text-sm text-gray-400 mb-4">Kéo & thả file PDF, DOCX, hoặc TXT vào đây, hoặc click để chọn file</p>
        <span className="text-xs text-gray-500 border border-border px-3 py-1 rounded-full">Tối đa 10MB • AI sẽ tự động xử lý để chat</span>
      </div>

      {/* Documents Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : docs.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Không tìm thấy tài liệu. Hãy tải lên tài liệu học tập đầu tiên của bạn!</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {docs.map((doc) => (
            <div
              key={doc.id}
              className="glass-card p-4 hover:border-primary/50 transition-colors group relative flex flex-col h-48 cursor-pointer"
              onClick={() => {
                setSelectedDoc(doc);
                setActiveTab('summary');
                setDocContent(null);
                setDocHtml(null);
                if (pdfUrl) {
                  URL.revokeObjectURL(pdfUrl);
                  setPdfUrl(null);
                }
              }}
            >
              <div className="flex justify-between items-start mb-3">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  doc.file_type === 'pdf' ? "bg-red-500/10 text-red-500" :
                  doc.file_type === 'pptx' ? "bg-yellow-500/10 text-yellow-500" : "bg-blue-500/10 text-blue-500"
                )}>
                  <FileText className="w-5 h-5" />
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }}
                  className="text-gray-600 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <h4 className="text-sm font-medium text-white mb-1 truncate" title={doc.original_name}>{doc.original_name}</h4>
              <p className="text-xs text-gray-500 mb-auto">{new Date(doc.created_at).toLocaleDateString('vi-VN')} • {formatSize(doc.file_size)}</p>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                <span className={cn(
                  "text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded flex items-center gap-1",
                  doc.status === 'ready' ? "bg-green-500/10 text-green-400" : doc.status === 'failed' ? "bg-red-500/10 text-red-400" : "bg-accent/10 text-accent animate-pulse"
                )}>
                  {doc.status === 'ready' ? <Check className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                  {doc.status === 'ready' ? 'Sẵn sàng' : doc.status === 'failed' ? 'Lỗi' : 'Đang xử lý'}
                </span>
                <span className="text-xs text-gray-500">{doc.chunk_count} phần</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Document Detail Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => {
          setSelectedDoc(null);
          if (pdfUrl) URL.revokeObjectURL(pdfUrl);
          setPdfUrl(null);
        }}>
          <div className="glass-card p-6 max-w-4xl w-full h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4 flex-shrink-0">
              <h3 className="text-lg font-bold text-white truncate mr-4">{selectedDoc.original_name}</h3>
              <button onClick={() => {
                setSelectedDoc(null);
                if (pdfUrl) URL.revokeObjectURL(pdfUrl);
                setPdfUrl(null);
              }}><X className="w-5 h-5 text-gray-400 hover:text-white" /></button>
            </div>
            
            <div className="flex gap-4 border-b border-border mb-4 flex-shrink-0">
              <button 
                className={cn("pb-2 text-sm font-medium transition-colors border-b-2", activeTab === 'summary' ? "text-primary border-primary" : "text-gray-400 border-transparent hover:text-gray-300")}
                onClick={() => setActiveTab('summary')}
              >
                Tóm tắt AI
              </button>
              <button 
                className={cn("pb-2 text-sm font-medium transition-colors border-b-2", activeTab === 'content' ? "text-primary border-primary" : "text-gray-400 border-transparent hover:text-gray-300")}
                onClick={async () => {
                  setActiveTab('content');
                  if (selectedDoc.file_type !== 'pdf' && !docContent && !docHtml) {
                    setIsLoadingContent(true);
                    try {
                      const res = await apiClient.get(`/api/documents/${selectedDoc.id}/content`);
                      setDocContent(res.data.text);
                      setDocHtml(res.data.html || null);
                    } catch {
                      setDocContent("Lỗi: Không thể tải nội dung.");
                      setDocHtml(null);
                    } finally {
                      setIsLoadingContent(false);
                    }
                  } else if (selectedDoc.file_type === 'pdf' && !pdfUrl) {
                    setIsLoadingContent(true);
                    try {
                      const res = await apiClient.get(`/api/documents/${selectedDoc.id}/download`, { responseType: 'blob' });
                      const url = URL.createObjectURL(res.data);
                      setPdfUrl(url);
                    } catch {
                      toast.error("Không thể tải PDF");
                    } finally {
                      setIsLoadingContent(false);
                    }
                  }
                }}
              >
                Nội dung chi tiết
              </button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
              {activeTab === 'summary' ? (
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <Button variant="secondary" className="text-sm" onClick={() => handleSummarize(selectedDoc)} disabled={isSummarizing}>
                      {isSummarizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      {selectedDoc.summary ? 'Tóm tắt lại' : 'Tóm tắt bằng AI'}
                    </Button>
                  </div>
                  {selectedDoc.summary ? (
                    <div className="bg-background/50 rounded-xl p-4 border border-border">
                      <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{selectedDoc.summary}</p>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm italic">Tài liệu này chưa có tóm tắt. Bấm nút phía trên để AI tóm tắt cho bạn.</p>
                  )}
                </div>
              ) : (
                <div className="h-full bg-background/50 rounded-xl border border-border overflow-hidden relative">
                  {isLoadingContent ? (
                    <div className="flex justify-center items-center h-full"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                  ) : selectedDoc.file_type === 'pdf' ? (
                    pdfUrl && (
                      <iframe 
                        src={pdfUrl} 
                        className="w-full h-full border-none"
                        title="PDF Viewer"
                      />
                    )
                  ) : (
                    <div className="p-6 h-full overflow-y-auto">
                      {docHtml ? (
                        <div 
                          className="prose prose-invert prose-sm sm:prose-base max-w-none 
                            prose-headings:text-white prose-p:text-gray-300 prose-a:text-primary 
                            prose-li:text-gray-300 bg-surface/20 p-6 rounded-xl border border-white/5"
                          dangerouslySetInnerHTML={{ __html: docHtml }} 
                        />
                      ) : (
                        <pre className="text-sm text-gray-300 whitespace-pre-wrap font-sans leading-relaxed">{docContent}</pre>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
