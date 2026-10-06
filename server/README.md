# JFLIPSTUDIO SERVER 構築ガイド

Windows PC を「JFLIPSTUDIO の自宅サーバー」(NAS / REC管理 / 自動バックアップ / Dropbox整理 / 将来の Home Assistant) にするための、リセット直後からの手順です。

**大原則: Mac での REC が最優先。** Mac 内蔵 SSD に録音して、サーバーへは「コピーだけ」。サーバー側の仕組みが何をしても、Mac の録音データは消えないし変更もされない。

```
 Mac 内蔵SSD (REC)                ← 録音はここだけ。ネットワーク越しに録音しない
   │ 15分ごと・コピーのみ（DAW起動中は Mixdown だけ）
   ▼
 D: 2TB SSD  Work（作業中・最近の案件）  ──10分ごと──▶  Dropbox/Complete/<顧客>/*.wav（納品用）
   │ 毎晩 02:00 コピー                │ 毎晩 02:00 コピー
   ▼                                  ▼
 E: 3TB HDD  Backup\Work           Dropbox:/Recording（クラウド）
   │
   │ _DONE を置いた案件だけ、毎朝 05:00
   ▼
 E: 3TB HDD  Archive  ── HDD と Dropbox の両方で中身一致を確認してから D: から削除
```

---

## 0. 今の Dropbox の状況（確認済み）

| Dropbox フォルダ | 容量 | 中身 |
|---|---|---|
| `/Recording` (共有フォルダ) | 約 718 GB | `<顧客>/<YYMMDD_n>/` に Studio One の `.song`, `Media`, `Mixdown`, `Bounces`, `History`, `Cache` |
| `/Complete` | 約 85 GB | `<顧客>/*.wav`（納品用。Mixdown のコピー先） |
| `/RecData` | 約 31 GB | |
| `/BackUp` | 約 24 GB | |
| その他 `Deliver` `Songs` `R2M` `Template` など | 少量 | |

このガイドとスクリプトは、この構成（`Recording/<顧客>/<案件>/Mixdown` → `Complete/<顧客>/`）をそのまま引き継ぎます。

---

## 1. ドライブの役割分担

