import Link from "next/link";
import History from "@/components/History";
import { EXAMS, getExamData } from "@/lib/exams";

export default function Home() {
  const exams = [...EXAMS].reverse();
  return (
    <main className="home">
      <h1>Đề thi JLPT N3 các năm</h1>
      <p className="muted">
        Đề có nhãn <span className="badge on">Tương tác</span> làm trực tiếp trên web và chấm điểm tự động. Các đề
        khác hiện mở dạng PDF + audio.
      </p>
      <div className="exam-grid">
        {exams.map((e) => {
          const ready = Boolean(getExamData(e.id));
          return (
            <Link key={e.id} href={`/exam/${e.id}`} className="exam-card">
              <strong>{e.label}</strong>
              <span className={ready ? "badge on" : "badge"}>{ready ? "Tương tác" : "PDF"}</span>
            </Link>
          );
        })}
      </div>
      <History />
    </main>
  );
}
