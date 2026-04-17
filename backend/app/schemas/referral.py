from pydantic import BaseModel, Field

class ApplyReferralRequest(BaseModel):
    referral_code: str = Field(..., min_length=3, max_length=20)

class ReferralResponse(BaseModel):
    referrer_name: str
    referee_credit: float
    message: str

class ReferralCodeResponse(BaseModel):
    referral_code: str
