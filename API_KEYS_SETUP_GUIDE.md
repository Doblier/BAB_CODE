# 🔑 Complete API Keys Setup Guide

## 📋 All Available Models & Their API Keys

Here's the complete list of all available AI models and their corresponding environment variables:

### 🎯 **Model Configuration Reference**

| Model ID | Model Name | Provider | Environment Variable | API Key Format |
|----------|------------|----------|---------------------|----------------|
| `gpt-4` | GPT-4 (OpenAI) | OpenAI | `OPENAI_API_KEY` | `sk-...` |
| `gpt-3.5-turbo` | GPT-3.5 Turbo (OpenAI) | OpenAI | `OPENAI_API_KEY` | `sk-...` |
| `gpt-4-turbo` | GPT-4 Turbo (OpenAI) | OpenAI | `OPENAI_API_KEY` | `sk-...` |
| `claude-3-sonnet` | Claude 3 Sonnet (Anthropic) | Anthropic | `ANTHROPIC_API_KEY` | `sk-ant-...` |
| `claude-3-haiku` | Claude 3 Haiku (Anthropic) | Anthropic | `ANTHROPIC_API_KEY` | `sk-ant-...` |
| `claude-3-opus` | Claude 3 Opus (Anthropic) | Anthropic | `ANTHROPIC_API_KEY` | `sk-ant-...` |
| `gemini-pro` | Gemini Pro (Google) | Google | `GOOGLE_API_KEY` | `AIza...` |
| `gemini-pro-vision` | Gemini Pro Vision (Google) | Google | `GOOGLE_API_KEY` | `AIza...` |
| `llama-2-70b` | Llama 2 70B (Meta) | Replicate | `REPLICATE_API_KEY` | `r8_...` |
| `mistral-7b` | Mistral 7B (Mistral AI) | Mistral AI | `MISTRAL_API_KEY` | `...` |
| `mistral-large` | Mistral Large (Mistral AI) | Mistral AI | `MISTRAL_API_KEY` | `...` |

## 🔧 **Step-by-Step Setup**

### 1. **Edit Your Environment File**

Open `backend/.env` and add the API keys you want to use:

```env
# ===========================================
# AI MODEL API KEYS
# ===========================================

# OpenAI Models (GPT-4, GPT-3.5 Turbo, GPT-4 Turbo)
# Get from: https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-your_openai_api_key_here

# Anthropic Models (Claude 3 Sonnet, Claude 3 Haiku, Claude 3 Opus)
# Get from: https://console.anthropic.com/
ANTHROPIC_API_KEY=sk-ant-your_anthropic_api_key_here

# Google Models (Gemini Pro, Gemini Pro Vision)
# Get from: https://makersuite.google.com/app/apikey
GOOGLE_API_KEY=AIza-your_google_api_key_here

# Replicate Models (Llama 2 70B)
# Get from: https://replicate.com/account/api-tokens
REPLICATE_API_KEY=r8_your_replicate_api_key_here

# Mistral AI Models (Mistral 7B, Mistral Large)
# Get from: https://console.mistral.ai/
MISTRAL_API_KEY=your_mistral_api_key_here

# ===========================================
# SERVER CONFIGURATION
# ===========================================
PORT=5000
FLASK_ENV=development
LOG_LEVEL=INFO
```

### 2. **Get API Keys for Each Provider**

#### **🔵 OpenAI (GPT Models)**
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up/Login
3. Click "API Keys" in sidebar
4. Click "Create new secret key"
5. Copy the key (starts with `sk-`)
6. Add to `.env`: `OPENAI_API_KEY=sk-your_key_here`

#### **🟣 Anthropic (Claude Models)**
1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Sign up/Login
3. Click "API Keys" in sidebar
4. Click "Create Key"
5. Copy the key (starts with `sk-ant-`)
6. Add to `.env`: `ANTHROPIC_API_KEY=sk-ant-your_key_here`

#### **🟡 Google (Gemini Models)**
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with Google account
3. Click "Create API Key"
4. Copy the key (starts with `AIza`)
5. Add to `.env`: `GOOGLE_API_KEY=AIza-your_key_here`

