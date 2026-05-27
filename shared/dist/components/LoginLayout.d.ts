import React from 'react';
export interface LoginLayoutProps {
    /** 服务名称 */
    serviceName: string;
    /** 品牌描述 */
    brandDescription?: string;
    /** 表单标题 */
    formTitle: string;
    /** Logo URL */
    logoUrl?: string;
    /** 品牌图标 */
    brandIcon?: React.ReactNode;
    /** 表单内容 */
    children: React.ReactNode;
    /** 底部链接 (如 "注册新账户") */
    footerLink?: {
        text: string;
        label: string;
        onClick?: () => void;
        href?: string;
    };
}
export declare function LoginLayout({ serviceName, brandDescription, formTitle, logoUrl, brandIcon, children, footerLink, }: LoginLayoutProps): import("react/jsx-runtime").JSX.Element;
export default LoginLayout;
//# sourceMappingURL=LoginLayout.d.ts.map