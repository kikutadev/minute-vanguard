import type { ReactNode } from 'react';
export interface BottomSheetProps {
    readonly title: string;
    readonly onClose: () => void;
    readonly children: ReactNode;
    readonly ariaLabel?: string;
    readonly closeLabel?: string;
    readonly backdropClassName?: string;
    readonly sheetClassName?: string;
    readonly headerClassName?: string;
    readonly closeButtonClassName?: string;
}
/**
 * Unstyled bottom-sheet shell with dialog semantics and backdrop dismissal.
 * Visuals, sizing and motion remain entirely consumer-owned.
 */
export declare function BottomSheet({ title, onClose, children, ariaLabel, closeLabel, backdropClassName, sheetClassName, headerClassName, closeButtonClassName, }: BottomSheetProps): import("react").JSX.Element;
