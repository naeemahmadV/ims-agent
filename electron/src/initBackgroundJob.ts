import { logManager } from './log-manager';
import { logTrackItemJob } from './jobs/log-track-item-job';
import { statusTrackItemJob } from './jobs/status-track-item-job';
import { appTrackItemJob } from './jobs/app-track-item-job';
import { settingsService } from './services/settings-service';
import { screenshotJob, ScreenshotTrackJob } from './jobs/screenshot-track--job';

let logger = logManager.getLogger('BackgroundJob');

let bgInterval;
let screenshotInterval;

async function runAll(dataSettings) {
    const { idleAfterSeconds } = dataSettings;

    await appTrackItemJob.run();
    await statusTrackItemJob.run(idleAfterSeconds);
    await logTrackItemJob.run();
}

async function runScreenshotJob() {
    await screenshotJob.run();
}

export async function initBackgroundJob() {
    logger.debug('Environment:' + process.env.NODE_ENV);
    const dataSettings = await settingsService.fetchDataSettings();
    logger.debug('Running background service.', dataSettings);

    const { backgroundJobInterval } = dataSettings;

    if (bgInterval) {
        clearInterval(bgInterval);
    }

    bgInterval = setInterval(() => runAll(dataSettings), backgroundJobInterval * 1000);

    // Run screenshot job every 5 minutes (300 seconds)
    //screenshotInterval = setInterval(runScreenshotJob, 300 * 1000);
}
