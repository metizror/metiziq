"use client";

import { useState } from "react";
import {
  publicApiPost,
  publicApiCall,
  privateApiCall,
  privateApiPost,
  privateApiPut,
  privateApiDelete,
  setAuthToken,
  removeAuthToken,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Example component demonstrating how to use public and private API calls
 */
export function ApiExample() {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null as any);
  const [error, setError] = useState(null as string | null);
  const [token, setTokenState] = useState("" as string);

  // Example: Public API call - Login
  const handlePublicLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await publicApiPost("/auth/login", {
        email: "example@email.com",
        password: "password123",
        role: "customer",
      });
      setResponse(data);
      // If login successful, save token
      if (data.token) {
        setAuthToken(data.token);
        setTokenState(data.token);
      }
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  // Example: Public API call - Register
  const handlePublicRegister = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await publicApiPost("/auth/register", {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        companyName: "Example Corp",
        password: "password123",
      });
      setResponse(data);
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  // Example: Private API call - Get user profile
  const handlePrivateGet = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await privateApiCall("/users/profile");
      setResponse(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch profile");
    } finally {
      setLoading(false);
    }
  };

  // Example: Private API call - Update user profile
  const handlePrivatePost = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await privateApiPost("/users/update", {
        firstName: "Updated",
        lastName: "Name",
      });
      setResponse(data);
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  // Example: Private API call - PUT request
  const handlePrivatePut = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await privateApiPut("/users/1", {
        name: "Updated Name",
      });
      setResponse(data);
    } catch (err: any) {
      setError(err.message || "Failed to update");
    } finally {
      setLoading(false);
    }
  };

  // Example: Private API call - DELETE request
  const handlePrivateDelete = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await privateApiDelete("/users/1");
      setResponse(data);
    } catch (err: any) {
      setError(err.message || "Failed to delete");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    removeAuthToken();
    setTokenState("");
    setResponse(null);
    setError(null);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>API Service Examples</CardTitle>
          <CardDescription>
            Examples of using public and private API calls with axios
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Token Management */}
          <div className="space-y-2">
            <Label>Current Token</Label>
            <Input
              value={token || "No token set"}
              readOnly
              placeholder="Token will appear here after login"
              className="font-mono text-xs"
            />
            <div className="flex gap-2">
              <Button onClick={handleLogout} variant="outline" size="sm">
                Clear Token
              </Button>
            </div>
          </div>

          {/* Public API Examples */}
          <div className="space-y-2">
            <Label className="text-lg font-semibold">Public API Calls</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <Button
                onClick={handlePublicLogin}
                disabled={loading}
                variant="outline"
              >
                Public Login (POST)
              </Button>
              <Button
                onClick={handlePublicRegister}
                disabled={loading}
                variant="outline"
              >
                Public Register (POST)
              </Button>
            </div>
          </div>

          {/* Private API Examples */}
          <div className="space-y-2">
            <Label className="text-lg font-semibold">Private API Calls</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
              <Button
                onClick={handlePrivateGet}
                disabled={loading}
                variant="default"
              >
                Get Profile (GET)
              </Button>
              <Button
                onClick={handlePrivatePost}
                disabled={loading}
                variant="default"
              >
                Update (POST)
              </Button>
              <Button
                onClick={handlePrivatePut}
                disabled={loading}
                variant="default"
              >
                Update (PUT)
              </Button>
              <Button
                onClick={handlePrivateDelete}
                disabled={loading}
                variant="destructive"
              >
                Delete (DELETE)
              </Button>
            </div>
          </div>

          {/* Response Display */}
          {(response || error) && (
            <div className="space-y-2">
              <Label className="text-lg font-semibold">
                {error ? "Error" : "Response"}
              </Label>
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border">
                <pre className="text-xs overflow-auto">
                  {error
                    ? JSON.stringify({ error }, null, 2)
                    : JSON.stringify(response, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Public API Calls:</h3>
            <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-auto">
{`import { publicApiPost, publicApiCall } from "@/lib/api";

// POST request
const data = await publicApiPost("/auth/login", {
  email: "user@example.com",
  password: "password",
  role: "customer"
});

// GET request
const data = await publicApiCall("/public/endpoint");`}
            </pre>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Private API Calls:</h3>
            <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-auto">
{`import { 
  privateApiCall, 
  privateApiPost, 
  privateApiPut, 
  privateApiDelete,
  setAuthToken 
} from "@/lib/api";

// Set token after login
setAuthToken(response.token);

// GET request (token automatically included)
const profile = await privateApiCall("/users/profile");

// POST request
const result = await privateApiPost("/users/update", { name: "John" });

// PUT request
const updated = await privateApiPut("/users/1", { name: "Jane" });

// DELETE request
await privateApiDelete("/users/1");`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

