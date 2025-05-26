import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Building2, Users, Upload, Download, ChevronDown } from "lucide-react";
import { FactConfiguration, RestaurantFacts, CustomerFacts } from "@/lib/types";

interface ProfileLoaderProps {
  configuration: FactConfiguration;
  onConfigurationChange: (config: FactConfiguration) => void;
}

interface RestaurantProfile {
  id: string;
  name: string;
  type: string;
  address: string;
  url: string;
  brandTone: string;
  todoFacts: string[];
}

interface CustomerProfile {
  id: string;
  name: string;
  gender: string;
  history: string;
  meal: string;
  todoFacts: string[];
}

export default function ProfileLoader({
  configuration,
  onConfigurationChange,
}: ProfileLoaderProps) {
  const [selectedRestaurantProfile, setSelectedRestaurantProfile] =
    useState<string>("");
  const [selectedCustomerProfile, setSelectedCustomerProfile] =
    useState<string>("");
  const [currentRestaurantId, setCurrentRestaurantId] =
    useState<string>("bistro-casual");
  const [isOpen, setIsOpen] = useState<boolean>(true); // Default uncollapsed
  const { toast } = useToast();

  // Fetch restaurant profiles
  const { data: restaurantProfiles = [], isLoading: loadingRestaurants } =
    useQuery<RestaurantProfile[]>({
      queryKey: ["/api/restaurant-profiles"],
    });

  // Fetch customer profiles for current restaurant
  const { data: customerProfiles = [], isLoading: loadingCustomers } = useQuery<
    CustomerProfile[]
  >({
    queryKey: ["/api/customer-profiles", currentRestaurantId],
    queryFn: () =>
      fetch(`/api/customer-profiles/${currentRestaurantId}`).then((res) =>
        res.json()
      ),
    enabled: !!currentRestaurantId,
  });

  // Load restaurant profile mutation
  const loadRestaurantMutation = useMutation({
    mutationFn: async (profileId: string) => {
      const response = await apiRequest(
        "POST",
        "/api/load-restaurant-profile",
        { profileId }
      );
      return response.json();
    },
    onSuccess: (restaurantData: RestaurantFacts) => {
      const newConfig = {
        ...configuration,
        restaurantFacts: restaurantData,
      };
      onConfigurationChange(newConfig);
      setCurrentRestaurantId(selectedRestaurantProfile);
      toast({
        title: "Restaurant Profile Loaded",
        description: `Successfully loaded ${restaurantData.name} profile.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Load Failed",
        description: error.message || "Failed to load restaurant profile.",
        variant: "destructive",
      });
    },
  });

  // Load customer profile mutation
  const loadCustomerMutation = useMutation({
    mutationFn: async ({
      restaurantId,
      profileId,
    }: {
      restaurantId: string;
      profileId: string;
    }) => {
      const response = await apiRequest("POST", "/api/load-customer-profile", {
        restaurantId,
        profileId,
      });
      return response.json();
    },
    onSuccess: (customerData: CustomerFacts) => {
      const newConfig = {
        ...configuration,
        customerFacts: customerData,
      };
      onConfigurationChange(newConfig);
      toast({
        title: "Customer Profile Loaded",
        description: `Successfully loaded ${customerData.name} profile.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Load Failed",
        description: error.message || "Failed to load customer profile.",
        variant: "destructive",
      });
    },
  });

  const handleLoadRestaurant = () => {
    if (selectedRestaurantProfile) {
      loadRestaurantMutation.mutate(selectedRestaurantProfile);
    }
  };

  const handleLoadCustomer = () => {
    if (selectedCustomerProfile && currentRestaurantId) {
      loadCustomerMutation.mutate({
        restaurantId: currentRestaurantId,
        profileId: selectedCustomerProfile,
      });
    }
  };

  return (
    <Card className="shadow-sm border-slate-200 mb-6">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-4 cursor-pointer bg-blue-600 text-white rounded-t-lg hover:bg-blue-700 transition-colors">
            <CardTitle className="text-lg font-semibold flex items-center justify-between">
              <span className="flex items-center">
                <Upload className="mr-2" size={18} />
                Profile Manager
              </span>
              <ChevronDown
                className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
                size={16}
              />
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* Restaurant Profile Loader */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Building2 className="text-blue-500" size={16} />
                <h3 className="font-medium text-slate-700">
                  Restaurant Profiles
                </h3>
              </div>
              <div className="flex gap-2">
                <Select
                  value={selectedRestaurantProfile}
                  onValueChange={setSelectedRestaurantProfile}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue
                      placeholder={
                        loadingRestaurants
                          ? "Loading..."
                          : "Select restaurant profile..."
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {restaurantProfiles.length > 0 ? (
                      restaurantProfiles.map((profile) => (
                        <SelectItem key={profile.id} value={profile.id}>
                          {profile.name} ({profile.type})
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        No profiles available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleLoadRestaurant}
                  disabled={
                    !selectedRestaurantProfile ||
                    loadRestaurantMutation.isPending
                  }
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4"
                >
                  {loadRestaurantMutation.isPending ? (
                    <Download className="animate-spin" size={16} />
                  ) : (
                    <Download size={16} />
                  )}
                </Button>
              </div>
            </div>

            {/* Customer Profile Loader */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Users className="text-indigo-500" size={16} />
                <h3 className="font-medium text-slate-700">
                  Customer Profiles
                </h3>
                <span className="text-sm text-slate-500">
                  (for {currentRestaurantId.replace("-", " ")})
                </span>
              </div>
              <div className="flex gap-2">
                <Select
                  value={selectedCustomerProfile}
                  onValueChange={setSelectedCustomerProfile}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue
                      placeholder={
                        loadingCustomers
                          ? "Loading..."
                          : "Select customer profile..."
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {customerProfiles.length > 0 ? (
                      customerProfiles.map((profile) => (
                        <SelectItem key={profile.id} value={profile.id}>
                          {profile.name} ({profile.history} customer)
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        No profiles available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleLoadCustomer}
                  disabled={
                    !selectedCustomerProfile || loadCustomerMutation.isPending
                  }
                  className="bg-indigo-500 hover:bg-indigo-600 text-white px-4"
                >
                  {loadCustomerMutation.isPending ? (
                    <Download className="animate-spin" size={16} />
                  ) : (
                    <Download size={16} />
                  )}
                </Button>
              </div>
            </div>

            {/* Current Status */}
            <div className="pt-3 border-t border-slate-200">
              <div className="text-sm text-slate-600 space-y-1">
                <div>
                  <span className="font-medium">Current Restaurant:</span>{" "}
                  {configuration.restaurantFacts.name} (
                  {configuration.restaurantFacts.type})
                </div>
                <div>
                  <span className="font-medium">Current Customer:</span>{" "}
                  {configuration.customerFacts.name} (
                  {configuration.customerFacts.history} customer)
                </div>
                <div>
                  <span className="font-medium">Restaurant ID:</span>{" "}
                  {currentRestaurantId}
                </div>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
