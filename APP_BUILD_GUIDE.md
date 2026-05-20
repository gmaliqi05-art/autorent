# Building RentaKar për Play Store + App Store

RentaKar bazohet në React/Vite (web), por mund të paketohet si app native për Android dhe iOS përmes **Capacitor**.

## 📱 Pse Capacitor (jo native React Native)?

- **Një kod = dy platforma + web** — i njëjti kod TypeScript/React shërbehet kudo
- **PWA i parë** — gjithçka punon në browser, pastaj wrap-ohet me Capacitor
- **Plugins native** — kur duhet (kamera, push notifications, biometric auth) i shtojmë veçmas
- **Vetëm një team** — pa nevojë për iOS dev + Android dev të ndarë

## 🛠 Kërkesat e mjedisit

### Për Android (APK / AAB për Play Store)
- **Java JDK 17+** (Microsoft OpenJDK rekomandohet në Windows)
- **Android Studio** (më i fundit) — për `android/` projekt
- **Android SDK** (instalohet bashkë me Android Studio)
- **Gradle** (instalohet automatikisht në projekt)

### Për iOS (IPA për App Store)
- **macOS** (e detyrueshme — iOS nuk mund të ndërtohet në Windows/Linux)
- **Xcode 15+**
- **CocoaPods** (`sudo gem install cocoapods`)
- **Apple Developer Account** ($99/vit për të bërë submit në App Store)

## 🚀 Hap pas hapi

### 1. Build i Web App-it
```bash
npm install
npm run build
```
Kjo prodhon `dist/` me të gjithë HTML/CSS/JS të optimizuar.

### 2. Shto platformën Android
```bash
npm run app:add:android
```
Kjo krijon folder-in `android/` me një projekt të plotë Gradle.

### 3. Shto platformën iOS (vetëm Mac)
```bash
npm run app:add:ios
```
Krijon folder-in `ios/`.

### 4. Sync web build → app native
Pas çdo `npm run build` ose ndryshim në `dist/`:
```bash
npm run app:sync
```
Kjo kopjon `dist/` tek `android/app/src/main/assets/public` dhe `ios/App/App/public`.

### 5. Hap në IDE për test/build

**Android:**
```bash
npm run app:open:android
```
Hapet Android Studio → kliko **▶ Run** për të testuar në emulator/telefon, ose **Build > Generate Signed Bundle** për AAB-në e Play Store.

**iOS:**
```bash
npm run app:open:ios
```
Hapet Xcode → kliko **▶ Run** për test, ose **Product > Archive** për të bërë submit në App Store Connect.

## 🎨 Pjesë specifike app-only

Detektim automatik nëse app po ekzekutohet si app native ose PWA:
```ts
import { useStandaloneMode } from '@/lib/useStandaloneMode';

function MyComponent() {
  const { isAppMode, isNative, isStandalone } = useStandaloneMode();
  if (isAppMode) {
    // Hide browser chrome, show bottom nav, etc.
  }
}
```

Tashmë i implementuar në `App.tsx`:
- Kur isAppMode = true: **fshehet Navbar dhe Footer**, **shfaqet MobileBottomNav** poshtë
- Safe-area insets aplikohen automatikisht (notch / dynamic island / home indicator)

## 📦 Konfigurimi i app-it

`capacitor.config.ts` përmban:
- `appId: com.rentcars.life` — bundle ID (i njëjti për Android dhe iOS)
- `appName: RentaKar` — emri që shihet në home screen
- `webDir: dist` — output i Vite
- Konfigurimi i SplashScreen dhe StatusBar

## 🔐 Submission në Play Store

### 1. Krijo signing key
```bash
keytool -genkey -v -keystore rentakar-release-key.keystore \
  -alias rentakar -keyalg RSA -keysize 2048 -validity 10000
```
**RUAJ këtë `.keystore` me kujdes — pa të, nuk mund të bësh update të app-it në Play Store!**

### 2. Konfiguro Gradle me keystore
Te `android/app/build.gradle` shto:
```gradle
android {
  signingConfigs {
    release {
      storeFile file('rentakar-release-key.keystore')
      storePassword 'YOUR_STORE_PASSWORD'
      keyAlias 'rentakar'
      keyPassword 'YOUR_KEY_PASSWORD'
    }
  }
  buildTypes {
    release {
      signingConfig signingConfigs.release
    }
  }
}
```

### 3. Build AAB
Në Android Studio: **Build > Generate Signed Bundle / APK > Android App Bundle**

Upload `.aab` te [Play Console](https://play.google.com/console).

## 🔐 Submission në App Store

1. Në Xcode: **Product > Archive**
2. Te Organizer që hapet: **Distribute App > App Store Connect**
3. Login me Apple ID
4. Te [App Store Connect](https://appstoreconnect.apple.com) plotëso meta dhe submit për review

## 🐛 Probleme të shpeshta

| Problemi | Zgjidhja |
|---|---|
| **"webDir not found"** kur `cap sync` | Bën `npm run build` së pari |
| **CORS error në app native** | Kontrollo `androidScheme: 'https'` te `capacitor.config.ts` |
| **Splash screen i ngarkohet shumë** | Reduktojeni `launchShowDuration` te `capacitor.config.ts` |
| **HTTPS API calls dështojnë** | Sigurohu që `allowMixedContent: false` (default) |
| **Plugin i mungon** | `npm install @capacitor/<plugin>` + `npx cap sync` |

## 📲 Plugins të dobishëm për të ardhmen

Kur të nevojiten:
- **Push notifications:** `@capacitor/push-notifications`
- **Camera (per dokumente verifikimi):** `@capacitor/camera`
- **Geolokimi i klientit:** `@capacitor/geolocation`
- **Biometric login:** `@capgo/capacitor-native-biometric`
- **Deep linking:** `@capacitor/app` (tashmë i instaluar)

Të gjithë instalohen me `npm install`, pastaj `npx cap sync`.

## ⚠️ Folder-at `android/` dhe `ios/`

Këto **NUK** janë në git fillimisht sepse:
- Kanë mijëra skedarë (Gradle cache, Pods, etj.)
- Gjenerohen përsëri nga `npx cap add android` / `ios`
- Konfigurimi specifik (signing keys) duhet të mbahet jashtë git-it

Ata krijohen nga ti **në kompjuterin lokal** ku ke Android Studio / Xcode.
