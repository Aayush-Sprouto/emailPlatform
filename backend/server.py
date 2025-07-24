from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, validator
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
from enum import Enum
import asyncio
import hashlib
import secrets
from email.mime.text import MimeText
from email.mime.multipart import MimeMultipart
import smtplib
import aiosmtplib
import json


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="EmailPlatform API", description="World-class email platform API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()

# Email Status Enum
class EmailStatus(str, Enum):
    QUEUED = "queued"
    PROCESSING = "processing"
    SENT = "sent"
    DELIVERED = "delivered"
    BOUNCED = "bounced"
    FAILED = "failed"
    COMPLAINED = "complained"

class EmailProvider(str, Enum):
    SENDGRID = "sendgrid"
    AWS_SES = "aws_ses"
    POSTMARK = "postmark"
    SMTP = "smtp"

# MongoDB Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    password_hash: str
    name: str
    company: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True
    email_quota: int = 10000  # Monthly email quota
    emails_sent_this_month: int = 0
    plan_type: str = "free"  # free, pro, enterprise

class ApiKey(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    key: str = Field(default_factory=lambda: f"ep_{secrets.token_urlsafe(32)}")
    key_hash: str = ""
    user_id: str
    name: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_used: Optional[datetime] = None
    is_active: bool = True
    permissions: List[str] = ["email:send", "email:read"]

class EmailTemplate(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    subject: str
    html_content: str
    text_content: Optional[str] = None
    variables: List[str] = []  # Template variables like {{name}}, {{company}}
    category: str = "general"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True

class EmailAttachment(BaseModel):
    filename: str
    content_type: str
    content: str  # Base64 encoded content
    size: int

class EmailRecipient(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    type: str = "to"  # to, cc, bcc

class EmailLog(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    api_key_id: Optional[str] = None
    campaign_id: Optional[str] = None
    template_id: Optional[str] = None
    
    # Email Details
    from_email: EmailStr
    from_name: Optional[str] = None
    recipients: List[EmailRecipient]
    subject: str
    html_content: Optional[str] = None
    text_content: Optional[str] = None
    attachments: List[EmailAttachment] = []
    
    # Tracking
    status: EmailStatus = EmailStatus.QUEUED
    provider: EmailProvider = EmailProvider.SMTP
    provider_message_id: Optional[str] = None
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    queued_at: Optional[datetime] = None
    sent_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    opened_at: Optional[datetime] = None
    clicked_at: Optional[datetime] = None
    bounced_at: Optional[datetime] = None
    failed_at: Optional[datetime] = None
    
    # Analytics
    open_count: int = 0
    click_count: int = 0
    bounce_reason: Optional[str] = None
    error_message: Optional[str] = None
    
    # Metadata
    tags: List[str] = []
    metadata: Dict[str, Any] = {}

class EmailCampaign(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    template_id: Optional[str] = None
    subject: str
    from_email: EmailStr
    from_name: Optional[str] = None
    
    # Campaign Settings
    scheduled_at: Optional[datetime] = None
    send_immediately: bool = True
    
    # Status
    status: str = "draft"  # draft, scheduled, sending, sent, paused
    total_recipients: int = 0
    emails_sent: int = 0
    emails_delivered: int = 0
    emails_opened: int = 0
    emails_clicked: int = 0
    emails_bounced: int = 0
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# API Request/Response Models
class SendEmailRequest(BaseModel):
    from_email: EmailStr
    from_name: Optional[str] = None
    to: List[EmailRecipient]
    cc: List[EmailRecipient] = []
    bcc: List[EmailRecipient] = []
    subject: str
    html_content: Optional[str] = None
    text_content: Optional[str] = None
    attachments: List[EmailAttachment] = []
    template_id: Optional[str] = None
    template_variables: Dict[str, str] = {}
    tags: List[str] = []
    metadata: Dict[str, Any] = {}
    send_immediately: bool = True
    scheduled_at: Optional[datetime] = None

class SendEmailResponse(BaseModel):
    id: str
    status: EmailStatus
    message: str
    created_at: datetime

class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

# Email Queue System (Simple in-memory queue for now, can be replaced with Redis later)
email_queue = asyncio.Queue()
processing_emails = {}

# Email Service Integration
class EmailService:
    def __init__(self):
        self.providers = {
            EmailProvider.SMTP: self._send_via_smtp,
            EmailProvider.SENDGRID: self._send_via_sendgrid,
            EmailProvider.AWS_SES: self._send_via_aws_ses,
        }
    
    async def send_email(self, email_log: EmailLog) -> Dict[str, Any]:
        """Send email using the specified provider"""
        try:
            provider = email_log.provider
            if provider not in self.providers:
                raise ValueError(f"Unsupported email provider: {provider}")
            
            result = await self.providers[provider](email_log)
            return {"success": True, "provider_message_id": result.get("message_id"), "result": result}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def _send_via_smtp(self, email_log: EmailLog) -> Dict[str, Any]:
        """Send email via SMTP (for development/testing)"""
        # For now, simulate email sending
        await asyncio.sleep(0.1)  # Simulate network delay
        message_id = f"smtp_{uuid.uuid4()}"
        return {"message_id": message_id, "provider": "smtp"}
    
    async def _send_via_sendgrid(self, email_log: EmailLog) -> Dict[str, Any]:
        """Send email via SendGrid"""
        # Will be implemented when API key is provided
        raise NotImplementedError("SendGrid integration requires API key")
    
    async def _send_via_aws_ses(self, email_log: EmailLog) -> Dict[str, Any]:
        """Send email via AWS SES"""
        # Will be implemented when credentials are provided
        raise NotImplementedError("AWS SES integration requires credentials")

email_service = EmailService()

# Authentication Helpers
async def get_api_key(credentials: HTTPAuthorizationCredentials = Depends(security)) -> ApiKey:
    """Validate API key from Authorization header"""
    try:
        token = credentials.credentials
        if not token.startswith("ep_"):
            raise HTTPException(status_code=401, detail="Invalid API key format")
        
        # Hash the token to compare with stored hash
        key_hash = hashlib.sha256(token.encode()).hexdigest()
        
        # Find API key in database
        api_key_doc = await db.api_keys.find_one({"key_hash": key_hash, "is_active": True})
        if not api_key_doc:
            raise HTTPException(status_code=401, detail="Invalid or inactive API key")
        
        # Update last used timestamp
        await db.api_keys.update_one(
            {"id": api_key_doc["id"]}, 
            {"$set": {"last_used": datetime.utcnow()}}
        )
        
        return ApiKey(**api_key_doc)
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

async def get_user_from_api_key(api_key: ApiKey = Depends(get_api_key)) -> User:
    """Get user from API key"""
    user_doc = await db.users.find_one({"id": api_key.user_id, "is_active": True})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    return User(**user_doc)

# Background Email Processing
async def process_email_queue():
    """Background task to process queued emails"""
    while True:
        try:
            # Get email from queue (with timeout to prevent blocking)
            try:
                email_id = await asyncio.wait_for(email_queue.get(), timeout=1.0)
            except asyncio.TimeoutError:
                continue
            
            # Get email from database
            email_doc = await db.email_logs.find_one({"id": email_id})
            if not email_doc:
                continue
            
            email_log = EmailLog(**email_doc)
            
            # Update status to processing
            await db.email_logs.update_one(
                {"id": email_id},
                {"$set": {"status": EmailStatus.PROCESSING, "queued_at": datetime.utcnow()}}
            )
            
            # Send email
            result = await email_service.send_email(email_log)
            
            if result["success"]:
                # Update status to sent
                await db.email_logs.update_one(
                    {"id": email_id},
                    {"$set": {
                        "status": EmailStatus.SENT,
                        "sent_at": datetime.utcnow(),
                        "provider_message_id": result.get("provider_message_id")
                    }}
                )
            else:
                # Update status to failed
                await db.email_logs.update_one(
                    {"id": email_id},
                    {"$set": {
                        "status": EmailStatus.FAILED,
                        "failed_at": datetime.utcnow(),
                        "error_message": result.get("error")
                    }}
                )
            
        except Exception as e:
            logging.error(f"Error processing email queue: {e}")
            await asyncio.sleep(1)

# Start background task
@app.on_event("startup")
async def startup_event():
    # Start email processing task
    asyncio.create_task(process_email_queue())

# API Routes
# API Routes

@api_router.post("/v1/emails", response_model=SendEmailResponse)
async def send_email(
    request: SendEmailRequest,
    background_tasks: BackgroundTasks,
    api_key: ApiKey = Depends(get_api_key),
    user: User = Depends(get_user_from_api_key)
):
    """Send an email"""
    try:
        # Check user quota
        if user.emails_sent_this_month >= user.email_quota:
            raise HTTPException(
                status_code=429, 
                detail=f"Email quota exceeded. Current limit: {user.email_quota}"
            )
        
        # Combine all recipients
        all_recipients = request.to + request.cc + request.bcc
        
        # Create email log
        email_log = EmailLog(
            user_id=user.id,
            api_key_id=api_key.id,
            from_email=request.from_email,
            from_name=request.from_name,
            recipients=all_recipients,
            subject=request.subject,
            html_content=request.html_content,
            text_content=request.text_content,
            attachments=request.attachments,
            tags=request.tags,
            metadata=request.metadata,
            template_id=request.template_id
        )
        
        # Insert into database
        await db.email_logs.insert_one(email_log.dict())
        
        # Add to queue for processing
        if request.send_immediately:
            await email_queue.put(email_log.id)
            email_log.status = EmailStatus.QUEUED
        
        # Update user's email count
        await db.users.update_one(
            {"id": user.id},
            {"$inc": {"emails_sent_this_month": 1}}
        )
        
        return SendEmailResponse(
            id=email_log.id,
            status=email_log.status,
            message="Email queued for sending",
            created_at=email_log.created_at
        )
        
    except Exception as e:
        logging.error(f"Error sending email: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/v1/emails", response_model=List[EmailLog])
async def get_emails(
    limit: int = 100,
    offset: int = 0,
    status: Optional[EmailStatus] = None,
    user: User = Depends(get_user_from_api_key)
):
    """Get email logs for the authenticated user"""
    try:
        # Build query
        query = {"user_id": user.id}
        if status:
            query["status"] = status
        
        # Get emails from database
        cursor = db.email_logs.find(query).sort("created_at", -1).skip(offset).limit(limit)
        emails = await cursor.to_list(length=limit)
        
        return [EmailLog(**email) for email in emails]
        
    except Exception as e:
        logging.error(f"Error getting emails: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/v1/emails/{email_id}", response_model=EmailLog)
async def get_email_by_id(
    email_id: str,
    user: User = Depends(get_user_from_api_key)
):
    """Get a specific email by ID"""
    try:
        email_doc = await db.email_logs.find_one({"id": email_id, "user_id": user.id})
        if not email_doc:
            raise HTTPException(status_code=404, detail="Email not found")
        
        return EmailLog(**email_doc)
        
    except Exception as e:
        logging.error(f"Error getting email: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/v1/templates", response_model=EmailTemplate)
async def create_template(
    template: EmailTemplate,
    user: User = Depends(get_user_from_api_key)
):
    """Create an email template"""
    try:
        template.user_id = user.id
        await db.email_templates.insert_one(template.dict())
        return template
        
    except Exception as e:
        logging.error(f"Error creating template: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/v1/templates", response_model=List[EmailTemplate])
async def get_templates(
    user: User = Depends(get_user_from_api_key)
):
    """Get email templates for the authenticated user"""
    try:
        templates = await db.email_templates.find({"user_id": user.id, "is_active": True}).to_list(100)
        return [EmailTemplate(**template) for template in templates]
        
    except Exception as e:
        logging.error(f"Error getting templates: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/v1/api-keys", response_model=Dict[str, Any])
async def create_api_key(
    name: str,
    user: User = Depends(get_user_from_api_key)
):
    """Create a new API key"""
    try:
        api_key = ApiKey(user_id=user.id, name=name)
        
        # Hash the key for storage
        api_key.key_hash = hashlib.sha256(api_key.key.encode()).hexdigest()
        
        # Store in database (without the plain key)
        key_doc = api_key.dict()
        plain_key = key_doc.pop("key")  # Remove plain key before storing
        
        await db.api_keys.insert_one(key_doc)
        
        return {
            "id": api_key.id,
            "name": api_key.name,
            "key": plain_key,  # Return plain key only once
            "created_at": api_key.created_at,
            "message": "Store this key securely - it won't be shown again"
        }
        
    except Exception as e:
        logging.error(f"Error creating API key: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/v1/api-keys", response_model=List[Dict[str, Any]])
async def get_api_keys(
    user: User = Depends(get_user_from_api_key)
):
    """Get API keys for the authenticated user (without showing the actual keys)"""
    try:
        keys = await db.api_keys.find({"user_id": user.id, "is_active": True}).to_list(100)
        
        # Remove sensitive information
        safe_keys = []
        for key in keys:
            safe_keys.append({
                "id": key["id"],
                "name": key["name"],
                "created_at": key["created_at"],
                "last_used": key.get("last_used"),
                "permissions": key["permissions"]
            })
        
        return safe_keys
        
    except Exception as e:
        logging.error(f"Error getting API keys: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/v1/api-keys/{key_id}")
async def delete_api_key(
    key_id: str,
    user: User = Depends(get_user_from_api_key)
):
    """Delete an API key"""
    try:
        result = await db.api_keys.update_one(
            {"id": key_id, "user_id": user.id},
            {"$set": {"is_active": False}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="API key not found")
        
        return {"message": "API key deleted successfully"}
        
    except Exception as e:
        logging.error(f"Error deleting API key: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/v1/analytics/overview")
async def get_analytics_overview(
    user: User = Depends(get_user_from_api_key)
):
    """Get email analytics overview"""
    try:
        # Get email statistics
        total_emails = await db.email_logs.count_documents({"user_id": user.id})
        sent_emails = await db.email_logs.count_documents({"user_id": user.id, "status": EmailStatus.SENT})
        delivered_emails = await db.email_logs.count_documents({"user_id": user.id, "status": EmailStatus.DELIVERED})
        bounced_emails = await db.email_logs.count_documents({"user_id": user.id, "status": EmailStatus.BOUNCED})
        
        # Calculate rates
        delivery_rate = (delivered_emails / total_emails * 100) if total_emails > 0 else 0
        bounce_rate = (bounced_emails / total_emails * 100) if total_emails > 0 else 0
        
        return {
            "total_emails": total_emails,
            "sent_emails": sent_emails,
            "delivered_emails": delivered_emails,
            "bounced_emails": bounced_emails,
            "delivery_rate": round(delivery_rate, 2),
            "bounce_rate": round(bounce_rate, 2),
            "quota_used": user.emails_sent_this_month,
            "quota_limit": user.email_quota,
            "quota_percentage": round((user.emails_sent_this_month / user.email_quota * 100), 2)
        }
        
    except Exception as e:
        logging.error(f"Error getting analytics: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Original routes (keeping for compatibility)
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
