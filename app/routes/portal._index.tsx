import { redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return redirect("/portal/dashboard");
};

export default function PortalIndex() {
  return null;
}
