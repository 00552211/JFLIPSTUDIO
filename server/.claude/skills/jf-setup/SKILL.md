---
name: jf-setup
description: JFLIPSTUDIO SERVER の構築を、今どこまで済んでいるかを自動で調べて、次にやる1ステップずつ案内する。「セットアップの続き」「次なにやればいい？」「構築を手伝って」などで使う。
---

# 構築ガイド（対話式）

手順の正本は `README.md`（Phase 0〜8、11、12）。あなたは状態を調べて「次の1ステップ」を案内する係。

1. 現状を調べる（読み取りのみ）:
   `powershell.exe -NoProfile -ExecutionPolicy Bypass -File windows/jf.ps1 setup-check`
   スクリプトがまだ動かない段階（D:/E: が無いなど）なら、エラー内容から判断する。
2. 結果を README の Phase に対応づけて、`✅ 済` / `⬜ 未` の一覧で見せる:
   - Phase 1 Windows 初期設定（`1_windows`。BIOS の停電復帰・Autologon・CrystalDiskInfo は自動判定できないので、オーナーに確認する）
   - Phase 2 ディスク（`2_disks`）
   - Phase 3 共有（`3_server`）
   - Phase 4 Mac 接続（`4_mac.macHasSynced` は Phase 7 後に true になる）
   - Phase 5 移行（`5_migration`。`allOk` が true で完了）
   - Phase 6 Dropbox アプリ（`6_dropboxApp`。`folderOnD` true・`recordingSyncedLocally` false が正解。逆なら至急止めるよう伝える）
   - Phase 7 Mac 自動同期（`4_mac.macHasSynced`）
   - Phase 8 自動タスク（`8_tasks` が全部 registered）
3. 最初の「未」の Phase について、README の該当手順を **その Phase だけ** 抜き出して、番号付きで分かりやすく案内する。
   - 管理者権限・パスワード入力・GUI 操作・ディスク操作・Mac 上の操作は、オーナーに実行してもらう（コマンドをそのままコピペできる形で示す）。
   - あなたが実行してよいのは `jf.ps1` の読み取りコマンドだけ。それ以外はオーナーの明示的な OK が必要。
   - ディスクの初期化・フォーマットは、必ず「容量で対象を確認する」ことを強調する。Windows の入った 1TB ディスクには触らない。
4. オーナーが「やった」と言ったら、もう一度 `setup-check` で確認してから次へ進む。
5. Phase 5（移行）中は `jf.ps1 logs migrate 30` で進み具合を見られる。`CHECK FAILED` が出ていたら `migrate-dropbox.ps1` の再実行を案内する（続きから再開される）。
