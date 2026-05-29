import { defineConfig } from 'tsdown';
import packages from './package.json' with { type: 'json' };

const external = ['@electric-sql/pglite'];

const noExternal = Object.keys({
  ...packages.dependencies,
  //   ...packages.devDependencies,
  //   ...packages.peerDependencies,
})
  .filter(pkg => !pkg.startsWith('@types/')) // 排除类型定义包
  .filter(pkg => !external.includes(pkg)); // 排除已经在 external 列表中的包

export default defineConfig({
  entry: ['./src/app.ts'],
  format: {
    // cjs: { target: ['node20'] },
    esm: { target: ['esnext'] },
  },
  shims: true,
  // unbundle: true,
  noExternal,
  external,
});
