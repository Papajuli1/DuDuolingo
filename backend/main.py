from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

app = FastAPI(title="DuDuolingo API", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class Message(BaseModel):
    id: int
    text: str

class User(BaseModel):
    id: int
    name: str
    email: str

# In-memory data store (replace with database later)
messages = [
    {"id": 1, "text": "Welcome to DuDuolingo!"},
    {"id": 2, "text": "Start learning today!"}
]

users = [
    {"id": 1, "name": "John Doe", "email": "john@example.com"},
    {"id": 2, "name": "Jane Smith", "email": "jane@example.com"}
]

@app.get("/")
async def root():
    return {"message": "Welcome to DuDuolingo API"}

@app.get("/messages", response_model=List[Message])
async def get_messages():
    return messages

@app.get("/users", response_model=List[User])
async def get_users():
    return users

@app.post("/messages", response_model=Message)
async def create_message(message: Message):
    messages.append(message.dict())
    return message

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
