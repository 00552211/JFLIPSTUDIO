---
name: jf-doctor
description: JFLIPSTUDIO SERVER のトラブル調査。バックアップ失敗、Archive の FAIL、Mixdown が Complete に来ない、Mac から同期されない、容量不足、ディスク警告などの原因をログと状態から特定して直し方を提案する。
---

# トラブル調査

1. `jf.ps1 status` と、症状に関係するログ（`jf.ps1 logs <name> 120`）を読む。推測ではなく、ログの行を根拠にする。
2. 症状別の見る場所:

| 症状 | 確認すること |
|---|---|
| Mixdown が Complete に来ない | `logs mixdown`。その案件が `work.projects` にあるか（無ければ Mac から未同期 → `macLastSync`）。拡張子が `.wav` か。書き出しから 3 分以内でないか。Dropbox アプリが動いているか |
| Mac から同期されない | `macLastSync`（店舗別。`main` / `HN`）。HN の場合は両方の Tailscale がオンか、`_NAME_CHECK.txt` に案件が出ていないか（案件名に `_HN<番号>` が無いと送られない）。古ければ Mac 側 `~/JFLIPSTUDIO/logs/recsync.log` の末尾をオーナーに貼ってもらう。`could not mount` → 共有/パスワード/IP、`Operation not permitted` → フルディスクアクセス、`DAW running` → 正常（Mixdown のみ送信中） |
| backup FAILED | `logs backup` と `logs backup-robocopy` / `backup-rclone`。robocopy exit 8 以上 = コピー失敗（容量・権限・ディスク）。rclone = 回線/トークン切れ（`rclone config reconnect dropbox:` をオーナーに案内） |
| archive FAIL | `logs archive`。`missing/size/hash differs` = HDD 書き込みの問題 → ディスク健康を確認。`rclone ... FAIL` = Dropbox 側。どちらも案件は D: に残っていて安全 |
| 容量不足 | `drives`。D: なら Archive 待ち/放置案件の整理（/jf-archive）。E: なら README 11章の増設 |
| ディスク health 警告 | `physicalDisks`。🚨扱い。そのディスクにしかないデータが無いかを README 2章の表で確認し、交換・増設を勧める |

3. 結論を「原因 → 直し方 → それをやるとどうなるか」で短く伝える。
4. 直す操作がスクリプトの再実行（`jf.ps1 run ...`）なら承認を得てから実行する。設定変更・Windows の設定・Mac の操作はコマンドを示してオーナーに実行してもらう。
5. CLAUDE.md の「絶対のルール」（削除しない・同期で消さない・Archive は読むだけ）は、トラブル時でも例外にしない。
