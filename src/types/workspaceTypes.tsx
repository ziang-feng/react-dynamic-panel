import { Dispatch, FC } from "react";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { ModalData } from "./modalTypes";


export interface WorkspaceUtility {
    setActivePanelID: Dispatch<string>;
    setPageDataReference: Dispatch<PageDataReference>;
    setPanelPositionReference: Dispatch<PanelPositionReference>;
    setPanelFocusReference: Dispatch<PanelFocusReference>;
    setPanelDivisionReference: Dispatch<PanelDivisionReference>;
    setPanelPageListReference: Dispatch<PanelPageListReference>;
    setDraggedData: Dispatch<DraggedData|null>;
    showModalWithData?: (modalData: ModalData) => void
}

export interface WorkspaceProps {
    activePanelID: PanelID;
    pageDataReference: PageDataReference;
    panelPositionReference: PanelPositionReference;
    panelFocusReference: PanelFocusReference;
    panelDivisionReference: PanelDivisionReference;
    panelPageListReference: PanelPageListReference;
    topPanelID: PanelID;
    draggedData: DraggedData|null;
    dragPositionRef?: React.MutableRefObject<{ x: number; y: number; }>;
    resizeObserver?: ResizeObserver;
    manualResizeFlagRef?: React.MutableRefObject<boolean>;
}

export interface WorkspaceHandler {
    createNewPageInPanel: (panelID: PanelID, newPageData?: PageData, afterPageID?: PageID) => void;
    createNewSplit: (initiatePanelID: PanelID, divisionDirection: DivisionDirection, newPanelPosition: "after" | "before", movedPageID?: PageID) => void;
    closePageInPanel: (panelID: PanelID, pageID: PageID) => void;
    focusPageInPanel: (panelID: PanelID, pageID: PageID) => void;
    movePageToPanel: (orgPanelID: PanelID, targetPanelID: PanelID, pageID: PageID, targetPositionPageID: PageID | null, relativePosition:"before"|"after") => void;
    movePageInPanel: (panelID: PanelID, pageID: PageID, targetPositionPageID: PageID | null, relativePosition:"before"|"after") => void;
}

export interface WorkspaceConfig {
    panelMinimumDimensionRem: { height: number, width: number },
    panelResizeHandleSizeRem: number,
    dragOption: DragOption
}

export interface DragOption {
    edgeScrollActiveWidthRem: number,
    edgeScrollMinSpeed: number,
    edgeScrollMaxSpeed: number,
    dropSplitActivationPriority: "x"|"y",
    dropSplitActivationPercentage:{
        x:number,
        y:number,
    }
}

export type WorkspaceID = string;
export type PanelID = string;
export type PageID = string;

export interface PageData {
    pageID: PageID;
    name: string;
    icon?: IconDefinition;
    component: FC;
    parentPanelID: PanelID;
    persist: boolean;
    preservedState?: any;
    props?: any;
}
;
export interface PanelPosition {
    panelID: PanelID;
    x: number;
    y: number;
    width: number;
    height: number;
}
export interface PanelDivision {
    panelID: PanelID;
    subPanelIDList: PanelID[];
    divisionDirection: DivisionDirection;
    divisionProportionList: number[];
}
export type PageDataReference = { [key: PageID]: PageData; };
export type PanelPositionReference = { [key: PanelID]: PanelPosition; };
export type PanelFocusReference = { [key: PanelID]: PageID; };
export type PanelDivisionReference = { [key: PanelID]: PanelDivision; };
export type PanelPageListReference = { [key: PanelID]: PageID[]; };

export type DivisionDirection = "horizontal" | "vertical" | null;

export type DraggedData = {
    type: "tab",
    panelID: PanelID,
    pageID: PageID
}