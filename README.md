# 🚀 Keyword-Cluster Dashboard

A minimalist Next.js (App Router) + TypeScript + Tailwind + shadcn/ui application for managing and analyzing keyword clusters.

## Features

1. **CSV Import**  
   - Upload or drag-drop CSV (columns: name, email, Company X, Competitors, optional pre-filled clusters with volume/CPC/strength).  
   - Parse via Papaparse into `Account[]`.

2. **Preview & CRUD**  
   - Show raw account table immediately.  
   - Add/Edit/Delete Accounts and Clusters via modals.

3. **Fetch Metrics**  
   - Per-row "Fetch" and global "Fetch All" buttons.  
   - Use mock data (or real API in a production environment) for strength badges and volume/CPC.  
   - Optionally re-fetch only missing values.

4. **Results Table**  
   - Renders each account's clusters in a premium `<ResultsTable>`.  
   - Responsive, striped rows, header styling, pill badges.

5. **Export PNG**  
   - "Export PNG" for single account or "Export All" for bulk.  
   - HTML canvas screenshot of the table view.

## Getting Started

### Prerequisites

- Node.js 16.8.0 or later
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/keyword-cluster-dashboard.git
cd keyword-cluster-dashboard
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Create a `.env.local` file (optional for Anthropic API usage)
```
ANTHROPIC_API_KEY=your_api_key_here
```

4. Run the development server
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## CSV Format

The application accepts CSV files with the following columns:
- `name`: Account name
- `email`: Contact email
- `companyX`: Your company name
- `competitors`: Comma-separated list of competitor names
- `term` (optional): Keyword cluster term
- `companyXStrength` (optional): "strong", "medium", or "weak"
- `competitorStrengths` (optional): Comma-separated strengths for each competitor
- `volume` (optional): Search volume number
- `cpc` (optional): Cost per click value

## Built With

- [Next.js](https://nextjs.org/) - The React framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Papaparse](https://www.papaparse.com/) - CSV parsing
- [html2canvas](https://html2canvas.hertzen.com/) - PNG export
- [React Hook Form](https://react-hook-form.com/) - Form handling
- [Zod](https://github.com/colinhacks/zod) - Schema validation 