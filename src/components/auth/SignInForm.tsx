"use client";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { ChevronLeftIcon } from "@/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import api from "@/lib/api";

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

export default function SignInForm() {
  const [isChecked, setIsChecked] = useState(false);
  const [mobileNumber, setMobileNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Mock OTP sending function
  const handleSendOtp = () => {
    if (mobileNumber.length === 10) {
      // Mock OTP sending - no API call
      console.log(`Mock OTP sent to ${mobileNumber}`);
      setIsOtpSent(true);
      // Mock OTP - in real app this would come from backend
      alert(`Mock OTP: 123456 (This would be sent via SMS in production)`);
    } else {
      alert("Please enter a valid 10-digit mobile number");
    }
  };

  // Mock OTP verification function
  const handleVerifyOtp = () => {
    if (otp === "123456") { // Mock OTP validation
      setIsOtpVerified(true);
      alert("Mobile number verified successfully!");
    } else {
      alert("Invalid OTP. Please try again.");
    }
  };

  // Type guard to check if it's an Axios error
  const isAxiosError = (error: unknown): error is ApiError => {
    return typeof error === 'object' && error !== null && 'isAxiosError' in error;
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
      token: jwt_token.substring(0, 20) + '...' // Log only first 20 chars for security
    });
    
    alert("Sign in successful!");
    
    // Redirect to dashboard or profile page
    router.push('/profile');
    // Alternatively: window.location.href = '/dashboard';
  };

  // Handle sign in with REAL API integration
  const handleSignIn = async () => {
    if (!isOtpVerified) {
      alert("Please verify your mobile number first");
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
          alert(`Error: ${errorMessage}`);
        } else if (error.request) {
          // Request was made but no response received
          alert("Network error: Please check your internet connection");
        } else {
          // Something else happened
          alert("An unexpected error occurred during sign in");
        }
      } else if (error instanceof Error) {
        // Native JavaScript error
        alert(`Error: ${error.message}`);
      } else {
        // Unknown error type
        alert("An unknown error occurred during sign in");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Sign In
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your mobile number and verify with OTP to sign in!
            </p>
          </div>
          <div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5">
              <button className="inline-flex items-center justify-center gap-3 py-3 text-sm font-normal text-gray-700 transition-colors bg-gray-100 rounded-lg px-7 hover:bg-gray-200 hover:text-gray-800 dark:bg-white/5 dark:text-white/90 dark:hover:bg-white/10">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M18.7511 10.1944C18.7511 9.47495 18.6915 8.94995 18.5626 8.40552H10.1797V11.6527H15.1003C15.0011 12.4597 14.4654 13.675 13.2749 14.4916L13.2582 14.6003L15.9087 16.6126L16.0924 16.6305C17.7788 15.1041 18.7511 12.8583 18.7511 10.1944Z"
                    fill="#4285F4"
                  />
                  <path
                    d="M10.1788 18.75C12.5895 18.75 14.6133 17.9722 16.0915 16.6305L13.274 14.4916C12.5201 15.0068 11.5081 15.3666 10.1788 15.3666C7.81773 15.3666 5.81379 13.8402 5.09944 11.7305L4.99473 11.7392L2.23868 13.8295L2.20264 13.9277C3.67087 16.786 6.68674 18.75 10.1788 18.75Z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.10014 11.7305C4.91165 11.186 4.80257 10.6027 4.80257 9.99992C4.80257 9.3971 4.91165 8.81379 5.09022 8.26935L5.08523 8.1534L2.29464 6.02954L2.20333 6.0721C1.5982 7.25823 1.25098 8.5902 1.25098 9.99992C1.25098 11.4096 1.5982 12.7415 2.20333 13.9277L5.10014 11.7305Z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M10.1789 4.63331C11.8554 4.63331 12.9864 5.34303 13.6312 5.93612L16.1511 3.525C14.6035 2.11528 12.5895 1.25 10.1789 1.25C6.68676 1.25 3.67088 3.21387 2.20264 6.07218L5.08953 8.26943C5.81381 6.15972 7.81776 4.63331 10.1789 4.63331Z"
                    fill="#EB4335"
                  />
                </svg>
                Sign in with Google
              </button>
              <button className="inline-flex items-center justify-center gap-3 py-3 text-sm font-normal text-gray-700 transition-colors bg-gray-100 rounded-lg px-7 hover:bg-gray-200 hover:text-gray-800 dark:bg-white/5 dark:text-white/90 dark:hover:bg-white/10">
                <svg
                  width="21"
                  className="fill-current"
                  height="20"
                  viewBox="0 0 21 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M15.6705 1.875H18.4272L12.4047 8.75833L19.4897 18.125H13.9422L9.59717 12.4442L4.62554 18.125H1.86721L8.30887 10.7625L1.51221 1.875H7.20054L11.128 7.0675L15.6705 1.875ZM14.703 16.475H16.2305L6.37054 3.43833H4.73137L14.703 16.475Z" />
                </svg>
                Sign in with X
              </button>
            </div>
            <div className="relative py-3 sm:py-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="p-2 text-gray-400 bg-white dark:bg-gray-900 sm:px-5 sm:py-2">
                  Or
                </span>
              </div>
            </div>
            <form>
              <div className="space-y-6">
                {/* <!-- Mobile Number --> */}
                <div>
                  <Label>
                    Mobile Number <span className="text-error-500">*</span>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="tel"
                      placeholder="Enter your 10-digit mobile number"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      disabled={isOtpVerified}
                    />
                    {!isOtpVerified && (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={mobileNumber.length !== 10}
                        className={`px-4 py-2 text-sm font-medium text-white transition rounded-lg shadow-theme-xs whitespace-nowrap ${
                          mobileNumber.length !== 10
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-brand-500 hover:bg-brand-600"
                        }`}
                      >
                        {isOtpSent ? "Resend OTP" : "Send OTP"}
                      </button>
                    )}
                  </div>
                </div>

                {/* <!-- OTP Verification --> */}
                {isOtpSent && !isOtpVerified && (
                  <div>
                    <Label>
                      Enter OTP <span className="text-error-500">*</span>
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="Enter 6-digit OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={handleVerifyOtp}
                        disabled={!otp}
                        className={`px-4 py-2 text-sm font-medium text-white transition rounded-lg shadow-theme-xs whitespace-nowrap ${
                          !otp
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-brand-500 hover:bg-brand-600"
                        }`}
                      >
                        Verify OTP
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Enter the OTP sent to your mobile number. Mock OTP: 123456
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox 
                      checked={isChecked} 
                      onChange={setIsChecked}
                    />
                    <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
                      Keep me logged in
                    </span>
                  </div>
                  <Link
                    href="/forget"
                    className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                  >
                    Forgot Number?
                  </Link>
                </div>
                
                <div>
                  <Button 
                    className="w-full" 
                    size="sm"
                    disabled={!isOtpVerified || isLoading}
                    onClick={handleSignIn}
                  >
                    {isLoading ? "Signing In..." : 
                     isOtpVerified ? "Sign In" : "Verify Mobile to Continue"}
                  </Button>
                </div>
              </div>
            </form>

            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                Don&apos;t have an account? {""}
                <Link
                  href="/signup"
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Sign Up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Export the TokenManager for use in other components
export { TokenManager };