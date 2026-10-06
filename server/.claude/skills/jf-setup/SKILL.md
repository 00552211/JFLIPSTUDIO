---
name: jf-setup
description: JFLIPSTUDIO SERVER の構築（Windows 初期設定・ディスク準備・SMB 共有・Dropbox 移行・Dropbox アプリ・Mac 同期・自動タスク）を、Claude が実際にコマンドを実行して進める。今どこまで済んでいるかを調べ、次のステップを実行→確認→次へ。「セットアップして」「構築の続き」「次なにやる？」で使う。
---

# 構築を Claude が実行する

あなたが手を動かし、オーナーは「OK」と、UAC の「はい」と、パスワード入力などの人にしかできない操作だけをする。手順の背景は `README.md`。

## 進め方の原則

- 毎回まず現状を調べる: `powershell.exe -NoProfile -ExecutionPolicy Bypass -File windows/jf.ps1 setup-check`
  （D:/E: がまだ無い段階でも動く。エラーになった項目は「未」とみなす）
- 結果を Phase ごとに `✅ 済 / ⬜ 未 / 👤 オーナー確認` で一覧表示し、**最初の未完了ステップ** だけに取りかかる。
- 各ステップの前に「これから何を実行し、何が変わるか、オーナーは何をする必要があるか」を2〜4行で伝え、OK をもらってから実行する。
- 実行後は出力を確認し、`setup-check` で結果を確かめてから次へ。失敗したら原因を説明し、勝手に別の方法を試さない。
- 管理者権限が要る作業は **必ず** `windows/elevate.ps1` 経由で決められたスクリプトだけを実行する（UAC が出る）。その場限りの管理者コマンドを自作しない。
- 待ち時間のある操作（UAC、ブラウザログイン、管理者ウィンドウでの入力）は、オーナーに「今○○の画面が出ているので△△してください」と具体的に伝える。

## ステップ

### Step 1 — Windows 基本設定（Phase 1）
1. 実行（UAC あり）:
   `powershell.exe -NoProfile -ExecutionPolicy Bypass -File windows/elevate.ps1 setup-windows.ps1 -ComputerName JFLIP-SERVER`
   PC 名・電源・Windows Update のアクティブ時間・Git/CrystalDiskInfo/Autologon/rclone の導入・LAN/ディスク健康/BitLocker の確認をする。
2. 出力の「Still needs you」をオーナーに1つずつ頼む。手伝えるもの:
   - Windows Update 画面を開く: `jf.ps1 open windowsupdate`
   - Autologon を開く: `jf.ps1 open autologon`（ユーザー名とパスワードはオーナーが入力し Enable を押す。パスワードをチャットに書かせない）
   - BIOS の停電復帰設定とルーターの IP 予約は、オーナーに手順を説明する（setup-check の `ip` を伝える）
3. PC 名を変えた場合は再起動が必要。オーナーに再起動してもらい、戻ったら `/jf-setup` で続きから。
4. Wi-Fi 接続の警告が出たら、有線 LAN にするまで Step 5（移行）は始めない。

### Step 2 — ディスク（Phase 2）
1. 一覧: `powershell.exe -NoProfile -ExecutionPolicy Bypass -File windows/elevate.ps1 prepare-disks.ps1`（変更なし）
2. 一覧からオーナーと一緒に「2TB SSD = 番号 ?」「3TB HDD = 番号 ?」を確定する。**容量とモデル名で確認し、boot=True のディスク（Windows）は絶対に選ばない。** 番号を推測で決めない。
3. 実行: `... elevate.ps1 prepare-disks.ps1 -WorkDisk <n> -ArchiveDisk <m>`
   - 空のディスクはそのまま D:(JF_WORK) / E:(JF_ARCHIVE) になる。
   - 既にデータがあるディスクは、管理者ウィンドウで `ERASE <番号>` と打たないと消えない。打つかどうかはオーナーが決める。中身が必要なら先に退避を提案する。
   - D: や E: が DVD などに取られているとエラーになる → `jf.ps1 open diskmgmt` を開き、その文字を変えてもらう。

