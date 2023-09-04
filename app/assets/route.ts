import { NextResponse } from "next/server";

export async function GET() {
  const data = { res: "sucess" };
  return NextResponse.json(data);
}
