import React, { useState, useEffect } from 'react';
import { History, Trophy, Clock, RotateCcw, ChevronRight, Loader2, Sparkles, CheckSquare, X, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { cn } from '../utils/cn';
import apiClient from '../api/client';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface QuizSummary {
  id: string;
  title: string;
  topic: string;
  total_questions: number;
  created_at: string;
  best_score?: number;
  attempt_count?: number;
}

interface Attempt {
  id: string;
  score: number;
  time_taken_seconds: number;
  completed_at: string;
}

interface AttemptDetail {
  question_text: string;
  options: Record<string, string>;
  user_answer: string | null;
  correct_answer: string;
  is_correct: boolean;
  explanation: string;
}

const ScoreBadge: React.FC<{ score: number }> = ({ score }) => (
  <span className={cn(
    "text-sm font-bold px-3 py-1 rounded-lg",
    score >= 80 ? "bg-green-500/15 text-green-400" :
    score >= 50 ? "bg-yellow-500/15 text-yellow-400" :
    "bg-red-500/15 text-red-400"
  )}>
    {Math.round(score)}%
  </span>
);

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}p ${s}s` : `${s}s`;
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export const QuizHistoryScreen: React.FC = () => {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedQuizId, setExpandedQuizId] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<Record<string, Attempt[]>>({});
  const [loadingAttempts, setLoadingAttempts] = useState<string | null>(null);

  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);
  const [selectedQuizTitle, setSelectedQuizTitle] = useState<string>('');
  const [attemptDetails, setAttemptDetails] = useState<AttemptDetail[] | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [filterDetail, setFilterDetail] = useState<'all' | 'correct' | 'wrong'>('all');

  useEffect(() => {
    apiClient.get('/api/quiz/').then(res => {
      setQuizzes(res.data);
    }).catch(() => toast.error('Không thể tải lịch sử.')).finally(() => setIsLoading(false));
  }, []);

  const toggleExpand = async (quizId: string) => {
    if (expandedQuizId === quizId) {
      setExpandedQuizId(null);
      return;
    }
    setExpandedQuizId(quizId);
    if (!attempts[quizId]) {
      setLoadingAttempts(quizId);
      try {
        const res = await apiClient.get(`/api/quiz/${quizId}/attempts`);
        setAttempts(prev => ({ ...prev, [quizId]: res.data }));
      } catch {
        toast.error('Không thể tải lần thi.');
      } finally {
        setLoadingAttempts(null);
      }
    }
  };

  const handleRetake = (quizId: string) => {
    // Navigate to quiz taking page with the existing quiz id
    navigate(`/quizzes?retake=${quizId}`);
  };

  const openAttemptDetails = async (quizId: string, attemptId: string, quizTitle: string) => {
    setSelectedQuizTitle(quizTitle);
    setSelectedAttemptId(attemptId);
    setLoadingDetails(true);
    setAttemptDetails(null);
    setFilterDetail('all');
    try {
      const res = await apiClient.get(`/api/quiz/${quizId}/attempts/${attemptId}`);
      setAttemptDetails(res.data.details);
    } catch {
      toast.error('Không thể tải chi tiết bài làm');
      setSelectedAttemptId(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-20 md:pb-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            <History className="w-6 h-6 text-primary" /> Lịch sử Trắc nghiệm
          </h1>
          <p className="text-gray-400 text-sm">{quizzes.length} bài đã tạo</p>
        </div>
        <Button onClick={() => navigate('/quizzes')}>
          <Sparkles className="w-4 h-4" /> Tạo bài mới
        </Button>
      </div>

      {/* Empty state */}
      {quizzes.length === 0 && (
        <div className="glass-card p-12 text-center">
          <CheckSquare className="w-12 h-12 text-primary/40 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Chưa có bài thi nào</h3>
          <p className="text-gray-400 mb-6">Hãy tạo bài trắc nghiệm đầu tiên của bạn!</p>
          <Button onClick={() => navigate('/quizzes')}>
            <Sparkles className="w-4 h-4" /> Tạo bài trắc nghiệm
          </Button>
        </div>
      )}

      {/* Quiz list */}
      <div className="space-y-3">
        {quizzes.map(q => (
          <div key={q.id} className="glass-card overflow-hidden transition-all duration-300">
            {/* Quiz row */}
            <div
              className="p-5 flex items-center gap-4 cursor-pointer hover:bg-surfaceHover transition-colors"
              onClick={() => toggleExpand(q.id)}
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <CheckSquare className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm truncate">{q.title}</p>
                <p className="text-gray-500 text-xs mt-0.5">{q.total_questions} câu • {formatDate(q.created_at)}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Button
                  variant="secondary"
                  className="text-xs px-3 py-1.5 h-auto"
                  onClick={(e) => { e.stopPropagation(); handleRetake(q.id); }}
                >
                  <RotateCcw className="w-3 h-3" /> Thi lại
                </Button>
                <ChevronRight className={cn("w-4 h-4 text-gray-500 transition-transform", expandedQuizId === q.id && "rotate-90")} />
              </div>
            </div>

            {/* Attempts list */}
            {expandedQuizId === q.id && (
              <div className="border-t border-border bg-background/40 px-5 py-4 space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Lịch sử các lần thi</p>
                {loadingAttempts === q.id ? (
                  <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
                ) : attempts[q.id]?.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">Chưa có lần thi nào. Bấm "Thi lại" để bắt đầu!</p>
                ) : (
                  attempts[q.id]?.map((a, idx) => (
                    <div 
                      key={a.id} 
                      className="flex items-center gap-3 p-3 bg-surface rounded-xl cursor-pointer hover:bg-surfaceHover transition-colors border border-transparent hover:border-white/5"
                      onClick={() => openAttemptDetails(q.id, a.id, q.title)}
                    >
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                        #{attempts[q.id].length - idx}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-400">{formatDate(a.completed_at)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />{formatTime(a.time_taken_seconds)}
                        </span>
                        <ScoreBadge score={a.score} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Attempt Details Modal */}
      {selectedAttemptId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border shadow-2xl rounded-2xl p-6 max-w-3xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-start justify-between mb-4 flex-shrink-0">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Chi tiết bài làm</h3>
                <p className="text-sm text-gray-400 truncate max-w-[280px] sm:max-w-md">{selectedQuizTitle}</p>
              </div>
              <button onClick={() => setSelectedAttemptId(null)}>
                <X className="w-6 h-6 text-gray-400 hover:text-white transition-colors" />
              </button>
            </div>

            {loadingDetails ? (
              <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : attemptDetails && (
              <>
                <div className="flex gap-2 p-1 bg-black/20 border border-white/5 rounded-lg mb-6 flex-shrink-0">
                  <button 
                    className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${filterDetail === 'all' ? 'bg-primary text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
                    onClick={() => setFilterDetail('all')}
                  >
                    Tất cả ({attemptDetails.length})
                  </button>
                  <button 
                    className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${filterDetail === 'correct' ? 'bg-green-500/20 text-green-400 shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
                    onClick={() => setFilterDetail('correct')}
                  >
                    Đúng ({attemptDetails.filter(d => d.is_correct).length})
                  </button>
                  <button 
                    className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${filterDetail === 'wrong' ? 'bg-red-500/20 text-red-400 shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
                    onClick={() => setFilterDetail('wrong')}
                  >
                    Sai ({attemptDetails.filter(d => !d.is_correct).length})
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
                  {attemptDetails.filter(d => filterDetail === 'all' || (filterDetail === 'correct' && d.is_correct) || (filterDetail === 'wrong' && !d.is_correct)).map((detail, i) => (
                    <div key={i} className={`p-5 rounded-xl border ${detail.is_correct ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                      <div className="flex gap-3 mb-4">
                        {detail.is_correct ? <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0 mt-0.5" /> : <XCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />}
                        <div>
                          <p className="text-white font-medium mb-3 leading-relaxed">{detail.question_text}</p>
                          <div className="space-y-2">
                            {Object.entries(detail.options).map(([key, value]) => {
                              const isSelected = detail.user_answer === key;
                              const isActualCorrect = detail.correct_answer === key;
                              let optionClass = "bg-white/5 border-white/10 text-gray-300";
                              
                              if (isActualCorrect) {
                                optionClass = "bg-green-500/20 border-green-500/40 text-green-300";
                              } else if (isSelected && !detail.is_correct) {
                                optionClass = "bg-red-500/20 border-red-500/40 text-red-300";
                              }

                              return (
                                <div key={key} className={`flex items-center gap-3 p-3 rounded-lg border ${optionClass}`}>
                                  <div className="w-6 h-6 rounded bg-black/20 flex items-center justify-center text-xs font-bold shrink-0">{key}</div>
                                  <span className="text-sm">{value}</span>
                                </div>
                              );
                            })}
                          </div>
                          
                          {detail.explanation && (
                            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                              <p className="text-xs font-bold text-blue-400 mb-1">Giải thích:</p>
                              <p className="text-sm text-blue-300/80">{detail.explanation}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
