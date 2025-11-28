import { tool } from "@langchain/core/tools";
import type { JSONSchema } from "@langchain/core/utils/json_schema";

import { SRTItem } from "./types";
import {
	getLinesAtTimestamp,
	parseSrtItems,
	readNextLines,
	readPreviousLines,
} from "./read_srt";

const jsonStringify = (value: unknown): string => JSON.stringify(value);

const timestampSchema = {
	type: "string",
	description: "Timestamp formatted as HH:MM:SS,mmm to look up within the subtitle.",
	pattern: "^\\d{2}:\\d{2}:\\d{2},\\d{3}$",
} as const satisfies JSONSchema;

const positiveIntegerSchema = {
	type: "integer",
	minimum: 1,
	description: "Positive sequence number used as the reference point.",
} as const satisfies JSONSchema;

const getLineNumberAtTimestampSchema = {
	type: "object",
	additionalProperties: false,
	required: ["timestamp"],
	properties: {
		timestamp: timestampSchema,
	},
} as const satisfies JSONSchema;

const readSeqSchema = {
	type: "object",
	additionalProperties: false,
	required: ["seq"],
	properties: {
		seq: positiveIntegerSchema,
	},
} as const satisfies JSONSchema;

type GetLineNumberAtTimestampArgs = {
	timestamp: string;
};

type ReadSeqArgs = {
	seq: number;
};

function ensureItems(source: string | SRTItem[]): SRTItem[] {
	const items = parseSrtItems(source);
	if (!items.length) {
		throw new Error("SRTItem list is empty; cannot create SRT tools.");
	}
	return items;
}

export function createGetLinesAtTimestampTool(source: string | SRTItem[]) {
	const items = ensureItems(source);
	return tool(
		async (input) => {
			const { timestamp } = input as GetLineNumberAtTimestampArgs;
			console.log(
				"[tool:get_lines_at_timestamp]",
				JSON.stringify({ timestamp })
			);
			var result = jsonStringify(
				getLinesAtTimestamp(items, timestamp)
			);
			console.log("[tool:get_lines_at_timestamp] result", result);
			return result;
		},
		{
			name: "get_lines_at_timestamp",
			description:
				"Given a timestamp (HH:MM:SS,mmm), return the matching subtitle entry with its sequence number, surrounding entries within the configured context window, and metadata as JSON.",
			schema: getLineNumberAtTimestampSchema,
		}
	);
}

export function createReadPreviousLinesTool(source: string | SRTItem[]) {
	const items = ensureItems(source);
	return tool(
		async (input) => {
			const { seq } = input as ReadSeqArgs;
			console.log(
				"[tool:read_previous_srt_lines]",
				JSON.stringify({ seq })
			);
			var result = jsonStringify(readPreviousLines(items, seq));
			console.log("[tool:read_previous_srt_lines] result", result);
			return result;
		},
		{
			name: "read_previous_srt_lines",
			description:
				"Read the configured number of subtitle entries before the provided sequence number and return them as JSON.",
			schema: readSeqSchema,
		}
	);
}

export function createReadNextLinesTool(source: string | SRTItem[]) {
	const items = ensureItems(source);
	return tool(
		async (input) => {
			const { seq } = input as ReadSeqArgs;
			console.log(
				"[tool:read_next_srt_lines]",
				JSON.stringify({ seq })
			);
			var result = jsonStringify(readNextLines(items, seq));
			console.log("[tool:read_next_srt_lines] result", result);
			return result;
		},
		{
			name: "read_next_srt_lines",
			description:
				"Read the configured number of subtitle entries after the provided sequence number and return them as JSON.",
			schema: readSeqSchema,
		}
	);
}

export function createSrtTools(source: string | SRTItem[]) {
	return [
		createGetLinesAtTimestampTool(source),
		createReadPreviousLinesTool(source),
		createReadNextLinesTool(source),
	];
}
