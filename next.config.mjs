import webpack from "webpack";

const disableChunk = !!process.env.DISABLE_CHUNK;
console.log("[Next] build with chunk: ", !disableChunk);

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });

    if (disableChunk) {
      config.plugins.push(
        new webpack.optimize.LimitChunkCountPlugin({ maxChunks: 1 }),
      );
    }

    config.resolve.fallback = {
      child_process: false,
    };

    return config;
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
