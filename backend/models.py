from pydantic import BaseModel
from typing import Optional, List

class VocabularyRequest(BaseModel):
    word: str
    language: str = "German"

class GrammarRequest(BaseModel):
    question: str
    topic: Optional[str] = None

class ConversationRequest(BaseModel):
    scenario: str
    user_input: str
    level: str = "A1"  # A1, A2, B1, B2, C1

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