| ドライブ | 名前 (ラベル) | 役割 | 置くもの |
|---|---|---|---|
| C: 1TB SSD | `SYSTEM` | Windows とアプリ | Windows, アプリ, `C:\JFLIPSTUDIO\`（スクリプト・ログ・rclone）, 将来の Home Assistant VM |
| D: 2TB SSD | `JF_WORK` | 速い作業領域（**永久保存場所にしない**） | `D:\JFLIPSTUDIO\Work\Recording`（作業中の案件）, `D:\JFLIPSTUDIO\_system`, `D:\Dropbox`（Complete だけ同期） |
| E: 3TB HDD | `JF_ARCHIVE` | 保管庫 + D: のバックアップ | `E:\JFLIPSTUDIO\Archive\Recording`, `Archive\Dropbox\…`, `E:\JFLIPSTUDIO\Backup\Work` |

目安: D: の Work は **1TB 以内** を保つ（`_DONE` で Archive へ流す）。E: は使用率が **70% を超えたら 8TB 増設**（→ 11章）。

## 2. 「コピーがいくつあるか」の設計

「HDD に移した = バックアップ完了」ではありません。各段階で常に **2つ以上の独立したコピー** がある設計です。

| データの状態 | コピー1 | コピー2 | コピー3 |
|---|---|---|---|
| 録音直後〜作業中 | Mac 内蔵SSD | D: Work（15分以内） | E: Backup\Work + Dropbox（毎晩） |
| 完了・Archive 済み | E: Archive | Dropbox:/Recording | （8TB増設後）別HDD |
| 既存の過去データ | Dropbox（今のまま） | E: Archive（移行後） | （8TB増設後）別HDD |
| 納品WAV | D: Work の Mixdown | Dropbox/Complete | E: Archive（案件と一緒に） |

- スクリプトはすべて **コピーのみ**（削除を同期しない）。消すのは「HDD と Dropbox で中身一致を確認した Archive 処理」だけ。
- Dropbox は削除・上書きされても一定期間は「バージョン履歴 / 削除したファイル」から戻せる（プランにより 30〜180 日）。ランサムウェアや誤操作への保険。

---

## Phase 0. 準備するもの

- [ ] **有線 LAN**（Mac も Windows も。Wi-Fi だと 1TB 級の転送が数倍遅く不安定）
- [ ] ルーターで Windows PC の IP アドレスを固定（DHCP 予約）。例 `192.168.1.50`
- [ ] できれば **UPS（無停電電源装置）**。24時間稼働 + HDD なら停電・瞬停対策として強く推奨
- [ ] Dropbox の容量確認（今後 Work と Archive が Dropbox:/Recording に増えていく）

電気代の目安: アイドル 30〜60W の PC なら 24時間 × 30日で 約 22〜43 kWh ≒ 月 700〜1,400 円程度（31円/kWh 換算）。

---

## Phase 1. Windows の初期設定（リセット直後）

1. **Windows Update** を「更新がなくなるまで」繰り返す。チップセット/LAN ドライバーもメーカーサイトから。
2. **エディション確認**: 設定 → システム → バージョン情報。Pro なら Home Assistant を Hyper-V で動かせる（Home でも VirtualBox で可）。
3. **PC 名を変更**: 設定 → システム → バージョン情報 → 「この PC の名前を変更」→ `JFLIP-SERVER` → 再起動。
4. **BIOS/UEFI 設定**（起動時に Del / F2）: 「Restore on AC Power Loss」(停電復帰時の動作) を **Power On** に。停電後に自動で立ち上がるようにする。
5. **Windows Update の再起動時間**: 設定 → Windows Update → 詳細オプション → アクティブ時間を「手動: 9:00〜翌1:00」など制作時間に合わせる。
6. **BitLocker / デバイスの暗号化** が有効なら回復キーを必ず保存（Microsoft アカウント or 印刷）。
7. **自動サインイン**（Dropbox アプリはサインイン中しか動かないため）: Microsoft 公式の [Sysinternals Autologon](https://learn.microsoft.com/sysinternals/downloads/autologon) で設定。サインイン後は Win+L でロックしておけばOK。
   - バックアップ類のスクリプトは SYSTEM で動くのでサインイン不要。必要なのは Dropbox（と将来の HASS.Agent）だけ。
8. **CrystalDiskInfo** を入れて、3TB HDD と 2TB SSD の健康状態が「正常」か確認。常駐 + 異常時通知を ON。
   - 3TB HDD が「注意」なら、そこを唯一の Archive にしない。先に新しい HDD を用意する。

## Phase 2. ディスクの準備

「ディスクの管理」（スタートを右クリック → ディスクの管理）で:

1. **容量で必ず確認**してから作業（1TB = Windows, 2TB = SSD, 3TB = HDD）。Windows の入ったディスクは触らない。
2. 2TB SSD: 未初期化なら「GPT」で初期化 → 新しいシンプルボリューム → **ドライブ文字 D:** → NTFS → ラベル `JF_WORK`。
3. 3TB HDD: 同様に GPT → **E:** → NTFS → ラベル `JF_ARCHIVE`。
   - 中古・古い HDD なら「クイックフォーマット」のチェックを外して通常フォーマット（数時間かかるが全セクタ検査になる）。
4. D:/E: が別の文字（DVD ドライブ等）に取られていたら、そちらの文字を先に変更する。

> 3TB を超える HDD は必ず GPT（MBR だと 2TB までしか使えない）。

## Phase 3. スクリプト配置とサーバー設定（SMB 共有）

1. このリポジトリの `server` フォルダを **`C:\JFLIPSTUDIO\server`** にコピー（GitHub の「Code → Download ZIP」で取得して展開）。
2. スタートを右クリック → **ターミナル (管理者)** を開き:

   ```powershell
   Get-ChildItem C:\JFLIPSTUDIO\server -Recurse | Unblock-File
   powershell -ExecutionPolicy Bypass -File C:\JFLIPSTUDIO\server\windows\setup-server.ps1
   ```

   これで以下が自動で行われます（何度実行しても安全）:
   - フォルダ作成（D:/E: の `JFLIPSTUDIO` 構成, `C:\JFLIPSTUDIO\bin`, `logs`）
   - 電源: スリープ・休止・ディスク停止を無効（モニターだけ 10分で消灯）
   - ネットワークを「プライベート」に、ファイル共有をファイアウォールで許可、SMB1 無効
   - Mac 専用ローカルユーザー **`jflipnas`** を作成（パスワードを聞かれるのでメモ）
   - 共有 **`JFLIPSTUDIO`**（D:\JFLIPSTUDIO, 読み書き）と **`JFLIP_ARCHIVE`**（E:\JFLIPSTUDIO\Archive, **読み取り専用**）
     - Archive を Mac から読み取り専用にしているのは、Finder の誤操作で保管庫を消さないため。

3. 最後に表示される IP をルーターで固定（DHCP 予約）。

> 共有はインターネットに公開しない（ルーターでポート開放しない）。外出先から触りたくなったら Tailscale を使う。

## Phase 4. Mac から接続テスト

1. Finder → 移動 → サーバへ接続（⌘K）→ `smb://192.168.1.50/JFLIPSTUDIO`
2. 「登録ユーザ」: 名前 `jflipnas` / Phase 3 のパスワード → **「パスワードをキーチェーンに保存」に必ずチェック**（自動同期がこれを使う）
3. 適当なファイルをコピーして、Windows の `D:\JFLIPSTUDIO` に現れればOK。速度の目安は有線 1GbE で 100MB/s 前後。
4. `smb://192.168.1.50/JFLIP_ARCHIVE` も同様に接続できるか（書き込めないのが正常）。

