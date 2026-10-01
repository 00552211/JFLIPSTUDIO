import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 未設定でも必ず文字列として埋め込む。ビルド時に確定させることで、
  // 2号店が非公開のビルドでは2号店のデータがクライアントのJSから消える。
  env: {
    NEXT_PUBLIC_STORE2_ENABLED: process.env.NEXT_PUBLIC_STORE2_ENABLED ?? "false",
  },
};

export default nextConfig;
