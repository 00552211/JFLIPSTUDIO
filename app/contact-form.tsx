"use client";

import { useState } from "react";

const TO = "jfliponthegame@gmail.com";

/** 送信先のサーバーは持たず、入力内容を入れた状態でメールアプリを開く */
export function ContactForm() {
  const [sent, setSent] = useState(false);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.currentTarget).entries()) as Record<string, string>;
    const body = `お名前: ${d.name}\nメール: ${d.email}\nご用件: ${d.topic}\n\n${d.message}`;
    location.href = `mailto:${TO}?subject=${encodeURIComponent(`【JFLIPSTUDIO】お問い合わせ / ${d.name}`)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  };

  return (
    <form className="cform rv" style={{ "--d": ".1s" } as React.CSSProperties} onSubmit={onSubmit}>
      <label className="cf"><span>お名前 / アーティスト名 <i>必須</i></span><input type="text" name="name" required autoComplete="name" placeholder="山田 太郎 / アーティスト名" /></label>
      <label className="cf"><span>メールアドレス <i>必須</i></span><input type="email" name="email" required autoComplete="email" placeholder="you@example.com" /></label>
      <label className="cf"><span>ご用件</span>
        <select name="topic" defaultValue="スタジオのご予約について">
          <option>スタジオのご予約について</option>
          <option>MIX / マスタリングのご依頼</option>
          <option>料金について</option>
          <option>機材について</option>
          <option>その他</option>
        </select>
      </label>
      <label className="cf"><span>お問い合わせ内容 <i>必須</i></span><textarea name="message" rows={6} required placeholder="ご希望の日時、制作内容（レコーディング / MIX / マスタリング）をご記入ください。" /></label>
      <button type="submit" className="btn btn-primary cbtn"><span>送信する</span></button>
      {sent && <p className="cmsg">メールアプリが開きます。そのまま送信してください。</p>}
    </form>
  );
}
