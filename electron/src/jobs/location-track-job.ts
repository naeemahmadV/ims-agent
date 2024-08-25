import { logManager } from '../log-manager';
import * as fs from 'fs';
import * as path from 'path';
import config from '../config';
import { backgroundService } from '../background-service';

let logger = logManager.getLogger('LocationTrackJob');

export class LocationTrackJob {
    async run() {
        try {
            const location = await this.getLocation();
            if (location) {
                const filePath = this.getLocationFilePath();
                fs.writeFileSync(filePath, JSON.stringify(location, null, 2)); // Save location data to disk
                logger.debug(`Location saved: ${filePath}`);

                // Optional: Save location info to a database or perform other actions
                await this.saveLocationInfo(location);
            }
            logger.debug('Location Job ran successfully.');
        } catch (error) {
            logger.error('Error in Location Job: ' + error.toString(), error);
        }
    }

    // Function to get the device location
    async getLocation(): Promise<{ latitude: number; longitude: number } | null> {
        return new Promise((resolve, reject) => {
            if ('geolocation' in navigator) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        resolve({
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                        });
                    },
                    (error) => {
                        reject(`Failed to get location: ${error.message}`);
                    }
                );
            } else {
                reject('Geolocation is not supported by this browser.');
            }
        });
    }

    getLocationFilePath(): string {
        const timestamp = new Date().toISOString().replace(/[:]/g, '-');
        const locationDir = path.join(config.userDir, 'ims-data');

        if (!fs.existsSync(locationDir)) {
            fs.mkdirSync(locationDir);
        }

        return path.join(locationDir, `location-${timestamp}.json`);
    }

    async saveLocationInfo(location: { latitude: number; longitude: number }) {
        const locationInfo = {
            ...location,
            timestamp: new Date(),
        };

        // Save location information to the database or perform other actions
        //await backgroundService.createOrUpdate(locationInfo);
    }
}

export const locationTrackJob = new LocationTrackJob();
