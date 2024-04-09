import { useContext, useEffect, useRef, useState, Dispatch, RefObject } from "react";
import { PageID, PanelID } from "../types/workspaceTypes";
import { WorkspacePropsContext, WorkspaceActionContext, WorkspaceConfigContext, WorkspaceDragPropsContext } from "../WorkspaceContainer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleDown, faEllipsis, } from "@fortawesome/free-solid-svg-icons";
import { SplitBottom, SplitLeft, SplitRight, SplitTop } from "./svgIcons/panelSplitIcons";
import { PanelPageTab } from "./panelPageTab";
import { useDragEdgeScroll } from "../hooks/useDragEdgeScroll";
import { PanelDropDownPageList } from "./panelDropDownPageList";
import { useDragDropTarget } from "../hooks/useDragDropTarget";

export function PanelTopBar({ panelID }: { panelID: PanelID }) {
    const workspaceProps = useContext(WorkspacePropsContext);
    const workspaceAction = useContext(WorkspaceActionContext);
    const config = useContext(WorkspaceConfigContext);
    const workspaceDragProps = useContext(WorkspaceDragPropsContext);
    const [isPanelMenuOpen, setIsPanelMenuOpen] = useState<boolean>(false);
    const [isDropDownPageListOpen, setIsDropDownPageListOpen] = useState<boolean>(false);
    const [isDragOverEmptyArea, setIsDragOverEmptyArea] = useState(false);

    const pageTabListContainerRef = useRef<HTMLDivElement>(null);

    useDragEdgeScroll(workspaceDragProps!.draggedData, pageTabListContainerRef.current!, config!.dragConfig);

    const dragEnterCallback = (_e: MouseEvent,) => {
        setIsDragOverEmptyArea(true);
    }
    const dragLeaveCallback = (_e: MouseEvent,) => {
        setIsDragOverEmptyArea(false);
    }
    const dragOverCallback = (_e: MouseEvent)=>{}
    const dropCallback = (_e: MouseEvent)=>{
        const orgPanelID = workspaceDragProps!.draggedData!.panelID;
        const draggedPageID = workspaceDragProps!.draggedData!.pageID;
        workspaceDragProps!.setDraggedData(null);
        workspaceAction!.movePage(orgPanelID, panelID, draggedPageID);
    }
    const isMouseOverEmptyArea = (e: MouseEvent, elementRef: RefObject<HTMLElement>) =>{
        const parentRect = elementRef.current!.getBoundingClientRect();
        const lastChildRect = elementRef.current!.lastElementChild!.getBoundingClientRect();
        const parentXEnd = parentRect.x + parentRect.width;
        const lastChildXEnd = lastChildRect.x + lastChildRect.width;

        // if the last child is not fully visible, no empty area exists
        if ( lastChildXEnd > parentXEnd) return false;

        return lastChildXEnd < e.clientX && e.clientX < parentXEnd && parentRect.y < e.clientY && e.clientY < parentRect.y + parentRect.height;
    }

    useDragDropTarget(workspaceDragProps!.draggedData, pageTabListContainerRef, dragEnterCallback, dragOverCallback, dragLeaveCallback, dropCallback, isMouseOverEmptyArea);

    // if focused content is changed, scroll to show the focused tab
    useEffect(() => {
        if (workspaceProps!.panelFocusReference[panelID]) {
            scrollToFocusedTab(pageTabListContainerRef, workspaceProps!.panelFocusReference[panelID]);
        }

    }, [workspaceProps!.panelFocusReference[panelID]]);

    // reset drop target states when drag is over
    useEffect(() => {
        if (!workspaceDragProps!.draggedData) setIsDragOverEmptyArea(false);
    }, [workspaceDragProps!.draggedData]);

    // render tabs
    const pageIDList = workspaceProps!.panelPageListReference[panelID];
    let pageTabJSXList = [];
    for (let pageID of pageIDList) {
        pageTabJSXList.push(<PanelPageTab pageID={pageID} panelID={panelID} key={pageID}></PanelPageTab>);
    }

    const panelMenuButtonRef = useRef<HTMLButtonElement>(null);
    const panelMenuButton = <button className={`w-10 flex border-l border-foreground-low-2 relative ${isPanelMenuOpen?"text-foreground-high-1 bg-background-high-1 hover:text-foreground-high-2 hover:bg-background-high-2":"text-foreground-low-1 bg-background-low-1 hover:text-foreground-high-1 hover:bg-background-high-1"}`} onClick={() => { setIsPanelMenuOpen((x) => !x) }} ref={panelMenuButtonRef}>
        <FontAwesomeIcon className='m-auto' icon={faEllipsis} />
    </button>;

    const pageListDropDownButtonRef = useRef<HTMLButtonElement>(null);
    const panelTabListButton = <button className={`w-10 flex border-l border-foreground-low-2 relative ${isDropDownPageListOpen?"text-foreground-high-1 bg-background-high-1 hover:text-foreground-high-2 hover:bg-background-high-2":"text-foreground-low-1 bg-background-low-1 hover:text-foreground-high-1 hover:bg-background-high-1"}`} onClick={() => { setIsDropDownPageListOpen((x) => !x) }} ref={pageListDropDownButtonRef}>
        <FontAwesomeIcon className='m-auto' icon={faAngleDown} />
    </button>;

    return (
        <div className="flex flex-row h-10 flex-shrink-0 flex-grow-0 bg-background-low-1 relative w-full max-w-full z-40" onMouseDownCapture={(e)=>{e.preventDefault()}}>
            <div className="h-10 flex-shrink-0 relative" style={{ width: "calc(100% - 5rem)" }} >
                <div className={`overflow-x-hidden flex-wrap flex flex-col content-start relative h-full ${workspaceDragProps!.draggedData && isDragOverEmptyArea ? "bg-background-high-2" : ""}`} onWheelCapture={(e)=>{pageTabListScrollHandler(e.nativeEvent, pageTabListContainerRef)}} ref={pageTabListContainerRef}>
                    {pageTabJSXList}
                </div>
            </div>
            {panelTabListButton}
            {panelMenuButton}
            <PanelDropDownMenu panelID={panelID} isPanelMenuOpen={isPanelMenuOpen} setIsPanelMenuOpen={setIsPanelMenuOpen} panelMenuButtonRef={panelMenuButtonRef!} />
            <PanelDropDownPageList panelID={panelID} isDropDownListOpen={isDropDownPageListOpen} setIsDropDownListOpen={setIsDropDownPageListOpen} dropDownButtonRef={pageListDropDownButtonRef!} scrollToFocusedTab={()=>{scrollToFocusedTab(pageTabListContainerRef, workspaceProps!.panelFocusReference[panelID])}}/>
        </div>
    );
}

