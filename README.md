# 🇩🇪 DeutschLern — AI German Language Tutor & Learning Assistant

**DeutschLern** is a modern, mobile-first web application designed to help users master the German language using **Google Gemini 2.5 Flash AI**, browser-native **Direct Voice Chat (`de-DE`)**, interactive speech synthesis, and CEFR-tailored practice modules.

---

## ✨ Features

- 🎙️ **Direct Voice Chat (`de-DE`)**: Real-time hands-free speech recognition in German with auto-submission and speech synthesis readback.
- 📚 **Vocabulary Builder**: Instant translations, part of speech, gender badges (**der** / **die** / **das**), simplified pronunciation, and memory tips.
- 🗣️ **Conversation Practice**: Interactive scenario roleplay (Restaurants, Shopping, Travel, Work, Hobbies) with dual-language suggestions.
- 🌍 **Context Translator**: Deep contextual translation between German and English with rule highlights.
- 📖 **Grammar Explainer**: Structured explanations for cases, prepositions, tenses, and verb conjugations.
- 🧠 **Interactive Quiz Generator**: Step-by-step multiple choice quizzes with instant answer feedback and progress tracking.
- ✍️ **German Writing Corrector**: Side-by-side original vs corrected text diff comparison with grammar rules applied.
- 📱 **Mobile-First Glassmorphic Design**: Modern dark mode UI (`#090D16`), fixed bottom navigation bar, and slide-up modal sheets.

---

## 🛠️ Tech Stack

- **Backend**: Python 3.11, FastAPI, Uvicorn, `google-genai` SDK (`gemini-2.5-flash`), `python-dotenv`, Pydantic.
- **Frontend**: Vanilla HTML5, CSS3 (Design Tokens, Glassmorphism, Responsive Media Queries), ES6+ JavaScript.
- **Browser APIs**: Web Speech API (`SpeechRecognition` for voice input, `SpeechSynthesis` for German TTS).

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- Python 3.10+
- Google Gemini API Key (Get yours at [Google AI Studio](https://aistudio.google.com/))

### 2. Setup Backend
```bash
# Clone the repository
git clone https://github.com/Wisdom614/Learn_Germarn.git
cd Learn_Germarn/backend

# Create & activate virtual environment
python -m venv venv
# On Windows PowerShell:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure Environment Variables
cp .env.example .env
# Edit .env and set your GEMINI_API_KEY:
# GEMINI_API_KEY=your_actual_gemini_api_key
```

### 3. Run Application
```bash
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Open your browser and navigate to:
👉 **`http://127.0.0.1:8000/`**

---

## 📁 Repository Structure

```
Learn_Germarn/
├── backend/
│   ├── main.py              # FastAPI server & static file routes
│   ├── gemini_client.py     # Gemini AI client integration (gemini-2.5-flash)
│   ├── requirements.txt     # Python dependencies
│   ├── .env.example         # Environment template
│   └── .env                 # API Key (git-ignored)
├── frontend/
│   ├── index.html           # Mobile-first app layout
│   ├── css/
│   │   └── style.css        # Design tokens & glassmorphic styles
│   └── js/
│       └── app.js           # App state, Web Speech API, fetch handlers
├── .gitignore               # Excludes secrets & virtualenvs
└── README.md                # Project documentation
```

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.
