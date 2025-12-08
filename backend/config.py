from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # MongoDB Configuration
    MONGODB_URL: str = "mongodb://localhost:27017/"
    DATABASE_NAME: str = "learning_system"
    
    # JWT Configuration
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Server Configuration
    BACKEND_URL: str = "http://localhost:8000"
    BACKEND_PORT: int = 8000
    
    # CORS Configuration
    FRONTEND_URL: str = "http://localhost:3000"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
