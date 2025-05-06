"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { v4 as uuidv4 } from "uuid";
import { Cluster, StrengthBadge } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const strengthOptions: StrengthBadge[] = ["strong", "medium", "weak", null];

interface ClusterFormProps {
  cluster?: Cluster;
  companyXName: string;
  competitors: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (cluster: Cluster) => void;
}

export function ClusterForm({
  cluster,
  companyXName,
  competitors,
  open,
  onOpenChange,
  onSave,
}: ClusterFormProps) {
  // Dynamically generate the form schema based on competitors
  const formSchemaObj: Record<string, any> = {
    term: z.string().min(2, {
      message: "Term must be at least 2 characters.",
    }),
    companyXStrength: z.enum(["strong", "medium", "weak", "unknown"]).optional().transform(val => val === "unknown" ? null : val),
    volume: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
    cpc: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  };
  
  // Add competitor strength fields
  competitors.forEach(competitor => {
    formSchemaObj[`competitor_${competitor}`] = z.enum(["strong", "medium", "weak", "unknown"]).optional().transform(val => val === "unknown" ? null : val);
  });
  
  const formSchema = z.object(formSchemaObj);
  type ClusterFormValues = z.infer<typeof formSchema>;
  
  // Generate default values
  const defaultValues: Partial<ClusterFormValues> = {
    term: cluster?.term || "",
    companyXStrength: cluster?.companyXStrength || "unknown",
    volume: cluster?.volume?.toString() || "",
    cpc: cluster?.cpc?.toString() || "",
  };
  
  // Add competitor default values
  competitors.forEach(competitor => {
    defaultValues[`competitor_${competitor}` as keyof ClusterFormValues] = 
      cluster?.competitorStrengths?.[competitor] || "unknown";
  });
  
  const form = useForm<ClusterFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  function onSubmit(values: ClusterFormValues) {
    // Create competitor strengths record
    const competitorStrengths: Record<string, StrengthBadge> = {};
    competitors.forEach(competitor => {
      competitorStrengths[competitor] = values[`competitor_${competitor}` as keyof ClusterFormValues] as StrengthBadge;
    });
    
    const updatedCluster: Cluster = {
      id: cluster?.id || uuidv4(),
      term: values.term,
      companyXStrength: values.companyXStrength as StrengthBadge,
      competitorStrengths,
      volume: values.volume as number | undefined,
      cpc: values.cpc as number | undefined,
    };
    
    onSave(updatedCluster);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{cluster ? "Edit" : "Add"} Keyword Cluster</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="term"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Keyword Cluster Term</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter keyword phrase" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="companyXStrength"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{companyXName} Strength</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select strength" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="unknown">Unknown</SelectItem>
                        <SelectItem value="strong">Strong</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="weak">Weak</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {competitors.map((competitor) => (
                <FormField
                  key={competitor}
                  control={form.control}
                  name={`competitor_${competitor}` as any}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{competitor} Strength</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select strength" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="unknown">Unknown</SelectItem>
                          <SelectItem value="strong">Strong</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="weak">Weak</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
              
              <FormField
                control={form.control}
                name="volume"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Search Volume</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g. 1200" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="cpc"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPC ($)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="e.g. 2.50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <DialogFooter>
              <Button type="submit" className="bg-purple-800 hover:bg-purple-900">Save</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 