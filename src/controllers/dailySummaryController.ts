import { Request, Response } from 'express';
import { MainDataSource, UserDataSource } from '../config/database';
import { DailySummary } from '../models/dailySummary';
import { ExerciseResult } from '../models/exerciseResult';
import { AiInteraction } from '../models/aiInteraction';
import { Section } from '../models/section';
import { Chapter } from '../models/chapter';
import { Course } from '../models/course';
import { DailySummaryResponse, CreateDailySummaryRequest, UpdateDailySummaryRequest, DailySummaryListRequest } from '../types/dailySummary';
import { BaseController } from './baseController';
import { Route, Get, Post, Put, Delete, Body, Path, Query, Tags } from 'tsoa';
import { ApiResponse } from '../types/express';
import { LearningAssistant } from '../llm/domain/learning_assistant';
import { Between } from 'typeorm';


@Tags('每日总结')
@Route('dailySummary')
export class DailySummaryController extends BaseController {
    /**
   * 查询每日总结列表（可选按用户/日期过滤）
   */
  @Post('/search')
  public async searchDailySummary(@Body() body: DailySummaryListRequest)
  : Promise<ApiResponse<DailySummaryResponse[]>> {
    try {
      const repo = UserDataSource.getRepository(DailySummary);
      const { user_id, summary_date, page = 1, limit = 10 } = body;
      const where: any = {};
      if (user_id) where.user_id = user_id;
      if (summary_date) where.summary_date = new Date(summary_date);
      const [rows, count] = await repo.findAndCount({
        where,
        skip: (page - 1) * limit,
        take: limit,
        order: { summary_date: 'DESC' }
      });
      const result: DailySummaryResponse[] = rows.map((s: DailySummary) => ({
        summary_id: s.summary_id,
        user_id: s.user_id,
        summary_date: s.summary_date,
        content: s.content
      }));
       return this.paginate(result, count, page, limit);
    } catch (error) {
       return this.fail('查询每日总结失败', error );
    }
  }
  @Post('/getById')
  public async getDailySummaryById(
  @Body() body: { summary_id: string }
  ): Promise<ApiResponse<DailySummaryResponse>> {
  try {
       const repo = UserDataSource.getRepository(DailySummary);
       const option = await repo.findOneBy({ summary_id: body.summary_id });
      if (!option) {
         return this.fail('每日总结不存在');
       }
        return this.ok(option);
      } catch (error) {
        return this.fail('获取每日总结失败', error);
      }
  }
  /**
   * 新增每日总结
   */
  @Post('/add')
  public async addDailySummary(@Body() body: CreateDailySummaryRequest)
  : Promise<ApiResponse<DailySummaryResponse>> {
    try {
      const repo = UserDataSource.getRepository(DailySummary);
      const entity = repo.create({
        ...body,
        summary_date: new Date(body.summary_date)
      });
      const summary = await repo.save(entity);
      const result: DailySummaryResponse = {
        summary_id: summary.summary_id,
        user_id: summary.user_id,
        summary_date: summary.summary_date,
        content: summary.content
      };
      return this.ok(result, '新增成功');
    } catch (error) {
      return this.fail('新增每日总结失败', error );
    }
  }

  /**
   * 修改每日总结
   */
  @Post('/update')
  public async updateDailySummary(@Body() body: UpdateDailySummaryRequest)
  : Promise<ApiResponse<any>> {
    try {
      const repo = UserDataSource.getRepository(DailySummary);
      const { summary_id, ...updateFields } = body;
      const summary = await repo.findOneBy({ summary_id });
      if (!summary) {
        return this.fail('未找到要更新的记录 ',null,404);
      }
      if (updateFields.content !== undefined) summary.content = updateFields.content;
      if (updateFields.summary_date !== undefined) summary.summary_date = new Date(updateFields.summary_date);
      await repo.save(summary);
      return this.ok(null, '更新成功');
    } catch (error) {
      return this.fail('更新每日总结失败', error );
    }
  }

  /**
   * 删除每日总结
   */
  @Post('/delete')
  public async deleteDailySummary(@Body() summary_id: string)
  : Promise<ApiResponse<any>> {
    try {
    const repo = UserDataSource.getRepository(DailySummary);
    const summary = await repo.findOneBy({ summary_id });
    if (!summary) {
      return this.fail('删除每日总结失败',null,404);
    }
    await repo.remove(summary);
    return this.ok(null, '删除成功');
    } catch (error) {
      return this.fail('删除每日总结失败', error );
    }
  }

