import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from google import genai
from google.genai import types
from twilio.rest import Client
import requests
from io import BytesIO
from PIL import Image


# 1. Cargar variables de entorno
load_dotenv()

# 2. Inicializar la aplicación FastAPI
app = FastAPI(title="Backend Consultorio Dental Inteligente")

# Permitir peticiones desde el frontend en Angular
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Inicializar clientes de APIs
gemini_client = None
try:
    if os.getenv("GEMINI_API_KEY"):
        # El SDK oficial google-genai inicializa el cliente de esta manera
        gemini_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    else:
        print("Advertencia: No se encontró GEMINI_API_KEY en las variables de entorno.")
except Exception as e:
    print(f"Advertencia: No se pudo iniciar el cliente de Gemini: {e}")


# 4. Modelos de datos para las peticiones
class CitaNotificacion(BaseModel):
    telefono: str  # Formato internacional, ej: "+573001234567"
    nombre: str
    fecha: str
    hora: str
    odontologo: str


class AnalisisProgreso(BaseModel):
    url_imagen_anterior: str
    url_imagen_nueva: str


# 5. Endpoints / Rutas
@app.get("/")
def home():
    return {"status": "online", "message": "API del Consultorio Dental lista"}


@app.post("/api/v1/analizar-progreso")
def analizar_progreso(datos: AnalisisProgreso):
    if not os.getenv("GEMINI_API_KEY") or gemini_client is None:
        raise HTTPException(status_code=500, detail="Falta la configuración de GEMINI_API_KEY en el servidor.")

    try:
        # 1. Descargar la imagen anterior desde Firebase Storage
        response_ant = requests.get(datos.url_imagen_anterior)
        response_ant.raise_for_status()
        img_ant = Image.open(BytesIO(response_ant.content))

        # 2. Descargar la imagen nueva desde Firebase Storage
        response_nue = requests.get(datos.url_imagen_nueva)
        response_nue.raise_for_status()
        img_nue = Image.open(BytesIO(response_nue.content))

        # 3. Definir el prompt detallado para la evaluación odontológica
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

        # 4. Invocar a Gemini enviándole ambas imágenes en el arreglo de contenidos
        response = gemini_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[img_ant, img_nue, prompt]
        )

        return {"analisis": response.text}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en el análisis de imágenes con Gemini: {str(e)}")


@app.post("/api/v1/notificar-cita")
def notificar_cita(cita: CitaNotificacion):
    account_sid = os.getenv("TWILIO_ACCOUNT_SID")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN")
    from_whatsapp = os.getenv("TWILIO_WHATSAPP_NUMBER")

    if not all([account_sid, auth_token, from_whatsapp]):
        raise HTTPException(status_code=500, detail="Configuración de Twilio incompleta en el servidor.")

    try:
        # Se usa 'client' en minúscula para no sobreescribir la clase 'Client' importada
        client = Client(account_sid, auth_token)
        
        # mensaje clínico profesional interactivo
        mensaje_cuerpo = (
            f"🦷 *Confirmación de Cita - Consultorio Dental*\n\n"
            f"Hola *{cita.nombre}*,\n"
            f"Te confirmamos que tu próxima cita ha sido agendada con éxito.\n\n"
            f"📅 *Fecha:* {cita.fecha}\n"
            f"⏰ *Hora:* {cita.hora}\n"
            f"👨‍⚕️ *Odontólogo:* {cita.odontologo}\n\n"
            f"_*Por favor llegar 10 minutos antes. Si necesitas reprogramar, comunícate con nosotros._"
        )

        # Aseguramos el prefijo 'whatsapp:' exigido por Twilio
        to_number = cita.telefono if cita.telefono.startswith("whatsapp:") else f"whatsapp:{cita.telefono}"

        message = client.messages.create(
            body=mensaje_cuerpo,
            from_=from_whatsapp,
            to=to_number
        )

        return {"status": "enviado", "sid": message.sid}

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al enviar WhatsApp mediante Twilio: {str(e)}")