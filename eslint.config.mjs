import eslint from '@eslint/js'
import { defineConfig } from 'eslint/config'

export default defineConfig(
  [
    eslint.configs.recommended,
    {
      files: ['**/*.{js,jsx,ts,tsx}'],
      languageOptions: {
        parserOptions: {
          ecmaVersion: 'latest',
          sourceType: 'module',
          project: ['./frontend/tsconfig.json', './backend/tsconfig.json'],
        },
      },
      rules: {
        'indent': ['error', 2],
        'quotes': ['error', 'single'],
        'semi': 0,
        'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      },
    },
  ]
)