import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import globals from 'globals';

export default [
  { ignores: ['out/**', 'dist/**', '**/*.d.ts', '**/__tests__/**'] },
  eslint.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module'
      },
      globals: {
        ...globals.node,
        ...globals.es2022
      }
    },
    plugins: {
      '@typescript-eslint': tseslint
    },
    rules: {
      '@typescript-eslint/naming-convention': [
        'warn',
        {
          selector: 'interface',
          format: ['PascalCase'],
          custom: {
            regex: '^I[A-Z]',
            match: false
          }
        }
      ],
      '@typescript-eslint/no-unused-vars': 'off', // 完全关闭未使用变量检查
      '@typescript-eslint/no-explicit-any': 'off', // 关闭any类型警告
      'curly': 'warn', // 降低严重性
      'eqeqeq': 'warn',
      'no-throw-literal': 'warn',
      'semi': 'warn',
      'no-unused-vars': 'off', // 使用TypeScript的版本
      'no-control-regex': 'off', // 关闭控制字符检查
      'no-unreachable': 'off', // 关闭不可达代码检查
      'no-undef': 'off' // 使用TypeScript的类型检查
    }
  }
];