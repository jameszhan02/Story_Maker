-- NEED TO MAINTAIN THE DATABASE SCHEMA HERE SINCE I AM NOT USING ANY TOOLS TO GENERATE THE DB SCHEMA
-- I AM USING POSTGRESQL AS MY DATABASE

-- !!!!! THIS IS NO LONGER USED SINCE I AM USING PRISMA TO GENERATE THE DB SCHEMA !!!!!

-- enable uuid-ossp extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Table | 2025-03-28 | @sillyknight02
-- id: UUID PRIMARY KEY DEFAULT uuid_generate_v4()
-- username: VARCHAR(255) NOT NULL UNIQUE
-- email: VARCHAR(255) UNIQUE
-- password_hash: VARCHAR(255) NOT NULL
-- created_at: TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 房间表
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    host_id UUID,
    status VARCHAR(50) DEFAULT 'waiting',
    max_players INTEGER DEFAULT 6,
    current_players INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- create index for `'fk'` host_id in rooms table
CREATE INDEX idx_rooms_host_id ON rooms(host_id);

-- 游戏会话表
CREATE TABLE game_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID,
    status VARCHAR(50) DEFAULT 'active',
    current_round INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- create index for `'fk'` room_id in game_sessions table
CREATE INDEX idx_rooms_host_id ON game_sessions(room_id);
