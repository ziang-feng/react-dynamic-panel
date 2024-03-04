import { FC } from "react";

export interface ModalData { component: FC | null, props?: any };

export interface ModalInterface {
    showModalWithData(modalData: { component: FC | null, props?: any }): void,
    hideModal(): void
}