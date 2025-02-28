import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import QRCode from 'qrcode';
import { getFavicon } from '@/lib/favicon';
import { generateShortId } from '@/lib/shortId';
import type { PrismaClient } from '@prisma/client';

type Visit = {
  ip: string;
  createdAt: Date;
};

type LinkWithVisits = Awaited<ReturnType<PrismaClient['link']['findMany']>>[number] & {
  visits: Visit[];
};

const linkSchema = z.object({
  url: z.string().url(),
  title: z.string().optional(),
  description: z.string().optional(),
  folderId: z.string().optional().nullable()
});

// Récupérer tous les liens de l'utilisateur
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const links = await prisma.link.findMany({
      where: { userId: (session.user as any).id },
      orderBy: { createdAt: 'desc' },
      include: {
        visits: {
          select: {
            ip: true,
            createdAt: true
          }
        }
      }
    });

    // Calculer les statistiques pour chaque lien
    const linksWithStats = await Promise.all(links.map(async (link: LinkWithVisits) => {
      // Calculer le nombre de visites uniques (par IP)
      const uniqueIPs = new Set(link.visits.map((visit: Visit) => visit.ip));
      const uniqueVisitsCount = uniqueIPs.size;

      // Calculer les visites des 7 derniers jours
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

      const recentVisits = link.visits.filter((visit: Visit) => 
        new Date(visit.createdAt) >= sevenDaysAgo
      );
      const previousVisits = link.visits.filter((visit: Visit) =>
        new Date(visit.createdAt) >= fourteenDaysAgo &&
        new Date(visit.createdAt) < sevenDaysAgo
      );

      // Calculer les IPs uniques pour chaque période
      const recentUniqueIPs = new Set(recentVisits.map((visit: Visit) => visit.ip));
      const previousUniqueIPs = new Set(previousVisits.map((visit: Visit) => visit.ip));

      // Calculer le pourcentage d'évolution
      const currentWeekVisits = recentUniqueIPs.size;
      const previousWeekVisits = previousUniqueIPs.size;
      const visitsTrendPercentage = previousWeekVisits === 0
        ? (currentWeekVisits > 0 ? 100 : 0)
        : Math.round(((currentWeekVisits - previousWeekVisits) / previousWeekVisits) * 100);

      // Retourner le lien avec les statistiques, sans les visites individuelles
      const { visits, ...linkWithoutVisits } = link;
      const shortUrl = new URL(`/s/${link.shortId}`, request.nextUrl.origin).toString();
      return {
        ...linkWithoutVisits,
        shortUrl,
        uniqueVisitsCount,
        visitsTrendPercentage
      };
    }));

    return NextResponse.json(linksWithStats);
  } catch (error) {
    console.error('Error fetching links:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// Créer un nouveau lien
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = linkSchema.parse(body);

    // Récupérer la favicon et le QR code
    const [favicon, qrCode] = await Promise.all([
      getFavicon(data.url),
      QRCode.toDataURL(data.url)
    ]);

    // Générer un shortId unique
    let shortId = generateShortId();
    let existingLink = await prisma.link.findUnique({
      where: { shortId }
    });

    // Si le shortId existe déjà, en générer un nouveau jusqu'à en trouver un unique
    while (existingLink) {
      shortId = generateShortId();
      existingLink = await prisma.link.findUnique({
        where: { shortId }
      });
    }
    
    const link = await prisma.link.create({
      data: {
        ...data,
        shortId,
        favicon,
        qrCode,
        userId: (session.user as any).id
      }
    });

    return NextResponse.json(link);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }
    console.error('Error creating link:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
} 