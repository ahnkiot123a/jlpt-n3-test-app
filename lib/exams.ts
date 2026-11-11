import type { ExamData, ExamMeta } from "./types";
import exam201007 from "@/data/2010-07";
import exam201107 from "@/data/2011-07";
import exam201112 from "@/data/2011-12";
import exam201207 from "@/data/2012-07";
import exam201307 from "@/data/2013-07";
import exam201312 from "@/data/2013-12";
import exam201212 from "@/data/2012-12";
import exam201412 from "@/data/2014-12";
import exam201407 from "@/data/2014-07";
import exam201507 from "@/data/2015-07";
import exam201512 from "@/data/2015-12";
import exam201607 from "@/data/2016-07";
import exam201612 from "@/data/2016-12";
import exam201707 from "@/data/2017-07";
import exam201712 from "@/data/2017-12";
import exam201807 from "@/data/2018-07";
import exam201812 from "@/data/2018-12";
import exam201907 from "@/data/2019-07";
import exam201912 from "@/data/2019-12";
import exam202607 from "@/data/2026-07";

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
  meta(2010, 7, {
    folder: "N3_ĐỀ CÁC NĂM/1. N3 7-2010",
    audio: "1. Nghe N3 7-2010.mp3",
    examPdf: "1. N3 7-2010.pdf",
    answerPdf: "1. N3 7-2010 (script).pdf",
  }),
  meta(2011, 7, {
    folder: "N3_ĐỀ CÁC NĂM/2. N3 7-2011",
    audio: "2. Nghe N3 7-2011.mp3",
    examPdf: "2. N3 Tháng 7 2011 update 260507.pdf",
    answerPdf: "2. N3 7-2011 (script).pdf",
  }),
  meta(2011, 12, {
    folder: "N3_ĐỀ CÁC NĂM/2. N3 12-2011",
    audio: "2. Nghe N3 12-2011.mp3",
    examPdf: "2. N3 12-2011.pdf",
    answerPdf: "2. N3 12-2011 (script).pdf",
  }),
  meta(2012, 7, {
    folder: "N3_ĐỀ CÁC NĂM/3. N3 7-2012",
    audio: "3. Nghe N3 7-2012.mp3",
    examPdf: "3. N3 7-2012.pdf",
    answerPdf: "3. N3 7-2012 (script).pdf",
  }),
  meta(2012, 12, {
    folder: "N3_ĐỀ CÁC NĂM/3. N3 12-2012",
    audio: "3. Nghe N3 12-2012.mp3",
    examPdf: "3. N3 12-2012.pdf",
    answerPdf: "3. N3 12-2012 (script).pdf",
  }),
  meta(2013, 7, {
    folder: "N3_ĐỀ CÁC NĂM/4. N3 7-2013",
    audio: "4. Nghe N3 7-2013.mp3",
    examPdf: "4. N3 7-2013.pdf",
    answerPdf: "4. N3 7-2013 (script).pdf",
  }),
  meta(2013, 12, {
    folder: "N3_ĐỀ CÁC NĂM/4. N3 12-2013",
    audio: "4. Nghe N3 12-2013.mp3",
    examPdf: "4. N3 12-2013.pdf",
    answerPdf: "4. N3 12-2013 (script).pdf",
  }),
  meta(2014, 7, {
    folder: "N3_ĐỀ CÁC NĂM/5. N3 7-2014",
    audio: "5. Nghe N3 7-2014.mp3",
    examPdf: "5. N3 7-2014.pdf",
    answerPdf: "5. N3 7-2014 (script).pdf",
  }),
  meta(2014, 12, {
    folder: "N3_ĐỀ CÁC NĂM/5. N3 12-2014",
    audio: "5. Nghe N3 12-2014.mp3",
    examPdf: "5. N3 12-2014.pdf",
    answerPdf: "5. N3 12-2014 (script).pdf",
  }),
  meta(2015, 7, {
    folder: "N3_ĐỀ CÁC NĂM/6. N3 7-2015",
    audio: "6. Nghe N3 7-2015.mp3",
    examPdf: "6. N3 7-2015.pdf",
    answerPdf: "6. N3 7-2015 (script).pdf",
  }),
  meta(2015, 12, {
    folder: "N3_ĐỀ CÁC NĂM/6. N3 12-2015",
    audio: "6. Nghe N3 12-2015.mp3",
    examPdf: "6. N3 12-2015.pdf",
    answerPdf: "6. N3 12-2015 (script).pdf",
  }),
  meta(2016, 7, {
    folder: "N3_ĐỀ CÁC NĂM/7. N3 7-2016",
    audio: "7. Nghe N3 7-2016.mp3",
    examPdf: "7. N3 7-2016.pdf",
    answerPdf: "7. N3 7-2016 (script).pdf",
  }),
  meta(2016, 12, {
    folder: "N3_ĐỀ CÁC NĂM/7. N3 12-2016",
    audio: "7. Nghe N3 12-2016.mp3",
    examPdf: "7. N3 12-2016.pdf",
    answerPdf: "7. N3 12-2016 (script).pdf",
  }),
  meta(2017, 7, {
    folder: "N3_ĐỀ CÁC NĂM/8. N3 7-2017",
    audio: "8. Nghe N3 7-2017.mp3",
    examPdf: "8. N3 7-2017.pdf",
    answerPdf: "8. N3 7-2017 (script).pdf",
  }),
  meta(2017, 12, {
    folder: "N3_ĐỀ CÁC NĂM/8. N3 12-2017",
    audio: "8. Nghe N3 12-2017.mp3",
    examPdf: "8. N3 12.2017.pdf",
    answerPdf: "8. N3 12-2017 (script).pdf",
  }),
  meta(2018, 7, {
    folder: "N3_ĐỀ CÁC NĂM/9. N3 7-2018",
    audio: "9. Nghe N3 7-2018.mp3",
    examPdf: "9. N3 Tháng 7 2018.pdf",
    answerPdf: "9. N3 07-2018 (script).pdf",
  }),
  meta(2018, 12, {
    folder: "N3_ĐỀ CÁC NĂM/9. N3 12-2018",
    audio: "9. Nghe N3 12-2018.mp3",
    examPdf: "9. N3 12-2018.pdf",
    answerPdf: "9. N3 12-2018 (script).pdf",
  }),
  meta(2019, 7, {
    folder: "N3_ĐỀ CÁC NĂM/10. N3 7-2019",
    audio: "10. Nghe N3 7-2019.mp3",
    examPdf: "10. N3 7-2019.pdf",
    answerPdf: "10. N3 07-2019 (script).pdf",
  }),
  meta(2019, 12, {
    folder: "N3_ĐỀ CÁC NĂM/10. N3 12-2019",
    audio: "10. Nghe N3 12-1019.mp3",
    examPdf: "10. N3 12-2019.pdf",
    answerPdf: "10. N3 12-2019 (script).pdf",
  }),
  meta(2020, 12, {
    folder: "N3_ĐỀ CÁC NĂM/11. N3 12-2020",
    examPdf: "11. N3 12-2020.pdf",
    answerPdf: "11. N3 12-2020 (script).pdf",
    audio: "11. Nghe N3 12-2020.mp3",
  }),
  meta(2021, 7, {
    folder: "N3_ĐỀ CÁC NĂM/12. N3 7-2021",
    examPdf: "12. N3 7-2021.pdf",
    answerPdf: "12. N3 07-2021 (script).pdf",
    audio: "12. Nghe N3 T7-2021.mp3",
  }),
  meta(2021, 12, {
    folder: "N3_ĐỀ CÁC NĂM/12. N3 12-2021",
    examPdf: "12. N3 12-2021.pdf",
    answerPdf: "12. N3 12-2021(script).pdf",
    audio: "12.Nghe N3 12-2021.mp3",
  }),
  meta(2022, 7, {
    folder: "N3_ĐỀ CÁC NĂM/13. N3 7-2022",
    examPdf: "13. N3 7 2022.pdf",
    answerPdf: "13. N3 7-2022 (script).pdf",
    audio: "13. N3 T7-2022.mp3",
  }),
  meta(2022, 12, {
    folder: "N3_ĐỀ CÁC NĂM/13. N3 12-2022",
    examPdf: "13. N3 12-2022 .pdf",
    answerPdf: "13.N3 12-2022 (script).pdf",
    audio: "13. Nghe N3 T12-2022.mp3",
  }),
  meta(2023, 7, {
    folder: "N3_ĐỀ CÁC NĂM/14. N3 7-2023",
    examPdf: "14. N3 tháng 7-2023.pdf",
    answerPdf: "14. N3 7-2023 (script).pdf",
    audio: "14. Nghe N3 T7-2023.mp3",
  }),
  meta(2023, 12, {
    folder: "N3_ĐỀ CÁC NĂM/14. N3 12-2023",
    examPdf: "14. N3 12.2023 .pdf",
    answerPdf: "14. N3 12.2023 (script).pdf",
    audio: "14. Nghe N3 T12-2023.mp3",
  }),
  meta(2024, 7, {
    folder: "N3_ĐỀ CÁC NĂM/15. N3 7-2024",
    examPdf: "15. N3 7.2024.pdf",
    answerPdf: "N3-7-2024(script).pdf",
    audio: "Nghe N3 T7-2024.mp3",
  }),
  meta(2024, 12, {
    folder: "N3_ĐỀ CÁC NĂM/15. N3 12-2024",
    examPdf: "15. N3 12-2024 (261015).pdf",
    answerPdf: "15. N3 12-2024 (Script).pdf",
    audio: "Nghe N3 T12-2024.mp3",
  }),
  meta(2025, 7, {
    folder: "N3_ĐỀ CÁC NĂM/16. N3 7-2025",
    examPdf: "16. N3 7-2025.pdf",
    answerPdf: "16. N3-7-2025(script).pdf",
    audio: "N3 07.2025 Choukai [New].mp3",
  }),
  meta(2025, 12, {
    folder: "N3_ĐỀ CÁC NĂM/17. N3 12-2025",
    examPdf: "17.N3 12-2025 (261102).pdf",
    answerPdf: "17.N3 12-2025 (script) _260410.pdf",
    audio: "MP3-N3 12.2025 Choukai.mp3",
  }),
  meta(2026, 7, {
    folder: "N3_ĐỀ CÁC NĂM/18. N3 7-2026",
    examPdf: "18. N3 7-2026 (261021).pdf",
    answerPdf: "Script Nghe N3 T7-2026 Mark.pdf",
    audio: "Nghe N3 T7-2026 (Yuuki Bui).mp3",
  }),
];

const DATA: Record<string, ExamData> = {
  [exam201007.id]: exam201007,
  [exam201107.id]: exam201107,
  [exam201112.id]: exam201112,
  [exam201207.id]: exam201207,
  [exam201212.id]: exam201212,
  [exam201307.id]: exam201307,
  [exam201312.id]: exam201312,
  [exam201412.id]: exam201412,
  [exam201407.id]: exam201407,
  [exam201507.id]: exam201507,
  [exam201512.id]: exam201512,
  [exam201607.id]: exam201607,
  [exam201612.id]: exam201612,
  [exam201707.id]: exam201707,
  [exam201712.id]: exam201712,
  [exam201807.id]: exam201807,
  [exam201812.id]: exam201812,
  [exam201907.id]: exam201907,
  [exam201912.id]: exam201912,
  [exam202607.id]: exam202607,
};

export function getExamMeta(id: string): ExamMeta | undefined {
  return EXAMS.find((e) => e.id === id);
}

export function getExamData(id: string): ExamData | undefined {
  return DATA[id];
}
