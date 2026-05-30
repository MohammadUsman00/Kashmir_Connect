import { NextResponse } from "next/server";

export const runtime = "nodejs";

const languageMap: Record<string, string> = {
  en: "en",
  ur: "ur",
  hi: "hi",
  ks: "ur"
};

export async function POST(request: Request): Promise<Response> {
  try {
    const formData = await request.formData();
    const audio = formData.get("audio");
    const language = String(formData.get("language") ?? "en");

    if (!(audio instanceof File)) {
      return NextResponse.json({ error: "Audio file missing" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OPENAI_API_KEY is not configured" }, { status: 500 });
    }

    const whisperPayload = new FormData();
    whisperPayload.append("file", audio, audio.name || "voice.webm");
    whisperPayload.append("model", "whisper-1");
    whisperPayload.append("language", languageMap[language] ?? "en");
    whisperPayload.append("response_format", "json");

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`
      },
      body: whisperPayload
    });

    if (!response.ok) {
      const detail = await response.text();
      return NextResponse.json({ error: "Voice transcription failed", detail }, { status: 502 });
    }

    const data = (await response.json()) as { text?: string; language?: string };
    return NextResponse.json({
      text: data.text ?? "",
      language: data.language ?? language
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Voice API error" },
      { status: 500 }
    );
  }
}
