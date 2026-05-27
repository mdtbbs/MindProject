"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Title = Title;
exports.TitleList = TitleList;
const jsx_runtime_1 = require("react/jsx-runtime");
const titleConfig = {
    active: {
        color: 'var(--title-active)',
        iconBg: 'var(--title-active)',
        defaultIcon: '✓',
        defaultText: '活跃用户',
    },
    core: {
        color: 'var(--title-core)',
        iconBg: 'var(--title-core)',
        defaultIcon: '⭐',
        defaultText: '核心成员',
    },
    mod: {
        color: 'var(--title-mod)',
        iconBg: 'var(--title-mod)',
        defaultIcon: '⭐',
        defaultText: '版主',
    },
    admin: {
        color: '#b8860b',
        iconBg: 'linear-gradient(135deg, #ffd700, #ffb347)',
        defaultIcon: '👑',
        defaultText: '管理员',
    },
    contributor: {
        color: 'var(--title-contributor)',
        iconBg: 'var(--title-contributor)',
        defaultIcon: '🚀',
        defaultText: '贡献者',
    },
    custom: {
        color: 'var(--text-secondary)',
        iconBg: 'var(--bg-elevated)',
        defaultIcon: '',
        defaultText: '',
    },
};
function Title({ type, text, icon, size = 'normal', customColor, customIconColor, bordered = true, onClick, }) {
    const config = titleConfig[type];
    const displayText = text || config.defaultText;
    const displayIcon = icon || config.defaultIcon;
    const fontSize = size === 'normal' ? 13 : 11;
    const iconSize = size === 'normal' ? 20 : 16;
    const padding = size === 'normal' ? '4px 8px' : '2px 6px';
    return ((0, jsx_runtime_1.jsxs)("div", { className: `title-badge title-${type}`, style: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding,
            fontSize,
            borderRadius: 4,
            background: type === 'custom' ? 'transparent' : `rgba(${type === 'admin' ? '255,193,7' : type === 'mod' ? '255,107,53' : type === 'active' ? '76,175,80' : type === 'core' ? '33,150,243' : '156,39,176'},0.1)`,
            border: bordered ? `1px solid ${customColor || config.color}` : 'none',
            color: customColor || config.color,
            cursor: onClick ? 'pointer' : 'default',
        }, onClick: onClick, children: [displayIcon && ((0, jsx_runtime_1.jsx)("span", { className: "title-icon", style: {
                    width: iconSize,
                    height: iconSize,
                    borderRadius: 4,
                    background: customIconColor || config.iconBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: size === 'normal' ? 10 : 8,
                    color: '#fff',
                }, children: displayIcon })), (0, jsx_runtime_1.jsx)("span", { children: displayText })] }));
}
function TitleList({ titles, size = 'sm', maxShow = 2 }) {
    const visibleTitles = titles.slice(0, maxShow);
    return ((0, jsx_runtime_1.jsx)("div", { style: { display: 'flex', gap: 6, alignItems: 'center' }, children: visibleTitles.map((title, index) => ((0, jsx_runtime_1.jsx)(Title, { type: title.type, text: title.text, icon: title.icon, size: size }, index))) }));
}
exports.default = Title;
