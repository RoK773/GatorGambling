# GatorGambling
Repository for the GatorGambling CEN3031 Group Project

## Running locally
Terminal 1: $env:OLLAMA_ORIGINS="*"; $env:OLLAMA_HOST="0.0.0.0:11434"; ollama serve
Terminal 2: ngrok http 11434
Terminal 3: npm run dev