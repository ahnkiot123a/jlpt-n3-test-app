export type ScoreArea = "gengo" | "dokkai" | "choukai";

export interface Question {
  no: number;
  prompt?: string;
  image?: string;
  /** Empty strings mean the choices are only spoken in the audio. */
  options: string[];
  answer: number;
}

export interface QuestionGroup {
  title: string;
  instruction?: string;
  passage?: string;
  image?: string;
  area: ScoreArea;
  questions: Question[];
}

export interface Section {
  id: string;
  title: string;
  minutes: number;
  audio?: boolean;
  groups: QuestionGroup[];
}

export interface ExamData {
  id: string;
  sections: Section[];
}

export interface ExamMeta {
  id: string;
  label: string;
  folder: string;
  audio?: string;
  examPdf?: string;
  answerPdf?: string;
}
