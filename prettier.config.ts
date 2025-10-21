import type { Config } from "prettier";

const config: Config = {
  semi: true,
  trailingComma: "es5",
  singleQuote: false,
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  endOfLine: "lf",
  arrowParens: "always",
  bracketSpacing: true,
  jsxSingleQuote: false,
  plugins: ["prettier-plugin-tailwindcss"],
};

export default config;
