import Anthropic from "@anthropic-ai/sdk";
import type { AssistantLanguage, AssistantMode } from "./prompts";
import { getSystemPrompt } from "./prompts";
import { anthropicTools, executeTool } from "./tools";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type AgentEvent =
  | { type: "text"; text: string }
  | { type: "tool_result"; name: string; result: unknown }
  | { type: "done"; fullText: string };

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

function toAnthropicMessages(messages: ChatMessage[]): Anthropic.MessageParam[] {
  return messages.map((message) => ({
    role: message.role,
    content: message.content
  }));
}

type StreamArgs = {
  mode: AssistantMode;
  language: AssistantLanguage;
  messages: ChatMessage[];
  facts?: string;
};

export async function* streamAssistantResponse(args: StreamArgs): AsyncGenerator<AgentEvent, void, unknown> {
  const system = getSystemPrompt(args.mode, args.language, args.facts);
  const conversation: Anthropic.MessageParam[] = toAnthropicMessages(args.messages);
  let finalText = "";

  for (let round = 0; round < 5; round += 1) {
    const stream = client.messages.stream({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1200,
      system,
      tools: anthropicTools,
      messages: conversation
    });

    let textChunk = "";
    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        textChunk += event.delta.text;
        yield { type: "text", text: event.delta.text };
      }
    }

    const finalMessage = await stream.finalMessage();
    const toolUses = finalMessage.content.filter((block: { type: string }) => block.type === "tool_use") as Array<{
      id: string;
      name: string;
      input: unknown;
    }>;
    finalText += textChunk;

    if (toolUses.length === 0) {
      yield { type: "done", fullText: finalText.trim() };
      return;
    }

    conversation.push({
      role: "assistant",
      content: finalMessage.content
    });

    for (const toolUse of toolUses) {
      const toolResult = await executeTool(toolUse.name, (toolUse.input as Record<string, unknown>) ?? {});
      yield { type: "tool_result", name: toolUse.name, result: toolResult.data };

      conversation.push({
        role: "user",
        content: [
          {
            type: "tool_result",
            tool_use_id: toolUse.id,
            content: JSON.stringify(toolResult.data)
          }
        ]
      });
    }
  }

  yield { type: "done", fullText: finalText.trim() };
}
