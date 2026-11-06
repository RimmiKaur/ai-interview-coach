"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import Link from "next/link";
import { generateReport, startInterview, submitAnswer } from "../lib/api";
import type { Difficulty, InterviewReport, Turn } from "../lib/api";
import styles from "./page.module.css";

type Screen = "setup" | "interview" | "report";

const difficulties: { value: Difficulty; note: string }[] = [
  { value: "Easy", note: "Foundations" },
  { value: "Medium", note: "Applied" },
  { value: "Hard", note: "Systems" },
];

function messageFromError(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>("setup");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("Medium");
  const [conversation, setConversation] = useState<Turn[]>([]);
  const [optimisticAnswer, setOptimisticAnswer] = useState("");
  const [answer, setAnswer] = useState("");
  const [report, setReport] = useState<InterviewReport | null>(null);
  const [starting, setStarting] = useState(false);
  const [answering, setAnswering] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [interviewEnded, setInterviewEnded] = useState(false);
  const [startError, setStartError] = useState("");
  const [answerError, setAnswerError] = useState("");
  const [reportError, setReportError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const questionNumber = conversation.filter((turn) => turn.role === "interviewer").length;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [conversation, optimisticAnswer, answering]);

  async function handleStart(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanTopic = topic.trim();
    if (!cleanTopic) {
      setStartError("Enter a technical topic to get started.");
      return;
    }

    setStartError("");
    setStarting(true);
    try {
      const firstTurn = await startInterview({ topic: cleanTopic, difficulty });
      setConversation([{ role: "interviewer", content: firstTurn.message }]);
      setInterviewEnded(firstTurn.ended);
      setAnswer("");
      setOptimisticAnswer("");
      setAnswerError("");
      setReport(null);
      setReportError("");
      setScreen("interview");
    } catch (error) {
      setStartError(messageFromError(error));
    } finally {
      setStarting(false);
    }
  }

  async function handleAnswer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanAnswer = answer.trim();
    if (!cleanAnswer) {
      setAnswerError("Write an answer before submitting.");
      return;
    }

    setAnswerError("");
    setAnswering(true);
    setOptimisticAnswer(cleanAnswer);
    setAnswer("");
    const answeredConversation = [...conversation, { role: "candidate" as const, content: cleanAnswer }];

    try {
      const nextTurn = await submitAnswer({ topic: topic.trim(), difficulty, conversation: answeredConversation });
      const updatedConversation = [...answeredConversation, { role: "interviewer" as const, content: nextTurn.message }];
      setConversation(updatedConversation);
      setOptimisticAnswer("");
      setAnswer("");

      if (nextTurn.ended) {
        setInterviewEnded(true);
        setScreen("report");
        await loadReport(updatedConversation);
      }
    } catch (error) {
      setOptimisticAnswer("");
      setAnswer(cleanAnswer);
      setAnswerError(messageFromError(error));
    } finally {
      setAnswering(false);
    }
  }

  async function loadReport(transcript: Turn[] = conversation) {
    setReporting(true);
    setReportError("");
    try {
      const result = await generateReport({ topic: topic.trim(), difficulty, conversation: transcript });
      setReport(result);
    } catch (error) {
      setReportError(messageFromError(error));
    } finally {
      setReporting(false);
    }
  }

  function startOver() {
    setScreen("setup");
    setTopic("");
    setDifficulty("Medium");
    setConversation([]);
    setOptimisticAnswer("");
    setAnswer("");
    setReport(null);
    setInterviewEnded(false);
    setStartError("");
    setAnswerError("");
    setReportError("");
  }

  return (
    <main className={styles.shell}>
      <div className={styles.ambient} aria-hidden="true" />
      <header className={styles.topbar}>
        <Link className={styles.brand} href="/" aria-label="AI Interview Coach home">
          <span className={styles.brandMark} aria-hidden="true"><span /><span /><span /></span>
          <span>AI Interview Coach</span>
        </Link>
        <span className={styles.topbarNote}><span className={styles.statusDot} /> PRIVATE PRACTICE SESSION</span>
      </header>

      {screen === "setup" && (
        <section className={`${styles.content} ${styles.setup}`} aria-labelledby="page-title">
          <div className={styles.intro}>
            <div className={styles.eyebrow}><span className={styles.eyebrowLine} /> YOUR NEXT INTERVIEW STARTS HERE</div>
            <h1 id="page-title">AI Interview Coach</h1>
            <p className={styles.tagline}>Sharpen your thinking. Find your next level.</p>
          </div>

          <form className={styles.setupCard} onSubmit={handleStart}>
            <div className={styles.formHeading}>
              <div>
                <span className={styles.stepLabel}>01 <span>/ SET UP</span></span>
                <h2>What are we talking about?</h2>
              </div>
              <span className={styles.duration}><span aria-hidden="true">&#9716;</span> 10&ndash;15 min</span>
            </div>

            <label className={styles.fieldLabel} htmlFor="topic">TECHNICAL TOPIC</label>
            <input
              id="topic"
              className={styles.topicInput}
              type="text"
              placeholder="e.g. Distributed systems, React hooks, SQL indexing"
              value={topic}
              onChange={(event) => { setTopic(event.target.value); setStartError(""); }}
              maxLength={200}
              autoComplete="off"
              disabled={starting}
            />

            <fieldset className={styles.difficultyFieldset} disabled={starting}>
              <legend className={styles.fieldLabel}>CHOOSE YOUR DIFFICULTY</legend>
              <div className={styles.difficultyGrid}>
                {difficulties.map((option) => (
                  <button
                    className={`${styles.difficultyOption} ${difficulty === option.value ? styles.difficultySelected : ""}`}
                    type="button"
                    key={option.value}
                    onClick={() => setDifficulty(option.value)}
                    aria-pressed={difficulty === option.value}
                  >
                    <span className={styles.difficultyRadio} aria-hidden="true" />
                    <span className={styles.difficultyText}>{option.value}<small>{option.note}</small></span>
                  </button>
                ))}
              </div>
            </fieldset>

            {startError && <p className={styles.errorMessage} role="alert">{startError}</p>}
            <button className={styles.primaryButton} type="submit" disabled={starting}>
              {starting ? <><span className={styles.spinner} /> Finding your first question&hellip;</> : <>Start Interview <span aria-hidden="true">&#8599;</span></>}
            </button>
            <p className={styles.cardFootnote}><span aria-hidden="true">&#10033;</span> Questions adapt to your answers. No two sessions are the same.</p>
          </form>

          <div className={styles.featureRow}>
            <span><i>01</i> One question at a time</span>
            <span><i>02</i> Adaptive follow-ups</span>
            <span><i>03</i> Clear feedback at the end</span>
          </div>
        </section>
      )}

      {screen === "interview" && (
        <section className={`${styles.content} ${styles.interviewContent}`} aria-labelledby="interview-heading">
          <div className={styles.interviewHeader}>
            <button type="button" className={styles.textButton} onClick={startOver} disabled={answering}>&larr; <span>Exit interview</span></button>
            <div className={styles.sessionMeta}>
              <span className={styles.topicChip}>{topic}</span>
              <span className={styles.difficultyChip}>{difficulty}</span>
            </div>
          </div>

          <div className={styles.interviewIntro}>
            <div className={styles.eyebrow}><span className={styles.liveDot} /> LIVE INTERVIEW</div>
            <h1 id="interview-heading">A conversation, not a quiz.</h1>
            <p>Take a moment to think. Your interviewer will adapt as you go.</p>
          </div>

          <div className={styles.chatShell}>
            <div className={styles.chatToolbar}>
              <span><span className={styles.chatLiveDot} /> QUESTION {String(questionNumber).padStart(2, "0")}</span>
              <span>One question at a time</span>
            </div>
            <div className={styles.chatMessages} role="log" aria-live="polite" aria-relevant="additions text" aria-label="Interview conversation">
              {conversation.map((turn, index) => (
                <div className={`${styles.chatRow} ${turn.role === "candidate" ? styles.candidateRow : styles.interviewerRow}`} key={`${turn.role}-${index}`}>
                  {turn.role === "interviewer" && <span className={styles.chatAvatar} aria-hidden="true">AI</span>}
                  <div className={styles.chatMessageGroup}>
                    <span className={styles.chatSender}>{turn.role === "candidate" ? "YOU" : "INTERVIEWER"}</span>
                    <div className={`${styles.chatBubble} ${turn.role === "candidate" ? styles.candidateBubble : styles.interviewerBubble}`}>{turn.content}</div>
                  </div>
                  {turn.role === "candidate" && <span className={`${styles.chatAvatar} ${styles.candidateAvatar}`} aria-hidden="true">Y</span>}
                </div>
              ))}
              {optimisticAnswer && (
                <div className={`${styles.chatRow} ${styles.candidateRow}`}>
                  <div className={styles.chatMessageGroup}>
                    <span className={styles.chatSender}>YOU</span>
                    <div className={`${styles.chatBubble} ${styles.candidateBubble}`}>{optimisticAnswer}</div>
                  </div>
                  <span className={`${styles.chatAvatar} ${styles.candidateAvatar}`} aria-hidden="true">Y</span>
                </div>
              )}
              {answering && (
                <div className={`${styles.chatRow} ${styles.interviewerRow}`}>
                  <span className={styles.chatAvatar} aria-hidden="true">AI</span>
                  <div className={styles.chatMessageGroup}>
                    <span className={styles.chatSender}>INTERVIEWER</span>
                    <div className={`${styles.chatBubble} ${styles.thinkingBubble}`} role="status">
                      <span className={styles.thinkingDots}><i /><i /><i /></span> Thinking
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {!interviewEnded && <form className={styles.chatComposer} onSubmit={handleAnswer}>
              <textarea
                id="answer"
                className={styles.chatInput}
                placeholder={answering ? "Your interviewer is thinking..." : "Write your answer..."}
                value={answer}
                onChange={(event) => { setAnswer(event.target.value); setAnswerError(""); }}
                onKeyDown={(event: KeyboardEvent<HTMLTextAreaElement>) => {
                  if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
                maxLength={12000}
                disabled={answering}
                rows={3}
                aria-label="Your answer"
              />
              {answerError && <p className={styles.errorMessage} role="alert">{answerError}</p>}
              <div className={styles.composerFooter}>
                <span>Enter to send <i /> Shift + Enter for a new line</span>
                <button className={styles.primaryButton} type="submit" disabled={answering}>
                  {answering ? <><span className={styles.spinner} /> Thinking...</> : <>Send answer <span aria-hidden="true">&#8599;</span></>}
                </button>
              </div>
            </form>}
          </div>
        </section>
      )}

      {screen === "report" && (
        <section className={`${styles.content} ${styles.reportContent}`} aria-labelledby="report-heading">
          <div className={styles.reportHeader}>
            <button type="button" className={styles.textButton} onClick={startOver}>&larr; <span>New interview</span></button>
            <div className={styles.sessionMeta}>
              <span className={styles.topicChip}>{topic}</span>
              <span className={styles.difficultyChip}>{difficulty}</span>
            </div>
          </div>

          {reporting && <div className={styles.reportLoading} role="status"><span className={styles.spinner} /> Generating your report...</div>}
          {reportError && !reporting && (
            <div className={styles.reportError} role="alert">
              <strong>We couldn&apos;t generate your report.</strong>
              <p>{reportError}</p>
              <button className={styles.primaryButton} type="button" onClick={() => void loadReport(conversation)}>Retry report <span aria-hidden="true">&#8599;</span></button>
            </div>
          )}
          {report && !reporting && (
            <>
              <div className={styles.reportIntro}>
                <div className={styles.eyebrow}><span className={styles.eyebrowLine} /> INTERVIEW COMPLETE</div>
                <h1 id="report-heading">Interview Complete</h1>
                <p>Your performance, in focus. Here&apos;s what you showed and what to build on.</p>
              </div>
              <div className={styles.scoreCard}>
                <div className={styles.scoreMain}>
                  <span className={styles.scoreLabel}>OVERALL SCORE</span>
                  <div className={`${styles.scoreNumber} ${report.score >= 85 ? styles.scoreExcellent : report.score >= 70 ? styles.scoreGood : report.score >= 55 ? styles.scoreAdequate : styles.scoreWeak}`}>{report.score}<span>/100</span></div>
                </div>
                <div className={styles.scoreDivider} />
                <div className={styles.scoreVerdict}>
                  <span className={`${styles.verdictBadge} ${report.pass_fail === "Pass" ? styles.passBadge : styles.failBadge}`}>{report.pass_fail}</span>
                  <span className={styles.scoreVerdictCaption}>INTERVIEW RESULT</span>
                </div>
              </div>
              <div className={styles.reportGrid}>
                <section className={styles.reportSection}>
                  <div className={styles.reportSectionTitle}><span className={styles.goodIcon}>&#8599;</span><h2>Strengths</h2></div>
                  {report.strengths.length ? report.strengths.map((item, index) => (
                    <article className={styles.evidenceCard} key={`strength-${index}`}>
                      <p>{item.observation}</p><blockquote>&ldquo;{item.evidence}&rdquo;</blockquote>
                    </article>
                  )) : <p className={styles.emptyNote}>No specific strengths were identified in the answers.</p>}
                </section>
                <section className={styles.reportSection}>
                  <div className={styles.reportSectionTitle}><span className={styles.gapIcon}>&#8599;</span><h2>Areas for improvement</h2></div>
                  {report.weaknesses.length ? report.weaknesses.map((item, index) => (
                    <article className={styles.evidenceCard} key={`weakness-${index}`}>
                      <p>{item.observation}</p><blockquote>&ldquo;{item.evidence}&rdquo;</blockquote>
                    </article>
                  )) : <p className={styles.emptyNote}>No specific gaps were identified in the answers.</p>}
                </section>
              </div>
              <section className={styles.reviseSection}>
                <div className={styles.reportSectionTitle}><span className={styles.reviseIcon}>&#10033;</span><h2>Topics to revise</h2></div>
                {report.topics_to_revise.length ? (
                  <ul className={styles.reviseList}>{report.topics_to_revise.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul>
                ) : <p className={styles.emptyNote}>You covered the key areas for this topic.</p>}
              </section>
              <section className={styles.verdictSection}>
                <div className={styles.reportSectionTitle}><span className={styles.verdictIcon}>&ldquo;</span><h2>Interviewer&apos;s verdict</h2></div>
                <strong>{report.overall_verdict}</strong>
                <p>{report.pass_fail === "Pass" ? "You demonstrated a solid understanding of the topic at this difficulty." : "Use the feedback above to strengthen your understanding before your next interview."}</p>
              </section>
              <button className={`${styles.primaryButton} ${styles.newInterviewButton}`} type="button" onClick={startOver}>Start New Interview <span aria-hidden="true">&#8599;</span></button>
            </>
          )}
        </section>
      )}

      <footer className={styles.footer}>
        <span>BUILT FOR THE MOMENT BEFORE THE REAL THING.</span>
        <span>AI INTERVIEW COACH <span aria-hidden="true">&middot;</span> 2026</span>
      </footer>
    </main>
  );
}
