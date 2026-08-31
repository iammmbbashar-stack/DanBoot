#!/bin/bash

# Telegram Prediction Bot - Quick Start

echo "📦 Installing dependencies..."
npm install

echo ""
echo "✅ Installation complete!"
echo ""
echo "🚀 To start the bot:"
echo "   npm run dev          # Development mode (with hot-reload)"
echo "   npm run build        # Build TypeScript"
echo "   npm start            # Production mode"
echo ""
echo "📋 Project structure:"
echo "   src/api/             - InfoRadar API client"
echo "   src/predictor/       - Prediction analysis engine"
echo "   src/utils/           - Rate limiting, error handling, logging"
echo "   src/bot.ts           - Telegram bot & main loop"
echo ""
echo "🔧 Configuration:"
echo "   .env file ready with your credentials"
echo "   Edit PREDICTION_INTERVAL to change scan frequency (ms)"
echo ""
echo "💡 First time tips:"
echo "   1. Run: npm run dev"
echo "   2. Send /scan to your bot to test"
echo "   3. Check logs for errors"
echo "   4. Adjust prediction thresholds in src/predictor/analyzer.ts"
echo ""
