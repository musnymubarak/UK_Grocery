from enum import Enum

class RefundReason(str, Enum):
    MISSING_ITEM = "missing_item"
    WRONG_ITEM = "wrong_item"
    DAMAGED_ITEM = "damaged_item"
    EXPIRED_ITEM = "expired_item"
    QUALITY_ISSUE = "quality_issue"
    NOT_RECEIVED = "not_received"
    SUBSTITUTION_REJECTED = "substitution_rejected"
    OTHER = "other"

EVIDENCE_REQUIRED_REASONS = {
    RefundReason.DAMAGED_ITEM,
    RefundReason.WRONG_ITEM,
    RefundReason.QUALITY_ISSUE,
}