## Phase 5. 既存 Dropbox データ（約1TB）を HDD へ移行

**Dropbox デスクトップアプリより先に** やります。デスクトップアプリで全部「オフラインで使用可」にすると、SSD を圧迫するうえ「同期」なので Windows で消すとクラウドからも消えます。移行は **rclone で Dropbox から一方向にコピー** して、独立したコピーを作ります。

1. https://rclone.org/downloads/ から Windows (AMD64) の zip をダウンロード → 中の `rclone.exe` を `C:\JFLIPSTUDIO\bin\` に置く。
2. 管理者ターミナルで Dropbox と接続:

   ```powershell
   C:\JFLIPSTUDIO\bin\rclone.exe config --config C:\JFLIPSTUDIO\rclone.conf
   ```

   `n`（新規）→ name: **`dropbox`** → Storage: `dropbox` → client_id / client_secret は空 Enter → Edit advanced config: `n` → Use web browser: `y` → ブラウザで Dropbox にログインして許可 → `y` → `q`

3. 確認:

   ```powershell
   C:\JFLIPSTUDIO\bin\rclone.exe --config C:\JFLIPSTUDIO\rclone.conf size dropbox:Recording
   ```

4. 移行開始（途中で止めても、もう一度実行すれば続きから）:

   ```powershell
   powershell -ExecutionPolicy Bypass -File C:\JFLIPSTUDIO\server\windows\migrate-dropbox.ps1
   ```

   - `Dropbox:/Recording` → `E:\JFLIPSTUDIO\Archive\Recording`
   - `Complete` `Deliver` `RecData` `BackUp` `Songs` `R2M` `Template` `STUDIO BEAT` `INM PARA` → `E:\JFLIPSTUDIO\Archive\Dropbox\<名前>`
   - 対象フォルダは `migrate-dropbox.ps1` 冒頭のリストで変更可能。
   - 最後に **全ファイルをサイズ + Dropbox のハッシュで照合**。`ALL OK` が出れば完了。失敗があればもう一度実行。
   - 所要時間は回線次第で半日〜2日。PC はスリープしない設定済みなので放置でOK。

5. 移行後も **Dropbox 上のデータは消さない**。これで「Dropbox + E: HDD」の2コピーになる。

