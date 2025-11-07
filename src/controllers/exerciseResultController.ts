
import { AppDataSource } from '../config/database';
import { ExerciseResult } from '../models/exerciseResult';
import { ExerciseOption } from '../models/exerciseOption';
import { Exercise } from '../models/exercise';
import { ApiResponse } from '../types/express';
import { Route, Post, Body, Tags } from 'tsoa';
import { BaseController } from './baseController';
import { Section } from '../models/section';
import { Chapter } from '../models/chapter';
// list 只包含 exercise_id/user_answer，顶层有 user_id/section_id/test_result_id

@Tags('习题结果表')
@Route('exercise-results')
export class ExerciseResultController extends BaseController {
/**
 * 批量保存答题结果
 * @param body.list 答案列表，user_id、exercise_id必填，其他选填
 */
@Post('/saveExerciseResults')
public async saveExerciseResults(
  @Body() body: {
    user_id: string;
    section_id: string | null;
    test_result_id?: string | null;
    list: Array<{ exercise_id: string; user_answer?: string| null }>
  }
): Promise<ApiResponse<any>> {
  try {
    if (!body.user_id || !body.list || !Array.isArray(body.list) || body.list.length === 0) {
      return this.fail('user_id 和 list 必须传，且 list 为非空数组', null, 400);
    }
    
    const repo = AppDataSource.getRepository(ExerciseResult);
    const exerciseRepo = AppDataSource.getRepository(Exercise);
    const optionRepo = AppDataSource.getRepository(ExerciseOption);
    const sectionRepo = AppDataSource.getRepository(Section);
    const chapterRepo = AppDataSource.getRepository(Chapter);
    
    const results: any[] = [];
    let userTotalScore = 0;
    
    for (const item of body.list) {
      // 加载习题，计算题目分数
      const exercise = await exerciseRepo.findOneBy({ exercise_id: item.exercise_id });
      const questionScore = exercise?.score || 0;

      // 判断是否正确，计算 user_score
      let isCorrect = false;
      const userAnswerRaw = item.user_answer ?? '';
      const typeStatus = exercise?.type_status ?? '';
      if (typeStatus === '0' || typeStatus === '1') {
        // 单选/多选：通过 exercise_options 判断
        const options = await optionRepo.find({ where: { exercise_id: item.exercise_id } });
        const correctIds = options.filter(o => o.is_correct).map(o => o.option_id);
        // 用户答案可能为单个 id 或 多个用 ; 分隔
        const userIds = userAnswerRaw ? ('' + userAnswerRaw).split(';').map(s => s.trim()).filter(Boolean) : [];
        if (typeStatus === '0') {
          // 单选，只有一个正确选项
          isCorrect = userIds.length === 1 && correctIds.length === 1 && userIds[0] === correctIds[0];
        } else {
          // 多选：集合相等
          const uniqUser = Array.from(new Set(userIds));
          const uniqCorrect = Array.from(new Set(correctIds.map(String)));
          if (uniqUser.length === uniqCorrect.length) {
            const allMatch = uniqUser.every(uid => uniqCorrect.includes(uid));
            isCorrect = allMatch;
          } else {
            isCorrect = false;
          }
        }
      } else if (typeStatus === '2') {
        // 简答：与 exercise.answer 比较（忽略大小写及首尾空格）
        const expect = (exercise?.answer ?? '').toString().trim().toLowerCase();
        const actual = (userAnswerRaw ?? '').toString().trim().toLowerCase();
        isCorrect = expect !== '' && expect === actual;
      } else {
        // 未知题型，不计分
        isCorrect = false;
      }
      
      const user_score = isCorrect ? questionScore : 0;
      userTotalScore += user_score;
      
      // 构造查重条件（不包含 user_answer）
      const where: any = { user_id: body.user_id, exercise_id: item.exercise_id };
      // if (body.section_id != null) where.section_id = body.section_id;
      if (body.test_result_id != null) where.test_result_id = body.test_result_id;
      
      let exist = await repo.findOneBy(where);
      if (exist) {
        exist.user_answer = userAnswerRaw;
        // 将用户得分写入 result.score 字段
        exist.score = user_score;
        await repo.save(exist);
        results.push({ ...exist, _action: 'updated', score: questionScore, user_score ,ai_feedback:""});
      } else {
        const toCreate: Partial<ExerciseResult> = {
          user_id: body.user_id,
          exercise_id: item.exercise_id,
          user_answer: userAnswerRaw,
          score: user_score
        };
        if (body.section_id != null) (toCreate as any).section_id = body.section_id;
        if (body.test_result_id != null) (toCreate as any).test_result_id = body.test_result_id;
        const entity = repo.create(toCreate);
        const saved = await repo.save(entity);
        results.push({ ...saved, _action: 'created', score: questionScore, user_score ,ai_feedback:""});
      }
    }
    
    // 查询 section_id 下所有习题并统计总分
    let score = 0;
    let currentSection = null;
    let currentChapter = null;
    
    if (body.section_id) {
      const exerciseRepo = AppDataSource.getRepository(Exercise);
      const exercises = await exerciseRepo.find({ where: { section_id: body.section_id } });
      score = exercises.reduce((sum, ex) => sum + (ex.score || 0), 0);
      
      // 获取当前节的信息
      currentSection = await sectionRepo.findOneBy({ section_id: body.section_id });
      if (currentSection) {
        // 获取当前章节的信息
        currentChapter = await chapterRepo.findOneBy({ chapter_id: currentSection.chapter_id });
      }
    }
    
    // 及格判断
    const pass = score > 0 ? (userTotalScore / score) > 0.6 : false;
    
    // 如果通过，更新当前节状态并解锁下一个内容
    if (pass && currentChapter && currentSection) {
      // 1. 将当前节状态设置为1（通过）
      await sectionRepo.update(
        { section_id: currentSection.section_id },
        { unlocked: 1 }
      );
      
      // 2. 检查当前章节的所有节是否都通过
      const allSectionsInChapter = await sectionRepo.find({
        where: { chapter_id: currentChapter.chapter_id }
      });
      
      const allSectionsPassed = allSectionsInChapter.every(section => section.unlocked === 1);
      
      // 如果所有节都通过，将章节状态设置为1
      if (allSectionsPassed) {
        await chapterRepo.update(
          { chapter_id: currentChapter.chapter_id },
          { unlocked: 1 }
        );
      }
      
      // 3. 解锁下一个内容
      // 获取当前章节的所有节，按 section_order 排序
      const allSectionsInChapterOrdered = await sectionRepo.find({
        where: { chapter_id: currentChapter.chapter_id },
        order: { section_order: 'ASC' }
      });
      
      // 检查当前节是否是当前章节的最后一个节
      const currentSectionIndex = allSectionsInChapterOrdered.findIndex(
        section => section.section_id === currentSection.section_id
      );
      
      const isLastSectionInChapter = currentSectionIndex === allSectionsInChapterOrdered.length - 1;
      
      if (!isLastSectionInChapter) {
        // 如果不是最后一个节，解锁同一章节的下一个节
        const nextSection = allSectionsInChapterOrdered[currentSectionIndex + 1];
        await sectionRepo.update(
          { section_id: nextSection.section_id },
          { unlocked: 2 }
        );
      } else {
        // 如果是最后一个节，解锁下一章的第一个节
        // 获取下一章（按 chapter_order 排序）
        const nextChapter = await chapterRepo.findOne({
          where: { 
            course_id: currentChapter.course_id,
            chapter_order: currentChapter.chapter_order + 1
          }
        });
        
        if (nextChapter) {
          // 解锁下一章
          await chapterRepo.update(
            { chapter_id: nextChapter.chapter_id },
            { unlocked: 2 }
          );
          
          // 获取下一章的第一个节（按 section_order 排序）
          const firstSectionOfNextChapter = await sectionRepo.findOne({
            where: { chapter_id: nextChapter.chapter_id },
            order: { section_order: 'ASC' }
          });
          
          if (firstSectionOfNextChapter) {
            // 解锁下一章的第一个节
            await sectionRepo.update(
              { section_id: firstSectionOfNextChapter.section_id },
              { unlocked: 2 }
            );
          }
        }
      }
    }
    
    return this.ok({ results, score, user_score: userTotalScore, pass }, '答题结果批量保存/更新成功');
  } catch (error) {
    return this.fail('保存答题结果失败', error);
  }
}

