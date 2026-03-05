#!/bin/bash

# PostgreSQL 测试环境初始化脚本
# 注意：postgres 是内置超级用户，无需重新创建，仅重置密码
# 数据库: ai_learning_assistant
# 密码: KLNb923u4_odfh89

# 配置变量（仅保留必要变量，无未绑定冗余变量）
DB_SUPER_USER="postgres"  # 内置超级用户，仅用于操作
DB_PASSWORD="KLNb923u4_odfh89"
DB_NAME="ai_learning_assistant"

# 检查是否以root或sudo权限运行
if [ "$EUID" -ne 0 ]; then 
    echo "错误：请使用 sudo 运行此脚本"
    exit 1
fi

# 开启错误输出，便于排查问题（set -u 保留，确保变量定义完整）
set -euo pipefail
echo "开始初始化 PostgreSQL 测试环境..."

# 步骤1：重置内置 postgres 用户密码（无需创建，仅更新）
echo "正在重置 $DB_SUPER_USER 用户密码..."
sudo -u "$DB_SUPER_USER" psql -v ON_ERROR_STOP=1 <<EOF
ALTER USER "$DB_SUPER_USER" WITH PASSWORD '$DB_PASSWORD';
-- 确保超级用户拥有创建数据库权限（默认已拥有，冗余配置防止意外）
ALTER USER "$DB_SUPER_USER" CREATEDB;
EOF

# 步骤2：创建数据库（存在则先删除，确保可重复执行）
echo "正在创建数据库 $DB_NAME..."
sudo -u "$DB_SUPER_USER" psql -d "$DB_SUPER_USER" -v ON_ERROR_STOP=1 <<EOF
-- 若数据库已存在，先删除（取消注释可覆盖原有数据库，谨慎使用）
DROP DATABASE IF EXISTS "$DB_NAME";

-- 创建数据库，使用系统默认字符编码（避免兼容性问题）
CREATE DATABASE "$DB_NAME" 
    WITH OWNER = "$DB_SUPER_USER"
    ENCODING = 'UTF8'
    TEMPLATE = template0;
EOF

# 步骤3：验证创建结果（清晰展示用户和数据库信息）
echo -e "\n=================================="
echo "验证创建结果："
sudo -u "$DB_SUPER_USER" psql -v ON_ERROR_STOP=1 <<EOF
\echo "【所有用户列表】"
\du
\echo "\n【目标数据库详情】"
\l "$DB_NAME"  # 精准查询目标数据库
EOF

# 步骤4：输出完成信息和连接命令
echo -e "=================================="
echo "PostgreSQL 测试环境初始化完成！"
echo "超级用户: $DB_SUPER_USER"
echo "密码: $DB_PASSWORD"
echo "数据库: $DB_NAME"
echo -e "=================================="
echo "测试连接命令（本地）："
echo "psql -U $DB_SUPER_USER -d $DB_NAME -h localhost -W"
echo -e "=================================="