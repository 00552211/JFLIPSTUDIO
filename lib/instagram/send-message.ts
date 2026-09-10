const GRAPH_API_VERSION = "v25.0";

/**
 * Instagram DMへの返信送信。「Instagramログインによる API設定」で発行した
 * Instagram User Access Token を使う（Facebook Pageの連携は不要）。
 * 戻り値はMetaが発行するmessage id(mid)。
 */
export async function sendInstagramMessage(recipientId: string, text: string): Promise<string> {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!accessToken) throw new Error("INSTAGRAM_ACCESS_TOKEN is not set");

  const res = await fetch(`https://graph.instagram.com/${GRAPH_API_VERSION}/me/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text },
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Instagram send failed: ${res.status} ${JSON.stringify(data)}`);
  }
  return data.message_id as string;
}
