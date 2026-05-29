#!/usr/bin/env bun
/**
 * C端 Node.js 程序自动更新工具
 * 运行环境：Bun
 * 功能：版本检查、下载、校验、依赖更新、程序启动
 *
 * 使用文档：
 * ========
 *
 * 安装依赖：
 * ```bash
 * bun install
 * ```
 *
 * 基本命令：
 * ```bash
 * # 检查当前版本
 * bun run version-manager.ts check
 *
 * # 检查远程最新版本
 * bun run version-manager.ts check --remote
 *
 * # 更新到最新版本
 * bun run version-manager.ts update
 *
 * # 更新到指定版本
 * bun run version-manager.ts update --version v1.2.3
 *
 * # 启动程序（生产环境）
 * bun run version-manager.ts start
 *
 * # 完整更新流程（检查->下载->校验->更新依赖->启动）
 * bun run version-manager.ts deploy
 * ```
 *
 * 配置文件：
 * =========
 * 创建 update-config.json：
 * ```json
 * {
 *   "repository": {
 *     "type": "github",
 *     "owner": "your-username",
 *     "repo": "your-repo-name",
 *     "token": "ghp_your_github_token"
 *   },
 *   "app": {
 *     "name": "your-app-name",
 *     "startCommand": "bun run start",
 *     "buildCommand": "bun run build"
 *   },
 *   "backup": {
 *     "enabled": true,
 *     "maxBackups": 3
 *   }
 * }
 * ```
 *
 * 发布流程适配指南：
 * ================
 *
 * 1. GitHub Release 设置：
 *    - 使用语义化版本号 (v1.0.0, v1.0.1...)
 *    - 上传压缩包文件名格式：{app-name}-{version}.tar.gz
 *    - Release 描述中包含更新日志
 *    - 生成 SHA256 校验文件并上传
 *
 * 2. 项目结构要求：
 *    - package.json 必须包含正确的版本号
 *    - 必须有 bun.lockb 锁文件
 *    - 生产环境启动脚本设置为 "start"
 *
 * 3. CI/CD 自动化：
 *    ```yaml
 *    # .github/workflows/release.yml
 *    name: Release
 *    on:
 *      push:
 *        tags: ['v*']
 *    jobs:
 *      release:
 *        runs-on: ubuntu-latest
 *        steps:
 *          - uses: actions/checkout@v3
 *          - run: tar -czf ${{ github.event.repository.name }}-${{ github.ref_name }}.tar.gz --exclude=node_modules --exclude=.git .
 *          - run: sha256sum ${{ github.event.repository.name }}-${{ github.ref_name }}.tar.gz > ${{ github.event.repository.name }}-${{ github.ref_name }}.tar.gz.sha256
 *          - uses: softprops/action-gh-release@v1
 *            with:
 *              files: |
 *                ${{ github.event.repository.name }}-${{ github.ref_name }}.tar.gz
 *                ${{ github.event.repository.name }}-${{ github.ref_name }}.tar.gz.sha256
 *    ```
 *
 * 环境变量：
 * ========
 * - GITHUB_TOKEN: GitHub API 访问令牌
 * - GITEE_TOKEN: Gitee API 访问令牌（如使用 Gitee）
 * - UPDATE_CONFIG: 配置文件路径（默认 ./update-config.json）
 */

import { program } from 'commander';
import { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync, renameSync } from 'fs';
import { join, dirname, basename } from 'path';
import { execSync } from 'child_process';
import { createHash } from 'crypto';

interface UpdateConfig {
  repository: {
    type: 'github' | 'gitee';
    owner: string;
    repo: string;
    token?: string;
  };
  app: {
    name: string;
    startCommand: string;
    buildCommand?: string;
  };
  backup: {
    enabled: boolean;
    maxBackups: number;
  };
}

interface ReleaseInfo {
  tag_name: string;
  name: string;
  body: string;
  assets: Array<{
    name: string;
    browser_download_url: string;
    size: number;
  }>;
}

class VersionManager {
  private config: UpdateConfig = {} as UpdateConfig;
  private configPath: string;
  private backupDir: string;

  constructor() {
    this.configPath = process.env.UPDATE_CONFIG || './update-config.json';
    this.backupDir = './backups';
    this.loadConfig();
  }

  private loadConfig(): void {
    if (!existsSync(this.configPath)) {
      console.error('❌ 配置文件不存在，请创建 update-config.json');
      process.exit(1);
    }

    try {
      this.config = JSON.parse(readFileSync(this.configPath, 'utf-8'));
      this.validateConfig();
    } catch (error) {
      console.error('❌ 配置文件格式错误:', error);
      process.exit(1);
    }
  }

