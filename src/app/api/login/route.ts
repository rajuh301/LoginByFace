import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

function euclideanDistance(a: number[], b: number[]): number {
  return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0));
}

export async function POST(request: Request) {
  const body = await request.json();
  const { embedding } = body;

  if (!embedding || !Array.isArray(embedding)) {
    return NextResponse.json({ error: 'Invalid embedding' }, { status: 400 });
  }

  const users = await prisma.faceUser.findMany();

  const match = users.find(user => {
    const userEmbedding = user.embedding as number[] | null;
    if (!userEmbedding || !Array.isArray(userEmbedding)) return false;

    const distance = euclideanDistance(userEmbedding, embedding);
    return distance < 0.6; // Threshold
  });

  if (!match) {
    return NextResponse.json({ error: 'Face not recognized' }, { status: 401 });
  }

  // ✅ Save attendance
  await prisma.attendance.create({
    data: {
      userId: match.id,
    },
  });

  return NextResponse.json({
    message: 'Login and attendance recorded',
    user: {
      id: match.id,
      name: match.name,
      email: match.email,
    },
  }, { status: 200 });
}
