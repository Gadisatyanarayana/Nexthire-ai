import { NextRequest, NextResponse } from "next/server";
import { OrganizationAggregate } from "@/platform/admin/domain/OrganizationAggregate";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, tenantId, name, nodeType, parentId } = body;

    // In a real application, we would fetch the parentNode from a database
    // using the parentId to compute the new depth and path.
    // For scaffolding, we pass null and simulate a root node.
    const aggregate = OrganizationAggregate.createNode(
      id,
      tenantId,
      name,
      nodeType,
      null
    );

    return NextResponse.json({
      success: true,
      data: aggregate.node
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
