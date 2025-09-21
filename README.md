# EduApp Backend API

A Node.js Express backend with Firebase Firestore integration for user authentication, profile management, and subject management with admin approval system.

## 🚀 Features

- **User Authentication**: Signup and signin with JWT tokens
- **Password Security**: Bcrypt password hashing with OTP-based password reset
- **Firebase Integration**: Firestore database for user data
- **Profile Management**: Profile image upload, update, and delete functionality
- **Subject Management**: Create subjects with admin approval workflow
- **Admin System**: Admin-only endpoints for subject approval and management
- **Email Service**: Welcome emails and OTP delivery via nodemailer
- **Input Validation**: Email, password, and user data validation
- **Error Handling**: Comprehensive error responses with solutions
- **API Documentation**: Complete Postman collection included
- **Mobile Support**: CORS enabled for React Native mobile app integration

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: Firebase Firestore
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **File Upload**: multer (profile images)
- **Email Service**: nodemailer with Gmail SMTP
- **Validation**: validator.js
- **Development**: nodemon

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/indunilasela/Eduapp.git
cd Eduapp/backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up Firebase:
   - Follow the instructions in `FIREBASE_SETUP_GUIDE.md`
   - Enable Firestore in your Firebase Console

4. Start the development server:
```bash
npm run dev
```

The server will start on `http://localhost:4000`

## 🔧 Environment Setup

Create a `.env` file in the root directory (optional):
```env
PORT=4000
JWT_SECRET=your-super-secret-jwt-key
```

## 📖 API Endpoints

### Authentication Routes

#### Signup
- **URL**: `POST /auth/signup`
- **Body**:
```json
{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "password123",
    "confirmPassword": "password123"
}
```

#### Signin
- **URL**: `POST /auth/signin`
- **Body**:
```json
{
    "email": "john@example.com",
    "password": "password123"
}
```

### Password Reset (OTP-based)
- **POST** `/auth/forgot-password` - Request password reset OTP
- **POST** `/auth/verify-otp` - Verify OTP code
- **POST** `/auth/reset-password` - Set new password after OTP verification

### Username Endpoint
- **GET** `/auth/username` - Get username only (requires authentication)

### Profile Image Management
- **POST** `/auth/profile-image/upload` - Upload profile image
- **PUT** `/auth/profile-image/update` - Update existing profile image
- **DELETE** `/auth/profile-image/delete` - Delete profile image
- **GET** `/auth/profile-image` - Get current profile image

### Subject Management
#### User Endpoints
- **POST** `/subjects/create` - Create new subject (requires authentication)
- **GET** `/subjects` - Get all approved subjects (public)
- **GET** `/subjects/my` - Get user's own subjects (requires authentication)

#### Admin Endpoints (Admin only: i.asela016@gmail.com)
- **GET** `/admin/subjects/pending` - Get pending subjects for approval
- **GET** `/admin/subjects` - Get all subjects (all statuses)
- **PUT** `/admin/subjects/:id/approve` - Approve a subject
- **PUT** `/admin/subjects/:id/reject` - Reject a subject
- **DELETE** `/admin/subjects/:id` - Delete a subject

### Other Routes
- **GET** `/` - Server info and available endpoints
- **GET** `/test-firebase` - Test Firebase connection
- **POST** `/users` - Create a user (legacy)
- **GET** `/users/:id` - Get user by ID

## 📝 Testing

### Using Postman
1. Import the collections:
   - `Eduback_Auth_API.postman_collection.json` (Authentication endpoints)
   - `EduApp_Subject_Management.postman_collection.json` (Subject management endpoints)
2. Set base URL to: `http://localhost:4000`
3. Follow the test cases in:
   - `POSTMAN_TESTING_GUIDE.md` (Authentication testing)
   - `SUBJECT_MANAGEMENT_API_GUIDE.md` (Subject management testing)

### Using cURL
```bash
# Signup
curl -X POST http://localhost:4000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"password123","confirmPassword":"password123"}'

# Signin
curl -X POST http://localhost:4000/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## 🔥 Firebase Setup

**Important**: You must enable Firestore in your Firebase project for the backend to work properly.

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to "Firestore Database"
4. Click "Create database"
5. Choose "Start in test mode"
6. Select a location
7. Click "Done"

For detailed instructions, see `FIREBASE_SETUP_GUIDE.md`

## 📁 Project Structure

```
backend/
├── src/
│   └── index.js                 # Main server file
├── config/                      # Configuration files
├── .github/                     # GitHub workflows
├── .vscode/                     # VS Code settings
├── AUTH_TESTING.md             # Authentication testing guide
├── FIREBASE_SETUP_GUIDE.md     # Firebase setup instructions
├── POSTMAN_TESTING_GUIDE.md    # Postman testing guide
├── Eduback_Auth_API.postman_collection.json  # Postman collection
├── package.json                # Dependencies and scripts
└── README.md                   # This file
```

## 🔒 Security Features

- Password hashing with bcrypt (10 salt rounds)
- JWT token authentication with 24-hour expiration
- Input validation and sanitization
- Email format validation
- Password strength requirements (minimum 6 characters)
- Username length validation (minimum 3 characters)

## 🐛 Troubleshooting

### Firestore Errors
If you see `NOT_FOUND` errors:
1. Enable Firestore in Firebase Console
2. Check `FIREBASE_SETUP_GUIDE.md` for detailed instructions
3. Restart the server after enabling Firestore

### Port Already in Use
```bash
# Kill existing Node processes
taskkill /f /im node.exe

# Or change port in package.json or environment variable
PORT=5000 npm run dev
```

## 📜 Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests (to be implemented)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For issues or questions:
1. Check the troubleshooting guides
2. Review Firebase setup instructions
3. Test with the provided Postman collection
4. Create an issue on GitHub

---

**Status**: ✅ Authentication system fully functional (requires Firestore setup)
