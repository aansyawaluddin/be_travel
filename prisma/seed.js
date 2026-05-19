const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const packages = [
        { id: "PKG-01", nama: "Bali Explorer 5D4N", harga: 4500000, kapasitas: 20 },
        { id: "PKG-02", nama: "Raja Ampat Trip Luxury", harga: 22500000, kapasitas: 10 },
        { id: "PKG-03", nama: "Labuan Bajo Phinisi", harga: 8166666, kapasitas: 15 },
        { id: "PKG-04", nama: "Bromo Sunrise Special", harga: 1500000, kapasitas: 30 }
    ];

    for (const pkg of packages) {
        await prisma.package.upsert({
            where: { id: pkg.id },
            update: {},
            create: pkg,
        });
    }
    console.log("Seeding Paket Wisata berhasil!");
}

main().catch(e => console.error(e)).finally(async () => await prisma.$disconnect());