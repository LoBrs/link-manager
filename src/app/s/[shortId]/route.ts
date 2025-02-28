import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { shortId: string } }
) {
  try {
    const headersList = headers();
    const ip = request.ip ?? headersList.get('x-forwarded-for') ?? 'unknown';
    const userAgent = headersList.get('user-agent') ?? 'unknown';
    const referer = headersList.get('referer');
    const language = headersList.get('accept-language');
    const url = request.url;

    // Récupérer le lien à partir du shortId
    const link = await prisma.link.findUnique({
      where: { shortId: params.shortId }
    });

    if (!link) {
      return new NextResponse('Lien non trouvé', { status: 404 });
    }

    // Enregistrer la visite
    await prisma.visit.create({
      data: {
        linkId: link.id,
        ip,
        userAgent,
        url,
        referrer: referer ?? null,
        language: language ?? null,
      }
    });

    // Rediriger vers l'URL originale
    return NextResponse.redirect(link.url);
  } catch (error) {
    console.error('Error handling short link:', error);
    return new NextResponse('Erreur serveur', { status: 500 });
  }
} 