import express from "express";
import dotenv from "dotenv";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, push, get, remove, set, query, orderByKey, limitToFirst, startAfter } from "firebase/database";
import { body, validationResult } from 'express-validator';
import fetch from 'node-fetch';
import helmet from 'helmet';
import cors from 'cors';

dotenv.config({ path: "../.env" });

const app = express();
const port = process.env.PORT || 3001;

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

// Middleware для обработки ошибок
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

app.use(helmet());

app.use('/.proxy', async (req, res, next) => {
  const targetUrl = `http://localhost:3001${req.url}`;
  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: req.headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? req.body : undefined,
    });
    res.status(response.status);
    for (const [key, value] of response.headers.entries()) {
      res.setHeader(key, value);
    }
    response.body.pipe(res);
  } catch (error) {
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

// Эндпоинт для обновления гонки
app.put("/api/races/:id", validateRace, async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const raceRef = ref(db, `races/${req.params.id}`);
    await set(raceRef, req.body);
    res.json({ id: req.params.id, ...req.body });
  } catch (error) {
    next(error);
  }
});

// Эндпоинт для получения деталей гонки
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

// Эндпоинт для получения информации о пользователе
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

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
