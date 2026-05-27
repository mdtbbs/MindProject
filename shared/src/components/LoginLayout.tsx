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

export function LoginLayout({
  serviceName,
  brandDescription,
  formTitle,
  logoUrl,
  brandIcon,
  children,
  footerLink,
}: LoginLayoutProps) {
  return (
    <div
      className="login-split"
      style={{
        display: 'flex',
        minHeight: '100vh',
      }}
    >
      {/* Brand Section */}
      <div
        className="login-brand"
        style={{
          flex: 1,
          background: '#333',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 48,
        }}
      >
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={serviceName}
            style={{
              width: 64,
              height: 64,
              marginBottom: 16,
            }}
          />
        ) : brandIcon ? (
          <div style={{ marginBottom: 16 }}>{brandIcon}</div>
        ) : null}
        <div
          className="login-brand-logo"
          data-brand-name={serviceName}
          style={{
            fontSize: 28,
            fontWeight: 600,
            color: '#fff',
            marginBottom: 16,
          }}
        >
          {serviceName}
        </div>
        {brandDescription && (
          <div
            className="login-brand-desc"
            style={{
              fontSize: 14,
              color: '#888',
              maxWidth: 280,
              textAlign: 'center',
              lineHeight: 1.6,
            }}
          >
            {brandDescription}
          </div>
        )}
      </div>

      {/* Form Section */}
      <div
        className="login-form"
        style={{
          flex: 1,
          background: 'var(--bg)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 48,
        }}
      >
        <div style={{ maxWidth: 400, width: '100%', margin: '0 auto' }}>
          <h3
            className="login-form-title"
            data-form-title={formTitle}
            style={{
              fontSize: 18,
              fontWeight: 500,
              color: 'var(--text)',
              marginBottom: 24,
            }}
          >
            {formTitle}
          </h3>

          <div data-form-content="" style={{ minHeight: 100 }}>
            {children}
          </div>

          {footerLink && (
            <div
              style={{
                textAlign: 'center',
                marginTop: 24,
                fontSize: 13,
                color: 'var(--text-muted)',
              }}
            >
              <span>{footerLink.text} </span>
              {footerLink.href ? (
                <a
                  href={footerLink.href}
                  style={{
                    color: 'var(--primary)',
                    textDecoration: 'none',
                  }}
                >
                  {footerLink.label}
                </a>
              ) : (
                <span
                  onClick={footerLink.onClick}
                  style={{
                    color: 'var(--primary)',
                    cursor: 'pointer',
                  }}
                >
                  {footerLink.label}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Responsive */}
      <style>{`
        @media (max-width: 768px) {
          .login-split {
            flex-direction: column;
          }
          .login-brand {
            min-height: 200px;
            padding: 24px;
          }
          .login-form {
            padding: 24px;
          }
        }
      `}</style>
    </div>
  );
}

export default LoginLayout;