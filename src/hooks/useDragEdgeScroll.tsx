import { getRemPxSize, triggerMouseMoveOnWindow } from "../functions/utility";
import { DragConfig, DraggedData } from "../types/workspaceTypes";
import { useEffect, useRef } from "react";

export function useDragEdgeScroll(draggedData: DraggedData | null, tabListElement: HTMLDivElement, dragConfig: DragConfig) {
    // horizontally scroll the panel tab bar when dragging a tab to the edge of the topbar container
    const intervalEvent = useRef<number>();
    const mousePositionRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        // will trigger everytime draggedData changes
        // draggedData is a workspace state that is updated manually

        const mouseMoveHandler = (e: MouseEvent) => { mousePositionRef.current = { x: e.clientX, y: e.clientY }; };

        if (draggedData) {
            // if draggedData is not null, call the scrollEvent every 30ms
            const scrollEvent = () => { dragEdgeScrolling(mousePositionRef, tabListElement, dragConfig) };
            intervalEvent.current = setInterval(scrollEvent, 30);
            window.addEventListener("mousemove", mouseMoveHandler);
        }
        return () => {
            // cleanup
            if (intervalEvent.current) clearInterval(intervalEvent.current);
            window.removeEventListener("mousemove", mouseMoveHandler);
        };
    }, [draggedData]);
}

function dragEdgeScrolling(mousePositionRef: React.MutableRefObject<{ x: number; y: number; }>, containerElement: HTMLDivElement, dragConfig: DragConfig) {
    triggerMouseMoveOnWindow(mousePositionRef.current);
    const containerRect = containerElement.getBoundingClientRect();
    // if mouse is outside of container, no need to scroll, return
    if (containerRect.x > mousePositionRef.current.x ||
        mousePositionRef.current.x > (containerRect.x + containerRect.width) ||
        containerRect.y > mousePositionRef.current.y ||
        mousePositionRef.current.y > (containerRect.y + containerRect.height)) return;

    const remPxSize = getRemPxSize(document);

    // if the mouse is within the scroll activation region, scroll the container
    const leftDelta = (mousePositionRef.current.x - containerRect.x) / remPxSize;
    const rightDelta = ((containerRect.x + containerRect.width) - mousePositionRef.current.x) / remPxSize;

    if (leftDelta <= dragConfig.edgeScrollActiveWidthRem) {
        containerElement.scrollBy({
            top: 0,
            left: -getScrollSpeed(dragConfig, leftDelta),
            behavior: "instant",
        });
    }
    else if (rightDelta <= dragConfig.edgeScrollActiveWidthRem) {
        containerElement.scrollBy({
            top: 0,
            left: getScrollSpeed(dragConfig, rightDelta),
            behavior: "instant",
        });
    }
    triggerMouseMoveOnWindow(mousePositionRef.current);
}

function getScrollSpeed(dragConfig: DragConfig, deltaRem: number) {
    // the closer the mouse is to the edge, the faster the scroll speed
    const percentage = (dragConfig.edgeScrollActiveWidthRem - deltaRem) / dragConfig.edgeScrollActiveWidthRem;
    const dragSpeed = dragConfig.edgeScrollMinSpeed + percentage * (dragConfig.edgeScrollMaxSpeed - dragConfig.edgeScrollMinSpeed)
    return dragSpeed;
}
