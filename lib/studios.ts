// CONNECT STUDIO の店舗ごとの内容。ページ（app/ikebukuro, app/nerima）は components/studio-page.tsx がこれを描画する。

export type StudioSlug = "ikebukuro" | "nerima";
export type Link = { label: string; url: string };
export type Plan = { h: number; price: number; note?: string };
export type RouteStop =
  | { kind: "st"; name: string; line?: string; maps?: string; goal?: boolean }
  | { kind: "seg"; b: string; t: string; walk?: boolean };

export type Studio = {
  slug: StudioSlug;
  nameJa: string;           // 池袋店
  areaEn: string;           // IKEBUKURO
  title: string;            // <title>
  description: string;
  bookingUrl: string;
  email: string;
  social: { instagram: string; youtube?: string; tiktok?: string };
  hero: { lead: string; big: string; em: string; slides: string[] };
  marquee: string[];
  about: { lead: string; body: string; points?: { k: string; v: string; s: string }[]; photos: { src: string; alt: string }[] };
  engineerName: string;
  price: {
    sideTitle: string;
    sideNote: string;
    extension: string;
    plans: Plan[];
    defaultIndex: number;
    hotFrom: number;        // この時間以上は時間単価が下がる
    perHour: string;        // ¥4,000 / h
    perHourText: string;
    checks: string[];
    mix?: { plans: { name: string; price: string }[]; note: string };
  };
  info: { l: string; b: string; ja?: boolean; s: string }[];
  availability: { closedWeekday: number | null };
  band: { img: string; t1: string; em: string; s: string };
  flow: { total: string; totalSub: string; steps: { t: string; d: string; x: string }[] };
  engineer?: {
    img: string; name: string; kana: string; paras: string[]; chips: string[];
    sns: Link[]; works: { t: string; d: string; links: Link[] }[];
  };
  hasWorks: boolean;        // 制作実績（Supabase）を出すか
  hasGallery: boolean;      // ギャラリー（Supabase）を出すか
  equipment: { label: string; name: string; note?: string; img: string }[];
  band2: string;
  faq: { q: string; a: string }[];
  access: { headline: string; routes: RouteStop[][]; notes: { strong: string; text: string }[] };
  contact: { topics: string[]; placeholder: string };
  bookLead: string;
  footer: { area: string; lines: string[]; hours: string };
  campaign?: { href: string; label: string };
};

