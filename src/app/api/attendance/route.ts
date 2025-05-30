import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET: Fetch all attendance records with user name
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
        console.error(error);
        return new Response(
            JSON.stringify({ message: "Internal Server Error" }),
            { status: 500 }
        );
    }
}
