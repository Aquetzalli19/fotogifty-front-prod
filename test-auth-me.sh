#!/bin/bash

# Script para probar el endpoint /auth/me

TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiZW1haWwiOiJhcXVldHphbGxpb2JyZWdvbkBnbWFpbC5jb20iLCJ0aXBvIjoiY2xpZW50ZSIsImlhdCI6MTc2NzgwOTIzMywiZXhwIjoxNzY3ODk1NjMzfQ.6v-Q4Q0AEquKpqyzFO4bwZdRsgdwCM5M0nE0-yVJ5z0"

echo "🔍 Probando endpoint /auth/me..."
echo ""

# Prueba con el backend local
echo "📍 Backend local (localhost:3001):"
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -s | jq '.'

echo ""
echo "---"
echo ""

# Si tienes el backend en Railway, descomenta y agrega la URL:
# echo "📍 Backend Railway:"
# curl -X GET https://tu-backend.railway.app/api/auth/me \
#   -H "Authorization: Bearer $TOKEN" \
#   -H "Content-Type: application/json" \
#   -s | jq '.'
