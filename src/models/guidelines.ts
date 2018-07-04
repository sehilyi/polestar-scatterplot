export interface Guidelines{
  list: GuidelineItem[];
}

export interface GuidelineItem {
  title: string;
  content?: string;

  category?: string;
  isIgnored?: boolean;
}

export const DEFAULT_GUIDELINES: Guidelines = {
  list: []
}

export const GUIDELINE_TOO_MANY_CATEGORIES: GuidelineItem = {
  title: 'Too many categories',
  category: 'Visual Encoding',
  content: 'Too many categories are used in the chart. To make a better visualization in terms of recognition speed and accuracy, you should reduce the number of categories.'
}