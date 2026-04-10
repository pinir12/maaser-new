from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import httpx


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Supabase configuration
SUPABASE_URL = os.environ.get('SUPABASE_URL', 'https://mznzgekkzbollftoxfma.supabase.co')
SUPABASE_KEY = os.environ.get('SUPABASE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16bnpnZWtremJvbGxmdG94Zm1hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxNTA4MDE5OCwiZXhwIjoyMDMwNjU2MTk4fQ.GwDiacV8UXB6MJoSECjmZ_fObXB1lIVEJVsYGCdz5Ow')

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Exclude MongoDB's _id field from the query results
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks


# Cron job endpoint for processing recurring transactions
class CronResult(BaseModel):
    success: bool
    created: int
    message: str

@api_router.post("/cron/recurring", response_model=CronResult)
async def process_recurring_transactions():
    """
    Process all recurring transactions and create new entries for any that are due.
    This endpoint can be called by a cron job or scheduler.
    """
    try:
        headers = {
            'apikey': SUPABASE_KEY,
            'Authorization': f'Bearer {SUPABASE_KEY}',
            'Content-Type': 'application/json'
        }
        
        today = datetime.now(timezone.utc).date()
        today_str = today.isoformat()
        created_count = 0
        
        async with httpx.AsyncClient() as http_client:
            # Fetch all recurring transactions
            response = await http_client.get(
                f'{SUPABASE_URL}/rest/v1/transactions',
                params={
                    'is_recurring': 'eq.true',
                    'select': '*'
                },
                headers=headers
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=500, detail=f"Failed to fetch transactions: {response.text}")
            
            recurring_txns = response.json()
            
            for txn in recurring_txns:
                # Skip if end date has passed
                if txn.get('recurring_end_date'):
                    end_date = datetime.fromisoformat(txn['recurring_end_date']).date()
                    if end_date < today:
                        continue
                
                # Calculate next occurrence date
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
                        # Add one month
                        month = next_date.month + 1
                        year = next_date.year
                        if month > 12:
                            month = 1
                            year += 1
                        day = min(next_date.day, 28)  # Handle month length differences
                        next_date = next_date.replace(year=year, month=month, day=day)
                    elif frequency == 'yearly':
                        next_date = next_date.replace(year=next_date.year + 1)
                    else:
                        break
                    
                    if next_date > today:
                        break
                    
                    next_date_str = next_date.isoformat()
                    
                    # Check if transaction already exists for this date
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
                        # Create new transaction
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

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
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