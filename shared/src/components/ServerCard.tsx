import React from 'react';

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

const statusColors = {
  online: { bg: '#4caf50', text: '在线' },
  offline: { bg: '#888', text: '离线' },
  pending: { bg: '#ffc107', text: '等待中' },
};

const pingColors = (ping: number) => {
  if (ping < 50) return '#4caf50';
  if (ping < 100) return '#ffc107';
  return '#f44336';
};

export function ServerCard({
  name,
  icon,
  description,
  tags,
  status,
  stats,
  owner,
  currentMap,
  isFavorite,
  featured,
  editable,
  onJoin,
  onFavorite,
  onEdit,
}: ServerCardProps) {
  const statusConfig = statusColors[status.type];
  const displayStatus = status.text || statusConfig.text;

  return (
    <div
      className="server-card-full"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: 20,
        marginBottom: 12,
      }}
    >
      {/* Header */}
      <div
        className="server-card-full-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 12,
        }}
      >
        {/* Icon */}
        <div
          className={`server-card-full-icon ${featured ? 'featured' : ''}`}
          style={{
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
          }}
        >
          {icon || '🎮'}
        </div>

        {/* Info */}
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span
              style={{
                fontSize: 16,
                fontWeight: 500,
                color: 'var(--text)',
              }}
            >
              {name}
            </span>
            {editable && (
              <span
                style={{
                  fontSize: 11,
                  color: '#2196f3',
                  cursor: 'pointer',
                }}
                onClick={onEdit}
              >
                ✏️ 编辑
              </span>
            )}
          </div>
          {tags && tags.length > 0 && (
            <div
              className="server-card-full-tags"
              style={{
                display: 'flex',
                gap: 6,
                marginTop: 4,
              }}
            >
              {tags.map((tag, index) => (
                <span
                  key={index}
                  style={{
                    background: 'var(--bg-elevated)',
                    padding: '4px 10px',
                    borderRadius: 4,
                    fontSize: 11,
                    color: 'var(--text-secondary)',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Status */}
        <div
          style={{
            background: statusConfig.bg,
            color: '#fff',
            fontSize: 12,
            padding: '6px 12px',
            borderRadius: 6,
          }}
        >
          {status.type === 'online' ? '🟢' : status.type === 'offline' ? '⚪' : '⏳'} {displayStatus}
        </div>
      </div>

      {/* Description */}
      {description && (
        <div
          style={{
            fontSize: 13,
            color: 'var(--text-secondary)',
            marginBottom: 16,
            lineHeight: 1.5,
          }}
        >
          {description}
        </div>
      )}

      {/* Stats Grid */}
      {stats && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 12,
            marginBottom: 16,
          }}
        >
          {stats.players !== undefined && (
            <div style={{ textAlign: 'center', padding: 12, background: 'var(--bg-elevated)', borderRadius: 6 }}>
              <div style={{ fontSize: 18, fontWeight: 500, color: 'var(--text)' }}>{stats.players}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>玩家</div>
            </div>
          )}
          {stats.maxPlayers !== undefined && (
            <div style={{ textAlign: 'center', padding: 12, background: 'var(--bg-elevated)', borderRadius: 6 }}>
              <div style={{ fontSize: 18, fontWeight: 500, color: 'var(--text)' }}>{stats.maxPlayers}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>容量</div>
            </div>
          )}
          {stats.ping !== undefined && (
            <div style={{ textAlign: 'center', padding: 12, background: 'var(--bg-elevated)', borderRadius: 6 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: pingColors(stats.ping) }}>🟢 {stats.ping}ms</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>延迟</div>
            </div>
          )}
          {stats.mode && (
            <div style={{ textAlign: 'center', padding: 12, background: 'var(--bg-elevated)', borderRadius: 6 }}>
              <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text)' }}>{stats.mode}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>模式</div>
            </div>
          )}
          {stats.region && (
            <div style={{ textAlign: 'center', padding: 12, background: 'var(--bg-elevated)', borderRadius: 6 }}>
              <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text)' }}>{stats.region}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>地区</div>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid var(--border-light)',
          paddingTop: 12,
        }}
      >
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {owner && (
            <span>
              Owner: <span style={{ color: '#ff6b35' }}>@{owner.username}</span>
              {currentMap && <span> · 地图: <strong style={{ color: 'var(--text)' }}>{currentMap}</strong></span>}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onFavorite}
            style={{
              background: isFavorite ? '#ffebee' : 'var(--bg-elevated)',
              color: isFavorite ? '#f44336' : 'var(--text-secondary)',
              padding: '8px 12px',
              borderRadius: 6,
              fontSize: 12,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {isFavorite ? '🔖 已收藏' : '🔖 收藏'}
          </button>
          {status.type === 'online' && onJoin && (
            <button
              onClick={onJoin}
              style={{
                background: '#333',
                color: '#fff',
                padding: '8px 16px',
                borderRadius: 6,
                fontSize: 12,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              加入服务器
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ServerCard;