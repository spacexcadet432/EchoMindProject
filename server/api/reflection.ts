import { createSupabaseForRequest } from "../lib/supabaseServer";

type RequestLike = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
};

type ResponseLike = {
  status: (code: number) => ResponseLike;
  json: (payload: unknown) => void;
};

type ReflectionRequestBody = {
  content?: string;
  clientSubmissionId?: string;
};

const ECHOMIND_SYSTEM_PROMPT = `--- SESSION CONTEXT ---
Patient: {{patient_name}}
Therapist: {{therapist_name}}
Session: {{session_number}} of {{total_sessions}}
Focus area: {{focus_area}}
Therapist note: {{therapist_note}}
Current stage: {{current_stage}}
Previous session summary: {{previous_summary}}
--- END CONTEXT ---
You are EchoMind.
A structured reflection system used between therapy sessions.
Not a therapist. You do not diagnose, interpret, advise, reassure, or resolve.
Your only function: help the user arrive at one specific thing to bring to their therapist
that they did not know before this session began. That is the only definition of success.

Read the session context block above before proceeding.
Use focus_area and therapist_note as a quiet lens - let them shape what you follow,
not what you ask. Never name them to the user. Never say 'your therapist told me.'

=== SESSION FLOW ===
Follow stages in strict order. Do not skip. Do not reverse.
current_stage is provided in the session context. Begin from that stage.

STAGE 1 - ENTRY
If session_number = 1 or previous_summary = none:
  Say exactly: "What's been sitting with you since your last session?"
If session_number > 1 and previous_summary exists:
  Say exactly: "Last time you were working through [topic from previous_summary].
  Has anything shifted with that, or is something else on your mind?"
One question only. Wait.

STAGE 2 - SITUATION
Goal: one concrete specific thing on the table.
Concrete = a specific moment, event, or exchange. Not a general feeling.
If user gives multiple things: ask which feels heaviest. Follow only that.
If user is vague: ask for one specific moment from the past week.
Do not advance to Stage 3 until something concrete exists.

STAGE 3 - EXPLORATION
3-4 questions. One at a time. Wait fully between each.
Every question goes inward: what they noticed, felt, thought, or did not do.
Use only the user's own words when referencing what they shared.
Never substitute a label for their word. Never interpret.
Inward questions: 'What was going through you in that moment?'
                  'What did you not say that you wanted to?'
                  'Where did you feel that - head or body?'
                  'What part do you keep coming back to?'

STAGE 4 - NOTICING
Two moves only:
Move 1: Reflect one phrase the user used. Their exact words. Not a summary.
        Format: "You said '[exact phrase]' - and you came back to that more than once."
        No interpretation. Just name that it was there.
Move 2: "Does any of this connect to something you've been working on with {{therapist_name}}?"
        If user says no: accept it. Move to Stage 5.
        If user says yes: one more inward question. Then Stage 5.

STAGE 5 - PREPARATION
Ask exactly: "What from today would you want to bring to your next session
with {{therapist_name}}?"
Do not suggest. Do not reflect back content as a prompt. Let them choose.
If stuck: "Even something small - one thought, one moment. What stayed with you?"
If still nothing: accept it. Move to Stage 6.

STAGE 6 - CLOSE
Say exactly: "This session is saved. {{therapist_name}} will see a summary before
your next appointment. You can close this whenever you're ready."
Nothing else. No variation.

=== RESPONSE RULES ===
Length: max 3 sentences in Stages 1-4. Max 2 sentences in Stages 5-6.
Questions: exactly 1 per response. Always last sentence. No compound questions.
Tone: calm, precise, restrained. One register below the user. Never perform warmth.
Match user length. A short response gets a short response.

=== INTERNAL CHECK (run before every response) ===
1. Validating before understood? -> remove validation.
2. Using a label user didn't use? -> use their word.
3. Giving advice? -> convert to inward question.
4. Asking about facts not experience? -> shift inward.
5. Question answerable in one word? -> rewrite.
6. Two question marks? -> remove one.
7. Over 3 sentences? -> cut last sentence.

=== CONVERSATION LOGIC ===
Overwhelmed (many things at once): ask which is heaviest. Follow one only.
Vague: ask for one specific moment, not clarification of the vague thing.
Analytical/theoretical: ignore theory. Ask about last real situation where it occurred.
Repeating: reflect exact phrase. Ask what it feels like to keep coming back to that.
Very short answers: question was too big. Ask smaller adjacent version.
Oversharing: pick the detail they spent most words on. Let the rest go.
Asks for advice: "That's something to explore with {{therapist_name}}.
               What does your own read of it tell you?"
Asks for judgment: "I'm not the right one to answer that.
                 What does your own read of it tell you?"
Topic switch: follow once. If again: "You mentioned [first thing] earlier.
             Is that still where you want to focus?"

=== FAILURE GUARDRAILS ===
No concrete situation after 3 Stage 2 turns:
  Say: "Think about one specific moment this week - a conversation, a feeling,
  a moment where something shifted. Describe just that moment."

User looping (same phrase 2+ times):
  Say: "You've come back to '[exact phrase]' a few times.
  What is it about that that keeps pulling you back?"

Session at 8+ user turns and not yet at Stage 5:
  Move to Stage 5. Say: "We're getting close to the end of this session.
  What's the one thing from today you'd want to bring to {{therapist_name}}?"

Response contains advice ('you could', 'you might', 'have you tried'):
  Delete the sentence. Replace with the inward question underneath it.

Banned phrases - delete any sentence containing:
  'I understand how hard', 'I hear you', 'that makes sense',
  'you're doing well', 'great insight', 'let's explore together',
  'as an AI', 'it sounds like you might be experiencing',
  'remember to be kind to yourself', 'take care of yourself'.

=== CRISIS PROTOCOL ===
BACKEND HANDLES THIS FIRST. This is a backup layer only.
If user mentions self-harm, suicidal thoughts, abuse, or immediate danger:
Stop. Do not continue. Do not ask another question.
Respond with exactly:
"I want to make sure you're safe right now.
 Please reach out to iCall: 9152987821,
 or Vandrevala Foundation: 1860-2662-345. Both free, available now.
 Your therapist is the right person to support you through this.
 You can close this session whenever you're ready."
After this: session ends. No further responses.

=== IDENTITY ===
You are not supportive in a performed way.
You are a structured space that holds one thing at a time
and helps the user see it clearly enough to name it.
The user leaves knowing what they want to say to their therapist.
That is the session. That is all of it.`;

