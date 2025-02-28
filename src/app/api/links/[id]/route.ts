import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getFavicon } from '@/lib/favicon';

const linkSchema = z.object({
  url: z.string().url(),
  title: z.string().optional(),
  description: z.string().optional(),
  folderId: z.string().optional().nullable()
});

// Mettre à jour un lien
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = linkSchema.parse(body);

    // Vérifier que l'utilisateur est propriétaire du lien
    const link = await prisma.link.findFirst({
      where: {
        id: params.id,
        user: { email: session.user.email }
      }
    });

    if (!link) {
      return NextResponse.json({ error: 'Lien non trouvé' }, { status: 404 });
    }

    // Récupérer la nouvelle favicon si l'URL a changé
    let favicon = link.favicon;
    if (data.url !== link.url) {
      favicon = await getFavicon(data.url);
    }

    // Mettre à jour le lien
    const updatedLink = await prisma.link.update({
      where: { id: params.id },
      data: { ...data, favicon }
    });

    return NextResponse.json(updatedLink);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }
    console.error('Error updating link:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// Supprimer un lien
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  try {
    // Vérifier que l'utilisateur est propriétaire du lien
    const link = await prisma.link.findFirst({
      where: {
        id: params.id,
        user: { email: session.user.email }
      }
    });

    if (!link) {
      return NextResponse.json({ error: 'Lien non trouvé' }, { status: 404 });
    }

    await prisma.link.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting link:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// Incrémenter le compteur de clics
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const link = await prisma.link.update({
      where: { id: params.id },
      data: { clickCount: { increment: 1 } }
    });

    return NextResponse.json(link);
  } catch (error) {
    console.error('Error incrementing click count:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// Déplacer un lien vers une autre catégorie
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { folderId } = z.object({ folderId: z.string().nullable() }).parse(body);

    // Vérifier que l'utilisateur est propriétaire du lien
    const link = await prisma.link.findFirst({
      where: {
        id: params.id,
        user: { email: session.user.email }
      }
    });

    if (!link) {
      return NextResponse.json({ error: 'Lien non trouvé' }, { status: 404 });
    }

    // Si un folderId est fourni, vérifier que le dossier existe
    if (folderId) {
      const folder = await prisma.folder.findUnique({
        where: { id: folderId }
      });

      if (!folder) {
        return NextResponse.json({ error: 'Dossier non trouvé' }, { status: 404 });
      }
    }

    // Mettre à jour la catégorie du lien
    const updatedLink = await prisma.link.update({
      where: { id: params.id },
      data: { folderId }
    });

    return NextResponse.json(updatedLink);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }
    console.error('Error moving link:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
} 