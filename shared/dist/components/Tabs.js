"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tabs = Tabs;
const jsx_runtime_1 = require("react/jsx-runtime");
function Tabs({ items, activeKey, onChange, variant = 'underline', size = 'normal', }) {
    const fontSize = size === 'normal' ? 14 : 12;
    const padding = size === 'normal' ? '8px 16px' : '6px 12px';
    const handleClick = (item) => {
        if (!item.disabled && onChange) {
            onChange(item.key);
        }
    };
    const containerStyle = variant === 'underline'
        ? {
            display: 'flex',
            gap: 8,
            borderBottom: '1px solid var(--border)',
            paddingBottom: 8,
        }
        : {
            display: 'flex',
            gap: 8,
            background: 'var(--bg-elevated)',
            padding: 4,
            borderRadius: 8,
        };
    return ((0, jsx_runtime_1.jsx)("div", { className: "tabs", style: containerStyle, children: items.map((item) => {
            const isActive = item.key === activeKey;
            const tabStyle = variant === 'underline'
                ? {
                    padding,
                    fontSize,
                    color: isActive ? 'var(--text)' : 'var(--text-muted)',
                    background: isActive ? 'var(--bg-elevated)' : 'transparent',
                    borderRadius: '6px 6px 0 0',
                    cursor: item.disabled ? 'not-allowed' : 'pointer',
                    opacity: item.disabled ? 0.5 : 1,
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                }
                : {
                    padding,
                    fontSize,
                    color: isActive ? 'var(--text)' : 'var(--text-muted)',
                    background: isActive ? 'var(--bg-card)' : 'transparent',
                    borderRadius: 6,
                    cursor: item.disabled ? 'not-allowed' : 'pointer',
                    opacity: item.disabled ? 0.5 : 1,
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                };
            return ((0, jsx_runtime_1.jsxs)("div", { className: `tab ${isActive ? 'active' : ''}`, style: tabStyle, onClick: () => handleClick(item), children: [item.icon, (0, jsx_runtime_1.jsx)("span", { children: item.label })] }, item.key));
        }) }));
}
exports.default = Tabs;
