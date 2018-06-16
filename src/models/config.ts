import {VegaTheme, ThemeProps} from "../components/header/theme";

export interface VoyagerConfig {
  showDataSourceSelector?: boolean;
  serverUrl?: string | null;
  hideHeader?: boolean;
  hideFooter?: boolean;
  relatedViews?: 'initiallyCollapsed' | 'initiallyShown' | 'disabled';
  wildcards?: 'enabled' | 'disabled';
  theme?: VegaTheme;
};

export const DEFAULT_VOYAGER_CONFIG: VoyagerConfig = {
  showDataSourceSelector: true,
  serverUrl: null,
  hideHeader: false,
  hideFooter: false,
  relatedViews: 'initiallyShown',
  wildcards: 'enabled',
  theme: VegaTheme.BASIC
};
