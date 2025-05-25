from sqlmodel import Field, SQLModel
from datetime import datetime, timezone
from pydantic import BaseModel


class Game(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(index=True, min_length=1)
    releaseYear: int = Field(index=True)
    description: str = Field(min_length=1)
    averageRating: float = Field(default=0.0, index=True)
    reviewCount: int = Field(default=0, index=True)
    publisher: str
    coverArtRelativePath: str = Field(
        default="../images/gameCoverArts/gameCoverArtPlaceholder.jpeg"
    )


class Platform(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(index=True, min_length=1)


class GamePlatform(SQLModel, table=True):
    gameId: int = Field(foreign_key="game.id", primary_key=True)
    platformId: int = Field(foreign_key="platform.id", primary_key=True)


class Genre(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(index=True, min_length=1)


class GameOut(BaseModel):
    id: int
    name: str
    releaseYear: int
    description: str
    averageRating: float
    reviewCount: int
    publisher: str
    coverArtRelativePath: str
    platforms: list[Platform]
    genres: list[Genre]


class GameGenre(SQLModel, table=True):
    gameId: int = Field(foreign_key="game.id", primary_key=True)
    genreId: int = Field(foreign_key="genre.id", primary_key=True)


class Publisher(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(index=True, min_length=1)


class GamePublisher(SQLModel, table=True):
    gameId: int = Field(foreign_key="game.id", primary_key=True)
    publisherId: int = Field(foreign_key="publisher.id", primary_key=True)


class UserCreate(BaseModel):
    username: str
    email: str
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: str


class User(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    username: str = Field(unique=True)
    passwordHash: str
    email: str
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# Birkaç tane kendi seçtiğimiz profile pic seçeneği ayarlayalım. Kullanıcı kendisi resim yüklemesin. ????
class Profile(SQLModel, table=True):
    profileId: int | None = Field(default=None, primary_key=True)
    userId: int = Field(foreign_key="user.id", unique=True)
    bio: str = Field(default="")
    nickname: str = Field(unique=True)
    profilePictureRelativePath: str = Field(
        default="../images/profilePictures/defaultProfilePicture.jpeg"
    )


class ProfileUpdate(BaseModel):
    bio: str
    nickname: str
    profilePictureRelativePath: str


class ProfileCreate(BaseModel):
    bio: str
    nickname: str
    profilePictureRelativePath: str


class ReviewCreate(BaseModel):
    gameId: int
    content: str
    score: int


class ReviewUpdate(BaseModel):
    gameId: int
    content: str
    score: int


class Review(SQLModel, table=True):
    reviewId: int | None = Field(default=None, primary_key=True)
    userId: int = Field(foreign_key="user.id")
    gameId: int = Field(foreign_key="game.id")
    content: str = Field(min_length=1)
    score: int = Field(ge=0, le=100)
    likes: int = Field(default=0)
    dislikes: int = Field(default=0)
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ReviewOut(BaseModel):
    reviewId: int | None
    userId: int
    gameId: int
    content: str
    score: int
    likes: int
    dislikes: int
    profilePictureRelativePath: str
    nickname: str
    createdAt: datetime


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: str