### Step 3 — フォルダと SMB 共有（Phase 3）
1. 実行: `... elevate.ps1 setup-server.ps1`
   管理者ウィンドウで Mac 用ユーザー `jflipnas` のパスワードをオーナーが入力する（2回目以降は聞かれない）。**パスワードはチャットに書かないよう伝える。**
2. 確認: `setup-check` の `3_server` で shares に JFLIPSTUDIO と JFLIP_ARCHIVE があること。

### Step 4 — Mac をつなぐ（Phase 4・7）
1. 実行: `jf.ps1 mac-kit`（共有に Mac 用インストーラと IP 設定を置く）
2. 表示された 3 つの手順を、Mac で行ってもらう（Finder で接続→`brew install rsync`→`bash /Volumes/JFLIPSTUDIO/_system/mac-setup/install-mac.sh`）。
3. Studio One の保存先を `~/Music/JFLIPSTUDIO/Recording` にし、進行中の案件を Mac の Dropbox フォルダからそこへ移すよう伝える（README Phase 7 の 5〜7）。
4. 確認: 15 分以内に `setup-check` の `4_mac.macHasSynced` が true になる。ならなければ Mac の `~/JFLIPSTUDIO/logs/recsync.log` の末尾を貼ってもらい /jf-doctor の手順で調べる。

### Step 5 — 既存 Dropbox データを E: へ（Phase 5）
1. Dropbox と接続: `jf.ps1 rclone-login` → ブラウザが開くのでオーナーが Dropbox にログインして「許可」。コマンドは許可されるまで待つ。最後の `check:` に Dropbox のフォルダ名が出れば成功。
2. 開始: `jf.ps1 start-migration`（別ウィンドウで動き続ける。閉じないよう伝える。数時間〜2日）
3. 進捗: `jf.ps1 migration-progress`（初回は Dropbox 側の容量計算に数分かかる）。オーナーに聞かれたら、または区切りの良いときに報告。
4. `verified: true`（ログに `ALL OK`）で完了。`CHECK FAILED` / `NOT COMPLETE` なら、ウィンドウが終わっていることを確認してから `start-migration` をもう一度（続きから再開）。
5. 移行が終わるまで **Dropbox 上のデータを消さない・動かさない** ようオーナーに伝える。Step 6 以降は移行中に並行して進めてよい。

### Step 6 — Dropbox デスクトップアプリ（Phase 6）
1. 未インストールなら、オーナーの OK を得て `winget install -e --id Dropbox.Dropbox --accept-source-agreements --accept-package-agreements` を実行。
2. ここから先は画面操作なのでオーナーに頼む。順番が重要:
   サインイン → **すぐに同期を一時停止** → 基本設定 > 同期 > Dropbox フォルダの場所を `D:\Dropbox` に → 選択型同期で **Complete だけ** → 再開。
3. 確認: `setup-check` の `6_dropboxApp` が `folderOnD: true` かつ `recordingSyncedLocally: false`。
   `recordingSyncedLocally: true` なら至急: Recording（約 718GB）を PC に落とし始めているので、選択型同期で外してもらう。

### Step 7 — 自動タスク（Phase 8）
1. 実行: `... elevate.ps1 register-tasks.ps1`
2. テスト（オーナーの OK を得て）: `jf.ps1 run backup-nightly` → 数分後 `jf.ps1 logs backup 20` で `nightly backup end: OK`。
   Mac から Mixdown が届いていれば `jf.ps1 logs mixdown` で Complete へのコピーを確認。
3. 朝のレポートは CLI 版 Claude が必要（README Phase 10.5）。未導入なら `irm https://claude.ai/install.ps1 | iex` を案内し、一度 `claude` でログインしてもらう。
4. 任意の仕上げ（rclone の鍵を管理者だけが読めるように）: README Phase 8 末尾の icacls。Step 5 の `rclone-login` が済んでからにする。

### 完了
`setup-check` が全部 ✅ になったら、日々の使い方（README Phase 9: `_DONE` で完了、`_SAFE_TO_DELETE.txt`）と `/jf-status` `/jf-archive` `/jf-doctor` を短く紹介して終わる。
