import { open, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { getExamMeta } from "@/lib/exams";

const ROOT = process.env.EXAM_ROOT ?? path.resolve(process.cwd(), "..");

const KINDS = {
  audio: { field: "audio", type: "audio/mpeg" },
  exam: { field: "examPdf", type: "application/pdf" },
  answer: { field: "answerPdf", type: "application/pdf" },
} as const;

function getPublicAssetUrl(folder: string, fileName: string): URL | null {
  const assetBaseUrl = process.env.EXAM_ASSET_BASE_URL;
  if (!assetBaseUrl) return null;

  const baseUrl = new URL(assetBaseUrl);
  if (baseUrl.protocol !== "https:" || baseUrl.search || baseUrl.hash) {
    throw new Error("EXAM_ASSET_BASE_URL must be an HTTPS URL without a query or hash");
  }

  const objectKey = `${folder}/${fileName}`
    .split("/")
    .map((segment) => encodeURIComponent(segment.normalize("NFD")))
    .join("/");
  baseUrl.pathname = `${baseUrl.pathname.replace(/\/+$/, "")}/${objectKey}`;
  return baseUrl;
}

// Vietnamese file names on disk may be stored in NFC or NFD form.
async function resolveFile(folder: string, name: string): Promise<string | null> {
  const dir = path.join(ROOT, folder);
  try {
    const entries = await readdir(dir);
    const match = entries.find((e) => e.normalize("NFC") === name.normalize("NFC"));
    return match ? path.join(dir, match) : null;
  } catch {
    return null;
  }
}

// Pull-based so aborted requests (audio seeks) just close the file instead of throwing.
function fileStream(filePath: string, start: number, end: number): ReadableStream<Uint8Array> {
  const CHUNK = 256 * 1024;
  let pos = start;
  let handle: Awaited<ReturnType<typeof open>> | null = null;
  const close = async () => {
    const h = handle;
    handle = null;
    await h?.close().catch(() => {});
  };
  return new ReadableStream({
    async start() {
      handle = await open(/*turbopackIgnore: true*/ filePath, "r");
    },
    async pull(controller) {
      if (!handle) return;
      const len = Math.min(CHUNK, end - pos + 1);
      if (len <= 0) {
        await close();
        controller.close();
        return;
      }
      const buf = new Uint8Array(len);
      const { bytesRead } = await handle.read(buf, 0, len, pos);
      if (!handle) return;
      if (bytesRead === 0) {
        await close();
        controller.close();
        return;
      }
      pos += bytesRead;
      controller.enqueue(buf.subarray(0, bytesRead));
    },
    cancel: close,
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; kind: string }> },
) {
  const { id, kind } = await params;
  const meta = getExamMeta(id);
  const spec = KINDS[kind as keyof typeof KINDS];
  const fileName = meta && spec ? meta[spec.field] : undefined;
  if (!meta || !spec || !fileName) return new Response("Not found", { status: 404 });

  const publicAssetUrl = getPublicAssetUrl(meta.folder, fileName);
  if (publicAssetUrl) return Response.redirect(publicAssetUrl, 307);

  const filePath = await resolveFile(meta.folder, fileName);
  if (!filePath) return new Response("Not found", { status: 404 });

  const { size, mtimeMs } = await stat(/*turbopackIgnore: true*/ filePath);
  const etag = `"${size.toString(16)}-${Math.floor(mtimeMs).toString(16)}"`;
  if (request.headers.get("if-none-match") === etag) {
    return new Response(null, { status: 304, headers: { ETag: etag } });
  }
  const range = request.headers.get("range");
  const headers: Record<string, string> = {
    "Content-Type": spec.type,
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=604800",
    ETag: etag,
    "Last-Modified": new Date(mtimeMs).toUTCString(),
  };

  const match = range?.match(/^bytes=(\d*)-(\d*)$/);
  if (match && (match[1] || match[2])) {
    let start = match[1] ? Number(match[1]) : size - Number(match[2]);
    let end = match[1] && match[2] ? Number(match[2]) : size - 1;
    start = Math.max(0, start);
    end = Math.min(end, size - 1);
    if (start > end) {
      return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    }
    return new Response(fileStream(filePath, start, end), {
      status: 206,
      headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1) },
    });
  }

  return new Response(fileStream(filePath, 0, size - 1), { headers: { ...headers, "Content-Length": String(size) } });
}
