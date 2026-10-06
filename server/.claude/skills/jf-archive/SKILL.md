---
name: jf-archive
description: 完了案件を SSD(D:) から HDD Archive(E:) へ移す作業を、確認つきで進める。Archive 待ち・放置案件の一覧、ドライラン、承認後の実行、結果確認まで。「Archive して」「SSD を空けたい」「この案件完了にして」などで使う。
---

# 完了案件の Archive

Archive は「E: にコピー → SHA256 で全ファイル照合 → Dropbox にコピー＆照合 → 両方 OK なら D: から削除」をスクリプトが行う。あなたが直接ファイルを動かしたり消したりしてはいけない。

1. `jf.ps1 status` で `work.projects` を取得し、表で見せる: 案件 / 容量 / 最終変更 / `_DONE` の有無 / 60日放置か。D: の空き % も添える。
2. オーナーが「完了にしたい案件」を指定したら、対象を復唱して確認を取ってから、1件ずつ:
   `powershell.exe -NoProfile -ExecutionPolicy Bypass -File windows/jf.ps1 mark-done "<顧客>/<案件>"`
   - 案件名はあなたが推測しない。`status` に出ている名前をそのまま使う。
   - 「最近触った案件（7日以内）」を完了にする場合は、本当に完了か一度確認する。
3. ドライランで何が起きるかを見せる（承認不要）:
   `powershell.exe -NoProfile -ExecutionPolicy Bypass -File windows/jf.ps1 archive-dryrun`
   - `WAIT` の案件は最後の変更から 60 分経っていない（または `_DONE` を付けたばかり）。その旨を説明し、今夜 05:00 の自動実行に任せるか、時間をおいて再実行するかを聞く。
4. オーナーが「今やって」と言ったら実行:
   `powershell.exe -NoProfile -ExecutionPolicy Bypass -File windows/jf.ps1 run archive-completed`
   その後 `jf.ps1 logs archive 40` を数分おきに確認し、各案件の `DONE` / `FAIL` を報告する。大きい案件は時間がかかる（HDD への書き込み＋全ファイルのハッシュ計算＋Dropbox アップロード）。
5. `FAIL` の場合: 案件は D: に残っていて安全。ログから原因（照合不一致 / rclone エラー / 容量不足）を説明し、対処を提案する。自分で再試行を繰り返さない。
6. 最後に、Mac 側では翌日以降 `~/Music/JFLIPSTUDIO/_SAFE_TO_DELETE.txt` に載った案件だけを消してよいことを伝える。
