import { useRouteLoaderData } from "react-router";
import {
  profileHomePath,
  profileProjectPath,
  profileProjectsAnchor,
  profileSectionPath,
} from "./profileHost";

type RootLoaderData = {
  profileSubdomain?: boolean;
};

export function useProfilePaths() {
  const root = useRouteLoaderData("root") as RootLoaderData | undefined;
  const isSubdomain = root?.profileSubdomain ?? false;

  return {
    isSubdomain,
    home: profileHomePath(isSubdomain),
    section: (sectionId: string) => profileSectionPath(isSubdomain, sectionId),
    project: (slug: string) => profileProjectPath(isSubdomain, slug),
    projectsAnchor: profileProjectsAnchor(isSubdomain),
  };
}
