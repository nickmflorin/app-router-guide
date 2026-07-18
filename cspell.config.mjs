import fs from 'fs';

const DefaultGlobs = [
  '**/node_modules/**',
  '**/generated/**',
  '**/dist/**',
  '**/out/**',
  '**/build/**',
  '**/.next/**',
  '**/coverage/**',
  'package.json',
  'pnpm-lock.yaml',
  '**/.prettierignore',
];

/**
 * Includes the glob patterns from the .prettierignore file in the cspell configuration's
 * 'ignorePaths' option.  By default, cspell ignores files listed in the .gitignore file but does
 * not ignore files listed in the .prettierignore file.
 */
const includePrettierIgnoreGlobPatterns = async patterns => {
  const file = await fs.promises.readFile('./.prettierignore', 'utf-8');
  const prettierIgnoredPatterns = file.split('\n').filter(Boolean);

  return prettierIgnoredPatterns.reduce((acc, path) => {
    const standardized = path.endsWith('/') ? `${path}**` : path;
    if (!acc.includes(standardized)) {
      return [...acc, standardized];
    }
    return acc;
  }, patterns);
};

const config = async () => {
  const ignorePaths = await includePrettierIgnoreGlobPatterns(DefaultGlobs);

  return {
    allowCompoundWords: true,
    dictionaries: [
      'project-dictionary',
      'typescript',
      'fonts',
      'filetypes',
      'bash',
      'css',
      'html',
      'node',
      'softwareTerms',
    ],
    dictionaryDefinitions: [
      {
        addWords: true,
        name: 'project-dictionary',
        path: './dictionary.txt',
      },
    ],
    ignorePaths,
    ignoreRandomStrings: true,
    language: 'en',
    version: '0.2',
  };
};

export default config;
