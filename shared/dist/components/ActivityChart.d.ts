export interface ActivityData {
    hour: number;
    value: number;
    highlight?: boolean;
}
export interface ActivityChartProps {
    /** 24小时数据 */
    data: ActivityData[];
    /** 峰值 */
    peak?: number;
    /** 峰值时间 */
    peakTime?: string;
    /** 平均值 */
    average?: number;
    /** 当前值 */
    current?: number;
    /** 最大高度 (px) */
    maxHeight?: number;
    /** 是否显示时间标签 */
    showTimeLabels?: boolean;
}
export declare function ActivityChart({ data, peak, peakTime, average, current, maxHeight, showTimeLabels, }: ActivityChartProps): import("react/jsx-runtime").JSX.Element;
/** 生成默认的24小时数据 (用于演示) */
export declare function generateDefaultActivityData(currentValue?: number): ActivityData[];
export default ActivityChart;
//# sourceMappingURL=ActivityChart.d.ts.map