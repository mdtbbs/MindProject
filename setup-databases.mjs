import mysql from 'mysql2/promise';

async function createDatabases() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: ''
    });

    try {
        // Create mindauth database
        await connection.query('CREATE DATABASE IF NOT EXISTS mindauth CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
        console.log('✓ Created database: mindauth');

        // Create mindfourm database
        await connection.query('CREATE DATABASE IF NOT EXISTS mindfourm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
        console.log('✓ Created database: mindfourm');

        console.log('\n所有数据库已创建成功！');
    } catch (error) {
        console.error('创建数据库失败:', error.message);
    } finally {
        await connection.end();
    }
}

createDatabases();
