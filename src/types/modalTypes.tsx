import { FC } from "react";

export interface ModalData { component: FC | null, props?: Record<string, unknown> };

export interface ModalInterface {
    showModalWithData(modalData: { component: FC | null, props?: Record<string, unknown> }): void,
    hideModal(): void
}