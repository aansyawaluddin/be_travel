const prisma = require('../utils/prisma');

exports.getAllBookings = async (req, res) => {
    try {
        const { status, packageId, startDate, endDate } = req.query;

        let filterOptions = {};
        if (status) filterOptions.status = status;
        if (packageId) filterOptions.packageId = packageId;
        if (startDate && endDate) {
            filterOptions.tanggalBerangkat = {
                gte: new Date(startDate),
                lte: new Date(endDate)
            };
        }

        const bookings = await prisma.booking.findMany({
            where: filterOptions,
            include: {
                package: true,
                staff: { select: { nama: true, username: true } } 
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(bookings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Terjadi kesalahan saat mengambil data pemesanan" });
    }
};

exports.createBooking = async (req, res) => {
    const { namaPemesan, kontak, packageId, tanggalBerangkat, jumlahPeserta, catatan } = req.body;
    const staffId = req.staff.id; 

    if (!kontak) return res.status(400).json({ error: "Kontak wajib diisi" });
    if (!packageId) return res.status(400).json({ error: "Paket wisata wajib dipilih" });

    const parsedPeserta = parseInt(jumlahPeserta);
    if (isNaN(parsedPeserta) || parsedPeserta < 1) {
        return res.status(400).json({ error: "Jumlah peserta minimal 1" });
    }

    const parsedDate = new Date(tanggalBerangkat);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (parsedDate < today) {
        return res.status(400).json({ error: "Tanggal keberangkatan tidak boleh di masa lalu" });
    }

    try {
        const travelPackage = await prisma.package.findUnique({ where: { id: packageId } });
        if (!travelPackage) return res.status(404).json({ error: "Paket wisata tidak ditemukan" });

        const currentBooked = await prisma.booking.aggregate({
            where: {
                packageId,
                status: { in: ["Menunggu", "Dikonfirmasi", "Selesai"] }
            },
            _sum: { jumlahPeserta: true }
        });
        const totalPesertaSekarang = currentBooked._sum.jumlahPeserta || 0;

        if (totalPesertaSekarang + parsedPeserta > travelPackage.kapasitas) {
            return res.status(400).json({
                error: `Kuota penuh! Sisa kapasitas untuk paket ini adalah ${travelPackage.kapasitas - totalPesertaSekarang} peserta.`
            });
        }

        const newBooking = await prisma.booking.create({
            data: {
                namaPemesan,
                kontak,
                packageId,
                tanggalBerangkat: parsedDate,
                jumlahPeserta: parsedPeserta,
                hargaPerOrang: travelPackage.harga,
                staffId,
                catatan
            }
        });

        res.status(201).json(newBooking);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Gagal membuat pemesanan baru" });
    }
};


exports.updateBooking = async (req, res) => {
    const { id } = req.params;
    const { namaPemesan, kontak, tanggalBerangkat, jumlahPeserta, catatan } = req.body;

    try {
        const existingBooking = await prisma.booking.findUnique({ where: { id: parseInt(id) } });
        if (!existingBooking) return res.status(404).json({ error: "Pemesanan tidak ditemukan" });

        if (existingBooking.status === "Selesai" || existingBooking.status === "Dibatalkan") {
            return res.status(400).json({ error: "Pemesanan yang sudah Selesai atau Dibatalkan tidak dapat diubah harganya/datanya." });
        }

        const updatedBooking = await prisma.booking.update({
            where: { id: parseInt(id) },
            data: {
                namaPemesan,
                kontak,
                tanggalBerangkat: tanggalBerangkat ? new Date(tanggalBerangkat) : undefined,
                jumlahPeserta: jumlahPeserta ? parseInt(jumlahPeserta) : undefined,
                catatan
            }
        });

        res.json(updatedBooking);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Gagal mengedit data pemesanan" });
    }
};


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
            return res.status(400).json({
                error: `Transisi status tidak valid! Pemesanan berstatus '${currentStatus}' tidak bisa diubah menjadi '${newStatus}'.`
            });
        }

        const updatedStatusBooking = await prisma.booking.update({
            where: { id: parseInt(id) },
            data: { status: newStatus }
        });

        res.json(updatedStatusBooking);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Gagal memperbarui status pemesanan" });
    }
};

exports.deleteBooking = async (req, res) => {
    const { id } = req.params;

    try {
        const existingBooking = await prisma.booking.findUnique({ where: { id: parseInt(id) } });
        if (!existingBooking) return res.status(404).json({ error: "Pemesanan tidak ditemukan" });

        await prisma.booking.delete({
            where: { id: parseInt(id) }
        });

        res.json({ message: "Pemesanan berhasil dihapus dari sistem secara permanen" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Gagal menghapus data pemesanan" });
    }
};