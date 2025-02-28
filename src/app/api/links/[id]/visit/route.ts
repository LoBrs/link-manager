import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const ip = request.headers.get('x-forwarded-for') || request.ip || 'unknown';

    // Vérifier si une visite existe déjà pour cette IP dans les 10 dernières minutes
    const recentVisit = await prisma.visit.findFirst({
      where: {
        linkId: params.id,
        ip,
        createdAt: {
          gte: new Date(Date.now() - 10 * 60 * 1000) // 10 minutes
        }
      }
    });

    // Si pas de visite récente, créer une nouvelle visite
    if (!recentVisit) {
      await prisma.visit.create({
        data: {
          linkId: params.id,
          ip,
          userAgent: data.userAgent || 'unknown',
          url: data.url,
          referrer: data.referrer,
          language: data.language,
          screenResolution: data.screenResolution,
          windowSize: data.windowSize
        }
      });
    }

    // Calculer les statistiques
    const [uniqueVisits, visitsLastWeek, visitsWeekBefore] = await Promise.all([
      // Nombre total de visites uniques
      prisma.visit.groupBy({
        by: ['ip'],
        where: { linkId: params.id },
        _count: true
      }),
      // Visites des 7 derniers jours
      prisma.visit.groupBy({
        by: ['ip'],
        where: {
          linkId: params.id,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        },
        _count: true
      }),
      // Visites des 7 jours précédents
      prisma.visit.groupBy({
        by: ['ip'],
        where: {
          linkId: params.id,
          createdAt: {
            gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
            lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        },
        _count: true
      })
    ]);

    // Calculer le pourcentage d'évolution
    const currentWeekVisits = visitsLastWeek.length;
    const previousWeekVisits = visitsWeekBefore.length;
    const trend = previousWeekVisits === 0
      ? 100 // Si pas de visites la semaine précédente, considérer comme 100% d'augmentation
      : Math.round(((currentWeekVisits - previousWeekVisits) / previousWeekVisits) * 100);

    return NextResponse.json({
      uniqueVisitsCount: uniqueVisits.length,
      visitsTrendPercentage: trend
    });
  } catch (error) {
    console.error('Error recording visit:', error);
    return NextResponse.json(
      { error: 'Failed to record visit' },
      { status: 500 }
    );
  }
} 