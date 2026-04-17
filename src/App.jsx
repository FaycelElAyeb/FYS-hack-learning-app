import React, { useState, useEffect, useRef } from "react";
import LessonPage from "./LessonPage";

const API_URL = import.meta.env.VITE_API_URL || "https://100.52.225.111";
// ── Helpers ────────────────────────────────────────────────────────────────
function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
function formatDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

// ── Spinner ────────────────────────────────────────────────────────────────
function Spinner({ small }) {
  const size = small ? "14px" : "24px";
  return (
    <div style={{ width: size, height: size, border: "2px solid #e8eaf6", borderTop: "2px solid #3f51b5", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block", flexShrink: 0 }} />
  );
}

// ── Main Modal ─────────────────────────────────────────────────────────────
function TextModal({ file, onClose }) {
  const [tab, setTab] = useState("original");
  const [extractedText, setExtractedText] = useState(null);
  const [translatedText, setTranslatedText] = useState(null);
  const [lessonData, setLessonData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    //fetch(`/extract/${encodeURIComponent(file.key)}`)
    fetch(`${API_URL}/extract/${encodeURIComponent(file.key)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setExtractedText(d.text || "(No text found in document)");
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [file.key]);

  const handleTranslate = async () => {
    setTranslating(true); setError("");
    try {
      //const res = await fetch("/translate", {
      const res = await fetch(`${API_URL}/translate`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: extractedText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Translation failed");
      setTranslatedText(data.translatedText);
      setTab("arabic");
    } catch (e) { setError(e.message); }
    finally { setTranslating(false); }
  };

  const handleGenerateLesson = async () => {
    setGenerating(true); setError("");
    try {
      //const res = await fetch("/generate-lesson", {
      const res = await fetch(`${API_URL}/generate-lesson`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: translatedText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setLessonData(data);
      setTab("lesson");
    } catch (e) { setError(e.message); }
    finally { setGenerating(false); }
  };

  const tabs = [
    { key: "original", label: "Original Text" },
    { key: "arabic", label: `Arabic ${translatedText ? "✓" : ""}`, disabled: !translatedText },
    { key: "lesson", label: `Lesson ${lessonData ? "✓" : ""}`, disabled: !lessonData },
  ];

  return (
    <div style={modal.overlay} onClick={onClose}>
      <div style={modal.box} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={modal.header}>
          <div style={modal.headerLeft}>
            <span style={{ fontSize: "20px" }}>{file.name.endsWith(".pdf") ? "📄" : "📝"}</span>
            <span style={modal.headerTitle}>{file.name}</span>
          </div>
          <button style={modal.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Tabs */}
        <div style={modal.tabs}>
          {tabs.map(({ key, label, disabled }) => (
            <button key={key}
              style={{ ...modal.tab, ...(tab === key ? modal.tabActive : {}), ...(disabled ? { opacity: 0.4, cursor: "default" } : {}) }}
              onClick={() => !disabled && setTab(key)} disabled={disabled}>
              {label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ ...modal.body, padding: tab === "lesson" ? 0 : "20px" }}>
          {error && <div style={{ ...modal.error, margin: "16px 20px 0" }}>{error}</div>}

          {tab === "original" && (
            loading
              ? <div style={modal.centered}><Spinner /><p style={modal.hint}>Extracting text...</p></div>
              : <pre style={modal.textBox}>{extractedText}</pre>
          )}

          {tab === "arabic" && translatedText && (
            <pre style={{ ...modal.textBox, direction: "rtl", textAlign: "right" }}>{translatedText}</pre>
          )}

          {tab === "lesson" && lessonData && <LessonPage lessonData={lessonData} />}
        </div>

        {/* Footer */}
        <div style={modal.footer}>
          {tab === "original" && !translatedText && (
            <button style={{ ...modal.actionBtn, ...(translating || loading ? modal.btnDisabled : {}) }}
              onClick={handleTranslate} disabled={translating || loading || !extractedText}>
              {translating ? <><Spinner small /> جارٍ الترجمة...</> : "🌐 Translate to Arabic"}
            </button>
          )}
          {tab === "arabic" && translatedText && !lessonData && (
            <button style={{ ...modal.actionBtn, background: "#7c3aed", ...(generating ? modal.btnDisabled : {}) }}
              onClick={handleGenerateLesson} disabled={generating}>
              {generating ? <><Spinner small /> Generating lesson...</> : "🎓 Generate Lesson + Quiz"}
            </button>
          )}
          {tab === "lesson" && lessonData && (
            <button style={{ ...modal.actionBtn, background: "#7c3aed" }}
              onClick={handleGenerateLesson} disabled={generating}>
              {generating ? <><Spinner small /> Regenerating...</> : "🔄 Regenerate"}
            </button>
          )}
          {tab === "original" && translatedText && (
            <button style={{ ...modal.actionBtn, background: "#059669" }} onClick={() => setTab("arabic")}>
              View Arabic →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────
export default function App() {
  const [files, setFiles] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeFile, setActiveFile] = useState(null);
  const inputRef = useRef();

  const fetchFiles = async () => {
    try {
      //const res = await fetch("/files");
      const res = await fetch(`${API_URL}/files`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load files");
      setFiles(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Could not load files. Is the backend running?");
    }
  };

  useEffect(() => { fetchFiles(); }, []);

  const uploadFile = async (file) => {
    setError(""); setSuccess("");
    const allowed = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowed.includes(file.type)) { setError("Only PDF and DOCX files are supported."); return; }
    const formData = new FormData();
    formData.append("file", file);
    setUploading(true);
    try {
      //const res = await fetch("/upload", { method: "POST", body: formData });
      const res = await fetch(`${API_URL}/upload`, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setSuccess(`"${data.file.name}" uploaded successfully.`);
      fetchFiles();
    } catch (err) { setError(err.message); }
    finally { setUploading(false); }
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  };

  const handleDelete = async (key) => {
    setError("");
    try {
     // const res = await fetch(`/files/${encodeURIComponent(key)}`, { method: "DELETE" });
     const res = await fetch(`${API_URL}/files/${encodeURIComponent(key)}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setFiles((prev) => prev.filter((f) => f.key !== key));
    } catch (err) { setError(err.message); }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <span style={styles.logo}>☁️</span>
          <div>
            <h1 style={styles.title}>AI Learning App</h1>
            <p style={styles.subtitle}>Upload PDF or DOCX · Translate · Generate Lessons & Quizzes</p>
          </div>
        </div>

        <div style={{ ...styles.dropzone, ...(dragging ? styles.dropzoneActive : {}) }}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current.click()}
          role="button" tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && inputRef.current.click()}
          aria-label="File upload drop zone">
          <input ref={inputRef} type="file" accept=".pdf,.docx" style={{ display: "none" }}
            onChange={(e) => e.target.files[0] && uploadFile(e.target.files[0])} />
          {uploading
            ? <div style={styles.uploadingWrap}><Spinner /><p style={styles.dropText}>Uploading to S3...</p></div>
            : <>
                <p style={styles.dropIcon}>📂</p>
                <p style={styles.dropText}>Drag & drop a file here, or <span style={styles.browseLink}>browse</span></p>
                <p style={styles.dropHint}>PDF or DOCX · max 10 MB</p>
              </>}
        </div>

        {error && <div style={styles.alert}>{error}</div>}
        {success && <div style={styles.alertSuccess}>{success}</div>}

        <div style={styles.listHeader}>
          <h2 style={styles.listTitle}>Uploaded Files</h2>
          <span style={styles.badge}>{files.length}</span>
        </div>

        {files.length === 0
          ? <div style={styles.emptyState}><p style={styles.emptyIcon}>🗂️</p><p style={styles.emptyText}>No files yet. Upload one above.</p></div>
          : <ul style={styles.list}>
              {files.map((f) => (
                <li key={f.key} style={styles.listItem}>
                  <span style={styles.fileIcon}>{f.name.endsWith(".pdf") ? "📄" : "📝"}</span>
                  <div style={styles.fileInfo}>
                    <a href={f.url} target="_blank" rel="noreferrer" style={styles.fileName}>{f.name}</a>
                    <span style={styles.fileMeta}>{formatSize(f.size)}{f.uploadedAt ? ` · ${formatDate(f.uploadedAt)}` : ""}</span>
                  </div>
                  <div style={styles.actions}>
                    <button style={styles.extractBtn} onClick={() => setActiveFile(f)} title="Open">
                      🎓 Open
                    </button>
                    <button style={styles.deleteBtn} onClick={() => handleDelete(f.key)} aria-label={`Delete ${f.name}`}>🗑️</button>
                  </div>
                </li>
              ))}
            </ul>}
      </div>

      {activeFile && <TextModal file={activeFile} onClose={() => setActiveFile(null)} />}
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = {
  page: { minHeight: "100vh", background: "linear-gradient(135deg, #e8eaf6 0%, #e3f2fd 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI', system-ui, sans-serif", padding: "24px" },
  card: { background: "#fff", borderRadius: "16px", padding: "36px", width: "100%", maxWidth: "620px", boxShadow: "0 8px 32px rgba(0,0,0,0.10)" },
  header: { display: "flex", alignItems: "center", gap: "14px", marginBottom: "28px" },
  logo: { fontSize: "36px" },
  title: { margin: "0 0 2px", fontSize: "22px", fontWeight: 700, color: "#1a237e" },
  subtitle: { margin: 0, color: "#666", fontSize: "13px" },
  dropzone: { border: "2px dashed #c5cae9", borderRadius: "12px", padding: "44px 20px", textAlign: "center", cursor: "pointer", transition: "border-color 0.2s, background 0.2s", background: "#fafbff", marginBottom: "16px" },
  dropzoneActive: { borderColor: "#3f51b5", background: "#e8eaf6" },
  dropIcon: { fontSize: "40px", margin: "0 0 10px" },
  dropText: { color: "#444", fontSize: "15px", margin: "0 0 6px" },
  browseLink: { color: "#3f51b5", fontWeight: 600 },
  dropHint: { color: "#aaa", fontSize: "12px", margin: 0 },
  uploadingWrap: { display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" },
  alert: { background: "#fff5f5", border: "1px solid #fed7d7", color: "#c53030", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", marginBottom: "12px" },
  alertSuccess: { background: "#f0fff4", border: "1px solid #c6f6d5", color: "#276749", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", marginBottom: "12px" },
  listHeader: { display: "flex", alignItems: "center", gap: "8px", margin: "24px 0 12px" },
  listTitle: { fontSize: "15px", fontWeight: 600, margin: 0, color: "#1a237e" },
  badge: { background: "#e8eaf6", color: "#3f51b5", borderRadius: "12px", padding: "2px 8px", fontSize: "12px", fontWeight: 600 },
  emptyState: { textAlign: "center", padding: "32px 0" },
  emptyIcon: { fontSize: "36px", margin: "0 0 8px" },
  emptyText: { color: "#aaa", fontSize: "14px", margin: 0 },
  list: { listStyle: "none", padding: 0, margin: 0 },
  listItem: { display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", borderRadius: "10px", marginBottom: "8px", background: "#f8f9ff", border: "1px solid #e8eaf6" },
  fileIcon: { fontSize: "24px", flexShrink: 0 },
  fileInfo: { flex: 1, minWidth: 0 },
  fileName: { display: "block", fontWeight: 500, fontSize: "14px", color: "#3f51b5", textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  fileMeta: { fontSize: "12px", color: "#999" },
  actions: { display: "flex", gap: "6px", alignItems: "center", flexShrink: 0 },
  extractBtn: { background: "#e8eaf6", border: "none", borderRadius: "6px", padding: "5px 10px", fontSize: "12px", fontWeight: 600, color: "#3f51b5", cursor: "pointer" },
  deleteBtn: { background: "none", border: "none", cursor: "pointer", fontSize: "16px", padding: "4px 6px", borderRadius: "6px", opacity: 0.5 },
};

const modal = {
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "16px" },
  box: { background: "#fff", borderRadius: "16px", width: "100%", maxWidth: "720px", maxHeight: "92vh", display: "flex", flexDirection: "column", boxShadow: "0 16px 48px rgba(0,0,0,0.2)" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", borderBottom: "1px solid #e8eaf6" },
  headerLeft: { display: "flex", alignItems: "center", gap: "10px", minWidth: 0 },
  headerTitle: { fontWeight: 600, fontSize: "15px", color: "#1a237e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  closeBtn: { background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#aaa", flexShrink: 0 },
  tabs: { display: "flex", gap: "4px", padding: "12px 20px 0", borderBottom: "1px solid #e8eaf6" },
  tab: { background: "none", border: "none", padding: "8px 16px", fontSize: "13px", fontWeight: 500, color: "#888", cursor: "pointer", borderBottom: "2px solid transparent", marginBottom: "-1px" },
  tabActive: { color: "#3f51b5", borderBottom: "2px solid #3f51b5" },
  body: { flex: 1, overflow: "auto", padding: "20px" },
  textBox: { margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: "13px", lineHeight: 1.7, color: "#333", background: "#f8f9ff", border: "1px solid #e8eaf6", borderRadius: "8px", padding: "16px", fontFamily: "inherit" },
  centered: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", minHeight: "120px" },
  hint: { color: "#aaa", fontSize: "13px", margin: 0 },
  error: { background: "#fff5f5", border: "1px solid #fed7d7", color: "#c53030", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", marginBottom: "12px" },
  footer: { padding: "14px 20px", borderTop: "1px solid #e8eaf6", display: "flex", justifyContent: "flex-end", gap: "8px" },
  actionBtn: { background: "#3f51b5", color: "#fff", border: "none", borderRadius: "8px", padding: "9px 18px", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" },
  btnDisabled: { opacity: 0.6, cursor: "not-allowed" },
};
