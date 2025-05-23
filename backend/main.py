from fastapi import Depends, FastAPI, HTTPException
from contextlib import asynccontextmanager
from typing import Annotated
from sqlmodel import Session, select, SQLModel  # type: ignore
import models
from db import create_db_and_tables, get_session
from passlib.context import CryptContext


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


@app.get("/users/", response_model=list[models.UserOut], status_code=200)
async def getAllUsers(db: SessionDep):
    allUsers = db.exec(select(models.User))
    return allUsers


@app.get("/users/{userId}", response_model=models.UserOut, status_code=200)
async def getUser(userId: int, db: SessionDep):
    user = db.exec(select(models.User).where(userId == models.User.id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User doesn't exist")
    return user


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


@app.post("/users/", response_model=models.UserOut, status_code=201)
async def createUser(user: models.UserIn, db: SessionDep):
    hashedPassword = hash_password(user.password)
    existingUser = db.exec(
        select(models.User).where(models.User.username == user.username)
    ).first()
    if existingUser:
        raise HTTPException(
            status_code=400,
            detail="Username already registered",
        )
    dbUser = models.User(username=user.username, passwordHash=hashedPassword)
    db.add(dbUser)
    db.commit()
    db.refresh(dbUser)
    return dbUser


@app.put("/users/{userId}", response_model=models.UserOut, status_code=200)
async def updateUser(userId: int, userIn: models.UserIn, db: SessionDep):
    user = db.exec(select(models.User).where(userId == models.User.id)).first()
    if not user:
        raise HTTPException(
            status_code=404, detail="No user exists with the given userId to update"
        )
    user.username = userIn.username
    user.passwordHash = hash_password(userIn.password)
    db.commit()
    db.refresh(user)
    return user


@app.delete("/users/{userId}", status_code=204)
async def deleteUser(userId: int, db: SessionDep):
    user = db.exec(select(models.User).where(userId == models.User.id)).first()
    if not user:
        raise HTTPException(
            status_code=404, detail="No user exists with the given userId to delete"
        )
    db.delete(user)
    db.commit()
