"""
Structured logging configuration for production and human-readable for dev.
"""
import json
import logging
import sys
from datetime import datetime
from typing import Any, Dict

from app.core.config import settings

class JSONFormatter(logging.Formatter):
    """
    Formatter that outputs JSON lines.
    Includes request_id from context via 'extra' dictionary.
    """
    def format(self, record: logging.LogRecord) -> str:
        log_record: Dict[str, Any] = {
            "timestamp": datetime.utcfromtimestamp(record.created).isoformat() + "Z",
            "level": record.levelname,
            "message": record.getMessage(),
            "logger": record.name,
            "module": record.module,
            "line": record.lineno,
        }
        
        # Add extra fields if they exist (from RequestTracingMiddleware)
        if hasattr(record, "request_id"):
            log_record["request_id"] = record.request_id
        if hasattr(record, "method"):
            log_record["method"] = record.method
        if hasattr(record, "path"):
            log_record["path"] = record.path
        if hasattr(record, "status_code"):
            log_record["status_code"] = record.status_code
        if hasattr(record, "duration_ms"):
            log_record["duration_ms"] = record.duration_ms
            
        # Add stack trace if it's an error
        if record.exc_info:
            log_record["exception"] = self.formatException(record.exc_info)
            
        return json.dumps(log_record)

class ConsoleFormatter(logging.Formatter):
    """
    Human-readable formatter for local development.
    """
    def format(self, record: logging.LogRecord) -> str:
        timestamp = datetime.utcfromtimestamp(record.created).strftime("%H:%M:%S")
        level = f"[{record.levelname}]"
        message = record.getMessage()
        
        request_id = getattr(record, "request_id", "")
        rid_str = f" | RID:{request_id[:8]}" if request_id else ""
        
        duration = getattr(record, "duration_ms", None)
        dur_str = f" ({duration:.2f}ms)" if duration is not None else ""
        
        return f"{timestamp} {level:<7} {record.name}{rid_str}: {message}{dur_str}"

def setup_logging():
    """
    Configure root logger and app-specific loggers.
    """
    root_logger = logging.getLogger()
    
    # Remove existing handlers
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
        
    handler = logging.StreamHandler(sys.stdout)
    
    if settings.DEBUG:
        handler.setFormatter(ConsoleFormatter())
        root_logger.setLevel(logging.INFO)
    else:
        handler.setFormatter(JSONFormatter())
        root_logger.setLevel(logging.INFO)
        
    root_logger.addHandler(handler)
    
    # Silence chatty loggers if needed
    logging.getLogger("uvicorn.access").handlers = []
    logging.getLogger("uvicorn.access").propagate = True
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    
    logging.info("Logging initialized (DEBUG=%s)", settings.DEBUG)
