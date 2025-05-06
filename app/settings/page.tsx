"use client";

import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  const {
    aiMode,
    setAiMode,
    anthropicApiKey,
    setAnthropicApiKey,
    anthropicModel,
    setAnthropicModel,
  } = useAppContext();

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Fetch Mode</CardTitle>
          <CardDescription>
            Choose between AI mode (using Anthropic API) or Scraper mode for fetching data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Label htmlFor="ai-mode">AI Mode</Label>
            <Switch
              id="ai-mode"
              checked={aiMode}
              onCheckedChange={setAiMode}
            />
          </div>
          
          {aiMode && (
            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="anthropic-api-key">Anthropic API Key</Label>
                <Input
                  id="anthropic-api-key"
                  type="password"
                  value={anthropicApiKey}
                  onChange={(e) => setAnthropicApiKey(e.target.value)}
                  placeholder="Enter your Anthropic API key"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="anthropic-model">Anthropic Model</Label>
                <Select
                  value={anthropicModel}
                  onValueChange={setAnthropicModel}
                >
                  <SelectTrigger id="anthropic-model">
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="claude-3-haiku-20240307">Claude 3 Haiku</SelectItem>
                    <SelectItem value="claude-3-sonnet-20240229">Claude 3 Sonnet</SelectItem>
                    <SelectItem value="claude-3-opus-20240229">Claude 3 Opus</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Button
        onClick={() => window.history.back()}
        className="bg-purple-800 hover:bg-purple-900"
      >
        Back to Dashboard
      </Button>
    </div>
  );
} 