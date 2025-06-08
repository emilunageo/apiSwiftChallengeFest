# 📱 Swift Integration Guide - Messages API

## 🎯 Overview
This guide provides the exact JSON payload formats and GET request examples for integrating the Messages API with your Swift diabetes management app.

## 🔐 Authentication
All requests require JWT token in header:
```
Authorization: Bearer <your-jwt-token>
```

## 📝 1. POST Requests - Creating Messages

### JSON Payload Format
```json
{
  "to_user_id": "6844f811e5125c9652a0498f",
  "content": "Your message content here"
}
```

### Example Diabetes-Related Messages
```json
// Sharing glucose monitoring experience
{
  "to_user_id": "user_id_here",
  "content": "Hola! Vi que también tienes diabetes. ¿Cómo has estado manejando tus niveles de glucosa últimamente?"
}

// Asking about diet advice
{
  "to_user_id": "user_id_here", 
  "content": "¿Has notado algún alimento que te dispare mucho la glucosa?"
}

// Sharing exercise tips
{
  "to_user_id": "user_id_here",
  "content": "Caminar después de las comidas me ha ayudado muchísimo. También hago pesas 3 veces por semana."
}

// Discussing medical devices
{
  "to_user_id": "user_id_here",
  "content": "Uso el FreeStyle Libre. Es bastante preciso y fácil de usar. También me ayuda la app para llevar registro de comidas."
}
```

### POST Response Format
```json
{
  "success": true,
  "message": "Mensaje enviado exitosamente",
  "data": {
    "message": {
      "_id": "6844f819e5125c9652a049f3",
      "from_user_id": {
        "_id": "6844f811e5125c9652a0498c",
        "nombre": "Ana Martínez",
        "email": "ana.martinez@example.com"
      },
      "to_user_id": {
        "_id": "6844f812e5125c9652a04992",
        "nombre": "María González", 
        "email": "maria.gonzalez@example.com"
      },
      "content": "Your message content",
      "sent_at": "2025-06-08T02:40:25.982Z",
      "read_at": null,
      "is_deleted": false,
      "is_read": false,
      "time_since_sent": "Ahora",
      "createdAt": "2025-06-08T02:40:25.983Z",
      "updatedAt": "2025-06-08T02:40:25.983Z"
    }
  }
}
```

## 📬 2. GET Requests - Retrieving Messages

### A. Get Conversation Between Two Users
**URL Format:**
```
GET /api/messages/conversation/{other_user_id}?page=1&limit=50
```

**Example:**
```
GET /api/messages/conversation/6844f811e5125c9652a0498f
```

**JSON Response:**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "_id": "6844f815e5125c9652a049b1",
        "from_user_id": {
          "_id": "6844f811e5125c9652a0498c",
          "nombre": "Ana Martínez",
          "email": "ana.martinez@example.com"
        },
        "to_user_id": {
          "_id": "6844f811e5125c9652a0498f",
          "nombre": "Carlos Rodríguez",
          "email": "carlos.rodriguez@example.com"
        },
        "content": "Uso el FreeStyle Libre. Es bastante preciso y fácil de usar.",
        "sent_at": "2025-06-08T02:40:21.045Z",
        "read_at": null,
        "is_deleted": false,
        "is_read": false,
        "time_since_sent": "Ahora"
      }
    ],
    "other_user": {
      "_id": "6844f811e5125c9652a0498f",
      "nombre": "Carlos Rodríguez",
      "email": "carlos.rodriguez@example.com"
    },
    "pagination": {
      "current_page": 1,
      "total_pages": 1,
      "total_messages": 5,
      "has_next": false,
      "has_prev": false
    }
  }
}
```

### B. Get All Messages for User
**URL Format:**
```
GET /api/messages?page=1&limit=20
```

**JSON Response:**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "_id": "6844f819e5125c9652a049f3",
        "from_user_id": {
          "_id": "6844f811e5125c9652a0498c",
          "nombre": "Ana Martínez",
          "email": "ana.martinez@example.com"
        },
        "to_user_id": {
          "_id": "6844f812e5125c9652a04992",
          "nombre": "María González",
          "email": "maria.gonzalez@example.com"
        },
        "content": "Message content here",
        "sent_at": "2025-06-08T02:40:25.982Z",
        "read_at": null,
        "is_deleted": false,
        "is_read": false,
        "time_since_sent": "Ahora",
        "createdAt": "2025-06-08T02:40:25.983Z",
        "updatedAt": "2025-06-08T02:40:25.983Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 1,
      "total_messages": 10,
      "has_next": false,
      "has_prev": false
    }
  }
}
```

