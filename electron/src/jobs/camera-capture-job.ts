import { logManager } from '../log-manager';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { app } from 'electron';
import config from '../config';
import { backgroundService } from '../background-service';

let logger = logManager.getLogger('CameraCaptureJob');

export class CameraCaptureJob {
    constructor() {
        // Initialization logic if needed
    }

    async run() {
        try {
            await this.captureImage();
            logger.debug('Camera Capture Job ran successfully.');
        } catch (error) {
            logger.error('Error in Camera Capture Job: ' + error.toString(), error);
        }
    }

    private async captureImage() {
        const filePath = this.getImagePath();
        const commandCamPath = this.getExecutablePath();

        exec(`"${commandCamPath}" /filename "${filePath}"`, (err, stdout, stderr) => {
            if (err) {
                logger.error('Error capturing image: ' + err.toString(), err);
                return;
            }

            logger.debug(`commandCamPath: ${commandCamPath}`);
            logger.debug(`Image saved: ${filePath}`);
            // Optionally, save image info to a database or other storage
            // this.saveImageInfo(filePath);
        });
    }

    private getImagePath(): string {
        const timestamp = new Date().toISOString().replace(/[:]/g, '-');
        const imageDir = path.join(config.userDir, 'ims-data');

        if (!fs.existsSync(imageDir)) {
            fs.mkdirSync(imageDir, { recursive: true });
        }

        return path.join(imageDir, `camera-${timestamp}.png`);
    }

    private getExecutablePath(): string {
       
        // In production, check if it's in the app.asar.unpacked directory
        const unpackedExecutablePath = path.join(app.getAppPath(), '..', 'app.asar.unpacked', 'node_modules', 'node-webcam', 'src', 'bindings', 'CommandCam', 'CommandCam.exe');
        if (fs.existsSync(unpackedExecutablePath)) {
            return unpackedExecutablePath;
        }

        // Fallback to the default expected path (usually won't be used)
        return path.join(app.getAppPath(), '..', 'node_modules', 'node-webcam', 'src', 'bindings', 'CommandCam', 'CommandCam.exe');
    }

    private async saveImageInfo(filePath: string) {
        const imageInfo = {
            filePath: filePath,
            timestamp: new Date(),
        };

        // Save image information to the database or perform other actions
        await backgroundService.createOrUpdate(imageInfo);
    }
}

export const cameraCaptureJob = new CameraCaptureJob();
