import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

const folderSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  description: z.string().optional(),
  parentId: z.string().optional()
});

// Récupérer toutes les catégories
export async function GET() {
  try {
    // Récupérer uniquement les dossiers racine (sans parent)
    const folders = await prisma.folder.findMany({
      where: { parentId: null },
      include: {
        children: {
          include: {
            children: {
              include: {
                _count: { select: { links: true } },
                children: true
              }
            },
            _count: { select: { links: true } }
          }
        },
        _count: { select: { links: true } }
      }
    });
    return NextResponse.json(folders);
  } catch (error) {
    console.error('Error fetching folders:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// Créer une nouvelle catégorie
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = folderSchema.parse(body);
    
    // Vérifier si la catégorie existe déjà
    const existingFolder = await prisma.folder.findUnique({
      where: { name: data.name }
    });

    if (existingFolder) {
      return NextResponse.json({ error: 'Cette catégorie existe déjà' }, { status: 400 });
    }

    const folder = await prisma.folder.create({
      data: data,
      include: {
        children: true,
        _count: { select: { links: true } }
      }
    });

    return NextResponse.json(folder);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }
    console.error('Error creating folder:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// Supprimer une catégorie
export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const folderId = url.pathname.split('/').pop();

    if (!folderId) {
      return NextResponse.json({ error: 'ID de la catégorie manquant' }, { status: 400 });
    }

    await prisma.folder.delete({
      where: { id: folderId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting folder:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
} 