## Phase 6. Dropbox デスクトップアプリ（Windows）

役割は「納品用 `Complete` をローカルに置いて自動アップロードする」だけ。`Recording` は rclone が直接クラウドとやり取りするので **ローカル同期しない**。

1. Dropbox をインストール → サインイン直後、タスクトレイの Dropbox → **同期を一時停止**。
2. 基本設定 → 同期 → **Dropbox フォルダの場所** を `D:\Dropbox` に変更。
3. 基本設定 → 同期 → **選択型同期** で **`Complete` だけ**チェック（必要なら `Deliver` も）。**`Recording` は必ず外す。**
4. 同期を再開。

## Phase 7. Mac の自動同期

1. **Homebrew の rsync** を入れる（macOS 標準の rsync は機能が足りない）:

   ```bash
   brew install rsync
   ```

2. このリポジトリの `server/mac` を Mac に持ってきて:

   ```bash
   cd server/mac
   bash install-mac.sh
   ```

3. `~/JFLIPSTUDIO/bin/jflip-recsync.sh` の冒頭 `SERVER="192.168.1.50"` を実際の IP に変更（または `~/JFLIPSTUDIO/recsync.conf` に `SERVER="..."` と書く）。
4. 手動で1回テスト:

   ```bash
   ~/JFLIPSTUDIO/bin/jflip-recsync.sh
   tail ~/JFLIPSTUDIO/logs/recsync.log
   ```

5. **Studio One の保存先** を `~/Music/JFLIPSTUDIO/Recording` に。新規ソングは `Recording/<顧客>/` の中に `YYMMDD_n` という名前で作る（今の Dropbox と同じ構成）。
6. 進行中の案件は Mac の Dropbox フォルダから `~/Music/JFLIPSTUDIO/Recording/<顧客>/` へ移動。今後 Mac の Dropbox フォルダには録音しない。
7. 以前に Mac 側で「Mixdown → Complete」の自動化を作っていたら停止（サーバー側で二重にコピーしないため）。

同期スクリプトの安全装置:

| 状況 | 動作 |
|---|---|
| Studio One など DAW が起動中 | `Mixdown/` フォルダだけ送る（録音中のセッションには触らない） |
| 2分以内に書き込まれたファイル | 送らない（録音中・書き出し中のため） |
| サーバーに届かない / 外出中 | 何もせず終了。次回に送る |
| Archive 済みの案件 | Mac のコピーとサーバーの Archive を比較し、**同一なら再送しない**。同一と確認できた案件だけ `~/Music/JFLIPSTUDIO/_SAFE_TO_DELETE.txt` に「Mac から消してよい案件」として載る。Archive 後に Mac で変更があれば自動で再送 |
| 常に | コピーのみ。Mac 上のファイルは削除も変更もしない。低優先度 I/O で実行 |

> launchd から動かしたときにログに `Operation not permitted` が出たら: システム設定 → プライバシーとセキュリティ → フルディスクアクセス に `/bin/bash` と `/opt/homebrew/bin/rsync` を追加（⌘⇧G でパス入力）。

## Phase 8. 自動化タスクの登録

管理者ターミナルで:

```powershell
powershell -ExecutionPolicy Bypass -File C:\JFLIPSTUDIO\server\windows\register-tasks.ps1
```

