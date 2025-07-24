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
@api_router.get("/")
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