  /**
   * 生成每日学习总结
   */
  @Post('/generate')
  public async generateDailySummary(@Body() body: {
    userId: string;
    sectionId: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<DailySummaryResponse>> {
    try {
      const { userId, sectionId, startDate, endDate } = body;

      // 1. 获取课程信息
      const sectionRepo = MainDataSource.getRepository(Section);
      const section = await sectionRepo.findOne({
        where: { section_id: sectionId },
        relations: ['chapter', 'chapter.course']
      });

      if (!section) {
        return this.fail('未找到指定的课程节', null, 404);
      }

      const courseInfo = `
课程名称：${section.chapter.course.name}
章节：${section.chapter.title}
小节：${section.title}
知识点：${section.knowledge_points || '无'}
`;

      // 2. 获取练习结果
      const exerciseRepo = UserDataSource.getRepository(ExerciseResult);
      const dateFilter: any = { user_id: userId };
      
      if (startDate && endDate) {
        // 如果提供了日期范围，通过 exercise 关联来过滤
        const exercises = await exerciseRepo
          .createQueryBuilder('er')
          .innerJoin('er.exercise', 'ex')
          .where('er.user_id = :userId', { userId })
          .andWhere('ex.section_id = :sectionId', { sectionId })
          .getMany();
        
        var exerciseResults = exercises;
      } else {
        // 否则获取该section的所有练习
        const exercises = await exerciseRepo
          .createQueryBuilder('er')
          .innerJoin('er.exercise', 'ex')
          .where('er.user_id = :userId', { userId })
          .andWhere('ex.section_id = :sectionId', { sectionId })
          .getMany();
        
        var exerciseResults = exercises;
      }

      let exerciseResultsText = '暂无练习记录';
      if (exerciseResults.length > 0) {
        const avgScore = exerciseResults.reduce((sum: number, r: ExerciseResult) => sum + (r.score || 0), 0) / exerciseResults.length;
        exerciseResultsText = `
完成练习数：${exerciseResults.length}
平均得分：${avgScore.toFixed(1)}分
练习详情：
${exerciseResults.map((r: ExerciseResult, i: number) => `${i + 1}. 得分：${r.score || 0}分\n   AI反馈：${r.ai_feedback || '无'}`).join('\n')}
`;
      }

      // 3. 获取聊天记录
      const interactionRepo = UserDataSource.getRepository(AiInteraction);
      let interactionFilter: any = {
        user_id: userId,
        section_id: sectionId
      };

      if (startDate && endDate) {
        interactionFilter.query_time = Between(new Date(startDate), new Date(endDate));
      }

      const interactions = await interactionRepo.find({
        where: interactionFilter,
        order: { query_time: 'ASC' },
        take: 20 // 限制最多20条聊天记录
      });

      let chatHistoryText = '暂无学习互动记录';
      if (interactions.length > 0) {
        chatHistoryText = `共有${interactions.length}条互动记录：\n` +
          interactions.map((int: AiInteraction, i: number) => 
            `${i + 1}. 学生：${int.user_message}\n   助手：${int.ai_response}`
          ).join('\n\n');
      }

      // 4. 构建用户消息（将所有信息整合到一个消息中）
      const userMessage = `请基于以下信息生成一份学习总结：

【课程信息】
${courseInfo}

【练习完成情况】
${exerciseResultsText}

【学习互动记录】
${chatHistoryText}

请生成一份包含以下内容的学习总结：
1. 学习进度概览（完成了哪些内容）
2. 掌握情况分析（基于练习得分和互动内容）
3. 重点知识点回顾
4. 需要加强的方向
5. 鼓励性评价

要求：语言简洁专业，重点突出，长度控制在300-500字。`;

      // 使用现有的 sessionId 重建对话上下文
      const sessionId = `session_${userId}_${sectionId}_${new Date().toISOString().split('T')[0]}`;

      const assistant = new LearningAssistant({
        userId,
        sectionId,
        courseId: section.chapter.course.course_id,
        sessionId  // 复用或创建会话
      });

      await assistant.initialize();

      // 调用 LearningAssistant 生成总结（使用 KEY_LEARNING_ASSISTANT 的系统提示词）
      const summaryContent = await assistant.chat(userMessage);

      // 5. 保存到数据库
      const summaryRepo = UserDataSource.getRepository(DailySummary);
      const newSummary = summaryRepo.create({
        user_id: userId,
        summary_date: new Date(),
        content: summaryContent
      });

      const savedSummary = await summaryRepo.save(newSummary);

      return this.ok({
        summary_id: savedSummary.summary_id,
        user_id: savedSummary.user_id,
        summary_date: savedSummary.summary_date,
        content: savedSummary.content
      }, '生成每日总结成功');

    } catch (error) {
      console.error('生成每日总结失败:', error);
      return this.fail('生成每日总结失败', error);
    }
  }


}
