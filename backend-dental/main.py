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

#cargar variables de entorno 
load_dotenv()

app = FastAPI(title="Backend Backend Consultorio Dental Inteligente")

# Permitir peticiones desde el frontend en Angular
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inicializar clientes de APIs
try:
    # El SDK oficial google-genai inicializa el cliente de esta manera
    gemini_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

except Exception as e:
    print("fAdvertencia: No se pudo iniciar el cliente de Gemini: {e}") 


# Modelos de datos para las peticiones
class CitaNotificacion(BaseModel):
    telefono: str # Formato internacional, ej: "+573001234567"
    nombre: str 
    fecha: str 
    hora: str
    odontologo: str

class  AnalisisProgreso(BaseModel):
    url_imagen_anterior: str
    url_imagen_nueva: str

@app.get("/")
def home():
    return{"status": "online", "message": "API del Consultorio Dental lista"}    