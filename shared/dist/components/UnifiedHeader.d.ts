import { User } from '../types';
export interface UnifiedHeaderProps {
    showSearch?: boolean;
    showPostButton?: boolean;
    showMessages?: boolean;
    showNotifications?: boolean;
    showServerCount?: boolean;
    showMobileMenu?: boolean;
    siteName?: string;
    logoUrl?: string;
    user?: User | null;
    isAuthenticated?: boolean;
    serverCount?: number;
    unreadMessageCount?: number;
    unreadNotificationCount?: number;
    onLogin?: () => void;
    onRegister?: () => void;
    onLogout?: () => void;
    onSearch?: (query: string) => void;
    onPostCreate?: () => void;
    onMobileMenuClick?: () => void;
    notificationDropdownSlot?: React.ReactNode;
    mobileMenuSlot?: React.ReactNode;
}
export declare function UnifiedHeader({ showSearch, showPostButton, showMessages, showNotifications, showServerCount, showMobileMenu, siteName, logoUrl, user, isAuthenticated, serverCount, unreadMessageCount, unreadNotificationCount, onLogin, onRegister, onLogout, onSearch, onPostCreate, onMobileMenuClick, notificationDropdownSlot, mobileMenuSlot, }: UnifiedHeaderProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=UnifiedHeader.d.ts.map