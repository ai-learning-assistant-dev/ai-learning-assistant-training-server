export interface ChapterResponse {
  chapter_id: string;
  course_id: string;
  title: string;
  chapter_order: number;
}

export interface CreateChapterRequest {
  course_id: string;
  title: string;
  chapter_order: number;
}

export interface UpdateChapterRequest {
  chapter_id: string;
  course_id?: string;
  title?: string;
  chapter_order?: number;
}
