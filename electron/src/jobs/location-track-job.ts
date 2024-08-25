import axios from 'axios'; // Make sure to install axios with `npm install axios`
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

// Replace 'your_ipinfo_api_key' with your actual IPinfo API key
const IPINFO_API_KEY = 'your_ipinfo_api_key'; 

export class LocationTrackJob {
    async run() {
        try {
            const location = await this.getLocation();
            if (location) {
                const filePath = this.getLocationPath();
                fs.writeFileSync(filePath, JSON.stringify(location, null, 2)); // Save location data to disk
                console.log(`Location saved: ${filePath}`);
            }

            console.log('Location Job ran successfully.');
        } catch (error) {
            console.error('Error in Location Job: ' + error.toString(), error);
        }
    }

    private async getLocation(): Promise<any | null> {
        try {
            const response = await axios.get(`https://ipinfo.io/json`);
            return response.data;
        } catch (error) {
            console.error('Error fetching location data:', error);
            throw new Error('Failed to get location data');
        }
    }

    private getLocationPath(): string {
        const timestamp = new Date().toISOString().replace(/[:]/g, '-');
        const locationDir = path.join(app.getPath('userData'), 'ims-data');

        if (!fs.existsSync(locationDir)) {
            fs.mkdirSync(locationDir, { recursive: true });
        }

        return path.join(locationDir, `location-${timestamp}.json`);
    }
}

export const locationTrackJob = new LocationTrackJob();
