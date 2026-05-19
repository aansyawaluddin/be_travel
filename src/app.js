const express = require('express');
const cors = require('cors');
const bookingRoutes = require('./routes/bookingRoutes');

const app = express();

const PORT = process.env.PORT || 5000;

app.use(cors()); 
app.use(express.json());

app.use('/api/bookings', bookingRoutes);

app.get('/', (req, res) => {
    res.send('API TravelKu siap digunakan!');
});

// Menjalankan server
app.listen(PORT, () => {
    console.log(`Server TravelKu berjalan di http://localhost:${PORT}`);
});