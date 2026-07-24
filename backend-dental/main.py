import base64
import os
import sys
from io import BytesIO

# Asegurar que el directorio del proyecto esté en sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from google import genai
from google.genai import types
from PIL import Image
import requests
from pydantic import BaseModel
from twilio.rest import Client

# Importar funciones personalizadas desde auth.py
from auth import (
    crear_token_acceso,
    verificar_password,
    obtener_password_hash,
    obtener_usuario_actual
)

# 1. Cargar variables de entorno
load_dotenv()

# 2. Inicializar la aplicación FastAPI
app = FastAPI(title="Backend Consultorio Dental Inteligente")

# Permitir peticiones desde el frontend en Angular
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200", "http://127.0.0.1:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Base de datos simulada de usuarios (en producción esto irá a MySQL/PostgreSQL)
# Credenciales de prueba: Usuario -> admin@dental.com | Password -> admin123
USUARIOS_DB = {
    "admin@dental.com": {
        "username": "admin@dental.com",
        "nombre": "Dr. Odontólogo",
        "password_hash": obtener_password_hash("admin123"),
        "rol": "odontologo"
    }
}

# 3. Inicializar cliente de Gemini SDK oficial
gemini_client = None
try:
    if os.getenv("GEMINI_API_KEY"):
        gemini_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    else:
        print("Advertencia: No se encontró GEMINI_API_KEY en las variables de entorno.")
except Exception as e:
    print(f"Advertencia: No se pudo iniciar el cliente de Gemini: {e}")


# 4. Modelos de datos para las peticiones Pydantic
class TokenRespuesta(BaseModel):
    access_token: str
    token_type: str


class CitaNotificacion(BaseModel):
    telefono: str  # Formato internacional, ej: "+573001234567"
    nombre: str
    fecha: str
    hora: str
    odontologo: str


class AnalisisProgreso(BaseModel):
    url_imagen_anterior: str
    url_imagen_nueva: str


# 5. Funciones auxiliares
def obtener_imagen(fuente: str) -> Image.Image:
    """Convierte una URL HTTP o un String Base64 en un objeto PIL Image."""
    if fuente.startswith("http://") or fuente.startswith("https://"):
        response = requests.get(fuente)
        response.raise_for_status()
        return Image.open(BytesIO(response.content))
    elif fuente.startswith("data:image"):
        header, base64_str = fuente.split(",", 1)
        data = base64.b64decode(base64_str)
        return Image.open(BytesIO(data))
    else:
        data = base64.b64decode(fuente)
        return Image.open(BytesIO(data))


# 6. Endpoints / Rutas
@app.get("/")
def home():
    return {"status": "online", "message": "API del Consultorio Dental lista"}


# --- ENDPOINT DE AUTENTICACIÓN (LOGIN) ---
@app.post("/api/v1/auth/login", response_model=TokenRespuesta)
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Endpoint para autenticación de usuarios.
    Recibe username (correo) y password en formato Form Data.
    Retorna el Token JWT.
    """
    usuario = USUARIOS_DB.get(form_data.username)

    if not usuario or not verificar_password(form_data.password, usuario["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = crear_token_acceso(
        data={"sub": usuario["username"], "rol": usuario["rol"]}
    )

    return {"access_token": token, "token_type": "bearer"}


# --- ENDPOINT PROTEGIDO DE EVALUACIÓN DE IMÁGENES ---
@app.post("/api/v1/analizar-progreso")
def analizar_progreso(
    datos: AnalisisProgreso,
    usuario_autenticado: dict = Depends(obtener_usuario_actual)
):
    if not os.getenv("GEMINI_API_KEY") or gemini_client is None:
        raise HTTPException(
            status_code=500,
            detail="Falta la configuración de GEMINI_API_KEY en el servidor."
        )

    try:
        # 1. Obtener imágenes (soporta URL HTTP o Base64)
        img_ant = obtener_imagen(datos.url_imagen_anterior)
        img_nue = obtener_imagen(datos.url_imagen_nueva)

        # 2. Definir el prompt para la evaluación odontológica
        prompt = (
            "Actúa como un ortodoncista y odontólogo senior con amplia experiencia. "
            "Se te presentan dos imágenes de un tratamiento dental de un mismo paciente. "
            "La primera imagen muestra el estado anterior (izquierda o inicio) y la segunda el estado actual (derecha o evolución). "
            "Realiza un análisis comparativo y estructurado sobre la evolución del tratamiento, cambios notables y recomendaciones.\n\n"
            "Debes responder estrictamente en formato JSON válido, sin bloques de código Markdown alrededor (es decir, NO uses ```json). "
            "Usa exactamente este esquema:\n"
            "{\n"
            '  "cambios_observados": "Descripción detallada de la alineación, espacios o salud de las encías.",\n'
            '  "porcentaje_avance_estimado": 45,\n'
            '  "alertas_o_puntos_criticos": "Describe si hay inflamación, brackets sueltos, mala higiene o si todo está excelente.",\n'
            '  "recomendaciones_clinicas": "Sugerencias de uso de elásticos, cambio de arco, refuerzo de higiene, etc."\n'
            "}"
        )

        # 3. Invocar a Gemini enviándole ambas imágenes y solicitando respuesta JSON nativa
        response = gemini_client.models.generate_content(
            model="gemini-2.0-flash",
            contents=[img_ant, img_nue, prompt],
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )

        raw_text = response.text.strip() if response.text else "{}"
        # Limpieza preventiva por si acaso
        if raw_text.startswith("```"):
            lines = raw_text.splitlines()
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].startswith("```"):
                lines = lines[:-1]
            raw_text = "\n".join(lines).strip()

        return {"analisis": raw_text}

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error en el análisis de imágenes con Gemini: {str(e)}"
        )


# --- ENDPOINT DE NOTIFICACIÓN WHATSAPP ---
@app.post("/api/v1/notificar-cita")
def notificar_cita(cita: CitaNotificacion):
    account_sid = os.getenv("TWILIO_ACCOUNT_SID")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN")
    from_whatsapp = os.getenv("TWILIO_WHATSAPP_NUMBER")

    if not all([account_sid, auth_token, from_whatsapp]):
        raise HTTPException(
            status_code=500,
            detail="Configuración de Twilio incompleta en el servidor."
        )

    try:
        client = Client(account_sid, auth_token)

        mensaje_cuerpo = (
            f"🦷 *Confirmación de Cita - Consultorio Dental*\n\n"
            f"Hola *{cita.nombre}*,\n"
            f"Te confirmamos que tu próxima cita ha sido agendada con éxito.\n\n"
            f"📅 *Fecha:* {cita.fecha}\n"
            f"⏰ *Hora:* {cita.hora}\n"
            f"👨‍⚕️ *Odontólogo:* {cita.odontologo}\n\n"
            f"_*Por favor llegar 10 minutos antes. Si necesitas reprogramar, comunícate con nosotros._"
        )

        to_number = cita.telefono if cita.telefono.startswith("whatsapp:") else f"whatsapp:{cita.telefono}"

        message = client.messages.create(
            body=mensaje_cuerpo,
            from_=from_whatsapp,
            to=to_number
        )

        return {"status": "enviado", "sid": message.sid}

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Error al enviar WhatsApp mediante Twilio: {str(e)}"
        )