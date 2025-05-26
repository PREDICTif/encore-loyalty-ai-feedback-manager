import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import FactsEditor from "@/components/facts-editor";
import ResponseGenerator from "@/components/response-generator";
import ProfileLoader from "@/components/profile-loader";
import { FactConfiguration } from "@/lib/types";
import { Bot } from "lucide-react";

export default function FeedbackManager() {
  const [configuration, setConfiguration] = useState<FactConfiguration | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current configuration
  const { data: configData, isLoading, error } = useQuery({
    queryKey: ["/api/fact-configuration"],
    enabled: true,
  });

  // Update configuration mutation
  const updateConfigMutation = useMutation({
    mutationFn: async (config: FactConfiguration) => {
      const { id, ...configData } = config;
      const response = await apiRequest("POST", "/api/fact-configuration", configData);
      return response.json();
    },
    onSuccess: (data: FactConfiguration) => {
      setConfiguration(data);
      queryClient.invalidateQueries({ queryKey: ["/api/fact-configuration"] });
      toast({
        title: "Configuration Updated",
        description: "Your fact configuration has been saved successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update configuration. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Set configuration when data is loaded
  useEffect(() => {
    if (configData && !configuration) {
      setConfiguration(configData);
    }
  }, [configData, configuration]);

  const handleConfigurationChange = (newConfig: FactConfiguration) => {
    setConfiguration(newConfig);
    // Auto-save configuration after a short delay
    const timeoutId = setTimeout(() => {
      updateConfigMutation.mutate(newConfig);
    }, 1000);

    return () => clearTimeout(timeoutId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Bot className="mx-auto text-blue-500 mb-4" size={48} />
          <h2 className="text-xl font-semibold text-slate-800">Loading Encore Loyalty AI...</h2>
          <p className="text-slate-600 mt-2">Setting up your feedback management system</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-slate-800">Failed to Load Configuration</h2>
          <p className="text-slate-600 mt-2">Please refresh the page and try again</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  if (!configuration) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Bot className="mx-auto text-slate-400 mb-4" size={48} />
          <h2 className="text-xl font-semibold text-slate-800">No Configuration Found</h2>
          <p className="text-slate-600 mt-2">Unable to load fact configuration</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-slate-800 text-center flex items-center justify-center">
            <Bot className="text-blue-500 mr-3" size={32} />
            Encore Loyalty AI Feedback Manager
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Facts Editor - Left Side (3 columns) */}
          <div className="lg:col-span-3">
            <ProfileLoader 
              configuration={configuration}
              onConfigurationChange={handleConfigurationChange}
            />
            <FactsEditor 
              configuration={configuration}
              onConfigurationChange={handleConfigurationChange}
            />
          </div>

          {/* Response Generator - Right Side (2 columns) */}
          <div className="lg:col-span-2">
            <ResponseGenerator configuration={configuration} />
          </div>
        </div>
      </div>
    </div>
  );
}
