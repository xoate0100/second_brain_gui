# Backend DateTime Serialization Issue

## Critical Backend Error

### Error Message
```
TypeError: Object of type datetime is not JSON serializable
```

### Location
Backend logs show this error occurs when trying to serialize API responses containing datetime objects.

### Impact
- **API requests hang indefinitely** - Backend cannot serialize response
- **Frontend shows `ERR_SOCKET_NOT_CONNECTED`** - Connection fails/times out
- **Review queue endpoint fails** - Cannot load review items

### Root Cause
Python's `json.dumps()` cannot serialize `datetime` objects directly. The backend is returning datetime objects in API responses without converting them to strings first.

### Backend Fix Required

The backend needs to convert datetime objects to ISO format strings before JSON serialization:

#### Option 1: Convert at Response Level
```python
from datetime import datetime
import json

# Instead of:
return {"created_at": datetime.now()}

# Use:
return {"created_at": datetime.now().isoformat()}
```

#### Option 2: Custom JSON Encoder
```python
from datetime import datetime
import json

class DateTimeEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

# Use in response:
return json.dumps(data, cls=DateTimeEncoder)
```

#### Option 3: Use Pydantic Models (Recommended)
If using FastAPI/Pydantic:
```python
from pydantic import BaseModel
from datetime import datetime

class NoteResponse(BaseModel):
    created_at: datetime  # Pydantic automatically serializes to ISO string

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
```

### Affected Endpoints
Based on logs, these endpoints are affected:
- `GET /api/v1/review/queue` - Returns review items with datetime fields
- Likely other endpoints returning datetime fields

### Frontend Mitigation

Frontend has been updated to:
1. ✅ Add 30-second timeout to prevent indefinite hanging
2. ✅ Better error messages for connection issues
3. ✅ Specific error code for connection failures (`CONNECTION_ERROR`)

### Testing After Backend Fix

1. **Test with curl:**
   ```bash
   curl -v http://localhost:8080/api/v1/review/queue \
     -H "Authorization: Bearer sb_test_RZbK4LCvhQm1kHMBPDXlT7BvNMIncEiH:read:notes,write:notes,read:review,write:review"
   ```
   Should return JSON response immediately (not hang)

2. **Test in browser:**
   - Open http://localhost:3000
   - Check Network tab - API calls should succeed
   - Review queue should load

3. **Check backend logs:**
   ```bash
   docker logs sb_python --tail 50
   ```
   Should not show datetime serialization errors

### Additional Backend Issues

#### YAML Parsing Errors
```
WARNING:src.core.review_workflow:Error reading Candidate-Evaluation-Summary-Setmary-Setup-1.md:
while scanning a quoted scalar
found unexpected end of stream
```

**Impact:** May cause delays or failures when processing notes
**Fix:** Add error handling for malformed YAML, skip problematic files

### Status

- ❌ **Backend:** DateTime serialization error (CRITICAL)
- ❌ **Backend:** YAML parsing errors (WARNING)
- ✅ **Frontend:** Timeout and error handling added
- ⏳ **Waiting:** Backend fix for datetime serialization

### Next Steps

1. **Backend Developer:** Fix datetime serialization in API responses
2. **Backend Developer:** Add error handling for YAML parsing
3. **Frontend:** Already updated with timeout and better error handling
4. **Testing:** Verify API works after backend fix


