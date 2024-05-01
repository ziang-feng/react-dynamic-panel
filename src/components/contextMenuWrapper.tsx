import { useContext, useEffect, useRef } from "react";
import { WorkspaceConfigContext, WorkspacePropsContext, WorkspaceUtilityContext } from "../WorkspaceContainer";
import { WorkspaceContextMenuState } from "../types/workspaceTypes";
import { getContextMenuHeightRem, getRemPxSize } from "../functions/utility";
import { PanelPageTabContextMenu } from "./contextMenus/panelPageTabContextMenu";

export function ContextMenuWrapper({ workspaceContextMenuState }: { workspaceContextMenuState: WorkspaceContextMenuState }) {
    const workspaceProps = useContext(WorkspacePropsContext);
    const workspaceConfig = useContext(WorkspaceConfigContext);
    const workspaceUtility = useContext(WorkspaceUtilityContext);

    const selfRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (workspaceContextMenuState.contextData) {
            const closeMenu = (event: MouseEvent) => {
                const menuElement = selfRef.current!;
                if (!menuElement.contains(event.target as HTMLElement)) workspaceUtility!.setWorkspaceContextMenuState({ ...workspaceContextMenuState, contextData: null });
            };
            document.addEventListener("mousedown", closeMenu);
            document.addEventListener("wheel", closeMenu);
            return () => {
                document.removeEventListener("mousedown", closeMenu);
                document.removeEventListener("wheel", closeMenu);
            }
        }
    }, [workspaceContextMenuState.contextData]);

    let wrapperDimensionStyle: React.CSSProperties = { display: "none" };
    if (workspaceContextMenuState.contextData != null) {
        const workspaceContainerRect = workspaceProps!.workspaceContainerRef!.current!.getBoundingClientRect();
        // based on the type of context menu, determine the height
        const contextMenuHeightRem = getContextMenuHeightRem(workspaceContextMenuState.contextData, workspaceProps!, workspaceConfig!);
        // also add border thickness to height and width
        const contextMenuHeight = (contextMenuHeightRem + 0.0625 * 2) * getRemPxSize(document);
        const contextMenuWidth = (workspaceConfig!.contextMenuConfig[workspaceContextMenuState.contextData.type].itemWidthRem + 0.0625 * 2) * getRemPxSize(document);

        // cap wrapper dimensions to not exceed workspace container dimensions
        const wrapperHeight = contextMenuHeight > workspaceContainerRect.height ? workspaceContainerRect.height : contextMenuHeight;
        const wrapperWidth = contextMenuWidth > workspaceContainerRect.width ? workspaceContainerRect.width : contextMenuWidth;

        // position the context menu wrapper based on the context menu anchor position
        let wrapperTop: number | undefined = undefined, wrapperLeft: number | undefined = undefined, wrapperBottom: number | undefined = undefined, wrapperRight: number | undefined = undefined;

        // determine the context menu anchor position based on the relative clearance of the workspace container
        // determine context menu anchor y position
        if (contextMenuHeight <= workspaceContextMenuState.relativeClearance.bottom) {
            // context menu can be displayed below the mouse
            wrapperTop = workspaceContextMenuState.relativeMousePosition.y;
        }
        else if (contextMenuHeight <= workspaceContextMenuState.relativeClearance.top) {
            // context menu can be displayed above the mouse
            wrapperTop = workspaceContextMenuState.relativeMousePosition.y - contextMenuHeight;
        }
        else {
            // context menu cannot be displayed above or below the mouse, anchor it from the bottom of the workspace container
            wrapperBottom = 0;
        }

        // determine context menu anchor x position
        if (contextMenuWidth <= workspaceContextMenuState.relativeClearance.right) {
            // context menu can be displayed to the right of the mouse
            wrapperLeft = workspaceContextMenuState.relativeMousePosition.x;
        }
        else if (contextMenuWidth <= workspaceContextMenuState.relativeClearance.left) {
            // context menu can be displayed to the left of the mouse
            wrapperLeft = workspaceContextMenuState.relativeMousePosition.x - contextMenuWidth;
        }
        else {
            // context menu cannot be displayed to the left or right of the mouse, anchor it from the right of the workspace container
            wrapperRight = 0;
        }

        // construct wrapper dimension style
        wrapperDimensionStyle = {
            height: `${wrapperHeight}px`,
            width: `${wrapperWidth}px`,
            top: wrapperTop !== undefined ? `${wrapperTop}px` : undefined,
            left: wrapperLeft !== undefined ? `${wrapperLeft}px` : undefined,
            bottom: wrapperBottom !== undefined ? `${wrapperBottom}px` : undefined,
            right: wrapperRight !== undefined ? `${wrapperRight}px` : undefined,
            position: "absolute",
            zIndex: 1000
        };

    }
    let contextMenu = null;
    if (workspaceContextMenuState.contextData?.type == "panelPageTab") {
        contextMenu = <PanelPageTabContextMenu pageID={workspaceContextMenuState.contextData.pageID} />;
    }

    return (
        <div className="border shadow rounded bg-background border-background-low-2 overflow-x-hidden overflow-y-auto" style={wrapperDimensionStyle} ref={selfRef} onClick={()=>{workspaceUtility!.setWorkspaceContextMenuState({ ...workspaceContextMenuState, contextData: null });}}>
            {contextMenu}
        </div>
    )
}