  /**
   * 查询用户在某节下的答题结果及得分统计
   */
  @Post('/getExerciseResults')
  public async getExerciseResults(
    @Body() body: {
      user_id: string;
      section_id: string | null;
      test_result_id?: string | null;
    }
  ): Promise<ApiResponse<any>> {
    try {
      if (!body.user_id || !body.section_id) {
        return this.fail('user_id 和 section_id 必须传', null, 400);
      }
      const repo = AppDataSource.getRepository(ExerciseResult);
      const exerciseRepo = AppDataSource.getRepository(Exercise);
      const optionRepo = AppDataSource.getRepository(ExerciseOption);
      // 查询该 section 下所有题目
      const exercises = await exerciseRepo.find({ where: { section_id: body.section_id } });
      let score = 0;
      let userTotalScore = 0;
      const results: any[] = [];
      for (const exercise of exercises) {
        const questionScore = exercise?.score || 0;
        score += questionScore;
        // 查找用户答题结果
        const where: any = { user_id: body.user_id, exercise_id: exercise.exercise_id };
        if (body.test_result_id != null) where.test_result_id = body.test_result_id;
        let exist = await repo.findOneBy(where);
        const userAnswerRaw = exist?.user_answer ?? '';
        // 判分逻辑
        let isCorrect = false;
        const typeStatus = exercise?.type_status ?? '';
        if (typeStatus === '0' || typeStatus === '1') {
          const options = await optionRepo.find({ where: { exercise_id: exercise.exercise_id } });
          const correctIds = options.filter(o => o.is_correct).map(o => o.option_id);
          const userIds = userAnswerRaw ? ('' + userAnswerRaw).split(';').map(s => s.trim()).filter(Boolean) : [];
          if (typeStatus === '0') {
            isCorrect = userIds.length === 1 && correctIds.length === 1 && userIds[0] === correctIds[0];
          } else {
            const uniqUser = Array.from(new Set(userIds));
            const uniqCorrect = Array.from(new Set(correctIds.map(String)));
            if (uniqUser.length === uniqCorrect.length) {
              const allMatch = uniqUser.every(uid => uniqCorrect.includes(uid));
              isCorrect = allMatch;
            } else {
              isCorrect = false;
            }
          }
        } else if (typeStatus === '2') {
          const expect = (exercise?.answer ?? '').toString().trim().toLowerCase();
          const actual = (userAnswerRaw ?? '').toString().trim().toLowerCase();
          isCorrect = expect !== '' && expect === actual;
        } else {
          isCorrect = false;
        }
        const user_score = isCorrect ? questionScore : 0;
        userTotalScore += user_score;
        results.push({
          ...(exist || {}),
          exercise_id: exercise.exercise_id,
          user_answer: userAnswerRaw,
          score: questionScore,
          user_score,
          isCorrect,
          _action: exist ? 'exist' : 'not_exist',
          ai_feedback: ''
        });
      }
      // 及格判断
      const pass = score > 0 ? (userTotalScore / score) > 0.6 : false;
      return this.ok({ results, score,user_score:userTotalScore, pass }, '查询答题结果成功');
    } catch (error) {
      return this.fail('查询答题结果失败', error);
    }
  }


