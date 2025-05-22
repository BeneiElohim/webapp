from fastapi import Depends, FastAPI
from contextlib import asynccontextmanager
from typing import Annotated
from sqlmodel import Session, SQLModel  # type: ignore
import models  # type: ignore
from db import create_db_and_tables, get_session


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Runs before app starts
    create_db_and_tables()
    yield


app = FastAPI(lifespan=lifespan)

SessionDep = Annotated[Session, Depends(get_session)]


@app.get("/")
async def index():
    return {"message": "Hello World"}
