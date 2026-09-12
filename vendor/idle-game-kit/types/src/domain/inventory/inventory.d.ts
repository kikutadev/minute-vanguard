export type ItemDefinitionId = string;
export type ItemInstanceId = string;
export type LoadoutId = string;
export type LoadoutSlotId = string;
export type ItemDefinition = Readonly<{
    id: ItemDefinitionId;
    displayName?: string;
    description?: string;
    tags?: readonly string[];
}>;
export type ItemInstanceState<TData = unknown> = Readonly<{
    instanceId: ItemInstanceId;
    definitionId: ItemDefinitionId;
    quantity: number;
    data?: TData;
}>;
export type InventoryState<TData = unknown> = Readonly<Record<ItemInstanceId, ItemInstanceState<TData>>>;
export type LoadoutSlotDefinition = Readonly<{
    id: LoadoutSlotId;
    acceptsTags?: readonly string[];
}>;
export type LoadoutDefinition = Readonly<{
    id: LoadoutId;
    slots: readonly LoadoutSlotDefinition[];
}>;
export type LoadoutState = Readonly<{
    definitionId: LoadoutId;
    equipped: Readonly<Record<LoadoutSlotId, ItemInstanceId | null>>;
}>;
/** Add a concrete item instance immutably. Duplicate instance IDs are rejected. */
export declare function addItemInstance<TData>(inventory: InventoryState<TData>, item: ItemInstanceState<TData>): Readonly<{
    accepted: true;
    inventory: InventoryState<TData>;
}> | Readonly<{
    accepted: false;
    inventory: InventoryState<TData>;
    reason: 'duplicate-instance' | 'invalid-item';
}>;
/** Remove an item instance immutably. Products should unequip it first when loadouts reference it. */
export declare function removeItemInstance<TData>(inventory: InventoryState<TData>, instanceId: ItemInstanceId): Readonly<{
    accepted: true;
    inventory: InventoryState<TData>;
    removed: ItemInstanceState<TData>;
}> | Readonly<{
    accepted: false;
    inventory: InventoryState<TData>;
    reason: 'unknown-instance';
}>;
/** Create an empty loadout whose slots exactly match the authored definition. */
export declare function createLoadoutState(definition: LoadoutDefinition): LoadoutState;
/**
 * Equip an owned item into a slot. The same instance cannot occupy multiple slots in one loadout,
 * and optional slot tag restrictions are checked against the item definition.
 */
export declare function equipItem<TData>(args: Readonly<{
    inventory: InventoryState<TData>;
    itemDefinitions: Readonly<Record<ItemDefinitionId, ItemDefinition>>;
    loadoutDefinition: LoadoutDefinition;
    loadout: LoadoutState;
    slotId: LoadoutSlotId;
    itemInstanceId: ItemInstanceId;
}>): Readonly<{
    accepted: true;
    loadout: LoadoutState;
    replacedItemInstanceId: ItemInstanceId | null;
}> | Readonly<{
    accepted: false;
    loadout: LoadoutState;
    reason: 'definition-mismatch' | 'unknown-slot' | 'unknown-item' | 'unknown-item-definition' | 'slot-restriction' | 'already-equipped';
}>;
/** Unequip one slot. Unknown slots are rejected; an already empty slot preserves identity. */
export declare function unequipItem(loadoutDefinition: LoadoutDefinition, loadout: LoadoutState, slotId: LoadoutSlotId): Readonly<{
    accepted: true;
    loadout: LoadoutState;
    removedItemInstanceId: ItemInstanceId | null;
}> | Readonly<{
    accepted: false;
    loadout: LoadoutState;
    reason: 'definition-mismatch' | 'unknown-slot';
}>;
