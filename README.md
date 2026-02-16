# Real-Time Poll Application

A full-stack real-time polling web application that allows users to create polls, share them via links, and see voting results update instantly without page refreshes.

## 🚀 Features

- **Poll Creation**: Create polls with a question and 2-10 options
- **Real-Time Updates**: See vote results update instantly using WebSocket connections
- **Share by Link**: Share polls via unique URLs with poll IDs
- **Single Vote Enforcement**: Two-layer anti-abuse system to ensure fair voting
- **Persistent Data**: All polls and votes are stored in MongoDB
- **Responsive Design**: Beautiful, modern UI that works on all devices

## 🛠 Tech Stack

### Frontend
- **React** (v18.2.0) - UI library
- **React Router** (v6.18.0) - Client-side routing
- **Socket.IO Client** (v4.7.2) - Real-time WebSocket connection
- **Axios** (v1.6.2) - HTTP requests
- **Pure CSS** - No UI frameworks, custom responsive design

### Backend
- **Node.js** - Runtime environment
- **Express** (v4.18.2) - Web server framework
- **MongoDB** (via Mongoose v7.6.0) - Database for persistence
- **Socket.IO** (v4.7.2) - Real-time bidirectional communication
- **CORS** - Cross-origin resource sharing

## 📁 Project Structure

```
poll-app/
├── client/                 # React frontend
│   ├── public/
│   │   ├── index.html
│   │   ├── manifest.json
│   │   └── robots.txt
│   ├── src/
│   │   ├── pages/
│   │   │   ├── CreatePoll.js    # Poll creation page
│   │   │   └── PollPage.js      # Voting & results page
│   │   ├── App.js               # Main app component with routing
│   │   ├── App.css              # All application styles
│   │   └── index.js             # React entry point
│   └── package.json
├── server/                 # Node.js backend
│   ├── models/
│   │   └── Poll.js              # MongoDB schema for polls
│   ├── index.js                 # Express server with Socket.IO
│   └── package.json
└── README.md
```

## 🔒 Fairness Mechanisms (Anti-Abuse)

### 1. Browser-Based Prevention (localStorage)
- **What it prevents**: A user voting multiple times from the same browser
- **How it works**: Stores a flag in localStorage after voting
- **Limitations**: 
  - Can be bypassed by clearing browser storage
  - Can be bypassed using incognito/private mode
  - Doesn't prevent voting from different browsers
- **Use case**: Quick client-side check, good UX

### 2. IP-Based Prevention (Server-side)
- **What it prevents**: Multiple votes from the same IP address
- **How it works**: Server stores IP addresses of voters in the database
- **Limitations**:
  - Users behind the same NAT/proxy share an IP (e.g., office, public WiFi)
  - Can be bypassed using VPN or different networks
  - IPv6 can provide multiple addresses
- **Use case**: More robust server-side enforcement

**Combined Approach**: These two mechanisms work together to provide reasonable protection against casual abuse while being simple to implement. For production systems requiring stricter controls, consider adding authentication, rate limiting, or more sophisticated fingerprinting.

## 🏗 Architecture Overview

### Request Flow

1. **Poll Creation**:
   ```
   User → React Form → Axios POST → Express API → MongoDB → Return Poll ID
   ```

2. **Viewing Poll**:
   ```
   User → /poll/:id → React Router → Axios GET → Express API → MongoDB → Display Poll
   ```

3. **Real-Time Voting**:
   ```
   User Vote → Socket.IO Client → Socket.IO Server → 
   Validate (IP check) → Update MongoDB → 
   Broadcast to Room → All Clients Update UI
   ```

### Socket.IO Rooms
- Each poll has its own Socket.IO room (identified by poll ID)
- When users join a poll page, they join the corresponding room
- Votes are broadcast only to users in that specific room
- Ensures efficient, targeted updates

### Data Persistence
- All polls stored in MongoDB with schema validation
- Vote counts stored with each option
- Voter IPs stored in array for duplicate prevention
- Survives server restarts and page refreshes

## 📦 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account (or local MongoDB instance)
- npm or yarn package manager

### 1. Clone the Repository
```bash
git clone <repository-url>
cd poll-app
```

### 2. Setup Backend
```bash
cd server
npm install
```

