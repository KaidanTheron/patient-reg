import { format, isValid, parseISO } from "date-fns";

const OFFSET_ISO = "yyyy-MM-dd'T'HH:mm:ss.SSSxxx" as const;

export class IsoDate {
	private constructor(public value: Date) {}

	/**
	 * ISO-8601 with numeric timezone offset, e.g. `2024-06-15T14:30:00.000+02:00` (`format` `xxx` token).
	 * Round-trip: {@link fromSerialized}.
	 */
	serialize(): string {
		return format(this.value, OFFSET_ISO);
	}

	static fromSerialized(this: void, serialized: string): IsoDate {
		const d = parseISO(serialized);
		if (!isValid(d)) {
			throw new Error("Invalid ISO date string");
		}
		return new IsoDate(d);
	}
}
