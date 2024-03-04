import { createContext } from "react";
import { WorkspaceUtility, WorkspaceProps, WorkspaceHandler, WorkspaceConfig } from "../types/workspaceTypes";


export const WorkspaceUtilityContext = createContext<WorkspaceUtility | null>(null);
export const WorkspacePropsContext = createContext<WorkspaceProps | null>(null);
export const WorkspaceHandlerContext = createContext<WorkspaceHandler | null>(null);
export const WorkspaceConfigContext = createContext<WorkspaceConfig | null>(null);
