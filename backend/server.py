from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import asyncio
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Any
import uuid
from datetime import datetime, timezone, timedelta
import httpx
import resend
import jwt
import bcrypt
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import hashlib
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB
mongo_url = os.environ['MONGO_URL']
mongo_client = AsyncIOMotorClient(mongo_url)
mongo_db = mongo_client[os.environ['DB_NAME']]

# Supabase (server-side only)
SUPABASE_URL = os.environ['SUPABASE_URL']
SUPABASE_KEY = os.environ['SUPABASE_KEY']

# Email
RESEND_API_KEY = os.environ.get('RESEND_API_KEY', '')
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'mail@pinir.co.uk')
resend.api_key = RESEND_API_KEY

# JWT
JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = 'HS256'
JWT_EXPIRY_DAYS = 30

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Currency cache
_rates_cache = {}
_rates_cache_time = {}
CACHE_TTL = 3600

# --- Encryption ---
ENCRYPTION_KEY = os.environ.get('ENCRYPTION_KEY', JWT_SECRET)
_enc_key = hashlib.sha256(ENCRYPTION_KEY.encode()).digest()  # 32 bytes for AES-256

def encrypt_value(text):
    if text is None or text == '':
        return text
    s = str(text)
    aesgcm = AESGCM(_enc_key)
    nonce = os.urandom(12)
    ct = aesgcm.encrypt(nonce, s.encode('utf-8'), None)
    return f"enc:{base64.b64encode(nonce).decode()}:{base64.b64encode(ct).decode()}"

def decrypt_value(text):
    if text is None or text == '':
        return text
    s = str(text)
    if not s.startswith('enc:'):
        return s
    parts = s.split(':', 2)
    if len(parts) != 3:
        return s
    nonce = base64.b64decode(parts[1])
    ct = base64.b64decode(parts[2])
    aesgcm = AESGCM(_enc_key)
    return aesgcm.decrypt(nonce, ct, None).decode('utf-8')

SENSITIVE_FIELDS = ['description', 'recipient_name']

def encrypt_transaction(data: dict) -> dict:
    enc = dict(data)
    for f in SENSITIVE_FIELDS:
        if f in enc and enc[f] is not None and not str(enc[f]).startswith('enc:'):
            enc[f] = encrypt_value(str(enc[f]))
    return enc

def decrypt_transaction(data: dict) -> dict:
    dec = dict(data)
    for f in SENSITIVE_FIELDS:
        if f in dec and dec[f] and str(dec[f]).startswith('enc:'):
            dec[f] = decrypt_value(dec[f])
    return dec

app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)


# --- Supabase helper ---
def supa_headers():
    return {
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    }


# --- JWT helpers ---
def create_token(user_id: str) -> str:
    payload = {
        'user_id': user_id,
        'exp': datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRY_DAYS),
        'iat': datetime.now(timezone.utc)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def verify_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = verify_token(credentials.credentials)
    return payload['user_id']


async def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = verify_token(credentials.credentials)
    user_id = payload['user_id']
    async with httpx.AsyncClient() as c:
        r = await c.get(
            f'{SUPABASE_URL}/rest/v1/users',
            params={'id': f'eq.{user_id}', 'select': 'is_admin'},
            headers=supa_headers()
        )
        users = r.json() if r.status_code == 200 else []
        if not users or not users[0].get('is_admin'):
            raise HTTPException(status_code=403, detail="Admin access required")
    return user_id


def strip_password(user: dict) -> dict:
    u = {k: v for k, v in user.items() if k != 'password_hash'}
    return u


# --- Models ---
class LoginRequest(BaseModel):
    email: str
    password: str

class SignupRequest(BaseModel):
    email: str
    password: str
    name: str
    base_currency: str = 'USD'

class TransactionCreate(BaseModel):
    description: str
    amount: float
    currency: str = 'USD'
    exchange_rate_to_base: float = 1
    date: str
    type: str
    maaser_percentage: Optional[float] = None
    maaser_amount: Optional[float] = None
    recipient_name: Optional[str] = None
    is_recurring: bool = False
    recurring_frequency: str = 'none'
    recurring_end_date: Optional[str] = None
    hebrew_date: Optional[str] = None

