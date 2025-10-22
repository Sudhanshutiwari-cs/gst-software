"use client";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { ChevronLeftIcon } from "@/icons";
import Link from "next/link";
import React, { useState } from "react";
import api from "@/lib/api";

// Define proper TypeScript interfaces for the API response
interface ApiErrorResponse {
  message?: string;
  error?: string;
  status?: number;
}

interface ApiError extends Error {
  response?: {
    data: ApiErrorResponse;
    status: number;
    statusText: string;
  };
  request?: XMLHttpRequest;
}

interface ForgotDetailsResponse {
  success: boolean;
  message: string;
  data: {
    business_name: string | null;
    owner_name: string | null;
    contact_number: string | null;
  };
}

export default function ForgotDetailsForm() {
  const [identifier, setIdentifier] = useState("");
  const [identifierType, setIdentifierType] = useState<"pan" | "gst">("pan");
  const [isLoading, setIsLoading] = useState(false);
  const [retrievedData, setRetrievedData] = useState<{
    business_name: string | null;
    owner_name: string | null;
    contact_number: string | null;
  } | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleRetrieveDetails = async () => {
    if (!identifier.trim()) {
      setError(`Please enter your ${identifierType.toUpperCase()} number`);
      return;
    }

    // Validate format based on type
    if (identifierType === "pan" && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(identifier)) {
      setError("Please enter a valid PAN number (Format: ABCDE1234F)");
      return;
    }

    if (identifierType === "gst" && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(identifier)) {
      setError("Please enter a valid GST number");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");
    setRetrievedData(null);

    try {
      const payload = {
        [identifierType === "pan" ? "pan_number" : "gst_number"]: identifier.trim().toUpperCase()
      };

      const response = await api.post<ForgotDetailsResponse>('/vendor/forget-number', payload);

      if (response.data.success) {
        setSuccess(response.data.message);
        setRetrievedData(response.data.data);
      } else {
        setError(response.data.message || "Failed to retrieve details");
      }
    } catch (error: unknown) {
      console.error("Retrieve details error:", error);
      
      // Type guard to check if it's an Axios error
      const isAxiosError = (err: unknown): err is ApiError => {
        return typeof err === 'object' && err !== null && 'isAxiosError' in err;
      };

      if (isAxiosError(error)) {
        // Server responded with error status
        if (error.response) {
          const errorMessage = error.response.data?.message || 
                             error.response.data?.error || 
                             "Failed to retrieve details";
          setError(`Error: ${errorMessage}`);
        } else if (error.request) {
          // Request was made but no response received
          setError("Network error: Please check your internet connection");
        } else {
          // Something else happened
          setError("An unexpected error occurred");
        }
      } else if (error instanceof Error) {
        // Native JavaScript error
        setError(`Error: ${error.message}`);
      } else {
        // Unknown error type
        setError("An unknown error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleIdentifierChange = (value: string) => {
    setIdentifier(value);
    setError("");
    setSuccess("");
    setRetrievedData(null);
  };

  const handleIdentifierTypeChange = (type: "pan" | "gst") => {
    setIdentifierType(type);
    setIdentifier("");
    setError("");
    setSuccess("");
    setRetrievedData(null);
  };

  // Check if any data is available to show
  const hasData = retrievedData && (
    retrievedData.business_name || 
    retrievedData.owner_name || 
    retrievedData.contact_number
  );

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full overflow-y-auto no-scrollbar">
      
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 mb-4 text-sm font-medium text-gray-600 transition-colors hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90"
            >
              <ChevronLeftIcon className="w-4 h-4" />
              Back to Login
            </Link>
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Forgot Your Details?
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your PAN or GST number to retrieve your registered details
            </p>
          </div>

          <div>
            <form onSubmit={(e) => { e.preventDefault(); handleRetrieveDetails(); }}>
              <div className="space-y-5">
                {/* Identifier Type Selection */}
                <div>
                  <Label>
                    Search By<span className="text-error-500">*</span>
                  </Label>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <button
                      type="button"
                      onClick={() => handleIdentifierTypeChange("pan")}
                      className={`py-3 text-sm font-medium transition-colors rounded-lg border ${
                        identifierType === "pan"
                          ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400 dark:border-brand-400"
                          : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                      }`}
                    >
                      PAN Number
                    </button>
                    <button
                      type="button"
                      onClick={() => handleIdentifierTypeChange("gst")}
                      className={`py-3 text-sm font-medium transition-colors rounded-lg border ${
                        identifierType === "gst"
                          ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400 dark:border-brand-400"
                          : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                      }`}
                    >
                      GST Number
                    </button>
                  </div>
                </div>

                {/* PAN/GST Number Input */}
                <div>
                  <Label>
                    {identifierType === "pan" ? "PAN Number" : "GST Number"}
                    <span className="text-error-500">*</span>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      id="identifier"
                      name="identifier"
                      placeholder={
                        identifierType === "pan" 
                          ? "Enter your PAN number (e.g., ABCDE1234F)" 
                          : "Enter your GST number"
                      }
                      value={identifier}
                      onChange={(e) => handleIdentifierChange(e.target.value.toUpperCase())}
                      disabled={isLoading}
                    />
                    <button
                      type="submit"
                      disabled={isLoading || !identifier.trim()}
                      className={`px-4 py-2 text-sm font-medium text-white transition rounded-lg shadow-theme-xs whitespace-nowrap min-w-[100px] ${
                        isLoading || !identifier.trim()
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-brand-500 hover:bg-brand-600"
                      }`}
                    >
                      {isLoading ? "Searching..." : "Search"}
                    </button>
                  </div>
                  {identifierType === "pan" && (
                    <p className="mt-1 text-xs text-gray-500">
                      Format: 5 letters, 4 numbers, 1 letter (e.g., ABCDE1234F)
                    </p>
                  )}
                  {identifierType === "gst" && (
                    <p className="mt-1 text-xs text-gray-500">
                      Enter your 15-digit GST number
                    </p>
                  )}
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-3 text-sm text-error-700 bg-error-50 rounded-lg dark:bg-error-500/10 dark:text-error-400">
                    {error}
                  </div>
                )}

                {/* Success Message */}
                {success && (
                  <div className="p-3 text-sm text-success-700 bg-success-50 rounded-lg dark:bg-success-500/10 dark:text-success-400">
                    {success}
                  </div>
                )}

                {/* Retrieved Details - Show if ANY data exists */}
                {hasData && (
                  <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                    <h3 className="mb-3 text-sm font-medium text-gray-800 dark:text-white/90">
                      Registered Details
                    </h3>
                    
                    <div className="space-y-3">
                      {/* Show Business Name if available */}
                      {retrievedData.business_name && (
                        <div>
                          <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                            Business Name
                          </Label>
                          <p className="mt-1 text-sm font-semibold text-gray-800 dark:text-white/90">
                            {retrievedData.business_name}
                          </p>
                        </div>
                      )}
                      
                      {/* Show Owner Name if available */}
                      {retrievedData.owner_name && (
                        <div>
                          <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                            Owner Name
                          </Label>
                          <p className="mt-1 text-sm font-semibold text-gray-800 dark:text-white/90">
                            {retrievedData.owner_name}
                          </p>
                        </div>
                      )}
                      
                      {/* Show Contact Number if available */}
                      {retrievedData.contact_number && (
                        <div>
                          <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                            Contact Number
                          </Label>
                          <p className="mt-1 text-sm font-semibold text-gray-800 dark:text-white/90">
                            {retrievedData.contact_number.replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3")}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <p className="mt-3 text-xs text-gray-500">
                      Use these details to sign in to your account
                    </p>
                  </div>
                )}

                {/* Show message when API returns success but no data */}
                {success && retrievedData && !hasData && (
                  <div className="p-4 border border-warning-200 rounded-lg bg-warning-50 dark:bg-warning-500/10 dark:border-warning-500/20">
                    <p className="text-sm text-warning-700 dark:text-warning-400">
                      No registered details found for this {identifierType.toUpperCase()}. Please contact support.
                    </p>
                  </div>
                )}

                {/* Additional Help */}
                <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                  <h3 className="text-sm font-medium text-gray-800 dark:text-white/90 mb-2">
                    Can't find your details?
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    If you're unable to retrieve your details, please contact our support team for assistance.
                  </p>
                </div>

                {/* Back to Login */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                  <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400">
                    Remember your details?{" "}
                    <Link
                      href="/login"
                      className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                    >
                      Sign In
                    </Link>
                  </p>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}