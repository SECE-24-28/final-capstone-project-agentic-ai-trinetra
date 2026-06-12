"""Database Seed Script - Creates initial admin user"""

import sys
from pathlib import Path

# Add server directory to Python path
server_dir = Path(__file__).resolve().parent.parent
sys.path.append(str(server_dir))

import asyncio
from datetime import datetime
from app.config.settings import settings
from app.database.mongodb import get_database, connect_mongodb
from app.auth.password import password_handler
from app.schemas.user import UserRole


async def seed_admin_user():
    """Create initial admin user if it doesn't exist."""
    print("Connecting to database...")
    await connect_mongodb()  # Initialize MongoDB client
    db = get_database()
    
    # Check if admin user already exists
    existing_user = await db["users"].find_one({"username": "admin"})
    if existing_user:
        print("Admin user already exists!")
        return
    
    # Create admin user
    admin_user = {
        "username": "admin",
        "email": "admin@example.com",
        "full_name": "Administrator",
        "role": UserRole.ADMIN.value,
        "hashed_password": password_handler.hash_password("admin123"),
        "is_active": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    
    result = await db["users"].insert_one(admin_user)
    print(f"Admin user created successfully! ID: {result.inserted_id}")
    print("Login credentials:")
    print("Username: admin")
    print("Password: admin123")


if __name__ == "__main__":
    asyncio.run(seed_admin_user())
