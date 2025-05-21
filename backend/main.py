from fastapi import Depends, FastAPI
from contextlib import asynccontextmanager
from typing import Annotated
from sqlmodel import Session
from db import create_db_and_tables, get_session


app = FastAPI()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Runs before app starts
    create_db_and_tables()
    yield
    # Runs after app closes


SessionDep = Annotated[Session, Depends(get_session)]


@app.get("/")
async def index():
    return {"message": "Hello World"}
