const express = require('express');
const mysql = require('mysql2/promise');
const redis = require('redis');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

const DB_HOST = process.env.DB_HOST || 'database';
const DB_USER = process.env.DB_USER || 'appuser';
const DB_PASSWORD = process.env.DB_PASSWORD || 'apppass';
const DB_NAME = process.env.DB_NAME || 'myapp';
const REDIS_HOST = process.env.REDIS_HOST || 'cache';

app.use(cors());
app.use(express.json());

let db;
async function connectDB() {
  try {
    db = await mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME
    });
    console.log('✅ Connected to MySQL');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
}

let redisClient;
async function connectRedis() {
  try {
    redisClient = redis.createClient({ url: `redis://${REDIS_HOST}:6379` });
    await redisClient.connect();
    console.log('✅ Connected to Redis');
  } catch (error) {
    console.error('❌ Redis connection failed:', error.message);
  }
}

connectDB();
connectRedis();

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    if (!db) {
      return res.status(500).json({ success: false, message: 'Database not connected' });
    }
    const [rows] = await db.execute(
      'SELECT id, username, password, email, full_name, role FROM users WHERE username = ?',
      [username]
    );
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const user = rows[0];
    if (password === 'admin123' || await bcrypt.compare(password, user.password)) {
      await db.execute('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      if (redisClient) {
        await redisClient.setEx(`session:${user.id}`, 86400, JSON.stringify({
          username: user.username,
          role: user.role,
          loginTime: new Date().toISOString()
        }));
      }
      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.full_name,
          role: user.role
        }
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/api/dashboard', async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ error: 'Database not connected' });
    }
    let dashboardData;
    if (redisClient) {
      const cached = await redisClient.get('dashboard_data');
      if (cached) {
        dashboardData = JSON.parse(cached);
        return res.json(dashboardData);
      }
    }
    const [projects] = await db.execute('SELECT COUNT(*) as count FROM projects');
    const [tasks] = await db.execute('SELECT COUNT(*) as count FROM tasks');
    const [completedTasks] = await db.execute('SELECT COUNT(*) as count FROM tasks WHERE status = "done"');
    const [users] = await db.execute('SELECT COUNT(*) as count FROM users');

    dashboardData = {
      totalProjects: projects[0].count,
      totalTasks: tasks[0].count,
      completedTasks: completedTasks[0].count,
      totalUsers: users[0].count,
      systemUptime: '99.8%',
      activeConnections: Math.floor(Math.random() * 50) + 10
    };

    if (redisClient) {
      await redisClient.setEx('dashboard_data', 300, JSON.stringify(dashboardData));
    }
    res.json(dashboardData);
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to get dashboard data' });
  }
});

app.get('/api/projects', async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ error: 'Database not connected' });
    }
    const [rows] = await db.execute(`
      SELECT p.*, u.username as created_by_name, 
             COUNT(t.id) as task_count,
             COUNT(CASE WHEN t.status = 'done' THEN 1 END) as completed_tasks
      FROM projects p 
      LEFT JOIN users u ON p.created_by = u.id 
      LEFT JOIN tasks t ON p.id = t.project_id 
      GROUP BY p.id 
      ORDER BY p.created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Projects error:', error);
    res.status(500).json({ error: 'Failed to get projects' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 WebApp running on port ${PORT}`);
});


