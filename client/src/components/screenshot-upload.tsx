import { useState, useRef, DragEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { FactConfiguration } from "@/lib/types";
import {
  Upload,
  Image,
  Loader2,
  Check,
  X,
  FileImage,
  Sparkles,
} from "lucide-react";

interface ScreenshotUploadProps {
  configuration: FactConfiguration;
  onFactsExtracted: (facts: string[]) => void;
}

interface ExtractedFact {
  category: string;
  value: string;
  confidence: "high" | "medium" | "low";
}

export default function ScreenshotUpload({
  configuration,
  onFactsExtracted,
}: ScreenshotUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedFacts, setExtractedFacts] = useState<ExtractedFact[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find((file) => file.type.startsWith("image/"));

    if (imageFile) {
      await processImage(imageFile);
    } else {
      toast({
        title: "Invalid File",
        description: "Please upload an image file.",
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processImage(file);
    }
  };

  const processImage = async (file: File) => {
    setIsProcessing(true);
    setExtractedFacts([]);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    try {
      const formData = new FormData();
      formData.append("image", file);

      // First, extract the text from the image
      const response = await fetch("/api/analyze-feedback-screenshot", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to analyze image");
      }

      const data = await response.json();
      const facts = data.extractedFacts as ExtractedFact[];

      setExtractedFacts(facts);

      // Convert to string facts for adding to customer facts
      const factStrings = facts.map(
        (fact) => `${fact.category}: ${fact.value}`
      );

      onFactsExtracted(factStrings);

      toast({
        title: "Facts Extracted Successfully",
        description: `Extracted ${facts.length} facts from the screenshot.`,
      });
    } catch (error) {
      console.error("Error processing image:", error);
      toast({
        title: "Processing Failed",
        description:
          "Failed to extract facts from the image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddToCustomerFacts = () => {
    const factStrings = extractedFacts.map(
      (fact) => `${fact.category}: ${fact.value}`
    );
    onFactsExtracted(factStrings);

    // Clear the preview and facts after adding
    setPreviewUrl(null);
    setExtractedFacts([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    toast({
      title: "Facts Added",
      description: `Added ${factStrings.length} facts to customer profile.`,
    });
  };

  const clearUpload = () => {
    setPreviewUrl(null);
    setExtractedFacts([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Card className="shadow-sm border-slate-200 mb-6">
      <CardHeader className="pb-4 bg-purple-600 text-white rounded-t-lg">
        <CardTitle className="text-lg font-semibold flex items-center">
          <FileImage className="mr-2" size={18} />
          Customer Feedback Screenshot
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? "border-purple-500 bg-purple-50"
              : "border-slate-300 hover:border-slate-400"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {!previewUrl && !isProcessing && (
            <>
              <Image className="mx-auto text-slate-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-slate-700 mb-2">
                Drop feedback screenshot here
              </h3>
              <p className="text-sm text-slate-500 mb-4">or click to browse</p>
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="border-purple-500 text-purple-600 hover:bg-purple-50"
              >
                <Upload className="mr-2" size={16} />
                Select Image
              </Button>
            </>
          )}

          {isProcessing && (
            <div className="flex flex-col items-center">
              <Loader2
                className="animate-spin text-purple-500 mb-4"
                size={48}
              />
              <p className="text-slate-600">Analyzing feedback screenshot...</p>
              <p className="text-sm text-slate-500 mt-2">
                Extracting customer information and ratings
              </p>
            </div>
          )}

          {previewUrl && !isProcessing && (
            <div className="space-y-4">
              <div className="relative inline-block">
                <img
                  src={previewUrl}
                  alt="Uploaded screenshot"
                  className="max-h-48 rounded-lg shadow-md"
                />
                <Button
                  onClick={clearUpload}
                  size="sm"
                  variant="destructive"
                  className="absolute -top-2 -right-2"
                >
                  <X size={14} />
                </Button>
              </div>

              {extractedFacts.length > 0 && (
                <div className="text-left space-y-3 mt-6">
                  <h4 className="font-medium text-slate-700 flex items-center">
                    <Sparkles className="mr-2 text-purple-500" size={16} />
                    Extracted Facts
                  </h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {extractedFacts.map((fact, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-slate-50 rounded-md"
                      >
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant={
                              fact.confidence === "high"
                                ? "default"
                                : fact.confidence === "medium"
                                ? "secondary"
                                : "outline"
                            }
                            className="text-xs"
                          >
                            {fact.category}
                          </Badge>
                          <span className="text-sm text-slate-700">
                            {fact.value}
                          </span>
                        </div>
                        <Check className="text-green-500" size={16} />
                      </div>
                    ))}
                  </div>
                  <Button
                    onClick={handleAddToCustomerFacts}
                    className="w-full bg-purple-500 hover:bg-purple-600 text-white"
                  >
                    <Check className="mr-2" size={16} />
                    Add Facts to Customer Profile
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        <p className="text-xs text-slate-500 mt-4 text-center">
          Upload screenshots of customer feedback forms or reviews to
          automatically extract ratings, demographics, and feedback details.
        </p>
      </CardContent>
    </Card>
  );
}
