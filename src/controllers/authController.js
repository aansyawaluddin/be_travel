const prisma = require('../utils/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    const { username, password, nama } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newStaff = await prisma.staff.create({
            data: { username, password: hashedPassword, nama }
        });
        res.status(201).json({ message: "Staf berhasil didaftarkan", staffId: newStaff.id });
    } catch (error) {
        res.status(400).json({ error: "Username sudah digunakan" });
    }
};

exports.login = async (req, res) => {
    const { username, password } = req.body;
    try {
        const staff = await prisma.staff.findUnique({ where: { username } });
        if (!staff) return res.status(404).json({ error: "Staf tidak ditemukan" });

        const validPass = await bcrypt.compare(password, staff.password);
        if (!validPass) return res.status(400).json({ error: "Password salah" });

        const token = jwt.sign({ id: staff.id, username: staff.username }, process.env.JWT_SECRET || "rahasia_negara_super_aman_123", { expiresIn: '1d' });
        res.json({ token, staff: { id: staff.id, nama: staff.nama } });
    } catch (error) {
        res.status(500).json({ error: "Gagal login" });
    }
};