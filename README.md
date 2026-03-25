# TMB Mining Bot 🪙

Telegram Mini App + Bot for TON mining, similar to Goldcat/ATF.

- **Web App**: hosted on GitHub Pages
- **Bot**: `@TMBBot` (Telegram)
- **Database**: Firebase Firestore
- **Currency**: TON

---

## 🚀 Quick Setup

### 1️⃣ Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project: `tmb-mining`
3. In project settings → **Service Accounts** → Generate new private key → save as `serviceAccountKey.json` (keep safe!)
4. Create Firestore Database:
   - Start in **test mode** (for development)
   - Location: nearest
5. Get Firebase config (Project Settings → SDK setup → Web) and replace in `public/index.html`

### 2️⃣ Bot Token

1. Open `@BotFather` in Telegram
2. `/newbot` → Name: `TMB Mining` → Username: `TMBBot` (or unique)
3. Copy the token and paste into `bot/.env` (see `.env.example`)

### 3️⃣ Environment Variables

Create `bot/.env`:

```env
BOT_TOKEN=8768373923:AAFWtI2h1yddbcr6Y0PsOkTmGSvvWBGyfCo
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
ADMIN_SECRET=CHANGE_THIS_PASSWORD
```

> **Note**: `serviceAccountKey.json` should be placed in `bot/` folder.

### 4️⃣ Install Dependencies

```bash
npm install
```

### 5️⃣ Run Bot (local)

```bash
npm start
# or
npm run dev  # with nodemon
```

Bot will start polling.

### 6️⃣ Deploy Web App to GitHub Pages

1. Create a new GitHub repo: `tmb-bot`
2. Push all files (except `serviceAccountKey.json` which is gitignored)
3. Enable GitHub Pages:
   - Settings → Pages → Source: GitHub Actions
4. The workflow `.github/workflows/deploy.yml` will auto-deploy `public/` to `gh-pages` branch.
5. Your site will be at: `https://YOUR_USERNAME.github.io/tmb-bot/`

### 7️⃣ Link Bot to Web App

In `bot/bot.js`, replace `YOUR_USERNAME` in the Web App button URL:

```js
web_app: { url: 'https://YOUR_USERNAME.github.io/tmb-bot/' }
```

Then restart bot.

---

## 📁 Project Structure

```
tmb-bot/
├── public/
│   ├── index.html      # Web App
│   ├── style.css
│   └── script.js
├── bot/
│   ├── bot.js
│   ├── .env.example
│   └── serviceAccountKey.json (ignored)
├── .github/
│   └── workflows/
│       └── deploy.yml
├── .gitignore
├── package.json
└── README.md
```

---

## 🔐 Admin Panel

- Web: `admin.html` (same folder) – password from `ADMIN_SECRET` in `.env`
- Telegram Bot: `/admin <password>` command

---

## ⚙️ Configurable Values

In `public/script.js` (or `public/index.html` if embedded):

- `MINE_AMOUNT` – amount per mining session (default `0.0008` TMB)
- `MINE_DURATION` – session duration in seconds (default `3600` = 1 hour)
- `PROJECT_WALLET` – wallet address for payouts: `UQBufh6lLHE5H1NDJXQwRIVCX-t4iKHyyoXD0Spm8N9navPx`

---

## 📝 Firestore Structure

Collection: `users`

Document ID: Telegram user ID

Fields:
- `uid` (string)
- `first_name` (string)
- `username` (string)
- `pool` (number) – unclaimed mined amount
- `holding` (number) – claimed balance waiting for withdrawal
- `level` (number)
- `mining` (boolean)
- `mineStart` (timestamp)
- `lastClaim` (timestamp)
- `referrals` (number)
- `createdAt` (timestamp)

---

## 🛡 Security Notes

- The web app runs in **test mode** (anyone can read/write). For production, set proper Firestore rules:
  ```javascript
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /users/{userId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
  ```
- Keep `serviceAccountKey.json` secret; never commit it.
- Change `ADMIN_SECRET` to a strong password.

---

## 🧪 Testing

1. Open Telegram, start `@TMBBot`
2. Click "Open Mining App" – opens your GitHub Pages site
3. Start mining, claim, etc.
4. Referral link: `https://t.me/TMBBot?start=<YOUR_ID>`

---

## 📦 Build & Deploy (manual)

If you prefer manual deploy without Actions:

```bash
npm install -g gh-pages
gh-pages -d public
```

---

**Made with ❤️ by TMB Mining Team**
