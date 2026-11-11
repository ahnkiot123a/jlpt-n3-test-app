"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import RichText from "./RichText";
import type { ExamData, ExamMeta, ScoreArea } from "@/lib/types";
import { saveHistory, scoreExam, type AreaScore } from "@/lib/scoring";

const AREA_LABEL: Record<ScoreArea, string> = {
  gengo: "言語知識（文字・語彙・文法）",
  dokkai: "読解",
  choukai: "聴解",
};

interface Progress {
  answers: Record<string, number>;
  startedAt: Record<string, number>;
  submitted: boolean;
  submittedAt?: number;
  activeSection: number;
  lockedSections: string[];
}

const emptyProgress = (): Progress => ({ answers: {}, startedAt: {}, submitted: false, activeSection: 0, lockedSections: [] });

function loadProgress(key: string): Progress {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...emptyProgress(), ...JSON.parse(raw) } : emptyProgress();
  } catch {
    return emptyProgress();
  }
}

const subscribeNoop = () => () => {};

export default function ExamRunner(props: { meta: ExamMeta; exam: ExamData }) {
  const isClient = useSyncExternalStore(subscribeNoop, () => true, () => false);
  if (!isClient) return <p className="muted">Đang tải đề…</p>;
  return <Runner {...props} />;
}

