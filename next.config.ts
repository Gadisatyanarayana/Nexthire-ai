import type { NextConfig } from "next";

const baseSecurityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-site" },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  async headers() {
    const headers = [...baseSecurityHeaders];
    const voiceHeaders = headers.map((item) =>
      item.key === "Permissions-Policy"
        ? { key: item.key, value: "camera=(self), microphone=(self), geolocation=()" }
        : item
    );

    if (process.env.NODE_ENV === "production") {
      headers.push({
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      });
      voiceHeaders.push({
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      });
    }

    return [
      {
        source: "/voice-interviewer",
        headers: voiceHeaders,
      },
      {
        source: "/voice-interviewer/:path*",
        headers: voiceHeaders,
      },
      {
        source: "/api/voice-interview",
        headers: voiceHeaders,
      },
      {
        source: "/:path*",
        headers,
      },
    ];
  },
};

export default nextConfig;
