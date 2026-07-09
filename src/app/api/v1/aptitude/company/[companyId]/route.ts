import { NextRequest, NextResponse } from "next/server";
import { CompanyEngine } from "@/lib/aptitude/CompanyEngine";

export async function GET(request: NextRequest, { params }: { params: Promise<{ companyId: string }> }) {
  try {
    const { companyId } = await params;
    const company = CompanyEngine.getCompany(companyId);
    
    if (!company) {
      return NextResponse.json({ success: false, error: "Company not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: company });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
