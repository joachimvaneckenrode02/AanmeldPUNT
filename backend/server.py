from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
from io import BytesIO
import pandas as pd

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'school-study-secret-key-change-in-production')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Create the main app
app = FastAPI(title="School Study Registration System")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============ MODELS ============

# User Models
class UserRole:
    TEACHER = "teacher"
    ADMIN = "admin"
    EDUCATOR = "educator"

class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: str = UserRole.TEACHER

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    confirmPassword: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    email: str
    role: str
    isActive: bool
    createdAt: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    isActive: Optional[bool] = None

# Class Models
class ClassBase(BaseModel):
    name: str
    isActive: bool = True

class ClassCreate(ClassBase):
    pass

class ClassResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    isActive: bool
    createdAt: str
    updatedAt: str

# Study Type Models
class StudyTypeBase(BaseModel):
    mainType: str
    subType: Optional[str] = None
    key: str
    isActive: bool = True
    defaultCapacity: int = 20
    defaultStartTime: str = "15:30"
    defaultEndTime: str = "17:00"
    colorLabel: Optional[str] = None

class StudyTypeCreate(StudyTypeBase):
    pass

class StudyTypeResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    mainType: str
    subType: Optional[str] = None
    key: str
    isActive: bool
    defaultCapacity: int
    defaultStartTime: str
    defaultEndTime: str
    colorLabel: Optional[str] = None
    createdAt: str
    updatedAt: str

# Availability Rule Models
class AvailabilityRuleBase(BaseModel):
    studyTypeId: str
    weekday: int  # 0=Monday, 6=Sunday
    validFrom: str  # ISO date
    validUntil: str  # ISO date
    startTime: str
    endTime: str
    defaultCapacity: int = 20
    isActive: bool = True
    notes: Optional[str] = None

class AvailabilityRuleCreate(AvailabilityRuleBase):
    pass

class AvailabilityRuleResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    studyTypeId: str
    weekday: int
    validFrom: str
    validUntil: str
    startTime: str
    endTime: str
    defaultCapacity: int
    isActive: bool
    notes: Optional[str] = None
    createdAt: str
    updatedAt: str

# Exclusion Date Models
class ExclusionDateBase(BaseModel):
    date: str  # ISO date
    reason: str
    isActive: bool = True

class ExclusionDateCreate(ExclusionDateBase):
    pass

class ExclusionDateResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    date: str
    reason: str
    isActive: bool
    createdAt: str
    updatedAt: str

# Study Moment Models
class StudyMomentBase(BaseModel):
    date: str  # ISO date
    weekday: int
    studyTypeId: str
    labelFull: str
    startTime: str
    endTime: str
    capacity: int
    isActive: bool = True
    notes: Optional[str] = None
    generatedFromRuleId: Optional[str] = None

class StudyMomentCreate(StudyMomentBase):
    pass

class StudyMomentResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    date: str
    weekday: int
    studyTypeId: str
    labelFull: str
    startTime: str
    endTime: str
    capacity: int
    currentRegistrations: int = 0
    isActive: bool
    notes: Optional[str] = None
    generatedFromRuleId: Optional[str] = None
    createdAt: str
    updatedAt: str

# Registration Models
class RegistrationStatus:
    REGISTERED = "registered"
    CANCELLED = "cancelled"
    COMPLETED = "completed"

class RegistrationBase(BaseModel):
    teacherName: str
    teacherEmail: EmailStr
    studentName: str
    studentEmail: Optional[str] = None
    classId: str
    studyTypeId: str
    studyMomentId: str
    note: Optional[str] = None

class RegistrationCreate(RegistrationBase):
    pass

class RegistrationResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    teacherName: str
    teacherEmail: str
    studentName: str
    studentEmail: Optional[str] = None
    classId: str
    className: Optional[str] = None
    studyTypeId: str
    studyLabelSnapshot: str
    date: str
    startTime: str
    endTime: str
    studyMomentId: str
    status: str
    note: Optional[str] = None
    confirmationEmailSent: bool
    absenceEmailSent: bool
    createdAt: str
    updatedAt: str

class RegistrationUpdate(BaseModel):
    status: Optional[str] = None
    note: Optional[str] = None

# Attendance Models
class AttendanceBase(BaseModel):
    registrationId: str
    studyMomentId: str
    isPresent: bool
    note: Optional[str] = None

class AttendanceCreate(AttendanceBase):
    pass

class AttendanceUpdate(BaseModel):
    isPresent: bool
    note: Optional[str] = None

class AttendanceResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    registrationId: str
    studyMomentId: str
    date: str
    studentNameSnapshot: str
    classSnapshot: str
    teacherEmailSnapshot: str
    isPresent: bool
    checkedAt: Optional[str] = None
    checkedByUserId: Optional[str] = None
    note: Optional[str] = None
    createdAt: str
    updatedAt: str

# Email Template Models
class EmailTemplateBase(BaseModel):
    templateKey: str
    subject: str
    body: str
    isActive: bool = True

class EmailTemplateCreate(EmailTemplateBase):
    pass

class EmailTemplateResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    templateKey: str
    subject: str
    body: str
    isActive: bool
    createdAt: str
    updatedAt: str

# Generate Study Moments Request
class GenerateMomentsRequest(BaseModel):
    startDate: str
    endDate: str
    studyTypeIds: Optional[List[str]] = None

# ============ HELPERS ============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Ongeldige token")
        
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="Gebruiker niet gevonden")
        if not user.get("isActive", True):
            raise HTTPException(status_code=401, detail="Account is gedeactiveerd")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token is verlopen")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Ongeldige token")

async def require_admin(user: dict = Depends(get_current_user)):
    if user.get("role") != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin rechten vereist")
    return user

async def require_educator_or_admin(user: dict = Depends(get_current_user)):
    if user.get("role") not in [UserRole.ADMIN, UserRole.EDUCATOR]:
        raise HTTPException(status_code=403, detail="Opvoeder of admin rechten vereist")
    return user

