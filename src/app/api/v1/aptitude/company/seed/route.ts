import { NextResponse } from "next/server";
import { LearningQueryService } from "@/lib/learning/services/LearningQueryService";

const supabase = LearningQueryService.getRawClient();

const companies = [
  { id: "tcs", name: "TCS", logo_url: "/logos/tcs.png" },
  { id: "infosys", name: "Infosys", logo_url: "/logos/infosys.png" },
  { id: "wipro", name: "Wipro", logo_url: "/logos/wipro.png" },
  { id: "cognizant", name: "Cognizant", logo_url: "/logos/cognizant.png" },
  { id: "accenture", name: "Accenture", logo_url: "/logos/accenture.png" },
  { id: "capgemini", name: "Capgemini", logo_url: "/logos/capgemini.png" },
  { id: "ibm", name: "IBM", logo_url: "/logos/ibm.png" },
  { id: "hcl", name: "HCL", logo_url: "/logos/hcl.png" },
  { id: "tech-mahindra", name: "Tech Mahindra", logo_url: "/logos/tech-mahindra.png" },
  { id: "amazon", name: "Amazon", logo_url: "/logos/amazon.png" },
  { id: "microsoft", name: "Microsoft", logo_url: "/logos/microsoft.png" },
  { id: "google", name: "Google", logo_url: "/logos/google.png" },
  { id: "deloitte", name: "Deloitte", logo_url: "/logos/deloitte.png" },
  { id: "pwc", name: "PwC", logo_url: "/logos/pwc.png" },
  { id: "ey", name: "EY", logo_url: "/logos/ey.png" },
  { id: "kpmg", name: "KPMG", logo_url: "/logos/kpmg.png" },
  { id: "cisco", name: "Cisco", logo_url: "/logos/cisco.png" },
  { id: "oracle", name: "Oracle", logo_url: "/logos/oracle.png" },
  { id: "goldman-sachs", name: "Goldman Sachs", logo_url: "/logos/goldman-sachs.png" }
];

export async function GET() {
  try {
    const { data, error } = await supabase.from('apt_companies').upsert(companies, { onConflict: 'id' });
    
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, message: "Seeded 19 companies successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
