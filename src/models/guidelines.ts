export interface Guidelines{
  list: GuidelineItem[];
}

export interface GuidelineItem {
  id: guidelineIds;
  title: string;
  content?: string;

  category?: string;
  isIgnored?: boolean;
}

export const DEFAULT_GUIDELINES: Guidelines = {
  list: []
}

export type guidelineIds = "GUIDELINE_TOO_MANY_CATEGORIES" | "GUIDELINE_NONE";

export const GUIDELINE_TOO_MANY_CATEGORIES: GuidelineItem = {
  id: "GUIDELINE_TOO_MANY_CATEGORIES",
  title: 'Too many categories',
  category: 'Visual Encoding',
  content: 'Select only few categories that you want to highlight.',
}