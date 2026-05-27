"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminSidebar = AdminSidebar;
const jsx_runtime_1 = require("react/jsx-runtime");
const link_1 = __importDefault(require("next/link"));
function AdminSidebar({ serviceName, subtitle, items, activeKey, collapsed = false, logoUrl, footerContent, onItemClick, }) {
    const width = collapsed ? 60 : 200;
    const handleItemClick = (item) => {
        if (item.onClick) {
            item.onClick();
        }
        else if (onItemClick) {
            onItemClick(item.key);
        }
    };
    return ((0, jsx_runtime_1.jsxs)("aside", { className: "admin-sidebar", style: {
            width,
            height: '100vh',
            position: 'fixed',
            left: 0,
            top: 0,
            background: 'var(--bg-card)',
            borderRight: '1px solid var(--border)',
            padding: collapsed ? 8 : 16,
            overflowY: 'auto',
            transition: 'width 0.2s ease',
        }, children: [(0, jsx_runtime_1.jsxs)("div", { style: {
                    textAlign: collapsed ? 'center' : 'left',
                    marginBottom: collapsed ? 24 : 16,
                }, children: [logoUrl ? ((0, jsx_runtime_1.jsx)("img", { src: logoUrl, alt: serviceName, style: {
                            width: collapsed ? 32 : 40,
                            height: collapsed ? 32 : 40,
                            borderRadius: 8,
                            marginBottom: collapsed ? 0 : 8,
                        } })) : ((0, jsx_runtime_1.jsx)("div", { style: {
                            fontSize: collapsed ? 16 : 14,
                            fontWeight: 600,
                            color: 'var(--text)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                        }, children: collapsed ? serviceName.charAt(0) : serviceName })), !collapsed && subtitle && ((0, jsx_runtime_1.jsx)("div", { style: {
                            fontSize: 12,
                            color: 'var(--text-muted)',
                        }, children: subtitle }))] }), (0, jsx_runtime_1.jsx)("nav", { children: items.map((item) => {
                    const isActive = item.key === activeKey;
                    const baseStyle = {
                        display: 'flex',
                        alignItems: 'center',
                        gap: collapsed ? 0 : 8,
                        padding: collapsed ? 8 : '8px 12px',
                        fontSize: collapsed ? 18 : 13,
                        borderRadius: 6,
                        marginBottom: 4,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        background: isActive ? 'var(--bg-elevated)' : 'transparent',
                        color: isActive ? 'var(--text)' : 'var(--text-secondary)',
                        textDecoration: 'none',
                    };
                    const content = ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [item.icon, !collapsed && (0, jsx_runtime_1.jsx)("span", { children: item.label })] }));
                    if (item.href) {
                        return ((0, jsx_runtime_1.jsx)(link_1.default, { href: item.href, style: baseStyle, className: isActive ? 'admin-sidebar-item active' : 'admin-sidebar-item', children: content }, item.key));
                    }
                    return ((0, jsx_runtime_1.jsx)("div", { onClick: () => handleItemClick(item), style: baseStyle, className: isActive ? 'admin-sidebar-item active' : 'admin-sidebar-item', children: content }, item.key));
                }) }), footerContent && ((0, jsx_runtime_1.jsx)("div", { style: {
                    marginTop: 16,
                    borderTop: '1px solid var(--border-light)',
                    paddingTop: 16,
                }, children: footerContent }))] }));
}
exports.default = AdminSidebar;
