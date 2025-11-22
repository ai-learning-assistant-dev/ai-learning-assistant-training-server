import { SRT_CONTEXT_WINDOW, SRT_INIT_WINDOW } from "./const";
import { SRTItem } from "./types";

type JsonRecord = Record<string, unknown>;

type NormalizedSrtItem = {
	seq: number;
	start: string;
	end: string;
	text: string;
	startMs: number;
	endMs: number;
};

function parseTimestamp(value: string): number | null {
	const match = value.match(
		/^(?<hh>\d{2}):(?<mm>\d{2}):(?<ss>\d{2}),(?<ms>\d{3})$/
	);

	if (!match || !match.groups) {
		return null;
	}

	const hours = Number(match.groups.hh);
	const minutes = Number(match.groups.mm);
	const seconds = Number(match.groups.ss);
	const milliseconds = Number(match.groups.ms);

	return (
		hours * 60 * 60 * 1000 +
		minutes * 60 * 1000 +
		seconds * 1000 +
		milliseconds
	);
}

function isSrtItemArray(value: unknown): value is SRTItem[] {
	return (
		Array.isArray(value) &&
		value.every((item) =>
			typeof item === "object" &&
			item !== null &&
			typeof (item as Partial<SRTItem>).start === "string" &&
			typeof (item as Partial<SRTItem>).end === "string" &&
			typeof (item as Partial<SRTItem>).text === "string" &&
			typeof (item as Partial<SRTItem>).seq === "number"
		)
	);
}

export function parseSrtItems(source: string | SRTItem[]): SRTItem[] {
	if (typeof source === "string") {
		const parsed = JSON.parse(source);
		if (!isSrtItemArray(parsed)) {
			throw new Error("Parsed SRT JSON is not an array of SRTItem objects.");
		}
		return parsed;
	}

	if (!isSrtItemArray(source)) {
		throw new Error("Provided SRT data is not a valid SRTItem array.");
	}

	return source;
}

export function normalizeSrtItems(source: string | SRTItem[]): NormalizedSrtItem[] {
	const items = parseSrtItems(source);

	const normalized = items
		.map((item) => {
			const startMs = parseTimestamp(item.start);
			const endMs = parseTimestamp(item.end);
			if (startMs === null || endMs === null) {
				return null;
			}

			return {
				seq: item.seq,
				start: item.start,
				end: item.end,
				text: item.text,
				startMs,
				endMs,
			} as NormalizedSrtItem;
		})
		.filter((entry): entry is NormalizedSrtItem => entry !== null)
		.sort((a, b) => {
			if (a.startMs === b.startMs) {
				return a.seq - b.seq;
			}
			return a.startMs - b.startMs;
		});

	return normalized;
}

function findIndexBySeq(items: NormalizedSrtItem[], seq: number): number {
	return items.findIndex((entry) => entry.seq === seq);
}

function sliceContext(
	items: NormalizedSrtItem[],
	centerIndex: number,
	window: number
) {
	const startIndex = Math.max(0, centerIndex - window);
	const endIndex = Math.min(items.length, centerIndex + window + 1);
	const contextSlice = items.slice(startIndex, endIndex);

	return {
		contextSlice,
		startSeq: contextSlice.length > 0 ? contextSlice[0].seq : null,
		endSeq: contextSlice.length > 0 ? contextSlice[contextSlice.length - 1].seq : null,
	} as const;
}

function serializeItems(items: NormalizedSrtItem[]) {
	return items.map((entry) => ({
		seq: entry.seq,
		start: entry.start,
		end: entry.end,
		text: entry.text,
	}));
}

export function getLinesAtTimestamp(
	source: string | SRTItem[],
	timestamp: string
): JsonRecord {
	try {
		const targetMs = parseTimestamp(timestamp);
		if (targetMs === null) {
			return {
				success: false,
				message: "Invalid timestamp format. Expected HH:MM:SS,mmm.",
			};
		}

		const items = normalizeSrtItems(source);
		if (items.length === 0) {
			return {
				success: false,
				message: "No subtitle entries available.",
			};
		}

		let left = 0;
		let right = items.length - 1;
		while (left <= right) {
			const mid = Math.floor((left + right) / 2);
			const entry = items[mid];
			if (targetMs < entry.startMs) {
				right = mid - 1;
				continue;
			}
			if (targetMs > entry.endMs) {
				left = mid + 1;
				continue;
			}
			
			const { contextSlice, startSeq, endSeq } = sliceContext(
				items,
				mid,
				SRT_INIT_WINDOW
			);

			return {
				success: true,
				entry: {
					seq: entry.seq,
					start: entry.start,
					end: entry.end,
					text: entry.text,
				},
				contextItems: serializeItems(contextSlice),
				startSeq,
				endSeq,
			};
		}

		return {
			success: false,
			message: "No subtitle entry matches the provided timestamp.",
		};
	} catch (error) {
		return {
			success: false,
			message: error instanceof Error ? error.message : String(error),
		};
	}
}

export function readPreviousLines(
	source: string | SRTItem[],
	seq: number
): JsonRecord {
	try {
		const items = normalizeSrtItems(source);
		if (items.length === 0) {
			return {
				success: true,
				items: [],
				firstSeq: null,
				note: "No subtitle items available.",
			};
		}

		const index = findIndexBySeq(items, seq);
		if (index <= 0) {
			return {
				success: true,
				items: [],
				firstSeq: null,
				note: "Requested seq is at the start of the subtitle list or not found.",
			};
		}

		const startIndex = Math.max(0, index - SRT_CONTEXT_WINDOW);
		const slice = items.slice(startIndex, index);
		return {
			success: true,
			firstSeq: slice.length > 0 ? slice[0].seq : null,
			items: serializeItems(slice),
		};
	} catch (error) {
		return {
			success: false,
			message: error instanceof Error ? error.message : String(error),
		};
	}
}

export function readNextLines(
	source: string | SRTItem[],
	seq: number
): JsonRecord {
	try {
		const items = normalizeSrtItems(source);
		if (items.length === 0) {
			return {
				success: true,
				items: [],
				lastSeq: null,
				note: "No subtitle items available.",
			};
		}

		const index = findIndexBySeq(items, seq);
		if (index === -1 || index >= items.length - 1) {
			return {
				success: true,
				items: [],
				lastSeq: null,
				note: "Requested seq is at or beyond the end of the subtitle list.",
			};
		}

		const startIndex = index + 1;
		const endIndex = Math.min(items.length, startIndex + SRT_CONTEXT_WINDOW);
		const slice = items.slice(startIndex, endIndex);

		return {
			success: true,
			lastSeq: slice.length > 0 ? slice[slice.length - 1].seq : null,
			items: serializeItems(slice),
		};
	} catch (error) {
		return {
			success: false,
			message: error instanceof Error ? error.message : String(error),
		};
	}
}
