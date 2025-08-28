from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
import logging
from datetime import datetime
import json
import requests

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# AI Model Configurations - Production Ready
AI_MODELS = {
    'gpt-4': {
        'name': 'GPT-4 (OpenAI)',
        'provider': 'openai',
        'api_base': 'https://api.openai.com/v1',
        'api_key_env': 'OPENAI_API_KEY',
        'endpoint': '/chat/completions',
        'max_tokens': 4000,
        'temperature': 0.7
    },
    'gpt-3.5-turbo': {
        'name': 'GPT-3.5 Turbo (OpenAI)',
        'provider': 'openai',
        'api_base': 'https://api.openai.com/v1',
        'api_key_env': 'OPENAI_API_KEY',
        'endpoint': '/chat/completions',
        'max_tokens': 4000,
        'temperature': 0.7
    },
    'gpt-4-turbo': {
        'name': 'GPT-4 Turbo (OpenAI)',
        'provider': 'openai',
        'api_base': 'https://api.openai.com/v1',
        'api_key_env': 'OPENAI_API_KEY',
        'endpoint': '/chat/completions',
        'max_tokens': 4000,
        'temperature': 0.7
    },
    'claude-3-sonnet': {
        'name': 'Claude 3 Sonnet (Anthropic)',
        'provider': 'anthropic',
        'api_base': 'https://api.anthropic.com',
        'api_key_env': 'ANTHROPIC_API_KEY',
        'endpoint': '/v1/messages',
        'max_tokens': 4000,
        'temperature': 0.7
    },
    'claude-3-haiku': {
        'name': 'Claude 3 Haiku (Anthropic)',
        'provider': 'anthropic',
        'api_base': 'https://api.anthropic.com',
        'api_key_env': 'ANTHROPIC_API_KEY',
        'endpoint': '/v1/messages',
        'max_tokens': 4000,
        'temperature': 0.7
    },
    'claude-3-opus': {
        'name': 'Claude 3 Opus (Anthropic)',
        'provider': 'anthropic',
        'api_base': 'https://api.anthropic.com',
        'endpoint': '/v1/messages',
        'api_key_env': 'ANTHROPIC_API_KEY',
        'max_tokens': 4000,
        'temperature': 0.7
    },
    'gemini-pro': {
        'name': 'Gemini Pro (Google)',
        'provider': 'google',
        'api_base': 'https://generativelanguage.googleapis.com',
        'api_key_env': 'GOOGLE_API_KEY',
        'endpoint': '/v1beta/models/gemini-pro:generateContent',
        'max_tokens': 4000,
        'temperature': 0.7
    },
    'gemini-pro-vision': {
        'name': 'Gemini Pro Vision (Google)',
        'provider': 'google',
        'api_base': 'https://generativelanguage.googleapis.com',
        'api_key_env': 'GOOGLE_API_KEY',
        'endpoint': '/v1beta/models/gemini-pro-vision:generateContent',
        'max_tokens': 4000,
        'temperature': 0.7
    },
    'llama-2-70b': {
        'name': 'Llama 2 70B (Meta)',
        'provider': 'replicate',
        'api_base': 'https://api.replicate.com/v1',
        'api_key_env': 'REPLICATE_API_KEY',
        'endpoint': '/predictions',
        'max_tokens': 4000,
        'temperature': 0.7
    },
    'mistral-7b': {
        'name': 'Mistral 7B (Mistral AI)',
        'provider': 'mistral',
        'api_base': 'https://api.mistral.ai/v1',
        'api_key_env': 'MISTRAL_API_KEY',
        'endpoint': '/chat/completions',
        'max_tokens': 4000,
        'temperature': 0.7
    },
    'mistral-large': {
        'name': 'Mistral Large (Mistral AI)',
        'provider': 'mistral',
        'api_base': 'https://api.mistral.ai/v1',
        'api_key_env': 'MISTRAL_API_KEY',
        'endpoint': '/chat/completions',
        'max_tokens': 4000,
        'temperature': 0.7
    }
}

# Default model
DEFAULT_MODEL = 'gpt-3.5-turbo'

# Conversation history storage (in production, use a database)
conversations = {}

