import React, { useState, useEffect } from 'react';
import { FileText, Trash2, Search, AlertTriangle, AlertCircle, CheckCircle, FileQuestion, Loader2, Download, Eye, X, Sparkles } from 'lucide-react';
import apiClient from '../../api/client';
import toast from 'react-hot-toast';

interface AdminDocument {
  id: string;
  original_name: string;
  file_type: string;
  status: string;
  chunk_count: number;
  created_at: string;
  uploader_email: string;
  uploader_name: string;
  is_missing: boolean;
  file_size_kb: number;
  summary?: string;
}

export const AdminDocumentsScreen: React.FC = () => {
  const [documents, setDocuments] = useState<AdminDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Modal State
  const [selectedDoc, setSelectedDoc] = useState<AdminDocument | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'content'>('summary');
  const [docContent, setDocContent] = useState<string | null>(null);
  const [docHtml, setDocHtml] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/api/admin/documents');
      setDocuments(res.data.data);
    } catch (error) {
      toast.error('Không thể tải danh sách tài liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleDelete = async (docId: string, docName: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa vĩnh viễn tài liệu "${docName}"?\n\nHành động này sẽ xóa file trên ổ cứng và toàn bộ dữ liệu vector của tài liệu này.`)) {
      return;
    }
    setDeletingId(docId);
    try {
      await apiClient.delete(`/api/admin/documents/${docId}`);
      toast.success('Đã xóa tài liệu thành công');
      setDocuments(prev => prev.filter(d => d.id !== docId));
    } catch (error) {
      toast.error('Có lỗi xảy ra khi xóa tài liệu');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSummarize = async (doc: AdminDocument) => {
    setIsSummarizing(true);
    try {
      const res = await apiClient.post(`/api/documents/${doc.id}/summarize`);
      setDocuments((prev) => prev.map((d) => d.id === doc.id ? { ...d, summary: res.data.summary } : d));
      setSelectedDoc((prev) => prev ? { ...prev, summary: res.data.summary } : null);
      toast.success('Đã tạo xong bản tóm tắt!');
    } catch {
      toast.error('Tạo bản tóm tắt thất bại.');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleDownload = (docId: string, docName: string) => {
    const url = `/api/admin/documents/${docId}/download`;
    const token = localStorage.getItem('token');
    
    // Create an anchor element to trigger download with auth header
    fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      if (!response.ok) throw new Error('Network response was not ok');
      return response.blob();
    })
    .then(blob => {
      const windowUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = windowUrl;
      a.download = docName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(windowUrl);
    })
    .catch(() => toast.error('Không thể tải xuống tài liệu này.'));
  };

  const filteredDocs = documents.filter(d => 
    d.original_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.uploader_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (doc: AdminDocument) => {
    if (doc.is_missing) {
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-red-500/10 text-red-400 border border-red-500/20"><AlertCircle className="w-3 h-3" /> Mất File</span>;
    }
    if (doc.file_size_kb === 0) {
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-orange-500/10 text-orange-400 border border-orange-500/20"><AlertTriangle className="w-3 h-3" /> Rỗng (0KB)</span>;
    }
    if (doc.file_size_kb < 1) {
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20"><FileQuestion className="w-3 h-3" /> Quá nhẹ</span>;
    }
    if (doc.status === 'failed') {
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-red-500/10 text-red-400 border border-red-500/20"><AlertTriangle className="w-3 h-3" /> Lỗi Vector</span>;
    }
    return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><CheckCircle className="w-3 h-3" /> Bình thường</span>;
  };

  const totalSizeMB = documents.reduce((acc, curr) => acc + (curr.file_size_kb / 1024), 0);
  const missingCount = documents.filter(d => d.is_missing).length;
  const junkCount = documents.filter(d => d.file_size_kb === 0 || d.file_size_kb < 1 || d.status === 'failed').length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white tracking-tight">Quản lý Tài liệu</h1>
          <p className="text-gray-500 mt-1 text-sm">Quản lý toàn bộ tệp tin người dùng tải lên, dọn rác và tối ưu dung lượng</p>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="glass-panel px-4 py-2 rounded-xl border border-white/5 flex flex-col items-end">
              <span className="text-xs text-gray-500">Tổng dung lượng</span>
              <span className="text-lg font-bold text-white">{totalSizeMB.toFixed(2)} MB</span>
           </div>
           <div className="glass-panel px-4 py-2 rounded-xl border border-red-500/20 flex flex-col items-end bg-red-500/5">
              <span className="text-xs text-red-400/80">Cảnh báo / Mất file</span>
              <span className="text-lg font-bold text-red-400">{missingCount + junkCount}</span>
           </div>
        </div>
      </div>

      <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-white/5 bg-black/20 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Tìm theo tên file hoặc email người tải..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-black/40 text-gray-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-medium">Tên file</th>
                <th className="px-6 py-4 font-medium">Người tải lên</th>
                <th className="px-6 py-4 font-medium">Dung lượng</th>
                <th className="px-6 py-4 font-medium">Ngày tải</th>
                <th className="px-6 py-4 font-medium">Tình trạng</th>
                <th className="px-6 py-4 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <FileText className="w-8 h-8 mx-auto mb-3 opacity-20" />
                    Không tìm thấy tài liệu nào.
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex flex-col max-w-[200px] sm:max-w-[300px]">
                          <span className="text-white font-medium truncate" title={doc.original_name}>{doc.original_name}</span>
                          <span className="text-xs text-gray-500 uppercase">{doc.file_type} • {doc.chunk_count} chunks</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-white text-sm">{doc.uploader_name}</span>
                        <span className="text-xs text-gray-500">{doc.uploader_email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-300">
                        {doc.is_missing ? '-' : doc.file_size_kb > 1024 ? `${(doc.file_size_kb / 1024).toFixed(2)} MB` : `${doc.file_size_kb.toFixed(2)} KB`}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      {new Date(doc.created_at).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(doc)}
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <button 
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
                        className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-colors border border-emerald-500/20"
                        title="Xem chi tiết"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDownload(doc.id, doc.original_name)}
                        className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition-colors border border-blue-500/20"
                        title="Tải xuống (Xem)"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(doc.id, doc.original_name)}
                        disabled={deletingId === doc.id}
                        className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-colors border border-red-500/20 disabled:opacity-50"
                        title="Xóa vĩnh viễn"
                      >
                        {deletingId === doc.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
            
            <div className="flex gap-4 border-b border-white/10 mb-4 flex-shrink-0">
              <button 
                className={`pb-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'summary' ? "text-primary border-primary" : "text-gray-400 border-transparent hover:text-gray-300"}`}
                onClick={() => setActiveTab('summary')}
              >
                Tóm tắt AI
              </button>
              <button 
                className={`pb-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'content' ? "text-primary border-primary" : "text-gray-400 border-transparent hover:text-gray-300"}`}
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
                    <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white flex items-center gap-2 transition-colors" onClick={() => handleSummarize(selectedDoc)} disabled={isSummarizing}>
                      {isSummarizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      {selectedDoc.summary ? 'Tóm tắt lại' : 'Tóm tắt bằng AI'}
                    </button>
                  </div>
                  {selectedDoc.summary ? (
                    <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                      <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{selectedDoc.summary}</p>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm italic">Tài liệu này chưa có tóm tắt. Bấm nút phía trên để AI tóm tắt cho bạn.</p>
                  )}
                </div>
              ) : (
                <div className="h-full bg-black/20 rounded-xl border border-white/5 overflow-hidden relative">
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
                            prose-li:text-gray-300 bg-white/5 p-6 rounded-xl border border-white/5"
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
