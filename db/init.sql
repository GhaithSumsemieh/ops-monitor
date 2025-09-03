USE myapp;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    full_name VARCHAR(100),
    role ENUM('admin', 'user') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    status ENUM('active', 'completed', 'paused') DEFAULT 'active',
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status ENUM('todo', 'active', 'done') DEFAULT 'todo',
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    assigned_to INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (assigned_to) REFERENCES users(id)
);

INSERT INTO users (username, password, email, full_name, role) VALUES 
('admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin@myapp.com', 'System Administrator', 'admin'),
('demo', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'demo@myapp.com', 'Demo User', 'user')
ON DUPLICATE KEY UPDATE username=username;

INSERT INTO projects (name, description, status, created_by) VALUES 
('Container Migration', 'Migrate all applications to containerized environment', 'active', 1),
('API Development', 'Build REST API for mobile application', 'active', 1),
('Database Optimization', 'Optimize database queries and indexes', 'completed', 1)
ON DUPLICATE KEY UPDATE name=name;

INSERT INTO tasks (project_id, title, description, status, priority, assigned_to) VALUES 
(1, 'Setup Docker Environment', 'Configure Docker and Docker Compose', 'done', 'high', 1),
(1, 'Create Application Images', 'Build custom Docker images for each service', 'active', 'high', 1),
(1, 'Configure Load Balancer', 'Setup Nginx as reverse proxy', 'todo', 'medium', 1),
(2, 'Design API Endpoints', 'Define REST API structure and endpoints', 'done', 'high', 1),
(2, 'Implement Authentication', 'Add JWT-based authentication', 'active', 'high', 1),
(3, 'Analyze Query Performance', 'Identify slow queries using EXPLAIN', 'done', 'medium', 1)
ON DUPLICATE KEY UPDATE title=title;
