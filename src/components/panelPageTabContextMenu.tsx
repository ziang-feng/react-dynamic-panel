import { useContext } from "react";
import { WorkspaceConfigContext } from "../WorkspaceContainer";
import { ContextMenuDisplayState, PageID } from "../types/workspaceTypes";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

// used when determining the dimensions of the context menu for rendering
// this need to be updated manually when new items and/or groups are added
// DOUBLE CHECK THIS WHEN UPDATING CODE !!!
export const PANEL_PAGE_TAB_CONTEXT_MENU_DEFAULT_ITEM_COUNT = 1;
export const PANEL_PAGE_TAB_CONTEXT_MENU_DEFAULT_GROUP_COUNT = 1;

export function PanelPageTabContextMenu({ pageID, contextMenuDisplayState }: { pageID: PageID, contextMenuDisplayState: ContextMenuDisplayState }) {
    const workspaceConfig = useContext(WorkspaceConfigContext);

    const menuItemDimensionRem = {
        height: `${workspaceConfig!.panelPageTabConfig.contextMenuItemHeightRem}rem`,
        width: `${workspaceConfig!.panelPageTabConfig.contextMenuWidthRem}rem`
    }

    const menuItems = [];
    
    menuItems.push(
        <button key="closeTab" className="w-full hover:bg-background-high-2" style={menuItemDimensionRem} onClick={() => { console.log("Close page") }}>
            <div className="flex flex-row my-auto mx-2 overflow-hidden">
                <FontAwesomeIcon className="my-auto mr-2" icon={faXmark} />
                <p className="my-auto text-nowrap">Close Page</p>
            </div>
        </button>
    );
    menuItems.push(
        <button key="closeOtherTab" className="w-full hover:bg-background-high-2" style={menuItemDimensionRem} onClick={() => { console.log("Close other page") }}>
            <div className="flex flex-row my-auto mx-2 overflow-hidden">
                <FontAwesomeIcon className="my-auto mr-2" icon={faXmark} />
                <p className="my-auto text-nowrap">Close Other Pages in Panel</p>
            </div>
        </button>
    );
    menuItems.push(
        <button key="closeTabLeft" className="w-full hover:bg-background-high-2" style={menuItemDimensionRem} onClick={() => { console.log("Close left page") }}>
            <div className="flex flex-row my-auto mx-2 overflow-hidden">
                <FontAwesomeIcon className="my-auto mr-2" icon={faXmark} />
                <p className="my-auto text-nowrap">Close Pages to the Left</p>
            </div>
        </button>
    );
    menuItems.push(
        <button key="closeTabRight" className="w-full hover:bg-background-high-2" style={menuItemDimensionRem} onClick={() => { console.log("Close right page") }}>
            <div className="flex flex-row my-auto mx-2 overflow-hidden">
                <FontAwesomeIcon className="my-auto mr-2" icon={faXmark} />
                <p className="my-auto text-nowrap">Close Pages to the Right</p>
            </div>
        </button>
    );
    menuItems.push(
        <hr key="div1"/>
    );
    

    if (contextMenuDisplayState.visible) {
        return (
            <div className={`flex-col absolute border shadow bg-background border-background-low-2 rounded overflow-auto`}>
                {menuItems}
            </div>
        )
    }
    else {
        return null;
    }

}