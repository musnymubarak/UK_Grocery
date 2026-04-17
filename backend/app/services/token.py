"""
Token service — issue, rotate, and revoke refresh tokens.
"""
import secrets
import hashlib
from uuid import UUID
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.refresh_token import RefreshToken
from app.core.config import settings
from app.core.security import create_access_token
from app.core.exceptions import UnauthorizedException

class TokenService:
    def __init__(self, db: AsyncSession):
        self.db = db

    def _hash_token(self, token: str) -> str:
        """Hash a token using SHA-256."""
        return hashlib.sha256(token.encode()).hexdigest()

    async def issue_token_pair(
        self, 
        user_id: Optional[UUID] = None, 
        customer_id: Optional[UUID] = None,
        device_info: Optional[str] = None
    ) -> Dict:
        """Issue a new access token and a refresh token."""
        # Determine sub and role for access token
        sub = str(user_id or customer_id)
        role = "customer" if customer_id else "staff" # User role is handled in security.py usually but we just need a identifier
        
        # Access token (short-lived)
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": sub, "role": role},
            expires_delta=access_token_expires
        )

        # Refresh token (long-lived)
        refresh_token_raw = secrets.token_hex(32)
        refresh_token_hash = self._hash_token(refresh_token_raw)
        
        expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        
        db_token = RefreshToken(
            token_hash=refresh_token_hash,
            user_id=user_id,
            customer_id=customer_id,
            expires_at=expires_at,
            device_info=device_info
        )
        self.db.add(db_token)
        await self.db.flush()

        return {
            "access_token": access_token,
            "refresh_token": refresh_token_raw,
            "token_type": "bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        }

    async def rotate_token(self, refresh_token_raw: str, device_info: Optional[str] = None) -> Dict:
        """Rotate a refresh token: revoke the old one and issue a new pair."""
        token_hash = self._hash_token(refresh_token_raw)
        
        query = select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        result = await self.db.execute(query)
        db_token = result.scalar_one_or_none()

        if not db_token or db_token.is_revoked or db_token.expires_at < datetime.now(timezone.utc):
            # If a token is reused after being rotated (compromised), revoke the whole chain!
            if db_token and db_token.is_revoked:
                await self.revoke_chain(db_token)
            raise UnauthorizedException("Invalid or expired refresh token")

        # Revoke the old token
        db_token.is_revoked = True
        db_token.revoked_at = datetime.now(timezone.utc)
        
        # Issue new pair
        new_pair = await self.issue_token_pair(
            user_id=db_token.user_id,
            customer_id=db_token.customer_id,
            device_info=device_info or db_token.device_info
        )
        
        # Link for rotation detection
        db_token.replaced_by = self._hash_token(new_pair["refresh_token"])
        
        return new_pair

    async def revoke_token(self, refresh_token_raw: str):
        """Revoke a specific refresh token (logout)."""
        token_hash = self._hash_token(refresh_token_raw)
        stmt = (
            update(RefreshToken)
            .where(RefreshToken.token_hash == token_hash)
            .values(is_revoked=True, revoked_at=datetime.now(timezone.utc))
        )
        await self.db.execute(stmt)

    async def revoke_all_sessions(self, user_id: Optional[UUID] = None, customer_id: Optional[UUID] = None):
        """Revoke all sessions for a user/customer (security reset)."""
        stmt = update(RefreshToken).values(is_revoked=True, revoked_at=datetime.now(timezone.utc))
        if user_id:
            stmt = stmt.where(RefreshToken.user_id == user_id)
        if customer_id:
            stmt = stmt.where(RefreshToken.customer_id == customer_id)
        
        await self.db.execute(stmt)

    async def revoke_chain(self, db_token: RefreshToken):
        """Emergency: Revoke all tokens in a session chain (detected reuse)."""
        # For simplicity, we just revoke all active sessions for that user/customer
        await self.revoke_all_sessions(user_id=db_token.user_id, customer_id=db_token.customer_id)
