import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';

// Execute production TS with only external IO replaced. No environment/DB credentials loaded.
export function loadTS(path, replacements = {}, cache = new Map()) {
  const file = resolve(path);
  if (cache.has(file)) return cache.get(file).exports;
  const loadedModule = { exports: {} };
  cache.set(file, loadedModule);
  const localRequire = createRequire(file);
  const require = name => {
    if (name in replacements) return replacements[name];
    if (name.endsWith('.css')) return {};
    if (name.startsWith('@/') || name.startsWith('.')) {
      const base = name.startsWith('@/') ? resolve(name.slice(2)) : resolve(dirname(file), name);
      const target = [base, `${base}.ts`, `${base}.tsx`].find(existsSync);
      if (target) return loadTS(target, replacements, cache);
    }
    return localRequire(name);
  };
  const code = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
    fileName: file,
  }).outputText;
  new Function('require', 'module', 'exports', code)(require, loadedModule, loadedModule.exports);
  return loadedModule.exports;
}
