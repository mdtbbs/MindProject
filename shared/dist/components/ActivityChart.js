"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityChart = ActivityChart;
exports.generateDefaultActivityData = generateDefaultActivityData;
const jsx_runtime_1 = require("react/jsx-runtime");
function ActivityChart({ data, peak, peakTime, average, current, maxHeight = 100, showTimeLabels = true, }) {
    const maxValue = Math.max(...data.map(d => d.value));
    const barWidth = 16;
    const hoursToShow = showTimeLabels ? [0, 6, 12, 18, 23] : [];
    return ((0, jsx_runtime_1.jsxs)("div", { style: { width: '100%' }, children: [(0, jsx_runtime_1.jsx)("div", { className: "activity-chart", style: {
                    display: 'flex',
                    gap: 4,
                    alignItems: 'flex-end',
                    height: maxHeight,
                    borderBottom: '1px solid var(--border)',
                    paddingBottom: 8,
                }, children: data.map((item, index) => {
                    const heightPercent = maxValue > 0 ? (item.value / maxValue) * maxHeight : 0;
                    return ((0, jsx_runtime_1.jsx)("div", { className: `activity-bar ${item.highlight ? 'highlight' : ''}`, style: {
                            width: barWidth,
                            height: Math.max(4, heightPercent),
                            borderRadius: '4px 4px 0 0',
                            background: item.highlight ? 'var(--primary)' : 'var(--bg-elevated)',
                            transition: 'height 0.3s ease',
                        } }, index));
                }) }), showTimeLabels && ((0, jsx_runtime_1.jsx)("div", { style: {
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    marginTop: 8,
                }, children: hoursToShow.map((hour) => ((0, jsx_runtime_1.jsx)("span", { children: hour === 23 ? '现在' : `${hour}:00` }, hour))) })), (peak || average || current) && ((0, jsx_runtime_1.jsxs)("div", { style: {
                    display: 'flex',
                    gap: 24,
                    fontSize: 13,
                    color: 'var(--text-muted)',
                    marginTop: 16,
                }, children: [peak && ((0, jsx_runtime_1.jsxs)("div", { children: ["\u5CF0\u503C: ", (0, jsx_runtime_1.jsxs)("strong", { style: { color: 'var(--text)' }, children: [peak, " \u73A9\u5BB6"] }), peakTime && (0, jsx_runtime_1.jsxs)("span", { children: [" (", peakTime, ")"] })] })), average && ((0, jsx_runtime_1.jsxs)("div", { children: ["\u5E73\u5747: ", (0, jsx_runtime_1.jsxs)("strong", { style: { color: 'var(--text)' }, children: [average, " \u73A9\u5BB6"] })] })), current && ((0, jsx_runtime_1.jsxs)("div", { children: ["\u5F53\u524D: ", (0, jsx_runtime_1.jsxs)("strong", { style: { color: 'var(--text)' }, children: [current, " \u73A9\u5BB6"] })] }))] }))] }));
}
/** 生成默认的24小时数据 (用于演示) */
function generateDefaultActivityData(currentValue = 24) {
    const basePattern = [
        15, 25, 20, 12, 18, 35, 30, 22, 40, 55, 45, 50,
        60, 70, 65, 80, 85, 90, 75, 50, 30, 20, 15, currentValue
    ];
    return basePattern.map((value, hour) => ({
        hour,
        value,
        highlight: hour >= 10 && hour <= 18, // 高峰时段
    }));
}
exports.default = ActivityChart;
