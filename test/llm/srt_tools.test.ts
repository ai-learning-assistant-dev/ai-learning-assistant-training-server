import { describe, it, expect, beforeAll, afterAll } from "vitest";

import {
    createGetLinesAtTimestampTool,
    createReadNextLinesTool,
    createReadPreviousLinesTool,
} from "../../src/llm/tool/srt_tools";
import {
    setSrtContextWindow,
    setSrtInitWindow,
    SRT_CONTEXT_WINDOW,
} from "../../src/llm/tool/const";
import { SRTItem } from "../../src/llm/tool/types";

const SAMPLE_ITEMS: SRTItem[] = [
    { seq: 10, start: "00:00:00,000", end: "00:00:02,000", text: "欢迎来到课程" },
    { seq: 11, start: "00:00:02,100", end: "00:00:04,000", text: "今天讨论群论" },
    { seq: 12, start: "00:00:04,100", end: "00:00:06,000", text: "先给出一个例子" },
    { seq: 13, start: "00:00:06,200", end: "00:00:08,000", text: "再看它的性质" },
    { seq: 14, start: "00:00:08,100", end: "00:00:10,000", text: "最后总结" },
];

let originalWindow: number;
const tools = {
    getLineNumberAtTimestamp: null as ReturnType<typeof createGetLinesAtTimestampTool> | null,
    readPreviousLines: null as ReturnType<typeof createReadPreviousLinesTool> | null,
    readNextLines: null as ReturnType<typeof createReadNextLinesTool> | null,
};

beforeAll(() => {
    originalWindow = SRT_CONTEXT_WINDOW;
    setSrtContextWindow(1);
    setSrtInitWindow(1);
    tools.getLineNumberAtTimestamp = createGetLinesAtTimestampTool(SAMPLE_ITEMS);
    tools.readPreviousLines = createReadPreviousLinesTool(SAMPLE_ITEMS);
    tools.readNextLines = createReadNextLinesTool(SAMPLE_ITEMS);
});

afterAll(() => {
    setSrtContextWindow(originalWindow);
});

describe("srt_tools wrappers", () => {
    it("returns JSON string from getLineNumberAtTimestampTool", async () => {
        const raw = await tools.getLineNumberAtTimestamp!.invoke({
            timestamp: "00:00:04,500",
        });

        expect(typeof raw).toBe("string");
        const parsed = JSON.parse(raw as string);

        expect(parsed.success).toBe(true);
        expect(parsed.entry.seq).toBe(12);
        expect(parsed.contextItems.length).toBeLessThanOrEqual(3);
        expect(parsed.startSeq).toBeLessThanOrEqual(parsed.entry.seq);
    });

    it("returns JSON string from readPreviousLinesTool", async () => {
        const raw = await tools.readPreviousLines!.invoke({
            seq: 13,
        });

        const parsed = JSON.parse(raw as string);
        expect(parsed.success).toBe(true);
        expect(parsed.items.length).toBeLessThanOrEqual(1);
        expect(parsed.items[0].seq).toBe(12);
    });

    it("returns JSON string from readNextLinesTool", async () => {
        const raw = await tools.readNextLines!.invoke({
            seq: 11,
        });

        const parsed = JSON.parse(raw as string);
        expect(parsed.success).toBe(true);
        expect(parsed.items.length).toBe(2);
        expect(parsed.items[0].seq).toBe(12);
    });
});
