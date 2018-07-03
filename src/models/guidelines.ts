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