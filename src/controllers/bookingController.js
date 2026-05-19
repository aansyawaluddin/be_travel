const prisma = require('../utils/prisma');

// Mengambil semua data dengan Filter
exports.getAllBookings = async (req, res) => {
    try {
        const { status, paketWisata, startDate, endDate } = req.query;

        let filterOptions = {};
        if (status) filterOptions.status = status;
        if (paketWisata) filterOptions.paketWisata = { contains: paketWisata };
        if (startDate && endDate) {
            filterOptions.tanggalBerangkat = {
                gte: new Date(startDate),
                lte: new Date(endDate)
            };
        }

        const bookings = await prisma.booking.findMany({
            where: filterOptions,
            orderBy: { createdAt: 'desc' }
        });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ error: "Terjadi kesalahan saat mengambil data" });
    }
};

// Menambah pemesanan
exports.createBooking = async (req, res) => {
    const { namaPemesan, kontak, paketWisata, tanggalBerangkat, jumlahPeserta, hargaPerOrang, catatan } = req.body;

    if (!kontak) return res.status(400).json({ error: "Kontak wajib diisi" });
    if (jumlahPeserta < 1) return res.status(400).json({ error: "Jumlah peserta minimal 1" });
    if (hargaPerOrang < 0) return res.status(400).json({ error: "Harga tidak boleh negatif" });

    const parsedDate = new Date(tanggalBerangkat);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (parsedDate < today) return res.status(400).json({ error: "Tanggal keberangkatan tidak boleh di masa lalu" });

    try {
        const newBooking = await prisma.booking.create({
            data: {
                namaPemesan, kontak, paketWisata,
                tanggalBerangkat: parsedDate,
                jumlahPeserta: parseInt(jumlahPeserta),
                hargaPerOrang: parseFloat(hargaPerOrang),
                catatan
            }
        });
        res.status(201).json(newBooking);
    } catch (error) {
        res.status(500).json({ error: "Gagal membuat pemesanan" });
    }
};

// Edit pemesanan
exports.updateBooking = async (req, res) => {
    const { id } = req.params;
    try {
        const updated = await prisma.booking.update({
            where: { id: parseInt(id) },
            data: req.body
        });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: "Gagal mengedit pemesanan" });
    }
};

// Hapus pemesanan
exports.deleteBooking = async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.booking.delete({
            where: { id: parseInt(id) }
        });
        res.json({ message: "Pemesanan berhasil dihapus" });
    } catch (error) {
        res.status(500).json({ error: "Gagal menghapus pemesanan" });
    }
};

// Ubah Status dengan Alur Logis
exports.updateStatus = async (req, res) => {
    const { id } = req.params;
    const { newStatus } = req.body;

    try {
        const booking = await prisma.booking.findUnique({ where: { id: parseInt(id) } });
        if (!booking) return res.status(404).json({ error: "Pemesanan tidak ditemukan" });

        const currentStatus = booking.status;

        const allowedTransitions = {
            "Menunggu": ["Dikonfirmasi", "Dibatalkan"],
            "Dikonfirmasi": ["Selesai", "Dibatalkan"],
            "Selesai": [],
            "Dibatalkan": []
        };

        if (!allowedTransitions[currentStatus].includes(newStatus)) {
            return res.status(400).json({ error: `Tidak bisa merubah status dari '${currentStatus}' ke '${newStatus}'` });
        }

        const updated = await prisma.booking.update({
            where: { id: parseInt(id) },
            data: { status: newStatus }
        });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: "Gagal merubah status" });
    }
};