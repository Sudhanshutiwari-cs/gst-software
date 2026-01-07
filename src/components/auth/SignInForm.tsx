"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Image from "next/image";

import Checkbox from "@/components/form/input/Checkbox";
import Label from "@/components/form/Label";
import Link from "next/link";
import api from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Define proper TypeScript interfaces for the error response
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

interface User {
  id: number;
  role: string;
  mobile_number: string;
  email: string | null;
  otp_expiry: string | null;
  // Add other user properties as needed
}

interface SignInResponse {
  success: boolean;
  message: string;
  jwt_token: string;
  unique_id: string;
  user: User;
}

// Token storage utility functions
const TokenManager = {
  // Store token based on user's "keep me logged in" preference
  setToken: (token: string, keepLoggedIn: boolean = false): void => {
    if (typeof window === 'undefined') return;

    if (keepLoggedIn) {
      // Store in localStorage for persistent login
      localStorage.setItem('authToken', token);
      localStorage.setItem('tokenExpiry', (Date.now() + 7 * 24 * 60 * 60 * 1000).toString()); // 7 days
    } else {
      // Store in sessionStorage for session-only login
      sessionStorage.setItem('authToken', token);
    }

    // Also set a flag to remember the preference
    localStorage.setItem('keepLoggedIn', keepLoggedIn.toString());
  },

  // Get token from storage (checks both localStorage and sessionStorage)
  getToken: (): string | null => {
    if (typeof window === 'undefined') return null;

    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');

    // Check if token has expired (for localStorage tokens)
    if (token && localStorage.getItem('authToken')) {
      const expiry = localStorage.getItem('tokenExpiry');
      if (expiry && Date.now() > parseInt(expiry)) {
        TokenManager.clearToken();
        return null;
      }
    }

    return token;
  },

  // Clear all tokens
  clearToken: (): void => {
    if (typeof window === 'undefined') return;

    localStorage.removeItem('authToken');
    localStorage.removeItem('tokenExpiry');
    localStorage.removeItem('keepLoggedIn');
    localStorage.removeItem('userData');
    localStorage.removeItem('uniqueId');
    sessionStorage.removeItem('authToken');
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return TokenManager.getToken() !== null;
  },

  // Store user data
  setUserData: (userData: User, uniqueId: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('userData', JSON.stringify(userData));
    localStorage.setItem('uniqueId', uniqueId);
  },

  // Get user data
  getUserData: (): User | null => {
    if (typeof window === 'undefined') return null;
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  },

  // Get unique ID
  getUniqueId: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('uniqueId');
  },

  // Set default authorization header for API calls
  setAuthHeader: (token: string): void => {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  },

  // Remove authorization header
  removeAuthHeader: (): void => {
    delete api.defaults.headers.common['Authorization'];
  }
};