def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

async def log_audit(user_id: str, action: str, entity_type: str, entity_id: str, metadata: dict = None):
    await db.audit_logs.insert_one({
        "id": str(uuid.uuid4()),
        "userId": user_id,
        "action": action,
        "entityType": entity_type,
        "entityId": entity_id,
        "metadata": metadata or {},
        "createdAt": now_iso()
    })

# ============ AUTH ROUTES ============

@api_router.post("/auth/register", response_model=dict)
async def register(data: UserCreate):
    if data.password != data.confirmPassword:
        raise HTTPException(status_code=400, detail="Wachtwoorden komen niet overeen")
    
    if len(data.password) < 6:
        raise HTTPException(status_code=400, detail="Wachtwoord moet minimaal 6 karakters bevatten")
    
    existing = await db.users.find_one({"email": data.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="E-mailadres is al in gebruik")
    
    user_id = str(uuid.uuid4())
    now = now_iso()
    
    # First user becomes admin
    user_count = await db.users.count_documents({})
    role = UserRole.ADMIN if user_count == 0 else UserRole.TEACHER
    
    user_doc = {
        "id": user_id,
        "name": data.name,
        "email": data.email.lower(),
        "passwordHash": hash_password(data.password),
        "role": role,
        "isActive": True,
        "createdAt": now,
        "updatedAt": now
    }
    
    await db.users.insert_one(user_doc)
    token = create_token(user_id, role)
    
    return {
        "token": token,
        "user": {
            "id": user_id,
            "name": data.name,
            "email": data.email.lower(),
            "role": role,
            "isActive": True,
            "createdAt": now
        }
    }

@api_router.post("/auth/login", response_model=dict)
async def login(data: UserLogin):
    user = await db.users.find_one({"email": data.email.lower()}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Ongeldige inloggegevens")
    
    if not verify_password(data.password, user.get("passwordHash", "")):
        raise HTTPException(status_code=401, detail="Ongeldige inloggegevens")
    
    if not user.get("isActive", True):
        raise HTTPException(status_code=401, detail="Account is gedeactiveerd")
    
    token = create_token(user["id"], user["role"])
    
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "role": user["role"],
            "isActive": user["isActive"],
            "createdAt": user["createdAt"]
        }
    }

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    return UserResponse(
        id=user["id"],
        name=user["name"],
        email=user["email"],
        role=user["role"],
        isActive=user["isActive"],
        createdAt=user["createdAt"]
    )

# ============ CLASSES ROUTES ============

@api_router.get("/classes", response_model=List[ClassResponse])
async def get_classes(user: dict = Depends(get_current_user), includeInactive: bool = False):
    query = {} if includeInactive else {"isActive": True}
    classes = await db.classes.find(query, {"_id": 0}).sort("name", 1).to_list(1000)
    return classes

@api_router.post("/classes", response_model=ClassResponse)
async def create_class(data: ClassCreate, user: dict = Depends(require_admin)):
    now = now_iso()
    class_doc = {
        "id": str(uuid.uuid4()),
        "name": data.name,
        "isActive": data.isActive,
        "createdAt": now,
        "updatedAt": now
    }
    await db.classes.insert_one(class_doc)
    await log_audit(user["id"], "create", "class", class_doc["id"], {"name": data.name})
    return {k: v for k, v in class_doc.items() if k != "_id"}

