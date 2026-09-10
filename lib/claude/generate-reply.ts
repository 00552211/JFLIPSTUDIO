import Anthropic from "@anthropic-ai/sdk";
import { STUDIO_SYSTEM_PROMPT } from "@/lib/studio/context";

const client = new Anthropic();

export type ChatTurn = { role: "user" | "assistant"; content: string };

const FALLBACK_REPLY =
  "お問い合わせありがとうございます！担当が確認して追ってご連絡しますので、少々お待ちください🙏";

/** 直近の会話履歴からDM返信文を1通生成する。historyの末尾は必ずuserであること。 */
export async function generateInstagramReply(history: ChatTurn[]): Promise<string> {
  const response = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 1024,
    system: STUDIO_SYSTEM_PROMPT,
    messages: history.map((turn) => ({ role: turn.role, content: turn.content })),
  });

  const textBlock = response.content.find((block): block is Anthropic.TextBlock => block.type === "text");
  const text = textBlock?.text.trim();
  return text || FALLBACK_REPLY;
}
