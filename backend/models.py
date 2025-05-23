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


class GameGenre(SQLModel, table=True):
    gameId: int = Field(foreign_key="game.id", primary_key=True)
    genreId: int = Field(foreign_key="genre.id", primary_key=True)


class Publisher(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(index=True, min_length=1)


class GamePublisher(SQLModel, table=True):
    gameId: int = Field(foreign_key="game.id", primary_key=True)
    publisherId: int = Field(foreign_key="publisher.id", primary_key=True)


class UserIn(BaseModel):
    username: str = Field(min_length=5, max_length=15)
    password: str = Field(min_length=8, max_length=15)


class UserOut(BaseModel):
    username: str = Field(min_length=5, max_length=15)
    id: int


class User(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    username: str = Field(unique=True)
    passwordHash: str
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# Birkaç tane kendi seçtiğimiz profile pic seçeneği ayarlayalım. Kullanıcı kendisi resim yüklemesin. ????
class Profile(SQLModel, table=True):
    profileId: int | None = Field(default=None, primary_key=True)
    userId: int = Field(foreign_key="user.id", unique=True)
    bio: str = Field(default="")
    profilePictureRelativePath: str = Field(
        default="../images/profilePictures/defaultProfilePicture.jpeg"
    )


class Review(SQLModel, table=True):
    reviewId: int | None = Field(default=None, primary_key=True)
    userId: int = Field(foreign_key="user.id")
    gameId: int = Field(foreign_key="game.id")
    content: str = Field(min_length=1)
    score: int = Field(ge=0, le=100)
    likes: int = Field(default=0)
    dislikes: int = Field(default=0)
