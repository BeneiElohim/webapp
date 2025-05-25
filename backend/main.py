from fastapi import Depends, FastAPI, HTTPException, status
from contextlib import asynccontextmanager
from typing import Annotated, Any
from sqlmodel import Session, select, desc, SQLModel  # type: ignore
import models
from db import create_db_and_tables, get_session
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
import jwt
from jwt.exceptions import InvalidTokenError
from datetime import datetime, timedelta, timezone


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Runs before app starts
    create_db_and_tables()
    yield


app = FastAPI(lifespan=lifespan)

SessionDep = Annotated[Session, Depends(get_session)]

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

SECRET_KEY = "bc053d3f66f602fcb2c13f511243b964640d486440696606204e1f5fbee2904f"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30


def verifyPassword(plainPassword: str, hashedPassword: str):
    return pwd_context.verify(plainPassword, hashedPassword)


def getPasswordHash(password: str):
    return pwd_context.hash(password)


def getUser(db: SessionDep, username: str):
    user = db.exec(select(models.User).where(models.User.username == username)).first()
    return user


def authenticateUser(db: SessionDep, username: str, password: str):
    user = getUser(db, username)
    if not user:
        return False
    if not verifyPassword(password, user.passwordHash):
        return False
    return user


def createAccessToken(data: dict[str, Any], expires_delta: timedelta | None = None):
    toEncode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    toEncode.update({"exp": expire})
    encodedJwt = jwt.encode(toEncode, SECRET_KEY, algorithm=ALGORITHM)  # type: ignore
    return encodedJwt


async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)], db: SessionDep
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])  # type: ignore
        username = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = models.TokenData(username=username)
    except InvalidTokenError:
        raise credentials_exception
    user = getUser(db, username=(token_data.username))
    if user is None:
        raise credentials_exception
    return user