function formatTime(ms: number) {
  const sign = ms < 0 ? "-" : "";
  const total = Math.floor(Math.abs(ms) / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${sign}${m}:${String(s).padStart(2, "0")}`;
}

function renderAiInline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={index}>{part.slice(2, -2)}</strong>
    ) : (
      part
    ),
  );
}

function AiAnswer({ text }: { text: string }) {
  const lines = text.trim().split(/\r?\n/);

  return (
    <div className="ai-answer-content">
      {lines.map((line, index) => {
        const content = line.trim();
        if (!content) return <div className="ai-answer-spacer" key={index} aria-hidden="true" />;

        const bullet = content.match(/^(?:[-*•]\s+|\d+[.)]\s+)/);
        if (bullet) {
          return (
            <p className="ai-answer-item" key={index}>
              <span aria-hidden="true">•</span>
              <span>{renderAiInline(content.slice(bullet[0].length))}</span>
            </p>
          );
        }

        return <p key={index}>{renderAiInline(content)}</p>;
      })}
    </div>
  );
}

function Runner({ meta, exam }: { meta: ExamMeta; exam: ExamData }) {
  const router = useRouter();
  const storageKey = `n3-progress-${exam.id}`;
  const [progress, setProgress] = useState<Progress>(() => loadProgress(storageKey));
  const [active, setActive] = useState(() => Math.min(progress.activeSection, exam.sections.length - 1));
  const [now, setNow] = useState(() => Date.now());
  const [pendingSection, setPendingSection] = useState<number | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [aiExplanations, setAiExplanations] = useState<Record<string, string>>({});
  const [aiErrors, setAiErrors] = useState<Record<string, string>>({});
  const [openAiQuestion, setOpenAiQuestion] = useState<string | null>(null);
  const [aiLoadingQuestion, setAiLoadingQuestion] = useState<string | null>(null);
  const submittedRef = useRef(progress.submitted);
  const audioRef = useRef<HTMLAudioElement>(null);
  const aiRequestController = useRef<AbortController | null>(null);

  const section = exam.sections[active];
  const { answers, submitted } = progress;

  useEffect(() => {
    if (!openAiQuestion) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenAiQuestion(null);
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [openAiQuestion]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(progress));
  }, [storageKey, progress]);

  useEffect(() => {
    if (submitted) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [submitted]);

  const result = useMemo(() => (submitted ? scoreExam(exam, answers) : null), [submitted, exam, answers]);

  const openSection = (index: number) => {
    if (submitted) {
      setActive(index);
      setProgress((p) => ({ ...p, activeSection: index }));
      window.scrollTo({ top: 0 });
      return;
    }

    if (index <= active || index > active + 1) return;
    const target = exam.sections[index];
    const targetStartedAt = progress.startedAt[target.id];
    if (
      progress.lockedSections.includes(target.id) ||
      (targetStartedAt !== undefined && now >= targetStartedAt + target.minutes * 60_000)
    ) return;

    setPendingSection(index);
  };

  const confirmSectionChange = () => {
    if (pendingSection === null) return;
    const index = pendingSection;
    const target = exam.sections[index];
    const current = exam.sections[active];
    const changedAt = Date.now();
    const currentStartedAt = progress.startedAt[current.id];

    setPendingSection(null);
    if (
      submitted ||
      progress.lockedSections.includes(target.id) ||
      (currentStartedAt !== undefined && changedAt >= currentStartedAt + current.minutes * 60_000)
    ) {
      setNow(changedAt);
      return;
    }

    setActive(index);
    setProgress((p) => {
      if (p.submitted || p.lockedSections.includes(target.id)) return p;
      return {
        ...p,
        activeSection: index,
        lockedSections: p.lockedSections.includes(current.id)
          ? p.lockedSections
          : [...p.lockedSections, current.id],
        startedAt: p.startedAt[target.id]
          ? p.startedAt
          : { ...p.startedAt, [target.id]: changedAt },
      };
    });
    setNow(changedAt);
    window.scrollTo({ top: 0 });
  };

  const startedAt = progress.startedAt[section.id];
  const endTime = submitted ? (progress.submittedAt ?? now) : now;
  const rawRemaining = startedAt ? section.minutes * 60_000 - (endTime - startedAt) : null;
  const remaining = rawRemaining === null ? null : Math.max(0, rawRemaining);

  const finishExam = useCallback((submittedAt: number) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    const r = scoreExam(exam, answers);
    saveHistory({ examId: exam.id, label: meta.label, date: submittedAt, total: r.total, passed: r.passed, areas: r.areas });
    setNow(submittedAt);
    setProgress((p) => ({ ...p, submitted: true, submittedAt }));
    window.scrollTo({ top: 0 });
  }, [answers, exam, meta.label]);

  useEffect(() => {
    if (submitted || rawRemaining === null || startedAt === undefined) return;
    const endedAt = startedAt + section.minutes * 60_000;
    const nextIndex = active + 1;
    const timeout = window.setTimeout(() => {
      setPendingSection(null);
      if (nextIndex >= exam.sections.length) {
        finishExam(endedAt);
        return;
      }

      const next = exam.sections[nextIndex];
      setNow(endedAt);
      setActive(nextIndex);
      setProgress((p) => {
        if (p.submitted) return p;
        return {
          ...p,
          activeSection: nextIndex,
          lockedSections: p.lockedSections.includes(section.id)
            ? p.lockedSections
            : [...p.lockedSections, section.id],
          startedAt: p.startedAt[next.id]
            ? p.startedAt
            : { ...p.startedAt, [next.id]: endedAt },
        };
      });
      window.scrollTo({ top: 0 });
    }, Math.max(0, rawRemaining));
    return () => window.clearTimeout(timeout);
  }, [submitted, rawRemaining, finishExam, startedAt, section.id, section.minutes, active, exam.sections]);

  const choose = (qid: string, value: number) => {
    if (submitted || progress.lockedSections.includes(section.id) || (rawRemaining !== null && rawRemaining <= 0)) return;
    setProgress((p) => ({
      ...p,
      answers: { ...p.answers, [qid]: value },
      startedAt: p.startedAt[section.id] ? p.startedAt : { ...p.startedAt, [section.id]: Date.now() },
    }));
  };

  const totalQuestions = exam.sections.reduce(
    (n, s) => n + s.groups.reduce((m, g) => m + g.questions.length, 0),
    0,
  );
  const answeredCount = Object.keys(answers).length;

  const submit = () => {
    const missing = totalQuestions - answeredCount;
    const msg = missing > 0 ? `Còn ${missing} câu chưa làm. Nộp bài?` : "Nộp bài?";
    if (!window.confirm(msg)) return;
    finishExam(Date.now());
  };

  const explainWithAi = async (qid: string, groupIndex: number, questionNo: number) => {
    if (!submitted || aiLoadingQuestion) return;
    if (openAiQuestion === qid) {
      setOpenAiQuestion(null);
      return;
    }

    setOpenAiQuestion(qid);
    setAiErrors((current) => ({ ...current, [qid]: "" }));
    if (aiExplanations[qid]) return;

    setAiLoadingQuestion(qid);
    const controller = new AbortController();
    aiRequestController.current = controller;
    try {
      const response = await fetch("/api/ai/explanation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          examId: exam.id,
          sectionId: section.id,
          groupIndex,
          questionNo,
          userAnswer: answers[qid] ?? null,
        }),
      });
      const data = (await response.json()) as { explanation?: string; error?: string };
      if (!response.ok || !data.explanation) {
        throw new Error(data.error || "Chưa thể tạo giải thích. Vui lòng thử lại.");
      }
      setAiExplanations((current) => ({ ...current, [qid]: data.explanation! }));
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setAiErrors((current) => ({
        ...current,
        [qid]: error instanceof Error ? error.message : "Đã xảy ra lỗi khi kết nối với AI.",
      }));
    } finally {
      if (aiRequestController.current === controller) {
        aiRequestController.current = null;
        setAiLoadingQuestion(null);
      }
    }
  };

  const reset = () => {
    if (!window.confirm("Xoá toàn bộ câu trả lời và làm lại từ đầu?")) return;
    aiRequestController.current?.abort();
    aiRequestController.current = null;
    submittedRef.current = false;
    setPendingSection(null);
    setProgress(emptyProgress());
    setActive(0);
    setAiExplanations({});
    setAiErrors({});
    setOpenAiQuestion(null);
    setAiLoadingQuestion(null);
  };

  const leaveExam = () => {
    audioRef.current?.pause();
    if (audioRef.current) audioRef.current.currentTime = 0;
    localStorage.removeItem(storageKey);
    router.push("/");
  };

  return (
    <div className="runner">
      <header className="runner-header">
        <div>
          <Link
            href="/"
            className="back"
            onClick={(event) => {
              if (submitted) return;
              event.preventDefault();
              setConfirmLeave(true);
            }}
          >
            ← Danh sách đề
          </Link>
          <h1>Luyện tập N3 — {meta.label}</h1>
        </div>
        <div className="runner-actions">
          <span className="muted">
            Đã làm {answeredCount}/{totalQuestions}
          </span>
          {!submitted && (
            <button className="btn primary" onClick={submit}>
              Nộp bài
            </button>
          )}
          <button className="btn" onClick={reset}>
            Làm lại
          </button>
        </div>
      </header>

      {pendingSection !== null && (
        <div
          className="dialog-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPendingSection(null);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") setPendingSection(null);
          }}
          tabIndex={-1}
        >
          <section
            className="section-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="section-dialog-title"
            aria-describedby="section-dialog-description"
          >
            <h2 id="section-dialog-title">Xác nhận nộp phần</h2>
            <p id="section-dialog-description">
              Bạn có chắc chắn muốn nộp phần “{section.title}” và chuyển sang phần “
              {exam.sections[pendingSection].title}” không? Sau khi xác nhận, bạn sẽ không thể quay lại chỉnh sửa phần này.
            </p>
            <div className="dialog-actions">
              <button className="btn" onClick={() => setPendingSection(null)} autoFocus>
                Ở lại
              </button>
              <button className="btn primary" onClick={confirmSectionChange}>
                Nộp và chuyển tiếp
              </button>
            </div>
          </section>
        </div>
      )}

      {confirmLeave && (
        <div
          className="dialog-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setConfirmLeave(false);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") setConfirmLeave(false);
          }}
          tabIndex={-1}
        >
          <section
            className="section-dialog leave-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="leave-dialog-title"
            aria-describedby="leave-dialog-description"
          >
            <h2 id="leave-dialog-title">Hủy phần thi?</h2>
            <p id="leave-dialog-description">
              Tiến độ của đề này sẽ bị xóa và bạn sẽ quay lại danh sách đề.
            </p>
            <div className="dialog-actions">
              <button className="btn primary" onClick={() => setConfirmLeave(false)} autoFocus>
                Ở lại làm bài
              </button>
              <button className="btn danger" onClick={leaveExam}>
                Hủy phần thi
              </button>
            </div>
          </section>
        </div>
      )}

      {result && <ResultPanel areas={result.areas} total={result.total} passed={result.passed} />}

      <nav className="tabs">
        {exam.sections.map((s, i) => {
          const startedAt = progress.startedAt[s.id];
          const expired = startedAt !== undefined && now >= startedAt + s.minutes * 60_000;
          const locked = !submitted && (
            i < active || i > active + 1 || progress.lockedSections.includes(s.id) || expired
          );
          return (
          <button key={s.id} className={i === active ? "tab active" : "tab"} onClick={() => openSection(i)} disabled={locked}>
            {s.title}
            <small>{s.minutes} phút</small>
          </button>
          );
        })}
      </nav>

      <div className="layout">
        <main className="questions">
          {/* Kept mounted across tabs so buffering starts early and playback position survives tab switches. */}
          {meta.audio && exam.sections.some((s) => s.audio) && (
            <div className="audio-bar" hidden={!section.audio}>
              <audio ref={audioRef} controls preload="auto" src={`/api/files/${exam.id}/audio`} />
            </div>
          )}

          {section.groups.map((g, gi) => (
            <section key={gi} className="group">
              <h2>{g.title}</h2>
              {g.instruction && (
                <p className="instruction">
                  <RichText text={g.instruction} />
                </p>
              )}
              {g.passage && (
                <div className="passage">
                  <RichText text={g.passage} />
                </div>
              )}
              {g.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="figure" src={g.image} alt={g.title} />
              )}
              {g.questions.map((q) => {
                const qid = `${section.id}-${gi}-${q.no}`;
                const picked = answers[qid];
                const audioOnly = q.options.every((o) => o === "");
                return (
                  <div key={qid} id={qid} className="question">
                <div className="question-heading">
                  <div className="q-head">
                    <span className="q-no">{section.audio ? `${q.no}ばん` : q.no}</span>
                    {q.prompt && (
                      <span className="q-prompt">
                        <RichText text={q.prompt} />
                      </span>
                    )}
                  </div>
                  <button
                    className="ai-explain-button"
                    type="button"
                    onClick={() => explainWithAi(qid, gi, q.no)}
                    disabled={!submitted || aiLoadingQuestion !== null}
                    aria-expanded={openAiQuestion === qid}
                    aria-controls={`${qid}-ai-explanation`}
                    title={submitted ? "Giải thích câu này bằng AI" : "Nộp bài để dùng gia sư AI"}
                  >
                    <span aria-hidden="true">✦</span>
                    {aiLoadingQuestion === qid ? "Đang giải thích…" : "Hỏi gia sư AI"}
                  </button>
                </div>
                {q.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                      <img className="figure q-figure" src={q.image} alt={`${q.no}`} />
                    )}
                    <div className={audioOnly ? "options inline" : "options"}>
                      {q.options.map((opt, oi) => {
                        const value = oi + 1;
                        let cls = "option";
                        if (picked === value) cls += " picked";
                        if (submitted && value === q.answer) cls += " correct";
                        else if (submitted && picked === value) cls += " wrong";
                        return (
                          <button
                            key={oi}
                            className={cls}
                            onClick={() => choose(qid, value)}
                            disabled={submitted || progress.lockedSections.includes(section.id) || (rawRemaining !== null && rawRemaining <= 0)}
                          >
                            <span className="bubble">{value}</span>
                            {opt && (
                              <span>
                                <RichText text={opt} />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {openAiQuestion === qid && (
                      <div
                        className="ai-dialog-backdrop"
                        onMouseDown={(event) => {
                          if (event.target === event.currentTarget) setOpenAiQuestion(null);
                        }}
                      >
                        <section
                          className="ai-dialog"
                          id={`${qid}-ai-explanation`}
                          role="dialog"
                          aria-modal="true"
                          aria-labelledby={`${qid}-ai-title`}
                          aria-describedby={`${qid}-ai-description`}
                          aria-busy={aiLoadingQuestion === qid}
                        >
                          <header className="ai-dialog-header">
                            <div>
                              <p className="ai-dialog-kicker">GIA SƯ AI</p>
                              <h2 id={`${qid}-ai-title`}>Giải thích câu {q.no}</h2>
                              <p className="ai-dialog-subtitle">{section.title}</p>
                            </div>
                            <button
                              className="ai-dialog-close"
                              type="button"
                              onClick={() => setOpenAiQuestion(null)}
                              aria-label="Đóng phần giải thích"
                              autoFocus
                            >
                              ×
                            </button>
                          </header>
                          <div className="ai-dialog-body" id={`${qid}-ai-description`} aria-live="polite">
                            <section className="ai-source-question" aria-label="Câu hỏi gốc">
                              <div className="ai-source-heading">
                                <span>CÂU HỎI GỐC</span>
                                <span>{g.title} · Câu {q.no}</span>
                              </div>
                              {g.instruction && <p className="ai-source-instruction">{g.instruction}</p>}
                              {g.passage && (
                                <details className="ai-source-context">
                                  <summary>Xem ngữ cảnh / bài đọc</summary>
                                  <div className="ai-source-passage">
                                    <RichText text={g.passage} />
                                  </div>
                                </details>
                              )}
                              {q.prompt ? (
                                <p className="ai-source-prompt">
                                  <RichText text={q.prompt} />
                                </p>
                              ) : (
                                <p className="ai-source-prompt muted">
                                  {audioOnly
                                    ? "Câu hỏi và các lựa chọn được trình bày trong audio."
                                    : "Câu hỏi dựa trên nội dung nghe."}
                                </p>
                              )}
                              {q.image && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img className="ai-source-image" src={q.image} alt={`Hình minh họa câu ${q.no}`} />
                              )}
                              {!audioOnly && (
                                <ol className="ai-source-options">
                                  {q.options.map((option, index) => {
                                    const value = index + 1;
                                    const isCorrect = value === q.answer;
                                    const isPicked = value === picked;
                                    return (
                                      <li
                                        key={index}
                                        className={isCorrect ? "ai-source-option is-correct" : isPicked ? "ai-source-option is-wrong" : "ai-source-option"}
                                      >
                                        <span className="ai-source-option-number">{value}</span>
                                        <span className="ai-source-option-text"><RichText text={option} /></span>
                                        {isCorrect && <span className="ai-source-badge correct-badge">Đáp án đúng</span>}
                                        {isPicked && <span className={`ai-source-badge ${isCorrect ? "picked-badge" : "wrong-badge"}`}>Bạn chọn</span>}
                                      </li>
                                    );
                                  })}
                                </ol>
                              )}
                              {audioOnly && (
                                <p className="ai-source-audio-note">
                                  Đáp án đúng: {q.answer} · Bạn chọn: {picked ?? "Chưa chọn"}
                                </p>
                              )}
                            </section>
                            {aiLoadingQuestion === qid && (
                              <p className="ai-loading" role="status">
                                <span className="ai-loading-spinner" aria-hidden="true" />
                                Gia sư AI đang phân tích câu hỏi…
                              </p>
                            )}
                            {aiErrors[qid] && <p className="ai-error">{aiErrors[qid]}</p>}
                            {aiExplanations[qid] && (
                              <section className="ai-response-section" aria-label="Giải thích của gia sư AI">
                                <h3>Gia sư giải thích</h3>
                                <AiAnswer text={aiExplanations[qid]} />
                              </section>
                            )}
                          </div>
                          {aiExplanations[qid] && (
                            <footer className="ai-dialog-footer">Provided by Gemini AI</footer>
                          )}
                        </section>
                      </div>
                    )}
                  </div>
                );
              })}
            </section>
          ))}
          {active + 1 < exam.sections.length && (
            <div className="section-next">
              <button className="btn primary" onClick={() => openSection(active + 1)}>
                {submitted ? "Xem" : "Sang"} phần {exam.sections[active + 1].audio ? "nghe" : "ngữ pháp - đọc hiểu"}
              </button>
            </div>
          )}

        </main>

        <aside className="sidebar">
          <div className={remaining === 0 ? "timer over" : "timer"}>
            {remaining === null ? `${section.minutes}:00` : formatTime(remaining)}
            <small>
              {submitted
                ? "Đã nộp bài"
                : remaining === null
                  ? "Bắt đầu khi chọn đáp án"
                  : remaining < 0
                    ? "Hết giờ"
                    : "Thời gian còn lại"}
            </small>
          </div>
          {section.groups.map((g, gi) => (
            <div key={gi} className="nav-group">
              <div className="nav-title">{g.title}</div>
              <div className="nav-grid">
                {g.questions.map((q) => {
                  const qid = `${section.id}-${gi}-${q.no}`;
                  let cls = "nav-cell";
                  if (answers[qid]) cls += " done";
                  if (submitted) cls += answers[qid] === q.answer ? " correct" : " wrong";
                  return (
                    <a key={qid} href={`#${qid}`} className={cls}>
                      {q.no}
                    </a>
                  );
                })}
              </div>
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}

function ResultPanel({ areas, total, passed }: { areas: AreaScore[]; total: number; passed: boolean }) {
  return (
    <div className={passed ? "result pass" : "result fail"}>
      <div className="result-total">
        <strong>{total}</strong>/180 <span>{passed ? "ĐỖ" : "TRƯỢT"}</span>
      </div>
      <div className="result-areas">
        {areas.map((a) => (
          <div key={a.area}>
            <div className="muted">{AREA_LABEL[a.area]}</div>
            <div>
              <strong>{a.scaled}</strong>/60 · đúng {a.correct}/{a.total}
            </div>
          </div>
        ))}
      </div>
      <p className="muted small">
        Điểm quy đổi ước tính theo tỉ lệ câu đúng. Điều kiện đỗ: tổng ≥ 95 và mỗi phần ≥ 19. Đáp án đúng được tô xanh,
        câu sai tô đỏ. Chọn các tab bên dưới để xem đáp án từng phần.
      </p>
    </div>
  );
}
