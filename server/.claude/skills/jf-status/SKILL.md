---
name: jf-status
description: JFLIPSTUDIO SERVER の健康診断。バックアップ・Archive・Mixdown コピーの結果、空き容量、ディスクの健康、作業中/放置案件、Mac の最終同期をまとめて報告する。「サーバー大丈夫？」「状況教えて」「バックアップできてる？」などで使う。
---

# サーバー状況チェック

1. 状態を取得する（読み取りのみ・承認不要）:
   `powershell.exe -NoProfile -ExecutionPolicy Bypass -File windows/jf.ps1 status`
2. `problemsLast24h` に何かあれば、該当ログを確認して原因を特定する:
   `powershell.exe -NoProfile -ExecutionPolicy Bypass -File windows/jf.ps1 logs <backup|archive|mixdown> 80`
3. 日本語で報告する。形式:
   - 1行目: `✅ 問題なし` / `⚠️ 要確認` / `🚨 至急` と一言の理由
   - **要対応**（あれば、優先度順。各項目に「なぜ」と「提案するアクション」）
   - **状況**: 直近のバックアップ・Archive・Mixdown、各ドライブの空き（%）、作業中の案件数と容量、Archive 待ち（`_DONE` 済み）、60日放置の案件、Mac の最終同期、Dropbox アプリ
4. 対応が必要なら次の一手を提案する（例: 「Archive 待ちが 3 件あるので /jf-archive で確認しますか？」「バックアップを今すぐ再実行しますか？」）。
   **提案だけで、変更する操作は実行しない。** オーナーが OK したら実行する（`jf.ps1 run ...`）。

判定基準は `windows/daily-report-prompt.md` と同じ。
