// eslint-disable-next-line @typescript-eslint/no-require-imports -- Webpack's local loader uses CommonJS.
const ts = require('typescript');

module.exports = function (source) {
  if (this.resourcePath.endsWith('.css')) {
    const names = Object.fromEntries([...source.matchAll(/\.([a-zA-Z][\w-]*)/g)].map(match => [match[1],match[1]]));
    return `module.exports = ${JSON.stringify(names)}`;
  }
  return ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
    fileName: this.resourcePath,
  }).outputText;
};
