import { Account, Cluster, StrengthBadge, FetchParams } from "@/types";
import { v4 as uuidv4 } from "uuid";

// Mock API for volume and CPC data (will use until we have real data source)
const mockVolumeData: Record<string, number> = {
  "seo tools": 18500,
  "keyword research": 27100,
  "backlink checker": 9300,
  "rank tracker": 6200,
  "content marketing": 22000,
  "local seo": 8700,
  "seo audit": 5100,
  "mobile seo": 2800,
  "seo agency": 35000,
  "technical seo": 6800,
};

const mockCpcData: Record<string, number> = {
  "seo tools": 4.25,
  "keyword research": 3.78,
  "backlink checker": 2.15,
  "rank tracker": 2.65,
  "content marketing": 5.12,
  "local seo": 6.35,
  "seo audit": 7.25,
  "mobile seo": 3.20,
  "seo agency": 8.75,
  "technical seo": 5.45,
};

// Mock URL-specific keywords
const urlKeywords: Record<string, string[]> = {
  "google.com": ["search engine", "google search", "google ads", "google maps", "gmail"],
  "amazon.com": ["online shopping", "amazon prime", "best sellers", "amazon basics", "prime day"],
  "nytimes.com": ["breaking news", "daily news", "world news", "opinion articles", "news subscription"],
  "wordpress.org": ["cms", "website builder", "wordpress themes", "wordpress plugins", "blogging platform"],
  // Add more generic domains
  "example.com": ["example website", "demo site", "sample content", "test domain", "documentation"],
  "github.com": ["git repository", "version control", "code hosting", "open source", "software development"],
  "stackoverflow.com": ["programming questions", "coding answers", "developer community", "tech support", "code snippets"],
  "linkedin.com": ["professional network", "job search", "career development", "business connections", "professional profile"],
  "twitter.com": ["social media", "microblogging", "tweets", "trending topics", "social network"],
  "facebook.com": ["social network", "social media", "friend connections", "online community", "photo sharing"],
};

// Helper function to randomly assign strength badges
const getRandomStrength = (): StrengthBadge => {
  const strengths: StrengthBadge[] = ["strong", "medium", "weak"];
  return strengths[Math.floor(Math.random() * strengths.length)];
};

// Function to generate volume and CPC data
function getVolumeAndCpc(term: string): { volume: number; cpc: number } {
  const termLower = term.toLowerCase();
  const volume = mockVolumeData[termLower] || Math.floor(Math.random() * 50000) + 1000;
  const cpc = mockCpcData[termLower] || parseFloat((Math.random() * 10 + 1).toFixed(2));
  
  return { volume, cpc };
}

// Extract domain from URL
function extractDomain(url: string): string {
  try {
    const domain = new URL(url).hostname;
    return domain;
  } catch (error) {
    return "";
  }
}

// Get keywords based on URL
function getKeywordsForUrl(url: string): string[] {
  console.log(`Getting keywords for URL: ${url}`);
  const domain = extractDomain(url);
  console.log(`Extracted domain: ${domain}`);
  
  // Check for partial domain match
  for (const [urlPattern, keywords] of Object.entries(urlKeywords)) {
    if (domain.includes(urlPattern)) {
      console.log(`Found match for domain pattern: ${urlPattern}`);
      return keywords;
    }
  }
  
  // If no match, generate some generic keywords based on the domain
  console.log(`No match found for domain: ${domain}, using generic keywords`);
  const domainParts = domain.split('.');
  const domainName = domainParts.length > 1 ? domainParts[domainParts.length - 2] : domain;
  
  return [
    `${domainName} website`,
    `${domainName} services`,
    `${domainName} features`,
    `${domainName} solutions`,
    `${domainName} platform`
  ];
}

// Get default keywords if extraction fails
function getDefaultKeywords(): string[] {
  return [
    "seo tools",
    "keyword research",
    "backlink checker",
    "rank tracker",
    "content marketing"
  ];
}

