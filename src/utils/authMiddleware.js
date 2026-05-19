const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: "Akses ditolak, token tidak ada" });

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET || "rahasia_negara_super_aman_123");
        req.staff = verified; 
        next();
    } catch (error) {
        res.status(403).json({ error: "Token tidak valid atau kedaluwarsa" });
    }
};