class TransactionUpdate(BaseModel):
    description: Optional[str] = None
    amount: Optional[float] = None
    currency: Optional[str] = None
    exchange_rate_to_base: Optional[float] = None
    date: Optional[str] = None
    type: Optional[str] = None
    maaser_percentage: Optional[float] = None
    maaser_amount: Optional[float] = None
    recipient_name: Optional[str] = None
    is_recurring: Optional[bool] = None
    recurring_frequency: Optional[str] = None
    recurring_end_date: Optional[str] = None
    hebrew_date: Optional[str] = None

class ContactRequest(BaseModel):
    name: str
    email: str
    message: str

class CronResult(BaseModel):
    success: bool
    created: int
    message: str

class StatusCheckCreate(BaseModel):
    client_name: str

class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ============ AUTH ============

@api_router.post("/auth/login")
async def login(req: LoginRequest):
    async with httpx.AsyncClient() as c:
        r = await c.get(
            f'{SUPABASE_URL}/rest/v1/users',
            params={'email': f'eq.{req.email.lower()}', 'select': '*', 'limit': '1'},
            headers=supa_headers()
        )
    if r.status_code != 200:
        raise HTTPException(status_code=500, detail="Database error")
    users = r.json()
    if not users:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    db_user = users[0]
    stored_hash = db_user.get('password_hash', '')
    if not stored_hash or not bcrypt.checkpw(req.password.encode('utf-8'), stored_hash.encode('utf-8')):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_token(str(db_user['id']))
    return {"token": token, "user": strip_password(db_user)}


