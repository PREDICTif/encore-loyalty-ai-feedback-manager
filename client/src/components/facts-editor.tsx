import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  Plus,
  X,
  Utensils,
  User,
  Settings,
  GripVertical,
  Upload,
  Check,
  Save,
} from "lucide-react";
import { FactConfiguration } from "@/lib/types";

interface FactsEditorProps {
  configuration: FactConfiguration;
  onConfigurationChange: (config: FactConfiguration) => void;
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function FactsEditor({
  configuration,
  onConfigurationChange,
}: FactsEditorProps) {
  const [openSections, setOpenSections] = useState({
    restaurant: true,
    customer: true,
    system: true,
  });

  // Local state for text inputs to prevent aggressive callbacks
  const [localRestaurantFacts, setLocalRestaurantFacts] = useState<string[]>(
    configuration.restaurantFacts.todoFacts
  );
  const [localCustomerFacts, setLocalCustomerFacts] = useState<string[]>(
    configuration.customerFacts.todoFacts
  );
  const [editingRestaurantFact, setEditingRestaurantFact] = useState<
    number | null
  >(null);
  const [editingCustomerFact, setEditingCustomerFact] = useState<number | null>(
    null
  );

  // Sync local state when configuration changes from outside
  useEffect(() => {
    setLocalRestaurantFacts(configuration.restaurantFacts.todoFacts);
  }, [configuration.restaurantFacts.todoFacts]);

  useEffect(() => {
    setLocalCustomerFacts(configuration.customerFacts.todoFacts);
  }, [configuration.customerFacts.todoFacts]);

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const updateRestaurantFacts = (
    updates: Partial<typeof configuration.restaurantFacts>
  ) => {
    onConfigurationChange({
      ...configuration,
      restaurantFacts: { ...configuration.restaurantFacts, ...updates },
    });
  };

  const updateCustomerFacts = (
    updates: Partial<typeof configuration.customerFacts>
  ) => {
    onConfigurationChange({
      ...configuration,
      customerFacts: { ...configuration.customerFacts, ...updates },
    });
  };

  const updateSystemFacts = (
    updates: Partial<typeof configuration.systemFacts>
  ) => {
    onConfigurationChange({
      ...configuration,
      systemFacts: { ...configuration.systemFacts, ...updates },
    });
  };

  const addRestaurantFact = () => {
    const newFacts = [...localRestaurantFacts, ""];
    setLocalRestaurantFacts(newFacts);
    updateRestaurantFacts({ todoFacts: newFacts });
    setEditingRestaurantFact(newFacts.length - 1);
  };

  const removeRestaurantFact = (index: number) => {
    const newFacts = localRestaurantFacts.filter((_, i) => i !== index);
    setLocalRestaurantFacts(newFacts);
    updateRestaurantFacts({ todoFacts: newFacts });
    setEditingRestaurantFact(null);
  };

  const updateLocalRestaurantFact = (index: number, value: string) => {
    const newFacts = localRestaurantFacts.map((fact, i) =>
      i === index ? value : fact
    );
    setLocalRestaurantFacts(newFacts);
  };

  const saveRestaurantFact = (index: number) => {
    updateRestaurantFacts({ todoFacts: localRestaurantFacts });
    setEditingRestaurantFact(null);
  };

  const addCustomerFact = () => {
    const newFacts = [...localCustomerFacts, ""];
    setLocalCustomerFacts(newFacts);
    updateCustomerFacts({ todoFacts: newFacts });
    setEditingCustomerFact(newFacts.length - 1);
  };

  const removeCustomerFact = (index: number) => {
    const newFacts = localCustomerFacts.filter((_, i) => i !== index);
    setLocalCustomerFacts(newFacts);
    updateCustomerFacts({ todoFacts: newFacts });
    setEditingCustomerFact(null);
  };

  const updateLocalCustomerFact = (index: number, value: string) => {
    const newFacts = localCustomerFacts.map((fact, i) =>
      i === index ? value : fact
    );
    setLocalCustomerFacts(newFacts);
  };

  const saveCustomerFact = (index: number) => {
    updateCustomerFacts({ todoFacts: localCustomerFacts });
    setEditingCustomerFact(null);
  };

  // Auto-save on blur or Enter key
  const handleRestaurantFactKeyDown = (
    e: React.KeyboardEvent,
    index: number
  ) => {
    if (e.key === "Enter") {
      saveRestaurantFact(index);
    }
    if (e.key === "Escape") {
      setLocalRestaurantFacts(configuration.restaurantFacts.todoFacts);
      setEditingRestaurantFact(null);
    }
  };

  const handleCustomerFactKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Enter") {
      saveCustomerFact(index);
    }
    if (e.key === "Escape") {
      setLocalCustomerFacts(configuration.customerFacts.todoFacts);
      setEditingCustomerFact(null);
    }
  };

  return (
    <Card className="shadow-sm border-slate-200">
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-6 flex items-center">
          <Settings className="text-blue-500 mr-2" size={20} />
          Facts Management
        </h2>

        {/* Restaurant Facts Section */}
        <div className="mb-6">
          <Collapsible
            open={openSections.restaurant}
            onOpenChange={() => toggleSection("restaurant")}
          >
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between px-4 py-3 bg-slate-50 rounded-t-lg border border-slate-200 hover:bg-slate-100"
              >
                <span className="font-medium text-slate-700 flex items-center">
                  <Utensils className="text-blue-500 mr-2" size={16} />
                  Restaurant Specific Facts
                </span>
                <ChevronDown
                  className={`text-slate-400 transition-transform ${
                    openSections.restaurant ? "rotate-180" : ""
                  }`}
                  size={16}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="border border-t-0 border-slate-200 rounded-b-lg p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-slate-700 mb-1">
                    Restaurant Name
                  </Label>
                  <Input
                    value={configuration.restaurantFacts.name}
                    onChange={(e) =>
                      updateRestaurantFacts({ name: e.target.value })
                    }
                    className="focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-700 mb-1">
                    Restaurant Type
                  </Label>
                  <Select
                    value={configuration.restaurantFacts.type}
                    onValueChange={(value) =>
                      updateRestaurantFacts({ type: value })
                    }
                  >
                    <SelectTrigger className="focus:ring-2 focus:ring-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Casual">Casual</SelectItem>
                      <SelectItem value="Upscale">Upscale</SelectItem>
                      <SelectItem value="Fast-food">Fast-food</SelectItem>
                      <SelectItem value="Fine-dining">Fine dining</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-700 mb-1">
                  Address
                </Label>
                <Input
                  value={configuration.restaurantFacts.address}
                  onChange={(e) =>
                    updateRestaurantFacts({ address: e.target.value })
                  }
                  className="focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-slate-700 mb-1">
                    Website URL
                  </Label>
                  <Input
                    type="url"
                    value={configuration.restaurantFacts.url}
                    onChange={(e) =>
                      updateRestaurantFacts({ url: e.target.value })
                    }
                    className="focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-700 mb-1">
                    Brand Tone
                  </Label>
                  <Select
                    value={configuration.restaurantFacts.brandTone}
                    onValueChange={(value) =>
                      updateRestaurantFacts({ brandTone: value })
                    }
                  >
                    <SelectTrigger className="focus:ring-2 focus:ring-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Formal">Formal</SelectItem>
                      <SelectItem value="Casual">Casual</SelectItem>
                      <SelectItem value="Friendly">Friendly</SelectItem>
                      <SelectItem value="Professional">Professional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Dynamic Restaurant Facts */}
              <div className="mt-4">
                <Label className="text-sm font-medium text-slate-700 mb-2">
                  Additional Restaurant Facts
                </Label>
                <div className="space-y-2">
                  {localRestaurantFacts.map((fact, index) => {
                    const isEditing = editingRestaurantFact === index;
                    const hasChanges =
                      fact !==
                      (configuration.restaurantFacts.todoFacts[index] || "");

                    return (
                      <div
                        key={index}
                        className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                          isEditing
                            ? "bg-blue-50 border border-blue-200"
                            : "bg-slate-50"
                        }`}
                      >
                        <GripVertical className="text-slate-400" size={16} />
                        <Input
                          value={fact}
                          onChange={(e) =>
                            updateLocalRestaurantFact(index, e.target.value)
                          }
                          className={`flex-1 ${
                            hasChanges
                              ? "border-orange-300 bg-orange-50"
                              : "border-slate-200"
                          }`}
                          placeholder="Enter restaurant fact..."
                          onKeyDown={(e) =>
                            handleRestaurantFactKeyDown(e, index)
                          }
                          onFocus={() => setEditingRestaurantFact(index)}
                          onBlur={() => {
                            if (hasChanges) {
                              saveRestaurantFact(index);
                            } else {
                              setEditingRestaurantFact(null);
                            }
                          }}
                        />
                        {hasChanges && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => saveRestaurantFact(index)}
                            className="text-green-600 hover:text-green-700 px-2"
                            title="Save changes (or press Enter)"
                          >
                            <Save size={16} />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRestaurantFact(index)}
                          className="text-red-500 hover:text-red-700 px-2"
                        >
                          <X size={16} />
                        </Button>
                      </div>
                    );
                  })}
                </div>
                <Button
                  variant="ghost"
                  onClick={addRestaurantFact}
                  className="mt-2 text-blue-500 hover:text-blue-700 font-medium text-sm"
                >
                  <Plus size={16} className="mr-1" />
                  Add Restaurant Fact
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Customer Facts Section */}
        <div className="mb-6">
          <Collapsible
            open={openSections.customer}
            onOpenChange={() => toggleSection("customer")}
          >
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between px-4 py-3 bg-slate-50 rounded-t-lg border border-slate-200 hover:bg-slate-100"
              >
                <span className="font-medium text-slate-700 flex items-center">
                  <User className="text-indigo-500 mr-2" size={16} />
                  Customer Specific Facts
                </span>
                <ChevronDown
                  className={`text-slate-400 transition-transform ${
                    openSections.customer ? "rotate-180" : ""
                  }`}
                  size={16}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="border border-t-0 border-slate-200 rounded-b-lg p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-slate-700 mb-1">
                    Customer Name
                  </Label>
                  <Input
                    value={configuration.customerFacts.name}
                    onChange={(e) =>
                      updateCustomerFacts({ name: e.target.value })
                    }
                    className="focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-700 mb-1">
                    Gender
                  </Label>
                  <Select
                    value={configuration.customerFacts.gender}
                    onValueChange={(value) =>
                      updateCustomerFacts({ gender: value })
                    }
                  >
                    <SelectTrigger className="focus:ring-2 focus:ring-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Male</SelectItem>
                      <SelectItem value="F">Female</SelectItem>
                      <SelectItem value="Unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-700 mb-1">
                    Customer History
                  </Label>
                  <Select
                    value={configuration.customerFacts.history}
                    onValueChange={(value) =>
                      updateCustomerFacts({ history: value })
                    }
                  >
                    <SelectTrigger className="focus:ring-2 focus:ring-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Long-time">Long-time</SelectItem>
                      <SelectItem value="Recent">Recent</SelectItem>
                      <SelectItem value="Unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-700 mb-1">
                  Meal Type
                </Label>
                <Select
                  value={configuration.customerFacts.meal}
                  onValueChange={(value) =>
                    updateCustomerFacts({ meal: value })
                  }
                >
                  <SelectTrigger className="focus:ring-2 focus:ring-blue-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Breakfast">Breakfast</SelectItem>
                    <SelectItem value="Lunch">Lunch</SelectItem>
                    <SelectItem value="Dinner">Dinner</SelectItem>
                    <SelectItem value="Unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Customer Feedback Input */}
              <div className="mt-4">
                <Label className="text-sm font-medium text-slate-700 mb-2">
                  Customer Feedback Screenshot/Extracted Text
                </Label>
                <Textarea
                  placeholder="Paste customer feedback text here or upload screenshot below..."
                  className="h-32 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
                />

                {/* File Upload Area */}
                <Label className="text-sm font-medium text-slate-700 mb-2">
                  Customer Feedback Screenshot (Optional)
                </Label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:border-blue-500 transition-colors mb-4">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="customer-file-upload"
                  />
                  <label
                    htmlFor="customer-file-upload"
                    className="cursor-pointer"
                  >
                    <Upload
                      className="mx-auto text-2xl text-slate-400 mb-2"
                      size={32}
                    />
                    <p className="text-sm text-slate-600">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-slate-400">
                      PNG, JPG up to 10MB
                    </p>
                  </label>
                </div>
              </div>

              {/* Dynamic Customer Facts */}
              <div className="mt-4">
                <Label className="text-sm font-medium text-slate-700 mb-2">
                  Additional Customer Facts
                </Label>
                <div className="space-y-2">
                  {localCustomerFacts.map((fact, index) => {
                    const isEditing = editingCustomerFact === index;
                    const hasChanges =
                      fact !==
                      (configuration.customerFacts.todoFacts[index] || "");

                    return (
                      <div
                        key={index}
                        className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                          isEditing
                            ? "bg-blue-50 border border-blue-200"
                            : "bg-slate-50"
                        }`}
                      >
                        <GripVertical className="text-slate-400" size={16} />
                        <Input
                          value={fact}
                          onChange={(e) =>
                            updateLocalCustomerFact(index, e.target.value)
                          }
                          className={`flex-1 ${
                            hasChanges
                              ? "border-orange-300 bg-orange-50"
                              : "border-slate-200"
                          }`}
                          placeholder="Enter customer fact..."
                          onKeyDown={(e) => handleCustomerFactKeyDown(e, index)}
                          onFocus={() => setEditingCustomerFact(index)}
                          onBlur={() => {
                            if (hasChanges) {
                              saveCustomerFact(index);
                            } else {
                              setEditingCustomerFact(null);
                            }
                          }}
                        />
                        {hasChanges && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => saveCustomerFact(index)}
                            className="text-green-600 hover:text-green-700 px-2"
                            title="Save changes (or press Enter)"
                          >
                            <Save size={16} />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCustomerFact(index)}
                          className="text-red-500 hover:text-red-700 px-2"
                        >
                          <X size={16} />
                        </Button>
                      </div>
                    );
                  })}
                </div>
                <Button
                  variant="ghost"
                  onClick={addCustomerFact}
                  className="mt-2 text-blue-500 hover:text-blue-700 font-medium text-sm"
                >
                  <Plus size={16} className="mr-1" />
                  Add Customer Fact
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* System Facts Section */}
        <div className="mb-6">
          <Collapsible
            open={openSections.system}
            onOpenChange={() => toggleSection("system")}
          >
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between px-4 py-3 bg-slate-50 rounded-t-lg border border-slate-200 hover:bg-slate-100"
              >
                <span className="font-medium text-slate-700 flex items-center">
                  <Settings className="text-emerald-500 mr-2" size={16} />
                  System Facts & Settings
                </span>
                <ChevronDown
                  className={`text-slate-400 transition-transform ${
                    openSections.system ? "rotate-180" : ""
                  }`}
                  size={16}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="border border-t-0 border-slate-200 rounded-b-lg p-4 space-y-4">
              <div>
                <Label className="text-sm font-medium text-slate-700 mb-1">
                  System Prompt Template
                </Label>
                <Textarea
                  value={configuration.systemFacts.promptTemplate}
                  onChange={(e) =>
                    updateSystemFacts({ promptTemplate: e.target.value })
                  }
                  className="h-32 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-slate-700 mb-1">
                    Default Response Length
                  </Label>
                  <Select
                    value={configuration.systemFacts.responseLength}
                    onValueChange={(value) =>
                      updateSystemFacts({ responseLength: value })
                    }
                  >
                    <SelectTrigger className="focus:ring-2 focus:ring-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short">Short</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="detailed">Detailed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-slate-700">Response Options</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-apology"
                      checked={configuration.systemFacts.includeApology}
                      onCheckedChange={(checked) =>
                        updateSystemFacts({ includeApology: !!checked })
                      }
                      className="border-slate-300"
                    />
                    <Label
                      htmlFor="include-apology"
                      className="text-sm text-slate-700"
                    >
                      Include apology if feedback is negative
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-marketing"
                      checked={configuration.systemFacts.includeMarketing}
                      onCheckedChange={(checked) =>
                        updateSystemFacts({ includeMarketing: !!checked })
                      }
                      className="border-slate-300"
                    />
                    <Label
                      htmlFor="include-marketing"
                      className="text-sm text-slate-700"
                    >
                      Include marketing message if feedback is positive
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="multiple-responses"
                      checked={configuration.systemFacts.multipleResponses}
                      onCheckedChange={(checked) =>
                        updateSystemFacts({ multipleResponses: !!checked })
                      }
                      className="border-slate-300"
                      disabled
                    />
                    <Label
                      htmlFor="multiple-responses"
                      className="text-sm text-slate-700"
                    >
                      Enable multiple response variations (Coming Soon)
                    </Label>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </CardContent>
    </Card>
  );
}
