import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Segoe UI"', '"Microsoft JhengHei"', '"PingFang TC"', "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
