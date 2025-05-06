"use client";

import { useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Account } from "@/types";
import { useAppContext } from "@/context/AppContext";
import { AccountRow } from "@/components/AccountRow";
import { AccountForm } from "@/components/AccountForm";
import { parseCSV } from "@/utils/csv";
import { fetchClusterData } from "@/lib/scraper";
import { exportAllToPng } from "@/lib/exporter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UploadCloud, Settings, RefreshCw, Download, Plus } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [addAccountOpen, setAddAccountOpen] = useState(false);
  const [csvColumns, setCsvColumns] = useState<string[]>([]);
  const { accounts, setAccounts, fetching, setFetching } = useAppContext();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    try {
      const file = acceptedFiles[0];
      const result = await parseCSV(file);
      setAccounts(result.accounts);
      setCsvColumns(result.columns);
    } catch (error) {
      console.error("Error parsing CSV:", error);
      alert("Failed to parse CSV file. Please check the format and try again.");
    }
  }, [setAccounts]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
    },
  });

  const handleAddAccount = (newAccount: Account) => {
    setAccounts([...accounts, newAccount]);
  };

  const handleUpdateAccount = (updatedAccount: Account) => {
    const updatedAccounts = accounts.map(account => 
      account.id === updatedAccount.id ? updatedAccount : account
    );
    setAccounts(updatedAccounts);
  };

  const handleDeleteAccount = (accountId: string) => {
    const updatedAccounts = accounts.filter(account => account.id !== accountId);
    setAccounts(updatedAccounts);
  };

  const handleFetchAll = async () => {
    const fetchingState: Record<string, boolean> = {};
    accounts.forEach(account => {
      fetchingState[account.id] = true;
    });
    
    setFetching(fetchingState);
    
    try {
      const updatedAccounts = await Promise.all(
        accounts.map(async account => {
          const updatedClusters = await fetchClusterData(account);
          return { ...account, clusters: updatedClusters };
        })
      );
      
      setAccounts(updatedAccounts);
    } catch (error) {
      console.error("Error fetching all data:", error);
    } finally {
      const completedFetchingState: Record<string, boolean> = {};
      accounts.forEach(account => {
        completedFetchingState[account.id] = false;
      });
      
      setFetching(completedFetchingState);
    }
  };

  const handleExportAll = async () => {
    try {
      const accountNames: Record<string, string> = {};
      accounts.forEach(account => {
        accountNames[account.id] = account.name;
      });
      
      await exportAllToPng(
        accounts.map(account => account.id),
        accountNames
      );
    } catch (error) {
      console.error("Error exporting all to PNG:", error);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-purple-900">Keyword-Cluster Dashboard</h1>
        <div className="flex items-center space-x-3">
          {accounts.length > 0 && (
            <>
              <Button
                onClick={handleFetchAll}
                disabled={Object.values(fetching).some(Boolean)}
                className="bg-purple-800 hover:bg-purple-900 rounded-lg"
              >
                {Object.values(fetching).some(Boolean) ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Fetch All
              </Button>
              <Button
                onClick={handleExportAll}
                variant="outline"
                className="border-purple-800 text-purple-800 hover:bg-purple-50 rounded-lg"
              >
                <Download className="mr-2 h-4 w-4" />
                Export All
              </Button>
            </>
          )}
          <Button
            onClick={() => setAddAccountOpen(true)}
            className="bg-purple-800 hover:bg-purple-900 rounded-lg"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Account
          </Button>
          <Link href="/settings">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-purple-50">
              <Settings className="h-5 w-5 text-purple-800" />
            </Button>
          </Link>
        </div>
      </div>

      {accounts.length === 0 ? (
        <Card className="mb-8 rounded-xl shadow-sm border-gray-200">
          <CardContent className="p-8">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? "border-purple-500 bg-purple-50"
                  : "border-gray-300 hover:border-purple-500 hover:bg-purple-50"
              }`}
            >
              <input {...getInputProps()} />
              <UploadCloud className="mx-auto h-16 w-16 text-purple-400" />
              <p className="mt-4 text-xl font-medium text-purple-900">
                Drag & drop your CSV file here
              </p>
              <p className="mt-2 text-sm text-gray-600">
                or click to select a file
              </p>
              <p className="mt-4 text-xs text-gray-500">
                CSV format: name, email, companyX, competitors, clusters (optional)
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {accounts.map((account) => (
            <AccountRow
              key={account.id}
              account={account}
              onUpdate={handleUpdateAccount}
              onDelete={handleDeleteAccount}
              csvColumns={csvColumns}
            />
          ))}
        </div>
      )}

      <AccountForm
        open={addAccountOpen}
        onOpenChange={setAddAccountOpen}
        onSave={handleAddAccount}
      />
    </div>
  );
} 