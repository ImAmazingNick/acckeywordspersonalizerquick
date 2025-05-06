import Papa from 'papaparse';
import { v4 as uuidv4 } from 'uuid';
import { Account, Cluster, StrengthBadge, FetchParams } from '@/types';

interface CSVRow {
  name: string;
  email: string;
  companyX: string;
  competitors: string;
  term?: string;
  companyXStrength?: string;
  competitorStrengths?: string;
  volume?: string;
  cpc?: string;
  url?: string;
  [key: string]: string | undefined;
}

export async function parseCSV(file: File): Promise<{ accounts: Account[], columns: string[] }> {
  return new Promise((resolve, reject) => {
    Papa.parse<CSVRow>(file, {
      header: true,
      complete: (results) => {
        // Extract all column names from the first row
        const columns = results.meta.fields || [];
        const accounts = processCSVData(results.data);
        resolve({ accounts, columns });
      },
      error: (error) => {
        reject(error);
      }
    });
  });
}

function processCSVData(data: CSVRow[]): Account[] {
  const accountMap = new Map<string, Account>();
  
  data.forEach(row => {
    if (!row.name || !row.email) return;
    
    const accountKey = `${row.name}-${row.email}`;
    let account = accountMap.get(accountKey);
    
    if (!account) {
      account = {
        id: uuidv4(),
        name: row.name,
        email: row.email,
        companyX: row.companyX || "",
        competitors: row.competitors ? row.competitors.split(',').map(c => c.trim()) : [],
        clusters: [],
        fetchParams: {
          queryType: "predefined",
          predefinedQuery: "top5"
        }
      };
      accountMap.set(accountKey, account);
    }
    
    if (row.term) {
      const competitorStrengths: Record<string, StrengthBadge> = {};
      
      if (row.competitorStrengths) {
        const strengths = row.competitorStrengths.split(',').map(s => s.trim().toLowerCase());
        account.competitors.forEach((competitor, index) => {
          competitorStrengths[competitor] = parseStrengthBadge(strengths[index]);
        });
      }
      
      const cluster: Cluster = {
        id: uuidv4(),
        term: row.term,
        companyXStrength: parseStrengthBadge(row.companyXStrength),
        competitorStrengths,
        volume: row.volume ? parseInt(row.volume, 10) : undefined,
        cpc: row.cpc ? parseFloat(row.cpc) : undefined,
        sourceUrl: row.url
      };
      
      account.clusters.push(cluster);
      
      // If this cluster has a URL, update the account's fetchParams
      if (row.url) {
        account.fetchParams = {
          queryType: "predefined",
          predefinedQuery: "top5",
          url: row.url
        };
      }
    }
  });
  
  return Array.from(accountMap.values());
}

function parseStrengthBadge(value?: string): StrengthBadge {
  if (!value) return null;
  
  const normalized = value.toLowerCase().trim();
  
  if (normalized === 'strong') return 'strong';
  if (normalized === 'medium') return 'medium';
  if (normalized === 'weak') return 'weak';
  
  return null;
} 