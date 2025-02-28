import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

const folderSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  parentId: z.string().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user?.email! },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const folder = await prisma.folder.findUnique({
      where: { id: params.id },
    });

    if (!folder || folder.userId !== user.id) {
      return NextResponse.json(
        { error: 'Folder not found or access denied' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = folderSchema.parse(body);

    if (validatedData.parentId) {
      if (validatedData.parentId === params.id) {
        return NextResponse.json(
          { error: 'Folder cannot be its own parent' },
          { status: 400 }
        );
      }

      const parentFolder = await prisma.folder.findUnique({
        where: { id: validatedData.parentId },
      });

      if (!parentFolder || parentFolder.userId !== user.id) {
        return NextResponse.json(
          { error: 'Parent folder not found or access denied' },
          { status: 404 }
        );
      }
    }

    const updatedFolder = await prisma.folder.update({
      where: { id: params.id },
      data: {
        name: validatedData.name,
        description: validatedData.description,
        parentId: validatedData.parentId,
      },
    });

    return NextResponse.json(updatedFolder);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating folder:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user?.email! },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const folder = await prisma.folder.findUnique({
      where: { id: params.id },
      include: {
        children: true,
        links: true,
      },
    });

    if (!folder || folder.userId !== user.id) {
      return NextResponse.json(
        { error: 'Folder not found or access denied' },
        { status: 404 }
      );
    }

    // Delete all child folders and their contents recursively
    async function deleteFolder(folderId: string) {
      const childFolder = await prisma.folder.findUnique({
        where: { id: folderId },
        include: {
          children: true,
          links: true,
        },
      });

      if (childFolder) {
        // Delete all child folders recursively
        for (const child of childFolder.children) {
          await deleteFolder(child.id);
        }

        // Delete all links in the folder
        if (childFolder.links.length > 0) {
          await prisma.link.deleteMany({
            where: { folderId: childFolder.id },
          });
        }

        // Delete the folder itself
        await prisma.folder.delete({
          where: { id: childFolder.id },
        });
      }
    }

    await deleteFolder(params.id);

    return NextResponse.json({ message: 'Folder deleted successfully' });
  } catch (error) {
    console.error('Error deleting folder:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 