const readBearerToken = (headers: RequestLike["headers"]) => {
  const raw = headers.authorization ?? headers.Authorization;
  const header = Array.isArray(raw) ? raw[0] : raw;
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  if (!scheme || !token || scheme.toLowerCase() !== "bearer") return null;
  return token;
};

const fallbackAiResponse = "What feels most important to bring into your next session?";
const CRISIS_RESPONSE = `I want to make sure you're safe right now.

Please reach out to iCall: 9152987821, or the Vandrevala Foundation helpline: 1860-2662-345. Both are free and available now.

Your therapist is the right person to support you through this. You can close this session whenever you're ready.`;

const crisisPattern =
  /\b(suicide|suicidal|self[-\s]?harm|kill myself|want to die|end my life|abuse|being abused|immediate danger)\b/i;

const generateOpenAIResponse = async (
  systemPrompt: string,
  history: Array<{ role: "user" | "assistant"; content: string }>,
) => {
  if (!process.env.OPENAI_API_KEY) return fallbackAiResponse;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      temperature: 0.3,
      messages: [{ role: "system", content: systemPrompt }, ...history.map((m) => ({ role: m.role, content: m.content }))],
    }),
  });

  if (!response.ok) return fallbackAiResponse;
  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return payload.choices?.[0]?.message?.content?.trim() || fallbackAiResponse;
};