| タスク | タイミング | 内容 |
|---|---|---|
| `mixdown-to-complete` | 10分ごと | `Work\Recording\<顧客>\<案件>\Mixdown\*.wav` → `D:\Dropbox\Complete\<顧客>\`。書き直された WAV は上書き（Dropbox の履歴に旧版が残る） |
| `backup-nightly` | 毎日 02:00 | D: Work → E: Backup\Work（robocopy）、D: Work → Dropbox:/Recording（rclone）。`D:\JFLIPSTUDIO\_system\server-status.txt` に空き容量と「60日放置の案件」を書き出し |
| `archive-completed` | 毎日 05:00 | `_DONE` のある案件だけ: E: Archive へコピー → SHA256 で全ファイル照合 → Dropbox へコピー＆照合 → 両方 OK なら D: と Backup\Work から削除し `archived.txt` に記録 |
| `daily-report` | 毎日 08:00 | Claude が状態をまとめて Dropbox\JFLIPSTUDIO_Reports に保存（Phase 10.5） |

動作テスト:

```powershell
schtasks /run /tn \JFLIPSTUDIO\backup-nightly
Get-Content C:\JFLIPSTUDIO\logs\backup.log -Tail 20
powershell -ExecutionPolicy Bypass -File C:\JFLIPSTUDIO\server\windows\archive-completed.ps1 -DryRun
```

任意: `rclone.conf`（Dropbox の鍵）を管理者と SYSTEM だけが読めるようにする:

```powershell
icacls C:\JFLIPSTUDIO /inheritance:r /grant:r "*S-1-5-18:(OI)(CI)F" "*S-1-5-32-544:(OI)(CI)F"
```

## Phase 9. 日々の運用

**普段**: Mac で録音して保存するだけ。Studio One を閉じれば 15分以内にサーバーへ。書き出した Mixdown は DAW を開いたままでも Dropbox/Complete に届く。

**案件が終わったら**: 案件フォルダに空ファイル `_DONE` を置く。

```bash
~/JFLIPSTUDIO/bin/jflip-done.sh ~/Music/JFLIPSTUDIO/Recording/TI_千葉光樹/260924_1
```

（Finder の右クリックにしたい場合: Automator → クイックアクション → 「フォルダ」を受け取る → 「シェルスクリプトを実行」入力の引き渡し方法「引数として」→ `for f in "$@"; do touch "$f/_DONE"; done` → 「JFLIP 完了にする」で保存）

→ その夜〜翌朝にサーバーが Archive。翌日以降 `~/Music/JFLIPSTUDIO/_SAFE_TO_DELETE.txt` に載ったら、Mac の空き容量が必要なときに Mac から消してOK。

**Archive 後に作業を再開したいとき**: Mac に残っていればその `_DONE` を消して作業するだけ（変更が検出されて自動で再びサーバーへ送られる。`_DONE` が無い間は Archive されない）。Mac から消していたら、`JFLIP_ARCHIVE` 共有から Mac へコピーして作業。終わったら再度 `_DONE`。

**月1回の確認（5分）**:
- `D:\JFLIPSTUDIO\_system\server-status.txt`（Mac からも共有で見える）: バックアップ OK / 空き容量 / 放置案件
- CrystalDiskInfo が「正常」か
- 年に数回、Archive から適当な案件を Mac に戻して Studio One で開けるか（**復元テスト**。開けないバックアップはバックアップではない）

## Phase 10. ログとトラブル時

| 見る場所 | 内容 |
|---|---|
| `C:\JFLIPSTUDIO\logs\backup.log` | 夜間バックアップ |
| `C:\JFLIPSTUDIO\logs\archive.log` | Archive（`FAIL` の案件は D: に残ったまま = 安全側） |
| `C:\JFLIPSTUDIO\logs\mixdown.log` | 納品 WAV のコピー |
| `C:\JFLIPSTUDIO\logs\migrate.log` | 初回移行 |
| Mac `~/JFLIPSTUDIO/logs/recsync.log` | Mac → サーバー同期 |

設定（パス・時間など）は `server\windows\config.ps1` に集約。

## Phase 10.5. Claude で半自動運用

サーバー上で **Claude Code** を動かし、「調べる・まとめる・提案する」は Claude に任せ、「消す・動かす」はスクリプトとオーナーの承認に残す形です。

| | 誰がやる | 承認 |
|---|---|---|
| Mac→サーバー同期、Mixdown コピー、夜間バックアップ、Archive | スクリプト（Phase 7〜8） | 不要（`_DONE` が合図） |
| 毎朝のレポート（✅/⚠️/🚨 判定と要対応リスト） | Claude（**ツール権限なし**で状態 JSON を読むだけ） | 不要 |
| 状態確認・ログ調査・原因特定・構築の次の一手の案内 | Claude（`jf.ps1` の読み取りコマンドだけ自動許可） | 不要 |
| 今すぐバックアップ / Archive 実行、案件を完了にする | Claude が提案 → 実行 | **必要**（毎回確認される） |
| 削除、`rclone sync/move/delete`、`robocopy /MIR /PURGE`、ディスク操作 | 誰も自動ではやらない | `.claude/settings.json` で禁止 + `CLAUDE.md` のルール |

### インストール（Phase 1 の直後にやると、以降の構築も Claude が案内できる）

メインは **Windows 版 Claude デスクトップアプリの「Code」** を使います。`CLAUDE.md`・`.claude/settings.json`・`/jf-*` スキルはフォルダを開くだけで読み込まれます。

1. `server` フォルダを `C:\JFLIPSTUDIO\server` に置く（Phase 3 の 1.）。
2. Git for Windows を入れる（Claude Code が Windows でコマンドを実行するのに使う）:

   ```powershell
   winget install Git.Git
   ```

3. Claude デスクトップアプリ → **Code** → フォルダに `C:\JFLIPSTUDIO\server` を選ぶ → 権限モードは **「毎回確認（Ask）」** のまま。
4. `/jf-setup` と打つ → 今どこまで済んでいるかを調べて次の手順を案内してくれる。
5. **朝のレポート用に CLI 版も入れる**（08:00 のタスクはアプリを開いていなくても動く必要があるため。ログインはアプリと同じアカウント）:

   ```powershell
   irm https://claude.ai/install.ps1 | iex
   claude      # 一度起動してログインだけ済ませ、/exit
   ```

   入れない場合も、朝のレポートは「生の状態データ」で毎日書かれます。

> 「許可を全部スキップする」モード（bypass）は使わないでください。承認の確認がこの仕組みの安全装置です。
>
> `jf.ps1 status` などの読み取りコマンドで毎回確認が出る場合は、「常に許可」を選んで構いません（読み取り専用）。逆に `run` / `mark-done` は毎回確認されるのが正しい動作です。

### 使えるコマンド（Claude に話しかけるだけでも OK）

| コマンド | こんなとき |
|---|---|
| `/jf-status` | 「サーバー大丈夫？」「バックアップできてる？」 |
| `/jf-archive` | 「SSD 空けたい」「TI_千葉光樹 の 260924_1 完了にして」 |
| `/jf-setup` | 「構築の続き」「次なにやる？」 |
| `/jf-doctor` | 「Mixdown が Complete に来ない」「Mac から同期されてない」 |

### スマホ（Galaxy）から話しかける

デスクトップアプリの Code で開いたセッションは、Galaxy の Claude アプリからも続けられます（アプリ側の案内に従ってリモート操作を有効化）。CLI 版で常駐させる場合は、サーバーで次を起動しておくと Galaxy の Claude アプリ（Code）から指示できます。

```powershell
cd C:\JFLIPSTUDIO\server
claude remote-control
```

再起動後も自動で立ち上げたい場合は、`Win+R` → `shell:startup` で開くフォルダに次の内容の `jflip-claude.cmd` を置く:

```bat
cd /d C:\JFLIPSTUDIO\server
claude remote-control
```

### 毎朝のレポート

`register-tasks.ps1` が 08:00 のタスク `daily-report` も登録します。Claude が状態を読んで `D:\Dropbox\JFLIPSTUDIO_Reports\YYYY-MM-DD.md` に書くので、**スマホの Dropbox アプリで毎朝確認**できます（Mac からは `JFLIPSTUDIO` 共有の `_system/daily-report.md`）。Claude が使えないときは生の状態データが書かれるので、レポートが来ない日はそれ自体が異常のサインです。

---

## 11. HDD 増設の計画

現状の見積り: E: には Archive 約 0.9TB（既存 Dropbox 分）+ Backup\Work（D: の作業量ぶん）が入る。3TB だと **1年前後で埋まる可能性が高い**。

**買う HDD**: 8TB 以上、**CMR 方式の NAS 向け**（WD Red Plus / Seagate IronWolf / 東芝 N300 など）。SMR 方式は大容量の連続書き込みが極端に遅くなるので避ける。

| 段階 | 構成 | Archive のコピー数 |
|---|---|---|
| 今 | E: 3TB = Archive + Backup\Work | E: + Dropbox = 2 |
| 増設1 | **F: 8TB (内蔵)** = Archive + Backup\Work。E: 3TB = 過去分 Archive の2つ目のコピー | F: + E:(一部) + Dropbox |
| 増設2 | **G: 8TB (外付けUSB でも可)** = F: の丸ごとコピー。E: は引退 or 保管用 | F: + G: + Dropbox = 3 |

増設1 の移し方（例）:

```powershell
robocopy E:\JFLIPSTUDIO F:\JFLIPSTUDIO /E /COPY:DAT /DCOPY:T /R:2 /W:5 /MT:8 /LOG:C:\JFLIPSTUDIO\logs\move-to-F.log
```

→ `config.ps1` の `Archive` と `WorkBackup` を `F:\...` に変更 → `setup-server.ps1` の `E:\JFLIPSTUDIO\Archive` を `F:\...` に直して共有を作り直す。E: のデータはすぐ消さず、そのまま「2つ目のコピー」として残す。

増設2 では毎週 `robocopy F:\JFLIPSTUDIO G:\JFLIPSTUDIO /E`（`/MIR` や `/PURGE` は使わない＝削除を伝播しない）をタスクに追加。

注意: RAID0 や「Storage Spaces のシンプル（回復性なし）」は1台壊れると全滅するので使わない。RAID1 でも誤削除・ランサムウェアには無力なので、別コピー（Dropbox）は必須。

---

## 12. Home Assistant と AI 音声操作（NAS が安定してから）

### 12-1. Windows 上で Home Assistant OS を動かす

Docker 版より **Home Assistant OS を VM で** 動かすのがおすすめ（アドオン・自動発見・バックアップがすべて使え、後で Home Assistant Green へそのまま移せる）。

- **Windows Pro**: Hyper-V を有効化 → 「仮想スイッチ マネージャー」で **外部** スイッチ作成 → Home Assistant 公式の **Hyper-V 用イメージ (.vhdx)** で第2世代 VM（2 vCPU / RAM 4GB / セキュアブート無効）→ 自動起動アクション「常に自動的に起動」
- **Windows Home**: VirtualBox + 公式 `.vdi` イメージ（ネットワークは「ブリッジアダプター」）
- ブラウザで `http://homeassistant.local:8123` → 初期設定。ルーターで VM の IP も固定。
- 設定 → システム → バックアップ で自動バックアップを ON、保存先に `\\JFLIP-SERVER\JFLIPSTUDIO` の共有を追加（Network storage）。

