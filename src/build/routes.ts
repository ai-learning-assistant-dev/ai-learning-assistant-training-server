/* tslint:disable */
/* eslint-disable */
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import type { TsoaRoute } from '@tsoa/runtime';
import {  fetchMiddlewares, ExpressTemplateService } from '@tsoa/runtime';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { UserController } from './../controllers/userController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { TitleController } from './../controllers/titleController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { TestResultController } from './../controllers/testResultController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { TestController } from './../controllers/testController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { SectionController } from './../controllers/sectionController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { LearningRecordController } from './../controllers/learningRecordController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { LeadingQuestionController } from './../controllers/leadingQuestionController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { ExerciseOptionController } from './../controllers/exerciseOptionController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { ExerciseController } from './../controllers/exerciseController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { DailySummaryController } from './../controllers/dailySummaryController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { CourseScheduleController } from './../controllers/courseScheduleController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { CourseController } from './../controllers/courseController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { ChapterController } from './../controllers/chapterController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { BilibiliVideoController } from './../controllers/bilibiliVideoController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { BilibiliProxyController } from './../controllers/bilibiliProxyController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { AiPersonaController } from './../controllers/aiPersonaController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { AiInteractionController } from './../controllers/aiInteractionController';
import type { Request as ExRequest, Response as ExResponse, RequestHandler, Router } from 'express';



// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

