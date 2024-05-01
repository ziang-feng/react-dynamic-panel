import { getMaxSubPanelCount, getRemPxSize, getTrueProportionList } from "../functions/utility";
import { PanelID } from "../types/workspaceTypes";
import { WorkspacePropsContext, WorkspaceConfigContext, WorkspaceDragPropsContext, WorkspaceActionContext } from "../WorkspaceContainer";
import { MouseEvent, useContext, useRef } from 'react';
import useMouseDownMask from "../hooks/useMouseDownMask";

export function PanelResizeHandle({ panelID, handleIndex, panelRef}: { panelID: PanelID, handleIndex: number, panelRef: React.RefObject<HTMLDivElement | null>}) {
    const workspaceAction = useContext(WorkspaceActionContext);
    const workspaceProps = useContext(WorkspacePropsContext);
    const workspaceConfig = useContext(WorkspaceConfigContext);
    const workspaceDragProps = useContext(WorkspaceDragPropsContext);
    const correctedPanelTotalDim = useRef<number>();
    const resizeStartClientXY = useRef<number>();
    const resizeStartProportionList = useRef<number[]>();
    const beforeDeltaMax = useRef<number>();
    const afterDeltaMax = useRef<number>();

    const mouseDownMaskHandler = useMouseDownMask(document, workspaceDragProps!);

    const divisionDirection = workspaceProps!.panelDivisionReference[panelID].divisionDirection;

    function mousemoveHandler(event: MouseEventInit) {
        const delta = (divisionDirection == "horizontal" ? event.clientX! : event.clientY!) - resizeStartClientXY.current!;
        const deltaTotalDimPercentage = 100 * delta / correctedPanelTotalDim.current!;
        workspaceAction!.resizePanelDivision(panelID, handleIndex, resizeStartProportionList.current!, deltaTotalDimPercentage, [-beforeDeltaMax.current!, afterDeltaMax.current!]);
    }

    function mousedownHandler(event: MouseEvent) {
        if (event.button != 0) return; // only left click
        event.preventDefault();
        mouseDownMaskHandler();
        // set the resize bounds
        // get the max number of sub panels in split direction for the before and after panels
        const beforePanelID = workspaceProps!.panelDivisionReference[panelID].subPanelIDList[handleIndex];
        const afterPanelID = workspaceProps!.panelDivisionReference[panelID].subPanelIDList[handleIndex + 1];
        const beforePanelMaxSubCount = getMaxSubPanelCount(beforePanelID, divisionDirection, workspaceProps!.panelDivisionReference);
        const afterPanelMaxSubCount = getMaxSubPanelCount(afterPanelID, divisionDirection, workspaceProps!.panelDivisionReference);

        // get the min dimension based on the max number of subpanels and handles
        const remPxSize = getRemPxSize(document);
        const panelMinimumDimensionRem = divisionDirection == "horizontal"? workspaceConfig!.panelMinimumDimensionRem.width : workspaceConfig!.panelMinimumDimensionRem.height;
        const beforePanelMinDim = remPxSize * (beforePanelMaxSubCount * panelMinimumDimensionRem + (beforePanelMaxSubCount - 1) * workspaceConfig!.panelResizeHandleSizeRem);
        const afterPanelMinDim = remPxSize * (afterPanelMaxSubCount * panelMinimumDimensionRem + (afterPanelMaxSubCount - 1) * workspaceConfig!.panelResizeHandleSizeRem);

        // get the current dimension of before and after panel
        const panelElement = panelRef.current!;
        const beforePanelElement = panelElement.children[handleIndex * 2];
        const afterPanelElement = panelElement.children[handleIndex * 2 + 2];
        const beforePanelCurrentDim = divisionDirection == "horizontal" ? beforePanelElement.getBoundingClientRect().width : beforePanelElement.getBoundingClientRect().height;
        const afterPanelCurrentDim = divisionDirection == "horizontal" ? afterPanelElement.getBoundingClientRect().width : afterPanelElement.getBoundingClientRect().height;

        // get proportion change delta range
        const panelTotalDim = divisionDirection == "horizontal" ? panelElement.getBoundingClientRect().width : panelElement.getBoundingClientRect().height;

        correctedPanelTotalDim!.current = panelTotalDim - (workspaceProps!.panelDivisionReference[panelID].subPanelIDList.length - 1) * workspaceConfig!.panelResizeHandleSizeRem * remPxSize;

        beforeDeltaMax.current = 100 * (beforePanelCurrentDim <= beforePanelMinDim ? 0 : (beforePanelCurrentDim - beforePanelMinDim) / correctedPanelTotalDim.current);
        afterDeltaMax.current = 100 * (afterPanelCurrentDim <= afterPanelMinDim ? 0 : (afterPanelCurrentDim - afterPanelMinDim) / correctedPanelTotalDim.current);

        resizeStartClientXY.current = divisionDirection == "horizontal" ? event.clientX! : event.clientY!;
        resizeStartProportionList.current = getTrueProportionList(workspaceProps!.panelDivisionReference[panelID], workspaceConfig!.panelResizeHandleSizeRem);
        document.addEventListener("mousemove", mousemoveHandler);
        document.addEventListener("mouseup", mouseupHandler);
        document.documentElement.style.cursor = divisionDirection == "horizontal" ? "col-resize" : "row-resize";
    }

    function mouseupHandler(_event: MouseEventInit) {
        document.removeEventListener("mousemove", mousemoveHandler);
        document.removeEventListener("mouseup", mouseupHandler);
        document.documentElement.style.cursor = "";
    }
    const dimension = divisionDirection == "horizontal" ? { width: `${workspaceConfig!.panelResizeHandleSizeRem}rem` } : { height: `${workspaceConfig!.panelResizeHandleSizeRem}rem` };
    return (
        <div className={`${divisionDirection == "horizontal" ? "h-full w-1 cursor-col-resize" : "w-full h-1 cursor-row-resize"} bg-foreground-low-2 opacity-40 hover:opacity-70 active:opacity-100 flex-shrink-0`} onMouseDown={mousedownHandler} style={dimension}></div>
    )
}