  private validateConfig(): void {
    const required = ['repository.type', 'repository.owner', 'repository.repo', 'app.name', 'app.startCommand'];
    for (const path of required) {
      const keys = path.split('.');
      let obj: any = this.config;
      for (const key of keys) {
        if (!obj || !obj[key]) {
          console.error(`❌ 配置文件缺少必需字段: ${path}`);
          process.exit(1);
        }
        obj = obj[key];
      }
    }
  }

  private async fetchReleaseInfo(version?: string): Promise<ReleaseInfo> {
    const { type, owner, repo, token } = this.config.repository;

    let url: string;
    const headers: Record<string, string> = {
      'User-Agent': 'Version-Manager/1.0.0',
    };

    if (type === 'github') {
      url = version ? `https://api.github.com/repos/${owner}/${repo}/releases/tags/${version}` : `https://api.github.com/repos/${owner}/${repo}/releases/latest`;
      if (token) headers.Authorization = `Bearer ${token}`;
    } else {
      url = version ? `https://gitee.com/api/v5/repos/${owner}/${repo}/releases/tags/${version}` : `https://gitee.com/api/v5/repos/${owner}/${repo}/releases/latest`;
      if (token) url += `?access_token=${token}`;
    }

    try {
      const response = await fetch(url, { headers });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('❌ 获取版本信息失败:', error);
      process.exit(1);
    }
  }

