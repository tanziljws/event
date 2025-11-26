# Mobile App Build Instructions

## ✅ Configuration Status

Semua konfigurasi sudah di-set untuk production Railway backend:

- **API Base URL**: `https://backend-nasa.up.railway.app/api`
- **File Base URL**: `https://backend-nasa.up.railway.app`
- **WebSocket URL**: `wss://backend-nasa.up.railway.app/ws`

## 📱 Build untuk Android

### Prerequisites

1. **Flutter SDK** (versi terbaru)
   ```bash
   flutter --version
   ```

2. **Android Studio** dengan Android SDK
   - Android SDK Platform 33 atau lebih tinggi
   - Android SDK Build-Tools

3. **Java JDK** (JDK 17 atau lebih tinggi)

### Build Steps

1. **Masuk ke folder mobileapp**
   ```bash
   cd mobileapp
   ```

2. **Install dependencies**
   ```bash
   flutter pub get
   ```

3. **Cek Flutter setup**
   ```bash
   flutter doctor
   ```

4. **Connect device atau start emulator**
   ```bash
   # List devices
   flutter devices
   
   # Atau start emulator dari Android Studio
   ```

5. **Build APK untuk testing**
   ```bash
   flutter build apk --debug
   ```
   
   APK akan ada di: `build/app/outputs/flutter-apk/app-debug.apk`

6. **Build APK untuk release (production)**
   ```bash
   flutter build apk --release
   ```
   
   APK akan ada di: `build/app/outputs/flutter-apk/app-release.apk`

7. **Build App Bundle untuk Google Play Store**
   ```bash
   flutter build appbundle --release
   ```
   
   AAB akan ada di: `build/app/outputs/bundle/release/app-release.aab`

### Install ke Device

**Via ADB:**
```bash
flutter install
```

**Atau manual:**
1. Transfer APK ke HP via USB/email/cloud
2. Enable "Install from Unknown Sources" di HP
3. Install APK

## 🔧 Troubleshooting

### Error: "Gradle build failed"
```bash
cd android
./gradlew clean
cd ..
flutter clean
flutter pub get
flutter build apk
```

### Error: "SDK location not found"
Set `ANDROID_HOME` environment variable:
```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

### Error: "Java version"
Install JDK 17:
```bash
# macOS
brew install openjdk@17

# Set JAVA_HOME
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
```

## 📝 Test Credentials

Setelah build, gunakan credentials ini untuk test:

- **Email**: `organizer@1test.com`
- **Password**: `Test123!`

## 🔄 Switch ke Local Development

Jika ingin test dengan local backend, uncomment baris di file berikut:

1. `lib/core/network/network_config.dart`
2. `lib/core/constants/api_constants.dart`
3. `lib/core/constants/app_constants.dart`
4. `lib/core/services/websocket_service.dart`

Dan comment baris production.

## 📦 Build untuk iOS (jika perlu)

```bash
flutter build ios --release
```

**Note**: Perlu Mac dengan Xcode untuk build iOS.

