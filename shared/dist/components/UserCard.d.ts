import { MedalLevel } from './Medal';
import { TitleType } from './Title';
export interface UserCardProps {
    /** 用户ID */
    userId?: string | number;
    /** 用户名 */
    username: string;
    /** 用户头像 URL */
    avatarUrl?: string;
    /** 称号 */
    title?: {
        type: TitleType;
        text?: string;
    };
    /** 勋章列表 */
    medals?: Array<{
        level: MedalLevel;
        icon?: string;
    }>;
    /** 统计数据 */
    stats?: {
        posts?: number;
        replies?: number;
        likes?: number;
    };
    /** 尺寸: standard(140px), mini(100px) */
    size?: 'standard' | 'mini';
    /** 是否显示统计数据 */
    showStats?: boolean;
    /** 点击回调 */
    onClick?: () => void;
}
export declare function UserCard({ username, avatarUrl, title, medals, stats, size, showStats, onClick, }: UserCardProps): import("react/jsx-runtime").JSX.Element;
export default UserCard;
//# sourceMappingURL=UserCard.d.ts.map