class AIService:
    def __init__(self):
        self.api_keys = {}
        self._load_api_keys()
    
    def _load_api_keys(self):
        """Load all API keys from environment variables"""
        for model_id, config in AI_MODELS.items():
            env_key = config['api_key_env']
            api_key = os.getenv(env_key)
            if api_key:
                self.api_keys[model_id] = api_key
                logger.info(f"✅ API key loaded for {model_id}")
            else:
                logger.warning(f"⚠️  No API key found for {model_id} ({env_key})")
    
    def generate_response(self, message, model=DEFAULT_MODEL, conversation_id=None):
        """Generate AI response using the specified model"""
        try:
            # Validate model
            if model not in AI_MODELS:
                logger.warning(f"Model {model} not found, using default")
                model = DEFAULT_MODEL
            
            model_config = AI_MODELS[model]
            
            # Check if API key is available
            if model not in self.api_keys:
                return self._generate_mock_response(message, model, conversation_id)
            
            # Get conversation history
            history = conversations.get(conversation_id, [])
            
            # Generate response based on provider
            if model_config['provider'] == 'openai':
                response = self._call_openai(message, model, model_config, history)
            elif model_config['provider'] == 'anthropic':
                response = self._call_anthropic(message, model, model_config, history)
            elif model_config['provider'] == 'google':
                response = self._call_google(message, model, model_config, history)
            elif model_config['provider'] == 'replicate':
                response = self._call_replicate(message, model, model_config, history)
            elif model_config['provider'] == 'mistral':
                response = self._call_mistral(message, model, model_config, history)
            else:
                raise Exception(f"Unsupported provider: {model_config['provider']}")
            
            # Update conversation history
            if conversation_id:
                if conversation_id not in conversations:
                    conversations[conversation_id] = []
                
                conversations[conversation_id].append({
                    "role": "user",
                    "content": message,
                    "timestamp": datetime.now().isoformat()
                })
                conversations[conversation_id].append({
                    "role": "assistant",
                    "content": response,
                    "timestamp": datetime.now().isoformat()
                })
            
            return {
                "response": response,
                "model": model,
                "model_name": model_config['name'],
                "timestamp": datetime.now().isoformat(),
                "success": True
            }
            
        except Exception as e:
            logger.error(f"Error generating response with {model}: {str(e)}")
            return {
                "response": f"Sorry, I encountered an error with {model}: {str(e)}",
                "model": model,
                "timestamp": datetime.now().isoformat(),
                "success": False,
                "error": str(e)
            }
    
    def _call_openai(self, message, model, config, history):
        """Call OpenAI API"""
        api_key = self.api_keys[model]
        url = f"{config['api_base']}{config['endpoint']}"
        
        # Prepare messages
        messages = [
            {
                "role": "system",
                "content": "You are a helpful AI assistant integrated into a development environment. You can help with coding, debugging, explaining concepts, and general programming questions. Be concise but thorough in your responses."
            }
        ]
        
        # Add conversation history
        for msg in history[-10:]:
            messages.append({
                "role": msg["role"],
                "content": msg["content"]
            })
        
        # Add current message
        messages.append({
            "role": "user",
            "content": message
        })
        
        payload = {
            "model": model,
            "messages": messages,
            "max_tokens": config['max_tokens'],
            "temperature": config['temperature']
        }
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        
        result = response.json()
        return result['choices'][0]['message']['content']
    
    def _call_anthropic(self, message, model, config, history):
        """Call Anthropic API (Claude)"""
        api_key = self.api_keys[model]
        url = f"{config['api_base']}{config['endpoint']}"
        
        # Prepare messages for Claude
        messages = []
        
        # Add conversation history
        for msg in history[-10:]:
            messages.append({
                "role": msg["role"],
                "content": msg["content"]
            })
        
        # Add current message
        messages.append({
            "role": "user",
            "content": message
        })
        
        payload = {
            "model": model,
            "messages": messages,
            "max_tokens": config['max_tokens'],
            "temperature": config['temperature']
        }
        
        headers = {
            "x-api-key": api_key,
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01"
        }
        
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        
        result = response.json()
        return result['content'][0]['text']
    
    def _call_google(self, message, model, config, history):
        """Call Google Gemini API"""
        api_key = self.api_keys[model]
        url = f"{config['api_base']}{config['endpoint']}?key={api_key}"
        
        # Prepare content for Gemini
        content = []
        
        # Add conversation history
        for msg in history[-10:]:
            content.append({
                "role": msg["role"],
                "parts": [{"text": msg["content"]}]
            })
        
        # Add current message
        content.append({
            "role": "user",
            "parts": [{"text": message}]
        })
        
        payload = {
            "contents": content,
            "generationConfig": {
                "maxOutputTokens": config['max_tokens'],
                "temperature": config['temperature']
            }
        }
        
        response = requests.post(url, json=payload)
        response.raise_for_status()
        
        result = response.json()
        return result['candidates'][0]['content']['parts'][0]['text']
    
    def _call_replicate(self, message, model, config, history):
        """Call Replicate API (for Llama and other models)"""
        api_key = self.api_keys[model]
        url = f"{config['api_base']}{config['endpoint']}"
        
        # Prepare prompt with history
        prompt = "You are a helpful AI assistant integrated into a development environment.\n\n"
        
        for msg in history[-10:]:
            if msg["role"] == "user":
                prompt += f"User: {msg['content']}\n"
            else:
                prompt += f"Assistant: {msg['content']}\n"
        
        prompt += f"User: {message}\nAssistant:"
        
        payload = {
            "version": "meta/llama-2-70b-chat:02e509c789964a7ea8736978a43525956ef40397be9033abf9fd2badfe68c9e3",
            "input": {
                "prompt": prompt,
                "max_tokens": config['max_tokens'],
                "temperature": config['temperature']
            }
        }
        
        headers = {
            "Authorization": f"Token {api_key}",
            "Content-Type": "application/json"
        }
        
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        
        result = response.json()
        return result['output'][0]
    
    def _call_mistral(self, message, model, config, history):
        """Call Mistral AI API"""
        api_key = self.api_keys[model]
        url = f"{config['api_base']}{config['endpoint']}"
        
        # Prepare messages
        messages = [
            {
                "role": "system",
                "content": "You are a helpful AI assistant integrated into a development environment. You can help with coding, debugging, explaining concepts, and general programming questions. Be concise but thorough in your responses."
            }
        ]
        
        # Add conversation history
        for msg in history[-10:]:
            messages.append({
                "role": msg["role"],
                "content": msg["content"]
            })
        
        # Add current message
        messages.append({
            "role": "user",
            "content": message
        })
        
        payload = {
            "model": model,
            "messages": messages,
            "max_tokens": config['max_tokens'],
            "temperature": config['temperature']
        }
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        
        result = response.json()
        return result['choices'][0]['message']['content']
    
    def _generate_mock_response(self, message, model, conversation_id):
        """Generate a mock response when no API key is available"""
        model_config = AI_MODELS.get(model, {'name': model})
        mock_responses = [
            f"I understand you said: '{message}'. This is a mock response from {model_config['name']}. To get real AI responses, please add your API key to the .env file.",
            f"Mock response from {model_config['name']}: I can help you with '{message}'. Add your API key for real AI assistance!",
            f"Hello! I'm {model_config['name']} in mock mode. You asked about '{message}'. Please configure your API key for full functionality.",
            f"Mock AI response: '{message}' is an interesting question. I'd love to help with real AI responses once you add your API key!",
            f"Currently running in demo mode with {model_config['name']}. Your message: '{message}'. Add API key for real AI capabilities!"
        ]
        
        import random
        response = random.choice(mock_responses)
        
        # Update conversation history
        if conversation_id:
            if conversation_id not in conversations:
                conversations[conversation_id] = []
            
            conversations[conversation_id].append({
                "role": "user",
                "content": message,
                "timestamp": datetime.now().isoformat()
            })
            conversations[conversation_id].append({
                "role": "assistant",
                "content": response,
                "timestamp": datetime.now().isoformat()
            })
        
        return {
            "response": response,
            "model": model,
            "model_name": model_config['name'],
            "timestamp": datetime.now().isoformat(),
            "success": True
        }