@api_router.put("/classes/{class_id}", response_model=ClassResponse)
async def update_class(class_id: str, data: ClassCreate, user: dict = Depends(require_admin)):
    existing = await db.classes.find_one({"id": class_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Klas niet gevonden")
    
    now = now_iso()
    await db.classes.update_one(
        {"id": class_id},
        {"$set": {"name": data.name, "isActive": data.isActive, "updatedAt": now}}
    )
    await log_audit(user["id"], "update", "class", class_id, {"name": data.name})
    
    updated = await db.classes.find_one({"id": class_id}, {"_id": 0})
    return updated

@api_router.delete("/classes/{class_id}")
async def delete_class(class_id: str, user: dict = Depends(require_admin)):
    existing = await db.classes.find_one({"id": class_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Klas niet gevonden")
    
    # Soft delete - just deactivate
    await db.classes.update_one({"id": class_id}, {"$set": {"isActive": False, "updatedAt": now_iso()}})
    await log_audit(user["id"], "delete", "class", class_id)
    return {"success": True}

@api_router.post("/classes/import")
async def import_classes(file: UploadFile = File(...), user: dict = Depends(require_admin)):
    if not file.filename.endswith(('.xlsx', '.xls', '.csv')):
        raise HTTPException(status_code=400, detail="Alleen Excel of CSV bestanden toegestaan")
    
    contents = await file.read()
    try:
        if file.filename.endswith('.csv'):
            df = pd.read_csv(BytesIO(contents))
        else:
            df = pd.read_excel(BytesIO(contents))
        
        # Expect a column named 'name' or 'klas' or 'class'
        name_col = None
        for col in ['name', 'naam', 'klas', 'class', 'Klas', 'Name', 'Naam']:
            if col in df.columns:
                name_col = col
                break
        
        if not name_col:
            raise HTTPException(status_code=400, detail="Kolom 'naam' of 'klas' niet gevonden")
        
        now = now_iso()
        imported = 0
        skipped = 0
        
        for _, row in df.iterrows():
            class_name = str(row[name_col]).strip()
            if not class_name or class_name == 'nan':
                continue
            
            existing = await db.classes.find_one({"name": class_name})
            if existing:
                skipped += 1
                continue
            
            class_doc = {
                "id": str(uuid.uuid4()),
                "name": class_name,
                "isActive": True,
                "createdAt": now,
                "updatedAt": now
            }
            await db.classes.insert_one(class_doc)
            imported += 1
        
        await log_audit(user["id"], "import", "classes", "", {"imported": imported, "skipped": skipped})
        return {"success": True, "imported": imported, "skipped": skipped}
    
    except Exception as e:
        logger.error(f"Import error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Fout bij importeren: {str(e)}")

# ============ STUDY TYPES ROUTES ============

@api_router.get("/study-types", response_model=List[StudyTypeResponse])
async def get_study_types(user: dict = Depends(get_current_user), includeInactive: bool = False):
    query = {} if includeInactive else {"isActive": True}
    types = await db.study_types.find(query, {"_id": 0}).sort("mainType", 1).to_list(1000)
    return types

@api_router.post("/study-types", response_model=StudyTypeResponse)
async def create_study_type(data: StudyTypeCreate, user: dict = Depends(require_admin)):
    existing = await db.study_types.find_one({"key": data.key})
    if existing:
        raise HTTPException(status_code=400, detail="Studie met deze sleutel bestaat al")
    
    now = now_iso()
    doc = {
        "id": str(uuid.uuid4()),
        **data.model_dump(),
        "createdAt": now,
        "updatedAt": now
    }
    await db.study_types.insert_one(doc)
    await log_audit(user["id"], "create", "study_type", doc["id"], {"key": data.key})
    return {k: v for k, v in doc.items() if k != "_id"}

@api_router.put("/study-types/{type_id}", response_model=StudyTypeResponse)
async def update_study_type(type_id: str, data: StudyTypeCreate, user: dict = Depends(require_admin)):
    existing = await db.study_types.find_one({"id": type_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Studietype niet gevonden")
    
    now = now_iso()
    update_data = data.model_dump()
    update_data["updatedAt"] = now
    
    await db.study_types.update_one({"id": type_id}, {"$set": update_data})
    await log_audit(user["id"], "update", "study_type", type_id)
    
    updated = await db.study_types.find_one({"id": type_id}, {"_id": 0})
    return updated

@api_router.delete("/study-types/{type_id}")
async def delete_study_type(type_id: str, user: dict = Depends(require_admin)):
    existing = await db.study_types.find_one({"id": type_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Studietype niet gevonden")
    
    await db.study_types.update_one({"id": type_id}, {"$set": {"isActive": False, "updatedAt": now_iso()}})
    await log_audit(user["id"], "delete", "study_type", type_id)
    return {"success": True}

# ============ AVAILABILITY RULES ROUTES ============

@api_router.get("/availability-rules", response_model=List[AvailabilityRuleResponse])
async def get_availability_rules(user: dict = Depends(get_current_user), includeInactive: bool = False):
    query = {} if includeInactive else {"isActive": True}
    rules = await db.availability_rules.find(query, {"_id": 0}).to_list(1000)
    return rules

@api_router.post("/availability-rules", response_model=AvailabilityRuleResponse)
async def create_availability_rule(data: AvailabilityRuleCreate, user: dict = Depends(require_admin)):
    study_type = await db.study_types.find_one({"id": data.studyTypeId})
    if not study_type:
        raise HTTPException(status_code=400, detail="Studietype niet gevonden")
    
    now = now_iso()
    doc = {
        "id": str(uuid.uuid4()),
        **data.model_dump(),
        "createdAt": now,
        "updatedAt": now
    }
    await db.availability_rules.insert_one(doc)
    await log_audit(user["id"], "create", "availability_rule", doc["id"])
    return {k: v for k, v in doc.items() if k != "_id"}

@api_router.put("/availability-rules/{rule_id}", response_model=AvailabilityRuleResponse)
async def update_availability_rule(rule_id: str, data: AvailabilityRuleCreate, user: dict = Depends(require_admin)):
    existing = await db.availability_rules.find_one({"id": rule_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Regel niet gevonden")
    
    now = now_iso()
    update_data = data.model_dump()
    update_data["updatedAt"] = now
    
    await db.availability_rules.update_one({"id": rule_id}, {"$set": update_data})
    await log_audit(user["id"], "update", "availability_rule", rule_id)
    
    updated = await db.availability_rules.find_one({"id": rule_id}, {"_id": 0})
    return updated

@api_router.delete("/availability-rules/{rule_id}")
async def delete_availability_rule(rule_id: str, user: dict = Depends(require_admin)):
    existing = await db.availability_rules.find_one({"id": rule_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Regel niet gevonden")
    
    await db.availability_rules.update_one({"id": rule_id}, {"$set": {"isActive": False, "updatedAt": now_iso()}})
    await log_audit(user["id"], "delete", "availability_rule", rule_id)
    return {"success": True}

# ============ EXCLUSION DATES ROUTES ============

@api_router.get("/exclusion-dates", response_model=List[ExclusionDateResponse])
async def get_exclusion_dates(user: dict = Depends(get_current_user), includeInactive: bool = False):
    query = {} if includeInactive else {"isActive": True}
    dates = await db.exclusion_dates.find(query, {"_id": 0}).sort("date", 1).to_list(1000)
    return dates

@api_router.post("/exclusion-dates", response_model=ExclusionDateResponse)
async def create_exclusion_date(data: ExclusionDateCreate, user: dict = Depends(require_admin)):
    existing = await db.exclusion_dates.find_one({"date": data.date})
    if existing:
        raise HTTPException(status_code=400, detail="Deze datum is al uitgesloten")
    
    now = now_iso()
    doc = {
        "id": str(uuid.uuid4()),
        **data.model_dump(),
        "createdAt": now,
        "updatedAt": now
    }
    await db.exclusion_dates.insert_one(doc)
    await log_audit(user["id"], "create", "exclusion_date", doc["id"], {"date": data.date})
    return {k: v for k, v in doc.items() if k != "_id"}

@api_router.delete("/exclusion-dates/{date_id}")
async def delete_exclusion_date(date_id: str, user: dict = Depends(require_admin)):
    existing = await db.exclusion_dates.find_one({"id": date_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Datum niet gevonden")
    
    await db.exclusion_dates.delete_one({"id": date_id})
    await log_audit(user["id"], "delete", "exclusion_date", date_id)
    return {"success": True}

# ============ STUDY MOMENTS ROUTES ============

@api_router.get("/study-moments", response_model=List[StudyMomentResponse])
async def get_study_moments(
    user: dict = Depends(get_current_user),
    studyTypeId: Optional[str] = None,
    dateFrom: Optional[str] = None,
    dateTo: Optional[str] = None,
    includeInactive: bool = False
):
    query = {} if includeInactive else {"isActive": True}
    
    if studyTypeId:
        query["studyTypeId"] = studyTypeId
    if dateFrom:
        query["date"] = {"$gte": dateFrom}
    if dateTo:
        if "date" in query:
            query["date"]["$lte"] = dateTo
        else:
            query["date"] = {"$lte": dateTo}
    
    moments = await db.study_moments.find(query, {"_id": 0}).sort("date", 1).to_list(1000)
    
    # Add current registration count
    for moment in moments:
        count = await db.registrations.count_documents({
            "studyMomentId": moment["id"],
            "status": RegistrationStatus.REGISTERED
        })
        moment["currentRegistrations"] = count
    
    return moments

@api_router.get("/study-moments/available", response_model=List[dict])
async def get_available_moments(
    user: dict = Depends(get_current_user),
    studyTypeId: Optional[str] = None
):
    """Get available study moments with capacity info for registration form"""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    query = {
        "isActive": True,
        "date": {"$gte": today}
    }
    if studyTypeId:
        query["studyTypeId"] = studyTypeId
    
    moments = await db.study_moments.find(query, {"_id": 0}).sort("date", 1).to_list(1000)
    
    result = []
    for moment in moments:
        count = await db.registrations.count_documents({
            "studyMomentId": moment["id"],
            "status": RegistrationStatus.REGISTERED
        })
        available = moment["capacity"] - count
        
        if available > 0:
            # Get study type info
            study_type = await db.study_types.find_one({"id": moment["studyTypeId"]}, {"_id": 0})
            
            result.append({
                **moment,
                "currentRegistrations": count,
                "availableSpots": available,
                "studyType": study_type
            })
    
    return result

@api_router.get("/study-moments/{moment_id}", response_model=dict)
async def get_study_moment(moment_id: str, user: dict = Depends(get_current_user)):
    moment = await db.study_moments.find_one({"id": moment_id}, {"_id": 0})
    if not moment:
        raise HTTPException(status_code=404, detail="Moment niet gevonden")
    
    # Get registrations for this moment
    registrations = await db.registrations.find(
        {"studyMomentId": moment_id, "status": RegistrationStatus.REGISTERED},
        {"_id": 0}
    ).to_list(1000)
    
    # Add class names
    for reg in registrations:
        cls = await db.classes.find_one({"id": reg["classId"]}, {"_id": 0})
        reg["className"] = cls["name"] if cls else "Onbekend"
    
    study_type = await db.study_types.find_one({"id": moment["studyTypeId"]}, {"_id": 0})
    
    return {
        **moment,
        "currentRegistrations": len(registrations),
        "registrations": registrations,
        "studyType": study_type
    }

@api_router.post("/study-moments", response_model=StudyMomentResponse)
async def create_study_moment(data: StudyMomentCreate, user: dict = Depends(require_admin)):
    study_type = await db.study_types.find_one({"id": data.studyTypeId})
    if not study_type:
        raise HTTPException(status_code=400, detail="Studietype niet gevonden")
    
    now = now_iso()
    doc = {
        "id": str(uuid.uuid4()),
        **data.model_dump(),
        "createdAt": now,
        "updatedAt": now
    }
    await db.study_moments.insert_one(doc)
    await log_audit(user["id"], "create", "study_moment", doc["id"])
    
    result = {k: v for k, v in doc.items() if k != "_id"}
    result["currentRegistrations"] = 0
    return result

@api_router.put("/study-moments/{moment_id}", response_model=StudyMomentResponse)
async def update_study_moment(moment_id: str, data: StudyMomentCreate, user: dict = Depends(require_admin)):
    existing = await db.study_moments.find_one({"id": moment_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Moment niet gevonden")
    
    now = now_iso()
    update_data = data.model_dump()
    update_data["updatedAt"] = now
    
    await db.study_moments.update_one({"id": moment_id}, {"$set": update_data})
    await log_audit(user["id"], "update", "study_moment", moment_id)
    
    updated = await db.study_moments.find_one({"id": moment_id}, {"_id": 0})
    count = await db.registrations.count_documents({
        "studyMomentId": moment_id,
        "status": RegistrationStatus.REGISTERED
    })
    updated["currentRegistrations"] = count
    return updated

@api_router.delete("/study-moments/{moment_id}")
async def delete_study_moment(moment_id: str, user: dict = Depends(require_admin)):
    existing = await db.study_moments.find_one({"id": moment_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Moment niet gevonden")
    
    await db.study_moments.update_one({"id": moment_id}, {"$set": {"isActive": False, "updatedAt": now_iso()}})
    await log_audit(user["id"], "delete", "study_moment", moment_id)
    return {"success": True}

@api_router.post("/study-moments/generate")
async def generate_study_moments(data: GenerateMomentsRequest, user: dict = Depends(require_admin)):
    """Generate study moments from availability rules"""
    start = datetime.fromisoformat(data.startDate)
    end = datetime.fromisoformat(data.endDate)
    
    if end < start:
        raise HTTPException(status_code=400, detail="Einddatum moet na startdatum liggen")
    
    if (end - start).days > 365:
        raise HTTPException(status_code=400, detail="Periode mag maximaal 1 jaar zijn")
    
    # Get exclusion dates
    exclusion_dates = set()
    exclusions = await db.exclusion_dates.find({"isActive": True}, {"_id": 0}).to_list(1000)
    for ex in exclusions:
        exclusion_dates.add(ex["date"])
    
    # Get active rules
    rules_query = {"isActive": True}
    if data.studyTypeIds:
        rules_query["studyTypeId"] = {"$in": data.studyTypeIds}
    
    rules = await db.availability_rules.find(rules_query, {"_id": 0}).to_list(1000)
    
    created = 0
    skipped = 0
    now = now_iso()
    
    current = start
    while current <= end:
        date_str = current.strftime("%Y-%m-%d")
        weekday = current.weekday()
        
        # Skip exclusion dates
        if date_str in exclusion_dates:
            current += timedelta(days=1)
            continue
        
        for rule in rules:
            # Check if rule applies to this weekday
            if rule["weekday"] != weekday:
                continue
            
            # Check if date is within rule validity
            if date_str < rule["validFrom"] or date_str > rule["validUntil"]:
                continue
            
            # Check if moment already exists
            existing = await db.study_moments.find_one({
                "date": date_str,
                "studyTypeId": rule["studyTypeId"],
                "startTime": rule["startTime"]
            })
            
            if existing:
                skipped += 1
                continue
            
            # Get study type for label
            study_type = await db.study_types.find_one({"id": rule["studyTypeId"]}, {"_id": 0})
            if not study_type:
                continue
            
            label = study_type["mainType"]
            if study_type.get("subType"):
                label += f" - {study_type['subType']}"
            
            moment_doc = {
                "id": str(uuid.uuid4()),
                "date": date_str,
                "weekday": weekday,
                "studyTypeId": rule["studyTypeId"],
                "labelFull": label,
                "startTime": rule["startTime"],
                "endTime": rule["endTime"],
                "capacity": rule["defaultCapacity"],
                "isActive": True,
                "notes": None,
                "generatedFromRuleId": rule["id"],
                "createdAt": now,
                "updatedAt": now
            }
            
            await db.study_moments.insert_one(moment_doc)
            created += 1
        
        current += timedelta(days=1)
    
    await log_audit(user["id"], "generate", "study_moments", "", {"created": created, "skipped": skipped})
    return {"success": True, "created": created, "skipped": skipped}

# ============ REGISTRATIONS ROUTES ============

@api_router.get("/registrations", response_model=List[RegistrationResponse])
async def get_registrations(
    user: dict = Depends(get_current_user),
    dateFrom: Optional[str] = None,
    dateTo: Optional[str] = None,
    studyTypeId: Optional[str] = None,
    classId: Optional[str] = None,
    status: Optional[str] = None,
    teacherEmail: Optional[str] = None,
    search: Optional[str] = None
):
    query = {}
    
    if dateFrom:
        query["date"] = {"$gte": dateFrom}
    if dateTo:
        if "date" in query:
            query["date"]["$lte"] = dateTo
        else:
            query["date"] = {"$lte": dateTo}
    if studyTypeId:
        query["studyTypeId"] = studyTypeId
    if classId:
        query["classId"] = classId
    if status:
        query["status"] = status
    if teacherEmail:
        query["teacherEmail"] = teacherEmail.lower()
    
    registrations = await db.registrations.find(query, {"_id": 0}).sort("date", -1).to_list(1000)
    
    # Add class names
    for reg in registrations:
        cls = await db.classes.find_one({"id": reg["classId"]}, {"_id": 0})
        reg["className"] = cls["name"] if cls else "Onbekend"
    
    # Filter by search if provided
    if search:
        search_lower = search.lower()
        registrations = [
            r for r in registrations 
            if search_lower in r["studentName"].lower() or 
               search_lower in r["teacherName"].lower() or
               search_lower in r.get("className", "").lower()
        ]
    
    return registrations

@api_router.get("/registrations/my", response_model=List[RegistrationResponse])
async def get_my_registrations(user: dict = Depends(get_current_user)):
    """Get registrations created by current user"""
    registrations = await db.registrations.find(
        {"teacherEmail": user["email"]},
        {"_id": 0}
    ).sort("date", -1).to_list(1000)
    
    for reg in registrations:
        cls = await db.classes.find_one({"id": reg["classId"]}, {"_id": 0})
        reg["className"] = cls["name"] if cls else "Onbekend"
    
    return registrations

@api_router.post("/registrations", response_model=RegistrationResponse)
async def create_registration(data: RegistrationCreate, user: dict = Depends(get_current_user)):
    # Validate class
    cls = await db.classes.find_one({"id": data.classId, "isActive": True})
    if not cls:
        raise HTTPException(status_code=400, detail="Ongeldige of inactieve klas")
    
    # Validate study type
    study_type = await db.study_types.find_one({"id": data.studyTypeId, "isActive": True})
    if not study_type:
        raise HTTPException(status_code=400, detail="Ongeldige of inactieve studiesoort")
    
    # Validate study moment
    moment = await db.study_moments.find_one({"id": data.studyMomentId, "isActive": True})
    if not moment:
        raise HTTPException(status_code=400, detail="Ongeldig of inactief studiemoment")
    
    # Check capacity with locking (use findOneAndUpdate for atomicity)
    current_count = await db.registrations.count_documents({
        "studyMomentId": data.studyMomentId,
        "status": RegistrationStatus.REGISTERED
    })
    
    if current_count >= moment["capacity"]:
        raise HTTPException(status_code=400, detail="Dit moment is volzet")
    
    # Check for duplicate registration
    existing = await db.registrations.find_one({
        "studentName": data.studentName,
        "studyMomentId": data.studyMomentId,
        "status": RegistrationStatus.REGISTERED
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Deze leerling is al ingeschreven voor dit moment")
    
    now = now_iso()
    label = study_type["mainType"]
    if study_type.get("subType"):
        label += f" - {study_type['subType']}"
    
    reg_doc = {
        "id": str(uuid.uuid4()),
        "teacherName": data.teacherName,
        "teacherEmail": data.teacherEmail.lower(),
        "studentName": data.studentName,
        "studentEmail": data.studentEmail,
        "classId": data.classId,
        "studyTypeId": data.studyTypeId,
        "studyLabelSnapshot": label,
        "date": moment["date"],
        "startTime": moment["startTime"],
        "endTime": moment["endTime"],
        "studyMomentId": data.studyMomentId,
        "status": RegistrationStatus.REGISTERED,
        "note": data.note,
        "confirmationEmailSent": False,  # Email is mocked
        "absenceEmailSent": False,
        "createdAt": now,
        "updatedAt": now
    }
    
    await db.registrations.insert_one(reg_doc)
    await log_audit(user["id"], "create", "registration", reg_doc["id"], {
        "student": data.studentName,
        "moment": moment["date"]
    })
    
    result = {k: v for k, v in reg_doc.items() if k != "_id"}
    result["className"] = cls["name"]
    return result

@api_router.put("/registrations/{reg_id}", response_model=RegistrationResponse)
async def update_registration(reg_id: str, data: RegistrationUpdate, user: dict = Depends(get_current_user)):
    existing = await db.registrations.find_one({"id": reg_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Registratie niet gevonden")
    
    # Only admin can change status, teacher can only update own registrations' notes
    if user["role"] != UserRole.ADMIN:
        if existing["teacherEmail"] != user["email"]:
            raise HTTPException(status_code=403, detail="Geen toegang tot deze registratie")
        if data.status:
            raise HTTPException(status_code=403, detail="Alleen admin kan status wijzigen")
    
    update_data = {"updatedAt": now_iso()}
    if data.status:
        update_data["status"] = data.status
    if data.note is not None:
        update_data["note"] = data.note
    
    await db.registrations.update_one({"id": reg_id}, {"$set": update_data})
    await log_audit(user["id"], "update", "registration", reg_id, update_data)
    
    updated = await db.registrations.find_one({"id": reg_id}, {"_id": 0})
    cls = await db.classes.find_one({"id": updated["classId"]}, {"_id": 0})
    updated["className"] = cls["name"] if cls else "Onbekend"
    return updated

@api_router.delete("/registrations/{reg_id}")
async def cancel_registration(reg_id: str, user: dict = Depends(get_current_user)):
    existing = await db.registrations.find_one({"id": reg_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Registratie niet gevonden")
    
    # Teachers can only cancel their own registrations
    if user["role"] != UserRole.ADMIN and existing["teacherEmail"] != user["email"]:
        raise HTTPException(status_code=403, detail="Geen toegang tot deze registratie")
    
    await db.registrations.update_one(
        {"id": reg_id},
        {"$set": {"status": RegistrationStatus.CANCELLED, "updatedAt": now_iso()}}
    )
    await log_audit(user["id"], "cancel", "registration", reg_id)
    return {"success": True}

# ============ ATTENDANCE ROUTES ============

@api_router.get("/attendance", response_model=List[AttendanceResponse])
async def get_attendance(
    user: dict = Depends(require_educator_or_admin),
    date: Optional[str] = None,
    studyMomentId: Optional[str] = None
):
    query = {}
    if date:
        query["date"] = date
    if studyMomentId:
        query["studyMomentId"] = studyMomentId
    
    attendance = await db.attendance.find(query, {"_id": 0}).to_list(1000)
    return attendance

@api_router.get("/attendance/by-date/{date}", response_model=List[dict])
async def get_attendance_by_date(date: str, user: dict = Depends(require_educator_or_admin)):
    """Get all study moments and their registrations for a specific date"""
    moments = await db.study_moments.find(
        {"date": date, "isActive": True},
        {"_id": 0}
    ).to_list(1000)
    
    result = []
    for moment in moments:
        # Get study type
        study_type = await db.study_types.find_one({"id": moment["studyTypeId"]}, {"_id": 0})
        
        # Get registrations
        registrations = await db.registrations.find(
            {"studyMomentId": moment["id"], "status": RegistrationStatus.REGISTERED},
            {"_id": 0}
        ).to_list(1000)
        
        # Get attendance records
        attendance_records = await db.attendance.find(
            {"studyMomentId": moment["id"]},
            {"_id": 0}
        ).to_list(1000)
        attendance_map = {a["registrationId"]: a for a in attendance_records}
        
        # Combine data
        students = []
        for reg in registrations:
            cls = await db.classes.find_one({"id": reg["classId"]}, {"_id": 0})
            att = attendance_map.get(reg["id"])
            students.append({
                "registration": reg,
                "className": cls["name"] if cls else "Onbekend",
                "attendance": att
            })
        
        result.append({
            "moment": moment,
            "studyType": study_type,
            "students": students,
            "totalStudents": len(students),
            "presentCount": sum(1 for s in students if s["attendance"] and s["attendance"]["isPresent"]),
            "absentCount": sum(1 for s in students if s["attendance"] and not s["attendance"]["isPresent"])
        })
    
    return result

@api_router.post("/attendance", response_model=AttendanceResponse)
async def record_attendance(data: AttendanceCreate, user: dict = Depends(require_educator_or_admin)):
    # Validate registration
    registration = await db.registrations.find_one({"id": data.registrationId})
    if not registration:
        raise HTTPException(status_code=400, detail="Registratie niet gevonden")
    
    # Check if attendance already exists
    existing = await db.attendance.find_one({
        "registrationId": data.registrationId,
        "studyMomentId": data.studyMomentId
    })
    
    now = now_iso()
    
    if existing:
        # Update existing
        await db.attendance.update_one(
            {"id": existing["id"]},
            {"$set": {
                "isPresent": data.isPresent,
                "note": data.note,
                "checkedAt": now,
                "checkedByUserId": user["id"],
                "updatedAt": now
            }}
        )
        updated = await db.attendance.find_one({"id": existing["id"]}, {"_id": 0})
        return updated
    
    # Create new
    cls = await db.classes.find_one({"id": registration["classId"]}, {"_id": 0})
    
    att_doc = {
        "id": str(uuid.uuid4()),
        "registrationId": data.registrationId,
        "studyMomentId": data.studyMomentId,
        "date": registration["date"],
        "studentNameSnapshot": registration["studentName"],
        "classSnapshot": cls["name"] if cls else "Onbekend",
        "teacherEmailSnapshot": registration["teacherEmail"],
        "isPresent": data.isPresent,
        "checkedAt": now,
        "checkedByUserId": user["id"],
        "note": data.note,
        "createdAt": now,
        "updatedAt": now
    }
    
    await db.attendance.insert_one(att_doc)
    await log_audit(user["id"], "record", "attendance", att_doc["id"], {
        "student": registration["studentName"],
        "isPresent": data.isPresent
    })
    
    return {k: v for k, v in att_doc.items() if k != "_id"}

@api_router.put("/attendance/{att_id}", response_model=AttendanceResponse)
async def update_attendance(att_id: str, data: AttendanceUpdate, user: dict = Depends(require_educator_or_admin)):
    existing = await db.attendance.find_one({"id": att_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Aanwezigheid niet gevonden")
    
    now = now_iso()
    await db.attendance.update_one(
        {"id": att_id},
        {"$set": {
            "isPresent": data.isPresent,
            "note": data.note,
            "checkedAt": now,
            "checkedByUserId": user["id"],
            "updatedAt": now
        }}
    )
    
    updated = await db.attendance.find_one({"id": att_id}, {"_id": 0})
    return updated

# ============ EMAIL TEMPLATES ROUTES ============

@api_router.get("/email-templates", response_model=List[EmailTemplateResponse])
async def get_email_templates(user: dict = Depends(require_admin)):
    templates = await db.email_templates.find({}, {"_id": 0}).to_list(100)
    return templates

@api_router.post("/email-templates", response_model=EmailTemplateResponse)
async def create_email_template(data: EmailTemplateCreate, user: dict = Depends(require_admin)):
    existing = await db.email_templates.find_one({"templateKey": data.templateKey})
    if existing:
        raise HTTPException(status_code=400, detail="Template met deze sleutel bestaat al")
    
    now = now_iso()
    doc = {
        "id": str(uuid.uuid4()),
        **data.model_dump(),
        "createdAt": now,
        "updatedAt": now
    }
    await db.email_templates.insert_one(doc)
    await log_audit(user["id"], "create", "email_template", doc["id"])
    return {k: v for k, v in doc.items() if k != "_id"}

@api_router.put("/email-templates/{template_id}", response_model=EmailTemplateResponse)
async def update_email_template(template_id: str, data: EmailTemplateCreate, user: dict = Depends(require_admin)):
    existing = await db.email_templates.find_one({"id": template_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Template niet gevonden")
    
    now = now_iso()
    update_data = data.model_dump()
    update_data["updatedAt"] = now
    
    await db.email_templates.update_one({"id": template_id}, {"$set": update_data})
    await log_audit(user["id"], "update", "email_template", template_id)
    
    updated = await db.email_templates.find_one({"id": template_id}, {"_id": 0})
    return updated

@api_router.delete("/email-templates/{template_id}")
async def delete_email_template(template_id: str, user: dict = Depends(require_admin)):
    existing = await db.email_templates.find_one({"id": template_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Template niet gevonden")
    
    await db.email_templates.delete_one({"id": template_id})
    await log_audit(user["id"], "delete", "email_template", template_id)
    return {"success": True}

# ============ USERS ROUTES (ADMIN) ============

@api_router.get("/users", response_model=List[UserResponse])
async def get_users(user: dict = Depends(require_admin)):
    users = await db.users.find({}, {"_id": 0, "passwordHash": 0}).to_list(1000)
    return users

@api_router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(user_id: str, data: UserUpdate, admin: dict = Depends(require_admin)):
    existing = await db.users.find_one({"id": user_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Gebruiker niet gevonden")
    
    update_data = {"updatedAt": now_iso()}
    if data.name is not None:
        update_data["name"] = data.name
    if data.role is not None:
        update_data["role"] = data.role
    if data.isActive is not None:
        update_data["isActive"] = data.isActive
    
    await db.users.update_one({"id": user_id}, {"$set": update_data})
    await log_audit(admin["id"], "update", "user", user_id, update_data)
    
    updated = await db.users.find_one({"id": user_id}, {"_id": 0, "passwordHash": 0})
    return updated

# ============ REPORTS ROUTES ============

@api_router.get("/reports/summary")
async def get_reports_summary(
    user: dict = Depends(require_admin),
    dateFrom: Optional[str] = None,
    dateTo: Optional[str] = None
):
    query = {}
    if dateFrom:
        query["date"] = {"$gte": dateFrom}
    if dateTo:
        if "date" in query:
            query["date"]["$lte"] = dateTo
        else:
            query["date"] = {"$lte": dateTo}
    
    # Total registrations
    total_registrations = await db.registrations.count_documents(query)
    
    # By status
    registered = await db.registrations.count_documents({**query, "status": RegistrationStatus.REGISTERED})
    cancelled = await db.registrations.count_documents({**query, "status": RegistrationStatus.CANCELLED})
    
    # Attendance stats
    att_query = {}
    if dateFrom:
        att_query["date"] = {"$gte": dateFrom}
    if dateTo:
        if "date" in att_query:
            att_query["date"]["$lte"] = dateTo
        else:
            att_query["date"] = {"$lte": dateTo}
    
    total_attendance = await db.attendance.count_documents(att_query)
    present = await db.attendance.count_documents({**att_query, "isPresent": True})
    absent = await db.attendance.count_documents({**att_query, "isPresent": False})
    
    # By study type
    study_types = await db.study_types.find({"isActive": True}, {"_id": 0}).to_list(100)
    by_study_type = []
    for st in study_types:
        count = await db.registrations.count_documents({**query, "studyTypeId": st["id"]})
        by_study_type.append({
            "studyType": st,
            "count": count
        })
    
    # By class
    classes = await db.classes.find({"isActive": True}, {"_id": 0}).to_list(100)
    by_class = []
    for cls in classes:
        count = await db.registrations.count_documents({**query, "classId": cls["id"]})
        by_class.append({
            "class": cls,
            "count": count
        })
    
    return {
        "totalRegistrations": total_registrations,
        "registered": registered,
        "cancelled": cancelled,
        "attendance": {
            "total": total_attendance,
            "present": present,
            "absent": absent,
            "rate": round(present / total_attendance * 100, 1) if total_attendance > 0 else 0
        },
        "byStudyType": by_study_type,
        "byClass": by_class
    }

@api_router.get("/reports/export")
async def export_registrations(
    user: dict = Depends(require_admin),
    dateFrom: Optional[str] = None,
    dateTo: Optional[str] = None
):
    query = {}
    if dateFrom:
        query["date"] = {"$gte": dateFrom}
    if dateTo:
        if "date" in query:
            query["date"]["$lte"] = dateTo
        else:
            query["date"] = {"$lte": dateTo}
    
    registrations = await db.registrations.find(query, {"_id": 0}).sort("date", 1).to_list(10000)
    
    # Add class names
    for reg in registrations:
        cls = await db.classes.find_one({"id": reg["classId"]}, {"_id": 0})
        reg["className"] = cls["name"] if cls else "Onbekend"
    
    return registrations

# ============ DASHBOARD ROUTES ============

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(user: dict = Depends(get_current_user)):
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    # Today's moments
    today_moments = await db.study_moments.count_documents({"date": today, "isActive": True})
    
    # Today's registrations
    today_registrations = await db.registrations.count_documents({
        "date": today,
        "status": RegistrationStatus.REGISTERED
    })
    
    # User's registrations (if teacher)
    my_registrations = 0
    if user["role"] == UserRole.TEACHER:
        my_registrations = await db.registrations.count_documents({
            "teacherEmail": user["email"],
            "status": RegistrationStatus.REGISTERED
        })
    
    # This week stats
    week_start = (datetime.now(timezone.utc) - timedelta(days=datetime.now(timezone.utc).weekday())).strftime("%Y-%m-%d")
    week_registrations = await db.registrations.count_documents({
        "date": {"$gte": week_start},
        "status": RegistrationStatus.REGISTERED
    })
    
    return {
        "today": {
            "moments": today_moments,
            "registrations": today_registrations
        },
        "myRegistrations": my_registrations,
        "weekRegistrations": week_registrations
    }

# ============ SEED DATA ============

@api_router.post("/seed")
async def seed_data(user: dict = Depends(require_admin)):
    """Seed initial data for the application"""
    now = now_iso()
    
    # Seed study types
    study_types_data = [
        {"mainType": "Inhaalstudie", "subType": None, "key": "inhaalstudie", "colorLabel": "blue"},
        {"mainType": "Werkstudie", "subType": None, "key": "werkstudie", "colorLabel": "green"},
        {"mainType": "Strafstudie", "subType": None, "key": "strafstudie", "colorLabel": "red"},
        {"mainType": "Leerlabo", "subType": "Frans", "key": "leerlabo-frans", "colorLabel": "purple"},
        {"mainType": "Leerlabo", "subType": "Wiskunde", "key": "leerlabo-wiskunde", "colorLabel": "orange"},
        {"mainType": "Leerlabo", "subType": "Leren Leren", "key": "leerlabo-leren-leren", "colorLabel": "teal"},
        {"mainType": "Begeleide studie", "subType": None, "key": "begeleide-studie", "colorLabel": "gray"},
    ]
    
    created_types = 0
    for st in study_types_data:
        existing = await db.study_types.find_one({"key": st["key"]})
        if not existing:
            await db.study_types.insert_one({
                "id": str(uuid.uuid4()),
                **st,
                "isActive": True,
                "defaultCapacity": 20,
                "defaultStartTime": "15:30",
                "defaultEndTime": "17:00",
                "createdAt": now,
                "updatedAt": now
            })
            created_types += 1
    
    # Seed classes
    classes_data = [
        "1A", "1B", "1C", "2A", "2B", "2C",
        "3 Latijn", "3 Moderne", "3 STEM",
        "4 Latijn", "4 Economie", "4 Wetenschappen",
        "5 Latijn", "5 Economie", "5 Wetenschappen",
        "6 Latijn", "6 Economie", "6 Wetenschappen"
    ]
    
    created_classes = 0
    for name in classes_data:
        existing = await db.classes.find_one({"name": name})
        if not existing:
            await db.classes.insert_one({
                "id": str(uuid.uuid4()),
                "name": name,
                "isActive": True,
                "createdAt": now,
                "updatedAt": now
            })
            created_classes += 1
    
    # Seed email templates
    templates_data = [
        {
            "templateKey": "student_confirmation",
            "subject": "Bevestiging aanmelding {studie}",
            "body": "Beste {leerkracht},\n\nDe aanmelding voor {leerling} ({klas}) is bevestigd.\n\nStudie: {studie}\nDatum: {datum}\nTijd: {startuur} - {einduur}\n\nMet vriendelijke groeten,\nDe school"
        },
        {
            "templateKey": "teacher_absence_notice",
            "subject": "Afwezigheidsmelding {leerling}",
            "body": "Beste {leerkracht},\n\n{leerling} ({klas}) was afwezig tijdens {studie} op {datum}.\n\nGelieve de nodige opvolging te voorzien.\n\nMet vriendelijke groeten,\nDe school"
        }
    ]
    
    created_templates = 0
    for tmpl in templates_data:
        existing = await db.email_templates.find_one({"templateKey": tmpl["templateKey"]})
        if not existing:
            await db.email_templates.insert_one({
                "id": str(uuid.uuid4()),
                **tmpl,
                "isActive": True,
                "createdAt": now,
                "updatedAt": now
            })
            created_templates += 1
    
    return {
        "success": True,
        "created": {
            "studyTypes": created_types,
            "classes": created_classes,
            "emailTemplates": created_templates
        }
    }

# ============ ROOT ============

@api_router.get("/")
async def root():
    return {"message": "School Study Registration System API", "version": "1.0.0"}

# Include the router
app.include_router(api_router)

# CORS Middleware
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
