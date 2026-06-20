import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from dotenv import load_dotenv

load_dotenv()

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

# Fallback to local SQLite if dummy URL is used or not provided
if not SQLALCHEMY_DATABASE_URL or "user:password" in SQLALCHEMY_DATABASE_URL:
    print("⚠️ PostgreSQL URL is a placeholder. Falling back to local SQLite database.")
    SQLALCHEMY_DATABASE_URL = "sqlite:///./local_mock.db"
    engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
else:
    try:
        engine = create_engine(SQLALCHEMY_DATABASE_URL)
        # Eagerly test the connection
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        print("✅ PostgreSQL Connected Successfully")
    except Exception as e:
        print(f"⚠️ PostgreSQL Connection Failed: {e}. Falling back to SQLite.")
        SQLALCHEMY_DATABASE_URL = "sqlite:///./local_mock.db"
        engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
