import React, { useEffect, useState } from 'react';
import { BookOpen, CheckCircle2, Play, X, XCircle } from 'lucide-react';
import { evaluateAnswerLocal } from '../lib/evaluate.ts';
import type { QuestionDTO, SubjectName, SyllabusChapter } from '../shared/syllabus.ts';
import { MathText } from './MathText.tsx';

interface SyllabusChapterWithCount extends SyllabusChapter {
  publishedCount: number;
}

export const SyllabusView: React.FC = () => {
  const [activeSubject, setActiveSubject] = useState<SubjectName>('Physics');
  const [syllabus, setSyllabus] = useState<Record<SubjectName, SyllabusChapterWithCount[]> | null>(
    null
  );
  const [totalPublished, setTotalPublished] = useState(0);
  const [loading, setLoading] = useState(true);
  const [drill, setDrill] = useState<{
    subject: SubjectName;
    chapter: string;
    questions: QuestionDTO[];
    idx: number;
    answer: string;
    checked: boolean;
    loading: boolean;
  } | null>(null);

  useEffect(() => {
    fetch('/api/syllabus')
      .then((r) => r.json())
      .then((data) => {
        setSyllabus(data.syllabus ?? null);
        setTotalPublished(data.bankStats?.totalPublished ?? 0);
      })
      .finally(() => setLoading(false));
  }, []);

  const startChapterDrill = async (subject: SubjectName, chapter: string) => {
    setDrill({
      subject,
      chapter,
      questions: [],
      idx: 0,
      answer: '',
      checked: false,
      loading: true,
    });
    try {
      const res = await fetch(
        `/api/questions/chapter?subject=${encodeURIComponent(
          subject
        )}&chapter=${encodeURIComponent(chapter)}`
      );
      const data = await res.json();
      setDrill({
        subject,
        chapter,
        questions: data.questions ?? [],
        idx: 0,
        answer: '',
        checked: false,
        loading: false,
      });
    } catch {
      setDrill({
        subject,
        chapter,
        questions: [],
        idx: 0,
        answer: '',
        checked: false,
        loading: false,
      });
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-medium text-slate-500">
            NTA JEE Main 2027 Paper 1 Syllabus · {totalPublished} Approved Questions Live
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
            Official 55-Unit Syllabus & Chapter Drills
          </h1>
        </div>

        <div className="inline-flex items-center p-1 bg-slate-200/70 rounded-lg border border-slate-200">
          {(['Physics', 'Chemistry', 'Mathematics'] as SubjectName[]).map((subj) => (
            <button
              key={subj}
              type="button"
              onClick={() => setActiveSubject(subj)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md cursor-pointer transition-colors whitespace-nowrap ${
                activeSubject === subj
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {subj} ({syllabus?.[subj]?.length ?? (subj === 'Mathematics' ? 15 : 20)})
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-slate-600">Loading syllabus units...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {syllabus?.[activeSubject]?.map((ch) => (
            <div
              key={`${ch.subject}-${ch.unitNumber}`}
              className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>
                    Unit {String(ch.unitNumber).padStart(2, '0')} · Class {ch.ncertClass}
                  </span>
                  <span className="font-mono tabular-nums font-medium text-slate-700">
                    {ch.publishedCount} verified Qs
                  </span>
                </div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-700 shrink-0" />
                  <span>{ch.name}</span>
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {ch.topics.join(' · ')}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  disabled={ch.publishedCount === 0}
                  onClick={() => startChapterDrill(ch.subject, ch.name)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-800 disabled:text-slate-400 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Practice Chapter</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Chapter Practice Modal */}
      {drill && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="text-xs text-slate-500">{drill.subject} Chapter Drill</div>
                <h3 className="text-lg font-bold text-slate-900">{drill.chapter}</h3>
              </div>
              <button
                type="button"
                onClick={() => setDrill(null)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {drill.loading ? (
              <p className="text-sm text-slate-600">Loading chapter questions...</p>
            ) : drill.questions.length === 0 ? (
              <p className="text-sm text-slate-600">No published questions in this chapter yet.</p>
            ) : (
              (() => {
                const q = drill.questions[drill.idx];
                const ok = drill.checked ? evaluateAnswerLocal(q, drill.answer) : false;
                return (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>
                        Question {drill.idx + 1} of {drill.questions.length} · {q.difficulty} ·{' '}
                        {q.questionType}
                      </span>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          disabled={drill.idx === 0}
                          onClick={() =>
                            setDrill((prev) =>
                              prev
                                ? { ...prev, idx: prev.idx - 1, answer: '', checked: false }
                                : null
                            )
                          }
                          className="font-medium text-slate-700 disabled:opacity-40 cursor-pointer"
                        >
                          Prev
                        </button>
                        <button
                          type="button"
                          disabled={drill.idx >= drill.questions.length - 1}
                          onClick={() =>
                            setDrill((prev) =>
                              prev
                                ? { ...prev, idx: prev.idx + 1, answer: '', checked: false }
                                : null
                            )
                          }
                          className="font-semibold text-blue-700 disabled:opacity-40 cursor-pointer"
                        >
                          Next
                        </button>
                      </div>
                    </div>

                    <div className="text-base text-slate-900 leading-relaxed">
                      <MathText text={q.questionText} />
                    </div>

                    {q.diagramSvg && (
                      <div
                        className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex justify-center"
                        dangerouslySetInnerHTML={{ __html: q.diagramSvg }}
                      />
                    )}

                    {q.questionType === 'Numerical' ? (
                      <input
                        type="text"
                        value={drill.answer}
                        disabled={drill.checked}
                        onChange={(e) =>
                          setDrill((prev) =>
                            prev ? { ...prev, answer: e.target.value } : null
                          )
                        }
                        placeholder="Enter numerical answer"
                        className="w-48 px-3 py-2 border border-slate-300 rounded-lg font-mono text-sm"
                      />
                    ) : (
                      <div className="space-y-2">
                        {q.options.map((opt, idx) => {
                          const letter = ['A', 'B', 'C', 'D'][idx];
                          return (
                            <button
                              key={letter}
                              type="button"
                              disabled={drill.checked}
                              onClick={() =>
                                setDrill((prev) =>
                                  prev ? { ...prev, answer: letter } : null
                                )
                              }
                              className={`w-full text-left p-3 rounded-lg border text-sm flex items-start gap-2.5 cursor-pointer ${
                                drill.answer === letter
                                  ? 'border-blue-600 bg-blue-50'
                                  : 'border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              <span className="font-mono font-semibold">{letter}.</span>
                              <MathText text={opt} />
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {!drill.checked ? (
                      <button
                        type="button"
                        disabled={!drill.answer.trim()}
                        onClick={() =>
                          setDrill((prev) => (prev ? { ...prev, checked: true } : null))
                        }
                        className="px-4 py-2 rounded-lg bg-blue-700 text-white text-sm font-semibold disabled:opacity-40 cursor-pointer"
                      >
                        Check Answer
                      </button>
                    ) : (
                      <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2 text-sm">
                        <div className="flex items-center gap-2 font-semibold">
                          {ok ? (
                            <span className="inline-flex items-center gap-1.5 text-emerald-700">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Correct ({q.correctAnswer})</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-red-700">
                              <XCircle className="w-4 h-4" />
                              <span>Incorrect — Key: {q.correctAnswer}</span>
                            </span>
                          )}
                        </div>
                        <div className="text-slate-700">
                          <MathText text={q.solution || ''} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()
            )}
          </div>
        </div>
      )}
    </div>
  );
};
