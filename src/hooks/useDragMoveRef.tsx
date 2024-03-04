import { DraggedData } from "../types/workspaceTypes";
import { useEffect, useRef } from "react";

export function useDragMoveRef(draggedData: DraggedData|null) {
    const mousePositionRef = useRef<{ x: number, y: number }>({ x: 0, y: 0 });
    useEffect(() => {
        if (draggedData) {
            const dragHandler = (e: MouseEvent,) => { mousePositionRef.current = { x: e.x, y: e.y };};

            document.addEventListener("drag", dragHandler, { passive: false });

            return () => {
                document.removeEventListener("drag", dragHandler);
            };
        }
    }, [draggedData]);
    return mousePositionRef;
}