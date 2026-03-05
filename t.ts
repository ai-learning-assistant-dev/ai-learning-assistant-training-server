type c = {
  chapters: {
    id: string;
    title: string;
    order: number;
    sections: {
      estimated_time: number;
      exercises: {
        id: string;
        options: {
          id: string;
          is_correct: boolean;
          text: string;
        }[];
        question: string;
        score: number;
        type: string;
      }[];
      id: string;
      knowledge_content: string;
      knowledge_points: {
        key_points: {
          description: string;
          time: string;
          title: string;
        }[];
      };
      leading_questions: {
        id: string;
        question: string;
      }[];
      order: number;
      title: string;
      video_subtitles: {
        end: string;
        seq: number;
        start: string;
        text: string;
      }[];
      video_url: string;
    }[];
  }[];
  description: string;
  id: string;
  title: string;
};
