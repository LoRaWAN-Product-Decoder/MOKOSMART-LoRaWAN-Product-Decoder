import { describe, test, expect } from "vitest";

import { decoderRun } from "../../../../../src/functions/decoder-run";

const file_path = "decoders/connector/mokosmart/LW008-MT/v1.0.0/payload.js" as const;

describe("Shall not be parsed", () => {
    let payload = [{ variable: "shallnotpass", value: "04096113950292" }];
    payload = decoderRun(file_path, { payload });
    test("Output Result", () => {
        expect(Array.isArray(payload)).toBe(true);
    });

    test("Not parsed Result", () => {
        expect(payload).toEqual([{ variable: "shallnotpass", value: "04096113950292" }]);
    });
});