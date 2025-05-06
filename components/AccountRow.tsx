"use client";

import { useState, useEffect } from "react";
import { Account, FetchParams } from "@/types";
import { ResultsTable } from "@/components/ResultsTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClusterForm } from "@/components/ClusterForm";
import { AccountForm } from "@/components/AccountForm";
import { useAppContext } from "@/context/AppContext";
import { fetchClusterData } from "@/lib/scraper";
import { exportToPng } from "@/lib/exporter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit, MoreVertical, Plus, Trash, Download, RefreshCw, Search } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface AccountRowProps {
  account: Account;
  onUpdate: (updatedAccount: Account) => void;
  onDelete: (id: string) => void;
  csvColumns?: string[];
}

export function AccountRow({ account, onUpdate, onDelete, csvColumns = [] }: AccountRowProps) {
  const [editAccountOpen, setEditAccountOpen] = useState(false);
  const [addClusterOpen, setAddClusterOpen] = useState(false);
  const [editClusterOpen, setEditClusterOpen] = useState(false);
  const [currentClusterId, setCurrentClusterId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const { fetching, setFetching, aiMode } = useAppContext();
  const [fetchSource, setFetchSource] = useState<"manual" | "csv" | "ai">("manual");
  const [url, setUrl] = useState<string>(account.fetchParams?.url || "");
  const [urlColumnName, setUrlColumnName] = useState<string>(account.fetchParams?.urlColumnName || "");
  const [customQuery, setCustomQuery] = useState<string>(account.fetchParams?.customQuery || "");
  const [queryType, setQueryType] = useState<"predefined" | "custom">(account.fetchParams?.queryType || "predefined");
  const [predefinedQuery, setPredefinedQuery] = useState<string>(account.fetchParams?.predefinedQuery || "top5");

  const currentCluster = account.clusters.find((c) => c.id === currentClusterId);

  const handleEditCluster = (clusterId: string) => {
    setCurrentClusterId(clusterId);
    setEditClusterOpen(true);
  };

  const handleDeleteCluster = (clusterId: string) => {
    const updatedClusters = account.clusters.filter((c) => c.id !== clusterId);
    onUpdate({
      ...account,
      clusters: updatedClusters,
    });
  };

  const handleSaveCluster = (updatedCluster: any) => {
    const existingIndex = account.clusters.findIndex((c) => c.id === updatedCluster.id);
    let updatedClusters;
    
    if (existingIndex >= 0) {
      updatedClusters = [...account.clusters];
      updatedClusters[existingIndex] = updatedCluster;
    } else {
      updatedClusters = [...account.clusters, updatedCluster];
    }
    
    onUpdate({
      ...account,
      clusters: updatedClusters,
    });
  };

  const updateFetchParams = () => {
    const params: FetchParams = {
      queryType: queryType,
      predefinedQuery: predefinedQuery as any,
    };

    if (fetchSource === "manual" && url) {
      params.url = url;
    } else if (fetchSource === "csv" && urlColumnName) {
      params.urlColumnName = urlColumnName;
    } else if (fetchSource === "ai" && aiMode) {
      params.customQuery = customQuery;
      if (url) params.url = url;
    }

    onUpdate({
      ...account,
      fetchParams: params,
    });
  };

  const handleFetchData = async () => {
    if (fetching[account.id]) return;
    
    updateFetchParams();
    
    setFetching({ ...fetching, [account.id]: true });
    
    try {
      console.log("Fetching data for account:", account.name);
      
      const accountWithParams = {
        ...account,
        fetchParams: {
          queryType,
          predefinedQuery: predefinedQuery as any,
          ...(fetchSource === "manual" && url ? { url } : {}),
          ...(fetchSource === "csv" && urlColumnName ? { urlColumnName } : {}),
          ...(fetchSource === "ai" && aiMode ? { customQuery } : {}),
        }
      };
      
      const updatedClusters = await fetchClusterData(accountWithParams);
      
      console.log("Fetch complete, updating account with new clusters");
      onUpdate({
        ...account,
        clusters: updatedClusters,
        fetchParams: accountWithParams.fetchParams
      });
      
      console.log(`Successfully fetched ${updatedClusters.length} clusters`);
    } catch (error) {
      console.error("Error fetching data:", error);
      alert(`Error fetching data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setFetching({ ...fetching, [account.id]: false });
    }
  };

  const handleExportToPng = async () => {
    try {
      const tableElementId = `table-${account.id}`;
      await exportToPng(tableElementId, account.name);
    } catch (error) {
      console.error("Error exporting to PNG:", error);
    }
  };

  useEffect(() => {
    if (account.fetchParams) {
      if (account.fetchParams.url) {
        setFetchSource("manual");
        setUrl(account.fetchParams.url);
      } else if (account.fetchParams.urlColumnName) {
        setFetchSource("csv");
        setUrlColumnName(account.fetchParams.urlColumnName);
      } else if (account.fetchParams.customQuery) {
        setFetchSource("ai");
        setCustomQuery(account.fetchParams.customQuery);
      }
      
      setQueryType(account.fetchParams.queryType);
      if (account.fetchParams.predefinedQuery) {
        setPredefinedQuery(account.fetchParams.predefinedQuery);
      }
    }
  }, [account.id, account.fetchParams]);

  return (
    <>
      <Card className="mb-4 shadow-sm hover:shadow-md transition-shadow rounded-xl border-gray-200">
        <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
          <CardTitle className="text-lg font-medium">{account.name}</CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setAddClusterOpen(true)}
              size="icon"
              variant="ghost"
              className="text-purple-800 hover:bg-purple-50 hover:text-purple-900 rounded-full"
              title="Add Cluster"
            >
              <Plus className="h-5 w-5" />
            </Button>
            <Button
              onClick={handleExportToPng}
              size="icon"
              variant="ghost"
              className="text-purple-800 hover:text-purple-900 hover:bg-purple-50 rounded-full"
              title="Export as PNG"
            >
              <Download className="h-5 w-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" className="rounded-full">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditAccountOpen(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Account
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDeleteConfirmOpen(true)}>
                  <Trash className="mr-2 h-4 w-4" />
                  Delete Account
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="mb-4">
            <div className="border rounded-xl p-3 mb-4 bg-white shadow-sm">
              <div className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-3">
                  <Select 
                    value={fetchSource} 
                    onValueChange={(value: "manual" | "csv" | "ai") => setFetchSource(value)}
                  >
                    <SelectTrigger className="h-9 rounded-lg">
                      <SelectValue placeholder="Data Source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual URL</SelectItem>
                      {csvColumns.length > 0 && (
                        <SelectItem value="csv">From CSV</SelectItem>
                      )}
                      <SelectItem value="ai" disabled={!aiMode}>AI Mode {!aiMode && "(Disabled)"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="col-span-6">
                  {fetchSource === "manual" && (
                    <Input
                      type="url"
                      placeholder="Enter URL (e.g., https://example.com)"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="h-9 rounded-lg"
                    />
                  )}
                  
                  {fetchSource === "csv" && csvColumns.length > 0 && (
                    <Select 
                      value={urlColumnName} 
                      onValueChange={setUrlColumnName}
                    >
                      <SelectTrigger className="h-9 rounded-lg">
                        <SelectValue placeholder="Select URL column" />
                      </SelectTrigger>
                      <SelectContent>
                        {csvColumns.map((column) => (
                          <SelectItem key={column} value={column}>{column}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  
                  {fetchSource === "ai" && (
                    <Input
                      type="url"
                      placeholder="Enter URL (e.g., https://example.com)"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="h-9 rounded-lg"
                    />
                  )}
                </div>
                
                <div className="col-span-2">
                  {fetchSource !== "ai" && (
                    <Select 
                      value={predefinedQuery} 
                      onValueChange={setPredefinedQuery}
                    >
                      <SelectTrigger className="h-9 rounded-lg">
                        <SelectValue placeholder="Query" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="top5">Top 5</SelectItem>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="competitors">Competitors</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
                
                <div className="col-span-1 flex justify-end">
                  <Button
                    onClick={handleFetchData}
                    disabled={fetching[account.id] || 
                      (fetchSource === "manual" && !url) || 
                      (fetchSource === "csv" && !urlColumnName) ||
                      (fetchSource === "ai" && (!url || !customQuery))}
                    size="sm"
                    className="bg-purple-800 hover:bg-purple-900 h-9 rounded-lg px-4"
                  >
                    {fetching[account.id] ? "Fetching..." : "Fetch"}
                  </Button>
                </div>
                
                {fetchSource === "ai" && (
                  <div className="col-span-12 mt-2">
                    <Input
                      type="text"
                      placeholder="Enter AI query (e.g., 'Find top 10 SEO keywords for this website')"
                      value={customQuery}
                      onChange={(e) => setCustomQuery(e.target.value)}
                      className="h-9 rounded-lg"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div id={`account-${account.id}`} className="relative overflow-hidden">
            {account.clusters.length > 0 ? (
              <div id={`table-${account.id}`}>
                <ResultsTable
                  clusters={account.clusters}
                  companyXName={account.companyX}
                  competitors={account.competitors}
                />
              </div>
            ) : (
              <div className="py-8 text-center text-gray-400">
                No keyword clusters yet. Add a cluster or fetch data.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <AccountForm
        account={account}
        open={editAccountOpen}
        onOpenChange={setEditAccountOpen}
        onSave={onUpdate}
      />

      <ClusterForm
        companyXName={account.companyX}
        competitors={account.competitors}
        open={addClusterOpen}
        onOpenChange={setAddClusterOpen}
        onSave={handleSaveCluster}
      />

      {currentCluster && (
        <ClusterForm
          cluster={currentCluster}
          companyXName={account.companyX}
          competitors={account.competitors}
          open={editClusterOpen}
          onOpenChange={setEditClusterOpen}
          onSave={handleSaveCluster}
        />
      )}

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the account and all its clusters. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => onDelete(account.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 