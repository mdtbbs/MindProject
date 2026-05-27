export type MedalLevel = 1 | 2 | 3 | 4;
export interface MedalProps {
    /** 勋章等级 1-4 */
    level: MedalLevel;
    /** 勋章图标 (emoji 或字符) */
    icon?: string;
    /** 勋章名称 */
    name?: string;
    /** 勋章描述 */
    description?: string;
    /** 获得时间 */
    earnedAt?: string;
    /** 进度信息 (如 "128/500") */
    progress?: string;
    /** 尺寸: normal(36px), mini(20px), xs(14px) */
    size?: 'normal' | 'mini' | 'xs';
    /** 是否显示详情弹窗 */
    showTooltip?: boolean;
    /** 自定义背景色 */
    customColor?: string;
    /** 点击回调 */
    onClick?: () => void;
}
export declare function Medal({ level, icon, name, description, earnedAt, progress, size, showTooltip, customColor, onClick, }: MedalProps): import("react/jsx-runtime").JSX.Element;
/** 勋章组 - 多个勋章横向排列 */
export interface MedalGroupProps {
    medals: Array<{
        level: MedalLevel;
        icon?: string;
    }>;
    size?: 'normal' | 'mini' | 'xs';
    maxShow?: number;
}
export declare function MedalGroup({ medals, size, maxShow }: MedalGroupProps): import("react/jsx-runtime").JSX.Element;
export default Medal;
//# sourceMappingURL=Medal.d.ts.map