import express from 'express';
import { config } from 'dotenv';
import cors from 'cors';
import trip from './routes/tripRoutes.js';
import postRoutes from './routes/postRoutes.js'
import cookieParser from 'cookie-parser';
import userRoute from './routes/userRoute.js'
// import userRoute from './routes/userRoute.js';


config({
    path: './config/config.env'
})

const app = express();

app.use(express.urlencoded())
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: '*', // Replace '*' with your frontend's origin in production
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  }));


app.use("/api/v1", trip)
app.use("/api/v1", postRoutes)
app.use("/api/v1",userRoute)



export default app;