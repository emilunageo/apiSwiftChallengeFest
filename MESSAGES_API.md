# 📨 Messages API Documentation

## Overview
Sistema de mensajería para la API de diabetes que permite a los usuarios enviarse mensajes entre sí.

## 🔐 Authentication
Todos los endpoints requieren autenticación JWT. Incluye el token en el header:
```
Authorization: Bearer <your-jwt-token>
```

## 📋 Endpoints

### 1. Crear Mensaje
**POST** `/api/messages`

Crea un nuevo mensaje.

**Request Body:**
```json
{
  "to_user_id": "64a1b2c3d4e5f6789012345",
  "content": "Hola! ¿Cómo estás manejando tu diabetes?"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Mensaje enviado exitosamente",
  "data": {
    "message": {
      "_id": "64a1b2c3d4e5f6789012346",
      "from_user_id": {
        "_id": "64a1b2c3d4e5f6789012344",
        "nombre": "Juan Pérez",
        "email": "juan@example.com"
      },
      "to_user_id": {
        "_id": "64a1b2c3d4e5f6789012345",
        "nombre": "María García",
        "email": "maria@example.com"
      },
      "content": "Hola! ¿Cómo estás manejando tu diabetes?",
      "sent_at": "2024-01-15T10:30:00.000Z",
      "read_at": null,
      "is_deleted": false,
      "is_read": false,
      "time_since_sent": "Ahora"
    }
  }
}
```

### 2. Obtener Mensajes
**GET** `/api/messages`

Obtiene mensajes del usuario autenticado con filtros opcionales.

**Query Parameters:**
- `page` (opcional): Número de página (default: 1)
- `limit` (opcional): Mensajes por página (default: 20)
- `conversation_with` (opcional): ID del usuario para ver conversación específica
- `unread_only` (opcional): Solo mensajes no leídos (true/false)
- `sent_only` (opcional): Solo mensajes enviados (true/false)
- `received_only` (opcional): Solo mensajes recibidos (true/false)

**Examples:**
```bash
# Todos los mensajes
GET /api/messages

# Solo mensajes no leídos
GET /api/messages?unread_only=true

# Conversación con usuario específico
GET /api/messages?conversation_with=64a1b2c3d4e5f6789012345

# Mensajes enviados, página 2
GET /api/messages?sent_only=true&page=2
```

### 3. Obtener Mensaje Específico
**GET** `/api/messages/:id`

Obtiene un mensaje específico y lo marca como leído si el usuario es el destinatario.

### 4. Actualizar Mensaje
**PUT** `/api/messages/:id`

Actualiza el contenido de un mensaje (solo si no ha sido leído aún).

**Request Body:**
```json
{
  "content": "Mensaje actualizado"
}
```

### 5. Eliminar Mensaje
**DELETE** `/api/messages/:id`

Elimina un mensaje (borrado lógico). Solo el remitente puede eliminar sus mensajes.

### 6. Marcar Mensajes como Leídos
**PUT** `/api/messages/mark-read`

Marca múltiples mensajes como leídos.

**Request Body:**
```json
{
  "message_ids": ["64a1b2c3d4e5f6789012346", "64a1b2c3d4e5f6789012347"]
}
```

### 7. Obtener Cantidad de Mensajes No Leídos
**GET** `/api/messages/unread-count`

Obtiene la cantidad de mensajes no leídos del usuario.

**Response:**
```json
{
  "success": true,
  "data": {
    "unread_count": 5
  }
}
```

### 8. Obtener Conversación
**GET** `/api/messages/conversation/:userId`

Obtiene la conversación entre el usuario autenticado y otro usuario específico.

**Query Parameters:**
- `page` (opcional): Número de página (default: 1)
- `limit` (opcional): Mensajes por página (default: 50)

## 🗂️ Estructura del Mensaje

```json
{
  "_id": "ObjectId",
  "from_user_id": "ObjectId (ref: User)",
  "to_user_id": "ObjectId (ref: User)",
  "content": "String (1-1000 caracteres)",
  "sent_at": "Date",
  "read_at": "Date | null",
  "is_deleted": "Boolean",
  "is_read": "Boolean (virtual)",
  "time_since_sent": "String (virtual)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

## 🔍 Filtros y Búsquedas

### Obtener mensajes por tipo:
```bash
# Solo mensajes recibidos
GET /api/messages?received_only=true

# Solo mensajes enviados
GET /api/messages?sent_only=true

# Solo mensajes no leídos
GET /api/messages?unread_only=true
```

### Paginación:
```bash
# Página 2 con 10 mensajes por página
GET /api/messages?page=2&limit=10
```

## 🚨 Códigos de Error

- **400 Bad Request**: Datos de entrada inválidos
- **401 Unauthorized**: Token JWT inválido o faltante
- **404 Not Found**: Mensaje o usuario no encontrado
- **500 Internal Server Error**: Error del servidor

## 🧪 Testing

Para probar los endpoints, ejecuta:
```bash
node test-messages.js
```

## 📱 Integración con Swift

### Ejemplo de uso en Swift:

```swift
// Crear mensaje
struct CreateMessageRequest: Codable {
    let to_user_id: String
    let content: String
}

// Obtener mensajes no leídos
func getUnreadMessages() {
    let url = "\(baseURL)/api/messages?unread_only=true"
    // Implementar request con Authorization header
}

// Marcar como leído
struct MarkAsReadRequest: Codable {
    let message_ids: [String]
}
```

## 🔒 Seguridad

- Todos los endpoints requieren autenticación JWT
- Los usuarios solo pueden ver mensajes donde son remitente o destinatario
- Solo el remitente puede editar/eliminar sus mensajes
- Los mensajes solo se pueden editar si no han sido leídos
- Borrado lógico (los mensajes no se eliminan físicamente)
- Validación de entrada en todos los campos
