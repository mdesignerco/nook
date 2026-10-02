import { useCallback, useState } from "react";
import {
	DndContext,
	DragOverlay,
	PointerSensor,
	rectIntersection,
	useDroppable,
	useDraggable,
	useSensor,
	useSensors,
	type DragEndEvent,
	type DragStartEvent
} from "@dnd-kit/core";
import {
	SortableContext,
	arrayMove,
	horizontalListSortingStrategy,
	useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowLeftRight, ChevronDown, ChevronUp, X } from "lucide-react";
import {
	DEFAULT_WIDGET_CONFIG,
	MAX_PER_ZONE,
	WIDGET_DEFS,
	widgetDef,
	type WidgetConfig
} from "../lib/statusWidgets";

function PoolChip({ id }: { id: string }) {
	const def = widgetDef(id);
	const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id });
	const Icon = def.icon;
	return (
		<div
			ref={setNodeRef}
			className={`flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-[11px] text-white/70 select-none ${
				isDragging ? "opacity-40" : ""
			}`}
			{...listeners}
			{...attributes}
		>
			<Icon size={12} strokeWidth={2} style={{ color: def.color }} />
			<span>{def.label}</span>
		</div>
	);
}

function SortablePlacedChip({
	id,
	idx,
	total,
	onSwap,
	onRemove,
	onMove
}: {
	id: string;
	idx: number;
	total: number;
	onSwap: (id: string) => void;
	onRemove: (id: string) => void;
	onMove: (id: string, dir: -1 | 1) => void;
}) {
	const def = widgetDef(id);
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id
	});
	const Icon = def.icon;

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.4 : 1,
		zIndex: isDragging ? 50 : ("auto" as const)
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			className="flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.06] pl-1.5 pr-1 py-1"
		>
			<div {...attributes} {...listeners} className="flex cursor-grab items-center gap-1.5 text-[11px]">
				<Icon size={12} strokeWidth={2} style={{ color: def.color }} />
				<span className="text-white/85">{def.label}</span>
			</div>
			<div className="flex items-center">
				{idx > 0 && (
					<button
						className="rounded p-0.5 text-white/40 hover:bg-white/10 hover:text-white/80"
						onClick={() => onMove(id, -1)}
						title="Move left"
					>
						<ChevronUp size={9} className="rotate-90" />
					</button>
				)}
				{idx < total - 1 && (
					<button
						className="rounded p-0.5 text-white/40 hover:bg-white/10 hover:text-white/80"
						onClick={() => onMove(id, 1)}
						title="Move right"
					>
						<ChevronDown size={9} className="rotate-90" />
					</button>
				)}
				<button
					className="rounded p-0.5 text-white/40 hover:bg-white/10 hover:text-white/80"
					title="Swap side"
					onClick={() => onSwap(id)}
				>
					<ArrowLeftRight size={9} />
				</button>
				<button
					className="rounded p-0.5 text-white/40 hover:bg-red-500/20 hover:text-red-300"
					title="Remove"
					onClick={() => onRemove(id)}
				>
					<X size={10} />
				</button>
			</div>
		</div>
	);
}

function DropZone({
	id,
	side,
	items,
	onSwap,
	onRemove,
	onMove
}: {
	id: string;
	side: "left" | "right";
	items: string[];
	onSwap: (id: string) => void;
	onRemove: (id: string) => void;
	onMove: (id: string, dir: -1 | 1) => void;
}) {
	const { setNodeRef, isOver } = useDroppable({ id });
	return (
		<div
			// The DOM id is what the empty-space fallback hit-tests against.
			id={id}
			ref={setNodeRef}
			className={`flex-1 rounded-lg border p-2 transition-colors ${
				isOver ? "border-white/25 bg-white/[0.06]" : "border-white/[0.07] bg-white/[0.02]"
			}`}
		>
			<span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">
				{side === "left" ? "Left" : "Right"}
			</span>
			<div className="flex min-h-[26px] flex-wrap items-center gap-1">
				<SortableContext items={items} strategy={horizontalListSortingStrategy}>
					{items.length > 0 ? (
						items.map((itemId, i) => (
							<SortablePlacedChip
								key={itemId}
								id={itemId}
								idx={i}
								total={items.length}
								onSwap={onSwap}
								onRemove={onRemove}
								onMove={onMove}
							/>
						))
					) : (
						<span className="text-[11px] text-white/25">Drop here</span>
					)}
				</SortableContext>
			</div>
		</div>
	);
}

