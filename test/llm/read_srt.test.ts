import { describe, it, expect, beforeAll, afterAll } from "vitest";

import {
    getLinesAtTimestamp,
    readNextLines,
    readPreviousLines,
} from "../../src/llm/tool/read_srt";
import {
    setSrtContextWindow,
    setSrtInitWindow,
    SRT_CONTEXT_WINDOW,
} from "../../src/llm/tool/const";
import { SRTItem } from "../../src/llm/tool/types";

const SAMPLE_ITEMS: SRTItem[] = [
    { seq: 1, start: "00:00:00,000", end: "00:00:02,000", text: "开场欢迎大家" },
    { seq: 2, start: "00:00:02,500", end: "00:00:04,000", text: "我们来聊聊群论" },
    { seq: 3, start: "00:00:04,200", end: "00:00:06,000", text: "首先介绍它的定义" },
    { seq: 4, start: "00:00:06,200", end: "00:00:08,000", text: "接着讨论应用场景" },
    { seq: 5, start: "00:00:08,500", end: "00:00:10,500", text: "总结关键要点" },
];

let originalWindow: number;

beforeAll(() => {
    originalWindow = SRT_CONTEXT_WINDOW;
    setSrtContextWindow(1);
    setSrtInitWindow(1);
});

afterAll(() => {
    setSrtContextWindow(originalWindow);
});

describe("read_srt tools", () => {
    it("returns the matching subtitle entry for a given timestamp", () => {
        const result = getLinesAtTimestamp(SAMPLE_ITEMS, "00:00:02,700");

        expect(result.success).toBe(true);
        expect(result).toHaveProperty("entry");
        const entry = result.entry as { seq: number; text: string };
        expect(entry.seq).toBe(2);
        expect(entry.text).toContain("群论");
        expect(result.startSeq).toBe(1);
        expect(result.endSeq).toBe(3);
        const context = result.contextItems as Array<{ seq: number }>;
        expect(context.map((item) => item.seq)).toEqual([1, 2, 3]);
    });

    it("returns failure when no entry matches the timestamp", () => {
        const result = getLinesAtTimestamp(SAMPLE_ITEMS, "00:00:15,000");

        expect(result.success).toBe(false);
        expect(result.message).toContain("No subtitle entry");
    });

    it("reads the previous context window from the target seq", () => {
        const result = readPreviousLines(SAMPLE_ITEMS, 4);

        expect(result.success).toBe(true);
        expect(result.firstSeq).toBe(3);
        const items = result.items as Array<{ seq: number; text: string }>;
        expect(items.length).toBe(1);
        expect(items[0].text).toContain("定义");
    });

    it("reads the next context window from the target seq", () => {
        const result = readNextLines(SAMPLE_ITEMS, 2);

        expect(result.success).toBe(true);
        expect(result.lastSeq).toBe(4);
        const items = result.items as Array<{ seq: number; text: string }>;
        expect(items.length).toBe(2);
        expect(items[0].seq).toBe(3);
        expect(items[1].text).toContain("应用场景");
    });
});