// Function to get clusters based on fetch parameters
async function getClustersBasedOnParams(account: Account, fetchParams: FetchParams): Promise<Cluster[]> {
  let keywords: string[] = [];
  let sourceUrl: string | undefined;
  
  console.log("Getting clusters based on fetch params:", fetchParams);
  
  // Determine which URL to use
  if (fetchParams.url) {
    sourceUrl = fetchParams.url;
    console.log(`Using directly provided URL: ${sourceUrl}`);
  } else if (fetchParams.urlColumnName && account.clusters.length > 0) {
    // Get URL from the first cluster that has a sourceUrl
    const clusterWithUrl = account.clusters.find(c => c.sourceUrl);
    if (clusterWithUrl?.sourceUrl) {
      sourceUrl = clusterWithUrl.sourceUrl;
      console.log(`Using URL from cluster: ${sourceUrl}`);
    }
  }
  
  // Get keywords from the URL using our mock data
  if (sourceUrl) {
    console.log(`Getting keywords for URL: ${sourceUrl}`);
    keywords = getKeywordsForUrl(sourceUrl);
    
    // Simulate an API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
  } else {
    console.log("No URL found, using default keywords");
    keywords = getDefaultKeywords();
  }
  
  console.log(`Extracted keywords: ${keywords.join(', ')}`);
  
  // Apply query type filter
  if (fetchParams.queryType === "predefined") {
    switch (fetchParams.predefinedQuery) {
      case "top5":
        console.log("Filtering to top 5 keywords");
        keywords = keywords.slice(0, 5);
        break;
      case "competitors":
        console.log("Adding competitor keywords");
        // Add competitor-focused keywords
        keywords = keywords.slice(0, 3).concat(
          account.competitors.map(comp => `${comp} alternatives`)
        );
        break;
      // "all" case keeps all keywords
      default:
        console.log("Using all keywords");
        break;
    }
  } else if (fetchParams.queryType === "custom" && fetchParams.customQuery) {
    console.log(`Using custom query: ${fetchParams.customQuery}`);
    // For custom queries, we'd use AI in a real implementation
    // Here we just add the custom query as a keyword
    const customQueryWords = fetchParams.customQuery.split(" ").slice(0, 3).join(" ");
    keywords = [customQueryWords, ...keywords.slice(0, 4)];
  }
  
  console.log(`Final keywords for clusters: ${keywords.join(', ')}`);
  
  // Generate clusters from keywords
  return keywords.map(term => {
    const { volume, cpc } = getVolumeAndCpc(term);
    
    const competitorStrengths: Record<string, StrengthBadge> = {};
    account.competitors.forEach(competitor => {
      competitorStrengths[competitor] = getRandomStrength();
    });
    
    return {
      id: uuidv4(),
      term,
      companyXStrength: getRandomStrength(),
      competitorStrengths,
      volume,
      cpc,
      sourceUrl
    };
  });
}

// Main function to fetch cluster data
export async function fetchClusterData(account: Account): Promise<Cluster[]> {
  console.log(`Fetching cluster data for account: ${account.name}`);
  
  // Ensure we have fetch parameters
  const fetchParams = account.fetchParams || {
    queryType: "predefined",
    predefinedQuery: "top5"
  };
  
  console.log("Using fetch parameters:", fetchParams);
  
  // If no clusters exist or forced refresh, create new ones based on params
  if (account.clusters.length === 0) {
    console.log("No existing clusters, creating new ones");
    return getClustersBasedOnParams(account, fetchParams);
  }
  
  // Otherwise, fill in missing data for existing clusters
  console.log("Updating existing clusters");
  return Promise.all(
    account.clusters.map(async cluster => {
      const updatedCluster = { ...cluster };
      
      // Fill in missing strength data
      if (!updatedCluster.companyXStrength) {
        updatedCluster.companyXStrength = getRandomStrength();
      }
      
      // Fill in missing competitor strengths
      for (const competitor of account.competitors) {
        if (!updatedCluster.competitorStrengths[competitor]) {
          updatedCluster.competitorStrengths[competitor] = getRandomStrength();
        }
      }
      
      // Fill in missing volume and CPC
      if (!updatedCluster.volume || !updatedCluster.cpc) {
        const { volume, cpc } = getVolumeAndCpc(updatedCluster.term);
        
        if (!updatedCluster.volume) updatedCluster.volume = volume;
        if (!updatedCluster.cpc) updatedCluster.cpc = cpc;
      }
      
      // Set source URL if missing
      if (!updatedCluster.sourceUrl) {
        if (fetchParams.url) {
          updatedCluster.sourceUrl = fetchParams.url;
        } else if (fetchParams.urlColumnName && account.clusters.length > 0) {
          // Get URL from another cluster that has it
          const clusterWithUrl = account.clusters.find(c => c.sourceUrl);
          if (clusterWithUrl?.sourceUrl) {
            updatedCluster.sourceUrl = clusterWithUrl.sourceUrl;
          }
        }
      }
      
      return updatedCluster;
    })
  );
} 