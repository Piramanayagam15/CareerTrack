# 🚀 CareerTrack

### Job Application & Interview Tracker

CareerTrack is a full-stack web application that helps users track job applications, interview progress, offers, and application details in one place.

## 🌐 Live Demo

Frontend:
https://careertrack-frontend-mwch.onrender.com/

Backend API:
https://careertrack-backend-s94d.onrender.com/

## ✨ Features

- 📋 Add and manage job applications
- 🔎 Search applications by company or role
- 🏷️ Filter applications by status
- 🎯 Track interview progress
- 🏆 Track job offers
- 📝 Add notes and job posting URLs
- ✏️ Update application status
- 🗑️ Delete applications
- 💾 Persistent data storage using MongoDB
- 🔄 Real-time frontend and backend API integration
- 📱 Responsive user interface

## 🛠️ Tech Stack

### Frontend
- React.js
- Vite
- JavaScript
- HTML5
- CSS3

### Backend
- Node.js
- Express.js
- REST API
- CORS

### Database
- MongoDB Atlas

### Deployment
- GitHub
- Render

## 🔗 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/applications` | Get all applications |
| POST | `/api/applications` | Add a new application |
| PATCH | `/api/applications/:id` | Update application |
| DELETE | `/api/applications/:id` | Delete application |

## 📁 Project Structure

```text
CareerTrack/
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── server.js
│   ├── package.json
│   └── test-db.js
│
└── .gitignore
