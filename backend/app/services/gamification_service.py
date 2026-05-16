from datetime import date, timedelta
from sqlalchemy.orm import Session
from app.models.user import User

def add_exp(db: Session, user_id: str, points: int):
    """Thêm điểm kinh nghiệm cho người dùng."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return
    
    if not user.exp_points:
        user.exp_points = 0
    
    user.exp_points += points
    db.commit()

def log_user_activity(db: Session, user_id: str, exp_reward: int = 10):
    """
    Cập nhật Streak (chuỗi ngày học) và thưởng EXP nếu đây là hoạt động đầu tiên trong ngày.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return
    
    today = date.today()
    
    # Nếu đã học hôm nay rồi thì chỉ thưởng thêm EXP nếu cần (tuỳ logic, ở đây mình chỉ thưởng XP lần đầu hoặc thưởng tuỳ ý)
    if user.last_study_date == today:
        if exp_reward > 0:
            add_exp(db, user_id, exp_reward)
        return
        
    # Tính toán streak
    if user.last_study_date == today - timedelta(days=1):
        # Học liên tiếp
        user.current_streak = (user.current_streak or 0) + 1
    else:
        # Mất chuỗi hoặc ngày đầu tiên
        user.current_streak = 1
        
    # Cập nhật chuỗi dài nhất
    if user.current_streak > (user.longest_streak or 0):
        user.longest_streak = user.current_streak
        
    user.last_study_date = today
    
    # Thưởng EXP cho ngày học mới
    if not user.exp_points:
        user.exp_points = 0
    user.exp_points += exp_reward
    
    db.commit()
