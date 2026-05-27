import React from 'react';
export interface SidebarItem {
    key: string;
    label: string;
    icon?: React.ReactNode;
    href?: string;
    onClick?: () => void;
}
export interface AdminSidebarProps {
    /** 服务名称 */
    serviceName: string;
    /** 副标题 */
    subtitle?: string;
    /** 菜单项列表 */
    items: SidebarItem[];
    /** 当前选中的 key */
    activeKey?: string;
    /** 是否折叠模式 */
    collapsed?: boolean;
    /** Logo 图片 URL */
    logoUrl?: string;
    /** 底部额外内容 */
    footerContent?: React.ReactNode;
    /** 菜单项点击回调 */
    onItemClick?: (key: string) => void;
}
export declare function AdminSidebar({ serviceName, subtitle, items, activeKey, collapsed, logoUrl, footerContent, onItemClick, }: AdminSidebarProps): import("react/jsx-runtime").JSX.Element;
export default AdminSidebar;
//# sourceMappingURL=AdminSidebar.d.ts.map