import { defineConfig, globalIgnores } from 'eslint/config';
import { fixupConfigRules } from '@eslint/compat';
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';
import eslintPluginUnicorn from 'eslint-plugin-unicorn';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import tseslint from 'typescript-eslint';

const compat = new FlatCompat({
    baseDirectory: import.meta.dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all,
});

export default defineConfig([
    globalIgnores([
        '**/node_modules/',
        '**/public/',
        '**/.next/',
        'tailwind.config.js',
        'postcss.config.js',
        'eslint.config.mjs',
        'vitest.config.mts',
    ]),
    {
        extends: fixupConfigRules(
            compat.extends(
                'prettier',
                'plugin:import/recommended',
                'plugin:import/typescript',
                'next/core-web-vitals',
                'next/typescript',
            ),
        ),

        plugins: {
            prettierRecommended: eslintPluginPrettierRecommended,
            unicorn: eslintPluginUnicorn,
            tsRecommendedTypeChecked: tseslint.configs.recommendedTypeChecked,
        },

        languageOptions: {
            globals: globals.builtin,
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },

        rules: {
            'no-console': 'error',
            'linebreak-style': 'off',
            camelcase: 'error',
            eqeqeq: 'error',
            'no-trailing-spaces': 'error',
            'eol-last': 'error',
            'no-throw-literal': 'error',
            'react/jsx-props-no-spreading': 'off',

            'react/jsx-curly-brace-presence': [
                'error',
                {
                    props: 'never',
                },
            ],

            'import/no-useless-path-segments': 'error',
            'import/order': 'error',
            'import/exports-last': 'error',
            'import/no-unresolved': 'error',
            'import/group-exports': 'error',
            'import/prefer-default-export': 'error',

            '@typescript-eslint/array-type': [
                'error',
                {
                    default: 'generic',
                },
            ],

            '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'error',
            '@typescript-eslint/no-unnecessary-condition': 'error',
            '@typescript-eslint/no-unused-vars': 'error',
            '@typescript-eslint/no-unsafe-argument': 'off',
            '@typescript-eslint/no-unsafe-assignment': 'off',
            '@typescript-eslint/no-unsafe-member-access': 'off',
            '@typescript-eslint/prefer-optional-chain': 'error',
            '@typescript-eslint/prefer-nullish-coalescing': 'error',
            '@typescript-eslint/consistent-type-definitions': 'error',

            '@typescript-eslint/consistent-type-imports': [
                'error',
                {
                    prefer: 'type-imports',
                },
            ],

            '@typescript-eslint/consistent-type-exports': [
                'error',
                {
                    fixMixedExportsWithInlineTypeSpecifier: true,
                },
            ],

            '@typescript-eslint/no-misused-promises': 'off',
            'unicorn/no-null': 'off',
            'unicorn/no-abusive-eslint-disable': 'off',
            'unicorn/prevent-abbreviations': 'off',
            'unicorn/prefer-node-protocol': 'off',
            'unicorn/no-new-array': 'off',
            'unicorn/numeric-separators-style': 'off',
            'unicorn/no-array-reduce': 'off',
            'unicorn/no-array-callback-reference': 'off',
            'unicorn/prefer-at': 'off',
        },
    },
]);
