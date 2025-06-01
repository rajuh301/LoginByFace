import { PrismaClient } from "@prisma/client/extension";

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
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('[GET /api/attendance]', error);
        return new Response(JSON.stringify({ message: 'Internal Server Error' }), {
            status: 500,
        });
    }
}
