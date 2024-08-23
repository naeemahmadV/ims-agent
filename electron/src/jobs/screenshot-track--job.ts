import * as screenshot from 'screenshot-desktop';
import { logManager } from '../log-manager';
import * as fs from 'fs';
import * as path from 'path';
import { backgroundService } from '../background-service';

let logger = logManager.getLogger('ScreenshotTrackJob');

export class ScreenshotTrackJob {
    async run() {
        try {
            const screenshots = await screenshot.all(); // Capture screenshots of all monitors

            screenshots.forEach((imgBuffer, index) => {
                const filePath = this.getScreenshotPath(index);
                fs.writeFileSync(filePath, imgBuffer); // Save screenshot to disk
                logger.debug(`Screenshot saved: ${filePath}`);

               // this.saveScreenshotInfo(filePath);
            });

            logger.debug('Screenshot Job ran successfully.');
        } catch (error) {
            logger.error('Error in Screenshot Job: ' + error.toString(), error);
        }
    }

    getScreenshotPath(monitorIndex: number): string {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const screenshotDir = path.join(__dirname, '..', 'screenshots');

        if (!fs.existsSync(screenshotDir)) {
            fs.mkdirSync(screenshotDir);
        }

        return path.join(screenshotDir, `screen-${monitorIndex}-${timestamp}.png`);
    }

    async saveScreenshotInfo(filePath: string) {
        const screenshotInfo = {
            filePath: filePath,
            timestamp: new Date(),
        };

        // Save screenshot information to the database or perform other actions
        await backgroundService.createOrUpdate(screenshotInfo);
    }
}

export const screenshotJob = new ScreenshotTrackJob();