const models: TsoaRoute.Models = {
    "ApiResponse_any_": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "data": {"dataType":"any"},
            "message": {"dataType":"string"},
            "error": {"dataType":"string"},
            "details": {"dataType":"any"},
            "pagination": {"dataType":"nestedObjectLiteral","nestedProperties":{"totalPages":{"dataType":"double","required":true},"total":{"dataType":"double","required":true},"limit":{"dataType":"double","required":true},"page":{"dataType":"double","required":true}}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UserResponse": {
        "dataType": "refObject",
        "properties": {
            "user_id": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
            "avatar_url": {"dataType":"string"},
            "education_level": {"dataType":"string"},
            "learning_ability": {"dataType":"string"},
            "goal": {"dataType":"string"},
            "level": {"dataType":"double"},
            "experience": {"dataType":"double"},
            "current_title_id": {"dataType":"string"},
            "createdAt": {"dataType":"datetime"},
            "updatedAt": {"dataType":"datetime"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_UserResponse-Array_": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "data": {"dataType":"array","array":{"dataType":"refObject","ref":"UserResponse"}},
            "message": {"dataType":"string"},
            "error": {"dataType":"string"},
            "details": {"dataType":"any"},
            "pagination": {"dataType":"nestedObjectLiteral","nestedProperties":{"totalPages":{"dataType":"double","required":true},"total":{"dataType":"double","required":true},"limit":{"dataType":"double","required":true},"page":{"dataType":"double","required":true}}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateUserRequest": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "avatar_url": {"dataType":"string"},
            "education_level": {"dataType":"string"},
            "learning_ability": {"dataType":"string"},
            "goal": {"dataType":"string"},
            "level": {"dataType":"double"},
            "experience": {"dataType":"double"},
            "current_title_id": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateUserRequest": {
        "dataType": "refObject",
        "properties": {
            "user_id": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
            "avatar_url": {"dataType":"string"},
            "education_level": {"dataType":"string"},
            "learning_ability": {"dataType":"string"},
            "goal": {"dataType":"string"},
            "level": {"dataType":"double"},
            "experience": {"dataType":"double"},
            "current_title_id": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TitleResponse": {
        "dataType": "refObject",
        "properties": {
            "title_id": {"dataType":"string","required":true},
            "course_id": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
            "description": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_TitleResponse-Array_": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "data": {"dataType":"array","array":{"dataType":"refObject","ref":"TitleResponse"}},
            "message": {"dataType":"string"},
            "error": {"dataType":"string"},
            "details": {"dataType":"any"},
            "pagination": {"dataType":"nestedObjectLiteral","nestedProperties":{"totalPages":{"dataType":"double","required":true},"total":{"dataType":"double","required":true},"limit":{"dataType":"double","required":true},"page":{"dataType":"double","required":true}}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_TitleResponse_": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "data": {"ref":"TitleResponse"},
            "message": {"dataType":"string"},
            "error": {"dataType":"string"},
            "details": {"dataType":"any"},
            "pagination": {"dataType":"nestedObjectLiteral","nestedProperties":{"totalPages":{"dataType":"double","required":true},"total":{"dataType":"double","required":true},"limit":{"dataType":"double","required":true},"page":{"dataType":"double","required":true}}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateTitleRequest": {
        "dataType": "refObject",
        "properties": {
            "course_id": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
            "description": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateTitleRequest": {
        "dataType": "refObject",
        "properties": {
            "title_id": {"dataType":"string","required":true},
            "course_id": {"dataType":"string"},
            "name": {"dataType":"string"},
            "description": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TestResultResponse": {
        "dataType": "refObject",
        "properties": {
            "result_id": {"dataType":"string","required":true},
            "user_id": {"dataType":"string","required":true},
            "test_id": {"dataType":"string","required":true},
            "start_date": {"dataType":"datetime","required":true},
            "end_date": {"dataType":"datetime"},
            "score": {"dataType":"double"},
            "ai_feedback": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_TestResultResponse-Array_": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "data": {"dataType":"array","array":{"dataType":"refObject","ref":"TestResultResponse"}},
            "message": {"dataType":"string"},
            "error": {"dataType":"string"},
            "details": {"dataType":"any"},
            "pagination": {"dataType":"nestedObjectLiteral","nestedProperties":{"totalPages":{"dataType":"double","required":true},"total":{"dataType":"double","required":true},"limit":{"dataType":"double","required":true},"page":{"dataType":"double","required":true}}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_TestResultResponse_": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "data": {"ref":"TestResultResponse"},
            "message": {"dataType":"string"},
            "error": {"dataType":"string"},
            "details": {"dataType":"any"},
            "pagination": {"dataType":"nestedObjectLiteral","nestedProperties":{"totalPages":{"dataType":"double","required":true},"total":{"dataType":"double","required":true},"limit":{"dataType":"double","required":true},"page":{"dataType":"double","required":true}}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateTestResultRequest": {
        "dataType": "refObject",
        "properties": {
            "user_id": {"dataType":"string","required":true},
            "test_id": {"dataType":"string","required":true},
            "start_date": {"dataType":"datetime","required":true},
            "end_date": {"dataType":"datetime"},
            "score": {"dataType":"double"},
            "ai_feedback": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateTestResultRequest": {
        "dataType": "refObject",
        "properties": {
            "result_id": {"dataType":"string","required":true},
            "user_id": {"dataType":"string"},
            "test_id": {"dataType":"string"},
            "start_date": {"dataType":"datetime"},
            "end_date": {"dataType":"datetime"},
            "score": {"dataType":"double"},
            "ai_feedback": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TestResponse": {
        "dataType": "refObject",
        "properties": {
            "test_id": {"dataType":"string","required":true},
            "course_id": {"dataType":"string"},
            "type_status": {"dataType":"string","required":true},
            "title": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_TestResponse-Array_": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "data": {"dataType":"array","array":{"dataType":"refObject","ref":"TestResponse"}},
            "message": {"dataType":"string"},
            "error": {"dataType":"string"},
            "details": {"dataType":"any"},
            "pagination": {"dataType":"nestedObjectLiteral","nestedProperties":{"totalPages":{"dataType":"double","required":true},"total":{"dataType":"double","required":true},"limit":{"dataType":"double","required":true},"page":{"dataType":"double","required":true}}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_TestResponse_": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "data": {"ref":"TestResponse"},
            "message": {"dataType":"string"},
            "error": {"dataType":"string"},
            "details": {"dataType":"any"},
            "pagination": {"dataType":"nestedObjectLiteral","nestedProperties":{"totalPages":{"dataType":"double","required":true},"total":{"dataType":"double","required":true},"limit":{"dataType":"double","required":true},"page":{"dataType":"double","required":true}}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateTestRequest": {
        "dataType": "refObject",
        "properties": {
            "course_id": {"dataType":"string"},
            "type_status": {"dataType":"string","required":true},
            "title": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateTestRequest": {
        "dataType": "refObject",
        "properties": {
            "test_id": {"dataType":"string","required":true},
            "course_id": {"dataType":"string"},
            "type_status": {"dataType":"string"},
            "title": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SectionResponse": {
        "dataType": "refObject",
        "properties": {
            "section_id": {"dataType":"string","required":true},
            "title": {"dataType":"string","required":true},
            "chapter_id": {"dataType":"string","required":true},
            "video_url": {"dataType":"string"},
            "knowledge_points": {"dataType":"string"},
            "video_subtitles": {"dataType":"string"},
            "knowledge_content": {"dataType":"string"},
            "estimated_time": {"dataType":"double"},
            "section_order": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_SectionResponse-Array_": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "data": {"dataType":"array","array":{"dataType":"refObject","ref":"SectionResponse"}},
            "message": {"dataType":"string"},
            "error": {"dataType":"string"},
            "details": {"dataType":"any"},
            "pagination": {"dataType":"nestedObjectLiteral","nestedProperties":{"totalPages":{"dataType":"double","required":true},"total":{"dataType":"double","required":true},"limit":{"dataType":"double","required":true},"page":{"dataType":"double","required":true}}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_SectionResponse_": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "data": {"ref":"SectionResponse"},
            "message": {"dataType":"string"},
            "error": {"dataType":"string"},
            "details": {"dataType":"any"},
            "pagination": {"dataType":"nestedObjectLiteral","nestedProperties":{"totalPages":{"dataType":"double","required":true},"total":{"dataType":"double","required":true},"limit":{"dataType":"double","required":true},"page":{"dataType":"double","required":true}}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateSectionRequest": {
        "dataType": "refObject",
        "properties": {
            "title": {"dataType":"string","required":true},
            "chapter_id": {"dataType":"string","required":true},
            "video_url": {"dataType":"string"},
            "knowledge_points": {"dataType":"string"},
            "video_subtitles": {"dataType":"string"},
            "knowledge_content": {"dataType":"string"},
            "estimated_time": {"dataType":"double"},
            "section_order": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateSectionRequest": {
        "dataType": "refObject",
        "properties": {
            "section_id": {"dataType":"string","required":true},
            "title": {"dataType":"string"},
            "chapter_id": {"dataType":"string"},
            "video_url": {"dataType":"string"},
            "knowledge_points": {"dataType":"string"},
            "video_subtitles": {"dataType":"string"},
            "knowledge_content": {"dataType":"string"},
            "estimated_time": {"dataType":"double"},
            "section_order": {"dataType":"double"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "LearningRecordResponse": {
        "dataType": "refObject",
        "properties": {
            "task_id": {"dataType":"string","required":true},
            "plan_id": {"dataType":"string","required":true},
            "user_id": {"dataType":"string","required":true},
            "section_id": {"dataType":"string","required":true},
            "start_date": {"dataType":"datetime"},
            "end_date": {"dataType":"datetime"},
            "status": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_LearningRecordResponse-Array_": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "data": {"dataType":"array","array":{"dataType":"refObject","ref":"LearningRecordResponse"}},
            "message": {"dataType":"string"},
            "error": {"dataType":"string"},
            "details": {"dataType":"any"},
            "pagination": {"dataType":"nestedObjectLiteral","nestedProperties":{"totalPages":{"dataType":"double","required":true},"total":{"dataType":"double","required":true},"limit":{"dataType":"double","required":true},"page":{"dataType":"double","required":true}}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_LearningRecordResponse_": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "data": {"ref":"LearningRecordResponse"},
            "message": {"dataType":"string"},
            "error": {"dataType":"string"},
            "details": {"dataType":"any"},
            "pagination": {"dataType":"nestedObjectLiteral","nestedProperties":{"totalPages":{"dataType":"double","required":true},"total":{"dataType":"double","required":true},"limit":{"dataType":"double","required":true},"page":{"dataType":"double","required":true}}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateLearningRecordRequest": {
        "dataType": "refObject",
        "properties": {
            "plan_id": {"dataType":"string","required":true},
            "user_id": {"dataType":"string","required":true},
            "section_id": {"dataType":"string","required":true},
            "start_date": {"dataType":"datetime"},
            "end_date": {"dataType":"datetime"},
            "status": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateLearningRecordRequest": {
        "dataType": "refObject",
        "properties": {
            "task_id": {"dataType":"string","required":true},
            "plan_id": {"dataType":"string"},
            "user_id": {"dataType":"string"},
            "section_id": {"dataType":"string"},
            "start_date": {"dataType":"datetime"},
            "end_date": {"dataType":"datetime"},
            "status": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "LeadingQuestionResponse": {
        "dataType": "refObject",
        "properties": {
            "question_id": {"dataType":"string","required":true},
            "section_id": {"dataType":"string","required":true},
            "question": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_LeadingQuestionResponse-Array_": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "data": {"dataType":"array","array":{"dataType":"refObject","ref":"LeadingQuestionResponse"}},
            "message": {"dataType":"string"},
            "error": {"dataType":"string"},
            "details": {"dataType":"any"},
            "pagination": {"dataType":"nestedObjectLiteral","nestedProperties":{"totalPages":{"dataType":"double","required":true},"total":{"dataType":"double","required":true},"limit":{"dataType":"double","required":true},"page":{"dataType":"double","required":true}}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_LeadingQuestionResponse_": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "data": {"ref":"LeadingQuestionResponse"},
            "message": {"dataType":"string"},
            "error": {"dataType":"string"},
            "details": {"dataType":"any"},
            "pagination": {"dataType":"nestedObjectLiteral","nestedProperties":{"totalPages":{"dataType":"double","required":true},"total":{"dataType":"double","required":true},"limit":{"dataType":"double","required":true},"page":{"dataType":"double","required":true}}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateLeadingQuestionRequest": {
        "dataType": "refObject",
        "properties": {
            "section_id": {"dataType":"string","required":true},
            "question": {"dataType":"string","required":true},
            "answer": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateLeadingQuestionRequest": {
        "dataType": "refObject",
        "properties": {
            "question_id": {"dataType":"string","required":true},
            "section_id": {"dataType":"string"},
            "question": {"dataType":"string"},
            "answer": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ExerciseOptionResponse": {
        "dataType": "refObject",
        "properties": {
            "option_id": {"dataType":"string","required":true},
            "exercise_id": {"dataType":"string","required":true},
            "option_text": {"dataType":"string","required":true},
            "is_correct": {"dataType":"boolean","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_ExerciseOptionResponse-Array_": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "data": {"dataType":"array","array":{"dataType":"refObject","ref":"ExerciseOptionResponse"}},
            "message": {"dataType":"string"},
            "error": {"dataType":"string"},
            "details": {"dataType":"any"},
            "pagination": {"dataType":"nestedObjectLiteral","nestedProperties":{"totalPages":{"dataType":"double","required":true},"total":{"dataType":"double","required":true},"limit":{"dataType":"double","required":true},"page":{"dataType":"double","required":true}}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_ExerciseOptionResponse_": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "data": {"ref":"ExerciseOptionResponse"},
            "message": {"dataType":"string"},
            "error": {"dataType":"string"},
            "details": {"dataType":"any"},
            "pagination": {"dataType":"nestedObjectLiteral","nestedProperties":{"totalPages":{"dataType":"double","required":true},"total":{"dataType":"double","required":true},"limit":{"dataType":"double","required":true},"page":{"dataType":"double","required":true}}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateExerciseOptionRequest": {
        "dataType": "refObject",
        "properties": {
            "exercise_id": {"dataType":"string","required":true},
            "option_text": {"dataType":"string","required":true},
            "is_correct": {"dataType":"boolean","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateExerciseOptionRequest": {
        "dataType": "refObject",
        "properties": {
            "option_id": {"dataType":"string","required":true},
            "exercise_id": {"dataType":"string"},
            "option_text": {"dataType":"string"},
            "is_correct": {"dataType":"boolean"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ExerciseResponse": {
        "dataType": "refObject",
        "properties": {
            "exercise_id": {"dataType":"string","required":true},
            "section_id": {"dataType":"string"},
            "question": {"dataType":"string","required":true},
            "type_status": {"dataType":"string","required":true},
            "score": {"dataType":"double","required":true},
            "answer": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_ExerciseResponse-Array_": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "data": {"dataType":"array","array":{"dataType":"refObject","ref":"ExerciseResponse"}},
            "message": {"dataType":"string"},
            "error": {"dataType":"string"},
            "details": {"dataType":"any"},
            "pagination": {"dataType":"nestedObjectLiteral","nestedProperties":{"totalPages":{"dataType":"double","required":true},"total":{"dataType":"double","required":true},"limit":{"dataType":"double","required":true},"page":{"dataType":"double","required":true}}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_ExerciseResponse_": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "data": {"ref":"ExerciseResponse"},
            "message": {"dataType":"string"},
            "error": {"dataType":"string"},
            "details": {"dataType":"any"},
            "pagination": {"dataType":"nestedObjectLiteral","nestedProperties":{"totalPages":{"dataType":"double","required":true},"total":{"dataType":"double","required":true},"limit":{"dataType":"double","required":true},"page":{"dataType":"double","required":true}}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateExerciseRequest": {
        "dataType": "refObject",
        "properties": {
            "section_id": {"dataType":"string"},
            "question": {"dataType":"string","required":true},
            "type_status": {"dataType":"string","required":true},
            "score": {"dataType":"double"},
            "answer": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateExerciseRequest": {
        "dataType": "refObject",
        "properties": {
            "exercise_id": {"dataType":"string","required":true},
            "section_id": {"dataType":"string"},
            "question": {"dataType":"string"},
            "type_status": {"dataType":"string"},
            "score": {"dataType":"double"},
            "answer": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DailySummaryResponse": {
        "dataType": "refObject",
        "properties": {
            "summary_id": {"dataType":"string","required":true},
            "user_id": {"dataType":"string","required":true},
            "summary_date": {"dataType":"datetime","required":true},
            "content": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_DailySummaryResponse-Array_": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "data": {"dataType":"array","array":{"dataType":"refObject","ref":"DailySummaryResponse"}},
            "message": {"dataType":"string"},
            "error": {"dataType":"string"},
            "details": {"dataType":"any"},
            "pagination": {"dataType":"nestedObjectLiteral","nestedProperties":{"totalPages":{"dataType":"double","required":true},"total":{"dataType":"double","required":true},"limit":{"dataType":"double","required":true},"page":{"dataType":"double","required":true}}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DailySummaryListRequest": {
        "dataType": "refObject",
        "properties": {
            "user_id": {"dataType":"string"},
            "summary_date": {"dataType":"datetime"},
            "page": {"dataType":"double"},
            "limit": {"dataType":"double"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_DailySummaryResponse_": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "data": {"ref":"DailySummaryResponse"},
            "message": {"dataType":"string"},
            "error": {"dataType":"string"},
            "details": {"dataType":"any"},
            "pagination": {"dataType":"nestedObjectLiteral","nestedProperties":{"totalPages":{"dataType":"double","required":true},"total":{"dataType":"double","required":true},"limit":{"dataType":"double","required":true},"page":{"dataType":"double","required":true}}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateDailySummaryRequest": {
        "dataType": "refObject",
        "properties": {
            "user_id": {"dataType":"string","required":true},
            "summary_date": {"dataType":"datetime","required":true},
            "content": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateDailySummaryRequest": {
        "dataType": "refObject",
        "properties": {
            "summary_id": {"dataType":"string","required":true},
            "content": {"dataType":"string"},
            "summary_date": {"dataType":"datetime"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CourseScheduleResponse": {
        "dataType": "refObject",
        "properties": {
            "plan_id": {"dataType":"string","required":true},
            "user_id": {"dataType":"string","required":true},
            "course_id": {"dataType":"string","required":true},
            "start_date": {"dataType":"datetime"},
            "end_date": {"dataType":"datetime"},
            "status": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_CourseScheduleResponse-Array_": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "data": {"dataType":"array","array":{"dataType":"refObject","ref":"CourseScheduleResponse"}},
            "message": {"dataType":"string"},
            "error": {"dataType":"string"},
            "details": {"dataType":"any"},
            "pagination": {"dataType":"nestedObjectLiteral","nestedProperties":{"totalPages":{"dataType":"double","required":true},"total":{"dataType":"double","required":true},"limit":{"dataType":"double","required":true},"page":{"dataType":"double","required":true}}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_CourseScheduleResponse_": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "data": {"ref":"CourseScheduleResponse"},
            "message": {"dataType":"string"},
            "error": {"dataType":"string"},
            "details": {"dataType":"any"},
            "pagination": {"dataType":"nestedObjectLiteral","nestedProperties":{"totalPages":{"dataType":"double","required":true},"total":{"dataType":"double","required":true},"limit":{"dataType":"double","required":true},"page":{"dataType":"double","required":true}}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateCourseScheduleRequest": {
        "dataType": "refObject",
        "properties": {
            "user_id": {"dataType":"string","required":true},
            "course_id": {"dataType":"string","required":true},
            "start_date": {"dataType":"datetime"},
            "end_date": {"dataType":"datetime"},
            "status": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CourseResponse": {
        "dataType": "refObject",
        "properties": {
            "course_id": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
            "icon_url": {"dataType":"string"},
            "description": {"dataType":"string"},
            "default_ai_persona_id": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_CourseResponse-Array_": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "data": {"dataType":"array","array":{"dataType":"refObject","ref":"CourseResponse"}},
            "message": {"dataType":"string"},
            "error": {"dataType":"string"},
            "details": {"dataType":"any"},
            "pagination": {"dataType":"nestedObjectLiteral","nestedProperties":{"totalPages":{"dataType":"double","required":true},"total":{"dataType":"double","required":true},"limit":{"dataType":"double","required":true},"page":{"dataType":"double","required":true}}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_CourseResponse_": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "data": {"ref":"CourseResponse"},
            "message": {"dataType":"string"},
            "error": {"dataType":"string"},
            "details": {"dataType":"any"},
            "pagination": {"dataType":"nestedObjectLiteral","nestedProperties":{"totalPages":{"dataType":"double","required":true},"total":{"dataType":"double","required":true},"limit":{"dataType":"double","required":true},"page":{"dataType":"double","required":true}}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateCourseRequest": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "icon_url": {"dataType":"string"},
            "description": {"dataType":"string"},
            "default_ai_persona_id": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateCourseRequest": {
        "dataType": "refObject",
        "properties": {
            "course_id": {"dataType":"string","required":true},
            "name": {"dataType":"string"},
            "icon_url": {"dataType":"string"},
            "description": {"dataType":"string"},
            "default_ai_persona_id": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ChapterResponse": {
        "dataType": "refObject",
        "properties": {
            "chapter_id": {"dataType":"string","required":true},
            "course_id": {"dataType":"string","required":true},
            "title": {"dataType":"string","required":true},
            "chapter_order": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_ChapterResponse-Array_": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "data": {"dataType":"array","array":{"dataType":"refObject","ref":"ChapterResponse"}},
            "message": {"dataType":"string"},
            "error": {"dataType":"string"},
            "details": {"dataType":"any"},
            "pagination": {"dataType":"nestedObjectLiteral","nestedProperties":{"totalPages":{"dataType":"double","required":true},"total":{"dataType":"double","required":true},"limit":{"dataType":"double","required":true},"page":{"dataType":"double","required":true}}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_ChapterResponse_": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "data": {"ref":"ChapterResponse"},
            "message": {"dataType":"string"},
            "error": {"dataType":"string"},
            "details": {"dataType":"any"},
            "pagination": {"dataType":"nestedObjectLiteral","nestedProperties":{"totalPages":{"dataType":"double","required":true},"total":{"dataType":"double","required":true},"limit":{"dataType":"double","required":true},"page":{"dataType":"double","required":true}}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateChapterRequest": {
        "dataType": "refObject",
        "properties": {
            "course_id": {"dataType":"string","required":true},
            "title": {"dataType":"string","required":true},
            "chapter_order": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateChapterRequest": {
        "dataType": "refObject",
        "properties": {
            "chapter_id": {"dataType":"string","required":true},
            "course_id": {"dataType":"string"},
            "title": {"dataType":"string"},
            "chapter_order": {"dataType":"double"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AiPersonaResponse": {
        "dataType": "refObject",
        "properties": {
            "persona_id": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
            "prompt": {"dataType":"string","required":true},
            "is_default_template": {"dataType":"boolean","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_AiPersonaResponse-Array_": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "data": {"dataType":"array","array":{"dataType":"refObject","ref":"AiPersonaResponse"}},
            "message": {"dataType":"string"},
            "error": {"dataType":"string"},
            "details": {"dataType":"any"},
            "pagination": {"dataType":"nestedObjectLiteral","nestedProperties":{"totalPages":{"dataType":"double","required":true},"total":{"dataType":"double","required":true},"limit":{"dataType":"double","required":true},"page":{"dataType":"double","required":true}}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_AiPersonaResponse_": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "data": {"ref":"AiPersonaResponse"},
            "message": {"dataType":"string"},
            "error": {"dataType":"string"},
            "details": {"dataType":"any"},
            "pagination": {"dataType":"nestedObjectLiteral","nestedProperties":{"totalPages":{"dataType":"double","required":true},"total":{"dataType":"double","required":true},"limit":{"dataType":"double","required":true},"page":{"dataType":"double","required":true}}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateAiPersonaRequest": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "prompt": {"dataType":"string","required":true},
            "is_default_template": {"dataType":"boolean"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateAiPersonaRequest": {
        "dataType": "refObject",
        "properties": {
            "persona_id": {"dataType":"string","required":true},
            "name": {"dataType":"string"},
            "prompt": {"dataType":"string"},
            "is_default_template": {"dataType":"boolean"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AiInteractionResponse": {
        "dataType": "refObject",
        "properties": {
            "interaction_id": {"dataType":"string","required":true},
            "user_id": {"dataType":"string","required":true},
            "section_id": {"dataType":"string","required":true},
            "session_id": {"dataType":"string","required":true},
            "user_message": {"dataType":"string","required":true},
            "ai_response": {"dataType":"string","required":true},
            "query_time": {"dataType":"datetime"},
            "persona_id_in_use": {"dataType":"string"},
            "persona_id": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_AiInteractionResponse-Array_": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "data": {"dataType":"array","array":{"dataType":"refObject","ref":"AiInteractionResponse"}},
            "message": {"dataType":"string"},
            "error": {"dataType":"string"},
            "details": {"dataType":"any"},
            "pagination": {"dataType":"nestedObjectLiteral","nestedProperties":{"totalPages":{"dataType":"double","required":true},"total":{"dataType":"double","required":true},"limit":{"dataType":"double","required":true},"page":{"dataType":"double","required":true}}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_AiInteractionResponse_": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "data": {"ref":"AiInteractionResponse"},
            "message": {"dataType":"string"},
            "error": {"dataType":"string"},
            "details": {"dataType":"any"},
            "pagination": {"dataType":"nestedObjectLiteral","nestedProperties":{"totalPages":{"dataType":"double","required":true},"total":{"dataType":"double","required":true},"limit":{"dataType":"double","required":true},"page":{"dataType":"double","required":true}}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateAiInteractionRequest": {
        "dataType": "refObject",
        "properties": {
            "user_id": {"dataType":"string","required":true},
            "section_id": {"dataType":"string","required":true},
            "session_id": {"dataType":"string","required":true},
            "user_message": {"dataType":"string","required":true},
            "ai_response": {"dataType":"string","required":true},
            "query_time": {"dataType":"datetime"},
            "persona_id_in_use": {"dataType":"string"},
            "persona_id": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateAiInteractionRequest": {
        "dataType": "refObject",
        "properties": {
            "interaction_id": {"dataType":"string","required":true},
            "user_id": {"dataType":"string"},
            "section_id": {"dataType":"string"},
            "session_id": {"dataType":"string"},
            "user_message": {"dataType":"string"},
            "ai_response": {"dataType":"string"},
            "query_time": {"dataType":"datetime"},
            "persona_id_in_use": {"dataType":"string"},
            "persona_id": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
};
const templateService = new ExpressTemplateService(models, {"noImplicitAdditionalProperties":"throw-on-extras","bodyCoercion":true});

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa




export function RegisterRoutes(app: Router) {

    // ###########################################################################################################
    //  NOTE: If you do not see routes for all of your controllers in this file, then you might not have informed tsoa of where to look
    //      Please look into the "controllerPathGlobs" config option described in the readme: https://github.com/lukeautry/tsoa
    // ###########################################################################################################


    
        const argsUserController_getFirstUser: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.get('/users/firstUser',
            ...(fetchMiddlewares<RequestHandler>(UserController)),
            ...(fetchMiddlewares<RequestHandler>(UserController.prototype.getFirstUser)),

            async function UserController_getFirstUser(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsUserController_getFirstUser, request, response });

                const controller = new UserController();

              await templateService.apiHandler({
                methodName: 'getFirstUser',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsUserController_getChaptersAndSectionsByUserId: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"userId":{"dataType":"string","required":true}}},
        };
        app.post('/users/courseChaptersSectionsByUser',
            ...(fetchMiddlewares<RequestHandler>(UserController)),
            ...(fetchMiddlewares<RequestHandler>(UserController.prototype.getChaptersAndSectionsByUserId)),

            async function UserController_getChaptersAndSectionsByUserId(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsUserController_getChaptersAndSectionsByUserId, request, response });

                const controller = new UserController();

              await templateService.apiHandler({
                methodName: 'getChaptersAndSectionsByUserId',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsUserController_getAllCourses: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.get('/users/allCourses',
            ...(fetchMiddlewares<RequestHandler>(UserController)),
            ...(fetchMiddlewares<RequestHandler>(UserController.prototype.getAllCourses)),

            async function UserController_getAllCourses(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsUserController_getAllCourses, request, response });

                const controller = new UserController();

              await templateService.apiHandler({
                methodName: 'getAllCourses',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsUserController_testJoinById: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"userId":{"dataType":"string","required":true}}},
        };
        app.post('/users/testJoinById',
            ...(fetchMiddlewares<RequestHandler>(UserController)),
            ...(fetchMiddlewares<RequestHandler>(UserController.prototype.testJoinById)),

            async function UserController_testJoinById(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsUserController_testJoinById, request, response });

                const controller = new UserController();

              await templateService.apiHandler({
                methodName: 'testJoinById',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsUserController_getUserById: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"userId":{"dataType":"string","required":true}}},
        };
        app.post('/users/getById',
            ...(fetchMiddlewares<RequestHandler>(UserController)),
            ...(fetchMiddlewares<RequestHandler>(UserController.prototype.getUserById)),

            async function UserController_getUserById(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsUserController_getUserById, request, response });

                const controller = new UserController();

              await templateService.apiHandler({
                methodName: 'getUserById',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsUserController_searchUsers: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"limit":{"dataType":"double"},"page":{"dataType":"double"},"name":{"dataType":"string"}}},
        };
        app.post('/users/search',
            ...(fetchMiddlewares<RequestHandler>(UserController)),
            ...(fetchMiddlewares<RequestHandler>(UserController.prototype.searchUsers)),

            async function UserController_searchUsers(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsUserController_searchUsers, request, response });

                const controller = new UserController();

              await templateService.apiHandler({
                methodName: 'searchUsers',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsUserController_addUser: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"CreateUserRequest"},
        };
        app.post('/users/add',
            ...(fetchMiddlewares<RequestHandler>(UserController)),
            ...(fetchMiddlewares<RequestHandler>(UserController.prototype.addUser)),

            async function UserController_addUser(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsUserController_addUser, request, response });

                const controller = new UserController();

              await templateService.apiHandler({
                methodName: 'addUser',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsUserController_updateUser: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"UpdateUserRequest"},
        };
        app.post('/users/update',
            ...(fetchMiddlewares<RequestHandler>(UserController)),
            ...(fetchMiddlewares<RequestHandler>(UserController.prototype.updateUser)),

            async function UserController_updateUser(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsUserController_updateUser, request, response });

                const controller = new UserController();

              await templateService.apiHandler({
                methodName: 'updateUser',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsUserController_deleteUser: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"user_id":{"dataType":"string","required":true}}},
        };
        app.post('/users/delete',
            ...(fetchMiddlewares<RequestHandler>(UserController)),
            ...(fetchMiddlewares<RequestHandler>(UserController.prototype.deleteUser)),

            async function UserController_deleteUser(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsUserController_deleteUser, request, response });

                const controller = new UserController();

              await templateService.apiHandler({
                methodName: 'deleteUser',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTitleController_lsearchTitles: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"limit":{"dataType":"double"},"page":{"dataType":"double"}}},
        };
        app.post('/titles/search',
            ...(fetchMiddlewares<RequestHandler>(TitleController)),
            ...(fetchMiddlewares<RequestHandler>(TitleController.prototype.lsearchTitles)),

            async function TitleController_lsearchTitles(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTitleController_lsearchTitles, request, response });

                const controller = new TitleController();

              await templateService.apiHandler({
                methodName: 'lsearchTitles',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTitleController_getTitleById: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"title_id":{"dataType":"string","required":true}}},
        };
        app.post('/titles/getById',
            ...(fetchMiddlewares<RequestHandler>(TitleController)),
            ...(fetchMiddlewares<RequestHandler>(TitleController.prototype.getTitleById)),

            async function TitleController_getTitleById(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTitleController_getTitleById, request, response });

                const controller = new TitleController();

              await templateService.apiHandler({
                methodName: 'getTitleById',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTitleController_addTitle: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"CreateTitleRequest"},
        };
        app.post('/titles/add',
            ...(fetchMiddlewares<RequestHandler>(TitleController)),
            ...(fetchMiddlewares<RequestHandler>(TitleController.prototype.addTitle)),

            async function TitleController_addTitle(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTitleController_addTitle, request, response });

                const controller = new TitleController();

              await templateService.apiHandler({
                methodName: 'addTitle',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTitleController_updateTitle: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"UpdateTitleRequest"},
        };
        app.post('/titles/update',
            ...(fetchMiddlewares<RequestHandler>(TitleController)),
            ...(fetchMiddlewares<RequestHandler>(TitleController.prototype.updateTitle)),

            async function TitleController_updateTitle(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTitleController_updateTitle, request, response });

                const controller = new TitleController();

              await templateService.apiHandler({
                methodName: 'updateTitle',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTitleController_deleteTitle: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"title_id":{"dataType":"string","required":true}}},
        };
        app.post('/titles/delete',
            ...(fetchMiddlewares<RequestHandler>(TitleController)),
            ...(fetchMiddlewares<RequestHandler>(TitleController.prototype.deleteTitle)),

            async function TitleController_deleteTitle(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTitleController_deleteTitle, request, response });

                const controller = new TitleController();

              await templateService.apiHandler({
                methodName: 'deleteTitle',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTestResultController_searchTestResults: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"limit":{"dataType":"double"},"page":{"dataType":"double"}}},
        };
        app.post('/test-results/search',
            ...(fetchMiddlewares<RequestHandler>(TestResultController)),
            ...(fetchMiddlewares<RequestHandler>(TestResultController.prototype.searchTestResults)),

            async function TestResultController_searchTestResults(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTestResultController_searchTestResults, request, response });

                const controller = new TestResultController();

              await templateService.apiHandler({
                methodName: 'searchTestResults',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTestResultController_getTestResultById: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"result_id":{"dataType":"string","required":true}}},
        };
        app.post('/test-results/getById',
            ...(fetchMiddlewares<RequestHandler>(TestResultController)),
            ...(fetchMiddlewares<RequestHandler>(TestResultController.prototype.getTestResultById)),

            async function TestResultController_getTestResultById(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTestResultController_getTestResultById, request, response });

                const controller = new TestResultController();

              await templateService.apiHandler({
                methodName: 'getTestResultById',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTestResultController_addTestResult: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"CreateTestResultRequest"},
        };
        app.post('/test-results/add',
            ...(fetchMiddlewares<RequestHandler>(TestResultController)),
            ...(fetchMiddlewares<RequestHandler>(TestResultController.prototype.addTestResult)),

            async function TestResultController_addTestResult(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTestResultController_addTestResult, request, response });

                const controller = new TestResultController();

              await templateService.apiHandler({
                methodName: 'addTestResult',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTestResultController_updateTestResult: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"UpdateTestResultRequest"},
        };
        app.post('/test-results/update',
            ...(fetchMiddlewares<RequestHandler>(TestResultController)),
            ...(fetchMiddlewares<RequestHandler>(TestResultController.prototype.updateTestResult)),

            async function TestResultController_updateTestResult(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTestResultController_updateTestResult, request, response });

                const controller = new TestResultController();

              await templateService.apiHandler({
                methodName: 'updateTestResult',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTestResultController_deleteTestResult: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"result_id":{"dataType":"string","required":true}}},
        };
        app.post('/test-results/delete',
            ...(fetchMiddlewares<RequestHandler>(TestResultController)),
            ...(fetchMiddlewares<RequestHandler>(TestResultController.prototype.deleteTestResult)),

            async function TestResultController_deleteTestResult(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTestResultController_deleteTestResult, request, response });

                const controller = new TestResultController();

              await templateService.apiHandler({
                methodName: 'deleteTestResult',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTestController_searchTests: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"limit":{"dataType":"double"},"page":{"dataType":"double"}}},
        };
        app.post('/tests/search',
            ...(fetchMiddlewares<RequestHandler>(TestController)),
            ...(fetchMiddlewares<RequestHandler>(TestController.prototype.searchTests)),

            async function TestController_searchTests(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTestController_searchTests, request, response });

                const controller = new TestController();

              await templateService.apiHandler({
                methodName: 'searchTests',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTestController_getTestById: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"test_id":{"dataType":"string","required":true}}},
        };
        app.post('/tests/getById',
            ...(fetchMiddlewares<RequestHandler>(TestController)),
            ...(fetchMiddlewares<RequestHandler>(TestController.prototype.getTestById)),

            async function TestController_getTestById(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTestController_getTestById, request, response });

                const controller = new TestController();

              await templateService.apiHandler({
                methodName: 'getTestById',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTestController_addTest: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"CreateTestRequest"},
        };
        app.post('/tests/add',
            ...(fetchMiddlewares<RequestHandler>(TestController)),
            ...(fetchMiddlewares<RequestHandler>(TestController.prototype.addTest)),

            async function TestController_addTest(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTestController_addTest, request, response });

                const controller = new TestController();

              await templateService.apiHandler({
                methodName: 'addTest',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTestController_updateTest: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"UpdateTestRequest"},
        };
        app.post('/tests/update',
            ...(fetchMiddlewares<RequestHandler>(TestController)),
            ...(fetchMiddlewares<RequestHandler>(TestController.prototype.updateTest)),

            async function TestController_updateTest(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTestController_updateTest, request, response });

                const controller = new TestController();

              await templateService.apiHandler({
                methodName: 'updateTest',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTestController_deleteTest: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"test_id":{"dataType":"string","required":true}}},
        };
        app.post('/tests/delete',
            ...(fetchMiddlewares<RequestHandler>(TestController)),
            ...(fetchMiddlewares<RequestHandler>(TestController.prototype.deleteTest)),

            async function TestController_deleteTest(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTestController_deleteTest, request, response });

                const controller = new TestController();

              await templateService.apiHandler({
                methodName: 'deleteTest',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsSectionController_searchSections: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"limit":{"dataType":"double"},"page":{"dataType":"double"}}},
        };
        app.post('/sections/search',
            ...(fetchMiddlewares<RequestHandler>(SectionController)),
            ...(fetchMiddlewares<RequestHandler>(SectionController.prototype.searchSections)),

            async function SectionController_searchSections(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsSectionController_searchSections, request, response });

                const controller = new SectionController();

              await templateService.apiHandler({
                methodName: 'searchSections',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsSectionController_getSectionById: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"section_id":{"dataType":"string","required":true}}},
        };
        app.post('/sections/getById',
            ...(fetchMiddlewares<RequestHandler>(SectionController)),
            ...(fetchMiddlewares<RequestHandler>(SectionController.prototype.getSectionById)),

            async function SectionController_getSectionById(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsSectionController_getSectionById, request, response });

                const controller = new SectionController();

              await templateService.apiHandler({
                methodName: 'getSectionById',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsSectionController_addSection: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"CreateSectionRequest"},
        };
        app.post('/sections/add',
            ...(fetchMiddlewares<RequestHandler>(SectionController)),
            ...(fetchMiddlewares<RequestHandler>(SectionController.prototype.addSection)),

            async function SectionController_addSection(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsSectionController_addSection, request, response });

                const controller = new SectionController();

              await templateService.apiHandler({
                methodName: 'addSection',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsSectionController_updateSection: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"UpdateSectionRequest"},
        };
        app.post('/sections/update',
            ...(fetchMiddlewares<RequestHandler>(SectionController)),
            ...(fetchMiddlewares<RequestHandler>(SectionController.prototype.updateSection)),

            async function SectionController_updateSection(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsSectionController_updateSection, request, response });

                const controller = new SectionController();

              await templateService.apiHandler({
                methodName: 'updateSection',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsSectionController_deleteSection: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"section_id":{"dataType":"string","required":true}}},
        };
        app.post('/sections/delete',
            ...(fetchMiddlewares<RequestHandler>(SectionController)),
            ...(fetchMiddlewares<RequestHandler>(SectionController.prototype.deleteSection)),

            async function SectionController_deleteSection(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsSectionController_deleteSection, request, response });

                const controller = new SectionController();

              await templateService.apiHandler({
                methodName: 'deleteSection',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsLearningRecordController_searchLearningRecords: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"limit":{"dataType":"double"},"page":{"dataType":"double"}}},
        };
        app.post('/learning-records/search',
            ...(fetchMiddlewares<RequestHandler>(LearningRecordController)),
            ...(fetchMiddlewares<RequestHandler>(LearningRecordController.prototype.searchLearningRecords)),

            async function LearningRecordController_searchLearningRecords(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsLearningRecordController_searchLearningRecords, request, response });

                const controller = new LearningRecordController();

              await templateService.apiHandler({
                methodName: 'searchLearningRecords',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsLearningRecordController_getLearningRecordById: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"task_id":{"dataType":"string","required":true}}},
        };
        app.post('/learning-records/getById',
            ...(fetchMiddlewares<RequestHandler>(LearningRecordController)),
            ...(fetchMiddlewares<RequestHandler>(LearningRecordController.prototype.getLearningRecordById)),

            async function LearningRecordController_getLearningRecordById(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsLearningRecordController_getLearningRecordById, request, response });

                const controller = new LearningRecordController();

              await templateService.apiHandler({
                methodName: 'getLearningRecordById',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsLearningRecordController_addLearningRecord: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"CreateLearningRecordRequest"},
        };
        app.post('/learning-records/add',
            ...(fetchMiddlewares<RequestHandler>(LearningRecordController)),
            ...(fetchMiddlewares<RequestHandler>(LearningRecordController.prototype.addLearningRecord)),

            async function LearningRecordController_addLearningRecord(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsLearningRecordController_addLearningRecord, request, response });

                const controller = new LearningRecordController();

              await templateService.apiHandler({
                methodName: 'addLearningRecord',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsLearningRecordController_updateLearningRecord: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"UpdateLearningRecordRequest"},
        };
        app.post('/learning-records/update',
            ...(fetchMiddlewares<RequestHandler>(LearningRecordController)),
            ...(fetchMiddlewares<RequestHandler>(LearningRecordController.prototype.updateLearningRecord)),

            async function LearningRecordController_updateLearningRecord(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsLearningRecordController_updateLearningRecord, request, response });

                const controller = new LearningRecordController();

              await templateService.apiHandler({
                methodName: 'updateLearningRecord',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsLearningRecordController_deleteLearningRecord: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"task_id":{"dataType":"string","required":true}}},
        };
        app.post('/learning-records/delete',
            ...(fetchMiddlewares<RequestHandler>(LearningRecordController)),
            ...(fetchMiddlewares<RequestHandler>(LearningRecordController.prototype.deleteLearningRecord)),

            async function LearningRecordController_deleteLearningRecord(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsLearningRecordController_deleteLearningRecord, request, response });

                const controller = new LearningRecordController();

              await templateService.apiHandler({
                methodName: 'deleteLearningRecord',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsLeadingQuestionController_searchLeadingQuestions: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"limit":{"dataType":"double"},"page":{"dataType":"double"}}},
        };
        app.post('/leading-questions/search',
            ...(fetchMiddlewares<RequestHandler>(LeadingQuestionController)),
            ...(fetchMiddlewares<RequestHandler>(LeadingQuestionController.prototype.searchLeadingQuestions)),

            async function LeadingQuestionController_searchLeadingQuestions(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsLeadingQuestionController_searchLeadingQuestions, request, response });

                const controller = new LeadingQuestionController();

              await templateService.apiHandler({
                methodName: 'searchLeadingQuestions',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsLeadingQuestionController_getLeadingQuestionById: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"question_id":{"dataType":"string","required":true}}},
        };
        app.post('/leading-questions/getById',
            ...(fetchMiddlewares<RequestHandler>(LeadingQuestionController)),
            ...(fetchMiddlewares<RequestHandler>(LeadingQuestionController.prototype.getLeadingQuestionById)),

            async function LeadingQuestionController_getLeadingQuestionById(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsLeadingQuestionController_getLeadingQuestionById, request, response });

                const controller = new LeadingQuestionController();

              await templateService.apiHandler({
                methodName: 'getLeadingQuestionById',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsLeadingQuestionController_addLeadingQuestion: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"CreateLeadingQuestionRequest"},
        };
        app.post('/leading-questions/add',
            ...(fetchMiddlewares<RequestHandler>(LeadingQuestionController)),
            ...(fetchMiddlewares<RequestHandler>(LeadingQuestionController.prototype.addLeadingQuestion)),

            async function LeadingQuestionController_addLeadingQuestion(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsLeadingQuestionController_addLeadingQuestion, request, response });

                const controller = new LeadingQuestionController();

              await templateService.apiHandler({
                methodName: 'addLeadingQuestion',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsLeadingQuestionController_updateLeadingQuestion: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"UpdateLeadingQuestionRequest"},
        };
        app.post('/leading-questions/update',
            ...(fetchMiddlewares<RequestHandler>(LeadingQuestionController)),
            ...(fetchMiddlewares<RequestHandler>(LeadingQuestionController.prototype.updateLeadingQuestion)),

            async function LeadingQuestionController_updateLeadingQuestion(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsLeadingQuestionController_updateLeadingQuestion, request, response });

                const controller = new LeadingQuestionController();

              await templateService.apiHandler({
                methodName: 'updateLeadingQuestion',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsLeadingQuestionController_deleteLeadingQuestion: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"question_id":{"dataType":"string","required":true}}},
        };
        app.post('/leading-questions/delete',
            ...(fetchMiddlewares<RequestHandler>(LeadingQuestionController)),
            ...(fetchMiddlewares<RequestHandler>(LeadingQuestionController.prototype.deleteLeadingQuestion)),

            async function LeadingQuestionController_deleteLeadingQuestion(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsLeadingQuestionController_deleteLeadingQuestion, request, response });

                const controller = new LeadingQuestionController();

              await templateService.apiHandler({
                methodName: 'deleteLeadingQuestion',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsExerciseOptionController_searchExerciseOptions: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"limit":{"dataType":"double"},"page":{"dataType":"double"}}},
        };
        app.post('/exercise-options/search',
            ...(fetchMiddlewares<RequestHandler>(ExerciseOptionController)),
            ...(fetchMiddlewares<RequestHandler>(ExerciseOptionController.prototype.searchExerciseOptions)),

            async function ExerciseOptionController_searchExerciseOptions(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsExerciseOptionController_searchExerciseOptions, request, response });

                const controller = new ExerciseOptionController();

              await templateService.apiHandler({
                methodName: 'searchExerciseOptions',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsExerciseOptionController_getExerciseOptionById: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"option_id":{"dataType":"string","required":true}}},
        };
        app.post('/exercise-options/getById',
            ...(fetchMiddlewares<RequestHandler>(ExerciseOptionController)),
            ...(fetchMiddlewares<RequestHandler>(ExerciseOptionController.prototype.getExerciseOptionById)),

            async function ExerciseOptionController_getExerciseOptionById(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsExerciseOptionController_getExerciseOptionById, request, response });

                const controller = new ExerciseOptionController();

              await templateService.apiHandler({
                methodName: 'getExerciseOptionById',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsExerciseOptionController_addExerciseOption: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"CreateExerciseOptionRequest"},
        };
        app.post('/exercise-options/add',
            ...(fetchMiddlewares<RequestHandler>(ExerciseOptionController)),
            ...(fetchMiddlewares<RequestHandler>(ExerciseOptionController.prototype.addExerciseOption)),

            async function ExerciseOptionController_addExerciseOption(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsExerciseOptionController_addExerciseOption, request, response });

                const controller = new ExerciseOptionController();

              await templateService.apiHandler({
                methodName: 'addExerciseOption',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsExerciseOptionController_updateExerciseOption: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"UpdateExerciseOptionRequest"},
        };
        app.post('/exercise-options/update',
            ...(fetchMiddlewares<RequestHandler>(ExerciseOptionController)),
            ...(fetchMiddlewares<RequestHandler>(ExerciseOptionController.prototype.updateExerciseOption)),

            async function ExerciseOptionController_updateExerciseOption(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsExerciseOptionController_updateExerciseOption, request, response });

                const controller = new ExerciseOptionController();

              await templateService.apiHandler({
                methodName: 'updateExerciseOption',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsExerciseOptionController_deleteExerciseOption: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"option_id":{"dataType":"string","required":true}}},
        };
        app.post('/exercise-options/delete',
            ...(fetchMiddlewares<RequestHandler>(ExerciseOptionController)),
            ...(fetchMiddlewares<RequestHandler>(ExerciseOptionController.prototype.deleteExerciseOption)),

            async function ExerciseOptionController_deleteExerciseOption(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsExerciseOptionController_deleteExerciseOption, request, response });

                const controller = new ExerciseOptionController();

              await templateService.apiHandler({
                methodName: 'deleteExerciseOption',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsExerciseController_searchExercises: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"limit":{"dataType":"double"},"page":{"dataType":"double"}}},
        };
        app.post('/exercises/search',
            ...(fetchMiddlewares<RequestHandler>(ExerciseController)),
            ...(fetchMiddlewares<RequestHandler>(ExerciseController.prototype.searchExercises)),

            async function ExerciseController_searchExercises(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsExerciseController_searchExercises, request, response });

                const controller = new ExerciseController();

              await templateService.apiHandler({
                methodName: 'searchExercises',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsExerciseController_getExerciseById: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"exercise_id":{"dataType":"string","required":true}}},
        };
        app.post('/exercises/getById',
            ...(fetchMiddlewares<RequestHandler>(ExerciseController)),
            ...(fetchMiddlewares<RequestHandler>(ExerciseController.prototype.getExerciseById)),

            async function ExerciseController_getExerciseById(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsExerciseController_getExerciseById, request, response });

                const controller = new ExerciseController();

              await templateService.apiHandler({
                methodName: 'getExerciseById',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsExerciseController_addExercise: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"CreateExerciseRequest"},
        };
        app.post('/exercises/add',
            ...(fetchMiddlewares<RequestHandler>(ExerciseController)),
            ...(fetchMiddlewares<RequestHandler>(ExerciseController.prototype.addExercise)),

            async function ExerciseController_addExercise(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsExerciseController_addExercise, request, response });

                const controller = new ExerciseController();

              await templateService.apiHandler({
                methodName: 'addExercise',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsExerciseController_updateExercise: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"UpdateExerciseRequest"},
        };
        app.post('/exercises/update',
            ...(fetchMiddlewares<RequestHandler>(ExerciseController)),
            ...(fetchMiddlewares<RequestHandler>(ExerciseController.prototype.updateExercise)),

            async function ExerciseController_updateExercise(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsExerciseController_updateExercise, request, response });

                const controller = new ExerciseController();

              await templateService.apiHandler({
                methodName: 'updateExercise',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsExerciseController_deleteExercise: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"exercise_id":{"dataType":"string","required":true}}},
        };
        app.post('/exercises/delete',
            ...(fetchMiddlewares<RequestHandler>(ExerciseController)),
            ...(fetchMiddlewares<RequestHandler>(ExerciseController.prototype.deleteExercise)),

            async function ExerciseController_deleteExercise(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsExerciseController_deleteExercise, request, response });

                const controller = new ExerciseController();

              await templateService.apiHandler({
                methodName: 'deleteExercise',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsDailySummaryController_searchDailySummary: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"DailySummaryListRequest"},
        };
        app.post('/dailySummary/search',
            ...(fetchMiddlewares<RequestHandler>(DailySummaryController)),
            ...(fetchMiddlewares<RequestHandler>(DailySummaryController.prototype.searchDailySummary)),

            async function DailySummaryController_searchDailySummary(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsDailySummaryController_searchDailySummary, request, response });

                const controller = new DailySummaryController();

              await templateService.apiHandler({
                methodName: 'searchDailySummary',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsDailySummaryController_getDailySummaryById: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"summary_id":{"dataType":"string","required":true}}},
        };
        app.post('/dailySummary/getById',
            ...(fetchMiddlewares<RequestHandler>(DailySummaryController)),
            ...(fetchMiddlewares<RequestHandler>(DailySummaryController.prototype.getDailySummaryById)),

            async function DailySummaryController_getDailySummaryById(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsDailySummaryController_getDailySummaryById, request, response });

                const controller = new DailySummaryController();

              await templateService.apiHandler({
                methodName: 'getDailySummaryById',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsDailySummaryController_addDailySummary: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"CreateDailySummaryRequest"},
        };
        app.post('/dailySummary/add',
            ...(fetchMiddlewares<RequestHandler>(DailySummaryController)),
            ...(fetchMiddlewares<RequestHandler>(DailySummaryController.prototype.addDailySummary)),

            async function DailySummaryController_addDailySummary(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsDailySummaryController_addDailySummary, request, response });

                const controller = new DailySummaryController();

              await templateService.apiHandler({
                methodName: 'addDailySummary',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsDailySummaryController_updateDailySummary: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"UpdateDailySummaryRequest"},
        };
        app.post('/dailySummary/update',
            ...(fetchMiddlewares<RequestHandler>(DailySummaryController)),
            ...(fetchMiddlewares<RequestHandler>(DailySummaryController.prototype.updateDailySummary)),

            async function DailySummaryController_updateDailySummary(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsDailySummaryController_updateDailySummary, request, response });

                const controller = new DailySummaryController();

              await templateService.apiHandler({
                methodName: 'updateDailySummary',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsDailySummaryController_deleteDailySummary: Record<string, TsoaRoute.ParameterSchema> = {
                summary_id: {"in":"body","name":"summary_id","required":true,"dataType":"string"},
        };
        app.post('/dailySummary/delete',
            ...(fetchMiddlewares<RequestHandler>(DailySummaryController)),
            ...(fetchMiddlewares<RequestHandler>(DailySummaryController.prototype.deleteDailySummary)),

            async function DailySummaryController_deleteDailySummary(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsDailySummaryController_deleteDailySummary, request, response });

                const controller = new DailySummaryController();

              await templateService.apiHandler({
                methodName: 'deleteDailySummary',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsCourseScheduleController_searchCourseSchedules: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"limit":{"dataType":"double"},"page":{"dataType":"double"}}},
        };
        app.post('/course-schedules/search',
            ...(fetchMiddlewares<RequestHandler>(CourseScheduleController)),
            ...(fetchMiddlewares<RequestHandler>(CourseScheduleController.prototype.searchCourseSchedules)),

            async function CourseScheduleController_searchCourseSchedules(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsCourseScheduleController_searchCourseSchedules, request, response });

                const controller = new CourseScheduleController();

              await templateService.apiHandler({
                methodName: 'searchCourseSchedules',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsCourseScheduleController_getCourseScheduleById: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"plan_id":{"dataType":"string","required":true}}},
        };
        app.post('/course-schedules/getById',
            ...(fetchMiddlewares<RequestHandler>(CourseScheduleController)),
            ...(fetchMiddlewares<RequestHandler>(CourseScheduleController.prototype.getCourseScheduleById)),

            async function CourseScheduleController_getCourseScheduleById(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsCourseScheduleController_getCourseScheduleById, request, response });

                const controller = new CourseScheduleController();

              await templateService.apiHandler({
                methodName: 'getCourseScheduleById',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsCourseScheduleController_addCourseSchedule: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"CreateCourseScheduleRequest"},
        };
        app.post('/course-schedules/add',
            ...(fetchMiddlewares<RequestHandler>(CourseScheduleController)),
            ...(fetchMiddlewares<RequestHandler>(CourseScheduleController.prototype.addCourseSchedule)),

            async function CourseScheduleController_addCourseSchedule(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsCourseScheduleController_addCourseSchedule, request, response });

                const controller = new CourseScheduleController();

              await templateService.apiHandler({
                methodName: 'addCourseSchedule',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsCourseScheduleController_updateCourseSchedule: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"plan_id":{"dataType":"string","required":true}}},
        };
        app.post('/course-schedules/update',
            ...(fetchMiddlewares<RequestHandler>(CourseScheduleController)),
            ...(fetchMiddlewares<RequestHandler>(CourseScheduleController.prototype.updateCourseSchedule)),

            async function CourseScheduleController_updateCourseSchedule(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsCourseScheduleController_updateCourseSchedule, request, response });

                const controller = new CourseScheduleController();

              await templateService.apiHandler({
                methodName: 'updateCourseSchedule',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsCourseScheduleController_deleteCourseSchedule: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"plan_id":{"dataType":"string","required":true}}},
        };
        app.post('/course-schedules/delete',
            ...(fetchMiddlewares<RequestHandler>(CourseScheduleController)),
            ...(fetchMiddlewares<RequestHandler>(CourseScheduleController.prototype.deleteCourseSchedule)),

            async function CourseScheduleController_deleteCourseSchedule(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsCourseScheduleController_deleteCourseSchedule, request, response });

                const controller = new CourseScheduleController();

              await templateService.apiHandler({
                methodName: 'deleteCourseSchedule',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsCourseController_searchCourses: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"limit":{"dataType":"double"},"page":{"dataType":"double"}}},
        };
        app.post('/courses/search',
            ...(fetchMiddlewares<RequestHandler>(CourseController)),
            ...(fetchMiddlewares<RequestHandler>(CourseController.prototype.searchCourses)),

            async function CourseController_searchCourses(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsCourseController_searchCourses, request, response });

                const controller = new CourseController();

              await templateService.apiHandler({
                methodName: 'searchCourses',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsCourseController_getCourseById: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"course_id":{"dataType":"string","required":true}}},
        };
        app.post('/courses/getById',
            ...(fetchMiddlewares<RequestHandler>(CourseController)),
            ...(fetchMiddlewares<RequestHandler>(CourseController.prototype.getCourseById)),

            async function CourseController_getCourseById(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsCourseController_getCourseById, request, response });

                const controller = new CourseController();

              await templateService.apiHandler({
                methodName: 'getCourseById',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsCourseController_addCourse: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"CreateCourseRequest"},
        };
        app.post('/courses/add',
            ...(fetchMiddlewares<RequestHandler>(CourseController)),
            ...(fetchMiddlewares<RequestHandler>(CourseController.prototype.addCourse)),

            async function CourseController_addCourse(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsCourseController_addCourse, request, response });

                const controller = new CourseController();

              await templateService.apiHandler({
                methodName: 'addCourse',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsCourseController_updateCourse: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"UpdateCourseRequest"},
        };
        app.post('/courses/update',
            ...(fetchMiddlewares<RequestHandler>(CourseController)),
            ...(fetchMiddlewares<RequestHandler>(CourseController.prototype.updateCourse)),

            async function CourseController_updateCourse(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsCourseController_updateCourse, request, response });

                const controller = new CourseController();

              await templateService.apiHandler({
                methodName: 'updateCourse',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsCourseController_deleteCourse: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"course_id":{"dataType":"string","required":true}}},
        };
        app.post('/courses/delete',
            ...(fetchMiddlewares<RequestHandler>(CourseController)),
            ...(fetchMiddlewares<RequestHandler>(CourseController.prototype.deleteCourse)),

            async function CourseController_deleteCourse(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsCourseController_deleteCourse, request, response });

                const controller = new CourseController();

              await templateService.apiHandler({
                methodName: 'deleteCourse',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsChapterController_searchChapters: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"limit":{"dataType":"double"},"page":{"dataType":"double"}}},
        };
        app.post('/chapters/search',
            ...(fetchMiddlewares<RequestHandler>(ChapterController)),
            ...(fetchMiddlewares<RequestHandler>(ChapterController.prototype.searchChapters)),

            async function ChapterController_searchChapters(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsChapterController_searchChapters, request, response });

                const controller = new ChapterController();

              await templateService.apiHandler({
                methodName: 'searchChapters',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsChapterController_getChapterById: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"chapter_id":{"dataType":"string","required":true}}},
        };
        app.post('/chapters/getById',
            ...(fetchMiddlewares<RequestHandler>(ChapterController)),
            ...(fetchMiddlewares<RequestHandler>(ChapterController.prototype.getChapterById)),

            async function ChapterController_getChapterById(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsChapterController_getChapterById, request, response });

                const controller = new ChapterController();

              await templateService.apiHandler({
                methodName: 'getChapterById',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsChapterController_addChapter: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"CreateChapterRequest"},
        };
        app.post('/chapters/add',
            ...(fetchMiddlewares<RequestHandler>(ChapterController)),
            ...(fetchMiddlewares<RequestHandler>(ChapterController.prototype.addChapter)),

            async function ChapterController_addChapter(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsChapterController_addChapter, request, response });

                const controller = new ChapterController();

              await templateService.apiHandler({
                methodName: 'addChapter',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsChapterController_updateChapter: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"UpdateChapterRequest"},
        };
        app.post('/chapters/update',
            ...(fetchMiddlewares<RequestHandler>(ChapterController)),
            ...(fetchMiddlewares<RequestHandler>(ChapterController.prototype.updateChapter)),

            async function ChapterController_updateChapter(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsChapterController_updateChapter, request, response });

                const controller = new ChapterController();

              await templateService.apiHandler({
                methodName: 'updateChapter',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsChapterController_deleteChapter: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"chapter_id":{"dataType":"string","required":true}}},
        };
        app.post('/chapters/delete',
            ...(fetchMiddlewares<RequestHandler>(ChapterController)),
            ...(fetchMiddlewares<RequestHandler>(ChapterController.prototype.deleteChapter)),

            async function ChapterController_deleteChapter(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsChapterController_deleteChapter, request, response });

                const controller = new ChapterController();

              await templateService.apiHandler({
                methodName: 'deleteChapter',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsBilibiliVideoController_getVideoManifest: Record<string, TsoaRoute.ParameterSchema> = {
                bvid: {"in":"query","name":"bvid","required":true,"dataType":"string"},
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
                ok: {"in":"res","name":"200","required":true,"dataType":"string"},
                badRequest: {"in":"res","name":"400","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true},"error":{"dataType":"string","required":true}}},
                serverError: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true},"error":{"dataType":"string","required":true}}},
                sessdata: {"in":"query","name":"sessdata","dataType":"string"},
        };
        app.get('/proxy/bilibili/video-manifest',
            ...(fetchMiddlewares<RequestHandler>(BilibiliVideoController)),
            ...(fetchMiddlewares<RequestHandler>(BilibiliVideoController.prototype.getVideoManifest)),

            async function BilibiliVideoController_getVideoManifest(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsBilibiliVideoController_getVideoManifest, request, response });

                const controller = new BilibiliVideoController();

              await templateService.apiHandler({
                methodName: 'getVideoManifest',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsBilibiliProxyController_proxyBilibiliStream: Record<string, TsoaRoute.ParameterSchema> = {
                url: {"in":"query","name":"url","required":true,"dataType":"string"},
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
                badRequest: {"in":"res","name":"400","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"error":{"dataType":"string","required":true}}},
                serverError: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"error":{"dataType":"string","required":true}}},
        };
        app.get('/proxy/bilibili/stream',
            ...(fetchMiddlewares<RequestHandler>(BilibiliProxyController)),
            ...(fetchMiddlewares<RequestHandler>(BilibiliProxyController.prototype.proxyBilibiliStream)),

            async function BilibiliProxyController_proxyBilibiliStream(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsBilibiliProxyController_proxyBilibiliStream, request, response });

                const controller = new BilibiliProxyController();

              await templateService.apiHandler({
                methodName: 'proxyBilibiliStream',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAiPersonaController_searchAiPersonas: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"limit":{"dataType":"double"},"page":{"dataType":"double"}}},
        };
        app.post('/ai-personas/search',
            ...(fetchMiddlewares<RequestHandler>(AiPersonaController)),
            ...(fetchMiddlewares<RequestHandler>(AiPersonaController.prototype.searchAiPersonas)),

            async function AiPersonaController_searchAiPersonas(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAiPersonaController_searchAiPersonas, request, response });

                const controller = new AiPersonaController();

              await templateService.apiHandler({
                methodName: 'searchAiPersonas',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAiPersonaController_getAiPersonaById: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"persona_id":{"dataType":"string","required":true}}},
        };
        app.post('/ai-personas/getById',
            ...(fetchMiddlewares<RequestHandler>(AiPersonaController)),
            ...(fetchMiddlewares<RequestHandler>(AiPersonaController.prototype.getAiPersonaById)),

            async function AiPersonaController_getAiPersonaById(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAiPersonaController_getAiPersonaById, request, response });

                const controller = new AiPersonaController();

              await templateService.apiHandler({
                methodName: 'getAiPersonaById',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAiPersonaController_addAiPersona: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"CreateAiPersonaRequest"},
        };
        app.post('/ai-personas/add',
            ...(fetchMiddlewares<RequestHandler>(AiPersonaController)),
            ...(fetchMiddlewares<RequestHandler>(AiPersonaController.prototype.addAiPersona)),

            async function AiPersonaController_addAiPersona(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAiPersonaController_addAiPersona, request, response });

                const controller = new AiPersonaController();

              await templateService.apiHandler({
                methodName: 'addAiPersona',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAiPersonaController_updateAiPersona: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"UpdateAiPersonaRequest"},
        };
        app.post('/ai-personas/update',
            ...(fetchMiddlewares<RequestHandler>(AiPersonaController)),
            ...(fetchMiddlewares<RequestHandler>(AiPersonaController.prototype.updateAiPersona)),

            async function AiPersonaController_updateAiPersona(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAiPersonaController_updateAiPersona, request, response });

                const controller = new AiPersonaController();

              await templateService.apiHandler({
                methodName: 'updateAiPersona',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAiPersonaController_deleteAiPersona: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"persona_id":{"dataType":"string","required":true}}},
        };
        app.post('/ai-personas/delete',
            ...(fetchMiddlewares<RequestHandler>(AiPersonaController)),
            ...(fetchMiddlewares<RequestHandler>(AiPersonaController.prototype.deleteAiPersona)),

            async function AiPersonaController_deleteAiPersona(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAiPersonaController_deleteAiPersona, request, response });

                const controller = new AiPersonaController();

              await templateService.apiHandler({
                methodName: 'deleteAiPersona',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAiInteractionController_searchAiInteractions: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"limit":{"dataType":"double"},"page":{"dataType":"double"}}},
        };
        app.post('/ai-interactions/search',
            ...(fetchMiddlewares<RequestHandler>(AiInteractionController)),
            ...(fetchMiddlewares<RequestHandler>(AiInteractionController.prototype.searchAiInteractions)),

            async function AiInteractionController_searchAiInteractions(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAiInteractionController_searchAiInteractions, request, response });

                const controller = new AiInteractionController();

              await templateService.apiHandler({
                methodName: 'searchAiInteractions',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAiInteractionController_getAiInteractionById: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"interaction_id":{"dataType":"string","required":true}}},
        };
        app.post('/ai-interactions/getById',
            ...(fetchMiddlewares<RequestHandler>(AiInteractionController)),
            ...(fetchMiddlewares<RequestHandler>(AiInteractionController.prototype.getAiInteractionById)),

            async function AiInteractionController_getAiInteractionById(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAiInteractionController_getAiInteractionById, request, response });

                const controller = new AiInteractionController();

              await templateService.apiHandler({
                methodName: 'getAiInteractionById',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAiInteractionController_addAiInteraction: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"CreateAiInteractionRequest"},
        };
        app.post('/ai-interactions/add',
            ...(fetchMiddlewares<RequestHandler>(AiInteractionController)),
            ...(fetchMiddlewares<RequestHandler>(AiInteractionController.prototype.addAiInteraction)),

            async function AiInteractionController_addAiInteraction(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAiInteractionController_addAiInteraction, request, response });

                const controller = new AiInteractionController();

              await templateService.apiHandler({
                methodName: 'addAiInteraction',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAiInteractionController_updateAiInteraction: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"UpdateAiInteractionRequest"},
        };
        app.post('/ai-interactions/update',
            ...(fetchMiddlewares<RequestHandler>(AiInteractionController)),
            ...(fetchMiddlewares<RequestHandler>(AiInteractionController.prototype.updateAiInteraction)),

            async function AiInteractionController_updateAiInteraction(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAiInteractionController_updateAiInteraction, request, response });

                const controller = new AiInteractionController();

              await templateService.apiHandler({
                methodName: 'updateAiInteraction',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAiInteractionController_deleteAiInteraction: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"interaction_id":{"dataType":"string","required":true}}},
        };
        app.post('/ai-interactions/delete',
            ...(fetchMiddlewares<RequestHandler>(AiInteractionController)),
            ...(fetchMiddlewares<RequestHandler>(AiInteractionController.prototype.deleteAiInteraction)),

            async function AiInteractionController_deleteAiInteraction(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAiInteractionController_deleteAiInteraction, request, response });

                const controller = new AiInteractionController();

              await templateService.apiHandler({
                methodName: 'deleteAiInteraction',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa


    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
}

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