@api_router.post("/auth/signup")
async def signup(req: SignupRequest):
    async with httpx.AsyncClient() as c:
        # Check existing
        r = await c.get(
            f'{SUPABASE_URL}/rest/v1/users',
            params={'email': f'eq.{req.email.lower()}', 'select': 'id', 'limit': '1'},
            headers=supa_headers()
        )
        if r.status_code == 200 and r.json():
            raise HTTPException(status_code=409, detail="Email already registered")

        # Hash password
        pw_hash = bcrypt.hashpw(req.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        new_user = {
            'email': req.email.lower(),
            'password_hash': pw_hash,
            'name': req.name,
            'base_currency': req.base_currency,
            'distribution_mode': 'both',
            'default_view': 'month',
            'use_hebrew_calendar': False,
            'default_maaser_percentage': 10,
            'give_ratio': 50,
            'lend_ratio': 50,
            'is_admin': False,
            'created_at': datetime.now(timezone.utc).isoformat()
        }

        r = await c.post(
            f'{SUPABASE_URL}/rest/v1/users',
            json=new_user,
            headers=supa_headers()
        )
        if r.status_code not in [200, 201]:
            raise HTTPException(status_code=500, detail=f"Failed to create user: {r.text}")

        created = r.json()
        created_user = created[0] if isinstance(created, list) else created
        token = create_token(str(created_user['id']))

        # Admin notification (fire and forget)
        try:
            if RESEND_API_KEY:
                _send_signup_email(req.name, req.email.lower())
        except Exception:
            pass

        return {"token": token, "user": strip_password(created_user)}


def _send_signup_email(name, email):
    html = f"""
    <div style="font-family: -apple-system, sans-serif; max-width: 500px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 24px; border-radius: 12px 12px 0 0; color: white;">
        <h2 style="margin: 0;">New User Registration</h2>
      </div>
      <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-radius: 0 0 12px 12px;">
        <p><strong>Name:</strong> {name}</p>
        <p><strong>Email:</strong> {email}</p>
        <p><strong>Time:</strong> {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}</p>
      </div>
    </div>"""
    try:
        resend.Emails.send({
            "from": "Finance Tracker <onboarding@resend.dev>",
            "to": [ADMIN_EMAIL],
            "subject": f"New Signup: {name}",
            "html": html
        })
    except Exception as e:
        logger.error(f"Signup email failed: {e}")


# ============ TRANSACTIONS ============

@api_router.get("/transactions")
async def get_transactions(user_id: str = Depends(get_current_user)):
    async with httpx.AsyncClient() as c:
        r = await c.get(
            f'{SUPABASE_URL}/rest/v1/transactions',
            params={'user_id': f'eq.{user_id}', 'select': '*', 'order': 'date.desc'},
            headers=supa_headers()
        )
    if r.status_code != 200:
        raise HTTPException(status_code=500, detail="Failed to fetch transactions")
    return [decrypt_transaction(t) for t in r.json()]


@api_router.post("/transactions")
async def create_transaction(txn: TransactionCreate, user_id: str = Depends(get_current_user)):
    data = txn.model_dump(exclude_none=True)
    data['user_id'] = user_id
    data['created_at'] = datetime.now(timezone.utc).isoformat()
    if 'maaser_percentage' in data and data['maaser_percentage'] is not None:
        data['maaser_percentage'] = int(data['maaser_percentage'])

    data = encrypt_transaction(data)

    async with httpx.AsyncClient() as c:
        r = await c.post(
            f'{SUPABASE_URL}/rest/v1/transactions',
            json=data,
            headers=supa_headers()
        )
    if r.status_code not in [200, 201]:
        raise HTTPException(status_code=500, detail=f"Failed to create transaction: {r.text}")
    result = r.json()
    raw = result[0] if isinstance(result, list) else result
    return decrypt_transaction(raw)


@api_router.put("/transactions/{txn_id}")
async def update_transaction(txn_id: str, txn: TransactionUpdate, user_id: str = Depends(get_current_user)):
    data = txn.model_dump(exclude_none=True)
    data['updated_at'] = datetime.now(timezone.utc).isoformat()
    if 'maaser_percentage' in data and data['maaser_percentage'] is not None:
        data['maaser_percentage'] = int(data['maaser_percentage'])

    data = encrypt_transaction(data)

    async with httpx.AsyncClient() as c:
        r = await c.patch(
            f'{SUPABASE_URL}/rest/v1/transactions',
            params={'id': f'eq.{txn_id}', 'user_id': f'eq.{user_id}'},
            json=data,
            headers=supa_headers()
        )
    if r.status_code not in [200, 204]:
        raise HTTPException(status_code=500, detail="Failed to update transaction")
    result = r.json()
    return result[0] if isinstance(result, list) and result else {"success": True}


@api_router.delete("/transactions/{txn_id}")
async def delete_transaction(txn_id: str, user_id: str = Depends(get_current_user)):
    async with httpx.AsyncClient() as c:
        r = await c.delete(
            f'{SUPABASE_URL}/rest/v1/transactions',
            params={'id': f'eq.{txn_id}', 'user_id': f'eq.{user_id}'},
            headers=supa_headers()
        )
    if r.status_code not in [200, 204]:
        raise HTTPException(status_code=500, detail="Failed to delete transaction")
    return {"success": True}



@api_router.post("/transactions/import")
async def import_transactions(request: Request, user_id: str = Depends(get_current_user)):
    body = await request.json()
    txns = body.get('transactions', [])
    if not txns:
        raise HTTPException(status_code=400, detail="No transactions to import")

    imported = 0
    errors = []
    async with httpx.AsyncClient() as c:
        for txn in txns:
            data = encrypt_transaction({
                'user_id': user_id,
                'description': txn.get('description', ''),
                'amount': float(txn.get('amount', 0)),
                'currency': txn.get('currency', 'GBP'),
                'exchange_rate_to_base': txn.get('exchange_rate_to_base', 1),
                'type': txn.get('type', 'income'),
                'recipient_name': txn.get('recipient_name', ''),
                'date': txn.get('date'),
                'maaser_percentage': int(txn.get('maaser_percentage', 10)),
                'is_recurring': False,
                'recurring_frequency': 'none',
                'created_at': datetime.now(timezone.utc).isoformat(),
            })
            try:
                r = await c.post(f'{SUPABASE_URL}/rest/v1/transactions', json=data, headers=supa_headers())
                if r.status_code in [200, 201]:
                    imported += 1
                else:
                    errors.append({'description': txn.get('description'), 'error': r.text})
            except Exception as e:
                errors.append({'description': txn.get('description'), 'error': str(e)})

    return {'imported': imported, 'errors': errors, 'total': len(txns)}


# ============ USER SETTINGS ============

@api_router.get("/user/settings")
async def get_user_settings(user_id: str = Depends(get_current_user)):
    async with httpx.AsyncClient() as c:
        r = await c.get(
            f'{SUPABASE_URL}/rest/v1/users',
            params={'id': f'eq.{user_id}', 'select': '*'},
            headers=supa_headers()
        )
    if r.status_code != 200 or not r.json():
        raise HTTPException(status_code=404, detail="User not found")
    return strip_password(r.json()[0])


@api_router.put("/user/settings")
async def update_user_settings(request: Request, user_id: str = Depends(get_current_user)):
    updates = await request.json()
    # Only allow safe fields
    allowed = {'base_currency', 'distribution_mode', 'default_view', 'use_hebrew_calendar',
               'default_maaser_percentage', 'give_ratio', 'lend_ratio', 'name'}
    safe_updates = {k: v for k, v in updates.items() if k in allowed}
    if not safe_updates:
        raise HTTPException(status_code=400, detail="No valid fields to update")

    async with httpx.AsyncClient() as c:
        r = await c.patch(
            f'{SUPABASE_URL}/rest/v1/users',
            params={'id': f'eq.{user_id}'},
            json=safe_updates,
            headers=supa_headers()
        )
    if r.status_code not in [200, 204]:
        raise HTTPException(status_code=500, detail="Failed to update settings")
    result = r.json()
    if isinstance(result, list) and result:
        return strip_password(result[0])
    return {"success": True}


# ============ ADMIN ============

@api_router.get("/admin/users")
async def admin_list_users(admin_id: str = Depends(get_current_admin)):
    async with httpx.AsyncClient() as c:
        r = await c.get(
            f'{SUPABASE_URL}/rest/v1/users',
            params={'select': 'id,name,email,base_currency,created_at,is_admin', 'order': 'created_at.desc'},
            headers=supa_headers()
        )
    if r.status_code != 200:
        raise HTTPException(status_code=500, detail="Failed to fetch users")
    return r.json()


@api_router.put("/admin/users/{target_id}")
async def admin_update_user(target_id: int, request: Request, admin_id: str = Depends(get_current_admin)):
    updates = await request.json()
    allowed = {'is_admin', 'name', 'email', 'base_currency'}
    safe_updates = {k: v for k, v in updates.items() if k in allowed}

    async with httpx.AsyncClient() as c:
        r = await c.patch(
            f'{SUPABASE_URL}/rest/v1/users',
            params={'id': f'eq.{target_id}'},
            json=safe_updates,
            headers=supa_headers()
        )
    if r.status_code not in [200, 204]:
        raise HTTPException(status_code=500, detail="Failed to update user")
    return {"success": True}


@api_router.delete("/admin/users/{target_id}")
async def admin_delete_user(target_id: int, admin_id: str = Depends(get_current_admin)):
    async with httpx.AsyncClient() as c:
        await c.delete(
            f'{SUPABASE_URL}/rest/v1/transactions',
            params={'user_id': f'eq.{target_id}'},
            headers=supa_headers()
        )
        r = await c.delete(
            f'{SUPABASE_URL}/rest/v1/users',
            params={'id': f'eq.{target_id}'},
            headers=supa_headers()
        )
    if r.status_code not in [200, 204]:
        raise HTTPException(status_code=500, detail="Failed to delete user")
    return {"success": True}


# ============ RECURRING (autofill + management) ============

@api_router.get("/transactions/recurring")
async def get_recurring_transactions(user_id: str = Depends(get_current_user)):
    async with httpx.AsyncClient() as c:
        r = await c.get(
            f'{SUPABASE_URL}/rest/v1/transactions',
            params={'user_id': f'eq.{user_id}', 'is_recurring': 'eq.true', 'select': '*', 'order': 'date.asc'},
            headers=supa_headers()
        )
    if r.status_code != 200:
        raise HTTPException(status_code=500, detail="Failed to fetch recurring")
    return [decrypt_transaction(t) for t in r.json()]


@api_router.put("/transactions/recurring/bulk-update")
async def bulk_update_recurring(request: Request, user_id: str = Depends(get_current_user)):
    body = await request.json()
    description = body.get('description')
    txn_type = body.get('type')
    updates = body.get('updates', {})
    if not description or not txn_type or not updates:
        raise HTTPException(status_code=400, detail="Missing required fields")

    updates['updated_at'] = datetime.now(timezone.utc).isoformat()

    async with httpx.AsyncClient() as c:
        r = await c.patch(
            f'{SUPABASE_URL}/rest/v1/transactions',
            params={
                'user_id': f'eq.{user_id}',
                'description': f'eq.{description}',
                'type': f'eq.{txn_type}',
                'is_recurring': 'eq.true'
            },
            json=updates,
            headers=supa_headers()
        )
    if r.status_code not in [200, 204]:
        raise HTTPException(status_code=500, detail="Failed to bulk update")
    return {"success": True}


@api_router.delete("/transactions/recurring/bulk-delete")
async def bulk_delete_recurring(request: Request, user_id: str = Depends(get_current_user)):
    body = await request.json()
    description = body.get('description')
    txn_type = body.get('type')
    if not description or not txn_type:
        raise HTTPException(status_code=400, detail="Missing required fields")

    async with httpx.AsyncClient() as c:
        r = await c.delete(
            f'{SUPABASE_URL}/rest/v1/transactions',
            params={
                'user_id': f'eq.{user_id}',
                'description': f'eq.{description}',
                'type': f'eq.{txn_type}',
                'is_recurring': 'eq.true'
            },
            headers=supa_headers()
        )
    if r.status_code not in [200, 204]:
        raise HTTPException(status_code=500, detail="Failed to bulk delete")
    return {"success": True}


# ============ AUTOFILL ============

@api_router.get("/transactions/suggestions")
async def get_suggestions(user_id: str = Depends(get_current_user)):
    """Return deduplicated past transactions for autofill."""
    async with httpx.AsyncClient() as c:
        r = await c.get(
            f'{SUPABASE_URL}/rest/v1/transactions',
            params={
                'user_id': f'eq.{user_id}',
                'select': 'description,amount,currency,recipient_name,type,maaser_percentage',
                'order': 'created_at.desc',
                'limit': '200'
            },
            headers=supa_headers()
        )
    if r.status_code != 200:
        return []
    data = [decrypt_transaction(t) for t in r.json()]
    seen = {}
    for t in data:
        key = (t.get('description') or '').lower()
        if key and key not in seen:
            seen[key] = t
    return list(seen.values())


# ============ EMAIL ============

@api_router.post("/email/contact")
async def send_contact_email(data: ContactRequest):
    if not RESEND_API_KEY:
        raise HTTPException(status_code=500, detail="Email not configured")

    html = f"""
    <div style="font-family: -apple-system, sans-serif; max-width: 500px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 24px; border-radius: 12px 12px 0 0; color: white;">
        <h2 style="margin: 0;">Contact Form</h2>
      </div>
      <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-radius: 0 0 12px 12px;">
        <p><strong>From:</strong> {data.name}</p>
        <p><strong>Email:</strong> {data.email}</p>
        <p><strong>Message:</strong></p>
        <div style="background: white; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0;">{data.message}</div>
      </div>
    </div>"""

    try:
        email = await asyncio.to_thread(resend.Emails.send, {
            "from": "Finance Tracker <onboarding@resend.dev>",
            "to": [ADMIN_EMAIL],
            "subject": f"Contact: {data.name}",
            "html": html
        })
        return {"status": "success", "email_id": email.get("id") if isinstance(email, dict) else str(email)}
    except Exception as e:
        logger.error(f"Contact email failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============ CURRENCY ============

@api_router.get("/currency/rates/{base}")
async def get_currency_rates(base: str):
    base = base.upper()
    now = datetime.now(timezone.utc).timestamp()
    if base in _rates_cache and (now - _rates_cache_time.get(base, 0)) < CACHE_TTL:
        return _rates_cache[base]
    try:
        async with httpx.AsyncClient(timeout=10.0) as c:
            r = await c.get(f"https://open.er-api.com/v6/latest/{base}")
            if r.status_code == 200:
                data = r.json()
                result = {"base": base, "rates": data.get("rates", {}), "updated_at": data.get("time_last_update_utc", "")}
                _rates_cache[base] = result
                _rates_cache_time[base] = now
                return result
    except Exception as e:
        logger.error(f"Currency API error: {e}")
    if base in _rates_cache:
        return _rates_cache[base]
    raise HTTPException(status_code=502, detail="Failed to fetch exchange rates")


# ============ CRON ============

@api_router.post("/cron/recurring", response_model=CronResult)
async def process_recurring_transactions():
    headers = supa_headers()
    today = datetime.now(timezone.utc).date()
    created_count = 0

    async with httpx.AsyncClient() as c:
        r = await c.get(
            f'{SUPABASE_URL}/rest/v1/transactions',
            params={'is_recurring': 'eq.true', 'select': '*'},
            headers=headers
        )
        if r.status_code != 200:
            raise HTTPException(status_code=500, detail="Failed to fetch recurring")

        for raw_txn in r.json():
            txn = decrypt_transaction(raw_txn)
            if txn.get('recurring_end_date'):
                try:
                    if datetime.fromisoformat(txn['recurring_end_date']).date() < today:
                        continue
                except Exception:
                    continue

            last_date = datetime.fromisoformat(txn['date']).date()
            next_date = last_date
            freq = txn.get('recurring_frequency', 'monthly')

            while next_date <= today:
                if freq == 'daily': next_date += timedelta(days=1)
                elif freq == 'weekly': next_date += timedelta(weeks=1)
                elif freq == 'biweekly': next_date += timedelta(weeks=2)
                elif freq == 'monthly':
                    m, y = next_date.month + 1, next_date.year
                    if m > 12: m, y = 1, y + 1
                    next_date = next_date.replace(year=y, month=m, day=min(next_date.day, 28))
                elif freq == 'yearly': next_date = next_date.replace(year=next_date.year + 1)
                else: break

                if next_date > today: break

                ds = next_date.isoformat()
                check = await c.get(
                    f'{SUPABASE_URL}/rest/v1/transactions',
                    params={'user_id': f'eq.{txn["user_id"]}', 'description': f'eq.{txn["description"]}', 'date': f'eq.{ds}', 'select': 'id'},
                    headers=headers
                )
                if check.status_code == 200 and not check.json():
                    new_txn = encrypt_transaction({
                        'user_id': txn['user_id'], 'description': txn['description'],
                        'amount': txn['amount'], 'currency': txn['currency'],
                        'exchange_rate_to_base': txn.get('exchange_rate_to_base', 1),
                        'type': txn['type'], 'maaser_percentage': txn.get('maaser_percentage'),
                        'maaser_amount': txn.get('maaser_amount'), 'recipient_name': txn.get('recipient_name'),
                        'date': ds, 'is_recurring': True, 'recurring_frequency': freq,
                        'recurring_end_date': txn.get('recurring_end_date'),
                        'created_at': datetime.now(timezone.utc).isoformat()
                    })
                    ins = await c.post(f'{SUPABASE_URL}/rest/v1/transactions', json=new_txn, headers=headers)
                    if ins.status_code in [200, 201]: created_count += 1

    return CronResult(success=True, created=created_count, message=f"Created {created_count} recurring entries")


@api_router.post("/cron/monthly-summary")
async def send_monthly_summary():
    """Send monthly maaser summary to all users with email."""
    if not RESEND_API_KEY:
        raise HTTPException(status_code=500, detail="Email not configured")

    headers = supa_headers()
    sent_count = 0
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    if now.month == 1:
        prev_start = month_start.replace(year=now.year - 1, month=12)
    else:
        prev_start = month_start.replace(month=now.month - 1)
    prev_end = month_start - timedelta(seconds=1)

    async with httpx.AsyncClient() as c:
        r = await c.get(f'{SUPABASE_URL}/rest/v1/users', params={'select': '*'}, headers=headers)
        if r.status_code != 200:
            raise HTTPException(status_code=500, detail="Failed to fetch users")

        for user in r.json():
            user_email = user.get('email')
            if not user_email:
                continue

            base = user.get('base_currency', 'USD')
            tr = await c.get(
                f'{SUPABASE_URL}/rest/v1/transactions',
                params={
                    'user_id': f'eq.{user["id"]}',
                    'date': f'gte.{prev_start.date().isoformat()}',
                    'date': f'lte.{prev_end.date().isoformat()}',
                    'select': '*'
                },
                headers=headers
            )
            # Fix: Supabase doesn't support duplicate param keys via httpx params dict
            # Use the range filter instead
            tr = await c.get(
                f'{SUPABASE_URL}/rest/v1/transactions?user_id=eq.{user["id"]}&date=gte.{prev_start.date().isoformat()}&date=lte.{prev_end.date().isoformat()}&select=*',
                headers=headers
            )
            txns = [decrypt_transaction(t) for t in tr.json()] if tr.status_code == 200 else []

            income = 0
            maaser_gen = 0
            given = 0
            lent = 0
            for t in txns:
                norm = t['amount'] * (t.get('exchange_rate_to_base', 1) if t.get('currency') != base else 1)
                if t['type'] == 'income':
                    income += norm
                    maaser_gen += norm * ((t.get('maaser_percentage') or 10) / 100)
                elif t['type'] == 'give':
                    given += norm
                elif t['type'] == 'lend':
                    lent += norm

            balance = maaser_gen - given - lent
            month_name = prev_start.strftime('%B %Y')

            sym_map = {'USD': '$', 'ILS': '\u20aa', 'GBP': '\u00a3', 'EUR': '\u20ac'}
            sym = sym_map.get(base, base + ' ')

            html = f"""
            <div style="font-family: -apple-system, sans-serif; max-width: 500px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 24px; border-radius: 12px 12px 0 0; color: white;">
                <h2 style="margin: 0;">Maaser Summary - {month_name}</h2>
              </div>
              <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-radius: 0 0 12px 12px;">
                <p>Hi {user.get('name', 'there')},</p>
                <table style="width:100%; border-collapse: collapse; margin: 16px 0;">
                  <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 8px 0; color: #10b981; font-weight: 600;">Income</td>
                    <td style="padding: 8px 0; text-align: right;">{sym}{income:,.2f}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 8px 0; color: #f59e0b; font-weight: 600;">Maaser Generated</td>
                    <td style="padding: 8px 0; text-align: right;">{sym}{maaser_gen:,.2f}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 8px 0; color: #3b82f6; font-weight: 600;">Given</td>
                    <td style="padding: 8px 0; text-align: right;">{sym}{given:,.2f}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 8px 0; color: #ef4444; font-weight: 600;">Lent</td>
                    <td style="padding: 8px 0; text-align: right;">{sym}{lent:,.2f}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; font-weight: 700; font-size: 16px;">Remaining Balance</td>
                    <td style="padding: 12px 0; text-align: right; font-weight: 700; font-size: 16px; color: {'#10b981' if balance >= 0 else '#ef4444'};">{sym}{balance:,.2f}</td>
                  </tr>
                </table>
                <p style="color: #64748b; font-size: 13px;">This is your monthly maaser recap. Keep up the great work!</p>
              </div>
            </div>"""

            try:
                await asyncio.to_thread(resend.Emails.send, {
                    "from": "Finance Tracker <onboarding@resend.dev>",
                    "to": [user_email],
                    "subject": f"Your Maaser Summary - {month_name}",
                    "html": html
                })
                sent_count += 1
                logger.info(f"Monthly summary sent to {user_email}")
            except Exception as e:
                logger.error(f"Failed to send summary to {user_email}: {e}")

    return {"success": True, "sent": sent_count, "message": f"Sent {sent_count} monthly summaries"}


# ============ STATUS (keep for health checks) ============

@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_obj = StatusCheck(**input.model_dump())
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    await mongo_db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    checks = await mongo_db.status_checks.find({}, {"_id": 0}).to_list(1000)
    for c in checks:
        if isinstance(c['timestamp'], str):
            c['timestamp'] = datetime.fromisoformat(c['timestamp'])
    return checks


# ============ APP SETUP ============

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
    mongo_client.close()
