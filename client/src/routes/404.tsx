import React from 'react';
import { Logger } from '../logger';

export const NotFound = () => {
    Logger.error('404 Not Found');
    return <div>IMSAgent Error: 404 Not Found</div>;
};
