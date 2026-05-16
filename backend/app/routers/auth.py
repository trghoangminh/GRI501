from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.auth import BlacklistedToken, PasswordResetToken
from app.schemas.user import UserCreate, UserLogin, Token, RefreshTokenReq, UserProfile, ForgotPasswordReq, ResetPasswordReq
from app.services.auth_service import register_user, get_user_by_email
from app.core.security import verify_password, create_access_token, create_refresh_token, get_password_hash
from app.core.dependencies import oauth2_scheme
from datetime import datetime, timedelta
import uuid
from app.services.settings_service import get_setting_value

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=Token)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    if not get_setting_value(db, "registration"):
        raise HTTPException(status_code=403, detail="Hệ thống hiện đang tạm thời đóng đăng ký thành viên mới.")
        
    user = register_user(db, user_in)
    access_token = create_access_token(subject=user.id)
    refresh_token = create_refresh_token(subject=user.id)
    return {"access_token": access_token, "refresh_token": refresh_token, "user": user}

@router.post("/login", response_model=Token)
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    user = get_user_by_email(db, user_in.email)
    if not user or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
        
    if user.role != "admin" and get_setting_value(db, "maintenance"):
        raise HTTPException(status_code=503, detail="Hệ thống đang được bảo trì. Vui lòng quay lại sau.")
        
    access_token = create_access_token(subject=user.id)
    refresh_token = create_refresh_token(subject=user.id)
    return {"access_token": access_token, "refresh_token": refresh_token, "user": user}

@router.post("/refresh")
def refresh_token(req: RefreshTokenReq, db: Session = Depends(get_db)):
    from jose import jwt, JWTError
    from app.config import settings
    try:
        payload = jwt.decode(req.refresh_token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid refresh token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
        
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")
        
    access_token = create_access_token(subject=user.id)
    return {"status": "success", "data": {"access_token": access_token}}

@router.post("/logout")
def logout(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    from jose import jwt
    from app.config import settings
    payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM], options={"verify_exp": False})
    exp = payload.get("exp")
    if exp:
        # Blacklist the current access token for its remaining lifetime
        expires_at = datetime.utcfromtimestamp(exp)
        if expires_at > datetime.utcnow():
            blacklisted = BlacklistedToken(token=token, expires_at=expires_at)
            db.add(blacklisted)
            db.commit()
    return {"status": "success", "data": "Logged out successfully"}

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordReq, db: Session = Depends(get_db)):
    user = get_user_by_email(db, req.email)
    if user:
        # In a real app, send an email. For now we generate a token.
        reset_token = str(uuid.uuid4())
        expires_at = datetime.utcnow() + timedelta(hours=1)
        
        token_entry = PasswordResetToken(
            user_id=user.id,
            token=reset_token,
            expires_at=expires_at
        )
        db.add(token_entry)
        db.commit()
        # TODO: send email
    return {"status": "success", "data": "If the email exists, a reset link has been sent."}

@router.post("/reset-password")
def reset_password(req: ResetPasswordReq, db: Session = Depends(get_db)):
    token_entry = db.query(PasswordResetToken).filter(PasswordResetToken.token == req.token).first()
    
    if not token_entry or token_entry.expires_at < datetime.utcnow():
        if token_entry:
            db.delete(token_entry)
            db.commit()
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
        
    user = db.query(User).filter(User.id == token_entry.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.hashed_password = get_password_hash(req.new_password)
    
    # Delete the used token
    db.delete(token_entry)
    db.commit()
    
    return {"status": "success", "data": "Password reset successfully"}
