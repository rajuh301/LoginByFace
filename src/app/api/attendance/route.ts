// src/app/api/attendance/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const attendance = await prisma.attendance.findMany({
      include: {
        user: { select: { name: true } },
      },
    });
    return NextResponse.json(attendance);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
