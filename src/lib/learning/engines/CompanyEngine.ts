import { COMPANIES, CompanyConfig } from "../companies/CompanyRegistry";

/**
 * Generic Company Engine
 * Provides company configurations across any plugin domain.
 */
export class CompanyEngine {
  public static getCompany(id: string): CompanyConfig | undefined {
    return COMPANIES.find(c => c.id === id);
  }

  public static getAllCompanies(): CompanyConfig[] {
    return COMPANIES;
  }
}
