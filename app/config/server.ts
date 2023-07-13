import md5 from "spark-md5";

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      CODE?: string;
      BASE_URL?: string;
      VERCEL?: string;
      BUILD_MODE?: "standalone" | "export";
      BUILD_APP?: string; // is building desktop app
    }
  }
}

const ACCESS_CODES = (function getAccessCodes(): Set<string> {
  const code = process.env.CODE;

  try {
    const codes = (code?.split(",") ?? [])
      .filter((v) => !!v)
      .map((v) => md5.hash(v.trim()));
    return new Set(codes);
  } catch (e) {
    return new Set();
  }
})();

export const getServerSideConfig = () => {
  if (typeof process === "undefined") {
    throw Error(
      "[Server Config] you are importing a nodejs-only module outside of nodejs",
    );
  }

  return {
    code: process.env.CODE,
    codes: ACCESS_CODES,
    needCode: ACCESS_CODES.size > 0,
    baseUrl: process.env.BASE_URL,
    isVercel: !!process.env.VERCEL,
    hideBalanceQuery: !!process.env.HIDE_BALANCE_QUERY,
  };
};