  @Post('/search')
  public async searchExerciseResults(
    @Body() body: { page?: number; limit?: number }
  ): Promise<ApiResponse<ExerciseResult[]>> {
    try {
      const pageNum = body.page || 1;
      const limitNum = body.limit || 10;
      const offset = (pageNum - 1) * limitNum;
      const repo = AppDataSource.getRepository(ExerciseResult);
      const [items, count] = await repo.findAndCount({
        skip: offset,
        take: limitNum,
        order: { result_id: 'ASC' }
      });
      return this.paginate(items, count, pageNum, limitNum);
    } catch (error) {
      return this.fail('获取答题结果列表失败', error);
    }
  }

  @Post('/getById')
  public async getExerciseResultById(
    @Body() body: { result_id: string }
  ): Promise<ApiResponse<ExerciseResult>> {
    try {
      const repo = AppDataSource.getRepository(ExerciseResult);
      const item = await repo.findOneBy({ result_id: body.result_id });
      if (!item) {
        return this.fail('答题结果不存在');
      }
      return this.ok(item);
    } catch (error) {
      return this.fail('获取答题结果失败', error);
    }
  }

  @Post('/add')
  public async addExerciseResult(
    @Body() requestBody: Partial<ExerciseResult>
  ): Promise<ApiResponse<any>> {
    try {
      if (!requestBody.user_id || !requestBody.exercise_id) {
        return this.fail('user_id 和 exercise_id 必填', null, 400);
      }
      const repo = AppDataSource.getRepository(ExerciseResult);
      const item = repo.create(requestBody);
      const saved = await repo.save(item);
      return this.ok(saved, '答题结果创建成功');
    } catch (error: any) {
      return this.fail('创建答题结果失败', error.message);
    }
  }

  @Post('/update')
  public async updateExerciseResult(
    @Body() requestBody: Partial<ExerciseResult>
  ): Promise<ApiResponse<any>> {
    try {
      if (!requestBody.result_id) {
        return this.fail('result_id 必填', null, 400);
      }
      const repo = AppDataSource.getRepository(ExerciseResult);
      const item = await repo.findOneBy({ result_id: requestBody.result_id });
      if (!item) {
        return this.fail('答题结果不存在');
      }
      Object.assign(item, requestBody);
      const saved = await repo.save(item);
      return this.ok(saved, '答题结果更新成功');
    } catch (error) {
      return this.fail('更新答题结果失败', error);
    }
  }

  @Post('/delete')
  public async deleteExerciseResult(
    @Body() body: { result_id: string }
  ): Promise<ApiResponse<any>> {
    try {
      const repo = AppDataSource.getRepository(ExerciseResult);
      const item = await repo.findOneBy({ result_id: body.result_id });
      if (!item) {
        return this.fail('答题结果不存在');
      }
      await repo.remove(item);
      return this.ok({}, '答题结果删除成功');
    } catch (error) {
      return this.fail('删除答题结果失败', error);
    }
  }
}
