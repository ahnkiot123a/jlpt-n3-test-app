import Link from "next/link";
import { notFound } from "next/navigation";
import ExamRunner from "@/components/ExamRunner";
import { EXAMS, getExamData, getExamMeta } from "@/lib/exams";

export function generateStaticParams() {
  return EXAMS.map((e) => ({ id: e.id }));
}

export default async function ExamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const meta = getExamMeta(id);
  if (!meta) notFound();

  const data = getExamData(id);
  if (data) return <ExamRunner meta={meta} exam={data} />;

  return (
    <main className="fallback">
      <Link href="/" className="back">← Danh sách đề</Link>
      <h1>JLPT {meta.label}</h1>
      <p className="muted">Đề này chưa được chuyển sang dạng tương tác. Bạn có thể xem PDF và nghe audio.</p>
      {meta.audio && <audio controls preload="auto" src={`/api/files/${id}/audio`} />}
      <div className="pdf-links">
        {meta.examPdf && <a className="btn" href={`/api/files/${id}/exam`} target="_blank">Mở đề (PDF)</a>}
        {meta.answerPdf && <a className="btn" href={`/api/files/${id}/answer`} target="_blank">Mở đáp án (PDF)</a>}
      </div>
      {meta.examPdf && <iframe className="pdf" src={`/api/files/${id}/exam`} title="Đề thi" />}
    </main>
  );
}
