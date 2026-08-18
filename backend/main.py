from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
import uvicorn
import traceback

# Models
class VocabularyRequest(BaseModel):
    word: str
    language: str = "German"

class GrammarRequest(BaseModel):
    question: str
    topic: Optional[str] = None

class ConversationRequest(BaseModel):
    scenario: str
    user_input: str
    level: str = "A1"

class TranslationRequest(BaseModel):
    text: str
    source_lang: str = "German"
    target_lang: str = "English"

class QuizRequest(BaseModel):
    topic: str
    count: int = 5
    level: str = "A1"

class WritingCorrectionRequest(BaseModel):
    text: str
    level: str = "A1"

# Import the tutor
from gemini_client import german_tutor

import os
from fastapi.staticfiles import StaticFiles

app = FastAPI(title="German Language Learning API", version="1.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.responses import FileResponse, JSONResponse

frontend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
if os.path.exists(frontend_path):
    app.mount("/static", StaticFiles(directory=frontend_path, html=True), name="frontend_static")

@app.get("/")
async def root_app():
    index_file = os.path.join(frontend_path, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {"message": "🇩🇪 German Language Learning Assistant", "status": "ready"}

@app.get("/api")
async def api_info():
    return {"message": "🇩🇪 German Language Learning Assistant API", "status": "ready"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    if german_tutor is None:
        return {"status": "error", "message": "German tutor not initialized"}
    return {"status": "healthy", "model": german_tutor.model_name}

@app.post("/vocabulary")
async def get_vocabulary(request: VocabularyRequest):
    if german_tutor is None:
        raise HTTPException(status_code=503, detail="German tutor not initialized")
    try:
        result = german_tutor.get_vocabulary(request.word, request.language)
        return JSONResponse(result)
    except Exception as e:
        print(f"Error in vocabulary: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/grammar")
async def get_grammar_help(request: GrammarRequest):
    if german_tutor is None:
        raise HTTPException(status_code=503, detail="German tutor not initialized")
    try:
        result = german_tutor.get_grammar_help(request.question, request.topic)
        return JSONResponse(result)
    except Exception as e:
        print(f"Error in grammar: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/conversation")
async def conversation_practice(request: ConversationRequest):
    if german_tutor is None:
        raise HTTPException(status_code=503, detail="German tutor not initialized")
    try:
        result = german_tutor.conversation_practice(
            request.scenario, 
            request.user_input, 
            request.level
        )
        return JSONResponse(result)
    except Exception as e:
        print(f"Error in conversation: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/translate")
async def translate(request: TranslationRequest):
    if german_tutor is None:
        raise HTTPException(status_code=503, detail="German tutor not initialized")
    try:
        result = german_tutor.translate_with_context(
            request.text,
            request.source_lang,
            request.target_lang
        )
        return JSONResponse(result)
    except Exception as e:
        print(f"Error in translation: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/quiz")
async def generate_quiz(request: QuizRequest):
    if german_tutor is None:
        raise HTTPException(status_code=503, detail="German tutor not initialized")
    try:
        result = german_tutor.generate_quiz(
            request.topic,
            request.count,
            request.level
        )
        return JSONResponse(result)
    except Exception as e:
        print(f"Error in quiz: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/correct")
async def correct_writing(request: WritingCorrectionRequest):
    if german_tutor is None:
        raise HTTPException(status_code=503, detail="German tutor not initialized")
    try:
        result = german_tutor.correct_writing(request.text, request.level)
        return JSONResponse(result)
    except Exception as e:
        print(f"Error in correction: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat")
async def chat_with_tutor(user_id: str, message: str):
    if german_tutor is None:
        raise HTTPException(status_code=503, detail="German tutor not initialized")
    try:
        result = german_tutor.chat_with_tutor(user_id, message)
        return {"response": result}
    except Exception as e:
        print(f"Error in chat: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)