### 12-2. 機器の連携

| 機器 | 連携方法 |
|---|---|
| Tapo 電源タップ | 標準の **TP-Link Smart Home** 統合（ローカル制御。Tapo アカウントでログイン）。タップの口ごとにスイッチとして出てくる |
| SwitchBot Hub Mini | 標準の **SwitchBot Cloud** 統合（SwitchBot アプリ → プロフィール → 設定 → アプリバージョンを10回タップ → 開発者向けオプションでトークン/シークレット取得）。Matter 対応版 Hub Mini なら **Matter** 統合も可 |
| Lepro N1 AI LED | Home Assistant の公式統合は現時点で確認できず。①本体/アプリが Matter 対応ならそれで追加 ②Alexa / Google Home 経由 ③電源ON/OFFだけなら Tapo の口で制御、の順で検討 |
| Galaxy S25 Ultra | **Home Assistant コンパニオンアプリ**。端末の「デフォルトのデジタルアシスタントアプリ」を Home Assistant にすると、アシスタント起動で HA の Assist が開く |
| この Windows PC | **HASS.Agent**（コミュニティ版）を入れると、HA から PC のコマンド実行やスリープ制御ができる |

### 12-3. 「AIが意味を理解する」音声操作

- 設定 → 音声アシスタント でパイプライン作成:
  - 会話エージェント: **OpenAI** 統合（GPT。API キーが必要・従量課金）→ 「Home Assistant の操作を許可 (Assist)」を ON、「**ローカル処理を優先**」を ON（「電気消して」のような単純な命令は無料・即時にローカル処理、曖昧な言い方だけ GPT へ）
  - 音声認識/読み上げ: 一番簡単で日本語精度が高いのは **Home Assistant Cloud**（月額）。無料にしたければ Whisper / Piper アドオン（日本語は精度・速度がやや落ちる）
