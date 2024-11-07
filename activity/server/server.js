import express from "express";
import dotenv from "dotenv";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, push, get, remove, set, query, orderByKey, limitToFirst, startAfter, update } from "firebase/database";
import { body, validationResult } from 'express-validator';
import fetch from 'node-fetch';
import helmet from 'helmet';
import cors from 'cors';
import http from 'http';
import { WebSocketServer } from 'ws';
import { config } from './config.js';
import discordService from './services/discordService.js';
import fileUpload from 'express-fileupload';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: "../.env" });

const app = express();
const port = config.port;

// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getDatabase(firebaseApp);

// Allow express to parse JSON bodies
app.use(express.json());

// Middleware для обработки ошиок
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
};

// Валидация для создания гонки
const validateRace = [
  body('name').notEmpty().withMessage('Name is required'),
  body('track').notEmpty().withMessage('Track is required'),
  body('trackConfig').optional(),
  body('slots').isInt({ min: 1 }).withMessage('Slots must be a positive integer'),
  body('carClasses').isArray().withMessage('Car classes must be an array'),
  body('carClasses.*').notEmpty().withMessage('Car class cannot be empty'),
  body('dateTime').isISO8601().toDate().withMessage('Invalid date and time')
];

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://your-production-domain.com' 
    : 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "https:", "wss:", "http:", "ws:", "https://*.discordsays.com", "wss://*.discordsays.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "https:", "http:", "data:"],
      fontSrc: ["'self'", "https:", "http:", "data:"],
      mediaSrc: ["'self'", "https:", "http:", "data:"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false,
}));

// Добавляем middleware для загрузки файлов
app.use(fileUpload({
  limits: { fileSize: 1024 * 1024 }, // 1MB
  abortOnLimit: true
}));

// Делаем папку uploads доступной статически
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('WebSocket connection established');

  ws.on('message', (message) => {
    console.log('Received message:', message);
    // Здесь вы можете обрабатывать входящие сообщеня
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });
});

app.use('/.proxy', async (req, res, next) => {
  const targetUrl = `https://1296426439725285437.discordsays.com${req.url}`;
  try {
    const proxyRes = await fetch(targetUrl, {
      method: req.method,
      headers: {
        ...req.headers,
        'Host': '1296426439725285437.discordsays.com'
      },
      body: req.method !== 'GET' && req.method !== 'HEAD' ? req.body : undefined,
    });

    // Копируем заголовки ответа
    Object.entries(proxyRes.headers.raw()).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    // Устанавливаем статус ответа
    res.status(proxyRes.status);

    // Передаем тело ответа
    proxyRes.body.pipe(res);
  } catch (error) {
    console.error('Proxy error:', error);
    next(error);
  }
});

