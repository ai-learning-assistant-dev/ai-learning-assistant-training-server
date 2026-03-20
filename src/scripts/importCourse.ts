/**
 * 课程导入脚本
 *
 * 支持两种导入方式：
 * 1. JSON 文件导入：读取课程 JSON 文件，通过 API 接口导入到数据库
 * 2. ZIP 文件导入：读取包含多个 course*.json 文件的 ZIP 压缩包，批量导入课程
 *
 * 用法:
 *   bun db:import:course <文件路径> [--base-url=http://localhost:3000]
 *
 * 参数:
 *   文件路径       JSON 文件或 ZIP 文件（必填）
 *   --base-url     API 服务地址（默认: http://localhost:3000）
 *
 * JSON 格式:
 *   单个课程: { id, title, description?, chapters: [...] }
 *   批量课程: [{ id, title, ... }, { id, title, ... }]
 *
 * ZIP 格式:
 *   包含多个 course*.json 文件的 ZIP 压缩包，支持递归目录结构
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { importCourseSchema, type ImportCoursePayload } from '../schemas/course';
import logger from '../utils/logger';

interface ImportResult {
  success: boolean;
  data?: { course_id: string; name: string };
  message?: string;
  error?: string;
  details?: unknown;
}

interface ZipImportResult {
  success: boolean;
  data?: {
    total: number;
    success: number;
    failed: number;
    results: Array<{
      filename: string;
      success: boolean;
      course_id?: string;
      name?: string;
      error?: string;
    }>;
  };
  message?: string;
  error?: string;
  details?: unknown;
}

/** 检查文件是否为 ZIP 文件 */
function isZipFile(filePath: string): boolean {
  return filePath.toLowerCase().endsWith('.zip');
}

function parseArgs(argv: string[]): { filePath: string; baseUrl: string } {
  const args = argv.slice(2);
  let baseUrl = 'http://localhost:3000';
  let filePath = '';

  for (const arg of args) {
    if (arg.startsWith('--base-url=')) {
      baseUrl = arg.slice('--base-url='.length);
    } else if (!arg.startsWith('--')) {
      filePath = arg;
    }
  }

  if (!filePath) {
    logger.error('❌ 请指定课程文件路径');
    logger.info('用法: bun db:import:course <文件路径> [--base-url=http://localhost:3000]');
    logger.info('文件路径可以是 JSON 文件或 ZIP 文件');
    process.exit(1);
  }

  return { filePath: resolve(filePath), baseUrl: baseUrl.replace(/\/$/, '') };
}

