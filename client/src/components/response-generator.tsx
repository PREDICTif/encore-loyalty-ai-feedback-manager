import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Bot, Copy, Save, Mail, CloudUpload, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { GeneratedResponse, FactConfiguration } from "@/lib/types";

interface ResponseGeneratorProps {
  configuration: FactConfiguration;
}

export default function ResponseGenerator({ configuration }: ResponseGeneratorProps) {
  const [feedbackText, setFeedbackText] = useState(`I had dinner at your restaurant last night and I was absolutely blown away by the seafood pasta! The flavors were incredible and the service was outstanding. Our server was so attentive and knowledgeable about the wine pairings. This has quickly become one of my favorite spots in town. Thank you for such a wonderful dining experience!`);
  const [generatedResponse, setGeneratedResponse] = useState<GeneratedResponse | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const generateResponseMutation = useMutation({
    mutationFn: async ({ feedbackText, configurationId }: { feedbackText: string; configurationId: number }) => {
      const response = await apiRequest("POST", "/api/generate-response", {
        feedbackText,
        configurationId,
      });
      return response.json();
    },
    onSuccess: (data: GeneratedResponse) => {
      setGeneratedResponse(data);
      toast({
        title: "Response Generated",
        description: "AI response has been successfully generated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate AI response. Please try again.",
        variant: "destructive",
      });
    },
  });

  const analyzeImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch('/api/analyze-image', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || response.statusText);
      }

      return response.json();
    },
    onSuccess: (data: { extractedText: string }) => {
      setFeedbackText(data.extractedText);
      toast({
        title: "Image Analyzed",
        description: "Text has been extracted from the image and added to the feedback field.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Image Analysis Failed",
        description: error.message || "Failed to analyze image. Please try again.",
        variant: "destructive",
      });
    },
  });

  const saveResponseMutation = useMutation({
    mutationFn: async (responseId: number) => {
      const response = await apiRequest("POST", "/api/save-response", { responseId });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Response Saved",
        description: "The response has been saved successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save response. Please try again.",
        variant: "destructive",
      });
    },
  });

  const emailResponseMutation = useMutation({
    mutationFn: async ({ responseId, customerEmail }: { responseId: number; customerEmail: string }) => {
      const response = await apiRequest("POST", "/api/email-response", { responseId, customerEmail });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Email Sent",
        description: "The response has been sent to the customer successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Email Failed",
        description: error.message || "Failed to send email. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      analyzeImageMutation.mutate(file);
    }
  };

  const handleGenerateResponse = () => {
    if (!feedbackText.trim()) {
      toast({
        title: "Missing Feedback",
        description: "Please enter customer feedback text before generating a response.",
        variant: "destructive",
      });
      return;
    }

    generateResponseMutation.mutate({
      feedbackText: feedbackText.trim(),
      configurationId: configuration.id,
    });
  };

  const handleCopyResponse = async () => {
    if (generatedResponse?.aiResponse) {
      try {
        await navigator.clipboard.writeText(generatedResponse.aiResponse);
        toast({
          title: "Copied to Clipboard",
          description: "The response has been copied to your clipboard.",
        });
      } catch (error) {
        toast({
          title: "Copy Failed",
          description: "Failed to copy response to clipboard.",
          variant: "destructive",
        });
      }
    }
  };

  const handleSaveResponse = () => {
    if (generatedResponse) {
      saveResponseMutation.mutate(generatedResponse.id);
    }
  };

  const handleEmailCustomer = () => {
    if (generatedResponse) {
      // In a real implementation, you would ask for the customer's email
      const customerEmail = `${configuration.customerFacts.name.toLowerCase().replace(' ', '.')}@example.com`;
      emailResponseMutation.mutate({
        responseId: generatedResponse.id,
        customerEmail,
      });
    }
  };

  return (
    <Card className="shadow-sm border-slate-200 sticky top-8">
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-6 flex items-center">
          <Bot className="text-indigo-500 mr-2" size={20} />
          AI Response Generation
        </h2>



        {/* Generate Button */}
        <Button
          onClick={handleGenerateResponse}
          disabled={generateResponseMutation.isPending || !feedbackText.trim()}
          className="w-full bg-blue-500 text-white font-medium py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors mb-6"
        >
          <Bot className="mr-2" size={16} />
          {generateResponseMutation.isPending ? (
            <>
              <Loader2 className="animate-spin mr-2" size={16} />
              Generating Response...
            </>
          ) : (
            "Generate AI Response"
          )}
        </Button>

        {/* AI Generated Response Display */}
        <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 min-h-32">
          <div className="flex items-center justify-between mb-3">
            <Label className="text-sm font-medium text-slate-700">AI Generated Response</Label>
            {generatedResponse && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyResponse}
                className="text-slate-500 hover:text-slate-700"
              >
                <Copy size={16} />
              </Button>
            )}
          </div>
          
          {generatedResponse ? (
            <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
              {generatedResponse.aiResponse}
            </div>
          ) : (
            <div className="text-sm text-slate-400 italic">
              Generated response will appear here after clicking "Generate AI Response"
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {generatedResponse && (
          <div className="flex gap-3 mt-4">
            <Button
              onClick={handleSaveResponse}
              disabled={saveResponseMutation.isPending}
              className="flex-1 bg-emerald-500 text-white font-medium py-2 px-4 rounded-lg hover:bg-emerald-600 transition-colors text-sm"
            >
              {saveResponseMutation.isPending ? (
                <Loader2 className="animate-spin mr-2" size={16} />
              ) : (
                <Save className="mr-2" size={16} />
              )}
              Save Response
            </Button>
            <Button
              onClick={handleEmailCustomer}
              disabled={emailResponseMutation.isPending}
              className="flex-1 bg-indigo-500 text-white font-medium py-2 px-4 rounded-lg hover:bg-indigo-600 transition-colors text-sm"
            >
              {emailResponseMutation.isPending ? (
                <Loader2 className="animate-spin mr-2" size={16} />
              ) : (
                <Mail className="mr-2" size={16} />
              )}
              Email Customer
            </Button>
          </div>
        )}

        {/* Response Analytics */}
        {generatedResponse?.analytics && (
          <div className="mt-6 pt-4 border-t border-slate-200">
            <h3 className="text-sm font-medium text-slate-700 mb-3">Response Analytics</h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="text-lg font-semibold text-slate-800">
                  {generatedResponse.analytics.wordCount}
                </div>
                <div className="text-xs text-slate-600">Word Count</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="text-lg font-semibold text-slate-800">
                  {generatedResponse.analytics.sentiment}
                </div>
                <div className="text-xs text-slate-600">Tone</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
