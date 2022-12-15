import { Cookie } from "./cookie";
import { ICookieQueue } from "./cookie-queue.interface";
import { CookieType } from "./cookie-type.enum";
import { IReport } from "./report.interface";

class Box {
    nextBox: Box | null = null;
    prevBox: Box | null = null;

    readonly expiryDate: Date;

    constructor(public readonly cookie: Cookie) {
        const now = Date.now();
        const fiveMinutesInMilliseconds = 1000 * 60 * 5;
        this.expiryDate = new Date(now + fiveMinutesInMilliseconds);
    }

    isExpired(): boolean {
        return Date.now() >= this.expiryDate.getTime();
    }
}

// Given implementation optimizes adding cookies by using a doubly linked list
export class CookieQueue implements ICookieQueue {
    private firstBox: Box | null = null;
    private lastBox: Box | null = null;
    private boxCount = 0;

    private readonly NO_COOKIES_IN_REPORT = 100;

    add(cookie: Cookie): void {
        if (cookie.getCookieType() === CookieType.ERROR) {
            return;
        }

        const box = new Box(cookie);

        // Check if the list is empty
        if (!this.firstBox || !this.lastBox) {
            this.firstBox = box;
            this.lastBox = box;
        } else {
            // Add box to the front of the list
            box.nextBox = this.firstBox;
            this.firstBox.prevBox = box;
            this.firstBox = box;
        }

        this.boxCount += 1;
        this.removeUnnecessaryBoxes();
    }

    getReport(): IReport {
        this.removeUnnecessaryBoxes();

        const cookies: Cookie[] = [];
        let box = this.firstBox;

        for (let i = 0; i < this.NO_COOKIES_IN_REPORT; i += 1) {
            if (!box) {
                break;
            }
            cookies.push(box.cookie);
            box = box.nextBox;
        }

        return {
            getCookies: () => cookies,
        };
    }

    private removeUnnecessaryBoxes(): void {
        while (this.boxCount > this.NO_COOKIES_IN_REPORT) {
            this.removeBoxFromBack();
        }

        while (this.lastBox?.isExpired()) {
            this.removeBoxFromBack();
        }
    }

    private removeBoxFromBack(): void {
        if (!this.lastBox) {
            return;
        }

        // Check if there is just one box in the list
        if (!this.lastBox.prevBox) {
            this.firstBox = null;
            this.lastBox = null;
            this.boxCount = 0;
            return;
        }

        // Remove box from the back of the list
        const newLastBox = this.lastBox.prevBox;
        this.lastBox.prevBox.nextBox = null;
        this.lastBox.prevBox = null;
        this.lastBox = newLastBox;
        this.boxCount -= 1;
    }
}