function PanelDropDownMenu({ panelID, isPanelMenuOpen, setIsPanelMenuOpen, panelMenuButtonRef }: { panelID: PanelID, isPanelMenuOpen: boolean, setIsPanelMenuOpen: Dispatch<boolean>, panelMenuButtonRef: RefObject<HTMLButtonElement> }) {
    const workspaceAction = useContext(WorkspaceActionContext);
    const selfRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const closeMenu = (event: MouseEvent) => {
            const menuElement = selfRef.current!;
            const menuButtonElement = panelMenuButtonRef.current!;
            if (!menuElement.contains(event.target as HTMLElement) && !menuButtonElement.contains(event.target as HTMLElement)) setIsPanelMenuOpen(false)
        };
        if (isPanelMenuOpen) {
            document.addEventListener("mousedown", closeMenu);
            return () => {
                document.removeEventListener("mousedown", closeMenu);
            }
        }
    }, [isPanelMenuOpen]);

    return <div className={`flex-col absolute border shadow bg-background border-background-low-2 rounded top-10 right-0 w-52 overflow-hidden ${isPanelMenuOpen ? "flex" : "hidden"}`} ref={selfRef}>
        <button type="button" className="flex px-2 h-10 bg-background text-foreground hover:text-foreground-high-1 hover:bg-background-high-1" onClick={() => { setIsPanelMenuOpen(false); workspaceAction!.createNewPageInPanel(panelID) }}>
            <SplitLeft className="my-auto h-4 w-4" color={"var(--foreground-low-2)"} />
            <span className="my-auto mr-auto ml-2">Create a New Tab</span>
        </button>
        <hr className="border-foreground-low-2"></hr>
        <button type="button" className="flex px-2 h-10 bg-background text-foreground hover:text-foreground-high-1 hover:bg-background-high-1" onClick={(e) => { setIsPanelMenuOpen(false); workspaceAction!.createNewDivision(panelID, "horizontal", "before"); e.stopPropagation() }}>
            <SplitLeft className="my-auto h-4 w-4" color={"var(--foreground-low-2)"} />
            <span className="my-auto mr-auto ml-2">Split Panel Left</span>
        </button>
        <button type="button" className="flex px-2 h-10 bg-background text-foreground hover:text-foreground-high-1 hover:bg-background-high-1" onClick={(e) => { setIsPanelMenuOpen(false); workspaceAction!.createNewDivision(panelID, "horizontal", "after"); e.stopPropagation() }}>
            <SplitRight className="my-auto h-4 w-4" color={"var(--foreground-low-2)"} />
            <span className="my-auto mr-auto ml-2">Split Panel Right</span>
        </button>
        <button type="button" className="flex px-2 h-10 bg-background text-foreground hover:text-foreground-high-1 hover:bg-background-high-1" onClick={(e) => { setIsPanelMenuOpen(false); workspaceAction!.createNewDivision(panelID, "vertical", "before"); e.stopPropagation() }}>
            <SplitTop className="my-auto h-4 w-4" color={"var(--foreground-low-2)"} />
            <span className="my-auto mr-auto ml-2">Split Panel Top</span>
        </button>
        <button type="button" className="flex px-2 h-10 bg-background text-foreground hover:text-foreground-high-1 hover:bg-background-high-1" onClick={(e) => { setIsPanelMenuOpen(false); workspaceAction!.createNewDivision(panelID, "vertical", "after"); e.stopPropagation() }}>
            <SplitBottom className="my-auto h-4 w-4" color={"var(--foreground-low-2)"} />
            <span className="my-auto mr-auto ml-2">Split Panel bottom</span>
        </button>
    </div>;
}

