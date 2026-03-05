import { createConsola } from 'consola';
import { appendFileSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { paths } from './paths';

// 确保日志目录存在
try {
  mkdirSync(paths.log, { recursive: true });
} catch {
  // ignore
}

/** 获取当日日志文件名 */
function getLogFileName(): string {
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return `app-${date}.log`;
}

/** 清理超过 maxDays 天的日志文件 */
function cleanOldLogs(maxDays = 30): void {
  try {
    const files = readdirSync(paths.log);
    const cutoff = Date.now() - maxDays * 86_400_000;
    for (const file of files) {
      if (!file.startsWith('app-') || !file.endsWith('.log')) continue;
      const dateStr = file.slice(4, -4); // 提取 YYYY-MM-DD
      const fileTime = new Date(dateStr).getTime();
      if (!Number.isNaN(fileTime) && fileTime < cutoff) {
        unlinkSync(join(paths.log, file));
      }
    }
  } catch {
    // ignore cleanup errors
  }
}

// 启动时清理旧日志
cleanOldLogs();

const logger = createConsola({
  level: process.env.LOG_LEVEL ? parseInt(process.env.LOG_LEVEL) : process.env.NODE_ENV === 'production' ? 3 : 4, // 3=info, 4=debug
  formatOptions: {
    date: true,
    colors: process.env.NODE_ENV !== 'production',
    compact: process.env.NODE_ENV === 'production',
  },
});

// 文件 reporter：将 info 及以上级别写入日志文件
logger.addReporter({
  log(logObj) {
    // level: 0=fatal, 1=error, 2=warn, 3=info, 4=debug, 5=trace
    // 仅写入 info 及以上（level <= 3）
    if (logObj.level > 3) return;

    const timestamp = (logObj.date ?? new Date()).toISOString();
    const levelName = (logObj.type ?? 'log').toUpperCase();
    const tag = logObj.tag ? `[${logObj.tag}] ` : '';
    const message = logObj.args
      .map((a: unknown) => {
        if (typeof a === 'string') return a;
        if (a instanceof Error) return `${a.name}: ${a.message}${a.stack ? '\n' + a.stack : ''}`;
        return JSON.stringify(a);
      })
      .join(' ');
    const line = `${timestamp} ${levelName} ${tag}${message}\n`;

    try {
      appendFileSync(join(paths.log, getLogFileName()), line);
    } catch {
      // ignore file write errors
    }
  },
});

export default logger;