const loadActiveSessionAndValidateOwnership = async (
  supabase: ReturnType<typeof createSupabaseForRequest>,
  userId: string,
) => {
  const { data: activeSessionData, error: activeSessionError } = await supabase.rpc("get_active_session");
  if (activeSessionError) return { error: { status: 500, message: "Failed to fetch active session" } };

  const activeSession = Array.isArray(activeSessionData) ? activeSessionData[0] : activeSessionData;
  if (!activeSession?.session_id) {
    return { error: { status: 403, message: "No active session assigned" } };
  }

  const sessionId = activeSession.session_id as string;

  const { data: ownershipSession, error: ownershipError } = await supabase
    .from("therapy_sessions")
    .select("id, session_number, session_block_id")
    .eq("id", sessionId)
    .single();

  if (ownershipError || !ownershipSession) return { error: { status: 500, message: "Failed session ownership validation" } };

  const { data: blockData, error: blockError } = await supabase
    .from("session_blocks")
    .select("id, mapping_id, total_sessions")
    .eq("id", ownershipSession.session_block_id as string)
    .single();

  if (blockError || !blockData) return { error: { status: 500, message: "Failed loading session block" } };

  const { data: mappingData, error: mappingError } = await supabase
    .from("therapist_patient_mapping")
    .select("id, patient_id, therapist_id, focus_area")
    .eq("id", blockData.mapping_id as string)
    .single();

  if (mappingError || !mappingData) return { error: { status: 500, message: "Failed loading mapping" } };

  if ((mappingData.patient_id as string) !== userId) {
    return { error: { status: 403, message: "Unauthorized access" } };
  }

  return { data: { sessionId } };
};

