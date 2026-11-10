"use client";

import { useSyncExternalStore } from "react";
import { loadHistory } from "@/lib/scoring";

const subscribeNoop = () => () => {};
let cache: { raw: string | null; value: ReturnType<typeof loadHistory> } = { raw: null, value: [] };

function getSnapshot() {
  const raw = localStorage.getItem("n3-history");
  if (raw !== cache.raw) cache = { raw, value: loadHistory() };
  return cache.value;
}

const EMPTY: ReturnType<typeof loadHistory> = [];

export default function History() {
  const history = useSyncExternalStore(subscribeNoop, getSnapshot, () => EMPTY);
  if (history.length === 0) return null;
  return (
    <section className="history">
      <h2>Lịch sử làm bài</h2>
      <table>
        <thead>
          <tr>
            <th>Đề</th>
            <th>Thời gian</th>
            <th>Ngôn ngữ</th>
            <th>Đọc hiểu</th>
            <th>Nghe</th>
            <th>Tổng</th>
          </tr>
        </thead>
        <tbody>
          {history.map((h) => (
            <tr key={h.date}>
              <td>{h.label}</td>
              <td>{new Date(h.date).toLocaleString("vi-VN")}</td>
              {h.areas.map((a) => (
                <td key={a.area}>{a.scaled}</td>
              ))}
              <td className={h.passed ? "pass-text" : "fail-text"}>
                {h.total}/180 {h.passed ? "Đỗ" : "Trượt"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
