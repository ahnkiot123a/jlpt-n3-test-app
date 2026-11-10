import type { Question } from "@/lib/types";

export const q = (no: number, prompt: string, options: string[], answer: number): Question => ({
  no,
  prompt,
  options,
  answer,
});

export const listen = (no: number, options: string[], answer: number, image?: string): Question => ({
  no,
  options,
  answer,
  image,
});

/** Listening questions whose choices are only spoken in the audio. */
export const audioOnly = (start: number, answers: number[], count: number): Question[] =>
  answers.map((answer, i) => ({ no: start + i, options: Array(count).fill(""), answer }));