export default function SwipeLoginForm() {
  const [isChecked, setIsChecked] = useState(false);
  const [mobileNumber, setMobileNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<"mobile" | "otp" | "complete">("mobile");
  const router = useRouter();

  // Type guard to check if it's an Axios error
  const isAxiosError = (error: unknown): error is ApiError => {
    return typeof error === 'object' && error !== null && 'isAxiosError' in error;
  };

  // Enhanced toast function with better defaults
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const options = {
      position: "top-right" as const,
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "light",
    };

    switch (type) {
      case 'success':
        toast.success(message, options);
        break;
      case 'error':
        toast.error(message, options);
        break;
      case 'info':
        toast.info(message, options);
        break;
    }
  };

  // Mock OTP sending function
  const handleSendOtp = () => {
    if (mobileNumber.length === 10) {
      // Mock OTP sending - no API call
      console.log(`Mock OTP sent to ${mobileNumber}`);
      setIsOtpSent(true);
      setCurrentStep("otp");
      // Mock OTP - in real app this would come from backend
      showToast("Mock OTP: 123456", 'info');
    } else {
      showToast("Please enter a valid 10-digit mobile number", 'error');
    }
  };

  // Mock OTP verification function
  const handleVerifyOtp = () => {
    if (otp === "123456") { // Mock OTP validation
      setIsOtpVerified(true);
      setCurrentStep("complete");
      showToast("Mobile number verified successfully!", 'success');
    } else {
      showToast("Invalid OTP. Please try again", 'error');
    }
  };

  // Handle successful authentication
  const handleAuthenticationSuccess = (responseData: SignInResponse) => {
    const { jwt_token, user, unique_id } = responseData;

    // Store token based on user preference
    TokenManager.setToken(jwt_token, isChecked);

    // Store user data and unique ID
    TokenManager.setUserData(user, unique_id);

    // Set default authorization header for future API calls
    TokenManager.setAuthHeader(jwt_token);

    console.log("Authentication successful. Token and user data stored:", {
      storage: isChecked ? 'localStorage (persistent)' : 'sessionStorage (session-only)',
      user: user,
      uniqueId: unique_id,
      token: jwt_token.substring(0, 20) + '...'
    });

    showToast("Login successful!", 'success');
    
    // Redirect after a short delay
    setTimeout(() => {
      router.push("/dashboard");
    }, 1000);
  };

  // Handle sign in with REAL API integration
  const handleSignIn = async () => {
    if (!isOtpVerified) {
      showToast("Please verify your mobile number first", 'error');
      return;
    }

    setIsLoading(true);
    try {
      const signInData = {
        phone: mobileNumber,
        otp: otp,
        // Add any additional fields required by your signin API
        keep_me_logged_in: isChecked
      };

      // REAL API call to signin endpoint with proper response type
      const response = await api.post<SignInResponse>('/vendor/login', signInData);

      if (response.status === 200) {
        const { data } = response;

        // Check if login was successful
        if (data.success && data.jwt_token) {
          handleAuthenticationSuccess(data);
        } else {
          throw new Error(data.message || "Login failed");
        }

        console.log("Full sign in response:", data);
      }
    } catch (error: unknown) {
      console.error("Sign in error:", error);

      // Clear any existing tokens on error
      TokenManager.clearToken();

      // Handle different types of errors
      if (isAxiosError(error)) {
        // Server responded with error status
        if (error.response) {
          const errorMessage = error.response.data?.message ||
            error.response.data?.error ||
            error.response.statusText ||
            "Sign in failed";
          showToast(errorMessage, 'error');
        } else if (error.request) {
          // Request was made but no response received
          showToast("Network error", 'error');
        } else {
          // Something else happened
          showToast("Network error", 'error');
        }
      } else if (error instanceof Error) {
        // Native JavaScript error
        showToast(`Error: ${error.message}`, 'error');
      } else {
        // Unknown error type
        showToast("Network error", 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    if (currentStep === "mobile") {
      handleSendOtp();
    } else if (currentStep === "otp") {
      handleVerifyOtp();
    } else {
      handleSignIn();
    }
  };

  const getButtonText = () => {
    if (isLoading) return "Signing In...";
    if (currentStep === "mobile") return "Continue with Mobile Number";
    if (currentStep === "otp") return "Verify OTP";
    return "Sign In";
  };

  // Add back button to go from OTP step to mobile step
  const goBackToMobile = () => {
    setCurrentStep("mobile");
    setOtp("");
  };

  return (
    <>
      {/* Toast Container at root level */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        style={{ zIndex: 9999 }}
      />

      {/* Main container with background image */}
      <div className="min-h-screen relative">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          {/* Replace with your actual image path */}
          <Image
            src="https://res.cloudinary.com/doficc2yl/image/upload/v1767728899/Gemini_Generated_Image_hxormjhxormjhxor_zkmjay.png"
            alt="Background"
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          {/* Optional overlay for better readability */}
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]"></div>
        </div>

        {/* Centering container */}
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 relative">
            {/* Country selector removed as per your code */}

            {/* Logo */}
            <div className="text-center mb-6">
              <h1 className="text-4xl font-bold text-[#1a1a2e] tracking-tight">
                GST <span className="inline-block">🇮🇳</span>
              </h1>
            </div>

            {/* User avatars */}
            <div className="flex justify-center -space-x-3 mb-3">
              <Avatar className="w-12 h-12 border-2 border-white bg-white p-[2px]">
                <AvatarImage src="/1GST.png" />
                <AvatarFallback>U1</AvatarFallback>
              </Avatar>
              <Avatar className="w-12 h-12 border-2 border-white bg-white p-[2px]">
                <AvatarImage src="/2GST.png" />
                <AvatarFallback>U2</AvatarFallback>
              </Avatar>
              <Avatar className="w-12 h-12 border-2 border-white bg-white p-[2px]">
                <AvatarImage src="/3GST.png" />
                <AvatarFallback>U3</AvatarFallback>
              </Avatar>
              <Avatar className="w-12 h-12 border-2 border-white bg-white p-[2px]">
                <AvatarImage src="/4GST.jpg" />
                <AvatarFallback>U4</AvatarFallback>
              </Avatar>
              <Avatar className="w-12 h-12 border-2 border-white bg-white p-[2px]">
                <AvatarImage src="/5GST.jpg" />
                <AvatarFallback>U5</AvatarFallback>
              </Avatar>
            </div>

            {/* Social proof text */}
            <p className="text-center text-foreground font-medium mb-6">
              20 Lakh+ Businesses <span className="text-red-500">❤️</span> us.
            </p>

            {/* Welcome text */}
            <h2 className="text-center text-2xl font-semibold text-foreground mb-6">
              Welcome <span>🙏</span>
            </h2>

            {/* Mobile input - Only show when not verified */}
            {currentStep === "mobile" && (
              <div className="mb-2">
                <div className="flex items-center border border-input rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:border-transparent">
                  <span className="px-4 py-3 text-muted-foreground border-r border-input bg-muted/30">+91</span>
                  <Input
                    type="tel"
                    placeholder="10 digit mobile number"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    maxLength={10}
                    disabled={isOtpSent}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2 ml-1">
                  We will be sending an OTP to this number
                </p>
              </div>
            )}

            {/* OTP input - Show when OTP is sent but not verified */}
            {currentStep === "otp" && (
              <div className="mb-2">
                <div className="flex items-center justify-between mb-3">
                  <button
                    type="button"
                    onClick={goBackToMobile}
                    className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    <ChevronDown className="w-4 h-4 rotate-90" />
                    Back
                  </button>
                  <p className="text-sm text-muted-foreground">
                    Sent to +91 {mobileNumber}
                  </p>
                </div>

                <Label>
                  Enter OTP <span className="text-error-500">*</span>
                </Label>
                <div className="flex items-center border border-input rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:border-transparent">
                  <span className="px-4 py-3 text-muted-foreground border-r border-input bg-muted/30">OTP</span>
                  <Input
                    type="tel"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    maxLength={6}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2 ml-1">
                  Enter the OTP sent to your mobile number. Mock OTP: 123456
                </p>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={isChecked}
                      onChange={setIsChecked}
                      id="keep-logged-in"
                    />
                    <label
                      htmlFor="keep-logged-in"
                      className="text-sm text-muted-foreground cursor-pointer"
                    >
                      Keep me logged in
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="text-sm text-[#4F46E5] hover:text-[#4338CA]"
                  >
                    Resend OTP
                  </button>
                </div>
              </div>
            )}

            {/* Verified state - Show when OTP is verified */}
            {currentStep === "complete" && (
              <div className="mb-4">
                <div className="p-4 bg-green-50/90 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-green-800">Mobile number verified!</p>
                      <p className="text-sm text-green-600">+91 {mobileNumber}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={isChecked}
                      onChange={setIsChecked}
                      id="keep-logged-in-final"
                    />
                    <label
                      htmlFor="keep-logged-in-final"
                      className="text-sm text-muted-foreground cursor-pointer"
                    >
                      Keep me logged in
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentStep("mobile");
                      setMobileNumber("");
                      setOtp("");
                    }}
                    className="text-sm text-[#4F46E5] hover:text-[#4338CA]"
                  >
                    Change number
                  </button>
                </div>
              </div>
            )}

            {/* Continue/Sign In button */}
            <Button
              onClick={handleContinue}
              disabled={
                isLoading ||
                (currentStep === "mobile" && mobileNumber.length !== 10) ||
                (currentStep === "otp" && otp.length !== 6)
              }
              className="w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white py-6 text-base font-medium rounded-lg mt-4 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {getButtonText()}
              <ChevronRight className="w-5 h-5 ml-1" />
              <ChevronRight className="w-5 h-5 -ml-3" />
            </Button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
            </div>

            {/* Google sign in */}
            <Button
              variant="outline"
              className="w-full py-6 text-base font-medium rounded-lg bg-white/80 hover:bg-white/100 border-gray-300 transition-all duration-200"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign In with Google
            </Button>

            {/* Footer links */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-700">
                Don&apos;t have an account?{" "}
                <Link
                  href="/signup"
                  className="text-[#4F46E5] hover:text-[#4338CA] font-medium transition-colors duration-200"
                >
                  Sign Up
                </Link>
              </p>
              <p className="mt-2">
                <Link
                  href="/forget-number"
                  className="text-sm text-[#4F46E5] hover:text-[#4338CA] transition-colors duration-200"
                >
                  Forgot Number?
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Export the TokenManager for use in other components
export { TokenManager };