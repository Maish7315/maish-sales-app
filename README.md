# Maish Sale Sync - Cross-Platform App

A React-based sales management application converted to cross-platform desktop and mobile apps using Electron and Capacitor.

## Features

- User authentication (signup/login with local storage)
- Sales creation and management (stored locally)
- File uploads (receipts stored locally)
- Responsive design
- Front-end only application

## Project Structure

- `src/` - React application source code
- `electron/` - Electron desktop app configuration
- `resources/` - Mobile app icons and splash screens
- `capacitor.config.ts` - Capacitor configuration

## Architecture

This is a front-end only application that stores all data locally in the browser's localStorage.

## Development

### Prerequisites

- Node.js 18+
- npm or yarn
- For mobile development: Android Studio (for Android), Xcode (for iOS)
- For desktop development: No additional tools needed

### Installation

```bash
npm install
```

### Environment Variables

No environment variables are required for this front-end only application. All data is stored locally.

## Building and Running

### Web App

```bash
npm run dev  # Development server
npm run build  # Production build
npm run preview  # Preview production build
```

### Netlify Deployment

The app is configured for easy Netlify deployment:

1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`

The `netlify.toml` and `public/_redirects` files handle SPA routing automatically.

### Desktop App (Electron)

#### Development

```bash
npm run electron:dev  # Runs React dev server + Electron
```

#### Production Build

```bash
# Build for all platforms
npm run electron:build

# Build for specific platforms
npm run electron:build:win    # Windows
npm run electron:build:mac    # macOS
npm run electron:build:linux  # Linux
```

The built executables will be in `dist-electron/` directory.

### Mobile Apps (Capacitor)

#### Development

```bash
npm run cap:build  # Build React app
npm run cap:sync   # Sync web assets to mobile projects
npm run cap:android  # Open Android Studio
npm run cap:ios      # Open Xcode
```

#### Production Build

```bash
# For Android
npm run mobile:build:android

# For iOS
npm run mobile:build:ios
```

## Mobile App Configuration

- **App ID**: `com.maishsalesync.app`
- **App Name**: `Maish Sale Sync`
- **Icons**: Located in `resources/icon.png`
- **Splash Screen**: Located in `resources/splash.png`

### File Uploads on Mobile

The app supports file uploads for receipts. On mobile devices:
- File input works for gallery selection
- Camera plugin is configured for photo capture
- Permissions are automatically requested

## Deployment

### Desktop Apps

The Electron builder generates:
- `.exe` for Windows
- `.dmg` for macOS
- `.AppImage` for Linux

For code signing:
1. Obtain code signing certificates
2. Configure `build` section in `package.json` with certificate paths
3. Use `CSC_LINK` and `CSC_KEY_PASSWORD` environment variables

### Mobile Apps

#### Android

1. Open the project in Android Studio
2. Build APK/AAB
3. Sign the APK for release
4. Upload to Google Play Store

#### iOS

1. Open the project in Xcode
2. Configure signing certificates
3. Build IPA
4. Upload to App Store Connect

### Signing and Certificates

#### Windows
- Use `electron-builder` with `certificateFile` and `certificatePassword`

#### macOS
- Use `electron-builder` with `identity` or certificate files

#### Android
- Use Android Studio or command line tools for APK signing

#### iOS
- Use Xcode for code signing with Apple Developer certificates

## Troubleshooting

### Electron Issues
- Ensure Node.js version compatibility
- Check icon paths in `electron/main.js`

### Capacitor Issues
- Run `npm run cap:sync` after building
- Ensure Android Studio/XCode are installed
- Check Capacitor version compatibility

### Mobile Permissions
- Camera permissions are handled automatically
- File access permissions are included in the build

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes
4. Test on all platforms
5. Submit a pull request

## License

This project is licensed under the MIT License.
