import React, { useState, useEffect, useRef } from "react";

// ── helpers ────────────────────────────────────────────────────────────────
const COLORS = {
  purple: "#7c3aed",
  purpleLight: "#ede9fe",
  purpleBorder: "#c4b5fd",
  blue: "#1a237e",
  green: "#059669",
  greenLight: "#d1fae5",
  greenBorder: "#6ee7b7",
  red: "#dc2626",
  redLight: "#fee2e2",
  redBorder: "#fca5a5",
  gold: "#d97706",
  goldLight: "#fef3c7",
  gray: "#6b7280",
  grayLight: "#f3f4f6",
  grayBorder: "#e5e7eb",
  white: "#ffffff",
};

function useCountUp(target, duration = 800) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setVal(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return val;
}

// ── Progress bar ───────────────────────────────────────────────────────────
function ProgressBar({ current, total, streak }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div style={s.progressWrap}>
      <div style={s.progressMeta}>
        <span style={s.progressLabel}>السؤال {current} من {total}</span>
        {streak >= 2 && (
          <span style={s.streakBadge}>🔥 {streak} متتالية</span>
        )}
        <span style={s.progressPct}>{pct}%</span>
      </div>
      <div style={s.progressTrack}>
        <div style={{ ...s.progressFill, width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ── Single question card ───────────────────────────────────────────────────
function QuestionCard({ question, index, total, onAnswer, streak }) {
  const [chosen, setChosen] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [animIn, setAnimIn] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    // slide-in animation
    requestAnimationFrame(() => setAnimIn(true));
    return () => clearTimeout(timerRef.current);
  }, []);

  const pick = (opt) => {
    if (revealed) return;
    setChosen(opt);
    setRevealed(true);
    const correct = opt === question.answer;
    // auto-advance after 1.8 s
    timerRef.current = setTimeout(() => onAnswer(correct), 1800);
  };

  const isCorrect = chosen === question.answer;

  return (
    <div style={{ ...s.qCard, opacity: animIn ? 1 : 0, transform: animIn ? "translateY(0)" : "translateY(16px)", transition: "opacity 0.35s, transform 0.35s" }}>
      <ProgressBar current={index + 1} total={total} streak={streak} />

      {/* Question */}
      <div style={s.qBox}>
        <span style={s.qNum}>س{index + 1}</span>
        <p style={s.qText}>{question.question}</p>
      </div>

      {/* Options */}
      <div style={s.optionsGrid}>
        {question.options.map((opt) => {
          const isChosen = chosen === opt;
          const isAnswer = opt === question.answer;
          let bg = COLORS.white;
          let border = `2px solid ${COLORS.grayBorder}`;
          let color = "#1f2937";
          let icon = null;

          if (revealed) {
            if (isAnswer) {
              bg = COLORS.greenLight; border = `2px solid ${COLORS.greenBorder}`; color = COLORS.green;
              icon = <span style={s.optIcon}>✓</span>;
            } else if (isChosen) {
              bg = COLORS.redLight; border = `2px solid ${COLORS.redBorder}`; color = COLORS.red;
              icon = <span style={s.optIcon}>✗</span>;
            }
          } else if (isChosen) {
            bg = COLORS.purpleLight; border = `2px solid ${COLORS.purpleBorder}`; color = COLORS.purple;
          }

          return (
            <button key={opt} onClick={() => pick(opt)} disabled={revealed}
              style={{ ...s.optBtn, background: bg, border, color,
                transform: revealed && isChosen ? "scale(1.02)" : "scale(1)",
                cursor: revealed ? "default" : "pointer",
                transition: "all 0.2s",
              }}>
              {icon}
              <span style={{ flex: 1 }}>{opt}</span>
            </button>
          );
        })}
      </div>

      {/* Feedback banner */}
      {revealed && (
        <div style={{ ...s.feedback, background: isCorrect ? COLORS.greenLight : COLORS.redLight, border: `1px solid ${isCorrect ? COLORS.greenBorder : COLORS.redBorder}`, color: isCorrect ? COLORS.green : COLORS.red }}>
          <span style={{ fontSize: "18px" }}>{isCorrect ? "🎉" : "💡"}</span>
          <div>
            <p style={s.feedbackTitle}>{isCorrect ? "إجابة صحيحة!" : "إجابة خاطئة"}</p>
            <p style={s.feedbackExpl}>{question.explanation}</p>
          </div>
        </div>
      )}

      {/* Manual next if user wants to skip wait */}
      {revealed && (
        <button style={s.nextBtn} onClick={() => { clearTimeout(timerRef.current); onAnswer(isCorrect); }}>
          {index + 1 < total ? "السؤال التالي ←" : "عرض النتائج ←"}
        </button>
      )}
    </div>
  );
}

// ── Results screen ─────────────────────────────────────────────────────────
function Results({ questions, answers, onRetry, onClose }) {
  const score = answers.filter(Boolean).length;
  const total = questions.length;
  const pct = Math.round((score / total) * 100);
  const animScore = useCountUp(pct);

  const grade =
    pct === 100 ? { emoji: "🏆", label: "ممتاز!", color: COLORS.gold, bg: COLORS.goldLight }
    : pct >= 80  ? { emoji: "🌟", label: "جيد جداً", color: COLORS.green, bg: COLORS.greenLight }
    : pct >= 60  ? { emoji: "👍", label: "جيد", color: "#2563eb", bg: "#dbeafe" }
    :              { emoji: "📚", label: "راجع الدرس", color: COLORS.red, bg: COLORS.redLight };

  return (
    <div style={s.resultsWrap}>
      {/* Score ring */}
      <div style={{ ...s.scoreRing, borderColor: grade.color }}>
        <span style={{ fontSize: "32px" }}>{grade.emoji}</span>
        <span style={{ fontSize: "36px", fontWeight: 800, color: grade.color, lineHeight: 1 }}>{animScore}%</span>
        <span style={{ fontSize: "13px", color: COLORS.gray }}>{score}/{total} صحيح</span>
      </div>

      <div style={{ ...s.gradeBadge, background: grade.bg, color: grade.color }}>{grade.label}</div>

      {/* Per-question review */}
      <div style={s.reviewList}>
        <p style={s.reviewTitle}>مراجعة الإجابات</p>
        {questions.map((q, i) => (
          <div key={i} style={{ ...s.reviewItem, borderRight: `3px solid ${answers[i] ? COLORS.green : COLORS.red}` }}>
            <div style={s.reviewHeader}>
              <span style={{ ...s.reviewBadge, background: answers[i] ? COLORS.greenLight : COLORS.redLight, color: answers[i] ? COLORS.green : COLORS.red }}>
                {answers[i] ? "✓ صحيح" : "✗ خطأ"}
              </span>
              <p style={s.reviewQ}>{q.question}</p>
            </div>
            {!answers[i] && (
              <p style={s.reviewAnswer}>الإجابة الصحيحة: <strong>{q.answer}</strong></p>
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={s.resultActions}>
        <button style={{ ...s.retryBtn }} onClick={onRetry}>🔄 إعادة الاختبار</button>
        {onClose && <button style={s.closeResultBtn} onClick={onClose}>✕ إغلاق</button>}
      </div>
    </div>
  );
}

// ── Main LessonPage export ─────────────────────────────────────────────────
export default function LessonPage({ lessonData, onClose }) {
  const { lesson, summary, quiz: questions } = lessonData;
  const [phase, setPhase] = useState("intro"); // intro | quiz | results
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [streak, setStreak] = useState(0);

  const handleAnswer = (correct) => {
    const next = [...answers, correct];
    setAnswers(next);
    setStreak(correct ? streak + 1 : 0);
    if (current + 1 < questions.length) {
      setCurrent(current + 1);
    } else {
      setPhase("results");
    }
  };

  const handleRetry = () => {
    setCurrent(0); setAnswers([]); setStreak(0); setPhase("intro");
  };

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.headerInner}>
          <span style={s.headerIcon}>🎓</span>
          <div style={{ minWidth: 0 }}>
            <h1 style={s.headerTitle}>{lesson.title}</h1>
            <p style={s.headerSub}>درس تفاعلي · {questions.length} أسئلة</p>
          </div>
        </div>
        {onClose && <button style={s.headerClose} onClick={onClose} aria-label="Close">✕</button>}
      </div>

      <div style={s.content}>
        {/* ── INTRO ── */}
        {phase === "intro" && (
          <div style={s.introWrap}>
            {/* Lesson content */}
            <div style={s.lessonCard}>
              {lesson.objectives?.length > 0 && (
                <div style={s.block}>
                  <p style={s.blockTitle}>🎯 أهداف الدرس</p>
                  <ul style={{ margin: 0, paddingRight: "20px" }}>
                    {lesson.objectives.map((o, i) => <li key={i} style={s.li}>{o}</li>)}
                  </ul>
                </div>
              )}

              {lesson.sections?.map((sec, i) => (
                <div key={i} style={s.section}>
                  <p style={s.sectionHeading}>{sec.heading}</p>
                  <p style={s.sectionContent}>{sec.content}</p>
                </div>
              ))}

              {lesson.keyTerms?.length > 0 && (
                <div style={s.block}>
                  <p style={s.blockTitle}>📚 المصطلحات الرئيسية</p>
                  {lesson.keyTerms.map((t, i) => (
                    <div key={i} style={s.termRow}>
                      <span style={s.term}>{t.term}</span>
                      <span style={s.termDef}>{t.definition}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Summary */}
            <div style={s.summaryCard}>
              <p style={s.blockTitle}>📋 الملخص</p>
              <p style={s.summaryText}>{summary}</p>
            </div>

            {/* Start quiz CTA */}
            <div style={s.ctaCard}>
              <p style={s.ctaTitle}>هل أنت مستعد للاختبار؟</p>
              <p style={s.ctaSub}>{questions.length} أسئلة اختيار من متعدد · ستحصل على تغذية راجعة فورية لكل سؤال</p>
              <button style={s.startBtn} onClick={() => setPhase("quiz")}>
                ابدأ الاختبار 🚀
              </button>
            </div>
          </div>
        )}

        {/* ── QUIZ ── */}
        {phase === "quiz" && (
          <div style={s.quizWrap}>
            <QuestionCard
              key={current}
              question={questions[current]}
              index={current}
              total={questions.length}
              onAnswer={handleAnswer}
              streak={streak}
            />
          </div>
        )}

        {/* ── RESULTS ── */}
        {phase === "results" && (
          <Results
            questions={questions}
            answers={answers}
            onRetry={handleRetry}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const s = {
  page: { display: "flex", flexDirection: "column", height: "100%", fontFamily: "'Segoe UI', system-ui, sans-serif", direction: "rtl" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: "linear-gradient(135deg, #1a237e, #7c3aed)", color: "#fff", flexShrink: 0 },
  headerInner: { display: "flex", alignItems: "center", gap: "12px", minWidth: 0 },
  headerIcon: { fontSize: "28px", flexShrink: 0 },
  headerTitle: { margin: 0, fontSize: "16px", fontWeight: 700, color: "#fff" },
  headerSub: { margin: "2px 0 0", fontSize: "12px", color: "rgba(255,255,255,0.75)" },
  headerClose: { background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", borderRadius: "8px", padding: "6px 10px", cursor: "pointer", fontSize: "14px", flexShrink: 0 },

  content: { flex: 1, overflowY: "auto", padding: "20px" },

  // Intro
  introWrap: { display: "flex", flexDirection: "column", gap: "16px" },
  lessonCard: { background: "#fff", border: "1px solid #e8eaf6", borderRadius: "12px", padding: "20px" },
  block: { background: "#f8f9ff", border: "1px solid #e8eaf6", borderRadius: "10px", padding: "14px", marginBottom: "14px" },
  blockTitle: { fontWeight: 700, fontSize: "13px", color: COLORS.purple, margin: "0 0 10px", textAlign: "right" },
  li: { fontSize: "13px", lineHeight: 1.8, color: "#444", textAlign: "right" },
  section: { marginBottom: "14px", borderRight: `3px solid ${COLORS.purple}`, paddingRight: "12px" },
  sectionHeading: { fontWeight: 700, fontSize: "14px", color: COLORS.blue, margin: "0 0 4px", textAlign: "right" },
  sectionContent: { fontSize: "13px", lineHeight: 1.8, color: "#444", margin: 0, textAlign: "right" },
  termRow: { display: "flex", gap: "10px", marginBottom: "8px", alignItems: "flex-start" },
  term: { fontWeight: 700, fontSize: "13px", color: COLORS.purple, minWidth: "90px", textAlign: "right" },
  termDef: { fontSize: "13px", color: "#555", flex: 1, textAlign: "right" },
  summaryCard: { background: "#faf5ff", border: "1px solid #e9d8fd", borderRadius: "12px", padding: "18px" },
  summaryText: { margin: 0, fontSize: "13px", lineHeight: 1.9, color: "#333", textAlign: "right" },
  ctaCard: { background: "linear-gradient(135deg, #1a237e, #7c3aed)", borderRadius: "14px", padding: "24px", textAlign: "center", color: "#fff" },
  ctaTitle: { margin: "0 0 6px", fontSize: "17px", fontWeight: 700 },
  ctaSub: { margin: "0 0 18px", fontSize: "13px", color: "rgba(255,255,255,0.8)" },
  startBtn: { background: "#fff", color: COLORS.purple, border: "none", borderRadius: "10px", padding: "12px 32px", fontSize: "15px", fontWeight: 700, cursor: "pointer" },

  // Quiz
  quizWrap: { maxWidth: "600px", margin: "0 auto" },
  progressWrap: { marginBottom: "20px" },
  progressMeta: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" },
  progressLabel: { fontSize: "13px", color: COLORS.gray, fontWeight: 500 },
  progressPct: { fontSize: "13px", color: COLORS.purple, fontWeight: 700 },
  streakBadge: { background: "#fef3c7", color: "#92400e", borderRadius: "20px", padding: "2px 10px", fontSize: "12px", fontWeight: 700 },
  progressTrack: { height: "8px", background: COLORS.grayBorder, borderRadius: "99px", overflow: "hidden" },
  progressFill: { height: "100%", background: `linear-gradient(90deg, #7c3aed, #3f51b5)`, borderRadius: "99px", transition: "width 0.4s ease" },

  qCard: { background: "#fff", border: "1px solid #e8eaf6", borderRadius: "14px", padding: "22px", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" },
  qBox: { display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "18px" },
  qNum: { background: COLORS.purpleLight, color: COLORS.purple, borderRadius: "8px", padding: "3px 10px", fontSize: "12px", fontWeight: 700, flexShrink: 0, marginTop: "2px" },
  qText: { margin: 0, fontSize: "15px", fontWeight: 600, color: COLORS.blue, lineHeight: 1.6, textAlign: "right", flex: 1 },

  optionsGrid: { display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" },
  optBtn: { display: "flex", alignItems: "center", gap: "10px", width: "100%", textAlign: "right", padding: "12px 16px", borderRadius: "10px", fontSize: "14px", fontWeight: 500 },
  optIcon: { fontSize: "16px", fontWeight: 700, flexShrink: 0 },

  feedback: { display: "flex", gap: "12px", alignItems: "flex-start", borderRadius: "10px", padding: "14px", marginBottom: "14px" },
  feedbackTitle: { margin: "0 0 4px", fontWeight: 700, fontSize: "14px" },
  feedbackExpl: { margin: 0, fontSize: "13px", lineHeight: 1.6 },

  nextBtn: { display: "block", width: "100%", padding: "12px", background: `linear-gradient(135deg, #1a237e, #7c3aed)`, color: "#fff", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: 700, cursor: "pointer" },

  // Results
  resultsWrap: { maxWidth: "560px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px", alignItems: "center" },
  scoreRing: { width: "140px", height: "140px", borderRadius: "50%", border: "6px solid", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "2px", background: "#fff", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" },
  gradeBadge: { borderRadius: "20px", padding: "6px 20px", fontSize: "15px", fontWeight: 700 },
  reviewList: { width: "100%", display: "flex", flexDirection: "column", gap: "10px" },
  reviewTitle: { margin: "0 0 4px", fontWeight: 700, fontSize: "14px", color: COLORS.blue, textAlign: "right", width: "100%" },
  reviewItem: { background: "#fff", border: "1px solid #e8eaf6", borderRadius: "10px", padding: "12px 14px", paddingRight: "16px" },
  reviewHeader: { display: "flex", gap: "10px", alignItems: "flex-start" },
  reviewBadge: { borderRadius: "6px", padding: "2px 8px", fontSize: "11px", fontWeight: 700, flexShrink: 0, marginTop: "2px" },
  reviewQ: { margin: 0, fontSize: "13px", color: "#333", textAlign: "right", flex: 1, lineHeight: 1.5 },
  reviewAnswer: { margin: "8px 0 0", fontSize: "12px", color: COLORS.gray, textAlign: "right" },
  resultActions: { display: "flex", gap: "10px", width: "100%" },
  retryBtn: { flex: 1, padding: "12px", background: `linear-gradient(135deg, #1a237e, #7c3aed)`, color: "#fff", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: 700, cursor: "pointer" },
  closeResultBtn: { padding: "12px 20px", background: COLORS.grayLight, color: COLORS.gray, border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: 600, cursor: "pointer" },
};
