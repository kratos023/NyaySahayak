# backend/utils/context_memory.py
from datetime import datetime

class ContextMemory:
    def __init__(self, max_messages: int = 4):
        self.max_messages = max_messages
        self.history = []

    def add_message(self, role: str, content: str, language: str = "en"):
        self.history.append({
            "role": role,
            "content": content,
            "language": language,
            "timestamp": datetime.now().isoformat(),
        })
        if len(self.history) > self.max_messages:
            self.history = self.history[-self.max_messages:]

    def get_context_prompt(self) -> str:
        if not self.history:
            return ""
        lines = ["## Previous Conversation Context:"]
        for msg in self.history:
            role = "User" if msg["role"] == "user" else "Assistant"
            lines.append(f"{role}: {msg['content'][:300]}")
        return "\n".join(lines) + "\n\n## Current Question:"

    def clear(self):
        self.history = []

    def to_list(self) -> list:
        return self.history
