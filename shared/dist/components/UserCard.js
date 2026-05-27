"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserCard = UserCard;
const jsx_runtime_1 = require("react/jsx-runtime");
const Medal_1 = require("./Medal");
const Title_1 = require("./Title");
function UserCard({ username, avatarUrl, title, medals, stats, size = 'standard', showStats = true, onClick, }) {
    const isMini = size === 'mini';
    const width = isMini ? 100 : 140;
    const avatarSize = isMini ? 36 : 48;
    const medalSize = isMini ? 'xs' : 'mini';
    return ((0, jsx_runtime_1.jsxs)("div", { className: `user-card ${isMini ? 'user-card-mini' : ''}`, style: {
            width,
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: isMini ? 8 : 16,
            textAlign: 'center',
            cursor: onClick ? 'pointer' : 'default',
        }, onClick: onClick, children: [(0, jsx_runtime_1.jsx)("div", { style: {
                    width: avatarSize,
                    height: avatarSize,
                    borderRadius: 6,
                    margin: '0 auto',
                    marginBottom: isMini ? 4 : 8,
                    background: avatarUrl ? 'transparent' : 'var(--bg-elevated)',
                    overflow: 'hidden',
                }, children: avatarUrl ? ((0, jsx_runtime_1.jsx)("img", { src: avatarUrl, alt: username, style: { width: '100%', height: '100%', objectFit: 'cover' } })) : null }), (0, jsx_runtime_1.jsx)("div", { style: {
                    fontSize: isMini ? 12 : 13,
                    fontWeight: 500,
                    color: 'var(--text)',
                    marginBottom: 2,
                }, children: username }), title && ((0, jsx_runtime_1.jsx)("div", { style: { marginBottom: isMini ? 4 : 6 }, children: (0, jsx_runtime_1.jsx)(Title_1.Title, { type: title.type, text: title.text, size: "sm", bordered: false }) })), medals && medals.length > 0 && ((0, jsx_runtime_1.jsx)("div", { style: {
                    display: 'flex',
                    gap: 4,
                    justifyContent: 'center',
                    marginBottom: isMini ? 0 : 12,
                }, children: medals.slice(0, isMini ? 2 : 5).map((medal, index) => ((0, jsx_runtime_1.jsx)(Medal_1.Medal, { level: medal.level, icon: medal.icon, size: medalSize }, index))) })), showStats && stats && !isMini && ((0, jsx_runtime_1.jsxs)("div", { style: {
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    lineHeight: 1.6,
                }, children: [stats.posts !== undefined && (0, jsx_runtime_1.jsxs)("div", { children: ["\u5E16\u5B50: ", (0, jsx_runtime_1.jsx)("strong", { style: { color: 'var(--text)' }, children: stats.posts })] }), stats.replies !== undefined && (0, jsx_runtime_1.jsxs)("div", { children: ["\u56DE\u590D: ", (0, jsx_runtime_1.jsx)("strong", { style: { color: 'var(--text)' }, children: stats.replies })] }), stats.likes !== undefined && (0, jsx_runtime_1.jsxs)("div", { children: ["\u8D5E: ", (0, jsx_runtime_1.jsx)("strong", { style: { color: 'var(--text)' }, children: stats.likes })] })] }))] }));
}
exports.default = UserCard;
