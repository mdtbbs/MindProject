"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatsGrid = StatsGrid;
const jsx_runtime_1 = require("react/jsx-runtime");
function StatsGrid({ items, columns = 4, size = 'normal' }) {
    const padding = size === 'normal' ? 20 : 12;
    const valueFontSize = size === 'normal' ? 24 : 18;
    const labelFontSize = size === 'normal' ? 13 : 11;
    return ((0, jsx_runtime_1.jsx)("div", { className: `stats-grid stats-grid-${columns}`, style: {
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap: 12,
        }, children: items.map((item, index) => ((0, jsx_runtime_1.jsxs)("div", { className: "stats-item", style: {
                textAlign: 'center',
                padding,
                background: 'var(--bg-elevated)',
                borderRadius: 6,
            }, children: [item.icon && ((0, jsx_runtime_1.jsx)("div", { style: { marginBottom: 4 }, children: item.icon })), (0, jsx_runtime_1.jsx)("div", { className: "stats-value", style: {
                        fontSize: valueFontSize,
                        fontWeight: 500,
                        color: item.color || 'var(--text)',
                    }, children: item.value }), (0, jsx_runtime_1.jsx)("div", { className: "stats-label", style: {
                        fontSize: labelFontSize,
                        color: 'var(--text-muted)',
                    }, children: item.label })] }, index))) }));
}
exports.default = StatsGrid;
