import { useContext } from "react";
import { WorkspaceConfigContext } from "../WorkspaceContainer";
import { ContextMenuDisplayState, PageID } from "../types/workspaceTypes";

// used when determining the dimensions of the context menu for rendering
// this need to be updated manually when new items and/or groups are added
// DOUBLE CHECK THIS WHEN UPDATING CODE !!!
export const PANEL_PAGE_TAB_CONTEXT_MENU_DEFAULT_ITEM_COUNT = 1;
export const PANEL_PAGE_TAB_CONTEXT_MENU_DEFAULT_GROUP_COUNT = 1;

export function PanelPageTabContextMenu({pageID, contextMenuDisplayState}:{pageID:PageID, contextMenuDisplayState:ContextMenuDisplayState}) {
    const workspaceConfig = useContext(WorkspaceConfigContext);

    const menuDimensionRem = {
        width: workspaceConfig!.panelPageTabConfig.contextMenuWidthRem,
        maxheight: workspaceConfig!.panelPageTabConfig.contextMenuItemHeightRem * PANEL_PAGE_TAB_CONTEXT_MENU_DEFAULT_ITEM_COUNT + 0.0625 * (PANEL_PAGE_TAB_CONTEXT_MENU_DEFAULT_GROUP_COUNT-1)
    }

    return (
        <div className={`flex-col absolute border shadow bg-background border-background-low-2 rounded top-10 right-0 w-52 overflow-hidden ${contextMenuDisplayState.visible ? "flex" : "hidden"}`}>
            <button className="w-full py-2 px-4 hover:bg-background-high-2" onClick={()=>{console.log("Close page")}}>Close Page</button>
        </div>
    )
}