@app.post("/token")
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()], db: SessionDep
) -> models.Token:
    user = authenticateUser(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    accessTokenExpires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    accessToken = createAccessToken(
        data={"sub": user.username}, expires_delta=accessTokenExpires
    )
    return models.Token(access_token=accessToken, token_type="bearer")


@app.get("/users/me/", response_model=models.UserResponse)
async def read_users_me(
    current_user: Annotated[models.User, Depends(get_current_user)],
):
    return current_user


# Burada user yaratılıyor. Bunun ardından profile yaratmak lazım
@app.post(
    "/register", response_model=models.UserResponse, status_code=status.HTTP_201_CREATED
)
def register(userToCreate: models.UserCreate, db: SessionDep):
    existingUser = db.exec(
        select(models.User).where(models.User.username == userToCreate.username)
    ).first()

    if existingUser:
        raise HTTPException(status_code=400, detail="Username already registered")

    # Create user
    user = models.User(
        username=userToCreate.username,
        email=userToCreate.email,
        passwordHash=getPasswordHash(userToCreate.password),
    )

    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@app.post(
    "/users/me/createProfile",
    response_model=models.Profile,
    status_code=status.HTTP_201_CREATED,
)
async def createProfile(
    current_user: Annotated[models.User, Depends(get_current_user)],
    db: SessionDep,
    profileCreateInfo: models.ProfileCreate,
):
    existingProfile = db.exec(
        select(models.Profile).where(models.Profile.userId == current_user.id)
    ).first()
    if existingProfile:
        raise HTTPException(status_code=400, detail="Profile already exists.")

    profile = models.Profile(**profileCreateInfo.model_dump(), userId=current_user.id)  # type: ignore
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


@app.get("/users/me/reviews/", response_model=list[models.Review], status_code=200)
async def getCurrentUserReviews(
    current_user: Annotated[models.User, Depends(get_current_user)],
    db: SessionDep,
):
    allCurrentUserReviews = db.exec(
        select(models.Review)
        .where(models.Review.userId == current_user.id)
        .order_by(desc(models.Review.createdAt))
    ).all()
    currentUserProfile = db.exec(
        select(models.Profile).where(models.Profile.userId == current_user.id)
    ).first()
    if not currentUserProfile:
        raise HTTPException(status_code=400, detail="No profile for this User")
    reviewOuts: list[models.ReviewOut] = []
    for review in allCurrentUserReviews:
        reviewOut = models.ReviewOut(
            reviewId=review.reviewId,
            userId=review.userId,
            content=review.content,
            score=review.score,
            likes=review.likes,
            dislikes=review.dislikes,
            profilePictureRelativePath=currentUserProfile.profilePictureRelativePath,
            nickname=currentUserProfile.nickname,
            createdAt=review.createdAt,
            gameId=review.gameId,
        )
        reviewOuts.append(reviewOut)
    return reviewOuts


@app.get("/users/{userId}/reviews/", response_model=list[models.ReviewOut])
async def getUserReviews(userId: int, db: SessionDep):
    userProfile = db.exec(
        select(models.Profile).where(models.Profile.userId == userId)
    ).first()
    if not userProfile:
        raise HTTPException(status_code=404, detail="User profile not found")

    userReviews = db.exec(
        select(models.Review)
        .where(models.Review.userId == userId)
        .order_by(desc(models.Review.createdAt))
    ).all()
    reviewOuts: list[models.ReviewOut] = []
    for review in userReviews:
        reviewOut = models.ReviewOut(
            reviewId=review.reviewId,
            userId=review.userId,
            content=review.content,
            score=review.score,
            likes=review.likes,
            dislikes=review.dislikes,
            profilePictureRelativePath=userProfile.profilePictureRelativePath,
            nickname=userProfile.nickname,
            createdAt=review.createdAt,
            gameId=review.gameId,
        )
        reviewOuts.append(reviewOut)

    return reviewOuts


@app.put("/profiles/me/", response_model=models.Profile, status_code=200)
async def updateProfile(
    updateInfo: models.ProfileUpdate,
    current_user: Annotated[models.User, Depends(get_current_user)],
    db: SessionDep,
):
    profile = db.exec(
        select(models.Profile).where(models.Profile.userId == current_user.id)
    ).first()
    if not profile:
        raise HTTPException(
            status_code=400, detail="No profile exists for current User"
        )
    profile.bio = updateInfo.bio
    profile.nickname = updateInfo.nickname
    profile.profilePictureRelativePath = updateInfo.profilePictureRelativePath
    db.commit()
    db.refresh(profile)
    return profile


@app.get("/profiles/{profileId}", response_model=models.Profile, status_code=200)
async def getProfile(profileId: int, db: SessionDep):
    profile = db.exec(
        select(models.Profile).where(models.Profile.profileId == profileId)
    ).first()
    if not profile:
        raise HTTPException(
            status_code=400, detail="No profile exist with given profileId"
        )
    return profile


@app.get("/games/{gameId}", response_model=models.GameOut, status_code=200)
async def getGameInfo(gameId: int, db: SessionDep):
    game = db.exec(select(models.Game).where(models.Game.id == gameId)).first()
    if not game:
        raise HTTPException(status_code=404, detail="Game doesn't exist")
    platformsResult = db.exec(
        select(models.Platform)
        .join(models.GamePlatform)
        .where(models.GamePlatform.gameId == game.id)
    ).all()
    platformsList = list(platformsResult)
    genresResult = db.exec(
        select(models.Genre)
        .join(models.GameGenre)
        .where(models.GameGenre.gameId == game.id)
    ).all()
    genresList = list(genresResult)
    gameOut = models.GameOut(
        **game.model_dump(), platforms=platformsList, genres=genresList
    )
    return gameOut


@app.delete("/users/me", status_code=204)
async def deleteCurrentUser(
    current_user: Annotated[models.User, Depends(get_current_user)],
    db: SessionDep,
):
    profile = db.exec(
        select(models.Profile).where(models.Profile.userId == current_user.id)
    ).first()

    reviews = db.exec(
        select(models.Review).where(models.Review.userId == current_user.id)
    ).all()
    for review in reviews:
        reviewedGame = db.exec(
            select(models.Game).where(models.Game.id == review.gameId)
        ).first()
        if not reviewedGame:
            raise HTTPException(status_code=400)
        scoreSum = reviewedGame.averageRating * reviewedGame.reviewCount
        scoreSum -= review.score
        reviewedGame.reviewCount -= 1
        if reviewedGame.reviewCount > 0:
            reviewedGame.averageRating = scoreSum / reviewedGame.reviewCount
        else:
            reviewedGame.averageRating = 0.0
        db.delete(review)
    db.delete(profile)
    db.delete(current_user)
    db.commit()


@app.delete("/users/me/reviews/{reviewId}", status_code=204)
async def deleteCurrentUserReview(
    reviewId: int,
    db: SessionDep,
    currentUser: Annotated[models.User, Depends(get_current_user)],
):
    review = db.exec(
        select(models.Review).where(models.Review.reviewId == reviewId)
    ).first()
    if not review:
        raise HTTPException(status_code=400, detail="Review doesn't exist.")
    if review.userId != currentUser.id:
        raise HTTPException(
            status_code=403, detail="Not authorized to delete this review"
        )
    reviewedGame = db.exec(
        select(models.Game).where(models.Game.id == review.gameId)
    ).first()
    if not reviewedGame:
        raise HTTPException(status_code=400)
    scoreSum = reviewedGame.averageRating * reviewedGame.reviewCount
    scoreSum -= review.score
    reviewedGame.reviewCount -= 1
    if reviewedGame.reviewCount > 0:
        reviewedGame.averageRating = scoreSum / reviewedGame.reviewCount
    else:
        reviewedGame.averageRating = 0.0
    db.delete(review)
    db.commit()


@app.get(
    "/games/{gameId}/reviews", response_model=list[models.ReviewOut], status_code=200
)
async def getGameReviews(gameId: int, db: SessionDep):
    reviewsAndProfiles = db.exec(
        select(models.Review, models.Profile)
        .join(
            models.Profile,
            models.Profile.userId == models.Review.userId,  # type: ignore
        )  # Eğer eskiden foreign key olan profileId olmadığı için faillıyorsa reviewdaki modelin userIdsini profileId olarak değiştir.
        .where(models.Review.gameId == gameId)
        .order_by(desc(models.Review.createdAt))
    ).all()
    reviewOuts: list[models.ReviewOut] = []
    for review, profile in reviewsAndProfiles:
        reviewOut = models.ReviewOut(
            reviewId=review.reviewId,
            userId=review.userId,
            content=review.content,
            score=review.score,
            likes=review.likes,
            dislikes=review.dislikes,
            profilePictureRelativePath=profile.profilePictureRelativePath,
            nickname=profile.nickname,
            createdAt=review.createdAt,
            gameId=review.gameId,
        )
        reviewOuts.append(reviewOut)
    return reviewOuts


@app.get("/games/", status_code=200, response_model=list[models.GameOut])
async def getAllGamesInfo(db: SessionDep):
    allGames = db.exec(
        select(models.Game).order_by(desc(models.Game.averageRating))
    ).all()
    allGameOuts: list[models.GameOut] = []
    for game in allGames:
        platformsResult = db.exec(
            select(models.Platform)
            .join(models.GamePlatform)
            .where(models.GamePlatform.gameId == game.id)
        ).all()
        platformsList = list(platformsResult)
        genresResult = db.exec(
            select(models.Genre)
            .join(models.GameGenre)
            .where(models.GameGenre.gameId == game.id)
        ).all()
        genresList = list(genresResult)
        gameOut = models.GameOut(
            **game.model_dump(), platforms=platformsList, genres=genresList
        )
        allGameOuts.append(gameOut)
    return allGameOuts


# TODO creating review, updating review
@app.post(
    "/users/me/reviews",
    status_code=status.HTTP_201_CREATED,
    response_model=models.Review,
)
async def createReview(
    currentUser: Annotated[models.User, Depends(get_current_user)],
    db: SessionDep,
    reviewCreateInfo: models.ReviewCreate,
):
    reviewedGame = db.exec(
        select(models.Game).where(models.Game.id == reviewCreateInfo.gameId)
    ).first()

    if not reviewedGame:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Game doesnt't exist."
        )

    existingReview = db.exec(
        select(models.Review)
        .where(models.Review.userId == currentUser.id)
        .where(models.Review.gameId == reviewCreateInfo.gameId)
    ).first()

    if existingReview:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Game already reviewed"
        )

    review = models.Review(**reviewCreateInfo.model_dump(), userId=currentUser.id)  # type: ignore
    scoreSum = reviewedGame.averageRating * reviewedGame.reviewCount
    scoreSum += review.score
    reviewedGame.reviewCount += 1
    reviewedGame.averageRating = scoreSum / reviewedGame.reviewCount
    db.add(review)
    db.commit()
    db.refresh(review)
    return review


@app.put(
    "/users/me/reviews/", response_model=models.Review, status_code=status.HTTP_200_OK
)
async def updateReview(
    currentUser: Annotated[models.User, Depends(get_current_user)],
    db: SessionDep,
    reviewUpdateInfo: models.ReviewUpdate,
):
    reviewedGame = db.exec(
        select(models.Game).where(models.Game.id == reviewUpdateInfo.gameId)
    ).first()

    if not reviewedGame:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Game doesnt't exist."
        )

    existingReview = db.exec(
        select(models.Review)
        .where(models.Review.userId == currentUser.id)
        .where(models.Review.gameId == reviewUpdateInfo.gameId)
    ).first()

    if not existingReview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Review doesn't exist."
        )
    oldScore = existingReview.score
    newScore = reviewUpdateInfo.score
    scoreSum = reviewedGame.averageRating * reviewedGame.reviewCount
    scoreSum = scoreSum - oldScore + newScore
    reviewedGame.averageRating = scoreSum / reviewedGame.reviewCount
    existingReview.content = reviewUpdateInfo.content
    existingReview.score = reviewUpdateInfo.score
    db.commit()
    db.refresh(existingReview)
    return existingReview
