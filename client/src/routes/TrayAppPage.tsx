import React, { useEffect, useState, useCallback, memo } from 'react';
import randomcolor from 'randomcolor';
import { TimelineItemEdit } from '../components/Timeline/TimelineItemEdit';
import { TrayLayout } from '../components/TrayLayout/TrayLayout';
import { TrayList } from '../components/TrayList/TrayList';
import { EventEmitter } from '../services/EventEmitter';
import { getRunningLogItem } from '../services/settings.api';
import { startNewLogItem, findFirstLogItems, stopRunningLogItem } from '../services/trackItem.api';
import { Logger } from '../logger';
import { useWindowFocused } from '../hooks/windowFocusedHook';
import { throttle } from 'lodash';
import deepEqual from 'fast-deep-equal/es6';
import { analytics } from '../analytics';
import { Box } from '@chakra-ui/layout';
import { Divider } from '@chakra-ui/react';
import { ITrackItem } from '../@types/ITrackItem';
import { OnlineChart } from '../components/TrayLayout/OnlineChart';
import { useStoreActions, useStoreState } from '../store/easyPeasy';
import { useInterval } from '../hooks/intervalHook';

const EMPTY_SELECTED_ITEM = {};

const EMPTY_ARRAY = [];
const BG_SYNC_DELAY_MS = 10000;

const TrayAppPageTemp = () => {
    const fetchTimerange = useStoreActions(actions => actions.fetchTimerange);
    const bgSyncInterval = useStoreActions(actions => actions.bgSyncInterval);

    useInterval(() => {
        bgSyncInterval();
    }, [BG_SYNC_DELAY_MS]);

    useEffect(() => {
        fetchTimerange();
    }, [fetchTimerange]);

    const [loading, setLoading] = useState(true);

    const [selectedItem, setSelectedItem] = useState(EMPTY_SELECTED_ITEM);
    const [runningLogItem, setRunningLogItem] = useState<any>();
    const [lastLogItems, setLastLogItems] = useState<ITrackItem[]>(EMPTY_ARRAY);

    const { windowIsActive } = useWindowFocused();

    const loadLastLogItems = async () => {
        setLoading(true);
        try {
            const items = await findFirstLogItems();
            const areEqual = deepEqual(items, lastLogItems);

            if (!areEqual) {
                console.info('setLastLogItems', items);
                setLastLogItems(items);
            }
        } catch (e) {
            Logger.error('Error  loading first last items', e);
        }
        setLoading(false);
    };

    const loadLastLogItemsThrottled = throttle(loadLastLogItems, 1000);

    useEffect(() => {
        if (windowIsActive) {
            Logger.debug('Window active:', windowIsActive);
            setSelectedItem(s => ({ ...s, color: randomcolor() }));
            // loadLastLogItemsThrottled();
            analytics.track('trayOpened', { version: process.env.REACT_APP_VERSION });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [windowIsActive]);

    useEffect(() => {
        const eventLogItemStarted = (_, logItem) => {
            const newItem: ITrackItem = JSON.parse(logItem);
            Logger.debug('log-trackItem-started:', newItem);
            setRunningLogItem(newItem);
            setLastLogItems(items => [...items, newItem]);
        };

        EventEmitter.on('log-item-started', eventLogItemStarted);

        return () => {
            EventEmitter.off('log-item-started', eventLogItemStarted);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        // loadLastLogItemsThrottled();
        loadLastLogItems();
        getRunningLogItem().then(logItem => {
            setRunningLogItem(logItem);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const startNewLogItemEvent = useCallback((trackItem: any, colorScope: any) => {
        startNewLogItem(trackItem);
        loadLastLogItemsThrottled();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const stopRunningLogItemEvent = useCallback(
        (trackItem: any, colorScope: any) => {
            if (runningLogItem) {
                stopRunningLogItem(runningLogItem.id);
                loadLastLogItemsThrottled();
                setRunningLogItem(null);
            } else {
                Logger.error('No running log trackItem to stop');
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [runningLogItem, setRunningLogItem],
    );

    const timeItems = useStoreState(state => state.timeItems);
    const { statusItems } = timeItems;
    return (
        <TrayLayout>
            <Box p={4}>
                <TimelineItemEdit
                    selectedTimelineItem={selectedItem}
                    trayEdit
                    saveTimelineItem={startNewLogItem}
                />
            </Box>
            <Box px={4} pb={4}>
                <OnlineChart items={statusItems} />
            </Box>
            <Divider borderColor="gray.200" />
            <TrayList
                lastLogItems={lastLogItems}
                runningLogItem={runningLogItem}
                stopRunningLogItem={stopRunningLogItemEvent}
                startNewLogItem={startNewLogItemEvent}
                loading={loading}
            />
        </TrayLayout>
    );
};

TrayAppPageTemp.whyDidYouRender = true;

export const TrayAppPage = memo(TrayAppPageTemp);
