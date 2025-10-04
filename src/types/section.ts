export interface SectionResponse {
  section_id: string;
  title: string;
  chapter_id: string;
  video_url?: string;
  knowledge_points?: string;
  video_subtitles?: string;
  knowledge_content?: string;
  estimated_time?: number;
  section_order: number;
}

export interface CreateSectionRequest {
  title: string;
  chapter_id: string;
  video_url?: string;
  knowledge_points?: string;
  video_subtitles?: string;
  knowledge_content?: string;
  estimated_time?: number;
  section_order: number;
}

export interface UpdateSectionRequest {
  section_id: string;
  title?: string;
  chapter_id?: string;
  video_url?: string;
  knowledge_points?: string;
  video_subtitles?: string;
  knowledge_content?: string;
  estimated_time?: number;
  section_order?: number;
}
