/** @type {import('next').NextConfig} */

module.exports = {
  webpack: (config) => {
    config.externals.push({
      "chrome-aws-lambda": "chrome-aws-lambda",
      "puppeteer-core": "puppeteer-core",
    });
    return config;
  },
  // 추가 최적화 설정을 여기에 포함시킬 수 있습니다.
  reactStrictMode: true,
  swcMinify: true,
};
