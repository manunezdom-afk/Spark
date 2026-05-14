import { FlatCompat } from "@eslint/eslintrc";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const config = [
  { ignores: [".next/**", "node_modules/**", "public/sw.js", "public/workbox-*.js", "next-env.d.ts", ".claude/**"] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "react/no-unescaped-entities": "off",
      "@typescript-eslint/no-require-imports": "off",
      // CLAUDE.md: Lucide icons SIEMPRE strokeWidth={1.5}. Regla custom
      // que falla cualquier literal numérico ≠ 1.5 dentro de
      // strokeWidth={...}. Acepta variables/expresiones dinámicas.
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "JSXAttribute[name.name='strokeWidth'] > JSXExpressionContainer > Literal[value!=1.5]",
          message:
            "Lucide icons deben usar strokeWidth={1.5} (regla del ecosistema en CLAUDE.md).",
        },
      ],
    },
  },
];

export default config;
