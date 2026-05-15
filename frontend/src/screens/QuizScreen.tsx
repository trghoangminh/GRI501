import React, { useState, useEffect } from 'react';
import { CheckSquare, Clock, Sparkles, Loader2, Trophy } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { cn } from '../utils/cn';
import apiClient from '../api/client';
import toast from 'react-hot-toast';

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
  const [topic, setTopic] = useState('');
  const [numQuestions, setNumQuestions] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [startTime, setStartTime] = useState(0);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return toast.error('Please enter a topic');
    setIsGenerating(true);
    try {
      const res = await apiClient.post('/api/quiz/generate', { topic, num_questions: numQuestions });
      setQuiz(res.data);
      setAnswers({});
      setCurrentQ(0);
      setStartTime(Date.now());
      setStep('taking');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to generate quiz. Is the Gemini API key set?');
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
      toast.error('Failed to submit quiz. Please try again.');
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
          <h2 className="text-2xl font-bold text-white mb-2">AI Knowledge Check</h2>
          <p className="text-gray-400 text-sm mb-6">Generate a quiz on any topic using AI.</p>

          <div className="space-y-4 text-left mb-6">
            <div>
              <label className="text-xs text-gray-500 font-medium">Topic</label>
              <input
                className="input-field mt-1"
                placeholder="e.g., React Hooks, Machine Learning, Python..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Number of Questions</label>
              <select className="input-field mt-1" value={numQuestions} onChange={(e) => setNumQuestions(Number(e.target.value))}>
                <option value={5}>5 Questions (Quick)</option>
                <option value={10}>10 Questions (Standard)</option>
                <option value={20}>20 Questions (Deep Dive)</option>
              </select>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isGenerating}>
            {isGenerating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating with AI...</> : <><Sparkles className="w-4 h-4" /> Generate & Start Quiz</>}
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
          <span className="text-sm font-medium text-gray-400">Question {currentQ + 1} of {total}</span>
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
          <Button variant="secondary" onClick={() => setCurrentQ(Math.max(0, currentQ - 1))} disabled={currentQ === 0}>Previous</Button>
          {currentQ < total - 1 ? (
            <Button onClick={() => setCurrentQ(currentQ + 1)}>Next Question</Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!allAnswered || isSubmitting}>
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Quiz'}
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (step === 'results' && result && quiz) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] animate-slide-up pb-20 md:pb-0">
        <div className="glass-card p-8 max-w-lg w-full text-center relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-green-400 to-primary"></div>
          <div className="w-24 h-24 rounded-full bg-surface border-[8px] border-green-500/20 flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl font-bold text-white">{Math.round(result.score)}%</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Quiz Completed!</h2>
          <p className="text-gray-400 text-sm mb-6">
            You scored {result.correct_answers} out of {quiz.total_questions} correctly.
          </p>
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-surface p-4 rounded-xl text-center">
              <div className="text-green-400 text-xl font-bold mb-1">{result.correct_answers}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">Correct</div>
            </div>
            <div className="bg-surface p-4 rounded-xl text-center">
              <div className="text-red-400 text-xl font-bold mb-1">{quiz.total_questions - result.correct_answers}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">Incorrect</div>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <Button variant="secondary" className="w-full" onClick={() => setStep('setup')}>Take Another Quiz</Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
