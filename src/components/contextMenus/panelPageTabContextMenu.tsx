import { useContext } from "react";
import { WorkspaceActionContext, WorkspaceConfigContext, WorkspaceDragPropsContext, WorkspaceInterfaceContext, WorkspacePropsContext, WorkspaceUtilityContext } from "../../WorkspaceContainer";
import { PageData, PageID, WorkspaceAction, WorkspaceUtility } from "../../types/workspaceTypes";
import { faArrowLeft, faArrowRight, faArrowRightArrowLeft, faLock, faLockOpen, faUpDownLeftRight, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { getClosePageSingleActionHandler } from "../panelPageTab";
import { CloseOtherPagesConfirmation } from "../modalComponents/confirmation";
import { useClickDrag } from "../../hooks/useClickDrag";

// used by other functions to calculate context menu dimension
// when adding new items to context menu, be sure to update this array!!!
export const PANEL_PAGE_TAB_CONTEXT_MENU_ITEMS = [
    [
        { key: "close" },
        { key: "closeOther" },
        { key: "closeLeft" },
        { key: "closeRight" },
    ],
    [
        { key: "move" },
    ],
    [
        { key: "lockControl" }
    ]
];

export function PanelPageTabContextMenu({ pageID }: { pageID: PageID }) {
    const workspaceProps = useContext(WorkspacePropsContext);
    const workspaceConfig = useContext(WorkspaceConfigContext);
    const workspaceAction = useContext(WorkspaceActionContext);
    const workspaceUtility = useContext(WorkspaceUtilityContext);
    const workspaceDragProps = useContext(WorkspaceDragPropsContext);
    const workspaceInterface = useContext(WorkspaceInterfaceContext);

    const pageData = workspaceProps!.pageDataReference[pageID];

    function getCloseOtherPagesAction(workspaceAction: WorkspaceAction, workspaceUtility: WorkspaceUtility, pageData: PageData, direction: "left" | "right" | "both") {
        return () => {
            workspaceUtility!.modalInterfaceRef.current!.showModalWithData!({ innerComponent: <CloseOtherPagesConfirmation dismissCallback={workspaceUtility!.modalInterfaceRef.current!.hideModal!} closeOtherPagesCallback={(pageData, closeDirection) => { workspaceAction!.closeOtherPagesInPanel(pageData.parentPanelID, pageData.pageID, closeDirection); }} initiatePageData={pageData} closeDirection={direction} /> })
        };
    }

    const movePageStartCallback = (e: MouseEvent) => {
        workspaceDragProps!.setWorkspaceMask("workspace");
        workspaceDragProps!.setDraggedData({ type: "tab", panelID: pageData.parentPanelID, pageID: pageData.pageID, startPosition: e })
    }

    const movePageEndCallback = (_e: MouseEvent) => {
        workspaceDragProps!.setWorkspaceMask(null);
        workspaceDragProps!.setDraggedData(null);
    }

    const clickMovePageHandler = useClickDrag(movePageStartCallback, movePageEndCallback);

    const menuItemProps = {
        close: { icon: faXmark, label: `Close Page${pageData.locked ? " (Page locked)" : ""}`, action: getClosePageSingleActionHandler(workspaceAction!, workspaceUtility!, pageData), disabled: pageData.locked ? true : false },
        closeOther: { icon: faArrowRightArrowLeft, label: "Close Other Pages in Panel", action: getCloseOtherPagesAction(workspaceAction!, workspaceUtility!, pageData, "both"), disabled: false },
        closeLeft: { icon: faArrowLeft, label: "Close Pages to the Left", action: getCloseOtherPagesAction(workspaceAction!, workspaceUtility!, pageData, "left"), disabled: false },
        closeRight: { icon: faArrowRight, label: "Close Pages to the Right", action: getCloseOtherPagesAction(workspaceAction!, workspaceUtility!, pageData, "right"), disabled: false },
        move: { icon: faUpDownLeftRight, label: "Move Page", action: (e: React.MouseEvent) => { clickMovePageHandler(e.nativeEvent) }, disabled: false },
        lockControl: { icon: pageData.locked ? faLockOpen : faLock, label: pageData.locked ? "Unlock Page" : "Lock Page", action: () => { workspaceAction!.togglePageLock(pageData.pageID) }, disabled: false },
    }

    const contextMenuItemDimensions = {
        height: `${workspaceConfig!.contextMenuConfig.panelPageTab.itemHeightRem}rem`,
        width: `${workspaceConfig!.contextMenuConfig.panelPageTab.itemWidthRem}rem`,
    };

    const menuItems = [];
    for (const group of PANEL_PAGE_TAB_CONTEXT_MENU_ITEMS) {
        for (const item of group) {
            let itemProps = menuItemProps[item.key as keyof typeof menuItemProps];

            menuItems.push(
                <button key={item.key} className={`${itemProps.disabled ? "text-foreground-low-2 cursor-not-allowed" : "text-foreground hover:text-foreground-high-1 hover:bg-background-high-2"} flex flex-row px-2 flex-shrink-0 overflow-x-hidden`} type="button" style={contextMenuItemDimensions} onClick={itemProps.action} disabled={itemProps.disabled}>
                    <FontAwesomeIcon className="my-auto mr-2 w-3 h-3 flex-shrink-0" icon={itemProps.icon} />
                    <p className="my-auto text-nowrap">{itemProps.label}</p>
                </button>
            );
        }
        menuItems.push(<hr key={group[0].key + "hr"} className="border-background-low-2" />);
    }
    if (pageData.customContextMenuItems) {
        for (const item of pageData.customContextMenuItems) {
            menuItems.push(
                <button key={"custom-"+item.key} className={`${item.disabled ? "text-foreground-low-2 cursor-not-allowed" : "text-foreground hover:text-foreground-high-1 hover:bg-background-high-2"} flex flex-row px-2 flex-shrink-0 overflow-x-hidden`} type="button" style={contextMenuItemDimensions} onClick={() => { item.action(workspaceInterface!, pageID) }} disabled={item.disabled}>
                    {item.icon ? <FontAwesomeIcon className="my-auto mr-2 w-3 h-3 flex-shrink-0" icon={item.icon} /> : <div className="my-auto mr-2 w-3 h-3 flex-shrink-0"></div>}
                    <p className="my-auto text-nowrap">{item.label}</p>
                </button>
            );
        }
    }
    else menuItems.pop(); // remove the last divider

    const contextMenuWidthRem = workspaceConfig!.contextMenuConfig.panelPageTab.itemWidthRem;
    return (
        <div className="flex flex-col text-sm" style={{ width: `${contextMenuWidthRem}rem` }}>
            {menuItems}
        </div>
    )
}