async function importSingleCourse(data: ImportCoursePayload, baseUrl: string, index?: number): Promise<boolean> {
  const prefix = index !== undefined ? `[${index + 1}] ` : '';
  const chapterCount = data.chapters?.length ?? 0;
  const sectionCount = data.chapters?.reduce((sum, ch) => sum + (ch.sections?.length ?? 0), 0) ?? 0;

  logger.info(`${prefix}📦 导入课程: "${data.title}"`);
  logger.info(`${prefix}   章节: ${chapterCount}, 小节: ${sectionCount}`);

  try {
    const response = await fetch(`${baseUrl}/api/courses/import?override=true`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = (await response.json()) as ImportResult;

    if (result.success) {
      logger.info(`${prefix}✅ 导入成功: course_id=${result.data?.course_id}`);
      return true;
    } else if (response.status === 409) {
      const details = result.details as { course_id?: string; name?: string } | undefined;
      logger.warn(`${prefix}⚠️ 课程已存在，跳过: "${data.title}" (course_id=${details?.course_id})`);
      return true;
    } else {
      logger.error(`${prefix}❌ 导入失败: ${result.error}`);
      if (result.details) logger.error(`${prefix}   详情: ${JSON.stringify(result.details)}`);
      return false;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('ECONNREFUSED') || message.includes('fetch failed')) {
      logger.error(`${prefix}❌ 无法连接到服务器 ${baseUrl}，请确保服务已启动 (bun dev)`);
    } else {
      logger.error(`${prefix}❌ 请求异常: ${message}`);
    }
    return false;
  }
}

/** 导入 ZIP 文件 */
async function importZipFile(filePath: string, baseUrl: string): Promise<boolean> {
  logger.info(`📦 导入 ZIP 文件: ${filePath}`);

  try {
    // 读取文件内容
    const fileContent = readFileSync(filePath);
    
    // 创建 FormData
    const formData = new FormData();
    const blob = new Blob([fileContent], { type: 'application/zip' });
    formData.append('file', blob, filePath.split('/').pop() || 'course.zip');

    // 发送请求
    const response = await fetch(`${baseUrl}/api/courses/import-zip?override=true`, {
      method: 'POST',
      body: formData,
    });

    const result = (await response.json()) as ZipImportResult;

    if (result.success && result.data) {
      const { total, success, failed, results } = result.data;
      
      logger.info(`📊 ZIP 导入汇总: 共 ${total} 个文件，成功 ${success} 个，失败 ${failed} 个`);
      
      // 输出详细结果
      for (const item of results) {
        if (item.success) {
          logger.info(`✅ ${item.filename}: 导入成功 (course_id=${item.course_id}, name="${item.name}")`);
        } else {
          logger.error(`❌ ${item.filename}: 导入失败 - ${item.error}`);
        }
      }
      
      if (failed > 0) {
        logger.warn(`⚠️ 部分文件导入失败，共 ${failed} 个失败`);
        return false;
      }
      
      logger.info('🎉 ZIP 文件导入完成！');
      return true;
    } else {
      logger.error(`❌ ZIP 导入失败: ${result.error}`);
      if (result.details) logger.error(`   详情: ${JSON.stringify(result.details)}`);
      return false;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('ECONNREFUSED') || message.includes('fetch failed')) {
      logger.error(`❌ 无法连接到服务器 ${baseUrl}，请确保服务已启动 (bun dev)`);
    } else {
      logger.error(`❌ ZIP 导入异常: ${message}`);
    }
    return false;
  }
}

async function main(): Promise<void> {
  const { filePath, baseUrl } = parseArgs(process.argv);

  // 1. 检查文件
  if (!existsSync(filePath)) {
    logger.error(`❌ 文件不存在: ${filePath}`);
    process.exit(1);
  }

  // 2. 根据文件类型选择导入方式
  if (isZipFile(filePath)) {
    logger.info(`📦 ZIP 文件: ${filePath}`);
    logger.info(`🔗 API 地址: ${baseUrl}`);
    
    const success = await importZipFile(filePath, baseUrl);
    if (!success) {
      process.exit(1);
    }
  } else {
    logger.info(`📄 JSON 文件: ${filePath}`);
    logger.info(`🔗 API 地址: ${baseUrl}`);

    // 3. 读取并解析 JSON
    let rawData: unknown;
    try {
      const content = readFileSync(filePath, 'utf-8');
      rawData = JSON.parse(content);
    } catch (err) {
      logger.error(`❌ JSON 解析失败: ${err instanceof Error ? err.message : err}`);
      process.exit(1);
    }

    // 4. 判断单个课程还是批量
    const courseList: unknown[] = Array.isArray(rawData) ? rawData : [rawData];
    logger.info(`📊 共 ${courseList.length} 门课程待导入\n`);

    // 5. 校验并导入
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < courseList.length; i++) {
      const item = courseList[i];

      // Zod 校验
      const parsed = importCourseSchema.safeParse(item);
      if (!parsed.success) {
        const prefix = courseList.length > 1 ? `[${i + 1}] ` : '';
        logger.error(`${prefix}❌ 数据校验失败:`);
        for (const issue of parsed.error.issues) {
          logger.error(`${prefix}   ${issue.path.join('.')}: ${issue.message}`);
        }
        failCount++;
        continue;
      }

      const success = await importSingleCourse(parsed.data, baseUrl, courseList.length > 1 ? i : undefined);
      if (success) successCount++;
      else failCount++;
    }

    // 6. 汇总
    logger.info('');
    if (courseList.length > 1) {
      logger.info(`📊 导入完成: 成功 ${successCount}, 失败 ${failCount}, 共 ${courseList.length}`);
    }

    if (failCount > 0) process.exit(1);
    logger.info('🎉 课程导入完成！');
  }
}

main().catch(err => {
  logger.error('❌ 脚本执行失败:', err);
  process.exit(1);
});
