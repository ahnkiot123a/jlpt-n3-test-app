import Link from "next/link";
import History from "@/components/History";
import { EXAMS, getExamData } from "@/lib/exams";

export default function Home() {
  const exams = [...EXAMS].reverse().map((exam) => ({
    ...exam,
    isInteractive: Boolean(getExamData(exam.id)),
  }));
  const interactiveCount = exams.filter((exam) => exam.isInteractive).length;
  const pdfCount = exams.length - interactiveCount;

  return (
    <main className="home">
      <header className="home-hero">
        <p className="home-kicker">Kho đề luyện thi</p>
        <h1>Đề thi JLPT N3 các năm</h1>
        <p className="home-description">
          Luyện tập với đề tương tác có chấm điểm tự động hoặc mở đề PDF kèm audio.
        </p>
        <div className="home-stats" aria-label="Thống kê đề thi">
          <div className="home-stat">
            <strong>{exams.length}</strong>
            <span>Tổng số đề</span>
          </div>
          <div className="home-stat">
            <strong>{interactiveCount}</strong>
            <span>Đề tương tác</span>
          </div>
          <div className="home-stat">
            <strong>{pdfCount}</strong>
            <span>Đề PDF</span>
          </div>
        </div>
      </header>

      <section className="exam-section" aria-labelledby="exam-list-title">
        <div className="exam-section-heading">
          <div>
            <h2 id="exam-list-title">Chọn đề thi</h2>
            <p className="muted small">Sắp xếp từ mới nhất đến cũ nhất</p>
          </div>
          <span className="exam-count">{exams.length} đề</span>
        </div>
        <div className="exam-grid">
          {exams.map((e) => (
            <Link key={e.id} href={`/exam/${e.id}`} className="exam-card">
              <strong className="exam-card-title">{e.label}</strong>
              <span className={`exam-status ${e.isInteractive ? "interactive" : "pdf-status"}`}>
                {e.isInteractive ? "Tương tác" : "PDF"}
              </span>
            </Link>
          ))}
        </div>
      </section>
      <section className="history-section" aria-label="Lịch sử làm bài">
        <History />
      </section>
    </main>
  );
}
