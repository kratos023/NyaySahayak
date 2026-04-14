import sqlite3
import json
import datetime
import os
import uuid
from typing import List, Dict, Optional

# Use /data on Render (persistent disk), fall back to local for dev
DB_PATH = os.path.join(os.getenv("DB_DIR", ""), "legal_ai_chat.db")

class LegalAIDatabase:
    def __init__(self, db_path=DB_PATH):
        self.db_path = db_path
        self.init_database()
    
    def get_connection(self):
        """Get database connection"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn
    
    def init_database(self):
        """Initialize database tables with proper schema"""
        conn = self.get_connection()
        try:
            # Drop existing tables to start fresh
            
            # Users table
            conn.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT UNIQUE NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Chat sessions table - with session_uuid
            conn.execute('''
                CREATE TABLE IF NOT EXISTS chat_sessions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_uuid TEXT UNIQUE NOT NULL,
                    user_id TEXT NOT NULL,
                    session_name TEXT NOT NULL,
                    intent_label TEXT DEFAULT 'General Query',
                    message_count INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    is_active BOOLEAN DEFAULT 1,
                    FOREIGN KEY (user_id) REFERENCES users (user_id)
                )
            ''')
            
            # Messages table - with message_uuid
            conn.execute('''
                CREATE TABLE IF NOT EXISTS messages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id INTEGER NOT NULL,
                    message_uuid TEXT UNIQUE NOT NULL,
                    role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
                    content TEXT NOT NULL,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    sequence_number INTEGER NOT NULL,
                    FOREIGN KEY (session_id) REFERENCES chat_sessions (id) ON DELETE CASCADE
                )
            ''')
            
            # Document analysis table
            conn.execute('''
                CREATE TABLE IF NOT EXISTS document_analysis (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id INTEGER NOT NULL,
                    filename TEXT NOT NULL,
                    file_size INTEGER,
                    original_content TEXT,
                    analysis_content TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (session_id) REFERENCES chat_sessions (id) ON DELETE CASCADE
                )
            ''')
            
            # Report generation table
            conn.execute('''
                CREATE TABLE IF NOT EXISTS reports (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id INTEGER NOT NULL,
                    report_name TEXT NOT NULL,
                    user_data JSON,
                    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (session_id) REFERENCES chat_sessions (id) ON DELETE CASCADE
                )
            ''')
            
            # Create indexes for better performance
            conn.execute('CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON chat_sessions(user_id)')
            conn.execute('CREATE INDEX IF NOT EXISTS idx_sessions_uuid ON chat_sessions(session_uuid)')
            conn.execute('CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id)')
            conn.execute('CREATE INDEX IF NOT EXISTS idx_messages_uuid ON messages(message_uuid)')
            conn.execute('CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp)')
            
            conn.commit()
            print("✅ Database initialized")
            
        except Exception as e:
            print(f"❌ Database initialization error: {e}")
        finally:
            conn.close()
    
    # User Management
    def create_or_update_user(self, user_id: str) -> bool:
        """Create or update user last active timestamp"""
        conn = self.get_connection()
        try:
            conn.execute('''
                INSERT OR REPLACE INTO users (user_id, last_active) 
                VALUES (?, CURRENT_TIMESTAMP)
            ''', (user_id,))
            conn.commit()
            return True
        except Exception as e:
            print(f"Error creating/updating user: {e}")
            return False
        finally:
            conn.close()
    
    def get_all_users(self) -> List[Dict]:
        """Get all users"""
        conn = self.get_connection()
        try:
            cursor = conn.execute('''
                SELECT user_id, created_at, last_active 
                FROM users 
                ORDER BY last_active DESC
            ''')
            return [dict(row) for row in cursor.fetchall()]
        finally:
            conn.close()
    
    # Chat Session Management
    def create_chat_session(self, user_id: str, session_name: str, intent_label: str = "General Query") -> Dict:
        """Create a new chat session and return session data with UUID"""
        conn = self.get_connection()
        try:
            # First ensure user exists
            self.create_or_update_user(user_id)
            
            # Generate unique UUID for this session
            session_uuid = str(uuid.uuid4())
            
            cursor = conn.execute('''
                INSERT INTO chat_sessions (session_uuid, user_id, session_name, intent_label) 
                VALUES (?, ?, ?, ?)
            ''', (session_uuid, user_id, session_name, intent_label))
            session_id = cursor.lastrowid
            
            conn.commit()
            
            return {
                'session_id': session_id,
                'session_uuid': session_uuid,
                'user_id': user_id,
                'session_name': session_name,
                'intent_label': intent_label
            }
        except Exception as e:
            print(f"Error creating chat session: {e}")
            return None
        finally:
            conn.close()
    
    def get_active_session(self, user_id: str) -> Optional[Dict]:
        """Get the active session for a user"""
        conn = self.get_connection()
        try:
            cursor = conn.execute('''
                SELECT id, session_uuid, session_name, intent_label, message_count, created_at
                FROM chat_sessions 
                WHERE user_id = ? AND is_active = 1
                ORDER BY updated_at DESC 
                LIMIT 1
            ''', (user_id,))
            row = cursor.fetchone()
            return dict(row) if row else None
        finally:
            conn.close()
    
    def update_chat_session(self, session_id: int, messages: List[Dict], intent_label: str = None) -> bool:
        """Update an existing chat session with new messages"""
        conn = self.get_connection()
        try:
            # Delete existing messages for this session
            conn.execute('DELETE FROM messages WHERE session_id = ?', (session_id,))
            
            # Insert all messages
            for seq_num, message in enumerate(messages):
                message_uuid = str(uuid.uuid4())
                conn.execute('''
                    INSERT INTO messages (session_id, message_uuid, role, content, sequence_number) 
                    VALUES (?, ?, ?, ?, ?)
                ''', (session_id, message_uuid, message['role'], message['content'], seq_num))
            
            # Update session
            update_query = '''
                UPDATE chat_sessions 
                SET message_count = ?, updated_at = CURRENT_TIMESTAMP
            '''
            params = [len(messages)]
            
            if intent_label:
                update_query += ', intent_label = ?'
                params.append(intent_label)
            
            update_query += ' WHERE id = ?'
            params.append(session_id)
            
            conn.execute(update_query, params)
            conn.commit()
            return True
        except Exception as e:
            print(f"Error updating chat session: {e}")
            return False
        finally:
            conn.close()
    
    def save_message(self, session_id: int, role: str, content: str, sequence_number: int) -> bool:
        """Save a single message to the database"""
        conn = self.get_connection()
        try:
            message_uuid = str(uuid.uuid4())
            conn.execute('''
                INSERT INTO messages (session_id, message_uuid, role, content, sequence_number) 
                VALUES (?, ?, ?, ?, ?)
            ''', (session_id, message_uuid, role, content, sequence_number))
            
            # Update session message count and timestamp
            conn.execute('''
                UPDATE chat_sessions 
                SET message_count = message_count + 1, updated_at = CURRENT_TIMESTAMP 
                WHERE id = ?
            ''', (session_id,))
            
            conn.commit()
            return True
        except Exception as e:
            print(f"Error saving message: {e}")
            return False
        finally:
            conn.close()
    
    def get_chat_sessions(self, user_id: str) -> List[Dict]:
        """Get all chat sessions for a user"""
        conn = self.get_connection()
        try:
            cursor = conn.execute('''
                SELECT 
                    id, session_uuid, session_name, intent_label, message_count, 
                    created_at, updated_at, is_active,
                    datetime(created_at) as created_display,
                    datetime(updated_at) as updated_display
                FROM chat_sessions 
                WHERE user_id = ? 
                ORDER BY updated_at DESC
            ''', (user_id,))
            
            sessions = []
            for row in cursor.fetchall():
                session = dict(row)
                sessions.append(session)
            
            return sessions
        finally:
            conn.close()
    
    def get_session_messages(self, session_id: int) -> List[Dict]:
        """Get all messages for a session"""
        conn = self.get_connection()
        try:
            cursor = conn.execute('''
                SELECT role, content, timestamp, sequence_number
                FROM messages 
                WHERE session_id = ? 
                ORDER BY sequence_number ASC
            ''', (session_id,))
            return [dict(row) for row in cursor.fetchall()]
        finally:
            conn.close()
    
    def get_recent_messages(self, session_id: int, limit: int = 3) -> List[Dict]:
        """Get recent messages for a session"""
        conn = self.get_connection()
        try:
            cursor = conn.execute('''
                SELECT role, content 
                FROM messages 
                WHERE session_id = ? 
                ORDER BY sequence_number DESC 
                LIMIT ?
            ''', (session_id, limit))
            return [dict(row) for row in cursor.fetchall()]
        finally:
            conn.close()
    
    def delete_chat_session(self, session_id: int) -> bool:
        """Delete a chat session and all its messages"""
        conn = self.get_connection()
        try:
            conn.execute('DELETE FROM chat_sessions WHERE id = ?', (session_id,))
            conn.commit()
            return True
        except Exception as e:
            print(f"Error deleting session: {e}")
            return False
        finally:
            conn.close()
    
    def deactivate_other_sessions(self, user_id: str, active_session_id: int):
        """Deactivate all other sessions for a user"""
        conn = self.get_connection()
        try:
            conn.execute('''
                UPDATE chat_sessions 
                SET is_active = 0 
                WHERE user_id = ? AND id != ?
            ''', (user_id, active_session_id))
            conn.commit()
        except Exception as e:
            print(f"Error deactivating sessions: {e}")
        finally:
            conn.close()
    
    # Document Analysis Storage
    def save_document_analysis(self, session_id: int, filename: str, file_size: int, 
                             original_content: str, analysis_content: str) -> bool:
        """Save document analysis results"""
        conn = self.get_connection()
        try:
            conn.execute('''
                INSERT INTO document_analysis 
                (session_id, filename, file_size, original_content, analysis_content) 
                VALUES (?, ?, ?, ?, ?)
            ''', (session_id, filename, file_size, original_content, analysis_content))
            conn.commit()
            return True
        except Exception as e:
            print(f"Error saving document analysis: {e}")
            return False
        finally:
            conn.close()
    
    def get_document_analysis(self, session_id: int) -> Optional[Dict]:
        """Get document analysis for a session"""
        conn = self.get_connection()
        try:
            cursor = conn.execute('''
                SELECT filename, file_size, original_content, analysis_content, created_at
                FROM document_analysis 
                WHERE session_id = ? 
                ORDER BY created_at DESC 
                LIMIT 1
            ''', (session_id,))
            row = cursor.fetchone()
            return dict(row) if row else None
        finally:
            conn.close()
    
    # Report Storage
    def save_report_generation(self, session_id: int, report_name: str, user_data: Dict) -> bool:
        """Save report generation record"""
        conn = self.get_connection()
        try:
            conn.execute('''
                INSERT INTO reports (session_id, report_name, user_data) 
                VALUES (?, ?, ?)
            ''', (session_id, report_name, json.dumps(user_data)))
            conn.commit()
            return True
        except Exception as e:
            print(f"Error saving report: {e}")
            return False
        finally:
            conn.close()
    
    def get_reports(self, session_id: int) -> List[Dict]:
        """Get all reports for a session"""
        conn = self.get_connection()
        try:
            cursor = conn.execute('''
                SELECT report_name, user_data, generated_at
                FROM reports 
                WHERE session_id = ? 
                ORDER BY generated_at DESC
            ''', (session_id,))
            return [dict(row) for row in cursor.fetchall()]
        finally:
            conn.close()
    
    # Analytics
    def get_user_statistics(self, user_id: str) -> Dict:
        """Get statistics for a user"""
        conn = self.get_connection()
        try:
            cursor = conn.execute('''
                SELECT 
                    COUNT(*) as total_sessions,
                    SUM(message_count) as total_messages,
                    MAX(updated_at) as last_activity,
                    GROUP_CONCAT(DISTINCT intent_label) as issues_discussed
                FROM chat_sessions 
                WHERE user_id = ?
            ''', (user_id,))
            row = cursor.fetchone()
            return dict(row) if row else {}
        finally:
            conn.close()
    
    def get_system_statistics(self) -> Dict:
        """Get overall system statistics"""
        conn = self.get_connection()
        try:
            stats = {}
            
            # Total users
            cursor = conn.execute('SELECT COUNT(*) as count FROM users')
            stats['total_users'] = cursor.fetchone()['count']
            
            # Total sessions
            cursor = conn.execute('SELECT COUNT(*) as count FROM chat_sessions')
            stats['total_sessions'] = cursor.fetchone()['count']
            
            # Total messages
            cursor = conn.execute('SELECT COUNT(*) as count FROM messages')
            stats['total_messages'] = cursor.fetchone()['count']
            
            # Active sessions
            cursor = conn.execute('SELECT COUNT(*) as count FROM chat_sessions WHERE is_active = 1')
            stats['active_sessions'] = cursor.fetchone()['count']
            
            # Most common issues
            cursor = conn.execute('''
                SELECT intent_label, COUNT(*) as count 
                FROM chat_sessions 
                GROUP BY intent_label 
                ORDER BY count DESC 
                LIMIT 5
            ''')
            stats['common_issues'] = [dict(row) for row in cursor.fetchall()]
            
            return stats
        finally:
            conn.close()

# Global database instance
db = LegalAIDatabase()