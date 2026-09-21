import type { Request } from "express";
import { cookies } from "./request-auth";

function parse(header?: string): ReadonlyMap<string, string> {
  return cookies({ headers: { cookie: header } } as Request);
}

describe("cookie parsing", () => {
  it("reads the session and CSRF cookies among multiple cookies", () => {
    const values = parse(
      "other=first; portfolio_admin_session=session%2Btoken; XSRF-TOKEN=csrf%20token; other=last",
    );
    expect(values.get("portfolio_admin_session")).toBe("session+token");
    expect(values.get("XSRF-TOKEN")).toBe("csrf token");
    expect(values.get("other")).toBe("last");
  });

  it("ignores malformed entries and malformed encoding", () => {
    const values = parse(
      "bad; =empty-name; broken=%E0%A4%A; portfolio_admin_session=valid",
    );
    expect(values.get("bad")).toBeUndefined();
    expect(values.get("")).toBeUndefined();
    expect(values.get("broken")).toBeUndefined();
    expect(values.get("portfolio_admin_session")).toBe("valid");
  });

  it("treats an empty header as no cookies", () => {
    expect(parse().size).toBe(0);
    expect(parse("").get("portfolio_admin_session")).toBeUndefined();
  });

  it("keeps attacker-controlled names isolated from prototypes and auth cookies", () => {
    const before = Object.getPrototypeOf({});
    const values = parse(
      "__proto__=polluted; constructor=bad; prototype=bad; XSRF-TOKEN=csrf",
    );
    expect(values.get("__proto__")).toBe("polluted");
    expect(values.get("constructor")).toBe("bad");
    expect(values.get("prototype")).toBe("bad");
    expect(values.get("portfolio_admin_session")).toBeUndefined();
    expect(values.get("XSRF-TOKEN")).toBe("csrf");
    expect(Object.getPrototypeOf({})).toBe(before);
    expect(({} as Record<string, unknown>)["polluted"]).toBeUndefined();
  });
});