- 「エンティティを公開」で照明やタップを Assist に公開し、日本語の別名（エイリアス）を付ける（例: 「スタジオの照明」「機材電源」）。

シーン用スクリプトの例（設定 → オートメーションとシーン → スクリプト → YAML で編集。エンティティ名は実際のものに置き換え）:

```yaml
alias: 制作始める
description: スタジオモード。照明と機材電源をON
sequence:
  - action: light.turn_on
    target: { entity_id: light.studio }
    data: { brightness_pct: 70, color_temp_kelvin: 3500 }
  - action: switch.turn_on
    target: { entity_id: [switch.tapo_strip_monitors, switch.tapo_strip_interface] }
```

```yaml
alias: レコーディング終わり
description: バックアップを開始して不要な機材をOFF
sequence:
  - action: button.press                 # HASS.Agent で作ったボタン
    target: { entity_id: button.jflip_server_run_backup }
  - delay: "00:00:05"
  - action: switch.turn_off
    target: { entity_id: switch.tapo_strip_interface }
```

HASS.Agent 側では「カスタムコマンド」として `schtasks /run /tn \JFLIPSTUDIO\backup-nightly` を登録すると、上のボタンで夜間バックアップを今すぐ実行できます。

スクリプトを Assist に公開すれば「制作始める」「スタジオモードにして」「レコーディング終わった」など言い方が違っても GPT が該当スクリプトを選んで実行します。

