export function useClickDrag(dragStartCallback: (e: MouseEvent) => void, dragEndCallback: (e: MouseEvent) => void) {
    const clickHandler = (e: MouseEvent) => {
        if (e.button != 0) return; // only left click
        dragStartCallback(e);
        window.addEventListener("click", dragEndHandler, true);
    }
    const dragEndHandler = (e: MouseEvent) => {
        if (e.button != 0) return; // only left click
        e.preventDefault();
        e.stopPropagation();
        dragEndCallback(e);
        window.removeEventListener("click", dragEndHandler, true);
    }
    return clickHandler;
}