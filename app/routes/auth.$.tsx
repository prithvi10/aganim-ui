import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  console.log("[🔍 Trail] 📥 Auth Callback Hit! Shopify returned the user.");
  
  try {
    // This function completes the OAuth flow and SAVES the session to Prisma
    await authenticate.admin(request);
    
    console.log("[🔍 Trail] ✅ Session Saved to DB. Redirecting to App...");
    return null; 
  } catch (error) {
    console.error("[🔍 Trail] 💥 Auth Callback Failed:", error);
    throw error;
  }
};