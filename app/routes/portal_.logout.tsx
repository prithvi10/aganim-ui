import type { ActionFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { buildClearCookie } from "../utils/portal-auth.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  return redirect("/portal/login", {
    headers: { "Set-Cookie": buildClearCookie() },
  });
};
