"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
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

function Runner({ meta, exam }: { meta: ExamMeta; exam: ExamData }) {
  const router = useRouter();
  const storageKey = `n3-progress-${exam.id}`;
  const [progress, setProgress] = useState<Progress>(() => loadProgress(storageKey));
  const [active, setActive] = useState(() => Math.min(progress.activeSection, exam.sections.length - 1));
  const [now, setNow] = useState(() => Date.now());
  const [pendingSection, setPendingSection] = useState<number | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const submittedRef = useRef(progress.submitted);
  const audioRef = useRef<HTMLAudioElement>(null);

  const section = exam.sections[active];
  const { answers, submitted } = progress;

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

  const reset = () => {
    if (!window.confirm("Xoá toàn bộ câu trả lời và làm lại từ đầu?")) return;
    submittedRef.current = false;
    setPendingSection(null);
    setProgress(emptyProgress());
    setActive(0);
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
                    <div className="q-head">
                      <span className="q-no">{section.audio ? `${q.no}ばん` : q.no}</span>
                      {q.prompt && (
                        <span className="q-prompt">
                          <RichText text={q.prompt} />
                        </span>
                      )}
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
