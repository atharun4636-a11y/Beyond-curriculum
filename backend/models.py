from pydantic import BaseModel, Field
from typing import Optional, List, Any, Dict

# ==================== AUTHENTICATION MODELS ====================
class LoginRequest(BaseModel):
    identifier: str = Field(..., description="Email or Employee ID (e.g. EMP004 or admin@company.com)")
    password: str = Field(..., description="User password")

class EmployeeStatusUpdate(BaseModel):
    isActive: bool = Field(..., description="Status flag: true for Active, false for Suspended/Inactive")

class RegisterRequest(BaseModel):
    employeeId: str = Field(..., description="Unique employee identifier (e.g. EMP005)")
    name: str = Field(..., description="Employee full name")
    email: str = Field(..., description="Official company email address")
    departmentId: int = Field(1, description="Department ID: 1=DE, 2=COGNITIVE, 3=DCG")
    designation: Optional[str] = "Software Engineer"
    password: str = Field(..., description="Password")

class ForgotPasswordRequest(BaseModel):
    email: str = Field(..., description="Official company email address")

class ResetPasswordRequest(BaseModel):
    email: str = Field(..., description="Official company email address")
    otp: str = Field(..., description="6-digit OTP code")
    newPassword: str = Field(..., description="New password")


# ==================== HACKATHON MODELS ====================
class HackathonBase(BaseModel):
    name: str = Field(..., description="Name of the hackathon")
    statement: Optional[str] = ""
    organizer: Optional[str] = ""
    mode: Optional[str] = "Online"
    location: Optional[str] = ""
    regLink: Optional[str] = ""
    lastDate: Optional[str] = ""
    eventDate: Optional[str] = ""
    poster: Optional[str] = ""
    description: Optional[str] = ""
    source: Optional[str] = "manual"
    sourceId: Optional[str] = None
    sourceUrl: Optional[str] = ""
    category: Optional[str] = None
    skills: Optional[str] = None
    eligibility: Optional[str] = None
    teamSize: Optional[str] = None
    lastSyncedAt: Optional[str] = None
    isActive: Optional[bool] = True

class HackathonCreate(HackathonBase):
    pass

class HackathonUpdate(BaseModel):
    name: Optional[str] = None
    statement: Optional[str] = None
    organizer: Optional[str] = None
    mode: Optional[str] = None
    location: Optional[str] = None
    regLink: Optional[str] = None
    lastDate: Optional[str] = None
    eventDate: Optional[str] = None
    poster: Optional[str] = None
    description: Optional[str] = None
    source: Optional[str] = None
    sourceId: Optional[str] = None
    sourceUrl: Optional[str] = None
    category: Optional[str] = None
    skills: Optional[str] = None
    eligibility: Optional[str] = None
    teamSize: Optional[str] = None
    lastSyncedAt: Optional[str] = None
    isActive: Optional[bool] = None

class HackathonResponse(HackathonBase):
    id: int
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None

    class Config:
        from_attributes = True

class HackathonDepartmentsUpdate(BaseModel):
    departmentIds: List[int] = Field(..., description="List of department IDs to associate with hackathon")


# ==================== DEPARTMENT MODELS ====================
class DepartmentBase(BaseModel):
    name: str = Field(..., description="Unique department name")
    code: str = Field(..., description="Unique department code (DE, COGNITIVE, DCG)")
    isActive: Optional[bool] = True

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    isActive: Optional[bool] = None

class DepartmentResponse(DepartmentBase):
    id: int
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None

    class Config:
        from_attributes = True


# ==================== EMPLOYEE MODELS ====================
class EmployeeBase(BaseModel):
    employeeId: Optional[str] = ""
    name: Optional[str] = ""
    email: Optional[str] = ""
    departmentId: Optional[int] = Field(None, description="ID referencing departments table")
    role: Optional[str] = "employee"
    isActive: Optional[bool] = True
    phone: Optional[str] = None
    designation: Optional[str] = None
    dateJoined: Optional[str] = None
    score: Optional[int] = 0
    photo: Optional[str] = None
    profileImageUrl: Optional[str] = None

class EmployeeCreate(EmployeeBase):
    password: Optional[str] = None

class EmployeeUpdate(BaseModel):
    employeeId: Optional[str] = None
    name: Optional[str] = None
    email: Optional[str] = None
    departmentId: Optional[int] = None
    role: Optional[str] = None
    isActive: Optional[bool] = None
    phone: Optional[str] = None
    designation: Optional[str] = None
    dateJoined: Optional[str] = None
    score: Optional[int] = None
    photo: Optional[str] = None
    profileImageUrl: Optional[str] = None
    password: Optional[str] = None

class EmployeeResponse(EmployeeBase):
    id: int
    departmentName: Optional[str] = None
    departmentCode: Optional[str] = None
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None

    class Config:
        from_attributes = True


