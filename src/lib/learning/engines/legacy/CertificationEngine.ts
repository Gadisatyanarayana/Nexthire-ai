import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { FeatureFlags } from "./FeatureFlags";

export class CertificationEngine {
  public static async issueCertificate(userId: string, moduleId: string, moduleName: string): Promise<any> {
    if (!FeatureFlags.isCertificatesEnabled()) throw new Error("Certificates are disabled.");

    // Simple validation criteria
    // In production, we'd check mastery scores, mock test completion, etc.
    const certificateId = `CERT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const { data, error } = await supabaseAdmin
      .from('apt_certificates')
      .insert({
        user_id: userId,
        certificate_id: certificateId,
        module_id: moduleId,
        module_name: moduleName,
        verification_url: `https://nexthire.ai/verify/${certificateId}`
      })
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to issue certificate: ${error.message}`);
    }

    return data;
  }
}
