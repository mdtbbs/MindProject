import React from 'react';
export interface TabItem {
    key: string;
    label: string;
    icon?: React.ReactNode;
    disabled?: boolean;
}
export interface TabsProps {
    /** 标签项列表 */
    items: TabItem[];
    /** 当前选中的 key */
    activeKey?: string;
    /** 标签切换回调 */
    onChange?: (key: string) => void;
    /** 标签样式: underline, pill */
    variant?: 'underline' | 'pill';
    /** 尺寸 */
    size?: 'normal' | 'sm';
}
export declare function Tabs({ items, activeKey, onChange, variant, size, }: TabsProps): import("react/jsx-runtime").JSX.Element;
export default Tabs;
//# sourceMappingURL=Tabs.d.ts.map