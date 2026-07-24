from datetime import datetime, timedelta, timezone
import os
import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from dotenv import load_dotenv

load_dotenv()

# Configuración de variables
SECRET_KEY = os.getenv("SECRET_KEY", "secret_default")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 480))

# Esquema OAuth2 para FastAPI
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def verificar_password(plain_password: str, hashed_password: str) -> bool:
    """Compara una contraseña plana contra su hash encriptado."""
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


def obtener_password_hash(password: str) -> str:
    """Genera un hash seguro a partir de una contraseña."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def crear_token_acceso(data: dict) -> str:
    """Genera un token JWT firmado con fecha de expiración."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})

    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def obtener_usuario_actual(token: str = Depends(oauth2_scheme)) -> dict:
    """Valida el token en las peticiones entrantes."""
    exception_unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token de acceso inválido o expirado",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise exception_unauthorized
        return {"username": username, "rol": payload.get("rol", "usuario")}

    except jwt.PyJWTError:
        raise exception_unauthorized