function pageTabListScrollHandler(event: WheelEvent, containerElementRef: RefObject<HTMLDivElement>) {
    const containerElement = containerElementRef.current!;
    event.stopImmediatePropagation();
    if (event.deltaX) {
        containerElement.scrollBy({
            top: 0,
            left: event.deltaX,
            behavior: "instant",
        });
    }
    else {
        containerElement.scrollBy({
            top: 0,
            left: event.deltaY / 2,
            behavior: "instant",
        });
    }
}

function getFullyVisibleDelta(tabElement: HTMLDivElement, containerElement: HTMLDivElement) {
    const tabRect = tabElement.getBoundingClientRect();
    const containerRect = containerElement.getBoundingClientRect();

    return [containerRect.x - tabRect.x, (tabRect.x + tabRect.width) - (containerRect.x + containerRect.width)]
}

function scrollToFocusedTab(tabListContainerRef: RefObject<HTMLDivElement>, focusedPageID: PageID) {
    const focusedTabElement = document.getElementById(`${focusedPageID}-pageTab`)! as HTMLDivElement;
    const [beforeDelta, afterDelta] = getFullyVisibleDelta(focusedTabElement, tabListContainerRef.current!);

    if (beforeDelta > 0) {
        tabListContainerRef.current!.scrollBy({
            top: 0,
            left: -beforeDelta,
            behavior: "instant",
        });
        return;
    }
    if (afterDelta > 0) {
        if (afterDelta < (-beforeDelta)) tabListContainerRef.current!.scrollBy({
            top: 0,
            left: afterDelta,
            behavior: "instant",
        });
        else tabListContainerRef.current!.scrollBy({
            top: 0,
            left: -beforeDelta,
            behavior: "instant",
        });
        return;
    }
}