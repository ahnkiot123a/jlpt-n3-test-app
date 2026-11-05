import type { ExamData, ExamMeta } from "./types";
import exam201607 from "@/data/2016-07";

function meta(year: number, month: 7 | 12, files: Partial<ExamMeta> = {}): ExamMeta {
  const folder = `N3 ${month}-${year}`;
  const script = year <= 2012 ? "Scrip" : "Script";
  return {
    id: `${year}-${String(month).padStart(2, "0")}`,
    label: `N3 tháng ${month}/${year}`,
    folder,
    audio: `Nghe ${folder}.mp3`,
    examPdf: `Đề ${folder}.pdf`,
    answerPdf: `Đáp án+${script} ${folder}.pdf`,
    ...files,
  };
}

export const EXAMS: ExamMeta[] = [
  meta(2010, 7),
  meta(2011, 7),
  meta(2011, 12),
  meta(2012, 7),
  meta(2012, 12),
  meta(2013, 7),
  meta(2013, 12),
  meta(2014, 7),
  meta(2014, 12, { examPdf: "N3 12-2014.pdf", answerPdf: "Đáp án+Script N3 12=2014.pdf" }),
  meta(2015, 7, { audio: undefined }),
  meta(2015, 12),
  meta(2016, 7),
  meta(2016, 12),
  meta(2017, 7),
  meta(2017, 12),
  meta(2018, 7),
  meta(2018, 12, { examPdf: "N3 12-2018.pdf" }),
  meta(2019, 7, { audio: "N3 7-2019.mp3", examPdf: undefined, answerPdf: undefined }),
];

const DATA: Record<string, ExamData> = {
  [exam201607.id]: exam201607,
};

export function getExamMeta(id: string): ExamMeta | undefined {
  return EXAMS.find((e) => e.id === id);
}

export function getExamData(id: string): ExamData | undefined {
  return DATA[id];
}
