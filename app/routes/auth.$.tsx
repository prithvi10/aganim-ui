import type { LoaderFunctionArgs } from "react-router";
import { authenticate, sessionStorage } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  console.log("[🔍 Trail] 📥 Auth Callback Hit! Processing...");

  try {
    // 1. Complete the OAuth Handshake
    await authenticate.admin(request);
    
    // Code below is usually unreachable because authenticate() throws a redirect.
    return null;

  } catch (error) {
    // 2. Intercept the Success Response
    if (error instanceof Response) {
      const url = new URL(request.url);
      const shop = url.searchParams.get("shop");
      
      if (shop) {
        // 3. PROOF OF LIFE: Check DB immediately
        console.log(`[🔍 Trail] 🕵️ Checking DB for session: ${shop}...`);
        const sessions = await sessionStorage.findSessionsByShop(shop);
        
        if (sessions.length === 0) {
            console.error("[🔍 Trail] 🚨 CRITICAL FAILURE: Auth succeeded but NO session found in DB!");
            console.error("[🔍 Trail] 🚨 Check your Prisma Schema and Database Connection.");
        } else {
            console.log(`[🔍 Trail] ✅ SUCCESS: Found ${sessions.length} sessions in DB.`);
            const offline = sessions.find(s => !s.isOnline);
            console.log(`[🔍 Trail] 🔑 Offline Token Status: ${offline ? "Present" : "MISSING"}`);
        }
      }
      
      // 4. Proceed with the redirect
      throw error;
    }
    
    // Real errors
    console.error("[🔍 Trail] 💥 Auth Error:", error);
    throw error;
  }
};