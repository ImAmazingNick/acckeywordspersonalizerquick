"use client";

import { Cluster, StrengthBadge } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ResultsTableProps {
  clusters: Cluster[];
  companyXName: string;
  competitors: string[];
}

export function ResultsTable({ clusters, companyXName, competitors }: ResultsTableProps) {
  // Get the styles for each badge type with pastel colors
  const getBadgeStyle = (strength: StrengthBadge): string => {
    switch(strength) {
      case "strong":
        return "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-400";
      case "medium":
        return "bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-400";
      case "weak":
        return "bg-rose-100 text-rose-800 hover:bg-rose-200 border-rose-400";
      default:
        return "bg-slate-100 text-slate-800 hover:bg-slate-200 border-slate-400";
    }
  };

  const getCellStyle = (strength: StrengthBadge): string => {
    switch(strength) {
      case "strong":
        return "bg-emerald-50";
      case "medium":
        return "bg-amber-50";
      case "weak":
        return "bg-rose-50";
      default:
        return "";
    }
  };

  const getBadgeText = (strength: StrengthBadge) => {
    if (strength === null) return "Unknown";
    return strength.charAt(0).toUpperCase() + strength.slice(1);
  };

  // Number of columns in the table (1 for keywords + company + competitors + 2 for metrics)
  const totalColumns = 3 + competitors.length;

  return (
    <div className="w-full overflow-hidden rounded-xl border border-gray-200 shadow-sm results-table-wrapper">
      <Table className="min-w-full results-table">
        <TableHeader className="bg-purple-900">
          <TableRow>
            <TableHead className="text-white font-semibold py-4 text-base whitespace-nowrap">Keyword Cluster</TableHead>
            <TableHead className="text-white font-semibold py-4 text-base whitespace-nowrap border-l-3 border-r-3 border-purple-300 text-center">{companyXName}</TableHead>
            {competitors.map((competitor, index) => (
              <TableHead key={index} className="text-white font-semibold py-4 text-base whitespace-nowrap">
                {competitor}
              </TableHead>
            ))}
            <TableHead className="text-white font-semibold py-4 text-base whitespace-nowrap text-right">Search Volume</TableHead>
            <TableHead className="text-white font-semibold py-4 text-base whitespace-nowrap text-right">CPC</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clusters.map((cluster, index) => (
            <TableRow
              key={cluster.id}
              className={cn(
                "transition-all hover:bg-gray-50",
                index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
              )}
            >
              <TableCell className="font-medium text-base py-3">{cluster.term}</TableCell>
              <TableCell className={cn("py-3 border-l-3 border-r-3 border-purple-200", getCellStyle(cluster.companyXStrength))}>
                <div className="flex justify-center">
                  <Badge 
                    className={cn("text-sm font-medium px-3 py-1 border", 
                      getBadgeStyle(cluster.companyXStrength))} 
                    variant="outline"
                  >
                    {getBadgeText(cluster.companyXStrength)}
                  </Badge>
                </div>
              </TableCell>
              {competitors.map((competitor, compIndex) => (
                <TableCell 
                  key={compIndex} 
                  className={cn("py-3", getCellStyle(cluster.competitorStrengths[competitor] || null))}
                >
                  <div className="flex justify-center">
                    <Badge
                      className={cn("text-sm font-medium px-3 py-1 border", 
                        getBadgeStyle(cluster.competitorStrengths[competitor] || null))}
                      variant="outline"
                    >
                      {getBadgeText(cluster.competitorStrengths[competitor] || null)}
                    </Badge>
                  </div>
                </TableCell>
              ))}
              <TableCell className="text-base py-3 font-medium text-right">
                {cluster.volume ? cluster.volume.toLocaleString() : "N/A"}
              </TableCell>
              <TableCell className="text-base py-3 font-medium text-right">
                {cluster.cpc ? `$${cluster.cpc.toFixed(2)}` : "N/A"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={totalColumns} className="py-3 text-center text-gray-500 italic text-sm">
              Made with Improvado AI Agent
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
} 