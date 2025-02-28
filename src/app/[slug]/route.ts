import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const link = await prisma.link.findUnique({
      where: {
        slug: params.slug,
      },
    });

    if (!link) {
      return new NextResponse('Link not found', { status: 404 });
    }

    // Increment click count
    await prisma.link.update({
      where: {
        id: link.id,
      },
      data: {
        clicks: {
          increment: 1,
        },
      },
    });

    return NextResponse.redirect(link.url);
  } catch (error) {
    return new NextResponse('Internal server error', { status: 500 });
  }
} 