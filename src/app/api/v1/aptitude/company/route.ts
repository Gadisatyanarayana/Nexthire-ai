import { NextResponse } from "next/server";
import { CompanyEngine } from "@/lib/aptitude/CompanyEngine";

export async function GET() {
  try {
    const companies = CompanyEngine.getAllCompanies();
    return NextResponse.json({ success: true, data: companies });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
