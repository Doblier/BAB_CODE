# 🤖 AI Terminal Setup Guide

## 🎯 Overview
This guide will help you set up the AI Terminal with support for multiple AI models including OpenAI GPT, Anthropic Claude, Google Gemini, Mistral AI, and more.

## 📋 Prerequisites
- Python 3.8+
- Node.js 16+
- API keys for the AI models you want to use

## 🚀 Quick Start

### 1. Install Dependencies

**Backend (Python):**
```bash
cd backend
pip install -r requirements.txt
```

**Frontend (Node.js):**
```bash
npm install
```

### 2. Configure API Keys

Copy the environment template:
```bash
cd backend
cp env.example .env
```

Edit `backend/.env` and add your API keys:

```env
# OpenAI Models (GPT-4, GPT-3.5 Turbo, GPT-4 Turbo)
OPENAI_API_KEY=sk-your_openai_api_key_here

# Anthropic Models (Claude 3 Sonnet, Claude 3 Haiku, Claude 3 Opus)
ANTHROPIC_API_KEY=sk-ant-your_anthropic_api_key_here

# Google Models (Gemini Pro, Gemini Pro Vision)
GOOGLE_API_KEY=your_google_api_key_here

# Replicate Models (Llama 2 70B)
REPLICATE_API_KEY=r8_your_replicate_api_key_here

# Mistral AI Models (Mistral 7B, Mistral Large)
MISTRAL_API_KEY=your_mistral_api_key_here

# Server Configuration
PORT=5000
FLASK_ENV=development
LOG_LEVEL=INFO
```

### 3. Start the Servers

**Option A: Use the start script**
```bash
node start-ai-terminal.js
```

**Option B: Start manually**
```bash
# Terminal 1 - Backend
cd backend
python app.py

# Terminal 2 - Frontend
npm run dev
```

### 4. Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000

## 🔑 Getting API Keys

### OpenAI (GPT Models)
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up/Login
3. Navigate to "API Keys"
4. Create a new API key
5. Copy the key (starts with `sk-`)

### Anthropic (Claude Models)
1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Sign up/Login
3. Navigate to "API Keys"
4. Create a new API key
5. Copy the key (starts with `sk-ant-`)

### Google (Gemini Models)
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with Google account
3. Create a new API key
4. Copy the key

### Replicate (Llama Models)
1. Go to [Replicate](https://replicate.com/)
2. Sign up/Login
3. Navigate to "Account" → "API Tokens"
4. Create a new token
5. Copy the token (starts with `r8_`)

### Mistral AI
1. Go to [Mistral AI Console](https://console.mistral.ai/)
2. Sign up/Login
3. Navigate to "API Keys"
4. Create a new API key
5. Copy the key

## 🎛️ Available Models

| Model | Provider | Description | API Key Required |
|-------|----------|-------------|------------------|
| GPT-4 | OpenAI | Most capable GPT model | `OPENAI_API_KEY` |
| GPT-3.5 Turbo | OpenAI | Fast and efficient | `OPENAI_API_KEY` |
| GPT-4 Turbo | OpenAI | Latest GPT-4 variant | `OPENAI_API_KEY` |
| Claude 3 Sonnet | Anthropic | Balanced performance | `ANTHROPIC_API_KEY` |
| Claude 3 Haiku | Anthropic | Fast and lightweight | `ANTHROPIC_API_KEY` |
| Claude 3 Opus | Anthropic | Most capable Claude | `ANTHROPIC_API_KEY` |
| Gemini Pro | Google | Google's latest model | `GOOGLE_API_KEY` |
| Gemini Pro Vision | Google | Vision-capable model | `GOOGLE_API_KEY` |
| Llama 2 70B | Meta (via Replicate) | Open-source model | `REPLICATE_API_KEY` |
| Mistral 7B | Mistral AI | Efficient open model | `MISTRAL_API_KEY` |
| Mistral Large | Mistral AI | High-performance model | `MISTRAL_API_KEY` |

## 🔧 Features

### ✅ Production-Ready Features
- **Multi-Model Support**: Switch between different AI models seamlessly
- **Real API Integration**: Each model uses its actual API with proper authentication
- **Conversation History**: Maintains context across messages
- **Error Handling**: Graceful fallbacks and error messages
- **Configuration Status**: Visual indicators for configured/unconfigured models
- **Mock Mode**: Works without API keys for testing

### 🎨 UI Features
- **Model Selection**: Dropdown menu in top bar with configuration status
- **Visual Indicators**: 
  - ✅ Selected model
  - 🔑 Configured model (has API key)
  - ⚠️ Unconfigured model (missing API key)
- **Advanced Chat Interface**: VS Code-style design with tabs and actions
- **Message Actions**: Copy, more options
- **File Upload**: Support for image uploads
- **Progress Indicators**: Visual feedback during processing

## 🛠️ API Endpoints

### Health Check
```bash
GET /api/health
```
Returns server status and model configuration info.

### Get Models
```bash
GET /api/models
```
Returns available models with configuration status.

### Chat
```bash
POST /api/chat
Content-Type: application/json

{
  "message": "Your message here",
  "model": "gpt-4",
  "conversation_id": "optional_conversation_id"
}
```

### Conversations
```bash
GET /api/conversations/<id>     # Get conversation history
DELETE /api/conversations/<id>  # Clear conversation
GET /api/conversations          # List all conversations
```

## 🔍 Troubleshooting

### Backend Issues
1. **Port already in use**: Change `PORT` in `.env` file
2. **API key errors**: Verify your API keys are correct
3. **Import errors**: Run `pip install -r requirements.txt --force-reinstall`

### Frontend Issues
1. **Connection refused**: Ensure backend is running on port 5000
2. **Model not showing**: Check browser console for errors
3. **CORS errors**: Backend CORS is configured for localhost

### Model-Specific Issues
- **OpenAI**: Check API key format (starts with `sk-`)
- **Anthropic**: Check API key format (starts with `sk-ant-`)
- **Google**: Ensure API key has Gemini API access
- **Replicate**: Check token format (starts with `r8_`)
- **Mistral**: Verify API key is active

## 🚀 Production Deployment

### Environment Variables
Set these in your production environment:
```bash
FLASK_ENV=production
LOG_LEVEL=WARNING
PORT=5000
```

### Security Considerations
- Never commit API keys to version control
- Use environment variables for all sensitive data
- Consider rate limiting for production use
- Implement proper authentication for multi-user scenarios

## 📝 Usage Examples

### Switching Models
1. Click "Models" in the top menu
2. Select any configured model (marked with 🔑)
3. Send a message - it will use the selected model

### Using Different Models
- **GPT-4**: Best for complex reasoning and coding
- **Claude 3**: Excellent for analysis and explanation
- **Gemini**: Good for creative tasks and vision
- **Llama 2**: Open-source alternative
- **Mistral**: Fast and efficient for simple tasks

## 🤝 Contributing

To add new models:
1. Add model configuration to `AI_MODELS` in `backend/app.py`
2. Implement the corresponding `_call_*` method
3. Update this documentation
4. Test with the new model

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section
2. Verify API keys are correct
3. Check server logs for error messages
4. Ensure all dependencies are installed

---

**Happy coding with AI! 🤖✨**
