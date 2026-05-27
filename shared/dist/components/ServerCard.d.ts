export interface ServerStatus {
    type: 'online' | 'offline' | 'pending';
    text?: string;
}
export interface ServerCardProps {
    /** 服务器ID */
    serverId?: string | number;
    /** 服务器名称 */
    name: string;
    /** 服务器图标 URL 或 emoji */
    icon?: string;
    /** 服务器描述 */
    description?: string;
    /** 标签列表 */
    tags?: string[];
    /** 服务器状态 */
    status: ServerStatus;
    /** 统计数据 */
    stats?: {
        players?: number;
        maxPlayers?: number;
        ping?: number;
        mode?: string;
        region?: string;
        uptime?: number;
    };
    /** Owner 信息 */
    owner?: {
        username: string;
        avatarUrl?: string;
    };
    /** 当前地图 */
    currentMap?: string;
    /** 是否收藏 */
    isFavorite?: boolean;
    /** 是否推荐 */
    featured?: boolean;
    /** 是否可编辑 (管理员视角) */
    editable?: boolean;
    /** 加入按钮点击回调 */
    onJoin?: () => void;
    /** 收藏按钮点击回调 */
    onFavorite?: () => void;
    /** 编辑按钮点击回调 */
    onEdit?: () => void;
}
export declare function ServerCard({ name, icon, description, tags, status, stats, owner, currentMap, isFavorite, featured, editable, onJoin, onFavorite, onEdit, }: ServerCardProps): import("react/jsx-runtime").JSX.Element;
export default ServerCard;
//# sourceMappingURL=ServerCard.d.ts.map