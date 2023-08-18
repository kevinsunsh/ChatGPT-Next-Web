import webpack from "webpack";

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });

    config.plugins.push(
      new webpack.optimize.LimitChunkCountPlugin({ maxChunks: 1 }),
    );

    config.resolve.fallback = {
      child_process: false,
    };

    return config;
  },
  output: "standalone",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
