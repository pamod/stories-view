// SQL script to create the required database tables
// Run this script in your MySQL database before starting the service
//
// CREATE DATABASE IF NOT EXISTS device_enrollment;
//
// USE device_enrollment;
//
// CREATE TABLE IF NOT EXISTS devices (
//     device_id VARCHAR(255) PRIMARY KEY,
//     device_name VARCHAR(255) NOT NULL,
//     device_type VARCHAR(255) NOT NULL,
//     user_name VARCHAR(255) NOT NULL,
//     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
// );
//
// CREATE TABLE IF NOT EXISTS device_users (
//     id INT AUTO_INCREMENT PRIMARY KEY,
//     device_id VARCHAR(255) NOT NULL,
//     user_id VARCHAR(255) NOT NULL,
//     is_authorized BOOLEAN DEFAULT TRUE,
//     is_active BOOLEAN DEFAULT FALSE,
//     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//     FOREIGN KEY (device_id) REFERENCES devices(device_id) ON DELETE CASCADE,
//     UNIQUE KEY unique_device_user (device_id, user_id)
// );
//
// CREATE INDEX idx_device_id ON device_users(device_id);
// CREATE INDEX idx_user_id ON device_users(user_id);
// CREATE INDEX idx_user_active ON device_users(user_id, is_active);
