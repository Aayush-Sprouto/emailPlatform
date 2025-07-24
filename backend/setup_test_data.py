#!/usr/bin/env python3
"""
Setup script to create a test user and API key for the email platform
"""
import asyncio
import hashlib
import secrets
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import os
from dotenv import load_dotenv
from pathlib import Path

# Load environment
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def setup_test_data():
    """Create test user and API key"""
    try:
        # Connect to MongoDB
        mongo_url = os.environ['MONGO_URL']
        client = AsyncIOMotorClient(mongo_url)
        db = client[os.environ['DB_NAME']]
        
        # Create test user
        test_user = {
            "id": "test-user-001",
            "email": "developer@emailplatform.com",
            "password_hash": "dummy_hash",
            "name": "Test Developer",
            "company": "EmailPlatform Inc",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "is_active": True,
            "email_quota": 10000,
            "emails_sent_this_month": 0,
            "plan_type": "pro"
        }
        
        # Check if user already exists
        existing_user = await db.users.find_one({"id": test_user["id"]})
        if not existing_user:
            await db.users.insert_one(test_user)
            print(f"✅ Created test user: {test_user['email']}")
        else:
            print(f"ℹ️  Test user already exists: {test_user['email']}")
        
        # Create test API key
        api_key_plain = f"ep_{secrets.token_urlsafe(32)}"
        api_key_hash = hashlib.sha256(api_key_plain.encode()).hexdigest()
        
        test_api_key = {
            "id": "test-api-key-001",
            "key_hash": api_key_hash,
            "user_id": test_user["id"],
            "name": "Test API Key",
            "created_at": datetime.utcnow(),
            "last_used": None,
            "is_active": True,
            "permissions": ["email:send", "email:read", "template:create", "template:read"]
        }
        
        # Check if API key already exists
        existing_key = await db.api_keys.find_one({"id": test_api_key["id"]})
        if not existing_key:
            await db.api_keys.insert_one(test_api_key)
            print(f"✅ Created test API key: {api_key_plain}")
            print(f"🔑 API Key ID: {test_api_key['id']}")
        else:
            print(f"ℹ️  Test API key already exists")
            print(f"🔑 API Key ID: {test_api_key['id']}")
        
        # Create some sample email templates
        templates = [
            {
                "id": "welcome-template-001",
                "user_id": test_user["id"],
                "name": "Welcome Email",
                "subject": "Welcome to {{company_name}}!",
                "html_content": """
                <html>
                <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #333;">Welcome {{first_name}}!</h1>
                    <p>Thank you for joining <strong>{{company_name}}</strong>. We're excited to have you on board.</p>
                    <p>Here's what you can expect:</p>
                    <ul>
                        <li>Professional email delivery</li>
                        <li>Advanced analytics</li>
                        <li>Template management</li>
                    </ul>
                    <p>Best regards,<br>The {{company_name}} Team</p>
                </body>
                </html>
                """,
                "text_content": "Welcome {{first_name}}! Thank you for joining {{company_name}}.",
                "variables": ["first_name", "company_name"],
                "category": "onboarding",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "is_active": True
            },
            {
                "id": "newsletter-template-001", 
                "user_id": test_user["id"],
                "name": "Newsletter Template",
                "subject": "{{company_name}} Weekly Newsletter",
                "html_content": """
                <html>
                <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <header style="background: #f8f9fa; padding: 20px; text-align: center;">
                        <h1 style="color: #333;">{{company_name}} Newsletter</h1>
                    </header>
                    <main style="padding: 20px;">
                        <h2>Hi {{first_name}},</h2>
                        <p>Here are this week's highlights:</p>
                        <div style="background: #e9ecef; padding: 15px; border-radius: 5px;">
                            {{newsletter_content}}
                        </div>
                    </main>
                    <footer style="text-align: center; padding: 20px; color: #666;">
                        <p>© {{company_name}} | Unsubscribe</p>
                    </footer>
                </body>
                </html>
                """,
                "variables": ["first_name", "company_name", "newsletter_content"],
                "category": "newsletter",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "is_active": True
            }
        ]
        
        for template in templates:
            existing_template = await db.email_templates.find_one({"id": template["id"]})
            if not existing_template:
                await db.email_templates.insert_one(template)
                print(f"✅ Created template: {template['name']}")
            else:
                print(f"ℹ️  Template already exists: {template['name']}")
        
        print("\n🎉 Test data setup complete!")
        print(f"📧 Test Email: {test_user['email']}")
        print(f"🔑 API Key: {api_key_plain}")
        print(f"📊 User ID: {test_user['id']}")
        
        client.close()
        
    except Exception as e:
        print(f"❌ Error setting up test data: {e}")

if __name__ == "__main__":
    asyncio.run(setup_test_data())