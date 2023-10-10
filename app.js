import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import userRoutes from './routes/user.routes.js';
import blogRoutes from './routes/blogs.routes.js';
import errorMiddleware from './middleware/error.middleware.js';

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));


app.use(cors({
  origin: ['https://justwriteblog.netlify.app', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.get('/', (req, res) => {
  res.send('Hello World');
});

app.use('/api/v1/user', userRoutes);
app.use('/api/v1/blog', blogRoutes);

app.all('*', (req, res) => {
  return res.status(404).send('OOPS!! PAGE NOT FOUND');
});

app.use(errorMiddleware);

export default app;