export function StatusWidgetConfig({
	value,
	onChange
}: {
	value?: WidgetConfig;
	onChange: (config: WidgetConfig) => void;
}) {
	// Fully controlled: App owns the persisted settings, so no local mirror.
	const config = value ?? DEFAULT_WIDGET_CONFIG;

	const [activeId, setActiveId] = useState<string | null>(null);
	const poolIds = config.left.concat(config.right);
	const pool = WIDGET_DEFS.filter((w) => !poolIds.includes(w.id)).map((w) => w.id);

	const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

	const remove = useCallback(
		(id: string) => {
			onChange({
				left: config.left.filter((x) => x !== id),
				right: config.right.filter((x) => x !== id)
			});
		},
		[config, onChange]
	);

	const swapSide = useCallback(
		(id: string) => {
			if (config.left.includes(id)) {
				if (config.right.length >= MAX_PER_ZONE) return;
				onChange({ left: config.left.filter((x) => x !== id), right: [...config.right, id] });
			} else {
				if (config.left.length >= MAX_PER_ZONE) return;
				onChange({ right: config.right.filter((x) => x !== id), left: [...config.left, id] });
			}
		},
		[config, onChange]
	);

	const moveInSide = useCallback(
		(id: string, dir: -1 | 1) => {
			for (const side of ["left", "right"] as const) {
				const arr = config[side];
				const idx = arr.indexOf(id);
				if (idx === -1) continue;
				const swap = idx + dir;
				if (swap < 0 || swap >= arr.length) return;
				onChange({ ...config, [side]: arrayMove(arr, idx, swap) });
				return;
			}
		},
		[config, onChange]
	);

	const handleDragStart = useCallback((event: DragStartEvent) => {
		setActiveId(event.active.id as string);
	}, []);

	const handleDragEnd = useCallback(
		(event: DragEndEvent) => {
			const { active, over } = event;
			setActiveId(null);
			if (!over) return;

			const itemId = active.id as string;
			const overId = over.id as string;
			const isPoolItem = pool.includes(itemId);
			const sourceZone = config.left.includes(itemId)
				? "left"
				: config.right.includes(itemId)
					? "right"
					: null;

			let targetZone: "left" | "right" | null = null;
			if (overId === "zone-left" || overId === "zone-right") {
				targetZone = overId === "zone-left" ? "left" : "right";
			} else if (config.left.includes(overId)) {
				targetZone = "left";
			} else if (config.right.includes(overId)) {
				targetZone = "right";
			}

			// Pool chip dropped onto a zone.
			if (isPoolItem && targetZone) {
				if (config[targetZone].length >= MAX_PER_ZONE) return;
				onChange({ ...config, [targetZone]: [...config[targetZone], itemId] });
				return;
			}

			// Placed chip: reorder in place, or move across zones.
			if (sourceZone && targetZone) {
				if (sourceZone === targetZone) {
					const arr = config[sourceZone];
					const oldIdx = arr.indexOf(itemId);
					const newIdx = arr.indexOf(overId);
					if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
						onChange({ ...config, [sourceZone]: arrayMove(arr, oldIdx, newIdx) });
					}
				} else {
					if (config[targetZone].length >= MAX_PER_ZONE) return;
					const newSource = config[sourceZone].filter((x) => x !== itemId);
					const targetArr = [...config[targetZone]];
					const insertIdx = targetArr.indexOf(overId);
					if (insertIdx >= 0) targetArr.splice(insertIdx, 0, itemId);
					else targetArr.push(itemId);
					onChange({ ...config, [sourceZone]: newSource, [targetZone]: targetArr });
				}
				return;
			}

			// Dropped on empty space: dnd-kit reports no droppable there, so
			// hit-test the pointer against each zone's bounding box instead.
			if (isPoolItem && active.rect.current.initial) {
				const rect = active.rect.current.initial;
				const cx = rect.left + rect.width / 2 + event.delta.x;
				const cy = rect.top + rect.height / 2 + event.delta.y;

				for (const side of ["left", "right"] as const) {
					if (config[side].length >= MAX_PER_ZONE) continue;
					const el = document.getElementById(`zone-${side}`);
					if (!el) continue;
					const r = el.getBoundingClientRect();
					if (cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom) {
						onChange({ ...config, [side]: [...config[side], itemId] });
						return;
					}
				}
			}
		},
		[config, pool, onChange]
	);

	const activeDef = activeId ? widgetDef(activeId) : null;
	const ActiveIcon = activeDef?.icon;

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={rectIntersection}
			onDragStart={handleDragStart}
			onDragEnd={handleDragEnd}
		>
			<div className="flex gap-2">
				<DropZone
					id="zone-left"
					side="left"
					items={config.left}
					onSwap={swapSide}
					onRemove={remove}
					onMove={moveInSide}
				/>
				<DropZone
					id="zone-right"
					side="right"
					items={config.right}
					onSwap={swapSide}
					onRemove={remove}
					onMove={moveInSide}
				/>
			</div>

			{pool.length > 0 && (
				<div className="mt-2 flex flex-wrap items-center gap-1.5">
					{pool.map((id) => (
						<PoolChip key={id} id={id} />
					))}
				</div>
			)}

			<DragOverlay>
				{activeDef && ActiveIcon ? (
					<div className="flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.06] px-2 py-1 text-[11px] text-white/85">
						<ActiveIcon size={12} strokeWidth={2} style={{ color: activeDef.color }} />
						<span>{activeDef.label}</span>
					</div>
				) : null}
			</DragOverlay>
		</DndContext>
	);
}
