import os
import json
import re
from dotenv import load_dotenv

load_dotenv()

# Try different import methods
try:
    # Try the new package directly
    import google.genai as genai
    print("[OK] Using google-genai package")
except ImportError:
    try:
        from google import genai
        print("[OK] Using google-genai package")
    except ImportError:
        try:
            # Try the old package
            import google.generativeai as genai
            print("[OK] Using google-generativeai package")
            USE_OLD_API = True
        except ImportError:
            print("[ERROR] No Gemini package found. Please install: pip install google-genai")
            raise

class GeminiGermanTutor:
    def __init__(self):
        # Get API key
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")
        
        # Check which API we're using
        if hasattr(genai, 'Client'):
            # New API (google-genai)
            self.use_new_api = True
            self.client = genai.Client(api_key=api_key)
            self.model_name = "gemini-2.5-flash"
            print(f"[OK] Using new API with model: {self.model_name}")
        else:
            # Old API (google-generativeai)
            self.use_new_api = False
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel('gemini-1.5-flash')
            self.model_name = "gemini-1.5-flash"
            print(f"[OK] Using old API with model: {self.model_name}")
        
        self.chat_history = {}
    
    def _generate_content(self, prompt):
        """Generate content using the appropriate API"""
        if self.use_new_api:
            # New API
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt
            )
            return response.text
        else:
            # Old API
            response = self.model.generate_content(prompt)
            return response.text
    
    def _clean_json_response(self, text):
        """Clean and extract JSON from response"""
        if not text:
            return {"error": "Empty response from API"}
        
        # Remove markdown code blocks
        text = re.sub(r'```json\s*', '', text)
        text = re.sub(r'```\s*', '', text)
        text = re.sub(r'```[a-zA-Z]*\s*', '', text)
        text = text.strip()
        
        # Try to find JSON object
        try:
            return json.loads(text)
        except:
            json_match = re.search(r'\{.*\}', text, re.DOTALL)
            if json_match:
                try:
                    return json.loads(json_match.group())
                except:
                    pass
            
            array_match = re.search(r'\[.*\]', text, re.DOTALL)
            if array_match:
                try:
                    return json.loads(array_match.group())
                except:
                    pass
            
            return {"error": "Could not parse response", "raw": text[:500]}
    
    def get_vocabulary(self, word: str, language: str = "German") -> dict:
        """Get vocabulary with translation, examples, and usage"""
        prompt = f"""
        You are a German language tutor. For the word "{word}" in {language}, provide:
        1. Translation in English
        2. Part of speech (noun, verb, adjective, etc.)
        3. If noun, provide the gender (der/die/das)
        4. Pronunciation guide (simplified)
        5. 3 example sentences in German with English translations
        6. Common phrases or idioms using this word
        7. Tips for remembering this word
        
        Format the response as JSON with these keys: 
        word, translation, part_of_speech, gender (if applicable), pronunciation, examples, common_phrases, memory_tip
        Only return valid JSON, no other text.
        """
        
        try:
            response_text = self._generate_content(prompt)
            return self._clean_json_response(response_text)
        except Exception as e:
            return {"error": str(e)}
    
    def get_grammar_help(self, question: str, topic: str = None) -> dict:
        """Explain German grammar rules"""
        topic_context = f" focusing on {topic}" if topic else ""
        prompt = f"""
        You are a German grammar expert. Answer this question{topic_context}:
        "{question}"
        
        Provide:
        1. Clear explanation of the grammar rule
        2. Examples showing the rule in action (at least 3)
        3. Common mistakes learners make
        4. Practice exercises (3 questions)
        5. Tips to remember the rule
        
        Format as JSON with keys: explanation, examples, common_mistakes, exercises, tips
        Only return valid JSON, no other text.
        """
        
        try:
            response_text = self._generate_content(prompt)
            return self._clean_json_response(response_text)
        except Exception as e:
            return {"error": str(e)}
    
    def conversation_practice(self, scenario: str, user_input: str, level: str = "A1") -> dict:
        """Practice conversation in German with corrections"""
        prompt = f"""
        You are a German conversation partner at level {level}. 
        Scenario: {scenario}
        Student says: "{user_input}"
        
        Respond as a native German speaker would, but:
        1. Keep your response at {level} level
        2. Correct any errors in the student's German
        3. Provide the English translation of your response
        4. Suggest 2-3 alternative ways to say it
        5. Highlight new vocabulary used
        
        Format as JSON with keys: 
        response, translation, corrections, alternatives, new_vocabulary
        Only return valid JSON, no other text.
        """
        
        try:
            response_text = self._generate_content(prompt)
            return self._clean_json_response(response_text)
        except Exception as e:
            return {"error": str(e)}
    
    def translate_with_context(self, text: str, source: str = "German", target: str = "English") -> dict:
        """Translate with contextual explanations"""
        prompt = f"""
        Translate from {source} to {target}:
        "{text}"
        
        Additionally provide:
        1. Literal translation
        2. Cultural/contextual notes
        3. Alternative translations
        4. Key vocabulary breakdown
        5. Grammar notes about the structure
        
        Format as JSON with keys: 
        translation, literal_translation, cultural_notes, alternatives, vocabulary_breakdown, grammar_notes
        Only return valid JSON, no other text.
        """
        
        try:
            response_text = self._generate_content(prompt)
            return self._clean_json_response(response_text)
        except Exception as e:
            return {"error": str(e)}
    
    def generate_quiz(self, topic: str, count: int = 5, level: str = "A1") -> dict:
        """Generate a quiz with questions and answers"""
        prompt = f"""
        Create a German language quiz at {level} level on the topic: "{topic}"
        
        Generate {count} questions mixing these types:
        - Multiple choice (vocabulary/grammar)
        - Fill in the blank (articles, verb conjugations)
        - True/False (comprehension)
        - Matching (words to definitions)
        
        For each question, provide:
        - Question text
        - Question type
        - Options/answer choices (if multiple choice)
        - Correct answer
        - Explanation of why it's correct
        - Difficulty level (easy/medium/hard)
        
        Format as JSON with keys: 
        topic, level, questions (array of question objects)
        Each question object should have: question, type, options (array), correct_answer, explanation, difficulty
        Only return valid JSON, no other text.
        """
        
        try:
            response_text = self._generate_content(prompt)
            return self._clean_json_response(response_text)
        except Exception as e:
            return {"error": str(e)}
    
    def correct_writing(self, text: str, level: str = "A1") -> dict:
        """Correct and improve German writing"""
        prompt = f"""
        You are a German language teacher at {level} level.
        Correct this German text:
        "{text}"
        
        Provide:
        1. The corrected version
        2. Explanation of each correction
        3. Grammar rules applied
        4. Vocabulary suggestions for improvement
        5. Overall feedback (positive + areas to improve)
        
        Format as JSON with keys:
        corrected_text, corrections, grammar_rules, vocabulary_suggestions, feedback
        Only return valid JSON, no other text.
        """
        
        try:
            response_text = self._generate_content(prompt)
            return self._clean_json_response(response_text)
        except Exception as e:
            return {"error": str(e)}
    
    def chat_with_tutor(self, user_id: str, message: str) -> str:
        """Maintain conversation with German tutor"""
        try:
            if user_id not in self.chat_history:
                self.chat_history[user_id] = []
            
            # Keep last 10 messages for context
            self.chat_history[user_id].append(f"Student: {message}")
            if len(self.chat_history[user_id]) > 10:
                self.chat_history[user_id] = self.chat_history[user_id][-10:]
            
            context = "\n".join(self.chat_history[user_id])
            
            prompt = f"""
            You are a German tutor. Here's the conversation so far:
            {context}
            
            Now respond as the tutor. Use a mix of German and English.
            Start with German, then provide the English translation.
            Be encouraging and correct mistakes gently.
            Keep responses at A1-A2 level.
            """
            
            response_text = self._generate_content(prompt)
            self.chat_history[user_id].append(f"Tutor: {response_text}")
            
            return response_text
        except Exception as e:
            return f"Error: {str(e)}"

# Singleton instance
try:
    german_tutor = GeminiGermanTutor()
    print("[OK] German tutor initialized successfully!")
except Exception as e:
    print(f"[ERROR] Failed to initialize German tutor: {e}")
    german_tutor = None