import type { LoaderFunctionArgs } from "react-router";
import { authenticate, sessionStorage } from "../shopify.server";
import { trail, trailError } from "../utils/trail";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  trail("[🔍 Trail] 📥 Auth Callback Hit! Processing...");

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
        trail(`[🔍 Trail] 🕵️ Checking DB for session: ${shop}...`);
        const sessions = await sessionStorage.findSessionsByShop(shop);
        
        if (sessions.length === 0) {
            trailError("[🔍 Trail] 🚨 CRITICAL FAILURE: Auth succeeded but NO session found in DB!");
            trailError("[🔍 Trail] 🚨 Check your Prisma Schema and Database Connection.");
        } else {
            trail(`[🔍 Trail] ✅ SUCCESS: Found ${sessions.length} sessions in DB.`);
            const offline = sessions.find(s => !s.isOnline);
            trail(`[🔍 Trail] 🔑 Offline Token Status: ${offline ? "Present" : "MISSING"}`);
        }
      }
      
      // 4. Proceed with the redirect
      throw error;
    }
    
    // Real errors
    trailError("[🔍 Trail] 💥 Auth Error:", error);
    throw error;
  }
};