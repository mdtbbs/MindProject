import React from 'react';
export interface StatItem {
    value: string | number;
    label: string;
    color?: string;
    icon?: React.ReactNode;
}
export interface StatsGridProps {
    /** 统计项列表 */
    items: StatItem[];
    /** 列数: 2, 3, 4, 5 */
    columns?: 2 | 3 | 4 | 5;
    /** 尺寸: normal, compact */
    size?: 'normal' | 'compact';
}
export declare function StatsGrid({ items, columns, size }: StatsGridProps): import("react/jsx-runtime").JSX.Element;
export default StatsGrid;
//# sourceMappingURL=StatsGrid.d.ts.map