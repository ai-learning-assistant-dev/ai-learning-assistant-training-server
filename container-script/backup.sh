#!/bin/bash
# 函数定义: 管理文件的备份和清理 (兼容 BSD/macOS/GNU find)
# 参数:
# $1: 原始文件路径 (例如: "a.file")
# $2: 备份文件的前缀 (例如: "a_")
# $3: 最大保留数量 (例如: 10)
manage_backup_file() {
    local orig_file="$1"
    local backup_prefix="$2"
    local backup_suffix="$3"
    local max_keep="$4"
    local timestamp
    local new_name
    local files_to_delete
    local current_dir="."

    if [ -z "$orig_file" ] || [ -z "$backup_prefix" ] || [ -z "$max_keep" ]; then
        echo "错误: 函数需要三个参数 (原始文件名, 备份前缀, 最大保留数)。"
        return 1
    fi

    # 1. 检查原始文件是否存在并重命名
    if [ -f "$orig_file" ]; then
        timestamp=$(date +"%Y-%m-%d_%H-%M-%S")
        new_name="${backup_prefix}${timestamp}${backup_suffix}"

        mv "$orig_file" "$new_name"
        echo "信息: 文件 $orig_file 已重命名为 $new_name"
    else
        echo "信息: 文件 $orig_file 不存在，无需重命名。"
    fi

    # 2. 管理备份文件，保留最新的 MAX_KEEP 个文件
    # 使用 find 查找文件，并通过 while read 循环处理，避免依赖非标准的 printf 或复杂的 ls 解析
    
    # 查找所有匹配的文件，按修改时间倒序排列 (最新的在前)
    # 此方法更兼容，但不使用时间戳，而是依赖 ls -t 的排序能力
    
    # 查找所有符合条件的文件，并安全地存入数组 (需要 bash 4.0+)
    # 如果您的 bash 版本较旧，可以继续使用 xargs 的方法，但需要确保文件名不包含换行符

    # 替代方案：使用 find 和 while 循环逐个处理文件路径
    # 查找所有匹配的文件列表 (find . -maxdepth 1 -type f -name "${backup_prefix}*")
    # 然后我们用 ls -t 来获取排序后的列表，用 head/tail 处理更简单

    # 使用 ls -t 命令（按时间倒序，最新的在前），并结合 sed 跳过最新的 N 个文件，删除剩下的
    # 注意：解析 'ls' 输出在处理异常文件名（如包含空格或换行符）时并不健壮，但对于我们生成的标准命名文件是安全的。
    
    files_to_delete=$(ls -t ${backup_prefix}* 2>/dev/null | sed -e "1,${max_keep}d")

    # 如果有文件需要删除
    if [ -n "$files_to_delete" ]; then
        echo "信息: 备份文件数量超过 $max_keep 个，删除最旧的文件:"
        # 使用 echo 和 xargs 安全删除列表中的文件
        # 注意：这里假设文件名不包含复杂的特殊字符，特别是换行符
        echo "$files_to_delete" | xargs rm --
        echo "信息: 删除完成。"
    else
        echo "信息: 备份文件数量未超过 $max_keep 个，无需删除。"
    fi
}

manage_backup_file "/var/lib/postgresql/ala-backup/ai_learning_assistant_users.sql" "/var/lib/postgresql/ala-backup/ai_learning_assistant_users_" ".sql" 10
manage_backup_file "/var/lib/postgresql/ala-backup/ai_learning_assistant_course.sql" "/var/lib/postgresql/ala-backup/ai_learning_assistant_course_" ".sql" 10

pg_dump -U postgres -d ai_learning_assistant_users -h 127.0.0.1 -p 5432 -F p -C > /var/lib/postgresql/ala-backup/ai_learning_assistant_users.sql
pg_dump -U postgres -d ai_learning_assistant -h 127.0.0.1 -p 5432 -F p -C > /var/lib/postgresql/ala-backup/ai_learning_assistant_course.sql