import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

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

async function seedCompanies() {
  console.log("Creating apt_companies table...");
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS apt_companies (
      id text PRIMARY KEY,
      name text NOT NULL,
      logo_url text,
      active boolean DEFAULT true,
      sections jsonb DEFAULT '[]'::jsonb,
      overview jsonb DEFAULT '{}'::jsonb,
      eligibility jsonb DEFAULT '{}'::jsonb,
      test_pattern jsonb DEFAULT '{}'::jsonb,
      syllabus jsonb DEFAULT '{}'::jsonb,
      faqs jsonb DEFAULT '[]'::jsonb,
      created_at timestamp DEFAULT now()
    );

    ALTER TABLE IF EXISTS apt_companies ENABLE ROW LEVEL SECURITY;
    
    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = 'apt_companies' AND policyname = 'apt_companies_read_access'
        ) THEN
            CREATE POLICY "apt_companies_read_access" ON apt_companies FOR SELECT USING (true);
        END IF;
    END
    $$;
  `;

  // Since we can't execute raw SQL directly from the client without an RPC, 
  // we assume the table is already created by the user in the Supabase Dashboard.
  
  console.log("Seeding companies...");
  const { data, error } = await supabase.from('apt_companies').upsert(companies, { onConflict: 'id' });
  
  if (error) {
    console.error("Error seeding companies:", error.message);
    process.exit(1);
  } else {
    console.log("Successfully seeded 19 companies!");
    process.exit(0);
  }
}

seedCompanies();
