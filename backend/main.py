# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import sys, os
sys.path.append(os.path.dirname(__file__))

from routers import chat, sessions, documents, voice, locations
from routers.auth    import router as auth_router
from routers.admin   import router as admin_router
from routers.rights  import router as rights_router
from routers.ocr     import router as ocr_router
from routers.news    import router as news_router
from routers.flows   import router as flows_router
from routers.lawyers import router as lawyers_router
from routers.cases   import router as cases_router
from utils.database  import db
from utils.auth      import init_auth_tables


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("✅ Nyay-Sahayak API starting up")
    db.init_database()
    init_auth_tables()
    
    # Initialize Hindi font support
    try:
        from utils.font_setup import setup_fonts
        setup_fonts()
    except Exception as e:
        print(f"⚠️ Font setup error: {e}")
    
    yield
    print("Shutting down")


app = FastAPI(
    title="Nyay-Sahayak API",
    description="AI-powered Indian legal assistant — Gemini + Bhashini",
    version="3.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # open for Render deployment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router,     prefix="/api")
app.include_router(admin_router,    prefix="/api")
app.include_router(rights_router,   prefix="/api")
app.include_router(ocr_router,      prefix="/api")
app.include_router(news_router,     prefix="/api")
app.include_router(flows_router,    prefix="/api")
app.include_router(lawyers_router,  prefix="/api")
app.include_router(cases_router,    prefix="/api")
app.include_router(chat.router,     prefix="/api")
app.include_router(sessions.router, prefix="/api")
app.include_router(documents.router,prefix="/api")
app.include_router(voice.router,    prefix="/api")
app.include_router(locations.router,prefix="/api")


@app.get("/")
async def root():
    return {"name": "Nyay-Sahayak API", "version": "3.1.0", "docs": "/docs"}

@app.get("/health")
async def health():
    return {"status": "healthy"}
