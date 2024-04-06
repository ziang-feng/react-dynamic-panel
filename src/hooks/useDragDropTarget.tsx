import { DraggedData } from "../types/workspaceTypes";
import { RefObject, useEffect, useRef } from "react";
import { isMouseInElement, triggerMouseMoveOnWindow } from "../functions/utility";

export function useDragDropTarget(draggedData:DraggedData|null , elementRef: RefObject<HTMLElement>, dragEnterCallback: (e: MouseEvent) => void, dragOverCallback: (e: MouseEvent) => void, dragLeaveCallback: (e: MouseEvent) => void, dropCallback: (e: MouseEvent) => void, dropTargetMousePositionCheckOverride?: (e: MouseEvent, elementRef: RefObject<HTMLElement>) => boolean){
    const isPrevPositionInElementRef = useRef(false);

    const mouseMoveHandler = (e: MouseEvent) => {
        const isPrevPositionInElement = isPrevPositionInElementRef.current;
        const isCurrentPositionInElement = dropTargetMousePositionCheckOverride ?dropTargetMousePositionCheckOverride(e, elementRef) : isMouseInElement(e, elementRef.current!.getBoundingClientRect());
        if (!isPrevPositionInElement && isCurrentPositionInElement) {
            // if mouse enters element
            dragEnterCallback(e);
        }
        if (isPrevPositionInElement && !isCurrentPositionInElement) {
            // if mouse leaves element
            dragLeaveCallback(e);
        }
        if (isCurrentPositionInElement) {
            dragOverCallback(e);
        }
        isPrevPositionInElementRef.current = isCurrentPositionInElement;
    }

    const mouseUpCallback = (e: MouseEvent) => {
        const isDropValid = dropTargetMousePositionCheckOverride ? dropTargetMousePositionCheckOverride(e, elementRef) : isMouseInElement(e, elementRef.current!.getBoundingClientRect());
        if (isDropValid) {
            dropCallback(e);
        }
    }

    useEffect(() => {
        if (draggedData) {
            // reset isPrevPositionInElementRef
            isPrevPositionInElementRef.current = false

            // add event listeners
            window.addEventListener("mousemove", mouseMoveHandler, true);
            window.addEventListener("mouseup", mouseUpCallback, true);

            // trigger mousemove event; this will check mouse position and fire dragEnterCallback if necessary
            triggerMouseMoveOnWindow(draggedData.startPosition);
        }
        return () => {
            // remove event listeners
            window.removeEventListener("mousemove", mouseMoveHandler, true);
            window.removeEventListener("mouseup", mouseUpCallback, true);
        }
    }, [draggedData]);
}