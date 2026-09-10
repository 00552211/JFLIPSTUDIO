import { GoogleGenAI } from "@google/genai";
import { STUDIO_SYSTEM_PROMPT } from "@/lib/studio/context";

const MODEL = "gemini-3.8-flash";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export type ChatTurn = { role: "user" | "assistant"; content: string };

const FALLBACK_REPLY =
  "お問い合わせありがとうございます！担当が確認して追ってご連絡しますので、少々お待ちください🙏";

/** 直近の会話履歴からDM返信文を1通生成する。historyの末尾は必ずuserであること。 */
export async function generateInstagramReply(history: ChatTurn[]): Promise<string> {
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: history.map((turn) => ({
      role: turn.role === "assistant" ? "model" : "user",
      parts: [{ text: turn.content }],
    })),
    config: {
      systemInstruction: STUDIO_SYSTEM_PROMPT,
    },
  });

  const text = response.text?.trim();
  return text || FALLBACK_REPLY;
}
