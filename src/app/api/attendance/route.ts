// app/api/attendance/route.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
    try {
        const attendance = await prisma.attendance.findMany({
            include: {
                user: {
                    select: {
                        name: true,
                    },
                },
            },
        });

        return new Response(JSON.stringify(attendance), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Attendance fetch error:", error);
        return new Response(
            JSON.stringify({ message: "Internal Server Error" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
