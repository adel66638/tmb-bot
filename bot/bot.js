const { Telegraf } = require('telegraf');
const admin = require('firebase-admin');
require('dotenv').config();

// ─── CONFIG ───
const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'CHANGE_THIS_PASSWORD';

// ─── FIREBASE ───
let db;
if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
 const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
 admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
 db = admin.firestore();
} else if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
 const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
 admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
 db = admin.firestore();
} else {
 throw new Error('Firebase service account not provided');
}

// ─── BOT ───
const bot = new Telegraf(BOT_TOKEN);

// ─── HELPERS ───
async function getUser(uid) {
 const ref = db.collection('users').doc(String(uid));
 const snap = await ref.get();
 if (snap.exists) return snap.data();
 return null;
}

async function createUser(uid, firstName, username) {
 const user = {
 uid: String(uid),
 first_name: firstName,
 username: username || '',
 pool: 0,
 holding: 0,
 level: 1,
 mining: false,
 mineStart: null,
 lastClaim: null,
 referrals: 0,
 createdAt: admin.firestore.FieldValue.serverTimestamp()
 };
 await db.collection('users').doc(String(uid)).set(user);
 return user;
}

async function updateUser(uid, data) {
 await db.collection('users').doc(String(uid)).update(data);
}

// ─── COMMANDS ───

bot.start(async (ctx) => {
 const from = ctx.update.message.from;
 const uid = from.id;
 const firstName = from.first_name;
 const username = from.username;

 // Parse start parameter for referral
 const startParam = ctx.message.text.split(' ')[1]; // /start 12345
 const referrer = startParam ? startParam : null;

 // Get or create user
 let user = await getUser(uid);
 if (!user) {
 user = await createUser(uid, firstName, username);
 }

 // Handle referral
 if (referrer && referrer !== String(uid)) {
 const refSnap = await db.collection('users').doc(referrer).get();
 if (refSnap.exists) {
 // Increment referrals count for referrer
 await db.collection('users').doc(referrer).update({
 referrals: admin.firestore.FieldValue.increment(1)
 });
 // Optional: give bonus to referrer (e.g., 0.05 TON)
 // await db.collection('users').doc(referrer).update({
 //  holding: admin.firestore.FieldValue.increment(0.05)
 // });
 }
 }

 // Send welcome message with Web App button
 await ctx.reply(`Welcome to TMB Mining, ${firstName}! 🪙\n\nUse the menu below to access the mining app.`, {
 reply_markup: {
 inline_keyboard: [
 [{
 text: '🚀 Open Mining App',
 web_app: { url: 'https://adel66638.github.io/tmb-bot/' }
 }]
 ]
 }
 });
});

bot.help((ctx) => ctx.reply('Commands:\n/start - Open app\n/balance - Check balance\n/withdraw - Withdraw\n/refs - Your referrals'));

bot.command('balance', async (ctx) => {
 const uid = ctx.message.from.id;
 const user = await getUser(uid);
 if (!user) return ctx.reply('❌ User not found. Start the bot first with /start');

 const total = (user.pool || 0) + (user.holding || 0);
 const msg = `
💰 *Balance*:
• Pool: ${(user.pool || 0).toFixed(4)} TMB
• Holding: ${(user.holding || 0).toFixed(4)} TMB
• Total: ${total.toFixed(4)} TMB
• Level: ${user.level}
• Mining: ${user.mining ? 'Active' : 'Idle'}
`;
 await ctx.reply(msg, { parse_mode: 'Markdown' });
});

bot.command('refs', async (ctx) => {
 const uid = ctx.message.from.id;
 const user = await getUser(uid);
 if (!user) return ctx.reply('❌ Start the bot first with /start');

 const botUsername = process.env.BOT_USERNAME || 'TMBBot';
 const link = `https://t.me/${botUsername}?start=${uid}`;
 const msg = `
👥 *Referrals*:
• Total: ${user.referrals || 0}
• Invite link: ${link}
`;
 await ctx.reply(msg, { parse_mode: 'Markdown' });
});

bot.command('withdraw', async (ctx) => {
 const uid = ctx.message.from.id;
 const user = await getUser(uid);
 if (!user) return ctx.reply('❌ Start the bot first with /start');

 const pool = user.pool || 0;
 if (pool <= 0) return ctx.reply('❌ Pool is empty.');

 // In this simple version, withdraw ALL pool to holding
 // In production, you'd send to external wallet (TON) via API
 const amount = pool;
 user.holding = parseFloat((user.holding + amount).toFixed(4));
 user.pool = 0;
 await updateUser(uid, { holding: user.holding, pool: 0 });

 await ctx.reply(`✅ Withdrawn ${amount.toFixed(4)} TMB to your holding balance.\n\nYou can now request payout to your TON wallet.`);
});

bot.command('admin', async (ctx) => {
 // Stats
 const snapshot = await db.collection('users').get();
 const users = snapshot.docs.map(d => d.data());
 const totalPool = users.reduce((sum, u) => sum + (u.pool || 0), 0);
 const totalHolding = users.reduce((sum, u) => sum + (u.holding || 0), 0);
 const totalUsers = users.length;
 const totalReferrals = users.reduce((sum, u) => sum + (u.referrals || 0), 0);

 const msg = `
🔐 *Admin Panel*
• Users: ${totalUsers}
• Total Pool: ${totalPool.toFixed(4)} TMB
• Total Holding: ${totalHolding.toFixed(4)} TMB
• Total Referrals: ${totalReferrals}
`;
 await ctx.reply(msg, { parse_mode: 'Markdown' });
});

// ─── WEB APP DATA HANDLER (optional) ───
bot.on('web_app_data', async (ctx) => {
 // Web App can send data back to bot
 const data = ctx.update.web_app_data.data;
 // Handle actions like claim, withdraw etc.
 await ctx.reply(`Received: ${data}`);
});

// ─── START POLLING ───
console.log('TMB Bot starting...');
bot.launch()
 .then(() => console.log('Bot launched'))
 .catch(err => console.error('Bot error:', err));

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
