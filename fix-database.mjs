import mysql from 'mysql2/promise';

async function fixDatabase() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'mindfourm'
    });

    try {
        // Drop the settings table so it can be recreated
        await connection.query('DROP TABLE IF EXISTS settings');
        console.log('✓ Dropped settings table');

        console.log('\n数据库已修复！');
    } catch (error) {
        console.error('修复数据库失败:', error.message);
    } finally {
        await connection.end();
    }
}

fixDatabase();
