"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { KCBadge, KCButton, KCCard } from "@kashmir/ui";
import type { AssistantLanguage, AssistantMode } from "@/lib/ai/prompts";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type ToolMessage = {
  id: string;
  name: string;
  payload: unknown;
};

const modeTabs: Array<{ id: AssistantMode; label: string }> = [
  { id: "TOURIST_GUIDE", label: "Tourist" },
  { id: "EMERGENCY", label: "Emergency" },
  { id: "MERCHANT_ADVISOR", label: "Merchant" },
  { id: "STUDENT_HELPER", label: "Student" },
  { id: "GOVERNMENT_GUIDE", label: "Government" }
];

const languages: Array<{ id: AssistantLanguage; label: string }> = [
  { id: "en", label: "English" },
  { id: "ur", label: "اردو" },
  { id: "hi", label: "हिंदी" },
  { id: "ks", label: "کٲشُر" }
];

const suggestedPrompts = [
  "Plan my 5-day trip to Kashmir",
  "Find nearest hospital to Gulmarg",
  "Best Wazwan restaurants in Srinagar",
  "How to register a business in J&K"
];

function makeId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function parseSSEChunk(buffer: string): {
  events: Array<{ event: string; data: unknown }>;
  remainder: string;
} {
  const events: Array<{ event: string; data: unknown }> = [];
  const parts = buffer.split("\n\n");
  const remainder = parts.pop() ?? "";

  for (const part of parts) {
    const lines = part.split("\n");
    const eventLine = lines.find((line) => line.startsWith("event:"));
    const dataLine = lines.find((line) => line.startsWith("data:"));
    if (!eventLine || !dataLine) continue;
    const event = eventLine.replace("event:", "").trim();
    const raw = dataLine.replace("data:", "").trim();
    try {
      events.push({ event, data: JSON.parse(raw) });
    } catch {
      events.push({ event, data: { text: raw } });
    }
  }

  return { events, remainder };
}

function browserLanguageToAssistantLanguage(): AssistantLanguage {
  const lang = (navigator.language || "en").toLowerCase();
  if (lang.startsWith("ur")) return "ur";
  if (lang.startsWith("hi")) return "hi";
  if (lang.startsWith("ks")) return "ks";
  return "en";
}

function isRTL(language: AssistantLanguage): boolean {
  return language === "ur" || language === "ks";
}

