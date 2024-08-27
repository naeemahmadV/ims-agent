import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

const FormData = require('form-data');

const API_ENDPOINT = 'http://localhost:5103/api/FileUpload/upload';
const API_KEY = 'pass@123';

export class FileUploadJob {
    private isUploading = false;

    async run() {
        try {
            this.startUploadInterval();
            console.log('FileUploadJob started successfully.');
        } catch (error) {
            console.error('Error in FileUploadJob: ', error);
        }
    }

    private async startUploadInterval() {
        if (!this.isUploading) {
            this.isUploading = true;
            await this.uploadFiles();
            this.isUploading = false;
        }
    }
    

    private async uploadFiles(): Promise<void> {
        console.log('Checking files for upload...');
        const directoryPath = path.join(app.getPath('userData'), 'ims-data');

        if (!fs.existsSync(directoryPath)) {
            console.warn(`Directory does not exist: ${directoryPath}`);
            return;
        }

        const files = fs.readdirSync(directoryPath);
        if (files.length === 0) {
            console.log('No files to upload.');
            return;
        }

        for (const file of files) {
            const filePath = path.join(directoryPath, file);
            try {
                const fileType = path.extname(file).toLowerCase().substring(1); // 'json' or 'xml'

                const formData = new FormData();
                formData.append('file', fs.createReadStream(filePath));
                formData.append('fileType', fileType);

                // Adding the API key to the form data for verification
                formData.append('apiKey', API_KEY);

                const response = await axios.post(API_ENDPOINT, formData, {
                    headers: {
                        ...formData.getHeaders(),
                        'Authorization': `Bearer ${API_KEY}`,
                    },
                });

                if (response.data.success) {
                    console.log(`File uploaded successfully: ${file}`);
                    fs.unlinkSync(filePath); // Optionally delete the file
                } else {
                    console.error(`Failed to upload file: ${file}`);
                }
            } catch (error) {
                console.error(`Error uploading file: ${filePath}`, error);
            }
        }
    }
}

export const fileUploadJob = new FileUploadJob();
