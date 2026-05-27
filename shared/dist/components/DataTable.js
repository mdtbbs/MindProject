"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataTable = DataTable;
const jsx_runtime_1 = require("react/jsx-runtime");
function DataTable({ columns, data, rowKey, bordered = true, hoverable = true, compact = false, emptyText = '暂无数据', onRowClick, rowStyle, }) {
    const padding = compact ? 8 : 12;
    const fontSize = compact ? 12 : 13;
    const gridTemplateColumns = columns
        .map(col => col.width || '1fr')
        .join(' ');
    return ((0, jsx_runtime_1.jsxs)("div", { className: "data-table", style: {
            width: '100%',
            background: 'var(--bg-card)',
            border: bordered ? '1px solid var(--border)' : 'none',
            borderRadius: 8,
            overflow: 'hidden',
        }, children: [(0, jsx_runtime_1.jsx)("div", { className: "data-table-header", style: {
                    display: 'grid',
                    gridTemplateColumns,
                    padding,
                    background: 'var(--bg-elevated)',
                    fontSize: 12,
                    color: 'var(--text-muted)',
                    borderBottom: '1px solid var(--border)',
                }, children: columns.map((col) => ((0, jsx_runtime_1.jsx)("span", { children: col.header }, col.key))) }), data.length === 0 ? ((0, jsx_runtime_1.jsx)("div", { style: {
                    padding: 32,
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize,
                }, children: emptyText })) : (data.map((row, index) => {
                const key = rowKey ? String(row[rowKey]) : index;
                return ((0, jsx_runtime_1.jsx)("div", { className: "data-table-row", style: {
                        display: 'grid',
                        gridTemplateColumns,
                        padding,
                        fontSize,
                        color: 'var(--text)',
                        borderBottom: index < data.length - 1 ? '1px solid var(--border-light)' : 'none',
                        alignItems: 'center',
                        background: hoverable ? 'transparent' : 'var(--bg-card)',
                        cursor: onRowClick ? 'pointer' : 'default',
                        transition: 'background 0.15s ease',
                        ...rowStyle?.(row, index),
                    }, onClick: () => onRowClick?.(row, index), children: columns.map((col) => {
                        const value = row[col.key];
                        return ((0, jsx_runtime_1.jsx)("span", { children: col.render ? col.render(value, row, index) : value }, col.key));
                    }) }, key));
            })), (0, jsx_runtime_1.jsx)("style", { children: `
        .data-table-row:hover {
          background: var(--bg-hover);
        }
      ` })] }));
}
exports.default = DataTable;
