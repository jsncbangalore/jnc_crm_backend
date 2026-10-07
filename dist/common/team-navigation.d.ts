export declare const PAGE_KEY_TO_ROUTE: Record<string, string>;
export declare const ROLE_ONLY_PAGE: Record<string, string>;
export interface NavigationDecision {
    action: 'allow' | 'redirect' | 'no_pages';
    targetRoute?: string;
}
export declare function resolveTeamNavigation(user: any, pageKey: string): NavigationDecision;
