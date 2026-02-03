import { readFileSync, writeFileSync } from 'fs';

const inputFile = process.argv[2] || 'ai_learning_assistant.sql';
const outputFile = process.argv[3] || 'ai_learning_assistant_pglite.sql';

let content = readFileSync(inputFile, 'utf-8');

// 删除不兼容的内容
const patterns = [
  /^\\restrict.*$/gm,
  /^\\unrestrict.*$/gm,
  /^CREATE DATABASE.*$/gm,
  /^ALTER DATABASE.*$/gm,
  /^\\connect.*$/gm,
  /^-- TOC entry.*$/gm,
  /^-- Name:.*Type: DATABASE.*$/gm,
  /^-- Dependencies:.*$/gm,
  /OWNER TO \w+;/g,
  /^SET statement_timeout.*$/gm,
  /^SET lock_timeout.*$/gm,
  /^SET idle_in_transaction_session_timeout.*$/gm,
  /^SET transaction_timeout.*$/gm,
  /^SET row_security.*$/gm,
];

patterns.forEach(pattern => {
  content = content.replace(pattern, '');
});

// 过滤隐藏的 Unicode 字符
const hiddenUnicodePattern = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u200B-\u200F\u2028-\u202F\u2060-\u206F\uFEFF\uFFF0-\uFFFF]/g;

const hiddenMatches = content.match(hiddenUnicodePattern);
if (hiddenMatches && hiddenMatches.length > 0) {
  // 统计每种隐藏字符的出现次数
  const charCount: Record<string, number> = {};
  hiddenMatches.forEach(char => {
    const code = `U+${char.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}`;
    charCount[code] = (charCount[code] || 0) + 1;
  });

  console.log('⚠️ 检测到隐藏 Unicode 字符:');
  for (const [code, count] of Object.entries(charCount)) {
    const name = getUnicodeCharName(code);
    console.log(`   ${code} (${name}): ${count} 个`);
  }

  // 移除隐藏字符
  content = content.replace(hiddenUnicodePattern, '');
  console.log(`✅ 已过滤 ${hiddenMatches.length} 个隐藏 Unicode 字符`);
} else {
  console.log('✅ 未检测到隐藏 Unicode 字符');
}

// 清理多余空行
content = content.replace(/\n{3,}/g, '\n\n');

writeFileSync(outputFile, content, 'utf-8');
console.log(`✅ Cleaned backup saved to: ${outputFile}`);

// 获取 Unicode 字符名称
function getUnicodeCharName(code: string): string {
  const names: Record<string, string> = {
    'U+0000': 'NULL',
    'U+0001': 'SOH (Start of Heading)',
    'U+0002': 'STX (Start of Text)',
    'U+0003': 'ETX (End of Text)',
    'U+0004': 'EOT (End of Transmission)',
    'U+0005': 'ENQ (Enquiry)',
    'U+0006': 'ACK (Acknowledge)',
    'U+0007': 'BEL (Bell)',
    'U+0008': 'BS (Backspace)',
    'U+000B': 'VT (Vertical Tab)',
    'U+000C': 'FF (Form Feed)',
    'U+000E': 'SO (Shift Out)',
    'U+000F': 'SI (Shift In)',
    'U+001F': 'US (Unit Separator)',
    'U+007F': 'DEL (Delete)',
    'U+200B': 'Zero Width Space',
    'U+200C': 'Zero Width Non-Joiner',
    'U+200D': 'Zero Width Joiner',
    'U+200E': 'Left-to-Right Mark',
    'U+200F': 'Right-to-Left Mark',
    'U+2028': 'Line Separator',
    'U+2029': 'Paragraph Separator',
    'U+202A': 'Left-to-Right Embedding',
    'U+202B': 'Right-to-Left Embedding',
    'U+202C': 'Pop Directional Formatting',
    'U+202D': 'Left-to-Right Override',
    'U+202E': 'Right-to-Left Override',
    'U+202F': 'Narrow No-Break Space',
    'U+2060': 'Word Joiner',
    'U+FEFF': 'BOM (Byte Order Mark)',
  };
  return names[code] || 'Unknown Control Character';
}