#### **🟠 Replicate (Llama Models)**
1. Go to [Replicate](https://replicate.com/)
2. Sign up/Login
3. Go to "Account" → "API Tokens"
4. Click "Create API token"
5. Copy the token (starts with `r8_`)
6. Add to `.env`: `REPLICATE_API_KEY=r8_your_token_here`

#### **🟢 Mistral AI**
1. Go to [Mistral AI Console](https://console.mistral.ai/)
2. Sign up/Login
3. Click "API Keys" in sidebar
4. Click "Create API Key"
5. Copy the key
6. Add to `.env`: `MISTRAL_API_KEY=your_key_here`

### 3. **Restart the Backend**

After adding API keys, restart the backend:

```bash
# Stop the current backend (Ctrl+C)
# Then restart:
cd backend
python app.py
```

### 4. **Verify Configuration**

Check the backend startup logs. You should see:

```
🚀 Starting AI Terminal Backend on port 5000
📚 Available models: ['gpt-4', 'gpt-3.5-turbo', 'gpt-4-turbo', 'claude-3-sonnet', 'claude-3-haiku', 'claude-3-opus', 'gemini-pro', 'gemini-pro-vision', 'llama-2-70b', 'mistral-7b', 'mistral-large']
✅ 3/11 models configured
   ✅ gpt-4: GPT-4 (OpenAI)
   ✅ gpt-3.5-turbo: GPT-3.5 Turbo (OpenAI)
   ✅ gpt-4-turbo: GPT-4 Turbo (OpenAI)
   ⚠️ claude-3-sonnet: Claude 3 Sonnet (Anthropic)
   ⚠️ claude-3-haiku: Claude 3 Haiku (Anthropic)
   ⚠️ claude-3-opus: Claude 3 Opus (Anthropic)
   ⚠️ gemini-pro: Gemini Pro (Google)
   ⚠️ gemini-pro-vision: Gemini Pro Vision (Google)
   ⚠️ llama-2-70b: Llama 2 70B (Meta)
   ⚠️ mistral-7b: Mistral 7B (Mistral AI)
   ⚠️ mistral-large: Mistral Large (Mistral AI)
```

## 🎯 **Visual Indicators in UI**

In the Models dropdown, you'll see:

- **✅ Green Checkmark**: Currently selected model
- **🔑 Key Icon**: Model has API key configured (working)
- **⚠️ Warning Triangle**: Model missing API key (will show error)

## 🧪 **Test Each Model**

1. **Click "Models"** in the top menu
2. **Select a configured model** (marked with 🔑)
3. **Send a message** in the AI Terminal
4. **Verify the response** shows the correct model name

## 🔍 **Troubleshooting**

### **Model Shows Error**
- Check API key format (see table above)
- Verify API key is active and has credits
- Restart backend after adding new keys

### **Model Shows Warning Triangle**
- Add the corresponding API key to `.env`
- Restart the backend
- Check the startup logs for confirmation

### **All Models Show Warnings**
- Make sure `.env` file is in the `backend/` folder
- Check file permissions
- Verify no extra spaces in the `.env` file

## 📝 **Example .env File**

Here's a complete example with all possible API keys:

```env
# ===========================================
# AI MODEL API KEYS - ADD THE ONES YOU WANT
# ===========================================

# OpenAI Models (GPT-4, GPT-3.5 Turbo, GPT-4 Turbo)
OPENAI_API_KEY=sk-proj-abc123def456ghi789jkl012mno345pqr678stu901vwx234yz

# Anthropic Models (Claude 3 Sonnet, Claude 3 Haiku, Claude 3 Opus)
ANTHROPIC_API_KEY=sk-ant-api03-abc123def456ghi789jkl012mno345pqr678stu901vwx234yz

# Google Models (Gemini Pro, Gemini Pro Vision)
GOOGLE_API_KEY=AIzaSyABC123def456ghi789jkl012mno345pqr678stu901vwx234yz

# Replicate Models (Llama 2 70B)
REPLICATE_API_KEY=r8_abc123def456ghi789jkl012mno345pqr678stu901vwx234yz

# Mistral AI Models (Mistral 7B, Mistral Large)
MISTRAL_API_KEY=abc123def456ghi789jkl012mno345pqr678stu901vwx234yz

# ===========================================
# SERVER CONFIGURATION
# ===========================================
PORT=5000
FLASK_ENV=development
LOG_LEVEL=INFO
```

## 🎉 **Success Indicators**

When everything is working correctly:

1. **Backend logs** show ✅ for configured models
2. **Models dropdown** shows 🔑 for working models
3. **AI responses** include the correct model name
4. **No error messages** when switching models

---

**Now you can use any combination of AI models with their real APIs! 🤖✨**
