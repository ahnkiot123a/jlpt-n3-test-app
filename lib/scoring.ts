import type { ExamData, ScoreArea } from "./types";

export interface AreaScore {
  area: ScoreArea;
  correct: number;
  total: number;
  scaled: number;
}

export interface HistoryEntry {
  examId: string;
  label: string;
  date: number;
  total: number;
  passed: boolean;
  areas: AreaScore[];
}

const AREAS: ScoreArea[] = ["gengo", "dokkai", "choukai"];
const HISTORY_KEY = "n3-history";

export function scoreExam(exam: ExamData, answers: Record<string, number>) {
  const tally = Object.fromEntries(AREAS.map((a) => [a, { correct: 0, total: 0 }])) as Record<
    ScoreArea,
    { correct: number; total: number }
  >;
  for (const s of exam.sections) {
    s.groups.forEach((g, gi) => {
      for (const q of g.questions) {
        tally[g.area].total++;
        if (answers[`${s.id}-${gi}-${q.no}`] === q.answer) tally[g.area].correct++;
      }
    });
  }
  const areas: AreaScore[] = AREAS.map((area) => {
    const { correct, total } = tally[area];
    return { area, correct, total, scaled: total ? Math.round((correct / total) * 60) : 0 };
  });
  const total = areas.reduce((n, a) => n + a.scaled, 0);
  const passed = total >= 95 && areas.every((a) => a.scaled >= 19);
  return { areas, total, passed };
}

export function loadHistory(): HistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function saveHistory(entry: HistoryEntry) {
  const list = [entry, ...loadHistory()].slice(0, 50);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
}
