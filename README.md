# Campus Lost and Found Portal

A full-stack web application developed for Sai University to help students report lost and found belongings, search for items, submit claims, and manage recovery requests.

## Project Information

| Detail | Information |
|---|---|
| University | Sai University |
| School | School of Computing and Data Science |
| Programme | B.Tech Computer Science |
| Academic Year | 2026–2027 |
| Subject | Web Technology and Internet Programming |
| Project Type | Individual Project |
| Project Title | Campus Lost and Found Portal |

## Problem Statement

Students often lose personal belongings on campus, while people who find these items may not know their owners. This application provides a centralized platform where students can report lost or found items, search listings, and submit claims to recover their belongings.

## Technologies Used

**Frontend**
- HTML5
- CSS3
- JavaScript ES6+

**Backend**
- Node.js
- Express.js

**Database**
- MongoDB
- Mongoose

**Tools**
- Visual Studio Code
- Postman
- Git and GitHub
- MongoDB Atlas
- Render

## Features

1. User registration and login.
2. Lost item reporting.
3. Found item reporting.
4. Search and filter item listings.
5. View available lost and found items.
6. Submit and manage item claims.
7. User dashboard.
8. Admin dashboard.
9. MongoDB database integration.
10. REST API-based communication between frontend and backend.

## Project Folder Structure

```text
campus-lost-found/
│
├── config/
│   └── db.js
│
├── middleware/
│   └── auth.js
│
├── models/
│   ├── Claim.js
│   ├── Item.js
│   └── User.js
│
├── public/
│   ├── admin.html
│   ├── app.js
│   ├── dashboard.html
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── report.html
│   └── style.css
│
├── routes/
│   ├── admin.js
│   ├── auth.js
│   ├── claims.js
│   └── items.js
│
├── node_modules/
│
├── .env
├── .gitignore
├── package-lock.json
├── package.json
├── README.md
└── server.js
```

## Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/deekshithabalireddy/Campus-Lost-and-Found-Portal.git
```

### 2. Navigate to the Project Folder

```bash
cd Campus-Lost-and-Found-Portal
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

Create a `.env` file in the root directory.

Add the following variables:

```env
PORT=3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_random_secret
ADMIN_EMAIL=your_admin_email
ADMIN_PASSWORD=your_admin_password
```

Replace the placeholder values with your own credentials.

**Security:** Never upload your `.env` file or database credentials to GitHub.

### 5. Run the Application

Start the development server:

```bash
npm run dev
```

Or start the application using:

```bash
npm start
```

Open the application in your browser:

```text
http://localhost:3000
```

## Database

MongoDB is used as the persistent database.

The application uses Mongoose models for:

- User management
- Lost and found item management
- Claim management

## API Testing

Postman is used to test the backend REST APIs.

The test cases include:

1. User registration
2. User login
3. Invalid input validation
4. Create a lost or found item
5. Retrieve item listings
6. Update item details
7. Submit an item claim
8. Unauthorized access testing

Postman screenshots are maintained as project testing evidence.

## Deployment

**Hosting Platform:** Render

**Application URL:**

https://campus-lost-and-found-portal-2.onrender.com

*Deployment is currently being configured. The URL should be verified after successful deployment.*

## GitHub Repository

https://github.com/deekshithabalireddy/Campus-Lost-and-Found-Portal

## Future Enhancements

- Email notifications for claim updates.
- Duplicate item detection.
- Campus building-based search filters.
- Dashboard analytics and visualizations.
- Improved image upload and management.

## Conclusion

The Campus Lost and Found Portal provides a centralized digital solution for managing lost and found belongings within a university campus. This project demonstrates practical implementation of frontend development, backend development, REST APIs, database connectivity, authentication, and web application deployment.

## AI Assistance Disclosure

AI tools were used for learning support, debugging, understanding programming concepts, and improving documentation. The student is responsible for reviewing, understanding, and explaining the submitted implementation.
