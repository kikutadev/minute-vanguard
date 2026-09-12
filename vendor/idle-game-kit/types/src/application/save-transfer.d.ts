export declare const SAVE_FORMAT_ID = "idle-game-kit-save-v1";
export type SaveEnvelope<TState> = Readonly<{
    formatId: typeof SAVE_FORMAT_ID;
    gameId: string;
    exportedAtMs: number;
    state: TState;
}>;
export type ImportResult<TState> = Readonly<{
    accepted: true;
    envelope: SaveEnvelope<TState>;
}> | Readonly<{
    accepted: false;
    reason: 'invalid-json' | 'invalid-envelope' | 'wrong-game' | 'invalid-state';
}>;
export declare function serializeSave<TState extends Readonly<{
    gameId: string;
}>>(state: TState, exportedAtMs: number): string;
/** parse/validate完了前にはcurrent stateへ一切触れない。 */
export declare function parseSaveImport<TState>(text: string, expectedGameId: string, validateState: (candidate: unknown) => candidate is TState): ImportResult<TState>;
