import * as screenshot from 'screenshot-desktop';
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

export class ScreenshotTrackJob {
    async run() {
        try {
            const screenshots = await screenshot.all(); // Capture screenshots of all monitors

            screenshots.forEach((imgBuffer, index) => {
                const filePath = this.getScreenshotPath(index);
                fs.writeFileSync(filePath, imgBuffer); // Save screenshot to disk
                console.log(`Screenshot saved: ${filePath}`);
            });

            console.log('Screenshot Job ran successfully.');
        } catch (error) {
            console.error('Error in Screenshot Job: ' + error.toString(), error);
        }
    }

    getScreenshotPath(monitorIndex: number): string {
        const timestamp = new Date().toISOString().replace(/[:]/g, '-');
        const screenshotDir = path.join(app.getPath('userData'), 'ims-data');

        if (!fs.existsSync(screenshotDir)) {
            fs.mkdirSync(screenshotDir, { recursive: true });
        }

        return path.join(screenshotDir, `screen-${monitorIndex}-${timestamp}.png`);
    }
}

export const screenshotJob = new ScreenshotTrackJob();
