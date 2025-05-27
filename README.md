# Feedback Sync

A Progressive Web App (PWA) for collecting and synchronizing customer feedback across multiple devices, with offline support.

![Feedback Sync Logo](public/logo.svg)

## Features

- ✅ **Progressive Web App (PWA)** - Works offline and can be installed on devices
- 🔄 **Cross-Device Synchronization** - Sync feedback data between devices using peer-to-peer connections
- 👤 **User Management** - Create and manage user accounts that sync across devices
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile devices
- 🌙 **Dark Mode Support** - Automatically adapts to system preferences
- 🔒 **Offline-First Architecture** - All data is stored locally and synced when online

## Technology Stack

- **Frontend Framework**: React with TypeScript
- **Styling**: Tailwind CSS
- **Routing**: React Router
- **Storage**: IndexedDB (via Dexie.js)
- **P2P Communication**: WebRTC (via PeerJS)
- **PWA Support**: Workbox (via Vite PWA Plugin)
- **Build Tool**: Vite

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/feedback-sync.git
   cd feedback-sync
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn
   ```

3. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
# or
yarn build
```

The built files will be in the `dist` directory and can be served using any static file server.

## Usage

### Creating an Account

1. Navigate to the login page
2. Click "Don't have an account? Sign up"
3. Fill in your details and create an account

### Adding Feedback

1. Log in to your account
2. Click the "Add Feedback" button
3. Fill in the feedback details and submit

### Synchronizing Across Devices

1. Create an account on your first device
2. Open the app on a second device
3. Click "Refresh accounts" on the login page to see accounts from other devices
4. Select your account and log in
5. Your feedback data will automatically synchronize between devices when both are online

## Offline Support

The app works fully offline:

1. All data is stored locally in IndexedDB
2. Changes made offline are saved locally
3. When you come back online, data is automatically synchronized with other devices

## Project Structure

```
feedback-sync/
├── public/              # Static assets
├── src/
│   ├── components/      # React components
│   │   ├── feedback/    # Feedback-related components
│   │   ├── layout/      # Layout components
│   │   └── ui/          # Reusable UI components
│   ├── contexts/        # React context providers
│   ├── db/              # Database configuration
│   ├── pages/           # Page components
│   ├── services/        # Service modules
│   ├── types/           # TypeScript type definitions
│   ├── App.tsx          # Main App component
│   └── main.tsx         # Application entry point
├── index.html           # HTML template
├── vite.config.ts       # Vite configuration
└── package.json         # Project dependencies
```

## Security Considerations

This application is designed as a demonstration and has several security limitations:

- Passwords are stored in plaintext in localStorage (not recommended for production)
- All authentication happens client-side
- No server-side validation

For a production application, you would need to implement:
- Proper password hashing
- Server-side authentication
- Secure token-based sessions
- Data encryption for sensitive information

## License

[MIT License](LICENSE)

## Acknowledgements

- [React](https://reactjs.org/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Dexie.js](https://dexie.org/)
- [PeerJS](https://peerjs.com/)
- [Lucide Icons](https://lucide.dev/)