# ==================== SOURCE MODELS ====================
class SourceBase(BaseModel):
    name: str = Field(..., description="Unique name of source (e.g. Unstop)")
    code: str = Field(..., description="Unique code of source (e.g. UNSTOP)")
    sourceType: str = Field(..., description="Type of source (API, API_OR_FEED)")
    baseUrl: Optional[str] = ""
    apiUrl: Optional[str] = ""
    isActive: Optional[bool] = True

class SourceCreate(SourceBase):
    pass

class SourceUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    sourceType: Optional[str] = None
    baseUrl: Optional[str] = None
    apiUrl: Optional[str] = None
    isActive: Optional[bool] = None

class SourceResponse(SourceBase):
    id: int
    lastSyncAt: Optional[str] = None
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None

    class Config:
        from_attributes = True


# ==================== LEARNING RESOURCE MODELS ====================
class LearningResourceBase(BaseModel):
    title: str
    description: Optional[str] = ""
    url: str
    source: Optional[str] = "manual"
    sourceId: Optional[str] = None
    resourceType: Optional[str] = "article"
    category: Optional[str] = ""
    skills: Optional[str] = ""
    difficulty: Optional[str] = "Beginner"
    department: Optional[str] = ""
    departmentId: Optional[int] = None
    thumbnail: Optional[str] = ""
    author: Optional[str] = "Admin"
    publishedAt: Optional[str] = None
    lastSyncedAt: Optional[str] = None
    isActive: Optional[bool] = True

class LearningResourceCreate(LearningResourceBase):
    departmentIds: Optional[List[int]] = []

class LearningResourceUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    url: Optional[str] = None
    source: Optional[str] = None
    sourceId: Optional[str] = None
    resourceType: Optional[str] = None
    category: Optional[str] = None
    skills: Optional[str] = None
    difficulty: Optional[str] = None
    department: Optional[str] = None
    departmentId: Optional[int] = None
    departmentIds: Optional[List[int]] = None
    thumbnail: Optional[str] = None
    author: Optional[str] = None
    publishedAt: Optional[str] = None
    isActive: Optional[bool] = None

class LearningResourceResponse(LearningResourceBase):
    id: int
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None

    class Config:
        from_attributes = True


# ==================== CODING PROBLEM MODELS ====================
class CodingProblemBase(BaseModel):
    title: str
    description: Optional[str] = ""
    url: str
    source: Optional[str] = "manual"
    sourceId: Optional[str] = None
    difficulty: Optional[str] = "Easy"
    rating: Optional[int] = 0
    tags: Optional[str] = ""
    skills: Optional[str] = ""
    language: Optional[str] = "Python"
    category: Optional[str] = "Algorithms"
    departmentId: Optional[int] = None
    lastSyncedAt: Optional[str] = None
    isActive: Optional[bool] = True

class CodingProblemCreate(CodingProblemBase):
    departmentIds: Optional[List[int]] = []

class CodingProblemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    url: Optional[str] = None
    source: Optional[str] = None
    sourceId: Optional[str] = None
    difficulty: Optional[str] = None
    rating: Optional[int] = None
    tags: Optional[str] = None
    skills: Optional[str] = None
    language: Optional[str] = None
    category: Optional[str] = None
    departmentId: Optional[int] = None
    departmentIds: Optional[List[int]] = None
    isActive: Optional[bool] = None

class CodingProblemResponse(CodingProblemBase):
    id: int
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None

    class Config:
        from_attributes = True


# ==================== OPPORTUNITY & WEBINAR MODELS ====================
class OpportunityBase(BaseModel):
    title: str
    description: Optional[str] = ""
    source: Optional[str] = "manual"
    sourceId: Optional[str] = None
    sourceUrl: Optional[str] = ""
    registrationUrl: Optional[str] = ""
    eventType: Optional[str] = "WEBINAR"
    topic: Optional[str] = ""
    skills: Optional[str] = ""
    startDate: Optional[str] = ""
    endDate: Optional[str] = ""
    timezone: Optional[str] = "UTC"
    isOnline: Optional[bool] = True
    location: Optional[str] = "Online"
    imageUrl: Optional[str] = ""
    difficulty: Optional[str] = "Intermediate"
    lastSyncedAt: Optional[str] = None
    isActive: Optional[bool] = True

class OpportunityCreate(OpportunityBase):
    departmentIds: Optional[List[int]] = []

class OpportunityUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    source: Optional[str] = None
    sourceId: Optional[str] = None
    sourceUrl: Optional[str] = None
    registrationUrl: Optional[str] = None
    eventType: Optional[str] = None
    topic: Optional[str] = None
    skills: Optional[str] = None
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    timezone: Optional[str] = None
    isOnline: Optional[bool] = None
    location: Optional[str] = None
    imageUrl: Optional[str] = None
    difficulty: Optional[str] = None
    departmentIds: Optional[List[int]] = None
    isActive: Optional[bool] = None

class OpportunityResponse(OpportunityBase):
    id: int
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None

    class Config:
        from_attributes = True

