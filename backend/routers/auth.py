from fastapi import APIRouter, Depends
from backend import schemas
from backend import auth as auth_utils

router = APIRouter(
    prefix="/api/auth",
    tags=["auth"]
)

@router.get("/user", response_model=schemas.User)
def read_users_me(current_user: dict = Depends(auth_utils.get_current_user)):
    # current_user is the decoded token dictionary from Firebase
    return {
        "uid": current_user['uid'],
        "email": current_user.get('email'),
        "username": current_user.get('name') or current_user.get('email').split('@')[0] if current_user.get('email') else "User"
    }
