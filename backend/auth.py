import logging
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from jose import JWTError, jwt
import bcrypt as _bcrypt
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_HOURS, GOOGLE_CLIENT_ID
from database import get_session, User
from dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


class SignupRequest(BaseModel):
    email: str
    password: str
    username: str


class LoginRequest(BaseModel):
    email: str
    password: str


class GoogleLoginRequest(BaseModel):
    id_token: str


class UserResponse(BaseModel):
    id: str
    email: str
    username: str
    created_at: str

    @classmethod
    def from_orm(cls, user: User):
        return cls(
            id=user.id,
            email=user.email,
            username=user.username,
            created_at=user.created_at.isoformat(),
        )


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


def hash_password(password: str) -> str:
    return _bcrypt.hashpw(password.encode(), _bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return _bcrypt.checkpw(plain.encode(), hashed.encode())


def create_access_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    payload = {"sub": user_id, "exp": expire, "iat": datetime.now(timezone.utc)}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


@router.post("/signup", response_model=TokenResponse)
async def signup(req: SignupRequest, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(User).where(User.email == req.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email already registered")

    user = User(
        id=uuid.uuid4().hex,
        email=req.email,
        username=req.username,
        password_hash=hash_password(req.password),
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)

    token = create_access_token(user.id)
    return TokenResponse(access_token=token, user=UserResponse.from_orm(user))


@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(User).where(User.email == req.email))
    user = result.scalar_one_or_none()
    if not user or not user.password_hash or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(user.id)
    return TokenResponse(access_token=token, user=UserResponse.from_orm(user))


@router.post("/google", response_model=TokenResponse)
async def google_login(req: GoogleLoginRequest, session: AsyncSession = Depends(get_session)):
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=501, detail="Google sign-in is not configured")

    try:
        from google.oauth2 import id_token as google_id_token
        from google.auth.transport import requests as google_requests

        id_info = google_id_token.verify_oauth2_token(
            req.id_token,
            google_requests.Request(),
            GOOGLE_CLIENT_ID,
        )

        email = id_info.get("email")
        if not email:
            raise HTTPException(status_code=400, detail="Google account has no email")

        result = await session.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

        if not user:
            user = User(
                id=uuid.uuid4().hex,
                email=email,
                username=id_info.get("name", email.split("@")[0]),
                password_hash="",
            )
            session.add(user)
            await session.commit()
            await session.refresh(user)

        token = create_access_token(user.id)
        return TokenResponse(access_token=token, user=UserResponse.from_orm(user))

    except ValueError as e:
        raise HTTPException(status_code=401, detail=f"Invalid Google token: {e}")
    except Exception as e:
        logger = logging.getLogger("SID.AI")
        logger.exception("Google login failed")
        raise HTTPException(status_code=500, detail="Google sign-in failed")


@router.get("/me", response_model=UserResponse)
async def get_me(user: User = Depends(get_current_user)):
    return UserResponse.from_orm(user)
