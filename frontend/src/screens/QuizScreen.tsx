import React, { useState, useEffect } from 'react';
import { CheckSquare, Clock, Sparkles, Loader2, History } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { cn } from '../utils/cn';
import apiClient from '../api/client';
import toast from 'react-hot-toast';
import { useSearchParams, useNavigate } from 'react-router-dom';

interface Question {
  id: string;
  question: string;
  options: string[];
  order_index: number;
}

interface QuizData {
  id: string;
  title: string;
  topic: string;
  total_questions: number;
  questions: Question[];
}

interface AttemptResult {
  score: number;
  correct_answers: number;
  explanations: Record<string, string>;
}

export const QuizScreen: React.FC = () => {
  const [step, setStep] = useState<'setup' | 'taking' | 'results'>('setup');
  const [topicSource, setTopicSource] = useState<'roadmap' | 'custom'>('roadmap');
  const [topic, setTopic] = useState('');
  const [numQuestions, setNumQuestions] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [startTime, setStartTime] = useState(0);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roadmapMilestones, setRoadmapMilestones] = useState<{id: string, title: string}[]>([]);
  const [allRoadmaps, setAllRoadmaps] = useState<{id: string, title: string, milestones: {id: string, title: string}[]}[]>([]);
  const [selectedRoadmapId, setSelectedRoadmapId] = useState<string>('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRoadmaps = async () => {
      try {
        const [activeRes, archivedRes] = await Promise.allSettled([
          apiClient.get('/api/roadmap'),
          apiClient.get('/api/roadmap/archived'),
        ]);
        const active = activeRes.status === 'fulfilled' ? [activeRes.value.data] : [];
        const archived = archivedRes.status === 'fulfilled' ? archivedRes.value.data : [];
        const combined = [...active, ...archived].filter(Boolean);
        setAllRoadmaps(combined);
        if (combined.length > 0) {
          const first = combined[0];
          setSelectedRoadmapId(first.id);
          setRoadmapMilestones(first.milestones || []);
          if (first.milestones?.length > 0) setTopic(first.milestones[0].title);
          else setTopicSource('custom');
        } else {
          setTopicSource('custom');
        }
      } catch {
        setTopicSource('custom');
      }
    };
    fetchRoadmaps();
  }, []);

  // Handle retake from history page
  useEffect(() => {
    const retakeId = searchParams.get('retake');
    if (!retakeId) return;
    apiClient.get(`/api/quiz/${retakeId}`).then(res => {
      setQuiz(res.data);
      setAnswers({});
      setCurrentQ(0);
      setStartTime(Date.now());
      setStep('taking');
    }).catch(() => toast.error('Không thể tải bài thi.'));
  }, [searchParams]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return toast.error('Vui lòng nhập chủ đề');
    setIsGenerating(true);
    try {
      const res = await apiClient.post('/api/quiz/generate', { topic, num_questions: numQuestions });
      setQuiz(res.data);
      setAnswers({});
      setCurrentQ(0);
      setStartTime(Date.now());
      setStep('taking');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Tạo bài trắc nghiệm thất bại. API key của Gemini đã được cài đặt chưa?');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async () => {
    if (!quiz) return;
    setIsSubmitting(true);
    try {
      const timeTaken = Math.round((Date.now() - startTime) / 1000);
      const res = await apiClient.post(`/api/quiz/${quiz.id}/attempt`, {
        answers,
        time_taken_seconds: timeTaken,
      });
      setResult(res.data);
      setStep('results');
    } catch {
      toast.error('Nộp bài thất bại. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 'setup') {
    return (
      <div className="flex items-center justify-center min-h-[60vh] animate-fade-in pb-20 md:pb-0">
        <form onSubmit={handleGenerate} className="glass-card p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-6 text-primary">
            <CheckSquare className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Kiểm tra Kiến thức AI</h2>
          <p className="text-gray-400 text-sm mb-3">Tạo bài trắc nghiệm về bất kỳ chủ đề nào bằng AI.</p>
          <button type="button" onClick={() => navigate('/quiz-history')} className="w-full flex items-center justify-center gap-2 text-xs text-gray-500 hover:text-gray-300 mb-4 transition-colors">
            <History className="w-3.5 h-3.5" /> Xem lịch sử các bài đã thi
          </button>

          <div className="space-y-4 text-left mb-6">
            {/* Topic Source Toggle */}
            <div className="flex gap-2 p-1 bg-surface rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setTopicSource('roadmap');
                  if (roadmapMilestones.length > 0) setTopic(roadmapMilestones[0].title);
                }}
                className={cn(
                  "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                  topicSource === 'roadmap' ? "bg-primary text-white shadow" : "text-gray-400 hover:text-gray-200"
                )}
                disabled={allRoadmaps.length === 0}
              >
                📍 Từ Lộ Trình
              </button>
              <button
                type="button"
                onClick={() => { setTopicSource('custom'); setTopic(''); }}
                className={cn(
                  "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                  topicSource === 'custom' ? "bg-primary text-white shadow" : "text-gray-400 hover:text-gray-200"
                )}
              >
                ✏️ Tự nhập
              </button>
            </div>

            {/* Topic Input */}
            <div>
              <label className="text-xs text-gray-500 font-medium">Chủ đề</label>
              {topicSource === 'roadmap' ? (
                <div className="space-y-2 mt-1">
                  {allRoadmaps.length > 1 && (
                    <select
                      className="input-field"
                      value={selectedRoadmapId}
                      onChange={(e) => {
                        const r = allRoadmaps.find(r => r.id === e.target.value);
                        setSelectedRoadmapId(e.target.value);
                        const milestones = r?.milestones || [];
                        setRoadmapMilestones(milestones);
                        if (milestones.length > 0) setTopic(milestones[0].title);
                      }}
                    >
                      {allRoadmaps.map((r, i) => (
                        <option key={r.id} value={r.id}>
                          {i === 0 ? '📌 ' : '🗂 '}{r.title}
                        </option>
                      ))}
                    </select>
                  )}
                  <select
                    className="input-field"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  >
                    {roadmapMilestones.map((m) => (
                      <option key={m.id} value={m.title}>{m.title}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <input
                  className="input-field mt-1"
                  placeholder="VD: React Hooks, Trí tuệ nhân tạo, Lịch sử..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              )}
            </div>

            <div>
              <label className="text-xs text-gray-500 font-medium">Số lượng câu hỏi</label>
              <select className="input-field mt-1" value={numQuestions} onChange={(e) => setNumQuestions(Number(e.target.value))}>
                <option value={5}>5 Câu (Nhanh)</option>
                <option value={10}>10 Câu (Tiêu chuẩn)</option>
                <option value={20}>20 Câu (Chuyên sâu)</option>
              </select>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isGenerating || !topic.trim()}>
            {isGenerating ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang tạo bằng AI...</> : <><Sparkles className="w-4 h-4" /> Tạo &amp; Bắt đầu làm bài</>}
          </Button>
        </form>
      </div>
    );
  }

  if (step === 'taking' && quiz) {
    const currentQuestion = quiz.questions[currentQ];
    const total = quiz.questions.length;
    const allAnswered = Object.keys(answers).length === total;

    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pb-20 md:pb-0 pt-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-400">Câu hỏi {currentQ + 1} / {total}</span>
          <span className="text-sm font-medium text-accent flex items-center gap-1">
            <Clock className="w-4 h-4" />{quiz.topic}
          </span>
        </div>
        <div className="h-2 w-full bg-surface rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300" style={{ width: `${((currentQ + 1) / total) * 100}%` }} />
        </div>

        <div className="glass-card p-6 md:p-10 min-h-[400px] flex flex-col">
          <h2 className="text-xl md:text-2xl font-semibold text-white mb-8 leading-relaxed">
            {currentQuestion.question}
          </h2>
          <div className="space-y-3 mt-auto">
            {currentQuestion.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => setAnswers((prev) => ({ ...prev, [currentQuestion.id]: i }))}
                className={cn(
                  "w-full text-left p-4 rounded-xl border transition-all duration-200",
                  answers[currentQuestion.id] === i
                    ? "bg-primary/20 border-primary text-white"
                    : "bg-surface border-border text-gray-300 hover:border-gray-500 hover:bg-surfaceHover"
                )}
              >
                <span className="inline-block w-6 text-gray-500 font-mono mr-2">{['A', 'B', 'C', 'D'][i]}.</span>
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-between">
          <Button variant="secondary" onClick={() => setCurrentQ(Math.max(0, currentQ - 1))} disabled={currentQ === 0}>Quay lại</Button>
          {currentQ < total - 1 ? (
            <Button onClick={() => setCurrentQ(currentQ + 1)}>Câu tiếp theo</Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!allAnswered || isSubmitting}>
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Nộp bài'}
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (step === 'results' && result && quiz) {
    const isPassed = result.score >= 70;
    return (
      <div className="flex items-center justify-center min-h-[60vh] animate-slide-up pb-20 md:pb-0">
        <div className="glass-card p-8 max-w-lg w-full text-center relative overflow-hidden">
          <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${isPassed ? 'from-green-400 to-primary' : 'from-orange-400 to-red-500'}`}></div>
          <div className={`w-24 h-24 rounded-full bg-surface border-[8px] flex items-center justify-center mx-auto mb-6 ${isPassed ? 'border-green-500/20' : 'border-orange-500/20'}`}>
            <span className={`text-3xl font-bold ${isPassed ? 'text-green-400' : 'text-orange-400'}`}>{Math.round(result.score)}%</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">{isPassed ? '🎉 Xuất sắc!' : '💪 Cố lên!'}</h2>
          <p className="text-gray-400 text-sm mb-6">
            Bạn đã trả lời đúng <span className="text-white font-semibold">{result.correct_answers}</span> trên tổng số <span className="text-white font-semibold">{quiz.total_questions}</span> câu.
          </p>
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-surface p-4 rounded-xl text-center">
              <div className="text-green-400 text-xl font-bold mb-1">{result.correct_answers}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">Đúng</div>
            </div>
            <div className="bg-surface p-4 rounded-xl text-center">
              <div className="text-red-400 text-xl font-bold mb-1">{quiz.total_questions - result.correct_answers}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">Sai</div>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <Button className="w-full" onClick={() => {
              setAnswers({});
              setCurrentQ(0);
              setStartTime(Date.now());
              setStep('taking');
            }}>
              <History className="w-4 h-4" /> Thi lại bài này
            </Button>
            <Button variant="secondary" className="w-full" onClick={() => navigate('/quizzes')}>Tạo bài mới</Button>
            <button
              onClick={() => navigate('/quiz-history')}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors mt-1 flex items-center justify-center gap-1"
            >
              <History className="w-3 h-3" /> Xem lịch sử tất cả các bài
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