### C. Get Unread Messages Only
**URL Format:**
```
GET /api/messages?unread_only=true
```

### D. Get Unread Count
**URL Format:**
```
GET /api/messages/unread-count
```

**JSON Response:**
```json
{
  "success": true,
  "data": {
    "unread_count": 5
  }
}
```

### E. Filter Options
```
// Get sent messages only
GET /api/messages?sent_only=true

// Get received messages only  
GET /api/messages?received_only=true

// Get conversation with pagination
GET /api/messages/conversation/{user_id}?page=2&limit=25

// Get unread messages with pagination
GET /api/messages?unread_only=true&page=1&limit=10
```

## 🏗️ Swift Data Models

### Message Model
```swift
struct Message: Codable, Identifiable {
    let id: String
    let fromUserId: User
    let toUserId: User
    let content: String
    let sentAt: String
    let readAt: String?
    let isDeleted: Bool
    let isRead: Bool
    let timeSinceSent: String
    let createdAt: String
    let updatedAt: String
    
    enum CodingKeys: String, CodingKey {
        case id = "_id"
        case fromUserId = "from_user_id"
        case toUserId = "to_user_id"
        case content
        case sentAt = "sent_at"
        case readAt = "read_at"
        case isDeleted = "is_deleted"
        case isRead = "is_read"
        case timeSinceSent = "time_since_sent"
        case createdAt
        case updatedAt
    }
}

struct User: Codable {
    let id: String
    let nombre: String
    let email: String
    
    enum CodingKeys: String, CodingKey {
        case id = "_id"
        case nombre
        case email
    }
}

struct MessagesResponse: Codable {
    let success: Bool
    let data: MessagesData
}

struct MessagesData: Codable {
    let messages: [Message]
    let pagination: Pagination
    let otherUser: User? // Only present in conversation endpoint
    
    enum CodingKeys: String, CodingKey {
        case messages
        case pagination
        case otherUser = "other_user"
    }
}

struct Pagination: Codable {
    let currentPage: Int
    let totalPages: Int
    let totalMessages: Int
    let hasNext: Bool
    let hasPrev: Bool
    
    enum CodingKeys: String, CodingKey {
        case currentPage = "current_page"
        case totalPages = "total_pages"
        case totalMessages = "total_messages"
        case hasNext = "has_next"
        case hasPrev = "has_prev"
    }
}
```

### API Service Example
```swift
class MessagesService {
    private let baseURL = "http://localhost:3000/api"
    private var authToken: String = ""
    
    func getConversation(with userId: String, page: Int = 1) async throws -> MessagesResponse {
        let url = URL(string: "\(baseURL)/messages/conversation/\(userId)?page=\(page)")!
        var request = URLRequest(url: url)
        request.setValue("Bearer \(authToken)", forHTTPHeaderField: "Authorization")
        
        let (data, _) = try await URLSession.shared.data(for: request)
        return try JSONDecoder().decode(MessagesResponse.self, from: data)
    }
    
    func sendMessage(to userId: String, content: String) async throws -> Message {
        let url = URL(string: "\(baseURL)/messages")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(authToken)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let payload = ["to_user_id": userId, "content": content]
        request.httpBody = try JSONSerialization.data(withJSONObject: payload)
        
        let (data, _) = try await URLSession.shared.data(for: request)
        let response = try JSONDecoder().decode(MessagesResponse.self, from: data)
        return response.data.messages.first!
    }
}
```

## 🧪 Test Data Available

The database now contains realistic diabetes conversations between:
- **Ana Martínez** (Type 1) ↔ **Carlos Rodríguez** (Type 2)
- **María González** (Type 1) ↔ **Luis Fernández** (Type 2)
- **Ana Martínez** ↔ **María González** (Both Type 1)
- **Carlos Rodríguez** ↔ **Luis Fernández** (Both Type 2)

Topics include:
- Glucose monitoring experiences
- Diet and nutrition advice
- Exercise recommendations
- Medical device discussions
- Treatment management tips