# Initialize AI service
ai_service = AIService()

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    configured_models = []
    for model_id in AI_MODELS.keys():
        if model_id in ai_service.api_keys:
            configured_models.append(model_id)
    
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "available_models": list(AI_MODELS.keys()),
        "configured_models": configured_models,
        "total_models": len(AI_MODELS),
        "configured_count": len(configured_models)
    })

@app.route('/api/models', methods=['GET'])
def get_models():
    """Get available AI models with configuration status"""
    models_with_status = {}
    for model_id, config in AI_MODELS.items():
        models_with_status[model_id] = {
            "name": config['name'],
            "provider": config['provider'],
            "configured": model_id in ai_service.api_keys,
            "api_key_env": config['api_key_env']
        }
    
    return jsonify({
        "models": models_with_status,
        "default_model": DEFAULT_MODEL
    })

@app.route('/api/chat', methods=['POST'])
def chat():
    """Main chat endpoint"""
    try:
        data = request.get_json()
        message = data.get('message', '').strip()
        model = data.get('model', DEFAULT_MODEL)
        conversation_id = data.get('conversation_id')
        
        if not message:
            return jsonify({
                "error": "Message is required",
                "success": False
            }), 400
        
        if model not in AI_MODELS:
            model = DEFAULT_MODEL
        
        logger.info(f"Processing message with model {model}")
        
        # Generate AI response
        result = ai_service.generate_response(message, model, conversation_id)
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}")
        return jsonify({
            "error": str(e),
            "success": False
        }), 500

@app.route('/api/conversations/<conversation_id>', methods=['GET'])
def get_conversation(conversation_id):
    """Get conversation history"""
    history = conversations.get(conversation_id, [])
    return jsonify({
        "conversation_id": conversation_id,
        "messages": history,
        "count": len(history)
    })

@app.route('/api/conversations/<conversation_id>', methods=['DELETE'])
def clear_conversation(conversation_id):
    """Clear conversation history"""
    if conversation_id in conversations:
        del conversations[conversation_id]
    return jsonify({
        "message": "Conversation cleared",
        "success": True
    })

@app.route('/api/conversations', methods=['GET'])
def list_conversations():
    """List all conversations"""
    return jsonify({
        "conversations": list(conversations.keys()),
        "count": len(conversations)
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    
    print(f"🚀 Starting AI Terminal Backend on port {port}")
    print(f"📚 Available models: {list(AI_MODELS.keys())}")
    
    configured_count = len(ai_service.api_keys)
    print(f"✅ {configured_count}/{len(AI_MODELS)} models configured")
    
    for model_id, config in AI_MODELS.items():
        status = "✅" if model_id in ai_service.api_keys else "⚠️"
        print(f"   {status} {model_id}: {config['name']}")
    
    if configured_count == 0:
        print(f"⚠️  No API keys configured - running in mock mode")
        print(f"🔑 Add API keys to backend/.env file for real AI responses")
    
    app.run(host='0.0.0.0', port=port, debug=debug)