const IG = (u: string) => `https://www.instagram.com/${u}/`;
const maps = (q: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
const unsplash = (id: string) => `https://images.unsplash.com/${id}?w=800&q=75&auto=format&fit=crop`;

export const IKEBUKURO: Studio = {
  slug: "ikebukuro",
  nameJa: "池袋店",
  areaEn: "IKEBUKURO",
  title: "CONNECT Studio 池袋店｜池袋のラッパー・シンガー専門レコーディングスタジオ",
  description: "池袋のラッパー・シンガー専門レコーディングスタジオ。エンジニア付き、RECからMIX / MASTERまでその場で完結。池袋駅から2駅・徒歩6分。",
  bookingUrl: "https://book.squareup.com/appointments/atrhlg3x3adiil/location/LMX1F40PXEXPW/services",
  email: "connectstudio.jpn@gmail.com",
  social: {
    instagram: IG("connectstudio_jpn"),
    youtube: "https://www.youtube.com/@connectstudio_jpn",
    tiktok: "https://www.tiktok.com/@connectstudio_jpn",
  },
  hero: {
    lead: "池袋のラッパー・シンガー専門レコーディングスタジオ",
    big: "エンジニア付き。",
    em: "その場で完結。",
    slides: [1, 2, 3, 4, 5, 6].map((n) => `/connect/fv/fv${n}-1600.webp`),
  },
  marquee: ["RECORDING", "MIX", "MASTERING", "ENGINEER INCLUDED", "SAME-DAY DELIVERY", "最短でその場で完成", "IKEBUKURO, TOKYO"],
  about: {
    lead: "池袋のラッパー・シンガー専門レコーディングスタジオ。",
    body: "池袋駅から2駅、徒歩6分。エンジニア付きで、RECからMIX / MASTERまでその場で完結します。初めての方でも、Trackを持ってくるだけでOK。1曲を最短でその場で完成させて、そのままデータを持ち帰れます。",
    photos: [
      { src: unsplash("photo-1563330232-57114bb0823c"), alt: "" },
      { src: unsplash("photo-1516280440614-37939bbacd81"), alt: "" },
      { src: unsplash("photo-1526218626217-dc65a29bb444"), alt: "" },
    ],
  },
  engineerName: "IKUTO",
  price: {
    sideTitle: "エンジニア（IKUTO）付き",
    sideNote: "REC / MIX / MASTER すべて込み。追加料金はありません。",
    extension: "15min / ¥1,200",
    // Square「レコーディング（REC/MIX/MASTER込み）」（CONNECT Studio 池袋）と揃える
    plans: [
      { h: 1, price: 4500, note: "Recや細かな修正・調整に" },
      { h: 1.5, price: 6500 },
      { h: 2, price: 9000 },
      { h: 2.5, price: 11000, note: "1曲制作におすすめ" },
      { h: 3, price: 12000, note: "余裕を持って1曲仕上げたい方に" },
      { h: 3.5, price: 14000 },
      { h: 4, price: 16000, note: "複数曲をまとめて制作したい方に" },
      { h: 4.5, price: 18000 },
      { h: 5, price: 20000, note: "じっくり制作・EP 録りに" },
      { h: 5.5, price: 22000 },
      { h: 6, price: 24000 },
    ],
    defaultIndex: 3,
    hotFrom: 3,
    perHour: "¥4,000 / h",
    perHourText: "3時間以上は1時間あたり ¥4,000。長く録るほどおトクです。",
    checks: ["30分単位で選べます", "RECのみ／MIXのみでもOK", "最大6名まで"],
  },
  info: [
    { l: "OPEN", b: "10:00 — 23:00", s: "定休日なし・不定休" },
    { l: "PAYMENT", b: "現金 / カード", ja: true, s: "クレジットカード（タッチ決済対応）" },
    { l: "CANCEL", b: "2日前まで", ja: true, s: "前日・当日のキャンセルは料金100%" },
  ],
  availability: { closedWeekday: null },
  band: { img: "/connect/band1-1600.webp", t1: "Same room.", em: "Same day.", s: "RECからMIX / MASTERまで、同じ部屋で、同じ日に。\nエンジニアと向き合いながら1曲を仕上げる。" },
  flow: {
    total: "1曲完成まで 最短 約2〜2.5h",
    totalSub: "※楽曲・REC量によって前後します",
    steps: [
      { t: "BOOK", d: "予約ページから日時・時間を選択", x: "予約ページから日時と利用時間を選ぶだけ。初めての方は、1曲仕上がる2〜2.5hがおすすめ。" },
      { t: "TRACK", d: "Trackは事前送付 or 当日持ち込み", x: "事前にデータ送付でも、当日スマホやUSBで持ち込みでもOK。形式はwav / mp3どちらでも。" },
      { t: "STUDIO", d: "予約時間の5分前に来店", x: "予約時間の5分前に到着。飲食OK、最大6名まで。仲間と一緒に来ても大丈夫。" },
      { t: "REC", d: "約1時間", x: "エンジニアがマイクとレベルを調整。テイクを重ねながら、約1時間で録り切ります。" },
      { t: "MIX / MASTER", d: "約1〜1.5時間", x: "その場でピッチ・タイミング補正、ミックス、マスタリングまで。約1〜1.5時間。" },
      { t: "DONE", d: "最短でその場で完成・データ納品", x: "完成データをその場でお渡し。SNS投稿や配信に、そのまま使えます。" },
    ],
  },
  engineer: {
    img: "/connect/ikuto-600.webp",
    name: "IKUTO",
    kana: "イクト",
    paras: [
      "高校時代にYoutube上のフリートラックへ歌を乗せてみたことをきっかけに音楽活動を開始。アーティスト名義「IKUTO」での楽曲は、SNS累計再生100万回を達成。高校卒業後は音楽専門学校で3年間、作曲・編曲やサウンドメイクを学び、現在は楽曲制作、Beat制作からREC、MIXまで一貫して手がける。",
      "自身もアーティストとして活動してきた経験を活かし、楽曲や声の個性を大切にしたサウンド作りを追求している。",
    ],
    chips: ["Produce・Lyrics・Beatmake", "REC / MIX / MASTER"],
    sns: [
      { label: "Instagram", url: "https://www.instagram.com/ikuto_jpn" },
      { label: "YouTube", url: "https://www.youtube.com/@_ikuto_" },
      { label: "TikTok", url: "https://www.tiktok.com/@ikuto_jpn" },
    ],
    works: [
      { t: "Artist Works", d: "制作した楽曲一覧", links: [
        { label: "Apple Music", url: "https://music.apple.com/jp/artist/ikuto/1660733425" },
        { label: "Spotify", url: "https://open.spotify.com/intl-ja/artist/0wxtAGIx6Xh8iaSCJhDvDF" },
      ] },
      { t: "Mixing Works", d: "REC / MIX / MASTERを担当した楽曲をまとめたプレイリスト", links: [
        { label: "YouTube", url: "https://youtube.com/playlist?list=PLokKNabfO1puJGHlgIuTPPvI4k3QkGHsu" },
      ] },
      { t: "IKUTO Works", d: "参加したリリース作品・提供楽曲をまとめたプレイリスト", links: [
        { label: "YouTube", url: "https://youtube.com/playlist?list=PLokKNabfO1pvhHk0Sly_wjBv-reff75QC" },
      ] },
    ],
  },
  hasWorks: false,
  hasGallery: false,
  equipment: [
    { label: "MICROPHONE", name: "AKG C414 XLS-Y4\nAudio-Technica AT4050", img: unsplash("photo-1478737270239-2f02b77fc618") },
    { label: "INTERFACE", name: "Universal Audio\nApollo Twin X DUO", img: unsplash("photo-1598653222000-6b7b7a552625") },
    { label: "MONITOR", name: "YAMAHA HS5", img: unsplash("photo-1545454675-3531b543be5d") },
    { label: "DAW", name: "Cubase Pro\nLogic Pro X", img: unsplash("photo-1598488035139-bdbb2231ce04") },
  ],
  band2: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=1600&q=70&auto=format&fit=crop",
  faq: [
    { q: "初めてでも利用できますか？", a: "はい。初めての方でも安心してご利用いただけます。" },
    { q: "エンジニアはつきますか？", a: "はい。すべてのご予約にエンジニア（IKUTO）が付きます。" },
    { q: "1曲作るのに何時間必要ですか？", a: "REC〜MIX / MASTERまで、最短で約2〜2.5時間が目安です。その場で完成します。※楽曲やREC量によって前後します。" },
    { q: "RECだけ / MIX・MASTERだけでも利用できますか？", a: "はい。RECのみ、MIX / MASTERのみでもご利用いただけます。" },
    { q: "Trackはどうすればいいですか？", a: "事前にお送りいただくか、当日その場で共有していただければOKです。" },
    { q: "何人まで利用できますか？", a: "最大6名までご利用いただけます。" },
    { q: "データはいつもらえますか？", a: "基本的に、セッション終了後その場で納品します。最短でその場で完成・お持ち帰りいただけます。" },
    { q: "飲食はできますか？", a: "はい。飲食可能です。匂いの強い食べ物はご遠慮ください。" },
  ],
  access: {
    headline: "池袋駅から乗換なし約5分",
    routes: [
      [
        { kind: "st", name: "池袋駅" },
        { kind: "seg", b: "西武池袋線", t: "2駅・約5分" },
        { kind: "st", name: "東長崎駅", line: "西武池袋線", maps: maps("東長崎駅") },
        { kind: "seg", b: "WALK", t: "徒歩6分", walk: true },
        { kind: "st", name: "CONNECT Studio 池袋店", goal: true },
      ],
      [
        { kind: "st", name: "落合南長崎駅", line: "都営大江戸線", maps: maps("落合南長崎駅") },
        { kind: "seg", b: "WALK", t: "徒歩10分", walk: true },
        { kind: "st", name: "CONNECT Studio 池袋店", goal: true },
      ],
    ],
    notes: [
      { strong: "東京都豊島区長崎", text: "詳細住所はご予約確定後にお送りします。" },
      { strong: "お車でお越しの方", text: "近隣にコインパーキングがあります。" },
    ],
  },
  contact: { topics: ["予約について", "料金について", "機材について", "制作の相談", "その他"], placeholder: "ご自由にご記入ください" },
  bookLead: "ここから、音楽で繋がる。\nTrackを持って、最短でその場で1曲完成。予約ページから日時と時間を選ぶだけ。",
  footer: {
    area: "東京都豊島区長崎",
    lines: ["西武池袋線 東長崎駅 徒歩6分", "都営大江戸線 落合南長崎駅 徒歩10分"],
    hours: "10:00 — 23:00 / 定休日なし（不定休）",
  },
};

export const NERIMA: Studio = {
  slug: "nerima",
  nameJa: "練馬店",
  areaEn: "NERIMA",
  title: "CONNECT Studio 練馬店｜東京・練馬のレコーディングスタジオ｜MIX・マスタリング立ち合い対応",
  description: "東京都練馬区豊玉北のレコーディングスタジオ。新江古田駅から徒歩8分。録音からMIX・マスタリングまで立ち合いで完結、1時間5,500円から（3時間以上は1時間あたり5,000円）。オンラインMIXは7,000円から、リテイク無制限。",
  bookingUrl: "https://book.squareup.com/appointments/atrhlg3x3adiil/location/LJFDVKXY7Y7PC/services",
  email: "jfliponthegame@gmail.com",
  social: { instagram: IG("jfliponthegame") },
  hero: {
    lead: "東京・練馬のレコーディングスタジオ",
    big: "録音からMIX・マスタリングまで、",
    em: "その場で立ち合い完結。",
    slides: ["/assets/hero-bg.jpg", "/assets/photo-06.jpg", "/assets/photo-05.jpg", "/assets/photo-07.jpg", "/assets/photo-08.jpg", "/assets/photo-03.jpg"],
  },
  marquee: ["RECORDING", "MIX", "MASTERING", "ENGINEER INCLUDED", "立ち合いで一貫仕上げ", "NERIMA, TOKYO"],
  about: {
    lead: "アーティストの理想のサウンドを、その場で創り上げる立ち合い型スタジオ。",
    body: "東京・練馬のレコーディングスタジオ。ボーカル録音からMIX・マスタリングまでを一貫して行い、納品までの時間とワークフローを最短化します。方向性を相談しながら、その日のうちに仕上がりを確認できます。",
    points: [
      { k: "ONE STOP", v: "立ち合いMIX / マスタリング完結", s: "録音からその場でMIX・マスタリングまで一貫対応。" },
      { k: "GEAR", v: "UA Sphere DLX & 防音環境", s: "マイクモデリング対応のフラッグシップ機と、施工済みの防音ブース。" },
      { k: "ACCESS", v: "新江古田 徒歩8分", s: "江古田駅からも徒歩10分。大江戸線／西武池袋線から。" },
    ],
    photos: [
      { src: "/assets/photo-02.jpg", alt: "UA Sphere DLX" },
      { src: "/assets/photo-06.jpg", alt: "スタジオ内観" },
      { src: "/assets/photo-01.jpg", alt: "ミキサー" },
    ],
  },
  engineerName: "JFLIP",
  price: {
    sideTitle: "エンジニア（JFLIP）付き",
    sideNote: "REC / MIX / MASTER すべて込み。表示価格はすべて税込です。",
    extension: "15min / ¥1,400",
    // Square「レコーディング（REC/MIX/MASTER込み）」（練馬）と揃える
    plans: [
      { h: 1, price: 5500 },
      { h: 1.5, price: 8250 },
      { h: 2, price: 11000, note: "ボーカルRecやピッチ修正、サクッと利用に" },
      { h: 2.5, price: 13750 },
      { h: 3, price: 15000, note: "1曲を丁寧にレコーディングしたい方向け" },
      { h: 3.5, price: 17500 },
      { h: 4, price: 20000, note: "複数テイクの録音やハモり・コーラスまでじっくり録りたい方向け" },
      { h: 4.5, price: 22500 },
    ],
    defaultIndex: 4,
    hotFrom: 3,
    perHour: "¥5,000 / h",
    perHourText: "3時間以上は1時間あたり ¥5,000。長く録るほどおトクです。",
    checks: ["30分単位で選べます", "エンジニア立ち合い込み", "表示はすべて税込"],
    mix: {
      plans: [
        { name: "MIX / MASTERING（2mix納品）", price: "¥7,000〜" },
        { name: "パラ・ステムからのMIX", price: "¥12,000〜" },
        { name: "リテイク（修正）", price: "無制限" },
      ],
      note: "※ MIX / MASTERING はオンライン納品（WAV・MP3）のみの対応です。上記は最低料金で、トラック数・楽曲の尺・納期によって変動します。正確なお見積りはメールまたはInstagram DMからお問い合わせください。",
    },
  },
  info: [
    { l: "OPEN", b: "13:00 — 23:00", s: "日曜定休・年末年始は別途ご案内" },
    { l: "PAYMENT", b: "現金 / カード", ja: true, s: "クレジットカード（タッチ決済対応）" },
    { l: "ACCESS", b: "新江古田 徒歩8分", ja: true, s: "西武池袋線 江古田駅からは徒歩10分" },
  ],
  availability: { closedWeekday: 0 },
  band: { img: "/assets/photo-07.jpg", t1: "Record. Mix.", em: "Connect.", s: "録音からMIX・マスタリングまで、同じ部屋で。\nエンジニアと方向性を決めながら、その場で仕上げる。" },
  flow: {
    total: "その日のうちに仕上がりを確認",
    totalSub: "1曲を丁寧に仕上げるなら 3h〜 がおすすめ",
    steps: [
      { t: "BOOK", d: "予約ページから日時・時間を選択", x: "WEB予約ページから日時と利用時間を選ぶだけ。24時間受け付けています。" },
      { t: "TRACK", d: "Trackを用意", x: "ビートや素材を用意してご来店ください。制作内容は予約時の備考欄でお知らせください。" },
      { t: "STUDIO", d: "スタジオへ来店", x: "詳細な住所は予約確定メールでご案内します。新江古田駅から徒歩8分。" },
      { t: "REC", d: "エンジニア立ち合いで録音", x: "UA Sphere DLX と防音ブースで、声の質感をそのまま収録します。" },
      { t: "MIX / MASTER", d: "その場でMIX・マスタリング", x: "方向性を一緒に相談しながら、その場でMIX・マスタリングまで仕上げます。" },
      { t: "DONE", d: "その日のうちに仕上がりを確認", x: "その日のうちに仕上がりを確認。データでお渡しします。" },
    ],
  },
  hasWorks: true,
  hasGallery: true,
  equipment: [
    { label: "MICROPHONE", name: "Universal Audio Sphere DLX", note: "定番マイクをモデリングできるフラッグシップ・モデリングマイクシステム。", img: "/assets/photo-02.jpg" },
    { label: "AUDIO INTERFACE", name: "MOTU UltraLite mk5", note: "低レイテンシー・高安定のUSBオーディオインターフェース。", img: "/assets/photo-04.jpg" },
    { label: "DAW", name: "PreSonus Studio One", note: "録音からMIX・マスタリングまで同一環境で完結するワークフロー。", img: "/assets/photo-08.jpg" },
    { label: "MONITOR", name: "ADAM Audio T7V", note: "リボンツイーター採用。低域から高域までフラットなモニタリング環境。", img: "/assets/photo-03.jpg" },
    { label: "HEADPHONES", name: "SONY MDR-7506\naudio-technica ATH-M50x", note: "定番の2機種を用途に応じて使い分け。ヘッドホンは複数本ご用意。", img: "/assets/photo-05.jpg" },
    { label: "ENVIRONMENT", name: "防音レコーディングブース", note: "吸音施工済みブース。声のニュアンスをそのまま記録できます。", img: "/assets/hero-bg.jpg" },
  ],
  band2: "/assets/photo-08.jpg",
  faq: [
    { q: "料金にエンジニア代は含まれますか？", a: "はい。表示価格はすべて税込・エンジニア立ち合い込みです。REC・MIX・MASTERまで、追加料金はかかりません。" },
    { q: "何時間から予約できますか？", a: "1時間から、30分単位でご予約いただけます。3時間以上は1時間あたり¥5,000です。延長は15分 ¥1,400です。" },
    { q: "MIX / マスタリングだけの依頼はできますか？", a: "はい。オンラインで対応しています（2mix納品 ¥7,000〜、パラ・ステムからのMIX ¥12,000〜）。リテイクは回数無制限です。トラック数・尺・納期によって変動するため、正確なお見積りはメールまたはInstagramのDMからお問い合わせください。" },
    { q: "支払い方法は？", a: "現金・クレジットカード（タッチ決済対応）がご利用いただけます。" },
    { q: "スタジオの住所は？", a: "東京都練馬区豊玉北です。詳細な住所はご予約確定メールにてご案内します。" },
    { q: "定休日はありますか？", a: "日曜定休です。営業時間は13:00〜23:00。年末年始は別途ご案内します。" },
    { q: "2ヶ月以上先の予約はできますか？", a: "空き状況カレンダーと予約ページは来月分までです。再来月以降はInstagram DMまたはメールでお問い合わせください。" },
  ],
  access: {
    headline: "2路線の駅から徒歩圏内",
    routes: [
      [
        { kind: "st", name: "新江古田駅", line: "都営大江戸線", maps: maps("新江古田駅") },
        { kind: "seg", b: "WALK", t: "徒歩8分", walk: true },
        { kind: "st", name: "CONNECT Studio 練馬店", goal: true },
      ],
      [
        { kind: "st", name: "江古田駅", line: "西武池袋線", maps: maps("江古田駅") },
        { kind: "seg", b: "WALK", t: "徒歩10分", walk: true },
        { kind: "st", name: "CONNECT Studio 練馬店", goal: true },
      ],
    ],
    notes: [
      { strong: "東京都練馬区豊玉北", text: "詳細住所はご予約確定メールにてご案内します。" },
      { strong: "営業時間", text: "13:00 — 23:00 / 日曜定休。年末年始は別途ご案内します。" },
    ],
  },
  contact: {
    topics: ["スタジオのご予約について", "MIX / マスタリングのご依頼", "料金について", "機材について", "その他"],
    placeholder: "ご希望の日時、制作内容（レコーディング / MIX / マスタリング）をご記入ください。",
  },
  bookLead: "録音からMIX・マスタリングまで、その場で立ち合い完結。\n予約ページから日時と時間を選ぶだけ。",
  footer: {
    area: "東京都練馬区豊玉北",
    lines: ["都営大江戸線 新江古田駅 徒歩8分", "西武池袋線 江古田駅 徒歩10分"],
    hours: "13:00 — 23:00 / 日曜定休",
  },
  campaign: { href: "/campaign", label: "お友達紹介で1時間無料 →" },
};

export const STUDIOS: Record<StudioSlug, Studio> = { ikebukuro: IKEBUKURO, nerima: NERIMA };
