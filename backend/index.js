import express from 'express';
import cors from 'cors';
import cryptoRoutes from './routes/cryptoRoute.js';
import alertRoutes from './routes/alertRoute.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/crypto',cryptoRoutes);
app.use('/api/alert',alertRoutes);

app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
})