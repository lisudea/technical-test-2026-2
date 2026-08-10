import { PrismaClient, CategoriaEquipo, EstadoEquipo, Rol } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const equipos = [
  { nombre: 'Raspberry Pi 4 Model B', serial: 'B8:27:EB:A4:59:D1', categoria: CategoriaEquipo.MICROCONTROLADORES },
  { nombre: 'Arduino Mega 2560', serial: 'ARD-MEGA-0231', categoria: CategoriaEquipo.MICROCONTROLADORES },
  { nombre: 'ESP32 DevKit V1', serial: 'ESP32-8842-A1', categoria: CategoriaEquipo.MICROCONTROLADORES },
  { nombre: 'Meta Quest 3', serial: 'MQ3-2024-1187', categoria: CategoriaEquipo.VR },
  { nombre: 'HTC Vive Pro 2', serial: 'HTC-VP2-0342', categoria: CategoriaEquipo.VR, estado: EstadoEquipo.MANTENIMIENTO },
  { nombre: 'Switch Cisco Catalyst 2960', serial: 'FCW1932D0LB', categoria: CategoriaEquipo.REDES },
  { nombre: 'Router MikroTik hEX S', serial: 'MKT-HEXS-7741', categoria: CategoriaEquipo.REDES },
  { nombre: 'Access Point Ubiquiti U6', serial: '74:AC:B9:1E:22:F0', categoria: CategoriaEquipo.REDES },
  { nombre: 'Portátil Lenovo ThinkPad T14', serial: 'PF3K8YQZ', categoria: CategoriaEquipo.COMPUTO },
  { nombre: 'Workstation Dell Precision 3660', serial: 'DP36-9982-CO', categoria: CategoriaEquipo.COMPUTO },
  { nombre: 'Impresora 3D Ender 3 V2', serial: 'END3-V2-4410', categoria: CategoriaEquipo.IMPRESION_3D },
  { nombre: 'Impresora 3D Prusa MK4', serial: 'PRUSA-MK4-0087', categoria: CategoriaEquipo.IMPRESION_3D },
];

async function main() {
  await prisma.usuario.upsert({
    where: { correo: 'admin.lis@udea.edu.co' },
    update: { rol: Rol.ADMIN },
    create: {
      nombre: 'Administrador LIS',
      correo: 'admin.lis@udea.edu.co',
      hashContrasena: await bcrypt.hash(process.env.ADMIN_PASSWORD ?? 'lisadmin2026', 10),
      rol: Rol.ADMIN,
    },
  });

  await prisma.equipo.createMany({ data: equipos, skipDuplicates: true });

  const pi = await prisma.equipo.findUnique({ where: { serial: 'B8:27:EB:A4:59:D1' } });
  const quest = await prisma.equipo.findUnique({ where: { serial: 'MQ3-2024-1187' } });
  const cisco = await prisma.equipo.findUnique({ where: { serial: 'FCW1932D0LB' } });

  if (pi && quest && cisco) {
    const existentes = await prisma.reserva.count();
    if (existentes === 0) {
      const hoy = new Date();
      const enDias = (d: number, h: number) => {
        const f = new Date(hoy);
        f.setDate(f.getDate() + d);
        f.setHours(h, 0, 0, 0);
        return f;
      };

      await prisma.reserva.createMany({
        data: [
          { equipoId: pi.id, nombreUsuario: 'Laura Gómez', correoUsuario: 'laura.gomez@udea.edu.co', inicio: enDias(-3, 8), fin: enDias(-3, 12) },
          { equipoId: pi.id, nombreUsuario: 'Andrés Ruiz', correoUsuario: 'andres.ruiz@udea.edu.co', inicio: enDias(-1, 14), fin: enDias(-1, 18) },
          { equipoId: pi.id, nombreUsuario: 'Laura Gómez', correoUsuario: 'laura.gomez@udea.edu.co', inicio: enDias(1, 8), fin: enDias(1, 10) },
          { equipoId: quest.id, nombreUsuario: 'Camila Torres', correoUsuario: 'camila.torres@udea.edu.co', inicio: enDias(-2, 10), fin: enDias(-2, 12) },
          { equipoId: quest.id, nombreUsuario: 'Andrés Ruiz', correoUsuario: 'andres.ruiz@udea.edu.co', inicio: enDias(2, 14), fin: enDias(2, 16) },
          { equipoId: cisco.id, nombreUsuario: 'Julián Mesa', correoUsuario: 'julian.mesa@udea.edu.co', inicio: enDias(-5, 8), fin: enDias(-5, 17) },
        ],
      });
    }
  }

  console.log('Seed completado');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
