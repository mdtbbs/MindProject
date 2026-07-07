import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

async function createAdminAccount() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'mindauth'
    });

    try {
        // Check if admin user already exists
        const [existingUsers] = await connection.query(
            'SELECT id, username, email FROM users WHERE username = ? OR email = ?',
            ['admin', 'admin@example.com']
        );

        if (existingUsers.length > 0) {
            console.log('管理员账户已存在:');
            console.log('  用户名:', existingUsers[0].username);
            console.log('  邮箱:', existingUsers[0].email);
            console.log('  ID:', existingUsers[0].id);
            return;
        }

        // Create admin user
        const password = 'Admin123!';
        const passwordHash = await bcrypt.hash(password, 10);
        const sessionToken = crypto.randomBytes(32).toString('hex');

        const [result] = await connection.query(
            `INSERT INTO users (username, email, password_hash, role, email_verified, session_token, created_at)
             VALUES (?, ?, ?, 'admin', 1, ?, NOW())`,
            ['admin', 'admin@example.com', passwordHash, sessionToken]
        );

        console.log('✅ 管理员账户创建成功！');
        console.log('');
        console.log('📧 登录信息:');
        console.log('  邮箱: admin@example.com');
        console.log('  密码: Admin123!');
        console.log('  用户名: admin');
        console.log('');
        console.log('🔗 访问地址: http://localhost:4001');
        console.log('');
        console.log('💡 提示: 登录后可以访问管理后台');
        console.log('   管理后台: http://localhost:4001/admin.html');

    } catch (error) {
        console.error('创建管理员账户失败:', error.message);
    } finally {
        await connection.end();
    }
}

createAdminAccount();
