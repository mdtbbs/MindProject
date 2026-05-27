export type TitleType = 'active' | 'core' | 'mod' | 'admin' | 'contributor' | 'custom';
export interface TitleProps {
    /** 称号类型 */
    type: TitleType;
    /** 显示文字 */
    text?: string;
    /** 图标 (emoji 或字符) */
    icon?: string;
    /** 尺寸 */
    size?: 'normal' | 'sm';
    /** 自定义颜色 */
    customColor?: string;
    /** 自定义图标颜色 */
    customIconColor?: string;
    /** 是否显示边框 */
    bordered?: boolean;
    /** 点击回调 */
    onClick?: () => void;
}
export declare function Title({ type, text, icon, size, customColor, customIconColor, bordered, onClick, }: TitleProps): import("react/jsx-runtime").JSX.Element;
/** 用户称号列表 */
export interface TitleListProps {
    titles: Array<{
        type: TitleType;
        text?: string;
        icon?: string;
    }>;
    size?: 'normal' | 'sm';
    maxShow?: number;
}
export declare function TitleList({ titles, size, maxShow }: TitleListProps): import("react/jsx-runtime").JSX.Element;
export default Title;
//# sourceMappingURL=Title.d.ts.map