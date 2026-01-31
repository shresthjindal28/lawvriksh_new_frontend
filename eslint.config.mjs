import nextConfig from 'eslint-config-next/core-web-vitals';
import prettierConfig from 'eslint-config-prettier';

const eslintConfig = [
  ...nextConfig,
  prettierConfig,
  {
    files: ['components/reference-manager/client/tables/VirtualizedReferenceTable.tsx'],
    rules: {
      'react-hooks/incompatible-library': 'off',
    },
  },
  {
    rules: {
      'no-console': 'off',
      'react/no-unescaped-entities': 'off',
    },
  },
];

export default eslintConfig;