**Configure MongoDB Connection**:
- Open `server/index.js`
- Replace the MongoDB connection string on line 30 with your own:
  ```javascript
  mongoose.connect("YOUR_MONGODB_CONNECTION_STRING")
  ```

**Start the server**:
```bash
npm start
```
Server will run on `http://localhost:5000`

### 3. Setup Frontend
```bash
cd ../client
npm install
npm start
```
Client will run on `http://localhost:3000`

## 🎮 How to Use

### Creating a Poll
1. Navigate to `http://localhost:3000`
2. Enter your question (max 200 characters)
3. Add at least 2 options (max 10 options, 100 characters each)
4. Click "Create Poll"
5. Copy the generated link and share it

### Voting on a Poll
1. Open the shared poll link (e.g., `http://localhost:3000/poll/abc123`)
2. Click on your preferred option
3. See real-time results with progress bars
4. Watch as other users' votes appear instantly

## 🚀 Deployment

### Backend Deployment (Heroku/Railway/Render)

1. **Prepare for deployment**:
   - Ensure `server/package.json` has a start script
   - Add PORT environment variable support

2. **Deploy to Heroku** (example):
   ```bash
   cd server
   heroku create your-poll-api
   heroku config:set MONGODB_URI=your_mongodb_connection_string
   git push heroku main
   ```

3. **Update CORS settings** in `server/index.js`:
   ```javascript
   const io = new Server(server, {
     cors: {
       origin: "https://your-frontend-domain.com"
     }
   });
   ```

### Frontend Deployment (Vercel/Netlify)

1. **Update API endpoints** in frontend:
   - Replace `http://localhost:5000` with your deployed backend URL
   - Update in `CreatePoll.js` and `PollPage.js`

2. **Deploy to Vercel** (example):
   ```bash
   cd client
   vercel deploy --prod
   ```

3. **Environment Variables**:
   - Create `.env` file:
     ```
     REACT_APP_API_URL=https://your-poll-api.herokuapp.com
     REACT_APP_SOCKET_URL=https://your-poll-api.herokuapp.com
     ```

### Production Checklist
- [ ] Use environment variables for API URLs
- [ ] Enable proper CORS settings
- [ ] Secure MongoDB connection (IP whitelist, strong password)
- [ ] Add rate limiting for API endpoints
- [ ] Enable HTTPS for both frontend and backend
- [ ] Add error logging (e.g., Sentry)
- [ ] Set up monitoring (e.g., New Relic, Datadog)

## 🧪 Testing Locally

1. Start MongoDB (if using local instance)
2. Start backend: `cd server && npm start`
3. Start frontend: `cd client && npm start`
4. Open multiple browser windows to test real-time updates
5. Open one window in incognito mode to test vote prevention

## 🔧 Configuration

### Environment Variables

**Backend** (create `server/.env`):
```env
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/polls
CORS_ORIGIN=http://localhost:3000
```

**Frontend** (create `client/.env`):
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SOCKET_URL=http://localhost:5000
```

## 📝 API Endpoints

### POST `/api/polls`
Create a new poll
- **Body**: `{ question: string, options: string[] }`
- **Response**: `{ pollId: string }`

### GET `/api/polls/:id`
Get poll by ID
- **Response**: `{ _id, question, options: [{ text, votes }], voters: [] }`

### Socket.IO Events

**Client → Server**:
- `join_poll(pollId)` - Join a poll room
- `vote({ pollId, optionIndex })` - Submit a vote

**Server → Client**:
- `update(poll)` - Broadcast updated poll data
- `vote_error({ error })` - Error response for invalid votes

## 🐛 Troubleshooting

**MongoDB Connection Fails**:
- Check connection string
- Verify network access in MongoDB Atlas
- Ensure IP whitelist includes your IP

**Socket.IO Not Connecting**:
- Check CORS settings
- Verify server URL in frontend
- Check browser console for errors

**Votes Not Updating**:
- Open browser console to check for Socket.IO connection
- Verify user joined the poll room
- Check server logs for errors

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## 📄 License

This project is open source and available under the MIT License.

## 👤 Author

Built with ❤️ as a demonstration of full-stack real-time web application development.

## 🙏 Acknowledgments

- Socket.IO for real-time communication
- MongoDB for data persistence
- React for the frontend framework
- Express for the backend framework