export type ViewMode = 'list' | 'card';

export type BlogPost = {
  id: string;
  title: string;
  summary: string;
  category: string;
  date: string;
  readTime: string;
  views: number;
  accent: string;
  accentLight: string;
};

export type TopPost = {
  id: string;
  title: string;
};
