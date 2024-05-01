import { getMousePositionDelta, getRemPxSize, isPositionInElement } from "../functions/utility";
import { DragConfig } from "../types/workspaceTypes";
import { useRef } from "react";

export function useDrag(elementRef: React.RefObject<HTMLElement>, dragConfig:DragConfig, mouseDownCallback:(e: MouseEvent) => void, mouseUpCallback: (e: MouseEvent) => void, dragStartCallback: (e: MouseEvent) => void, dragEndCallback: (e: MouseEvent) => void) {
    // make the element draggable
    const originalPosition = useRef<{x: number, y: number}>({x: 0, y: 0});
    const detectDrag = (e: MouseEvent) => {
        const remPxSize = getRemPxSize(document);
        const positionDeltaPx = getMousePositionDelta(originalPosition.current, {x: e.clientX, y: e.clientY});
        const positionDeltaRem = positionDeltaPx / remPxSize;
        if (positionDeltaRem >= dragConfig.dragActivationThresholdRem && isPositionInElement(e, elementRef.current!.getBoundingClientRect())) {
            dragStartCallback(e);
            window.removeEventListener("mousemove", detectDrag);
            window.removeEventListener("mouseup", defaultMouseUp);
            window.addEventListener("mouseup", dragEndHandler);
        }
    }
    const defaultMouseUp = (e: MouseEvent) => {
        if (e.button != 0) return; // only left click
        window.removeEventListener("mousemove", detectDrag);
        window.removeEventListener("mouseup", defaultMouseUp);
        mouseUpCallback(e);
    }
    const dragEndHandler = (e: MouseEvent) => {
        if (e.button != 0) return; // only left click
        e.preventDefault();
        e.stopPropagation();
        window.removeEventListener("mouseup", dragEndHandler);
        mouseUpCallback(e);
        dragEndCallback(e);
    }
    const mouseDownHandler = (e: MouseEvent) => {
        if (e.button != 0) return; // only left click
        originalPosition.current = {x: e.clientX, y: e.clientY};
        window.addEventListener("mousemove", detectDrag);
        window.addEventListener("mouseup", defaultMouseUp);
        mouseDownCallback(e);
    };
    return mouseDownHandler;
}