export const postReflectionHandler = async (req: RequestLike, res: ResponseLike) => {
  if (req.method && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token = readBearerToken(req.headers);
  if (!token) {
    return res.status(401).json({ error: "Missing bearer token" });
  }

  const body = (req.body ?? {}) as ReflectionRequestBody;
  const content = body.content?.trim() ?? "";
  const clientSubmissionId = body.clientSubmissionId?.trim() || null;

  if (!content) {
    return res.status(400).json({ error: "content is required" });
  }

  const supabase = createSupabaseForRequest(token);

  // 1) check session gate
  const { data: gateData, error: gateError } = await supabase.rpc("can_user_enter_reflection");
  if (gateError) {
    return res.status(500).json({ error: "Failed reflection access check" });
  }

  const gate = Array.isArray(gateData) ? gateData[0] : gateData;
  if (!gate?.allowed) {
    return res.status(403).json({ error: "No active session assigned" });
  }

  // Identify caller to stamp user_id on thread creation.
  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authData.user) {
    return res.status(401).json({ error: "Invalid auth session" });
  }

  const userId = authData.user.id;
  const ownership = await loadActiveSessionAndValidateOwnership(supabase, userId);
  if (ownership.error) {
    return res.status(ownership.error.status).json({ error: ownership.error.message });
  }
  const { sessionId } = ownership.data;

  // 2) get or create thread (query reflection_threads, not RPC)
  const { data: existingThread, error: threadReadError } = await supabase
    .from("reflection_threads")
    .select("id")
    .eq("therapy_session_id", sessionId)
    .eq("status", "active")
    .maybeSingle();

  if (threadReadError) {
    return res.status(500).json({ error: "Failed to load reflection thread" });
  }

  let threadId = existingThread?.id as string | undefined;
  if (!threadId) {
    const { data: createdThread, error: createThreadError } = await supabase
      .from("reflection_threads")
      .insert({
        therapy_session_id: sessionId,
        user_id: userId,
        status: "active",
      })
      .select("id")
      .single();

    if (createThreadError) {
      return res.status(500).json({ error: "Failed to create reflection thread" });
    }

    threadId = createdThread.id as string;
  }

  // Edge case: duplicate submission prevention by idempotency key.
  if (clientSubmissionId) {
    const { data: duplicateTurn, error: duplicateCheckError } = await supabase
      .from("reflection_turns")
      .select("id")
      .eq("thread_id", threadId)
      .eq("role", "user")
      .eq("client_submission_id", clientSubmissionId)
      .maybeSingle();

    if (duplicateCheckError) {
      return res.status(500).json({ error: "Failed duplicate check" });
    }

    if (duplicateTurn) {
      return res.status(409).json({ error: "Duplicate submission detected" });
    }
  }

  // 3) insert user turn
  const { data: userTurn, error: userTurnError } = await supabase
    .from("reflection_turns")
    .insert({
      thread_id: threadId,
      role: "user",
      content,
      client_submission_id: clientSubmissionId,
    })
    .select("id, role, content, created_at")
    .single();

  if (userTurnError) {
    return res.status(500).json({ error: "Failed to save user entry" });
  }

  if (crisisPattern.test(content)) {
    const { error: crisisInsertError } = await supabase.from("reflection_turns").insert({
      thread_id: threadId,
      role: "ai",
      content: CRISIS_RESPONSE,
    });
    if (crisisInsertError) {
      return res.status(500).json({ error: "Failed to save crisis response" });
    }
    return res.status(200).json({
      sessionId,
      threadId,
      reply: CRISIS_RESPONSE,
    });
  }

  const { data: recentTurns } = await supabase
    .from("reflection_turns")
    .select("role, content")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: false })
    .neq("id", userTurn.id as string)
    .limit(10);

  const orderedMemory = (recentTurns ?? []).reverse().map((turn) => ({
    role: turn.role === "ai" ? ("assistant" as const) : ("user" as const),
    content: turn.content as string,
  }));

  // 4) OpenAI (session-only memory: this thread only)
  const aiContent = await generateOpenAIResponse(ECHOMIND_SYSTEM_PROMPT, [
    ...orderedMemory,
    { role: "user", content },
  ]);

  // 5) insert AI turn
  const { data: aiTurn, error: aiTurnError } = await supabase
    .from("reflection_turns")
    .insert({
      thread_id: threadId,
      role: "ai",
      content: aiContent,
    })
    .select("id, role, content, created_at")
    .single();

  if (aiTurnError) {
    return res.status(500).json({ error: "Failed to save AI response" });
  }

  return res.status(200).json({
    sessionId,
    threadId,
    reply: aiTurn.content,
  });
};

export const getReflectionThreadHandler = async (req: RequestLike, res: ResponseLike) => {
  if (req.method && req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token = readBearerToken(req.headers);
  if (!token) {
    return res.status(401).json({ error: "Missing bearer token" });
  }

  const supabase = createSupabaseForRequest(token);

  // 1) get current user
  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authData.user) {
    return res.status(401).json({ error: "Invalid auth session" });
  }

  // 2) active session + ownership
  const ownership = await loadActiveSessionAndValidateOwnership(supabase, authData.user.id);
  if (ownership.error) {
    return res.status(ownership.error.status).json({ error: ownership.error.message });
  }
  const { sessionId } = ownership.data;

  // 3) get active thread for this exact active session only
  const { data: threadData, error: threadError } = await supabase
    .from("reflection_threads")
    .select("id")
    .eq("therapy_session_id", sessionId)
    .eq("status", "active")
    .maybeSingle();

  if (threadError) {
    return res.status(500).json({ error: "Failed to fetch reflection thread" });
  }

  if (!threadData?.id) {
    return res.status(200).json({
      sessionId,
      threadId: null,
      turns: [],
    });
  }

  const threadId = threadData.id as string;

  // 4) get ordered turns for active thread
  const { data: turnsData, error: turnsError } = await supabase
    .from("reflection_turns")
    .select("role, content, created_at")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  if (turnsError) {
    return res.status(500).json({ error: "Failed to fetch reflection turns" });
  }

  return res.status(200).json({
    sessionId,
    threadId,
    turns: turnsData ?? [],
  });
};

