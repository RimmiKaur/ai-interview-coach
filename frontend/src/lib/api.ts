const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? ""
).trim().replace(/\/+$/, "");

export type Difficulty = "Easy" | "Medium" | "Hard";
export type Turn = { role: "interviewer" | "candidate"; content: string };

export type InterviewTurn = {
  message: string;
  ended: boolean;
};

export type EvidenceItem = {
  observation: string;
  evidence: string;
};

export type InterviewReport = {
  score: number;
  strengths: EvidenceItem[];
  weaknesses: EvidenceItem[];
  topics_to_revise: string[];
  overall_verdict: "Excellent" | "Good" | "Adequate" | "Weak";
  pass_fail: "Pass" | "Fail";
};

type InterviewInput = {
  topic: string;
  difficulty: Difficulty;
};

type TranscriptInput = InterviewInput & {
  conversation: Turn[];
};

async function post<T>(path: string, body: unknown): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error("The backend URL is not configured. Set NEXT_PUBLIC_API_URL and redeploy the frontend.");
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(`Could not reach the interview server at ${API_BASE_URL}. Make sure the FastAPI backend is running.`);
  }

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { detail?: string } | null;
    throw new Error(error?.detail ?? `Interview API request failed (${response.status}).`);
  }

  return response.json() as Promise<T>;
}

export function startInterview(input: InterviewInput): Promise<InterviewTurn> {
  return post("/interviews/start", input);
}

export function submitAnswer(input: TranscriptInput): Promise<InterviewTurn> {
  return post("/interviews/answer", input);
}

export function generateReport(input: TranscriptInput): Promise<InterviewReport> {
  return post("/reports", input);
}