### 12-4. 将来の移行

便利さが確認できたら Home Assistant Green（消費電力 数W）を買い、HA のバックアップを Green に復元するだけで移行完了。Windows はサーバー（NAS・バックアップ）役に専念。

---

## ファイル一覧

| ファイル | 実行する場所 | 用途 |
|---|---|---|
| `windows/config.ps1` | — | パス・時間などの設定（全スクリプト共通） |
| `windows/setup-server.ps1` | Windows (管理者, 1回) | フォルダ・電源・共有・ユーザー作成 |
| `windows/migrate-dropbox.ps1` | Windows (1回) | 既存 Dropbox → E: へ移行 + 照合 |
| `windows/register-tasks.ps1` | Windows (管理者, 1回) | 自動タスクの登録 |
| `windows/mixdown-to-complete.ps1` | タスク (10分ごと) | Mixdown → Dropbox/Complete |
| `windows/backup-nightly.ps1` | タスク (02:00) | D: → E: と Dropbox |
| `windows/archive-completed.ps1` | タスク (05:00) | `_DONE` 案件を検証付きで Archive |
| `windows/jf.ps1` | Claude / 人 | 状態取得・ログ・ドライラン・タスク即時実行・`_DONE` 付与の窓口 |
| `windows/daily-report.ps1` + `daily-report-prompt.md` | タスク (08:00) | Claude による朝のレポート |
| `CLAUDE.md` | Claude Code | サーバー管理のルール（削除禁止など） |
| `.claude/settings.json` | Claude Code | 自動許可するコマンドと禁止するコマンド |
| `.claude/skills/jf-*/SKILL.md` | Claude Code | `/jf-status` `/jf-archive` `/jf-setup` `/jf-doctor` |
| `mac/install-mac.sh` | Mac (1回) | 同期スクリプトと launchd 登録 |
| `mac/jflip-recsync.sh` | Mac (15分ごと) | Mac → サーバー同期 |
| `mac/jflip-done.sh` | Mac | 案件に `_DONE` を付ける |

Windows 用スクリプトはコメントが英語・ASCII のみです（Windows PowerShell 5.1 が BOM なし UTF-8 の日本語を文字化けさせるため）。
