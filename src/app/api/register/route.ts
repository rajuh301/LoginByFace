// app/api/face-register/route.ts
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const body = await req.json();
  const { name, email, embedding } = body;

  if (!name || !email || !embedding) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const exists = await prisma.faceUser.findUnique({ where: { email } });
  if (exists) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
  }

  const newUser = await prisma.faceUser.create({
    data: {
      name,
      email,
      embedding,
    },
  });

  return NextResponse.json({ message: 'Face registered successfully', user: newUser }, { status: 201 });
}
