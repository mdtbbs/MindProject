import React from 'react';
export interface TableColumn<T = Record<string, unknown>> {
    key: string;
    header: string;
    width?: string | number;
    render?: (value: unknown, row: T, index: number) => React.ReactNode;
}
export interface DataTableProps<T = Record<string, unknown>> {
    /** 列定义 */
    columns: TableColumn<T>[];
    /** 数据行 */
    data: T[];
    /** 行唯一标识字段 */
    rowKey?: string;
    /** 是否显示边框 */
    bordered?: boolean;
    /** 是否显示行悬停效果 */
    hoverable?: boolean;
    /** 是否紧凑模式 */
    compact?: boolean;
    /** 空数据提示 */
    emptyText?: string;
    /** 行点击回调 */
    onRowClick?: (row: T, index: number) => void;
    /** 自定义行样式 */
    rowStyle?: (row: T, index: number) => React.CSSProperties;
}
export declare function DataTable<T extends Record<string, unknown>>({ columns, data, rowKey, bordered, hoverable, compact, emptyText, onRowClick, rowStyle, }: DataTableProps<T>): import("react/jsx-runtime").JSX.Element;
export default DataTable;
//# sourceMappingURL=DataTable.d.ts.map