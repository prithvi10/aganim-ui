import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  console.log("[🔍 Trail] 📥 Auth Callback Hit! Exchanging codes...");
  
  try {
    // This completes OAuth and saves the session.
    // SUCCESS BEHAVIOR: It THROWS a response (Redirect or 200 OK script) to the browser.
    await authenticate.admin(request);
    
    // This line is rarely reached because the line above throws.
    return null; 
  } catch (error) {
    // 1. Check if the "error" is actually a Successful Remix Response
    if (error instanceof Response) {
      const status = error.status;
      // Status 200 = OK (Exit Iframe Script), 302 = Redirect
      if (status === 200 || status === 302) {
         console.log(`[🔍 Trail] ✅ Auth Success! Shopify is redirecting via (Status: ${status}).`);
         // We must THROW this response so the browser receives it and moves to the app.
         throw error;
      }
    }
    
    // 2. Real Errors (DB connection failed, Invalid secrets, etc.)
    console.error("[🔍 Trail] 💥 CRITICAL: Real Auth Callback Error:", error);
    throw error;
  }
};