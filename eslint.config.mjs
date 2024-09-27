import globals from "globals";
import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";

export default [
    js.configs.recommended,
    eslintConfigPrettier,
    {
        files: ["**/*.js"],
        languageOptions: {
            sourceType: "commonjs",
            globals: {
                ...globals.node,
            },
            ecmaVersion: "latest",
        },
        rules: {
            eqeqeq: "error",
            "no-trailing-spaces": "error",
            "object-curly-spacing": ["error", "always"],
            "arrow-spacing": ["error", { before: true, after: true }],
            "no-console": "off",
        },
    },
    {
        ignores: ["dist/**", "build/**"],
    },
];