app.post("/api/token", [
  body('code').isString().notEmpty(),
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  console.log("Received request to /api/token");
  try {
    const response = await fetch(`https://discord.com/api/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.VITE_DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type: "authorization_code",
        code: req.body.code,
      }),
    });
    const { access_token } = await response.json();
    res.json({ access_token });
  } catch (error) {
    console.error("Error in /api/token:", error);
    next(error);
  }
});

// Обновленный эндпоинт для создания гонки
app.post("/api/races", validateRace, async (req, res, next) => {
  console.log('Received race creation request:', req.body);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation errors:', errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const raceData = {
      ...req.body,
      dateTime: new Date(req.body.dateTime).toISOString()
    };
    console.log('Processed race data:', raceData);
    const racesRef = ref(db, 'races');
    const newRaceRef = await push(racesRef, raceData);
    console.log('Race created successfully:', newRaceRef.key);
    res.status(201).json({ id: newRaceRef.key, ...raceData });
  } catch (error) {
    console.error('Error creating race:', error);
    res.status(500).json({ error: 'Failed to create race', details: error.message });
  }
});

// Обновленный эндпоинт для получения списка гонок с пагинацией
app.get("/api/races", async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const racesRef = ref(db, 'races');
    const snapshot = await get(racesRef);

    const races = [];
    snapshot.forEach((childSnapshot) => {
      races.push({ id: childSnapshot.key, ...childSnapshot.val() });
    });

    const totalCount = races.length;
    const totalPages = Math.ceil(totalCount / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedRaces = races.slice(startIndex, endIndex);

    res.json({
      races: paginatedRaces,
      currentPage: page,
      totalPages: totalPages,
      totalCount: totalCount
    });
  } catch (error) {
    next(error);
  }
});

// Новый эндпоинт для удаления гонки
app.delete("/api/races/:id", async (req, res, next) => {
  try {
    const raceRef = ref(db, `races/${req.params.id}`);
    await remove(raceRef);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Обновляем эндпоинт для редактрования гонки
app.put("/api/races/:id", validateRace, async (req, res, next) => {
  console.log('Received race update request:', req.body);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation errors:', errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const raceId = req.params.id;
    const raceData = {
      ...req.body,
      dateTime: new Date(req.body.dateTime).toISOString()
    };
    
    console.log('Processed race data:', raceData);
    const raceRef = ref(db, `races/${raceId}`);
    
    // Используем update вместо set для частичного обновления
    // ии set с опцией merge: true
    await update(raceRef, raceData);
    // Альтернативный вариант:
    // await set(raceRef, raceData, { merge: true });
    
    console.log('Race updated successfully:', raceId);
    res.status(200).json({ id: raceId, ...raceData });
  } catch (error) {
    console.error('Error updating race:', error);
    res.status(500).json({ error: 'Failed to update race', details: error.message });
  }
});

// Эндпоинт для получеия деталей гонки
app.get("/api/races/:id", async (req, res, next) => {
  try {
    const raceRef = ref(db, `races/${req.params.id}`);
    const snapshot = await get(raceRef);
    
    if (snapshot.exists()) {
      res.json({ id: snapshot.key, ...snapshot.val() });
    } else {
      res.status(404).json({ error: 'Race not found' });
    }
  } catch (error) {
    next(error);
  }
});

// Эндпоинт для получения инфомации о пользователе
app.get("/api/users/:id", async (req, res, next) => {
  try {
    const userRef = ref(db, `users/${req.params.id}`);
    const snapshot = await get(userRef);
    
    if (snapshot.exists()) {
      const userData = snapshot.val();
      res.json({
        id: snapshot.key,
        username: userData.username || 'Unknown',
        avatar: userData.avatar || 'https://example.com/default-avatar.png'
      });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    next(error);
  }
});

// Добавить в начало файла после импортов
if (!process.env.DISCORD_TOKEN) {
  console.error('DISCORD_TOKEN is not set in .env file');
  process.exit(1);
}

// Проверим токен, попробовав получить информацию о боте
try {
  const response = await fetch('https://discord.com/api/v10/users/@me', {
    headers: {
      Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
    },
  });
  
  if (!response.ok) {
    console.error('Invalid Discord token. Please check your .env file.');
    process.exit(1);
  }
  
  const botData = await response.json();
  console.log('Bot authenticated as:', botData.username);
} catch (error) {
  console.error('Failed to authenticate bot:', error);
  process.exit(1);
}

// Добавить после настройки CORS
app.get("/api/user/:userId", async (req, res) => {
  try {
    const userData = await discordService.getUserInfo(req.params.userId);
    res.json(userData);
  } catch (error) {
    console.error('Error fetching Discord user:', error);
    // Используем метод из сервиса для получения индекса дефолтного аватара
    const defaultAvatarIndex = discordService.getDefaultAvatarIndex(req.params.userId);
    res.status(500).json({
      id: req.params.userId,
      username: 'Unknown User',
      avatar: null,
      defaultAvatarUrl: `https://cdn.discordapp.com/embed/avatars/${defaultAvatarIndex}.png`
    });
  }
});

