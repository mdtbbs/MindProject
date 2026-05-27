"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerCard = ServerCard;
const jsx_runtime_1 = require("react/jsx-runtime");
const statusColors = {
    online: { bg: '#4caf50', text: '在线' },
    offline: { bg: '#888', text: '离线' },
    pending: { bg: '#ffc107', text: '等待中' },
};
const pingColors = (ping) => {
    if (ping < 50)
        return '#4caf50';
    if (ping < 100)
        return '#ffc107';
    return '#f44336';
};
function ServerCard({ name, icon, description, tags, status, stats, owner, currentMap, isFavorite, featured, editable, onJoin, onFavorite, onEdit, }) {
    const statusConfig = statusColors[status.type];
    const displayStatus = status.text || statusConfig.text;
    return ((0, jsx_runtime_1.jsxs)("div", { className: "server-card-full", style: {
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: 20,
            marginBottom: 12,
        }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "server-card-full-header", style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    marginBottom: 12,
                }, children: [(0, jsx_runtime_1.jsx)("div", { className: `server-card-full-icon ${featured ? 'featured' : ''}`, style: {
                            width: 48,
                            height: 48,
                            borderRadius: 8,
                            background: featured
                                ? 'linear-gradient(135deg, #ff6b35, #ff8c5a)'
                                : 'var(--bg-elevated)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 20,
                            color: featured ? '#fff' : 'var(--text)',
                        }, children: icon || '🎮' }), (0, jsx_runtime_1.jsxs)("div", { style: { flex: 1 }, children: [(0, jsx_runtime_1.jsxs)("div", { style: {
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                }, children: [(0, jsx_runtime_1.jsx)("span", { style: {
                                            fontSize: 16,
                                            fontWeight: 500,
                                            color: 'var(--text)',
                                        }, children: name }), editable && ((0, jsx_runtime_1.jsx)("span", { style: {
                                            fontSize: 11,
                                            color: '#2196f3',
                                            cursor: 'pointer',
                                        }, onClick: onEdit, children: "\u270F\uFE0F \u7F16\u8F91" }))] }), tags && tags.length > 0 && ((0, jsx_runtime_1.jsx)("div", { className: "server-card-full-tags", style: {
                                    display: 'flex',
                                    gap: 6,
                                    marginTop: 4,
                                }, children: tags.map((tag, index) => ((0, jsx_runtime_1.jsx)("span", { style: {
                                        background: 'var(--bg-elevated)',
                                        padding: '4px 10px',
                                        borderRadius: 4,
                                        fontSize: 11,
                                        color: 'var(--text-secondary)',
                                    }, children: tag }, index))) }))] }), (0, jsx_runtime_1.jsxs)("div", { style: {
                            background: statusConfig.bg,
                            color: '#fff',
                            fontSize: 12,
                            padding: '6px 12px',
                            borderRadius: 6,
                        }, children: [status.type === 'online' ? '🟢' : status.type === 'offline' ? '⚪' : '⏳', " ", displayStatus] })] }), description && ((0, jsx_runtime_1.jsx)("div", { style: {
                    fontSize: 13,
                    color: 'var(--text-secondary)',
                    marginBottom: 16,
                    lineHeight: 1.5,
                }, children: description })), stats && ((0, jsx_runtime_1.jsxs)("div", { style: {
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, 1fr)',
                    gap: 12,
                    marginBottom: 16,
                }, children: [stats.players !== undefined && ((0, jsx_runtime_1.jsxs)("div", { style: { textAlign: 'center', padding: 12, background: 'var(--bg-elevated)', borderRadius: 6 }, children: [(0, jsx_runtime_1.jsx)("div", { style: { fontSize: 18, fontWeight: 500, color: 'var(--text)' }, children: stats.players }), (0, jsx_runtime_1.jsx)("div", { style: { fontSize: 11, color: 'var(--text-muted)' }, children: "\u73A9\u5BB6" })] })), stats.maxPlayers !== undefined && ((0, jsx_runtime_1.jsxs)("div", { style: { textAlign: 'center', padding: 12, background: 'var(--bg-elevated)', borderRadius: 6 }, children: [(0, jsx_runtime_1.jsx)("div", { style: { fontSize: 18, fontWeight: 500, color: 'var(--text)' }, children: stats.maxPlayers }), (0, jsx_runtime_1.jsx)("div", { style: { fontSize: 11, color: 'var(--text-muted)' }, children: "\u5BB9\u91CF" })] })), stats.ping !== undefined && ((0, jsx_runtime_1.jsxs)("div", { style: { textAlign: 'center', padding: 12, background: 'var(--bg-elevated)', borderRadius: 6 }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { fontSize: 14, fontWeight: 500, color: pingColors(stats.ping) }, children: ["\uD83D\uDFE2 ", stats.ping, "ms"] }), (0, jsx_runtime_1.jsx)("div", { style: { fontSize: 11, color: 'var(--text-muted)' }, children: "\u5EF6\u8FDF" })] })), stats.mode && ((0, jsx_runtime_1.jsxs)("div", { style: { textAlign: 'center', padding: 12, background: 'var(--bg-elevated)', borderRadius: 6 }, children: [(0, jsx_runtime_1.jsx)("div", { style: { fontSize: 16, fontWeight: 500, color: 'var(--text)' }, children: stats.mode }), (0, jsx_runtime_1.jsx)("div", { style: { fontSize: 11, color: 'var(--text-muted)' }, children: "\u6A21\u5F0F" })] })), stats.region && ((0, jsx_runtime_1.jsxs)("div", { style: { textAlign: 'center', padding: 12, background: 'var(--bg-elevated)', borderRadius: 6 }, children: [(0, jsx_runtime_1.jsx)("div", { style: { fontSize: 16, fontWeight: 500, color: 'var(--text)' }, children: stats.region }), (0, jsx_runtime_1.jsx)("div", { style: { fontSize: 11, color: 'var(--text-muted)' }, children: "\u5730\u533A" })] }))] })), (0, jsx_runtime_1.jsxs)("div", { style: {
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: '1px solid var(--border-light)',
                    paddingTop: 12,
                }, children: [(0, jsx_runtime_1.jsx)("div", { style: { fontSize: 12, color: 'var(--text-muted)' }, children: owner && ((0, jsx_runtime_1.jsxs)("span", { children: ["Owner: ", (0, jsx_runtime_1.jsxs)("span", { style: { color: '#ff6b35' }, children: ["@", owner.username] }), currentMap && (0, jsx_runtime_1.jsxs)("span", { children: [" \u00B7 \u5730\u56FE: ", (0, jsx_runtime_1.jsx)("strong", { style: { color: 'var(--text)' }, children: currentMap })] })] })) }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', gap: 8 }, children: [(0, jsx_runtime_1.jsx)("button", { onClick: onFavorite, style: {
                                    background: isFavorite ? '#ffebee' : 'var(--bg-elevated)',
                                    color: isFavorite ? '#f44336' : 'var(--text-secondary)',
                                    padding: '8px 12px',
                                    borderRadius: 6,
                                    fontSize: 12,
                                    border: 'none',
                                    cursor: 'pointer',
                                }, children: isFavorite ? '🔖 已收藏' : '🔖 收藏' }), status.type === 'online' && onJoin && ((0, jsx_runtime_1.jsx)("button", { onClick: onJoin, style: {
                                    background: '#333',
                                    color: '#fff',
                                    padding: '8px 16px',
                                    borderRadius: 6,
                                    fontSize: 12,
                                    border: 'none',
                                    cursor: 'pointer',
                                }, children: "\u52A0\u5165\u670D\u52A1\u5668" }))] })] })] }));
}
exports.default = ServerCard;
