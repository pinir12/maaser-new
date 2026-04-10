from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import asyncio
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import httpx
import resend

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Supabase configuration
SUPABASE_URL = os.environ.get('SUPABASE_URL', 'https://mznzgekkzbollftoxfma.supabase.co')
SUPABASE_KEY = os.environ.get('SUPABASE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16bnpnZWtremJvbGxmdG94Zm1hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxNTA4MDE5OCwiZXhwIjoyMDMwNjU2MTk4fQ.GwDiacV8UXB6MJoSECjmZ_fObXB1lIVEJVsYGCdz5Ow')

# Resend configuration
RESEND_API_KEY = os.environ.get('RESEND_API_KEY', '')
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'mail@pinir.co.uk')
resend.api_key = RESEND_API_KEY

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Currency rates cache
_rates_cache = {}
_rates_cache_time = {}
CACHE_TTL = 3600  # 1 hour

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")


# --- Models ---
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

class CronResult(BaseModel):
    success: bool
    created: int
    message: str

class ContactRequest(BaseModel):
    name: str
    email: str
    message: str

class SignupNotification(BaseModel):
    user_name: str
    user_email: str


# --- Status Endpoints ---
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    return status_checks


# --- Email Endpoints ---
@api_router.post("/email/signup-notification")
async def send_signup_notification(data: SignupNotification):
    """Send admin email when a new user signs up."""
    if not RESEND_API_KEY:
        raise HTTPException(status_code=500, detail="Email service not configured")

    html_content = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
      <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 24px; border-radius: 12px 12px 0 0; color: white;">
        <h2 style="margin: 0; font-size: 20px;">New User Registration</h2>
      </div>
      <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="margin: 0 0 12px; color: #334155;"><strong>Name:</strong> {data.user_name}</p>
        <p style="margin: 0 0 12px; color: #334155;"><strong>Email:</strong> {data.user_email}</p>
        <p style="margin: 0; color: #334155;"><strong>Registered at:</strong> {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}</p>
      </div>
    </div>
    """

    params = {
        "from": "Finance Tracker <onboarding@resend.dev>",
        "to": [ADMIN_EMAIL],
        "subject": f"New User Signup: {data.user_name}",
        "html": html_content
    }

    try:
        email = await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Signup notification sent for {data.user_email}")
        return {"status": "success", "email_id": email.get("id") if isinstance(email, dict) else str(email)}
    except Exception as e:
        logger.error(f"Failed to send signup notification: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/email/contact")
async def send_contact_email(data: ContactRequest):
    """Send contact form email to admin."""
    if not RESEND_API_KEY:
        raise HTTPException(status_code=500, detail="Email service not configured")

    html_content = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
      <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 24px; border-radius: 12px 12px 0 0; color: white;">
        <h2 style="margin: 0; font-size: 20px;">Contact Form Message</h2>
      </div>
      <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="margin: 0 0 12px; color: #334155;"><strong>From:</strong> {data.name}</p>
        <p style="margin: 0 0 12px; color: #334155;"><strong>Email:</strong> {data.email}</p>
        <p style="margin: 0 0 8px; color: #334155;"><strong>Message:</strong></p>
        <div style="background: white; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; color: #475569;">
          {data.message}
        </div>
      </div>
    </div>
    """

    params = {
        "from": "Finance Tracker <onboarding@resend.dev>",
        "to": [ADMIN_EMAIL],
        "subject": f"Contact Form: {data.name}",
        "html": html_content
    }

    try:
        email = await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Contact email sent from {data.email}")
        return {"status": "success", "email_id": email.get("id") if isinstance(email, dict) else str(email)}
    except Exception as e:
        logger.error(f"Failed to send contact email: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# --- Currency Rates Endpoint ---
@api_router.get("/currency/rates/{base}")
async def get_currency_rates(base: str):
    """Get live exchange rates with 1-hour caching."""
    base = base.upper()
    now = datetime.now(timezone.utc).timestamp()

    if base in _rates_cache and (now - _rates_cache_time.get(base, 0)) < CACHE_TTL:
        return _rates_cache[base]

    try:
        async with httpx.AsyncClient(timeout=10.0) as http_client:
            response = await http_client.get(f"https://open.er-api.com/v6/latest/{base}")
            if response.status_code == 200:
                data = response.json()
                result = {
                    "base": base,
                    "rates": data.get("rates", {}),
                    "updated_at": data.get("time_last_update_utc", "")
                }
                _rates_cache[base] = result
                _rates_cache_time[base] = now
                return result
    except Exception as e:
        logger.error(f"Currency API error: {e}")

    if base in _rates_cache:
        return _rates_cache[base]

    raise HTTPException(status_code=502, detail="Failed to fetch exchange rates")


# --- Cron Endpoint ---
@api_router.post("/cron/recurring", response_model=CronResult)
async def process_recurring_transactions():
    """Process all recurring transactions and create new entries for any that are due."""
    try:
        headers = {
            'apikey': SUPABASE_KEY,
            'Authorization': f'Bearer {SUPABASE_KEY}',
            'Content-Type': 'application/json'
        }

        today = datetime.now(timezone.utc).date()
        created_count = 0

        async with httpx.AsyncClient() as http_client:
            response = await http_client.get(
                f'{SUPABASE_URL}/rest/v1/transactions',
                params={'is_recurring': 'eq.true', 'select': '*'},
                headers=headers
            )

            if response.status_code != 200:
                raise HTTPException(status_code=500, detail=f"Failed to fetch transactions: {response.text}")

            recurring_txns = response.json()

            for txn in recurring_txns:
                if txn.get('recurring_end_date'):
                    end_date = datetime.fromisoformat(txn['recurring_end_date']).date()
                    if end_date < today:
                        continue

                last_date = datetime.fromisoformat(txn['date']).date()
                next_date = last_date
                frequency = txn.get('recurring_frequency', 'monthly')

                while next_date <= today:
                    if frequency == 'daily':
                        next_date += timedelta(days=1)
                    elif frequency == 'weekly':
                        next_date += timedelta(weeks=1)
                    elif frequency == 'biweekly':
                        next_date += timedelta(weeks=2)
                    elif frequency == 'monthly':
                        month = next_date.month + 1
                        year = next_date.year
                        if month > 12:
                            month = 1
                            year += 1
                        day = min(next_date.day, 28)
                        next_date = next_date.replace(year=year, month=month, day=day)
                    elif frequency == 'yearly':
                        next_date = next_date.replace(year=next_date.year + 1)
                    else:
                        break

                    if next_date > today:
                        break

                    next_date_str = next_date.isoformat()

                    check_response = await http_client.get(
                        f'{SUPABASE_URL}/rest/v1/transactions',
                        params={
                            'user_id': f'eq.{txn["user_id"]}',
                            'description': f'eq.{txn["description"]}',
                            'date': f'eq.{next_date_str}',
                            'select': 'id'
                        },
                        headers=headers
                    )

                    existing = check_response.json() if check_response.status_code == 200 else []

                    if not existing:
                        new_txn = {
                            'user_id': txn['user_id'],
                            'description': txn['description'],
                            'amount': txn['amount'],
                            'currency': txn['currency'],
                            'exchange_rate_to_base': txn.get('exchange_rate_to_base', 1),
                            'type': txn['type'],
                            'maaser_percentage': txn.get('maaser_percentage'),
                            'maaser_amount': txn.get('maaser_amount'),
                            'recipient_name': txn.get('recipient_name'),
                            'date': next_date_str,
                            'is_recurring': True,
                            'recurring_frequency': frequency,
                            'recurring_end_date': txn.get('recurring_end_date'),
                            'created_at': datetime.now(timezone.utc).isoformat()
                        }

                        insert_response = await http_client.post(
                            f'{SUPABASE_URL}/rest/v1/transactions',
                            json=new_txn,
                            headers=headers
                        )

                        if insert_response.status_code in [200, 201]:
                            created_count += 1

        return CronResult(
            success=True,
            created=created_count,
            message=f"Successfully processed recurring transactions. Created {created_count} new entries."
        )

    except Exception as e:
        logger.error(f"Error processing recurring transactions: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