export function KashmirAssistant(): JSX.Element {
  const [open, setOpen] = React.useState(false);
  const [mode, setMode] = React.useState<AssistantMode>("TOURIST_GUIDE");
  const [language, setLanguage] = React.useState<AssistantLanguage>("en");
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [toolMessages, setToolMessages] = React.useState<ToolMessage[]>([]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [recording, setRecording] = React.useState(false);
  const [voiceEnabled, setVoiceEnabled] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);

  const sessionId = React.useMemo(() => {
    if (typeof window === "undefined") return "server-session";
    const key = "kc-ai-session-id";
    const existing = window.localStorage.getItem(key);
    if (existing) return existing;
    const next = `sess-${makeId()}`;
    window.localStorage.setItem(key, next);
    return next;
  }, []);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setLanguage(browserLanguageToAssistantLanguage());
    }
  }, []);

  React.useEffect(() => {
    const panel = document.getElementById("kc-ai-scroll");
    if (panel) panel.scrollTop = panel.scrollHeight;
  }, [messages, toolMessages, loading]);

  const speakText = React.useCallback(
    (text: string) => {
      if (!voiceEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) return;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang =
        language === "ur" ? "ur-PK" : language === "hi" ? "hi-IN" : language === "ks" ? "ur-PK" : "en-US";
      utterance.rate = 1;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    },
    [language, voiceEnabled]
  );

  const streamChat = React.useCallback(
    async (nextMessages: ChatMessage[]) => {
      setLoading(true);
      setError(null);
      const assistantId = makeId();
      setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }]);

      try {
        const response = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode,
            language,
            messages: nextMessages.map((message) => ({ role: message.role, content: message.content })),
            sessionId
          })
        });

        if (!response.ok || !response.body) {
          const detail = await response.text();
          throw new Error(detail || "Failed to connect AI assistant");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let finalText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parsed = parseSSEChunk(buffer);
          buffer = parsed.remainder;

          for (const evt of parsed.events) {
            if (evt.event === "message") {
              const text = String((evt.data as { text?: string }).text ?? "");
              finalText += text;
              setMessages((prev) =>
                prev.map((message) => (message.id === assistantId ? { ...message, content: finalText } : message))
              );
            } else if (evt.event === "tool_result") {
              const payload = evt.data as { name?: string; result?: unknown };
              setToolMessages((prev) => [
                ...prev,
                { id: makeId(), name: payload.name ?? "tool", payload: payload.result ?? payload }
              ]);
            } else if (evt.event === "error") {
              const message = String((evt.data as { message?: string }).message ?? "AI stream error");
              setError(message);
            }
          }
        }

        if (finalText.trim()) {
          speakText(finalText.slice(0, 500));
        }
      } catch (streamError) {
        setError(streamError instanceof Error ? streamError.message : "Failed to stream assistant response");
      } finally {
        setLoading(false);
      }
    },
    [language, mode, sessionId, speakText]
  );

  const submitMessage = React.useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || loading) return;
      const userMessage: ChatMessage = { id: makeId(), role: "user", content };
      const nextMessages = [...messages, userMessage];
      setMessages(nextMessages);
      setInput("");
      await streamChat(nextMessages);
    },
    [loading, messages, streamChat]
  );

  const onVoiceRecord = React.useCallback(async () => {
    try {
      if (!recording) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        chunksRef.current = [];
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) chunksRef.current.push(event.data);
        };
        recorder.onstop = async () => {
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          const form = new FormData();
          form.append("audio", blob, "voice.webm");
          form.append("language", language);

          try {
            const response = await fetch("/api/ai/voice", { method: "POST", body: form });
            if (!response.ok) throw new Error("Voice transcription failed");
            const data = (await response.json()) as { text?: string };
            const text = data.text?.trim();
            if (text) {
              setInput(text);
              await submitMessage(text);
            }
          } catch (voiceError) {
            setError(voiceError instanceof Error ? voiceError.message : "Voice failed");
          }
        };

        mediaRecorderRef.current = recorder;
        recorder.start();
        setRecording(true);
      } else {
        mediaRecorderRef.current?.stop();
        setRecording(false);
      }
    } catch (voiceError) {
      setError(voiceError instanceof Error ? voiceError.message : "Microphone access denied");
      setRecording(false);
    }
  }, [language, recording, submitMessage]);

  const clearConversation = React.useCallback(async () => {
    setMessages([]);
    setToolMessages([]);
    setError(null);
    await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "clear",
        mode,
        language,
        messages: [],
        sessionId
      })
    });
  }, [language, mode, sessionId]);

  const dir = isRTL(language) ? "rtl" : "ltr";

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => setOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#3D1F0D] text-xl text-[#FAF6EF] shadow-xl dark:bg-[#C8972A] dark:text-[#111827]"
        aria-label="Toggle Kashmir Assistant"
      >
        ⛰️
      </motion.button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 180, damping: 20 }}
            className="fixed bottom-24 right-6 z-50 w-[min(94vw,430px)]"
            dir={dir}
          >
            <KCCard className="space-y-3 bg-white/95 shadow-2xl backdrop-blur-md dark:bg-[#0b1628]/95">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-[#3D1F0D] dark:text-[#f3dfbb]">Kashmir AI Assistant</h3>
                <div className="flex gap-2">
                  <KCButton size="sm" variant="ghost" onClick={() => setVoiceEnabled((prev) => !prev)}>
                    Voice {voiceEnabled ? "On" : "Off"}
                  </KCButton>
                  <KCButton size="sm" variant="ghost" onClick={clearConversation}>
                    Clear
                  </KCButton>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-1">
                {modeTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setMode(tab.id)}
                    className={`rounded-lg px-2 py-1 text-[11px] ${
                      mode === tab.id
                        ? "bg-[#3D1F0D] text-[#FAF6EF] dark:bg-[#C8972A] dark:text-[#111827]"
                        : "bg-[#efe4d2] text-[#3D1F0D] dark:bg-[#1b2e45] dark:text-[#d5e2f4]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                {languages.map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => setLanguage(lang.id)}
                    className={`rounded-full px-3 py-1 text-xs ${
                      language === lang.id
                        ? "bg-[#1B6CA8] text-white"
                        : "bg-[#ede1ce] text-[#3D1F0D] dark:bg-[#1d324a] dark:text-[#cde0f4]"
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>

              <div id="kc-ai-scroll" className="max-h-[380px] space-y-2 overflow-y-auto rounded-xl bg-[#f7f0e5] p-3 dark:bg-[#101d31]">
                {messages.length === 0 ? (
                  <div className="space-y-3">
                    <p className="text-xs text-[#6f5d4f] dark:text-[#a8b9d0]">Suggested prompts</p>
                    <div className="grid gap-2">
                      {suggestedPrompts.map((prompt) => (
                        <button
                          key={prompt}
                          onClick={() => void submitMessage(prompt)}
                          className="rounded-lg bg-white px-3 py-2 text-left text-sm text-[#3D1F0D] shadow-sm hover:bg-[#fff8ef] dark:bg-[#15233a] dark:text-[#d8e5f5] dark:hover:bg-[#1b2f4a]"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`rounded-xl px-3 py-2 text-sm ${
                      message.role === "user"
                        ? "ml-8 bg-[#3D1F0D] text-[#FAF6EF] dark:bg-[#C8972A] dark:text-[#111827]"
                        : "mr-8 bg-white text-[#3D1F0D] dark:bg-[#1a2c44] dark:text-[#d8e5f5]"
                    }`}
                  >
                    <ReactMarkdown>{message.content || (message.role === "assistant" && loading ? "..." : "")}</ReactMarkdown>
                  </div>
                ))}

                {toolMessages.slice(-6).map((toolMessage) => (
                  <div key={toolMessage.id} className="mr-8 space-y-1 rounded-xl border border-[#d8c8b0] bg-[#fffaf2] px-3 py-2 text-xs dark:border-[#2b415d] dark:bg-[#15263f]">
                    <KCBadge variant="sector">{toolMessage.name}</KCBadge>
                    <pre className="overflow-x-auto whitespace-pre-wrap text-[11px]">
                      {JSON.stringify(toolMessage.payload, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>

              {error ? <p className="text-xs text-[#C0392B]">{error}</p> : null}

              <form
                className="flex items-end gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  void submitMessage(input);
                }}
              >
                <textarea
                  rows={2}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Ask about trips, emergency help, merchants, students, or government services..."
                  className="min-h-[72px] flex-1 rounded-xl border border-[#d8c8b0] bg-white px-3 py-2 text-sm outline-none dark:border-[#28415f] dark:bg-[#101f32]"
                />
                <div className="flex flex-col gap-2">
                  <motion.button
                    type="button"
                    onClick={() => void onVoiceRecord()}
                    animate={recording ? { scale: [1, 1.06, 1], opacity: [1, 0.8, 1] } : { scale: 1, opacity: 1 }}
                    transition={recording ? { duration: 0.8, repeat: Infinity } : undefined}
                    className={`rounded-xl px-3 py-2 text-sm ${
                      recording ? "bg-[#C0392B] text-white" : "bg-[#1B6CA8] text-white"
                    }`}
                  >
                    {recording ? "Stop" : "Voice"}
                  </motion.button>
                  <KCButton type="submit" size="sm" loading={loading}>
                    Send
                  </KCButton>
                </div>
              </form>
            </KCCard>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