app.get("/api/guilds/:guildId/members/:userId", async (req, res) => {
  try {
    const { guildId, userId } = req.params;
    const response = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/members/${userId}`,
      {
        headers: {
          Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error(`Discord API error: ${response.status}`);
      // Возвращаем базовые права вместо 404
      return res.json({
        permissions: '0',
        user: { id: userId },
        guild: { id: guildId }
      });
    }

    const memberData = await response.json();
    res.json(memberData);
  } catch (error) {
    console.error('Error fetching guild member:', error);
    // Возвращаем базовые права вместо ошибки
    res.json({
      permissions: '0',
      user: { id: req.params.userId },
      guild: { id: req.params.guildId }
    });
  }
});

app.get("/api/guilds/:guildId", async (req, res) => {
  try {
    const response = await fetch(
      `https://discord.com/api/v10/guilds/${req.params.guildId}?with_counts=true`,
      {
        headers: {
          Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error(`Discord API error: ${response.status}`);
      throw new Error('Failed to fetch guild info');
    }

    const guildData = await response.json();
    console.log('Guild data:', guildData); // Для отладки

    res.json(guildData);
  } catch (error) {
    console.error('Error fetching guild:', error);
    res.status(500).json({
      id: req.params.guildId,
      name: 'Unknown Server',
      icon: null,
      roles: []
    });
  }
});

app.get("/api/guilds/:guildId/member-permissions", async (req, res) => {
  try {
    const response = await fetch(
      `https://discord.com/api/v10/guilds/${req.params.guildId}/members/${req.query.userId}`,
      {
        headers: {
          Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error(`Discord API error: ${response.status}`);
      throw new Error('Failed to fetch member permissions');
    }

    const memberData = await response.json();
    
    // Получаем роли пользователя и их разрешения
    const roles = memberData.roles || [];
    
    // Проверяем наличие прав администратора (0x8)
    const ADMINISTRATOR_PERMISSION = BigInt(0x8);
    let permissions;
    
    try {
      permissions = BigInt(memberData.permissions || '0');
    } catch (error) {
      console.error('Error converting permissions to BigInt:', error);
      permissions = BigInt(0);
    }

    // Проверяем, является ли пользователь владельцем сервера
    const guildResponse = await fetch(
      `https://discord.com/api/v10/guilds/${req.params.guildId}`,
      {
        headers: {
          Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (guildResponse.ok) {
      const guildData = await guildResponse.json();
      if (guildData.owner_id === req.query.userId) {
        permissions = permissions | ADMINISTRATOR_PERMISSION;
      }
    }

    // Добавляем отлаочную инормацию
    console.log('Permissions check:', {
      originalPermissions: memberData.permissions,
      convertedPermissions: permissions.toString(),
      roles,
      userId: req.query.userId,
      isAdmin: (permissions & ADMINISTRATOR_PERMISSION) === ADMINISTRATOR_PERMISSION
    });

    res.json({
      permissions: permissions.toString(),
      roles
    });
  } catch (error) {
    console.error('Error fetching member permissions:', error);
    res.status(500).json({
      error: error.message,
      permissions: '0',
      roles: []
    });
  }
});

app.get("/api/guilds/:guildId/channels", async (req, res) => {
  try {
    const response = await fetch(
      `https://discord.com/api/v10/guilds/${req.params.guildId}/channels`,
      {
        headers: {
          Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch channels');
    }

    const channels = await response.json();
    res.json(channels);
  } catch (error) {
    console.error('Error fetching channels:', error);
    res.status(500).json([]);
  }
});

app.post("/api/guilds/:guildId/settings", async (req, res) => {
  try {
    const { announcementChannelId, participantRoleId } = req.body;
    const guildId = req.params.guildId;

    // Проверяем существование канала и роли через Discord API
    const [channelResponse, roleResponse] = await Promise.all([
      fetch(
        `https://discord.com/api/v10/channels/${announcementChannelId}`,
        {
          headers: {
            Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
            'Content-Type': 'application/json',
          },
        }
      ),
      fetch(
        `https://discord.com/api/v10/guilds/${guildId}/roles/${participantRoleId}`,
        {
          headers: {
            Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
            'Content-Type': 'application/json',
          },
        }
      )
    ]);

    if (!channelResponse.ok || !roleResponse.ok) {
      throw new Error('Invalid channel or role ID');
    }

    // Сохраняе в структуру organizations вместо guild_settings
    const orgRef = ref(db, `organizations/${guildId}`);
    const snapshot = await get(orgRef);
    
    if (!snapshot.exists()) {
      throw new Error('Organization not registered');
    }

    // Обновляем существующую организацию, сохраняя остальные поля
    await update(orgRef, {
      announcementChannelId,
      participantRoleId,
      updatedAt: new Date().toISOString()
    });

    res.json({
      success: true,
      settings: {
        announcementChannelId,
        participantRoleId
      }
    });
  } catch (error) {
    console.error('Error saving settings:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Обновляем GET endpoint для получения настроек
app.get("/api/guilds/:guildId/settings", async (req, res) => {
  try {
    const orgRef = ref(db, `organizations/${req.params.guildId}`);
    const snapshot = await get(orgRef);
    
    if (!snapshot.exists()) {
      return res.json({
        announcementChannelId: null,
        participantRoleId: null
      });
    }

    const orgData = snapshot.val();
    res.json({
      announcementChannelId: orgData.announcementChannelId || null,
      participantRoleId: orgData.participantRoleId || null
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Добавить новые эндпоинты для работы с организациями
app.get("/api/organizations/:guildId", async (req, res) => {
  try {
    const orgRef = ref(db, `organizations/${req.params.guildId}`);
    const snapshot = await get(orgRef);
    
    if (snapshot.exists()) {
      res.json({ id: snapshot.key, ...snapshot.val() });
    } else {
      res.status(404).json({ error: 'Organization not found' });
    }
  } catch (error) {
    console.error('Error fetching organization:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post("/api/organizations/register", async (req, res) => {
  try {
    const { guildId, name, icon, announcementChannelId, participantRoleId } = req.body;
    const orgRef = ref(db, `organizations/${guildId}`);
    
    await set(orgRef, {
      name,
      icon,
      announcementChannelId,
      participantRoleId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error registering organization:', error);
    res.status(500).json({ error: 'Failed to register organization' });
  }
});

// Добавляем PATCH эндпоинт для обновления организации
app.patch("/api/organizations/:guildId", async (req, res) => {
  try {
    const { guildId } = req.params;
    const { name, logo, settings } = req.body;

    // Проверяем существование организации
    const orgRef = ref(db, `organizations/${guildId}`);
    const snapshot = await get(orgRef);
    
    if (!snapshot.exists()) {
      return res.status(404).json({ 
        error: 'Organization not found' 
      });
    }

    // Обновляем данне
    const updates = {
      name: name || snapshot.val().name,
      icon: logo || snapshot.val().icon,
      announcementChannelId: settings?.channelId || snapshot.val().announcementChannelId,
      participantRoleId: settings?.roleId || snapshot.val().participantRoleId,
      updatedAt: new Date().toISOString()
    };

    await update(orgRef, updates);

    res.json({
      success: true,
      ...updates
    });
  } catch (error) {
    console.error('Error updating organization:', error);
    res.status(500).json({ 
      error: 'Failed to update organization' 
    });
  }
});

// Добавить новые прокси-эндпоинты для Discord API
app.get("/api/discord/users/@me/guilds", async (req, res) => {
  try {
    const response = await fetch('https://discord.com/api/v10/users/@me/guilds', {
      headers: {
        'Authorization': `Bearer ${req.headers.authorization.split(' ')[1]}`,
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch guilds');
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error proxying Discord guilds request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get("/api/discord/guilds/:guildId/channels", async (req, res) => {
  try {
    const response = await fetch(
      `https://discord.com/api/v10/guilds/${req.params.guildId}/channels`,
      {
        headers: {
          'Authorization': `Bot ${process.env.DISCORD_TOKEN}`,
          'Content-Type': 'application/json',
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch channels');
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error proxying Discord channels request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get("/api/discord/guilds/:guildId/roles", async (req, res) => {
  try {
    const response = await fetch(
      `https://discord.com/api/v10/guilds/${req.params.guildId}/roles`,
      {
        headers: {
          'Authorization': `Bot ${process.env.DISCORD_TOKEN}`,
          'Content-Type': 'application/json',
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch roles');
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error proxying Discord roles request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post("/api/guilds/:guildId/invite", async (req, res) => {
  try {
    const { guildId } = req.params;
    
    // Создаем приглашение через Discord API
    const response = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/invites`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          max_age: 86400, // 24 часа
          max_uses: 0, // Без ограничений
          temporary: false
        })
      }
    );

    if (!response.ok) {
      throw new Error('Failed to create invite');
    }

    const invite = await response.json();
    res.json({
      inviteUrl: `https://discord.gg/${invite.code}`
    });
  } catch (error) {
    console.error('Error creating invite:', error);
    res.status(500).json({ error: 'Failed to create invite' });
  }
});

app.use(errorHandler);

server.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
