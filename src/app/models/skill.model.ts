export interface SkillModel {
  id: string;
  title: string;
  category: string;
  description: string;
  image?: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  projectIds: string[];
}
