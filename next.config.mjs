/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    /* في التطوير: بدون رؤوس مخصّصة — أحياناً تتعارض مع تحميل /_next/static (CSS/JS) */
    if (process.env.NODE_ENV !== "production") {
      return [];
    }
    const security = [
      { key: "X-DNS-Prefetch-Control", value: "on" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(*), interest-cohort=()"
      },
      {
        key: "Strict-Transport-Security",
        value: "max-age=31536000; includeSubDomains; preload"
      }
    ];
    /* لا تُطبَّق على أصول Next (CSS/صور) لتفادي تعارض مع نوع المحتوى أو التخزين المؤقت */
    return [
      {
        source: "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
        headers: security
      }
    ];
  }
};

export default nextConfig;
