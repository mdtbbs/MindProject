"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginLayout = LoginLayout;
const jsx_runtime_1 = require("react/jsx-runtime");
function LoginLayout({ serviceName, brandDescription, formTitle, logoUrl, brandIcon, children, footerLink, }) {
    return ((0, jsx_runtime_1.jsxs)("div", { className: "login-split", style: {
            display: 'flex',
            minHeight: '100vh',
        }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "login-brand", style: {
                    flex: 1,
                    background: '#333',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: 48,
                }, children: [logoUrl ? ((0, jsx_runtime_1.jsx)("img", { src: logoUrl, alt: serviceName, style: {
                            width: 64,
                            height: 64,
                            marginBottom: 16,
                        } })) : brandIcon ? ((0, jsx_runtime_1.jsx)("div", { style: { marginBottom: 16 }, children: brandIcon })) : null, (0, jsx_runtime_1.jsx)("div", { className: "login-brand-logo", "data-brand-name": serviceName, style: {
                            fontSize: 28,
                            fontWeight: 600,
                            color: '#fff',
                            marginBottom: 16,
                        }, children: serviceName }), brandDescription && ((0, jsx_runtime_1.jsx)("div", { className: "login-brand-desc", style: {
                            fontSize: 14,
                            color: '#888',
                            maxWidth: 280,
                            textAlign: 'center',
                            lineHeight: 1.6,
                        }, children: brandDescription }))] }), (0, jsx_runtime_1.jsx)("div", { className: "login-form", style: {
                    flex: 1,
                    background: 'var(--bg)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    padding: 48,
                }, children: (0, jsx_runtime_1.jsxs)("div", { style: { maxWidth: 400, width: '100%', margin: '0 auto' }, children: [(0, jsx_runtime_1.jsx)("h3", { className: "login-form-title", "data-form-title": formTitle, style: {
                                fontSize: 18,
                                fontWeight: 500,
                                color: 'var(--text)',
                                marginBottom: 24,
                            }, children: formTitle }), (0, jsx_runtime_1.jsx)("div", { "data-form-content": "", style: { minHeight: 100 }, children: children }), footerLink && ((0, jsx_runtime_1.jsxs)("div", { style: {
                                textAlign: 'center',
                                marginTop: 24,
                                fontSize: 13,
                                color: 'var(--text-muted)',
                            }, children: [(0, jsx_runtime_1.jsxs)("span", { children: [footerLink.text, " "] }), footerLink.href ? ((0, jsx_runtime_1.jsx)("a", { href: footerLink.href, style: {
                                        color: 'var(--primary)',
                                        textDecoration: 'none',
                                    }, children: footerLink.label })) : ((0, jsx_runtime_1.jsx)("span", { onClick: footerLink.onClick, style: {
                                        color: 'var(--primary)',
                                        cursor: 'pointer',
                                    }, children: footerLink.label }))] }))] }) }), (0, jsx_runtime_1.jsx)("style", { children: `
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
      ` })] }));
}
exports.default = LoginLayout;
