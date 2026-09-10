import crypto from "crypto";

/**
 * MetaのWebhook署名検証。X-Hub-Signature-256ヘッダーと、パース前の
 * 生のリクエストボディ(rawBody)を渡すこと。JSON.parse後に再度
 * stringifyしたものを渡すとバイト列が変わり検証に失敗する。
 */
export function isValidInstagramSignature(
  rawBody: string,
  signatureHeader: string | null,
  appSecret: string,
): boolean {
  if (!signatureHeader) return false;

  const [algo, signature] = signatureHeader.split("=");
  if (algo !== "sha256" || !signature) return false;

  const expected = crypto.createHmac("sha256", appSecret).update(rawBody, "utf8").digest("hex");
  const expectedBuf = Buffer.from(expected, "hex");
  const actualBuf = Buffer.from(signature, "hex");

  if (expectedBuf.length !== actualBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}
