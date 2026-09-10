import { NextResponse } from "next/server";
import { isValidInstagramSignature } from "@/lib/instagram/verify-signature";
import { sendInstagramMessage } from "@/lib/instagram/send-message";
import { generateInstagramReply, type ChatTurn } from "@/lib/claude/generate-reply";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

const HISTORY_LIMIT = 12;

/** Meta App設定画面でWebhook URLを登録する際に一度だけ叩かれる疎通確認。 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && challenge && token === process.env.INSTAGRAM_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

type InstagramMessagingEvent = {
  sender: { id: string };
  recipient: { id: string };
  message?: {
    mid: string;
    text?: string;
    is_echo?: boolean;
    is_deleted?: boolean;
  };
};

type InstagramWebhookBody = {
  entry?: { messaging?: InstagramMessagingEvent[] }[];
};

export async function POST(request: Request) {
  // 署名検証にはパース前の生ボディが必要（JSON.parse後の再stringifyはバイト列が変わり失敗する）
  const rawBody = await request.text();

  const appSecret = process.env.INSTAGRAM_APP_SECRET;
  if (!appSecret) {
    console.error("[instagram-webhook] INSTAGRAM_APP_SECRET is not set");
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  const signature = request.headers.get("x-hub-signature-256");
  if (!isValidInstagramSignature(rawBody, signature, appSecret)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 403 });
  }

  let body: InstagramWebhookBody;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const events = (body.entry ?? []).flatMap((entry) => entry.messaging ?? []);
  const supabase = createServiceClient();

  for (const event of events) {
    try {
      await handleMessagingEvent(supabase, event);
    } catch (e) {
      // Metaには常に200を返す。失敗をここで握りつぶさないとMetaがリトライを繰り返し、
      // 二重送信や無限ループの原因になる。障害検知はログで行う。
      console.error("[instagram-webhook] failed to handle event", e);
    }
  }

  return NextResponse.json({ ok: true });
}

async function handleMessagingEvent(
  supabase: ReturnType<typeof createServiceClient>,
  event: InstagramMessagingEvent,
) {
  const message = event.message;
  if (!message || message.is_deleted) return;

  const text = message.text?.trim();
  if (!text) return; // スタンプ・画像・リアクションなどテキスト以外は今回は対象外

  if (message.is_echo) {
    await handleEcho(supabase, event.recipient.id, message.mid, text);
  } else {
    await handleIncomingUserMessage(supabase, event.sender.id, text);
  }
}

/**
 * echo = このアカウントから送信されたメッセージの通知。
 * mid が instagram_messages に既に記録されていればbot自身が送った返信なので無視。
 * 記録がなければ、スタッフがInstagramアプリから手動送信したメッセージということなので、
 * botが横から割り込まないようスレッドを一時停止する（再開はSupabaseの管理画面から手動で行う）。
 */
async function handleEcho(
  supabase: ReturnType<typeof createServiceClient>,
  customerId: string,
  mid: string,
  text: string,
) {
  const { data: existing } = await supabase
    .from("instagram_messages")
    .select("id")
    .eq("mid", mid)
    .maybeSingle();
  if (existing) return;

  await supabase.from("instagram_threads").upsert({ sender_id: customerId, is_paused: true });
  await supabase
    .from("instagram_messages")
    .insert({ sender_id: customerId, role: "assistant", content: text, mid });
}

async function handleIncomingUserMessage(
  supabase: ReturnType<typeof createServiceClient>,
  senderId: string,
  text: string,
) {
  const { data: thread } = await supabase
    .from("instagram_threads")
    .upsert({ sender_id: senderId, last_message_at: new Date().toISOString() }, { onConflict: "sender_id" })
    .select("is_paused")
    .single();

  await supabase.from("instagram_messages").insert({ sender_id: senderId, role: "user", content: text });

  if (thread?.is_paused) return; // スタッフ対応中はbotが返信しない

  const { data: recent } = await supabase
    .from("instagram_messages")
    .select("role, content")
    .eq("sender_id", senderId)
    .order("created_at", { ascending: false })
    .limit(HISTORY_LIMIT);

  const history: ChatTurn[] = (recent ?? [])
    .reverse()
    .map((row) => ({ role: row.role as "user" | "assistant", content: row.content as string }));

  const replyText = await generateInstagramReply(history);
  const mid = await sendInstagramMessage(senderId, replyText);

  await supabase
    .from("instagram_messages")
    .insert({ sender_id: senderId, role: "assistant", content: replyText, mid });
}