  private getCurrentVersion(): string {
    try {
      const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));
      return pkg.version;
    } catch {
      return '0.0.0';
    }
  }

  private compareVersions(v1: string, v2: string): number {
    const normalize = (v: string) =>
      v
        .replace(/^v/, '')
        .split('.')
        .map(n => parseInt(n, 10));
    const a = normalize(v1);
    const b = normalize(v2);

    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      const numA = a[i] || 0;
      const numB = b[i] || 0;
      if (numA > numB) return 1;
      if (numA < numB) return -1;
    }
    return 0;
  }

  private async downloadFile(url: string, filePath: string): Promise<void> {
    console.log(`📥 下载文件: ${basename(filePath)}`);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`下载失败: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    writeFileSync(filePath, new Uint8Array(buffer));
  }

  private calculateSHA256(filePath: string): string {
    const fileBuffer = readFileSync(filePath);
    return createHash('sha256').update(fileBuffer).digest('hex');
  }

  private async verifyFile(filePath: string, expectedHash?: string): Promise<boolean> {
    if (!expectedHash) {
      console.log('⚠️  未提供校验和，跳过文件校验');
      return true;
    }

    const actualHash = this.calculateSHA256(filePath);
    const isValid = actualHash === expectedHash;

    if (isValid) {
      console.log('✅ 文件校验通过');
    } else {
      console.log('❌ 文件校验失败');
      console.log(`期望: ${expectedHash}`);
      console.log(`实际: ${actualHash}`);
    }

    return isValid;
  }

  private createBackup(): string | null {
    if (!this.config.backup.enabled) return null;

    if (!existsSync(this.backupDir)) {
      mkdirSync(this.backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = join(this.backupDir, `backup-${timestamp}.tar.gz`);

    try {
      execSync(`tar -czf "${backupPath}" --exclude=node_modules --exclude=.git --exclude=backups .`, {
        stdio: 'pipe',
      });
      console.log(`📦 已创建备份: ${backupPath}`);

      this.cleanupOldBackups();
      return backupPath;
    } catch (error) {
      console.error('⚠️  备份创建失败:', error);
      return null;
    }
  }

  private cleanupOldBackups(): void {
    try {
      const files = execSync(`ls -1t "${this.backupDir}"/backup-*.tar.gz`, { encoding: 'utf-8' }).trim().split('\n').filter(Boolean);

      if (files.length > this.config.backup.maxBackups) {
        const toDelete = files.slice(this.config.backup.maxBackups);
        for (const file of toDelete) {
          rmSync(file);
          console.log(`🗑️  删除旧备份: ${basename(file)}`);
        }
      }
    } catch {
      // 忽略清理错误
    }
  }

  private extractUpdate(filePath: string): void {
    console.log('📁 解压更新包...');

    try {
      execSync(`tar -xzf "${filePath}" --exclude=node_modules`, {
        stdio: 'pipe',
      });
      console.log('✅ 解压完成');
    } catch (error) {
      console.error('❌ 解压失败:', error);
      process.exit(1);
    }
  }

  private updateDependencies(): void {
    console.log('📦 更新依赖...');

    try {
      execSync('bun install', { stdio: 'inherit' });
      console.log('✅ 依赖更新完成');
    } catch (error) {
      console.error('❌ 依赖更新失败:', error);
      process.exit(1);
    }
  }

  private buildApp(): void {
    if (!this.config.app.buildCommand) return;

    console.log('🔨 构建应用...');
    try {
      execSync(this.config.app.buildCommand, { stdio: 'inherit' });
      console.log('✅ 构建完成');
    } catch (error) {
      console.error('❌ 构建失败:', error);
      process.exit(1);
    }
  }

  async checkVersion(remote: boolean = false): Promise<void> {
    const currentVersion = this.getCurrentVersion();
    console.log(`📍 当前版本: ${currentVersion}`);

    if (remote) {
      const releaseInfo = await this.fetchReleaseInfo();
      const latestVersion = releaseInfo.tag_name.replace(/^v/, '');
      console.log(`🌐 最新版本: ${latestVersion}`);

      const comparison = this.compareVersions(currentVersion, latestVersion);
      if (comparison < 0) {
        console.log('🆙 发现新版本，可以更新');
      } else if (comparison > 0) {
        console.log('🔮 当前版本较新');
      } else {
        console.log('✅ 已是最新版本');
      }
    }
  }

  async updateVersion(targetVersion?: string): Promise<void> {
    console.log('🚀 开始版本更新...');

    const releaseInfo = await this.fetchReleaseInfo(targetVersion);
    const newVersion = releaseInfo.tag_name.replace(/^v/, '');
    const currentVersion = this.getCurrentVersion();

    console.log(`📍 当前版本: ${currentVersion}`);
    console.log(`🎯 目标版本: ${newVersion}`);

    if (this.compareVersions(currentVersion, newVersion) === 0) {
      console.log('✅ 已是目标版本，无需更新');
      return;
    }

    // 查找更新包
    const appName = this.config.app.name;
    const assetName = `${appName}-${releaseInfo.tag_name}.tar.gz`;
    const checksumName = `${assetName}.sha256`;

    const updateAsset = releaseInfo.assets.find(asset => asset.name === assetName);
    const checksumAsset = releaseInfo.assets.find(asset => asset.name === checksumName);

    if (!updateAsset) {
      console.error(`❌ 未找到更新包: ${assetName}`);
      process.exit(1);
    }

    // 创建备份
    this.createBackup();

    // 下载更新包
    const updatePath = `./${assetName}`;
    await this.downloadFile(updateAsset.browser_download_url, updatePath);

    // 下载校验和
    let expectedHash: string | undefined;
    if (checksumAsset) {
      const checksumPath = `./${checksumName}`;
      await this.downloadFile(checksumAsset.browser_download_url, checksumPath);
      expectedHash = readFileSync(checksumPath, 'utf-8').trim().split(/\s+/)[0];
      rmSync(checksumPath);
    }

    // 校验文件
    if (!(await this.verifyFile(updatePath, expectedHash))) {
      rmSync(updatePath);
      console.error('❌ 文件校验失败，更新终止');
      process.exit(1);
    }

    // 解压更新
    this.extractUpdate(updatePath);
    rmSync(updatePath);

    // 更新依赖
    this.updateDependencies();

    // 构建应用
    this.buildApp();

    // 输出配置信息
    this.outputConfigInfo();

    console.log('🎉 更新完成！');
  }

  private outputConfigInfo(): void {
    const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));
    const configInfo = {
      version: pkg.version,
      name: pkg.name,
      dependencies: Object.keys(pkg.dependencies || {}).length,
      devDependencies: Object.keys(pkg.devDependencies || {}).length,
      scripts: Object.keys(pkg.scripts || {}),
      lastUpdated: new Date().toISOString(),
    };

    writeFileSync('./update-info.json', JSON.stringify(configInfo, null, 2));
    console.log('📄 已生成配置信息: update-info.json');
    console.log('📋 应用信息:');
    console.log(`   版本: ${configInfo.version}`);
    console.log(`   名称: ${configInfo.name}`);
    console.log(`   依赖数量: ${configInfo.dependencies}`);
    console.log(`   开发依赖数量: ${configInfo.devDependencies}`);
  }

  startApp(): void {
    console.log('🚀 启动应用...');

    try {
      execSync(this.config.app.startCommand, { stdio: 'inherit' });
    } catch (error) {
      console.error('❌ 应用启动失败:', error);
      process.exit(1);
    }
  }

  async deploy(): Promise<void> {
    console.log('🔄 执行完整部署流程...');

    await this.checkVersion(true);
    await this.updateVersion();
    this.startApp();
  }
}

// CLI 命令设置
const versionManager = new VersionManager();

program.name('version-manager').description('C端 Node.js 程序自动更新工具').version('1.0.0');

program
  .command('check')
  .description('检查版本信息')
  .option('-r, --remote', '检查远程最新版本')
  .action(async options => {
    await versionManager.checkVersion(options.remote);
  });

program
  .command('update')
  .description('更新到指定版本')
  .option('-v, --version <version>', '指定版本号')
  .action(async options => {
    await versionManager.updateVersion(options.version);
  });

program
  .command('start')
  .description('启动应用（生产环境）')
  .action(() => {
    versionManager.startApp();
  });

program
  .command('deploy')
  .description('完整部署流程（检查->更新->启动）')
  .action(async () => {
    await versionManager.deploy();
  });

program.parse();
