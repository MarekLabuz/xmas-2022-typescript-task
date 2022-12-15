import { describe, expect, it, jest } from "@jest/globals";
import { CookieQueue } from ".";
import { Cookie } from "./cookie";
import { CookieType } from "./cookie-type.enum";

const getGoodCookie = (() => {
    const possibleTypes = [
        CookieType.CHRISTMAS_TREE,
        CookieType.SANTA_CLAUS_HAT,
    ];
    let index = 1;
    return (): Cookie => {
        const label = `label-${index}`;
        const type = possibleTypes[index % possibleTypes.length];
        index += 1;
        return new Cookie(label, type);
    };
})();

describe("Cookie queue", () => {
    it("should not report cookies with errors", () => {
        const cookieQueue = new CookieQueue();
        const goodCookies: Cookie[] = [];

        for (let i = 0; i < 10; i += 1) {
            const goodCookie = getGoodCookie();
            goodCookies.push(goodCookie);
            cookieQueue.add(goodCookie);
        }

        cookieQueue.add(new Cookie("bad-cookie-1", CookieType.ERROR));
        cookieQueue.add(new Cookie("bad-cookie-2", CookieType.ERROR));
        cookieQueue.add(new Cookie("bad-cookie-3", CookieType.ERROR));

        for (let i = 0; i < 10; i += 1) {
            const goodCookie = getGoodCookie();
            goodCookies.push(goodCookie);
            cookieQueue.add(goodCookie);
        }

        goodCookies.reverse();

        const reportedCookies = cookieQueue.getReport().getCookies();
        expect(reportedCookies).toHaveLength(20);
        expect(reportedCookies).toEqual(goodCookies);
    });

    it("should only report last 100 cookies", () => {
        const cookieQueue = new CookieQueue();
        const cookies: Cookie[] = [];

        for (let i = 0; i < 150; i += 1) {
            const goodCookie = getGoodCookie();
            cookies.push(goodCookie);
            cookieQueue.add(goodCookie);
        }

        cookies.reverse();

        const reportedCookies = cookieQueue.getReport().getCookies();
        expect(reportedCookies).toHaveLength(100);
        expect(reportedCookies).toEqual(cookies.slice(0, 100));
    });

    it("should not report expired cookies", () => {
        jest.useFakeTimers();

        let fakeNow = Date.now();
        const threeMinutesInMilliseconds = 1000 * 60 * 3;
        const cookieQueue = new CookieQueue();
        const earlyCookies: Cookie[] = [];
        const lateCookies: Cookie[] = [];

        for (let i = 0; i < 50; i += 1) {
            const earlyCookie = getGoodCookie();
            earlyCookies.push(earlyCookie);
            cookieQueue.add(earlyCookie);
        }

        // Advance time by three minutes to add late cookies
        fakeNow += threeMinutesInMilliseconds;
        jest.setSystemTime(fakeNow);

        for (let i = 0; i < 50; i += 1) {
            const lateCookie = getGoodCookie();
            lateCookies.push(lateCookie);
            cookieQueue.add(lateCookie);
        }

        earlyCookies.reverse();
        lateCookies.reverse();

        let reportedCookies = cookieQueue.getReport().getCookies();
        expect(reportedCookies).toHaveLength(100);
        expect(reportedCookies).toEqual([...lateCookies, ...earlyCookies]);

        // Advance time by another three minutes to expire early cookies
        fakeNow += threeMinutesInMilliseconds;
        jest.setSystemTime(fakeNow);

        reportedCookies = cookieQueue.getReport().getCookies();
        expect(reportedCookies).toHaveLength(50);
        expect(reportedCookies).toEqual(lateCookies);
    });

    it("should return empty report when all cookies expire", () => {
        jest.useFakeTimers();

        const now = Date.now();
        const cookieQueue = new CookieQueue();

        for (let i = 0; i < 50; i += 1) {
            cookieQueue.add(getGoodCookie());
        }

        // Advance time by five minutes to expire all cookies
        jest.setSystemTime(now + 1000 * 60 * 5);

        const reportedCookies = cookieQueue.getReport().getCookies();
        expect(reportedCookies).toHaveLength(0);
        expect(reportedCookies).toEqual([]);
    });
});
