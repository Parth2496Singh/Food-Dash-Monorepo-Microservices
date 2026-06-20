from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import models
from database import engine, get_db

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Seed Local Database if it's empty
def seed_database(db: Session):
    if db.query(models.MenuItem).count() == 0:
        print("Seeding mock data into database...")
        mock_items = [
            models.MenuItem(id="m1", restaurant_id="1", name="Chicken Tikka Masala", description="Spicy and creamy", price=14.99, category="Main", image_url="https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=800&q=80"),
            models.MenuItem(id="m2", restaurant_id="1", name="Garlic Naan", description="Freshly baked flatbread", price=3.99, category="Side", image_url="https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80"),
            models.MenuItem(id="m3", restaurant_id="2", name="Spicy Tuna Roll", description="Fresh tuna with spicy mayo", price=8.99, category="Sushi", image_url="https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=800&q=80"),
            models.MenuItem(id="m4", restaurant_id="3", name="Margherita Pizza", description="Classic cheese and tomato", price=12.99, category="Pizza", image_url="https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80"),
        ]
        db.add_all(mock_items)
        db.commit()

try:
    models.Base.metadata.create_all(bind=engine)
    # Open a temporary session to seed if needed
    from database import SessionLocal
    with SessionLocal() as db:
        seed_database(db)
except Exception as e:
    print(f"FATAL ERROR: Could not create tables: {e}")
    exit(1)

class MenuItemSchema(BaseModel):
    id: str
    restaurant_id: str
    name: str
    description: str
    price: float
    category: str
    image_url: str

    class Config:
        from_attributes = True

@app.get("/api/menu", response_model=List[MenuItemSchema])
def get_menu(restaurantId: Optional[str] = Query(None), db: Session = Depends(get_db)):
    if restaurantId:
        return db.query(models.MenuItem).filter(models.MenuItem.restaurant_id == restaurantId).all()
    return db.query(models.MenuItem).all()

@app.get("/api/menu/{item_id}", response_model=MenuItemSchema)
def get_menu_item(item_id: str, db: Session = Depends(get_db)):
    item = db.query(models.MenuItem).filter(models.MenuItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    return item
