"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Medal = Medal;
exports.MedalGroup = MedalGroup;
const jsx_runtime_1 = require("react/jsx-runtime");
const sizeMap = {
    normal: { width: 36, height: 36, fontSize: 16 },
    mini: { width: 20, height: 20, fontSize: 10 },
    xs: { width: 14, height: 14, fontSize: 8 },
};
const levelStyles = {
    1: {
        bg: 'var(--badge-lv1)',
        color: '#666',
    },
    2: {
        bg: 'linear-gradient(135deg, var(--badge-lv2-start), var(--badge-lv2-end))',
        color: '#fff',
    },
    3: {
        bg: 'linear-gradient(135deg, var(--badge-lv3-start), var(--badge-lv3-end))',
        color: '#fff',
    },
    4: {
        bg: 'linear-gradient(135deg, var(--badge-lv4-start), var(--badge-lv4-end))',
        color: '#fff',
        shadow: '0 2px 8px rgba(255,107,53,0.3)',
    },
};
function Medal({ level, icon = '🏆', name, description, earnedAt, progress, size = 'normal', showTooltip = false, customColor, onClick, }) {
    const { width, height, fontSize } = sizeMap[size];
    const style = levelStyles[level];
    return ((0, jsx_runtime_1.jsxs)("div", { className: "medal-container", style: { position: 'relative', display: 'inline-block' }, onClick: onClick, children: [(0, jsx_runtime_1.jsx)("div", { className: `medal medal-lv${level}`, style: {
                    width,
                    height,
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize,
                    background: customColor || style.bg,
                    color: style.color,
                    boxShadow: style.shadow,
                    cursor: onClick ? 'pointer' : 'default',
                }, children: icon }), showTooltip && name && ((0, jsx_runtime_1.jsxs)("div", { className: "medal-tooltip", style: {
                    position: 'absolute',
                    bottom: size === 'normal' ? -80 : -70,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: 12,
                    minWidth: 180,
                    boxShadow: 'var(--shadow-card)',
                    zIndex: 100,
                    opacity: 0,
                    pointerEvents: 'none',
                    transition: 'opacity 0.2s ease',
                }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }, children: [(0, jsx_runtime_1.jsx)("div", { style: {
                                    width: 24,
                                    height: 24,
                                    borderRadius: 4,
                                    background: style.bg,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 12,
                                    color: style.color,
                                }, children: icon }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("div", { style: { fontSize: 13, fontWeight: 500, color: 'var(--text)' }, children: name }), (0, jsx_runtime_1.jsxs)("div", { style: { fontSize: 11, color: 'var(--text-muted)' }, children: ["Lv.", level] })] })] }), description && ((0, jsx_runtime_1.jsx)("div", { style: { fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }, children: description })), (0, jsx_runtime_1.jsxs)("div", { style: { fontSize: 11, color: 'var(--text-muted)' }, children: [earnedAt && (0, jsx_runtime_1.jsxs)("div", { children: ["\u83B7\u5F97\u65F6\u95F4: ", earnedAt] }), progress && (0, jsx_runtime_1.jsxs)("div", { children: ["\u8FDB\u5EA6: ", progress] })] })] })), (0, jsx_runtime_1.jsx)("style", { children: `
        .medal-container:hover .medal-tooltip {
          opacity: 1;
          pointerEvents: auto;
        }
      ` })] }));
}
function MedalGroup({ medals, size = 'mini', maxShow = 5 }) {
    const visibleMedals = medals.slice(0, maxShow);
    const remaining = medals.length - maxShow;
    return ((0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', gap: 4, alignItems: 'center' }, children: [visibleMedals.map((medal, index) => ((0, jsx_runtime_1.jsx)(Medal, { level: medal.level, icon: medal.icon, size: size }, index))), remaining > 0 && ((0, jsx_runtime_1.jsxs)("div", { style: {
                    width: size === 'normal' ? 36 : size === 'mini' ? 20 : 14,
                    height: size === 'normal' ? 36 : size === 'mini' ? 20 : 14,
                    borderRadius: 6,
                    background: 'var(--bg-elevated)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: size === 'normal' ? 12 : size === 'mini' ? 8 : 6,
                    color: 'var(--text-muted)',
                }, children: ["+", remaining] }))] }));
}
exports.default = Medal;
